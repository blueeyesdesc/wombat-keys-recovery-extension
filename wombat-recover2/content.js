"use strict";

const API = "https://api.getwombat.io/v2";
const FB_API_KEY = "AIzaSyDNeEvzxKpByqsLGKjukRzmfQZTZn7LmBI";

function readIdTokenFromIDB(){
  return new Promise((resolve, reject)=>{
    const open = indexedDB.open("firebaseLocalStorageDb");
    open.onerror = ()=>reject(new Error("Can't open firebaseLocalStorageDb (are you logged in?)"));
    open.onsuccess = ()=>{
      const db = open.result;
      let store;
      try { store = db.transaction("firebaseLocalStorage","readonly").objectStore("firebaseLocalStorage"); }
      catch(e){ return reject(new Error("firebaseLocalStorage store not found — log in first.")); }
      const all = store.getAll();
      all.onsuccess = ()=>{
        const rows = all.result || [];
        for(const row of rows){
          const v = row && row.value;
          const tok = v && v.stsTokenManager && (v.stsTokenManager.accessToken);
          if(tok) return resolve({ idToken: tok, uid: v.uid, email: v.email,
            expires: v.stsTokenManager.expirationTime });
        }
        reject(new Error("No logged-in Firebase user found. Please sign in on this page first."));
      };
      all.onerror = ()=>reject(new Error("Failed reading firebaseLocalStorage."));
    };
  });
}

const b64ToBytes = b64 => { const s=atob(b64.trim()); const u=new Uint8Array(s.length);
  for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u; };
const hexOf = u => Array.from(u).map(b=>b.toString(16).padStart(2,"0")).join("");
async function decryptWithToken(tokenBytes, dataBytes){
  const key = await crypto.subtle.importKey("raw", tokenBytes, {name:"AES-GCM"}, false, ["decrypt"]);
  return new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM", iv:dataBytes.slice(0,12)}, key, dataBytes.slice(12)));
}
function antelopeKey(u8){
  const hex=hexOf(u8), PK=window.eosjs_ecc && window.eosjs_ecc.PrivateKey;
  if(!PK) throw new Error("eosjs-ecc not loaded");
  if(typeof PK.fromHex==="function"){ try{ return PK.fromHex(hex); }catch(_){} }
  const B=(window.eosjs_ecc.Buffer)||(window.buffer&&window.buffer.Buffer);
  if(B&&PK.fromBuffer) return PK.fromBuffer(B.from(hex,"hex"));
  throw new Error("no PrivateKey constructor");
}
function apiGet(path, idToken, mfa){
  const headers={ Authorization:"Bearer "+idToken, "Version":"20200916" };
  if(mfa) headers["X-Wombat-MFA"]=mfa;
  return fetch(API+path,{headers});
}

async function fetchDriveToken(fileName){
  const redirect = location.protocol + "//" + location.host;  
  const url = "https://accounts.google.com/o/oauth2/auth"
    + "?client_id=240189699482-rtdfs1ack6p0md4t9mq221shu5092qej.apps.googleusercontent.com"
    + "&redirect_uri=" + encodeURIComponent(redirect)
    + "&response_type=token&scope=" + encodeURIComponent("https://www.googleapis.com/auth/drive.appdata")
    + "&state=GOOGLE_DRIVE";
  const at = await popupForToken(url, redirect);
  const q = encodeURIComponent("name='"+fileName+"'");
  let list = await (await fetch("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q="+q+"&fields=files(id,name,size)",
    {headers:{Authorization:"Bearer "+at}})).json();
  if(!list.files||!list.files.length){
    list = await (await fetch("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,size)&pageSize=1000",
      {headers:{Authorization:"Bearer "+at}})).json();
  }
  const files=list.files||[];
  const f = files.find(x=>+x.size===32) || files.find(x=>x.name===fileName) || files[0];
  if(!f) throw new Error("Backup token file not found in your Drive appDataFolder.");
  const buf = await (await fetch("https://www.googleapis.com/drive/v3/files/"+f.id+"?alt=media",
    {headers:{Authorization:"Bearer "+at}})).arrayBuffer();
  return new Uint8Array(buf);
}
function popupForToken(url, redirect){
  return new Promise((resolve,reject)=>{
    const w = window.open(url,"wombat_drive","width=480,height=640");
    if(!w) return reject(new Error("Popup blocked — allow popups for this site and retry."));
    const timer = setInterval(()=>{
      try{
        if(w.closed){ clearInterval(timer); return reject(new Error("Drive popup closed.")); }
        const href = w.location.href;
        if(href.indexOf("access_token=") !== -1 && href.indexOf(location.host) !== -1){
          const hash = href.includes("#") ? href.slice(href.indexOf("#")+1) : "";
          const at = new URLSearchParams(hash).get("access_token");
          clearInterval(timer); w.close();
          at ? resolve(at) : reject(new Error("No Drive access token in redirect."));
        }
      }catch(_){ /* cross-origin until redirect lands on our origin */ }
    }, 400);
  });
}

function panel(){
  if(document.getElementById("wkr-panel")) return;
  const d = document.createElement("div");
  d.id="wkr-panel";
  d.style.cssText="position:fixed;right:16px;bottom:16px;z-index:2147483647;width:340px;font:13px system-ui,sans-serif;background:#161b22;color:#e6edf3;border:1px solid #2a3340;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.5);padding:16px";
  d.innerHTML = `
    <div style="font-weight:700;margin-bottom:4px">🔑 Wombat Key Recovery</div>
    <div style="color:#8b97a6;font-size:11.5px;margin-bottom:10px">Log in above first (X / Apple / Google). Then recover your keys here. Everything stays on your device.</div>
    <input id="wkr-mfa" placeholder="2FA code (only if you set one)" style="width:100%;margin-bottom:8px;background:#0c1014;border:1px solid #2a3340;color:#e6edf3;border-radius:7px;padding:9px;font-family:monospace">
    <button id="wkr-go" style="width:100%;background:#3fb950;color:#06210d;border:0;padding:10px;border-radius:7px;font-weight:600;cursor:pointer">Recover my keys</button>
    <pre id="wkr-out" style="white-space:pre-wrap;word-break:break-all;background:#0a0d11;border:1px solid #2a3340;border-radius:7px;padding:9px;margin-top:10px;max-height:240px;overflow:auto;font-size:11px;color:#8b97a6">Ready.</pre>
    <button id="wkr-dl" style="display:none;width:100%;margin-top:8px;background:#1c232d;color:#e6edf3;border:1px solid #2a3340;padding:9px;border-radius:7px;cursor:pointer">Download keys & wipe</button>`;
  document.body.appendChild(d);
  document.getElementById("wkr-go").addEventListener("click", run);
}
const out = ()=>document.getElementById("wkr-out");
const log = (...a)=>{ const o=out(); o.textContent += "\n"+a.join(" "); o.scrollTop=o.scrollHeight; };

let RESULTS=null;
async function run(){
  out().textContent="Starting…";
  try{
    const { idToken, email } = await readIdTokenFromIDB();
    log("Logged in as", email||"(account)");
    const ar = await apiGet("/account", idToken);
    if(ar.status!==200) throw new Error("/account "+ar.status+" — try logging in again.");
    const acct = await ar.json();
    const loc = acct.backup && acct.backup.locations && acct.backup.locations[0];
    log("MFA:", acct.isMFAActive, "| backup:", loc?loc.type:"none");

    let tokenBytes;
    if(loc && loc.type==="GOOGLE_DRIVE"){ log("Fetching Drive backup token…"); tokenBytes = await fetchDriveToken(loc.fileName); }
    else if(loc && loc.type==="DROPBOX"){ throw new Error("Dropbox backup — paste-token mode needed (tell the developer)."); }
    else throw new Error("No backup location on this account.");
    log("Backup token:", tokenBytes.length, "bytes");

    const mfa = acct.isMFAActive ? (document.getElementById("wkr-mfa").value.trim()) : null;
    if(acct.isMFAActive && !mfa){ log("This account has 2FA — enter your code and retry."); return; }


    let wallet = acct.wallet;
    if(acct.isMFAActive){
      const kr = await apiGet("/account", idToken, mfa);
      log("re-fetch with 2FA:", kr.status);
      if(kr.status===403) throw new Error("2FA code rejected — check it and retry.");
      if(kr.status!==200) throw new Error("account refetch "+kr.status);
      wallet = (await kr.json()).wallet;
    }

    const items = [];
    for(const chain of Object.keys(wallet||{})){
      for(const entry of (wallet[chain]||[])) items.push({ chain, entry });
    }
    if(!items.length) throw new Error("No wallet entries found on this account.");
    log("chains with accounts:", items.map(i=>i.chain).join(", "));

    const rows=[];
    for(const {chain, entry} of items){
      const r={ chain, account: entry.accountName||"", pub: entry.publicKey||entry.address||"" };
      try{
        if(entry.encryptedPrivateKey==null){ r.error="null (needs 2FA?)"; rows.push(r); continue; }
        const pt=await decryptWithToken(tokenBytes, b64ToBytes(entry.encryptedPrivateKey));
        const hex=hexOf(pt);
        if(/ethereum|polygon|bsc|evm|avax|arbitrum|optimism|base|fantom|cronos|matic/i.test(chain) || entry.address){
          r.import = "0x"+hex;
          try{
            if(window.ethers && window.ethers.Wallet) r.derived = new window.ethers.Wallet("0x"+hex).address;
            else if(window.ethers && window.ethers.computeAddress) r.derived = window.ethers.computeAddress("0x"+hex);
            else r.note = "ethers not loaded — key is correct, address not auto-derived";
          }catch(e){ r.note = "address derive skipped: "+e.message; }
        } else {
          const pk=antelopeKey(pt); r.import=pk.toWif(); r.derived=pk.toPublic().toString();
        }
        if(r.pub && r.derived){ r.match = r.pub.replace(/^0x/,'').toLowerCase()===r.derived.replace(/^0x/,'').toLowerCase(); }
      }catch(e){ r.error="decrypt failed: "+e.message; }
      rows.push(r);
    }
    RESULTS=rows;
    log("\n=== KEYS (keep private) ===");
    rows.forEach(r=> log(`${r.chain}: ${r.error?("⚠ "+r.error):(r.import+(r.match===true?"  ✔":r.match===false?"  ✖":"")+(r.note?("  ("+r.note+")"):""))}`));
    const dl=document.getElementById("wkr-dl"); dl.style.display="block"; dl.onclick=download;
  }catch(e){ log("ERROR:", e.message); }
}
function download(){
  const data = RESULTS.map(r=>({chain:r.chain,account:r.account,publicKey:r.pub,privateKey:r.error?null:r.import,verified:r.match??null}));
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  const a=document.createElement("a"); a.href=url; a.download="wombat-keys.json"; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  RESULTS=null; out().textContent="✅ Downloaded & wiped. made by blueeyesdesc.";
  document.getElementById("wkr-dl").style.display="none";
}

panel();