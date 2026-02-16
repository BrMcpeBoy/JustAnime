# 🎯 SOLUTION - AniList Login "Token Exchange Failed"

## The Error You Got
```
Login failed: Token exchange failed. Make sure: 
1) Backend endpoint api/auth/anilist-token.js exists, 
2) Your .env has correct VITE_ANILIST_* variables, 
3) Your redirect URI matches AniList app settings
```

## Root Cause
For **localhost development**, you need:
1. ✅ .env with OAuth credentials (you have this)
2. ✅ backend endpoint (you have the code)
3. ❌ **Running server to handle the endpoint** (YOU WERE MISSING THIS)

The `api/auth/anilist-token.js` is for Vercel production only. Your local Vite dev server can't execute Node.js code.

---

## ✅ The Fix

I've created a **Node.js development server** that:
- Runs on port 3000 (separate from Vite)
- Handles OAuth token exchange
- Uses only built-in Node.js modules (no extra dependencies!)
- Works with Vite's proxy configuration

---

## 🚀 How to Use (3 Steps)

### Step 1: Verify .env File
Make sure `c:\Users\x\Desktop\HaruAnime-main\.env` has:
```
VITE_ANILIST_CLIENT_ID=33008
VITE_ANILIST_CLIENT_SECRET=AtTpfdhuZBJ081lm1ixQAAl06QJFLY8BFIFkuRzb
VITE_ANILIST_REDIRECT_URI=http://localhost:5173/page/auth/login
```

### Step 2: Start Dev Server (First Terminal)
```bash
cd c:\Users\x\Desktop\HaruAnime-main
node dev-server.js
```

**Expected output:**
```
╔════════════════════════════════════════╗
║  AniList OAuth Dev Server (Node.js)    ║
║  Running on http://localhost:3000      ║
╚════════════════════════════════════════╝

Environment variables loaded:
✓ VITE_ANILIST_CLIENT_ID
✓ VITE_ANILIST_CLIENT_SECRET
✓ VITE_ANILIST_REDIRECT_URI
```

**KEEP THIS TERMINAL RUNNING**

### Step 3: Start Vite App (Second Terminal)
```bash
npm run dev
```

**Expected output:**
```
Local: http://localhost:5173
```

---

## ✅ Test It Works

1. Open http://localhost:5173 in browser
2. Click the user icon (top right)
3. Click "Login with AniList"
4. Authenticate on anilist.co
5. Redirected back to your app with profile showing

**Check Terminal 1 (dev-server) for:**
```
Token exchange successful
```

---

## 📊 How It Works

```
LOGIN FLOW:

1. Browser → http://localhost:5173/page/auth/login?code=ABC123
2. Login.jsx tries to POST to: /api/auth/anilist-token
3. Vite proxy intercepts request
4. Redirects to: http://localhost:3000/api/auth/anilist-token
5. dev-server.js receives request
6. dev-server.js contacts AniList API
7. Exchanges code for token (no CORS issues!)
8. Returns token to browser
9. Browser gets token, fetches user profile
10. Login successful! ✅

The key: OAuth token exchange happens server-to-server (localhost:3000)
instead of browser-to-AniList (blocked by CORS)
```

---

## 📁 What Changed

### New Files
- `dev-server.js` - OAuth dev server (161 lines)
- `START_HERE_DEV.md` - Quick start guide
- `ANILIST_LOCAL_DEV.md` - Detailed setup guide

### Updated Files
- `vite.config.js` - Added proxy configuration
- `package.json` - Added new scripts

### Already Existed
- `.env` - OAuth credentials
- `api/auth/anilist-token.js` - For Vercel production
- Auth components - AuthContext, Login page, UserProfile

---

## ⚙️ Key Configuration

**vite.config.js proxy:**
```javascript
server: {
  proxy: {
    '/api/auth/anilist-token': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
},
```

This tells Vite to redirect API calls to the dev server.

**dev-server.js** handles the request and exchanges the OAuth code for a token.

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│ AniList OAuth Page                              │
│ https://anilist.co/api/v2/oauth/authorize...    │
│ (User authenticates here)                       │
└──────────────┬──────────────────────────────────┘
               │ Redirects with code
               ↓
┌──────────────────────────────────────────────────┐
│ Your App: http://localhost:5173/page/auth/login  │
│ (Login.jsx receives auth code)                   │
└──────────┬───────────────────────────────────────┘
           │ POST /api/auth/anilist-token
           ↓
┌──────────────────────────────────────────────────┐
│ Vite Dev Server: http://localhost:5173           │
│ (Proxy intercepts request)                       │
└──────────┬───────────────────────────────────────┘
           │ Redirects to http://localhost:3000
           ↓
┌──────────────────────────────────────────────────┐
│ OAuth Dev Server: http://localhost:3000          │
│ (dev-server.js handles OAuth token exchange)     │
└──────────┬───────────────────────────────────────┘
           │ Contacts AniList to exchange code
           ↓
┌──────────────────────────────────────────────────┐
│ AniList API: anilist.co/api/v2/oauth/token       │
│ (Validates code, returns access token)           │
└──────────┬───────────────────────────────────────┘
           │ Returns token
           ↓
┌──────────────────────────────────────────────────┐
│ OAuth Dev Server                                 │
│ (Returns token to browser - CORS safe!)          │
└──────────┬───────────────────────────────────────┘
           │ Returns token
           ↓
┌──────────────────────────────────────────────────┐
│ Vite App: http://localhost:5173                  │
│ (Login.jsx receives token)                       │
└──────────┬───────────────────────────────────────┘
           │ Uses token to fetch user profile
           ↓
┌──────────────────────────────────────────────────┐
│ AniList GraphQL API                              │
│ (Fetches user info with token)                   │
└──────────┬───────────────────────────────────────┘
           │ Returns user data
           ↓
┌──────────────────────────────────────────────────┐
│ Your App                                         │
│ ✓ User logged in!                               │
│ ✓ Profile showing in navbar                     │
└──────────────────────────────────────────────────┘
```

---

## 📝 Scripts Reference

```bash
# Start OAuth dev server
node dev-server.js

# Start Vite app (requires dev-server running)
npm run dev

# Start both together (if concurrently is installed)
npm run dev:full

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## ✨ Key Points

1. **Two Servers Required for Local Dev:**
   - Port 3000: OAuth token exchange (dev-server.js)
   - Port 5173: Your React app (Vite)

2. **Both Must Be Running:**
   - If either crashes, login will fail
   - Keep both terminals open

3. **Vite Proxy Handles the Magic:**
   - Transparently forwards API calls to dev-server
   - Browser doesn't know it's being proxied

4. **No New Dependencies:**
   - dev-server.js uses only Node.js built-ins
   - dotenv is already installed

5. **Production is Different:**
   - Vercel uses `api/auth/anilist-token.js`
   - No dev-server needed there
   - Works automatically as serverless function

---

## 🎯 Success Criteria

When working correctly:
- ✅ dev-server.js starts without errors
- ✅ npm run dev starts without errors  
- ✅ http://localhost:5173 loads
- ✅ Login button works
- ✅ Redirected to AniList, authenticated
- ✅ Redirected back with profile visible
- ✅ "Token exchange successful" in Terminal 1

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 already in use | Kill other Node processes or use different port |
| "VITE_ANILIST_* is undefined" | Restart dev-server.js (it loads .env on startup) |
| dev-server shows ✗ for env vars | Check .env file has correct values |
| Still getting token exchange error | Make sure BOTH terminals are running |
| "Cannot find dotenv" | Already installed, just restart |
| "Cannot POST /api/auth/anilist-token" | dev-server not running, check Terminal 1 |

---

## 🚀 Next Steps

1. **Right now:**
   - Open Terminal 1: `node dev-server.js`
   - Open Terminal 2: `npm run dev`
   - Test login at http://localhost:5173

2. **When ready for production:**
   - Add env vars to Vercel dashboard
   - Update redirect URI for your domain
   - Push to git
   - Vercel uses `/api/auth/anilist-token.js` automatically
   - No dev-server needed!

---

## 📚 Documentation

- `START_HERE_DEV.md` - Ultra-quick start
- `ANILIST_LOCAL_DEV.md` - Detailed local dev setup
- `ANILIST_LOGIN_GUIDE.md` - Full implementation guide
- `ANILIST_TROUBLESHOOTING.md` - Debugging guide

---

**TLDR: Run `node dev-server.js` in one terminal, `npm run dev` in another, and test login!** 🎉
