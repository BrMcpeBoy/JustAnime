# AniList Login - Local Development Setup

## The Issue
For local development on `localhost:5173`, the backend endpoint `/api/auth/anilist-token.js` won't work because:
1. It's designed for Vercel serverless functions (production)
2. Your local Vite server doesn't execute Node.js code
3. Direct CORS calls to AniList are blocked

## The Solution
Run a **separate Node.js development server** that handles OAuth token exchange.

---

## 🚀 Quick Setup

### Option 1: Run Servers Separately (Easiest)

**Terminal 1 - OAuth Dev Server:**
```bash
node dev-server.js
```

You should see:
```
╔════════════════════════════════════════╗
║  AniList OAuth Dev Server (Node.js)    ║
║  Running on http://localhost:3000      ║
╚════════════════════════════════════════╝

✓ VITE_ANILIST_CLIENT_ID
✓ VITE_ANILIST_CLIENT_SECRET
✓ VITE_ANILIST_REDIRECT_URI
```

**Terminal 2 - Vite App Server:**
```bash
npm run dev
```

Your app will be at `http://localhost:5173`

The Vite dev server will automatically proxy API calls from `http://localhost:5173/api/auth/anilist-token` to `http://localhost:3000/api/auth/anilist-token`

---

### Option 2: Run Both Together (Requires extra setup)

If you want to run both servers in one command, install `concurrently`:
```bash
npm install --save-dev concurrently
```

Then run:
```bash
npm run dev:full
```

This will start both servers simultaneously.

---

## ✅ How It Works

```
User clicks login
         ↓
Browser → http://localhost:5173/page/auth/login (redirected from AniList)
         ↓
Login.jsx exchanges code:
POST to http://localhost:5173/api/auth/anilist-token
         ↓
Vite proxy redirects to:
POST to http://localhost:3000/api/auth/anilist-token
         ↓
dev-server.js handles the request
         ↓
Contacts AniList API to exchange code for token
         ↓
Returns token to browser (no CORS issues!)
         ↓
Login successful!
```

---

## 🧪 Testing

### Step 1: Start Both Servers
```bash
# Terminal 1
node dev-server.js

# Terminal 2
npm run dev
```

### Step 2: Visit Your App
Open `http://localhost:5173` in your browser

### Step 3: Test Login
1. Click the user icon in the navbar (top right)
2. Click "Login with AniList"
3. Authenticate on anilist.co
4. Should be redirected back with your profile

### Step 4: Check Console
In **Terminal 1** (dev-server), you should see:
```
Token exchange attempt: { clientId: '33008', ... }
Token exchange successful
```

In **browser console** (F12), you should see:
```
Auth code received: [code...]
Backend endpoint successful
Welcome [YourUsername]!
```

---

## ⚠️ Common Issues

### Issue: "Failed to fetch" or connection refused

**Cause:** dev-server.js isn't running

**Solution:**
1. Make sure you ran `node dev-server.js` in a separate terminal
2. Check it's listening on port 3000
3. Verify the terminal shows "Running on http://localhost:3000"

### Issue: "VITE_ANILIST_* is undefined"

**Cause:** .env file not loaded or server not restarted

**Solution:**
1. Check .env file exists at project root
2. Kill both servers (Ctrl+C)
3. Restart: first `node dev-server.js`, then `npm run dev`

### Issue: Environment variables show as ✗

**Cause:** .env file missing or has wrong values

**Solution:**
Verify `.env` has these exact lines:
```
VITE_ANILIST_CLIENT_ID=33008
VITE_ANILIST_CLIENT_SECRET=AtTpfdhuZBJ081lm1ixQAAl06QJFLY8BFIFkuRzb
VITE_ANILIST_REDIRECT_URI=http://localhost:5173/page/auth/login
```

### Issue: Proxy not working

**Cause:** Vite config not reloaded or port 3000 in use

**Solution:**
1. Kill all Node processes
2. Check port 3000 is free: `netstat -ano | findstr :3000` (Windows)
3. Restart dev-server.js first
4. Then restart `npm run dev`

---

## 📂 File Structure

You now have:
```
project-root/
├── dev-server.js ← Run this: node dev-server.js
├── .env (OAuth credentials)
├── vite.config.js (proxy configured)
├── src/
│   ├── pages/login/Login.jsx
│   ├── context/AuthContext.jsx
│   └── ...
└── api/auth/anilist-token.js (for Vercel production)
```

---

## 🌐 For Production (Vercel)

The `api/auth/anilist-token.js` file is automatically used by Vercel. No need to run the dev server there. It works as a serverless function.

For production:
1. Add env vars to Vercel dashboard
2. Update redirect URI for your production domain
3. Deploy with `git push`

---

## 📝 Scripts Summary

```bash
# Run OAuth dev server only
node dev-server.js

# Run Vite app only
npm run dev

# Run both together (after installing concurrently)
npm run dev:full

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 💡 How the Proxy Works

**vite.config.js** has:
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

This tells Vite: "When you see a request to `/api/auth/anilist-token`, send it to `http://localhost:3000` instead"

So:
- Frontend request: `/api/auth/anilist-token`
- Vite redirects to: `http://localhost:3000/api/auth/anilist-token`
- dev-server.js handles it

---

## ✨ You're All Set!

1. Open two terminals
2. Run `node dev-server.js` in first terminal
3. Run `npm run dev` in second terminal
4. Visit `http://localhost:5173`
5. Test login!

Everything should work now! 🚀
