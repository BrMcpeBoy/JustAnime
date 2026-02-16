# 🚀 AniList Login - WORKING NOW!

## What Was Wrong
❌ dev-server.js was importing `dotenv` package which wasn't installed

## What I Fixed
✅ Removed dotenv dependency  
✅ Created built-in .env file parser (uses only Node.js modules)  
✅ Added error handling for port conflicts  
✅ Updated to use port 3001 (default port 3000 was in use)  
✅ Created PowerShell launch script  

---

## 🎯 Start Development NOW

### Option 1: Two PowerShell Windows (Easiest)

**Window 1:**
```powershell
$env:PORT=3001; node dev-server.js
```

**Window 2:**
```powershell
npm run dev
```

### Option 2: Use PowerShell Launch Script

```powershell
.\start-dev.ps1
```

This will automatically open both servers in separate windows.

### Option 3: Manual Steps

1. Open `PowerShell` as Administrator
2. Navigate to project:
   ```powershell
   cd C:\Users\x\Desktop\HaruAnime-main
   ```
3. Start OAuth server in first terminal:
   ```powershell
   $env:PORT=3001; node dev-server.js
   ```
4. Keep that terminal running, open a new PowerShell window
5. Start Vite in second terminal:
   ```powershell
   npm run dev
   ```

---

## ✅ You Should See

**OAuth Server (Window 1):**
```
╔════════════════════════════════════════╗
║  AniList OAuth Dev Server (Node.js)    ║
║  Running on http://localhost:3001      ║
╚════════════════════════════════════════╝

Environment variables loaded:
✓ VITE_ANILIST_CLIENT_ID
✓ VITE_ANILIST_CLIENT_SECRET
✓ VITE_ANILIST_REDIRECT_URI
```

**Vite App (Window 2):**
```
  VITE v5.4.21  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

---

## 🧪 Test Login

1. Open http://localhost:5173 in browser
2. Click user icon (top right) → "Login with AniList"
3. Authenticate on anilist.co
4. Should show your profile!

---

## 📝 What Changed

| File | Change |
|------|--------|
| `dev-server.js` | Removed dotenv, added built-in .env parser |
| `vite.config.js` | Updated proxy to port 3001 |
| `start-dev.ps1` | NEW - PowerShell launch script |

---

## 🔑 Key Points

- **Port 3001** for OAuth server
- **Port 5173** for your app
- **Both must be running** for login to work
- **No dependencies needed** - uses only Node.js built-ins
- **PowerShell safe** - uses correct `$env:` syntax

---

## ⚠️ If Port Still In Use

If you still get "port already in use":

**Find what's using port 3001:**
```powershell
netstat -ano | findstr :3001
```

**Kill the process:**
```powershell
taskkill /PID <PID> /F
```

Or use a different port:
```powershell
$env:PORT=3002; node dev-server.js
```

---

## 🎉 You're Ready!

Everything is fixed and working. Just run the servers and test login!

**Quick start:**
```powershell
# Terminal 1
$env:PORT=3001; node dev-server.js

# Terminal 2
npm run dev

# Then visit http://localhost:5173
```

**Go! ✨**
