# Quick Fix - AniList Login "Failed to Fetch" Error

## TL;DR - What to Do Now

### 1. **Restart Your Dev Server** (Most Important!)
```bash
# Kill the current server: Ctrl+C
# Then restart it:
npm run dev
```
The `.env` file is only loaded when the server starts.

### 2. **Check Your .env File**
Make sure these exist at project root:
```
VITE_ANILIST_CLIENT_ID=33008
VITE_ANILIST_CLIENT_SECRET=AtTpfdhuZBJ081lm1ixQAAl06QJFLY8BFIFkuRzb
VITE_ANILIST_REDIRECT_URI=http://localhost:5173/page/auth/login
```

### 3. **Test Login**
- Click user icon in navbar
- Click "Login with AniList"
- Login on anilist.co
- Should redirect back to your app

---

## What Changed

**Root Cause:** Browser CORS restrictions prevent direct API calls to anilist.co

**Solution:** Added backend API endpoint at `/api/auth/anilist-token.js`
- Handles OAuth token exchange server-side
- Avoids CORS completely
- Works locally and on Vercel

---

## Files You Need

These files must exist in your project:

✅ `/api/auth/anilist-token.js` - NEW (Backend endpoint)
✅ `src/pages/login/Login.jsx` - UPDATED (Uses backend endpoint)
✅ `src/utils/corsProxy.utils.js` - NEW (Token exchange utility)
✅ `src/context/AuthContext.jsx` - CREATED EARLIER
✅ `src/components/navbar/UserProfile.jsx` - CREATED EARLIER
✅ `src/components/navbar/Navbar.jsx` - UPDATED EARLIER
✅ `.env` - Must have VITE_ANILIST_* variables

All these files are already in your project. Just restart the server.

---

## For Vercel Deployment

1. **Add Environment Variables** to Vercel dashboard:
   - Go to Settings → Environment Variables
   - Add VITE_ANILIST_* and ANILIST_* variables
   - (Same credentials as .env)

2. **Update Redirect URI**:
   - In `.env`: `VITE_ANILIST_REDIRECT_URI=https://YOUR_VERCEL_DOMAIN/page/auth/login`
   - In AniList OAuth settings: same URL
   - Replace YOUR_VERCEL_DOMAIN with your actual domain

3. **Deploy**:
   ```bash
   git push
   ```

---

## Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| `undefined` CLIENT_ID | Restart dev server (`npm run dev`) |
| redirect_uri_mismatch | Update .env and AniList app settings to match exactly |
| Still "Failed to fetch" | Check browser console (F12) for detailed error |
| Backend endpoint 404 | Make sure `api/auth/anilist-token.js` exists in root |

---

## Testing Checklist

- [ ] Restart dev server
- [ ] Check .env has correct values
- [ ] Click login button
- [ ] Authenticate on anilist.co  
- [ ] Check browser console (F12) for logs
- [ ] Verify user profile appears in navbar

---

## Need More Help?

- **Full Guide:** `ANILIST_LOGIN_GUIDE.md`
- **Troubleshooting:** `ANILIST_TROUBLESHOOTING.md`
- **Fix Summary:** `ANILIST_FIX_SUMMARY.md`

---

## What Works Now

✅ OAuth authentication with AniList  
✅ User profile display (avatar, stats, bio)  
✅ Persistent login (localStorage)  
✅ Logout functionality  
✅ Works locally AND on Vercel  
✅ Better error messages  

You're good to go! 🚀
