/**
 * Debugging Guide for AniList Login Issues
 * 
 * To check what's happening:
 * 1. Open browser DevTools (F12)
 * 2. Go to Network tab
 * 3. Click Login with AniList
 * 4. Look for the request that fails
 * 5. Check the response
 * 
 * Common Issues:
 */

// ISSUE 1: CORS Error or "Failed to fetch"
// Solution: The backend API endpoint at /api/auth/anilist-token is now used first.
// If you're on Vercel, this file is at: api/auth/anilist-token.js
// Make sure it exists and is deployed.

// ISSUE 2: Redirect URI Mismatch
// The .env has: VITE_ANILIST_REDIRECT_URI=http://localhost:5173/page/auth/login
// Make sure this matches EXACTLY in your AniList OAuth app settings
// Check: https://anilist.co/settings/developer

// ISSUE 3: Invalid Client ID or Secret
// Current values in .env:
// - VITE_ANILIST_CLIENT_ID=33008
// - VITE_ANILIST_CLIENT_SECRET=AtTpfdhuZBJ081lm1ixQAAl06QJFLY8BFIFkuRzb
// Verify these match your AniList app settings

// ISSUE 4: Environment Variables Not Loading
// Check that:
// - .env file exists in project root
// - You restarted the dev server after modifying .env
// - Variables are prefixed with VITE_

// ISSUE 5: API Endpoint Not Found (404)
// When deploying to Vercel:
// 1. Create /api/auth/anilist-token.js in your project root
// 2. Add these env vars to Vercel deployment settings:
//    - VITE_ANILIST_CLIENT_ID
//    - VITE_ANILIST_CLIENT_SECRET  
//    - VITE_ANILIST_REDIRECT_URI

console.log('=== AniList Login Debugging ===');
console.log('Client ID:', import.meta.env.VITE_ANILIST_CLIENT_ID);
console.log('Redirect URI:', import.meta.env.VITE_ANILIST_REDIRECT_URI);
