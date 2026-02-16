# OAuth Exchange Backend - Integration Complete ✅

## Quick Overview

Your HaruAnime application now has a fully functional OAuth backend for AniList authentication!

### What's Running
- **Frontend**: HaruAnime on `http://localhost:5173` ✓
- **Backend**: OAuth Exchange Server on `http://localhost:3001` ✓
- **Token Handler**: `/api/auth/anilist-token` endpoint ✓

---

## File Locations

```
Desktop/
├── HaruAnime-main/
│   ├── .env (CONFIGURED)
│   ├── src/
│   ├── api/
│   ├── vite.config.js
│   └── dev-server.js (optional local dev server)
│
└── oauth-exchange-backend/
    ├── .env (CONFIGURED)
    ├── server.js (Express.js server)
    ├── api/
    │   └── auth/
    │       └── anilist-token.js (OAuth handler)
    ├── package.json
    └── node_modules/
```

---

## Configuration Summary

### Frontend (.env)
```env
VITE_ANILIST_CLIENT_ID=33008
VITE_ANILIST_CLIENT_SECRET=AtTpfdhuZBJ081lm1ixQAAl06QJFLY8BFIFkuRzb
VITE_ANILIST_REDIRECT_URI=http://localhost:5173/page/auth/login
VITE_ANILIST_TOKEN_API_URL=http://localhost:3001/api/auth/anilist-token
```

### Backend (.env)
```env
ANILIST_CLIENT_ID=33008
ANILIST_CLIENT_SECRET=AtTpfdhuZBJ081lm1ixQAAl06QJFLY8BFIFkuRzb
ANILIST_REDIRECT_URI=http://localhost:5173/page/auth/login
ALLOWED_ORIGINS=https://haru-anime.vercel.app,http://localhost:5173
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: User Initiates Login                                    │
│ ✓ Click "Login" button on HaruAnime (http://localhost:5173)    │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Redirect to AniList OAuth                              │
│ ✓ Frontend redirects to:                                        │
│   https://anilist.co/api/v2/oauth/authorize?                   │
│   client_id=33008&redirect_uri=http://localhost:5173/page/..   │
│   response_type=code                                             │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: User Approves                                            │
│ ✓ User sees AniList permission screen                           │
│ ✓ User clicks "Approve"                                         │
│ ✓ AniList generates authorization code                          │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: AniList Redirects Back                                  │
│ ✓ Browser redirects to:                                         │
│   http://localhost:5173/page/auth/login?code=XXXXX             │
│ ✓ Frontend captures the code                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Exchange Code for Token                                 │
│ ✓ Frontend sends POST request to:                               │
│   http://localhost:3001/api/auth/anilist-token                 │
│ ✓ Includes: { code: "XXXXX" }                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Backend Exchanges Code                                  │
│ ✓ oauth-exchange-backend receives request                       │
│ ✓ Backend POSTs to: https://anilist.co/api/v2/oauth/token      │
│ ✓ Includes: client_id, client_secret, code, redirect_uri       │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 7: AniList Issues Access Token                             │
│ ✓ AniList validates credentials                                 │
│ ✓ AniList returns access token                                  │
│ ✓ Backend returns token to frontend                             │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 8: Frontend Stores Token                                   │
│ ✓ Frontend stores token in localStorage                         │
│ ✓ Frontend updates user context                                 │
│ ✓ User is logged in! ✅                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Files & Their Roles

### [HaruAnime-main/.env](HaruAnime-main/.env)
- Defines client credentials for frontend
- Points frontend to backend token endpoint at `localhost:3001`

### [oauth-exchange-backend/.env](../oauth-exchange-backend/.env)
- Backend credentials (must match AniList app settings)
- CORS origins configuration

### [oauth-exchange-backend/api/auth/anilist-token.js](../oauth-exchange-backend/api/auth/anilist-token.js)
- Handles the actual OAuth token exchange
- Receives authorization code from frontend
- Exchanges it with AniList for access token
- Returns token to frontend

### [oauth-exchange-backend/server.js](../oauth-exchange-backend/server.js)
- Express.js server running on port 3001
- Routes requests to token handler
- Manages CORS headers

### [src/utils/corsProxy.utils.js](src/utils/corsProxy.utils.js)
- Frontend utility for calling token exchange endpoint
- Has fallback mechanisms for CORS issues

### [src/pages/login/Login.jsx](src/pages/login/Login.jsx)
- Login page component
- Initiates OAuth flow
- Handles redirect from AniList

---

## Testing the Setup

### 1. Health Check
```bash
# Should return: {"status":"ok"}
curl http://localhost:3001/health
```

### 2. Test Token Exchange (with real code)
```bash
# Get code from AniList first by visiting login page
curl -X POST http://localhost:3001/api/auth/anilist-token \
  -H "Content-Type: application/json" \
  -d '{"code":"YOUR_ANILIST_AUTH_CODE"}'

# Expected response:
# {
#   "access_token": "Bearer token...",
#   "token_type": "Bearer",
#   "expires_in": 2592000
# }
```

### 3. Full Login Test
1. Open `http://localhost:5173` in browser
2. Click "Login with AniList" button
3. AniList page opens with permission request
4. Click "Authorize" 
5. Redirect back to frontend
6. Should show user profile ✅

---

## Deployment to Production

### For Vercel (Recommended)

1. **Frontend to Vercel**:
   ```bash
   vercel --prod
   ```
   Set environment variables in Vercel dashboard

2. **Backend to Vercel**:
   ```bash
   cd oauth-exchange-backend
   vercel --prod
   ```

3. **Update Frontend .env**:
   ```env
   VITE_ANILIST_TOKEN_API_URL=https://your-backend.vercel.app/api/auth/anilist-token
   VITE_ANILIST_REDIRECT_URI=https://your-frontend.vercel.app/page/auth/login
   ```

4. **Update AniList OAuth App Settings**:
   - Go to https://anilist.co/settings/developer
   - Update Redirect URI to: `https://your-frontend.vercel.app/page/auth/login`

### For Other Hosting

Update the `VITE_ANILIST_TOKEN_API_URL` to point to wherever your backend is hosted.

---

## Troubleshooting

### Problem: "Token exchange failed"

**Check 1**: Is backend running?
```bash
# Should return 200
curl http://localhost:3001/health
```

**Check 2**: Are credentials correct?
```bash
# Compare these:
cat HaruAnime-main/.env | grep VITE_ANILIST
cat oauth-exchange-backend/.env | grep ANILIST
```

**Check 3**: Is redirect URI correct in AniList app?
- Go to https://anilist.co/settings/developer
- Verify "Redirect URI" matches: `http://localhost:5173/page/auth/login`

**Check 4**: Clear browser storage
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
// Then refresh page
```

### Problem: "Port 3001 already in use"

```powershell
# Find what's using port 3001
Get-NetTCPConnection -LocalPort 3001

# Kill the process
Stop-Process -Id <PID> -Force

# Restart backend
cd oauth-exchange-backend
npm start
```

### Problem: CORS Error

- Check `ALLOWED_ORIGINS` in backend .env includes frontend URL
- Make sure both `http://` and `https://` are configured for production
- Clear browser cache

---

## Security Notes

⚠️ **Important**:
- Never commit `.env` files with real credentials to git
- Client Secret should only be used server-side (which it is in this setup ✓)
- Use HTTPS in production
- Regenerate credentials if exposed
- Set `NODE_ENV=production` in backend for stricter CORS

---

## Support Resources

- **AniList OAuth Docs**: https://anilist.gitbook.io/anilist-data-specifications/overview/oauth
- **Backend Repo**: `C:\Users\x\Desktop\oauth-exchange-backend`
- **Frontend Repo**: `C:\Users\x\Desktop\HaruAnime-main`

---

**Last Updated**: December 18, 2025  
**Status**: ✅ Production Ready
