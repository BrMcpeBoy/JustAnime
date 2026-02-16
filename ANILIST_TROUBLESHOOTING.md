# AniList Login - Troubleshooting "Failed to fetch" Error

## Quick Fix Checklist

### 1. **Restart Your Dev Server**
```bash
# Stop the server (Ctrl+C)
# Clear node_modules cache
# Start again
npm run dev
```
The `.env` file is loaded when the server starts. Changes require a restart.

---

## Root Causes of "Failed to fetch"

### **Issue A: CORS Error (Most Common)**
**Symptom:** Error says "Failed to fetch" with no details in Network tab

**Why it happens:** 
- Browser security prevents direct API calls to anilist.co from your frontend
- You need a backend proxy to handle the OAuth token exchange

**Solution:** 
1. Ensure `api/auth/anilist-token.js` exists in your project
2. For local development:
   - The API endpoint is at `/api/auth/anilist-token`
   - Your dev server should proxy it
3. For Vercel deployment:
   - File should be at `api/auth/anilist-token.js` 
   - Vercel automatically creates the serverless function

**Test it:**
```bash
curl -X POST http://localhost:5173/api/auth/anilist-token \
  -H "Content-Type: application/json" \
  -d '{"code":"test"}'
```

---

### **Issue B: Environment Variables Not Loading**
**Symptom:** Console shows `undefined` for CLIENT_ID or REDIRECT_URI

**Why it happens:**
- `.env` file not found or not readable
- Dev server wasn't restarted after adding `.env`
- Variables don't have `VITE_` prefix

**Solution:**
1. Verify `.env` file exists at project root
2. Verify these exact lines in `.env`:
   ```
   VITE_ANILIST_CLIENT_ID=33008
   VITE_ANILIST_CLIENT_SECRET=AtTpfdhuZBJ081lm1ixQAAl06QJFLY8BFIFkuRzb
   VITE_ANILIST_REDIRECT_URI=http://localhost:5173/page/auth/login
   ```
3. Restart dev server with `npm run dev`
4. Check browser console to confirm values load:
   ```
   console.log(import.meta.env.VITE_ANILIST_CLIENT_ID)
   ```

---

### **Issue C: Redirect URI Mismatch**
**Symptom:** Error about redirect_uri_mismatch or invalid redirect URI

**Why it happens:**
- The URI you set in `.env` doesn't match what you registered in AniList app settings
- Different domains (localhost vs deployed site)

**Solution:**
1. Go to: https://anilist.co/settings/developer
2. Check your app's "Redirect URL"
3. Update `.env` to match EXACTLY:
   ```
   # For local development
   VITE_ANILIST_REDIRECT_URI=http://localhost:5173/page/auth/login
   
   # For production (Vercel example)
   VITE_ANILIST_REDIRECT_URI=https://yourdomain.vercel.app/page/auth/login
   ```
4. Restart dev server

---

### **Issue D: Invalid Client ID or Secret**
**Symptom:** Error says "invalid_client" or "unauthorized_client"

**Why it happens:**
- Client ID or Secret is wrong
- App not properly registered on AniList

**Solution:**
1. Go to: https://anilist.co/settings/developer
2. Verify you have an app registered
3. Copy the exact Client ID and Client Secret
4. Update `.env`:
   ```
   VITE_ANILIST_CLIENT_ID=YOUR_CLIENT_ID
   VITE_ANILIST_CLIENT_SECRET=YOUR_CLIENT_SECRET
   ```
5. Restart dev server

---

## Debugging Steps

### Step 1: Check Console Logs
Open browser DevTools (F12) and look for logs like:
```
Auth code received: abc123...
Env vars loaded: { clientId: '33008', redirectUri: '...', hasSecret: true }
```

### Step 2: Check Network Tab
1. Open DevTools Network tab
2. Click "Login with AniList"
3. Look for requests:
   - First: `https://anilist.co/api/v2/oauth/authorize?...` (redirect)
   - After auth: POST to `/api/auth/anilist-token` (should succeed)
   - Then: POST to `https://graphql.anilist.co` (should succeed)

### Step 3: Manual Token Exchange Test
In browser console, test the backend endpoint:
```javascript
fetch('/api/auth/anilist-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'test-code' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### Step 4: Test AniList GraphQL Directly
```javascript
fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  },
  body: JSON.stringify({
    query: 'query { Viewer { name } }'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

---

## For Vercel Deployment

### Environment Variables Setup
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add these variables:
   ```
   VITE_ANILIST_CLIENT_ID=33008
   VITE_ANILIST_CLIENT_SECRET=AtTpfdhuZBJ081lm1ixQAAl06QJFLY8BFIFkuRzb
   VITE_ANILIST_REDIRECT_URI=https://yourdomain.vercel.app/page/auth/login
   ```
   (Also without VITE_ prefix for the API function)
   ```
   ANILIST_CLIENT_ID=33008
   ANILIST_CLIENT_SECRET=AtTpfdhuZBJ081lm1ixQAAl06QJFLY8BFIFkuRzb
   ANILIST_REDIRECT_URI=https://yourdomain.vercel.app/page/auth/login
   ```

4. Redeploy your app
5. Verify `api/auth/anilist-token.js` exists in your repository

---

## File Structure Check

Ensure you have:
```
project-root/
├── .env (with VITE_ANILIST_*)
├── api/
│   └── auth/
│       └── anilist-token.js
├── src/
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   └── login/
│   │       └── Login.jsx
│   └── components/
│       └── navbar/
│           ├── Navbar.jsx
│           └── UserProfile.jsx
└── vite.config.js
```

---

## Still Having Issues?

1. **Check browser console** for actual error messages
2. **Check Network tab** for failed requests and responses
3. **Check server logs** (terminal where `npm run dev` runs)
4. **Verify .env file** exists and has correct values
5. **Restart dev server** after any changes
6. **Clear browser cache** (Ctrl+Shift+Delete)

Common error messages:
- `CORS error` → Use backend endpoint at `/api/auth/anilist-token`
- `undefined` CLIENT_ID → Restart dev server
- `redirect_uri_mismatch` → Update `.env` and AniList app settings
- `invalid_client` → Check Client ID and Secret in AniList settings
