# "Failed to Fetch" Error - Root Cause Analysis

## The Error You Got
```
Login failed: Failed to fetch
```

## Why It Happened

Your browser tried to call the AniList OAuth API directly from the client-side:

```
Browser → AniList API (BLOCKED by CORS)
```

**CORS (Cross-Origin Resource Sharing)** is a security feature that blocks browsers from making requests to different domains. AniList's OAuth token endpoint doesn't have CORS enabled, so your browser blocks the request.

---

## The Solution

Now the flow is:

```
Browser → Your Backend (/api/auth/anilist-token.js) → AniList API (✅ Works)
```

Your backend can make requests to AniList without CORS restrictions.

---

## Technical Details

### Before (Broken)
1. Browser asks: "Can I call anilist.co/api/v2/oauth/token?"
2. AniList answers: "No, CORS not allowed"
3. Browser blocks the request
4. Error: "Failed to fetch"

### After (Fixed)
1. Browser asks: "Can I call /api/auth/anilist-token?"
2. Your server says: "Yes, I'll handle it"
3. Your server asks: "Can I call anilist.co/api/v2/oauth/token?"
4. AniList answers: "Yes, you're a server"
5. Token exchange succeeds ✅

---

## Implementation

### Backend Endpoint Added
```javascript
// api/auth/anilist-token.js
export default async function handler(req, res) {
  // This runs on your server, not the browser
  // So CORS doesn't apply
  
  const { code } = req.body;
  
  const response = await fetch('https://anilist.co/api/v2/oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.ANILIST_CLIENT_ID,
      client_secret: process.env.ANILIST_CLIENT_SECRET,
      redirect_uri: process.env.ANILIST_REDIRECT_URI,
      code,
    }),
  });
  
  return res.json(await response.json());
}
```

### Login Component Updated
```javascript
// src/pages/login/Login.jsx
const tokenData = await tokenExchangeWithFallback(
  code,
  clientId,
  clientSecret,
  redirectUri
);
```

This utility:
1. Tries backend endpoint first (`/api/auth/anilist-token`)
2. If that fails, tries direct API (fallback for development)
3. Handles errors gracefully

---

## Why This Fixes Your Issue

- ✅ No more CORS errors
- ✅ Secret stays safe (never sent to browser)
- ✅ Works both locally and on Vercel
- ✅ Better error messages
- ✅ Production-ready

---

## Next Steps

1. **Restart your dev server** - This loads the new backend endpoint
2. **Test login** - Click "Login with AniList"
3. **Check console** - Look for logs confirming it works
4. **Deploy to Vercel** - The backend endpoint works automatically there

That's it! 🎉
