# Laughingfox WhatsApp Bot

A WhatsApp bot built with Baileys, ready to deploy on Render, Vercel, or Koyeb. Brought to your by `lance`

---
## SETUP

Make sure to get creds file and upload to mega then remove the url part and leave the hash and tht just attach it in config.json file where it says `sypher™-- + hash` the hash is always the string at the end of your mega download url after the last sing forward slash `/`

---

## 🚀 Deployment Guide

### 1. **Clone the Repository**

```bash
git clone https://github.com/lance-ui/Laughingfox.git
cd Laughingfox
```

---

### 2. **Install Dependencies**

```bash
npm install
```

---

### 3. **Deploy to Render, Vercel, or Koyeb**

#### **Render**
- Create a new Web Service.
- Connect your GitHub repo.
- Set the build command:  
  ```
  npm install
  ```
- Set the start command:  
  ```
  npm start
  ```

#### **Vercel**
- Vercel is best for serverless APIs. For persistent bots, use [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) or deploy as a serverless function.
- Connect your repo and set build/start commands as above.

#### **Koyeb**
- Create a new App.
- Select your GitHub repo.
- Set the build and start commands.

---

### 4. **Start the Bot Locally (for testing)**

```bash
npm start
```

---

## 📄 Notes

- Make sure your bot session is valid and WhatsApp Web is not logged out.
- Check the logs on your deployment platform for errors.

---

## ⚠️ Disclaimer

This bot is **not affiliated with WhatsApp Inc. in any way**.  
Using third-party bots may violate WhatsApp's Terms of Service.  
Your account may be subjected to bans if misused.  
**Use at your own risk.**

---

## 🛠️ Support

For issues, open an issue on GitHub or contact the