# Quick Start - AniList Login (LOCAL DEV FIX)

## What's the Issue?
localhost development doesn't have a real backend server, so OAuth token exchange fails.

## What's the Solution?
Run a **simple Node.js dev server** on port 3000 to handle OAuth token exchange.

---

## 🚀 RUN THIS NOW (2 steps)

### Step 1: First Terminal
```bash
cd c:\Users\x\Desktop\HaruAnime-main
node dev-server.js
```

Should show:
```
Running on http://localhost:3000
✓ VITE_ANILIST_CLIENT_ID
✓ VITE_ANILIST_CLIENT_SECRET
✓ VITE_ANILIST_REDIRECT_URI
```

**KEEP THIS RUNNING**

### Step 2: Second Terminal (while first is running)
```bash
npm run dev
```

Should show:
```
Local: http://localhost:5173
```

---

## Test It

1. Open http://localhost:5173
2. Click user icon → "Login with AniList"
3. Authenticate on anilist.co
4. Should show your profile!

Check Terminal 1 for:
```
Token exchange successful
```

---

## Why This Works

| Before | After |
|--------|-------|
| Browser → CORS blocked | Browser → Vite proxy → dev-server → AniList ✓ |
| Error: "Failed to fetch" | Works! No CORS issues |

---

## Files Created

- `dev-server.js` - Node.js OAuth handler
- `ANILIST_LOCAL_DEV.md` - Detailed guide
- Updated `vite.config.js` - Proxy configured
- Updated `package.json` - New scripts

---

## Both Terminals Must Run

| Terminal 1 | Terminal 2 |
|-----------|-----------|
| `node dev-server.js` | `npm run dev` |
| Port 3000 | Port 5173 |
| Handles OAuth | Your React app |
| Must be running | Must be running |

---

## Still Having Issues?

1. **Make sure BOTH terminals are running**
2. Check `.env` has correct values
3. Check `dev-server.js` shows ✓ for all env vars
4. Verify port 3000 is free
5. Check browser console (F12) for errors
6. Read `ANILIST_LOCAL_DEV.md` for detailed setup

---

## Next Steps

After login works locally:
1. Test all features
2. When ready to deploy to Vercel:
   - Add env vars to Vercel dashboard
   - Update redirect URI for your domain
   - Push to git - Vercel will use `/api/auth/anilist-token.js`
   - Done! No dev server needed on Vercel

---

**Start the dev server NOW:**
```
node dev-server.js
```

Then in another terminal:
```
npm run dev
```

Go to http://localhost:5173 and test login! ✨
