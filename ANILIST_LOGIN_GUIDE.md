# AniList Login Implementation

## Overview
The AniList login functionality is now fully integrated into your HaruAnime application. Users can authenticate with their AniList accounts, and the app will display their profile information.

## Components Created/Modified

### 1. **AuthContext.jsx** (`src/context/AuthContext.jsx`) - NEW
Manages authentication state globally:
- Stores user data (id, name, avatar, statistics)
- Manages access token
- Provides `useAuth` hook for components
- Persists auth state in localStorage

**Key Features:**
- `login(userData, token)` - Save user and token
- `logout()` - Clear auth state
- `useAuth()` - Hook to access auth context
- Auto-initializes from localStorage on app load

### 2. **Login.jsx** (`src/pages/login/Login.jsx`) - NEW
Handles the OAuth callback from AniList:
- Receives authorization code from AniList
- Exchanges code for access token
- Fetches user information via GraphQL
- Shows loading, success, and error states
- Stores user data and redirects to home

**Route:** `/page/auth/login`

### 3. **UserProfile.jsx** (`src/components/navbar/UserProfile.jsx`) - NEW
Displays logged-in user information:
- Shows user avatar with hover dropdown
- Displays user stats (anime count, mean score)
- Shows user bio/about section
- Provides logout button
- Only visible when authenticated

### 4. **App.jsx** - MODIFIED
- Added `AuthProvider` wrapper around the app
- Added new route: `/page/auth/login`
- Imported Login component

### 5. **Navbar.jsx** - MODIFIED
- Imported `useAuth` hook
- Imported `UserProfile` component
- Conditionally shows user profile or login button
- Fixed OAuth URL to use environment variables

## Environment Variables Required

Your `.env` file already contains:
```
VITE_ANILIST_CLIENT_ID=33008
VITE_ANILIST_CLIENT_SECRET=AtTpfdhuZBJ081lm1ixQAAl06QJFLY8BFIFkuRzb
VITE_ANILIST_REDIRECT_URI=http://localhost:5173/page/auth/login
```

## How It Works

### Login Flow
1. User clicks "Login with AniList" in navbar
2. Redirected to AniList OAuth page with app credentials
3. User grants permission to access their profile
4. AniList redirects back to `/page/auth/login` with auth code
5. App exchanges code for access token
6. App fetches user profile via GraphQL API
7. User data stored in context and localStorage
8. User redirected to home page with profile visible

### Logout Flow
1. User clicks logout in profile dropdown
2. User data and token cleared from state and localStorage
3. User redirected to home page
4. Login button reappears in navbar

## Local Development

To test locally:
1. Make sure redirect URI matches: `http://localhost:5173/page/auth/login`
2. Click "Login with AniList" button in the navbar (user icon)
3. You'll be redirected to AniList to authenticate
4. After authentication, you'll be back at your app with profile visible

## Production Deployment

For production:
1. Update `VITE_ANILIST_REDIRECT_URI` to your production URL
2. Example: `https://yourdomain.com/page/auth/login`
3. Update the OAuth URL in Navbar if needed for production domains

## Data Stored

### In Context/LocalStorage
- `id` - User AniList ID
- `name` - Username
- `avatar` - Avatar image URL
- `banner` - Banner image URL
- `about` - User bio
- `statistics` - Anime & manga stats with mean scores
- `access_token` - OAuth token for API requests

### Token Usage
The access token is stored in localStorage and can be used for:
- Future API requests to AniList
- Updating user lists
- Fetching user-specific data

## Usage in Components

```jsx
import { useAuth } from '@/src/context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }
  
  return <p>Hello, {user.name}!</p>;
}
```

## Next Steps (Optional Enhancements)

1. **User List Management** - Allow users to add anime to their list
2. **Watch Progress** - Track watched episodes per user
3. **User Stats Dashboard** - Show detailed statistics
4. **Sync with Account** - Save watch history to AniList
5. **MAL Integration** - Complete MyAnimeList login
