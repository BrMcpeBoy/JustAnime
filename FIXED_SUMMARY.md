# ✅ FIXED - AniList Login "Token Exchange Failed"

## The Error
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'dotenv'
```

## What Was Wrong
The `dev-server.js` file was trying to import the `dotenv` package which wasn't installed.

## What I Fixed

### ✅ 1. Removed dotenv Dependency
- Removed `import dotenv from 'dotenv'`
- Created a built-in `.env` file parser using only Node.js modules
- No new dependencies needed!

### ✅ 2. Used Node.js Built-in Modules Only
```javascript
import http from 'http';      // Built-in
import fs from 'fs';           // Built-in
import path from 'path';       // Built-in
import { fileURLToPath } from 'url'; // Built-in
```

### ✅ 3. Custom .env Parser
```javascript
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  // Reads .env file manually, no dependencies
  // Parses KEY=VALUE format
  // Merges with process.env
}
```

### ✅ 4. Fixed Port Configuration
- Made PORT configurable via environment variable
- Updated vite.config.js to use port 3001
- Added error handling for port conflicts

### ✅ 5. PowerShell Compatible
- Used `$env:PORT=3001` syntax for PowerShell
- Created `start-dev.ps1` launch script
- Works seamlessly on Windows

---

## 🚀 How to Use

### Option 1: Two Terminals

**Terminal 1 - OAuth Server:**
```powershell
$env:PORT=3001; node dev-server.js
```

Expected output:
```
╔════════════════════════════════════════╗
║  AniList OAuth Dev Server (Node.js)    ║
║  Running on http://localhost:3001      ║
╚════════════════════════════════════════╝

✓ VITE_ANILIST_CLIENT_ID
✓ VITE_ANILIST_CLIENT_SECRET
✓ VITE_ANILIST_REDIRECT_URI
```

**Terminal 2 - Vite App:**
```powershell
npm run dev
```

Expected output:
```
Local: http://localhost:5173
```

### Option 2: Launch Script

```powershell
.\start-dev.ps1
```

Automatically opens both servers in new PowerShell windows.

---

## ✅ Test It Works

1. Both servers running (see expected output above)
2. Open http://localhost:5173
3. Click user icon → "Login with AniList"
4. Authenticate on anilist.co
5. Redirected back with profile showing
6. Check Terminal 1 for "Token exchange successful"

---

## 📊 Architecture

```
Browser (http://localhost:5173)
        ↓
      Vite (port 5173)
        ↓
  Vite Proxy Config
  (intercepts /api/auth/anilist-token)
        ↓
  OAuth Dev Server (port 3001)
        ↓
  AniList API
        ↓
  Token returned (CORS-safe!)
```

---

## 📁 Files Modified

### dev-server.js (Fixed)
- ✅ Removed dotenv import
- ✅ Added custom .env parser using fs module
- ✅ Fixed all process.env references to use `env` object
- ✅ Added PORT environment variable support
- ✅ Added error handling for EADDRINUSE

### vite.config.js (Updated)
- ✅ Updated proxy target from localhost:3000 → localhost:3001

### start-dev.ps1 (New)
- ✅ PowerShell launch script for convenience
- ✅ Opens both servers in separate windows

### QUICK_START_FIXED.md (New)
- ✅ Updated quick start guide

---

## 🎯 Key Improvements

| Before | After |
|--------|-------|
| ❌ Missing dotenv package | ✅ No external dependencies |
| ❌ Would fail on import | ✅ Pure Node.js only |
| ❌ Port 3000 conflicts | ✅ Configurable, uses 3001 |
| ❌ No Windows support | ✅ Full PowerShell support |
| ❌ Manual terminal setup | ✅ Launch script available |

---

## 🔧 Technical Details

### How the .env Parser Works

1. **Reads .env file** using fs.readFileSync()
2. **Splits by newlines** and iterates each line
3. **Skips empty lines and comments** (lines starting with #)
4. **Parses KEY=VALUE** format
5. **Handles edge cases** like values containing '='
6. **Merges with process.env** (process.env takes priority)

### Port Configuration

```javascript
const PORT = process.env.PORT || env.PORT || 3001;
```

Priority:
1. process.env.PORT (highest - can set via `$env:PORT=3001`)
2. env.PORT (from .env file)
3. 3001 (default)

### Error Handling

Added server error handler:
```javascript
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use!`);
    // Helpful error message
  }
});
```

---

## ✨ Result

Everything works now! No dependencies, pure Node.js, Windows-compatible.

---

## 📋 Checklist

- [x] Removed dotenv dependency
- [x] Created custom .env parser
- [x] Fixed all environment variable references
- [x] Added port configuration
- [x] Updated vite.config.js proxy
- [x] Added error handling
- [x] Created PowerShell launch script
- [x] Updated documentation
- [x] Tested dev server
- [x] Verified all env vars load correctly

---

## 🚀 Ready to Use!

```powershell
# Terminal 1
$env:PORT=3001; node dev-server.js

# Terminal 2  
npm run dev

# Browser
http://localhost:5173
```

Login should work perfectly now! ✨
