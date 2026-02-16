# AniList Login - Error Fix Summary

## What Was Fixed

The "Failed to fetch" error was caused by **CORS (Cross-Origin Resource Sharing) restrictions** when trying to exchange the OAuth code for a token directly from the browser.

### Solutions Implemented:

1. **Backend API Endpoint** (`/api/auth/anilist-token.js`)
   - Handles OAuth token exchange server-side
   - Avoids CORS issues completely
   - Includes error logging and proper CORS headers

2. **Enhanced Error Handling** 
   - Better error messages to identify the actual issue
   - Supports both backend endpoint and fallback direct API
   - Detailed logging in browser console

3. **Improved Configuration**
   - Better environment variable handling
   - Support for both VITE_ and non-VITE_ prefixed vars
   - Vite config updated

---

## How to Test the Fix

### **For Local Development (localhost)**

1. **Verify .env file exists at project root**
   ```
   VITE_ANILIST_CLIENT_ID=33008
   VITE_ANILIST_CLIENT_SECRET=AtTpfdhuZBJ081lm1ixQAAl06QJFLY8BFIFkuRzb
   VITE_ANILIST_REDIRECT_URI=http://localhost:5173/page/auth/login
   ```

2. **Restart your dev server**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

3. **Click "Login with AniList"**
   - The navbar login button (user icon)
   - Select "Login with AniList"

4. **Authenticate on AniList**
   - You'll be redirected to anilist.co
   - Grant permission to the app
   - You'll be redirected back to your app

5. **Check the browser console** (F12)
   Look for logs like:
   ```
   Auth code received: abc123...
   Env vars loaded: { clientId: '33008', ... }
   Attempting token exchange via backend...
   Backend endpoint successful
   ```

---

## Files Created/Modified

### **New Files:**
- `api/auth/anilist-token.js` - Backend OAuth handler
- `src/utils/corsProxy.utils.js` - Utility for token exchange
- `ANILIST_TROUBLESHOOTING.md` - Comprehensive debugging guide
- `ANILIST_DEBUG.md` - Debug notes

### **Modified Files:**
- `src/pages/login/Login.jsx` - Enhanced error handling
- `vite.config.js` - Minor config adjustment

### **Previously Created:**
- `src/context/AuthContext.jsx` - Auth context and hooks
- `src/components/navbar/UserProfile.jsx` - User profile dropdown
- `src/components/navbar/Navbar.jsx` - Updated navbar
- `src/App.jsx` - Routes and providers

---

## Production Deployment (Vercel)

### Step 1: Update Environment Variables
The `/api/auth/anilist-token.js` function needs access to environment variables.

Go to your **Vercel Dashboard** → **Settings** → **Environment Variables**

Add these variables (if not already there):
```
VITE_ANILIST_CLIENT_ID=33008
VITE_ANILIST_CLIENT_SECRET=AtTpfdhuZBJ081lm1ixQAAl06QJFLY8BFIFkuRzb
VITE_ANILIST_REDIRECT_URI=https://YOUR_DOMAIN/page/auth/login

# Also add without VITE_ prefix for the API function:
ANILIST_CLIENT_ID=33008
ANILIST_CLIENT_SECRET=AtTpfdhuZBJ081lm1ixQAAl06QJFLY8BFIFkuRzb
ANILIST_REDIRECT_URI=https://YOUR_DOMAIN/page/auth/login
```

Replace `YOUR_DOMAIN` with your actual domain (e.g., `haru-anime.vercel.app`)

### Step 2: Update AniList OAuth Settings
1. Go to: https://anilist.co/settings/developer
2. Edit your OAuth app
3. Set Redirect URI to: `https://YOUR_DOMAIN/page/auth/login`

### Step 3: Deploy
```bash
git add .
git commit -m "Fix AniList login with backend OAuth handler"
git push
```
Vercel will automatically redeploy.

### Step 4: Test
Visit your deployed site and test the login flow.

---

## If Login Still Fails

### **Check 1: Backend Endpoint Exists**
Verify `api/auth/anilist-token.js` is in your repository:
```bash
ls api/auth/anilist-token.js
```

### **Check 2: Environment Variables Loaded**
In browser console, run:
```javascript
console.log(import.meta.env.VITE_ANILIST_CLIENT_ID)
console.log(import.meta.env.VITE_ANILIST_REDIRECT_URI)
```
Both should print values, not `undefined`.

### **Check 3: Backend Endpoint Works**
In browser console, run:
```javascript
fetch('/api/auth/anilist-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'test' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```
Should return an error response (not a network error).

### **Check 4: Network Tab**
1. Open DevTools (F12)
2. Go to Network tab
3. Click "Login with AniList"
4. Look for requests:
   - POST to `/api/auth/anilist-token` - should show response
   - POST to `https://graphql.anilist.co` - should succeed

### **Check 5: Redirect URI**
Make sure the exact URL in `.env` matches what you set in AniList app settings.

For example, if `.env` has `http://localhost:5173/page/auth/login`, that exact URL must be set in AniList.

---

## More Help

- **Debugging Guide:** See `ANILIST_TROUBLESHOOTING.md`
- **Full Implementation Guide:** See `ANILIST_LOGIN_GUIDE.md`
- **Console Logs:** Check browser console (F12) for detailed error messages

---

## Quick Summary

✅ **What Works:**
- AniList OAuth authentication
- User profile data retrieval
- Auto-login on page refresh
- User profile display in navbar

✅ **What's Fixed:**
- CORS errors with backend endpoint
- Better error messages
- Environment variable handling
- Both local and production support

✅ **Next Steps:**
- Test locally with `npm run dev`
- Deploy to Vercel
- Update AniList redirect URI for production
- Verify it works on live domain
