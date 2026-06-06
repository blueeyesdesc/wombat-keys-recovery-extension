# Wombat Key Recovery

Get your crypto keys back from your old **Wombat Wallet** account — even though the
app and its support are gone.

If you still see your accounts on-chain but can't get into Wombat anymore, this tool
recovers the private keys for your **WAX, EOS, Telos, Ethereum (and other EVM)**
accounts so you can import them into another wallet.

It works for accounts created with **Google, Twitter/X, or Apple** login, and for
accounts that have **2FA** turned on.

---

## Is this safe?

- It runs **entirely in your browser, on your own computer.**
- Your keys are decrypted **locally** and never sent anywhere.
- You log in **on Wombat's own site** — this tool never sees your password.
- The code is open — anyone can read exactly what it does.

> ⚠️ Your private keys are the full control of your funds. Never share them, never
> paste them into any website, and after recovering them, if you think your keys are compromised, move your assets to a new
> wallet you create yourself.

---

## How to install (about 2 minutes)

You'll load this as an "unpacked" extension in Chrome (or Brave/Edge).

1. **Download this project**
   Click the green **Code** button on GitHub → **Download ZIP** → unzip it somewhere
   you'll remember. the unzipped folder 'wombat-recover2'.

2. **Load the extension in your browser**
   - Go to `chrome://extensions`
   - Turn on **Developer mode** (top-right toggle OR bottom left, depend on the browser)
   - Click **Load unpacked**
   - Select the project folder (wombat-recover2)

That's it — the extension is installed.

---

## How to use

1. Go to **https://backup.getwombat.io** and **log in** the same way you signed up in wombat app
   (Google, Twitter/X, or Apple).

2. A small **"Wombat Key Recovery"** box appears in the bottom-right corner.

3. If your account used **2FA**, type your current 6-digit code into the box.
   (No 2FA? Just skip this.)

4. Click **Recover my keys**.
   - A Google popup may ask for permission to read your backup file — allow it.
   - Your keys appear in the box, one line per chain.

5. Click **Download keys & wipe** to save them and clear them from the page.

---

## What you get, and where to use it

| Chain | Key format | Import into |
|-------|-----------|-------------|
| WAX, EOS, Telos | `5...` (private_key) | Anchor, Wax Cloud Wallet, or any Antelope wallet |
| Ethereum / Polygon / other EVM | `0x...` | MetaMask (the same key works on all EVM chains) |

A ✔ next to a key means it was verified against your real on-chain account.

---

## After you recover your keys

Your keys are yours again — what you do next is up to you. Do your own research on how
to store and use them safely.

---

## Troubleshooting

- **"Please sign in first"** — make sure you're logged in on backup.getwombat.io in
  the same tab, then click again.
- **Google popup blocked** — allow popups for backup.getwombat.io and retry.
- **A chain is missing** — that just means your account has no wallet on that chain.
- **2FA code rejected** — make sure it's the current code from your authenticator,
  then retry quickly (codes expire every 30 seconds).
- **Ethereum shows the key but no address** — the key is still correct and importable;
  the address is only shown for verification.

---

## Important notes

- This is a community tool, **not affiliated with Wombat** or its creators.
- It only works while Wombat's backup servers remain online — recover sooner rather
  than later.
- Use it only on **your own account.** It is built to only ever touch the session of
  the person using it, on their own device.

---

## Author & community

- GitHub: **blueeyesdesc**
- Discord: **https://discord.gg/FwbaTW53hD**

---

## Disclaimer

This tool is provided **as-is, with no warranty of any kind**. You use it at your own
risk, and you are responsible for doing your own research before using it.

The **only official source** for this tool is the GitHub account **blueeyesdesc**.
Any copy of this extension downloaded from any other repository, website, or source is
**not mine**, may have been altered, and I take **no responsibility** for it or for any
loss resulting from its use. If you didn't get it from **blueeyesdesc**, do not trust it.
