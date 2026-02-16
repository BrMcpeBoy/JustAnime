# 🎬 HaruAnime with User Profile Feature - Complete Setup Guide

## 🎉 What's Included

This is your complete HaruAnime project with the **User Profile Feature** already integrated and ready to use!

### ✨ New Features Added:

1. **Clickable User Profiles** in Comments
   - Click any user avatar or username
   - Beautiful modal opens with user information

2. **Profile Modal Features**
   - Blurred background using user's AniList avatar
   - User statistics (comments, likes, replies)
   - Recent comment history (last 10 comments)
   - Direct link to AniList profile
   - Smooth animations and responsive design

3. **Backend Enhancement**
   - New API endpoint: `GET /api/comments/user/:userId`
   - Fetches all comments by a specific user

---

## 📋 Prerequisites

Before starting, make sure you have:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** (optional but recommended)
- A code editor (VS Code recommended)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Extract the Project

```bash
# Extract the zip file
unzip HaruAnime-with-user-profiles.zip
cd HaruAnime-main
```

### Step 2: Install Frontend Dependencies

```bash
# Install all frontend dependencies
npm install
```

**Wait for installation to complete...** (This may take 2-3 minutes)

### Step 3: Setup Backend

```bash
# Navigate to backend directory
cd comment-backend

# Install backend dependencies
npm install

# Go back to root
cd ..
```

### Step 4: Configure Environment Variables

#### Frontend (.env in root)

Create a `.env` file in the project root:

```env
# AniList OAuth Configuration
VITE_ANILIST_CLIENT_ID=your_anilist_client_id
VITE_ANILIST_CLIENT_SECRET=your_anilist_client_secret
VITE_ANILIST_REDIRECT_URI=http://localhost:5173/login

# Comment API URL
VITE_COMMENT_API_URL=http://localhost:5000

# API Configuration
VITE_API_BASE_URL=https://api.ani.zip
VITE_CONSUMET_API=https://api-consumet-org-beryl.vercel.app
```

**Important**: Replace `your_anilist_client_id` and `your_anilist_client_secret` with your actual AniList OAuth credentials.

#### How to Get AniList OAuth Credentials:

1. Go to [AniList Developer Settings](https://anilist.co/settings/developer)
2. Click "Create New Client"
3. Fill in:
   - **Name**: HaruAnime (or your app name)
   - **Redirect URI**: `http://localhost:5173/login`
4. Copy your Client ID and Client Secret
5. Paste them into your `.env` file

### Step 5: Start the Servers

#### Terminal 1 - Backend:

```bash
cd comment-backend
npm start
```

**Expected output**:
```
Comment API running on port 5000
```

Keep this terminal open!

#### Terminal 2 - Frontend (open a new terminal):

```bash
# From project root
npm run dev
```

**Expected output**:
```
VITE v5.x.x ready in XXX ms
Local: http://localhost:5173
```

### Step 6: Open Your Browser

Navigate to: **http://localhost:5173**

---

## ✅ Testing the User Profile Feature

1. **Login with AniList**
   - Click the "Login" button in the navbar
   - Login with your AniList account

2. **Navigate to Any Anime**
   - Search for an anime
   - Click on it to view details

3. **Go to Watch Page**
   - Click on any episode to watch

4. **Scroll to Comments Section**
   - You'll see the comments section at the bottom

5. **Test User Profile**
   - Click on any user's **avatar**
   - OR click on any **username**
   - A beautiful modal should open showing:
     - ✅ User's profile with blurred background
     - ✅ Statistics (comments, likes, replies)
     - ✅ Recent comments
     - ✅ "View on AniList" button

6. **Test Modal Interactions**
   - Click the **X button** to close
   - Click **outside the modal** to close
   - Press **ESC key** to close

---

## 📁 Project Structure

```
HaruAnime-main/
├── src/
│   ├── components/
│   │   ├── comments/
│   │   │   ├── CommentSection.jsx      ✅ UPDATED
│   │   │   └── UserProfileModal.jsx    ✅ NEW
│   │   ├── navbar/
│   │   ├── player/
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── watch/
│   │   │   └── Watch.jsx
│   │   └── ...
│   └── App.jsx
├── comment-backend/                     ✅ UPDATED
│   ├── api/
│   │   └── index.js                     ✅ NEW ENDPOINT ADDED
│   ├── package.json
│   └── README.md
├── public/
├── package.json
├── .env                                 ⚠️ YOU NEED TO CREATE THIS
└── vite.config.js
```

---

## 🎨 Features Overview

### Frontend Components

#### 1. UserProfileModal.jsx (New)
Located: `src/components/comments/UserProfileModal.jsx`

Features:
- Displays user profile in a modal
- Blurred background effect
- User statistics
- Recent comments list
- AniList profile link
- Responsive design
- Dark theme

#### 2. CommentSection.jsx (Updated)
Located: `src/components/comments/CommentSection.jsx`

Updates:
- Clickable user avatars
- Clickable usernames
- Hover effects
- Focus states for accessibility
- Integration with UserProfileModal

### Backend API

#### New Endpoint Added:
```
GET /api/comments/user/:userId
```

**Description**: Fetches all comments by a specific user

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "comment_id",
      "userId": "user_id",
      "username": "username",
      "userAvatar": "avatar_url",
      "content": "comment text",
      "likes": 5,
      "replyCount": 2,
      "createdAt": "2025-01-09T...",
      "episodeId": "12"
    }
  ],
  "total": 10
}
```

---

## 🔧 Configuration

### Port Configuration

**Frontend**: Port 5173 (Vite default)
**Backend**: Port 5000

To change ports:

#### Frontend:
Edit `vite.config.js`:
```javascript
export default defineConfig({
  server: {
    port: 3000, // Change to your preferred port
  }
})
```

#### Backend:
Edit `comment-backend/api/index.js`:
```javascript
const PORT = process.env.PORT || 5000; // Change 5000 to your preferred port
```

### CORS Configuration

If you deploy to different domains, update CORS in `comment-backend/api/index.js`:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com', // Change this
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 🎨 Customization

### Change Modal Colors

Edit `src/components/comments/UserProfileModal.jsx`:

```jsx
// Line ~20 - Background gradient
<div className="bg-gradient-to-b from-purple-900/40 via-blue-900/40 to-[#0a0a0a]">
// Change purple-900 and blue-900 to your colors

// Line ~87 - Button color
<button className="bg-blue-600 hover:bg-blue-700">
// Change blue-600/700 to your brand colors
```

### Change Modal Size

```jsx
// Line ~13 - Modal container
<div className="max-w-3xl max-h-[90vh]">
// Change to:
// max-w-4xl for larger
// max-w-2xl for smaller
```

### Change Comment Limit

```jsx
// Line ~146 - Comments slice
{userComments.slice(0, 10).map(...)}
// Change 10 to show more/fewer comments
```

---

## 🐛 Troubleshooting

### Issue 1: "Module not found" errors

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: Backend won't start

**Solution**:
```bash
# Check if port 5000 is in use
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process or use a different port
```

### Issue 3: Modal not opening

**Solution**:
1. Open browser console (F12)
2. Check for errors
3. Verify `UserProfileModal` import in `CommentSection.jsx`
4. Clear browser cache (Ctrl+Shift+R)

### Issue 4: Images not loading

**Solution**:
1. Check if you're logged in with AniList
2. Verify `userAvatar` is being saved in comments
3. Check browser console for CORS errors

### Issue 5: "Cannot GET /login"

**Solution**:
Your AniList redirect URI might be wrong. Check:
1. `.env` file: `VITE_ANILIST_REDIRECT_URI=http://localhost:5173/login`
2. AniList Developer Settings: Redirect URI should match exactly

---

## 📱 Mobile Testing

To test on mobile devices:

1. Find your computer's local IP:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. Update Vite config to allow network access:
   ```javascript
   // vite.config.js
   export default defineConfig({
     server: {
       host: '0.0.0.0', // Allow network access
       port: 5173
     }
   })
   ```

3. Access from mobile: `http://YOUR_IP:5173`

---

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `VITE_ANILIST_CLIENT_ID`
   - `VITE_ANILIST_CLIENT_SECRET`
   - `VITE_ANILIST_REDIRECT_URI` (change to production URL)
   - `VITE_COMMENT_API_URL` (change to production backend URL)
5. Deploy!

### Backend Deployment (Vercel)

1. Navigate to `comment-backend` folder
2. Deploy to Vercel:
   ```bash
   vercel
   ```
3. Note the deployed URL
4. Update frontend `.env` with new backend URL

---

## 📊 Dependencies

### Frontend Dependencies
- React 18+
- Vite
- Tailwind CSS
- Font Awesome
- React Router
- AniList API integration

### Backend Dependencies
- Express.js
- CORS
- In-memory storage (for comments)

---

## 🔒 Security Notes

- Never commit `.env` files to Git
- Keep your AniList credentials secure
- Use HTTPS in production
- Implement rate limiting for production
- Sanitize user inputs

---

## 📈 Performance Tips

1. **Use Production Build**:
   ```bash
   npm run build
   ```

2. **Enable Compression**: Add to backend
   ```bash
   npm install compression
   ```

3. **Optimize Images**: Use WebP format

4. **Cache API Responses**: Implement caching layer

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Frontend starts without errors (npm run dev)
- [ ] Backend starts without errors (npm start)
- [ ] Can login with AniList
- [ ] Can view anime details
- [ ] Comments section loads
- [ ] Can post new comments
- [ ] Clicking avatar opens profile modal
- [ ] Clicking username opens profile modal
- [ ] Modal displays user info correctly
- [ ] Statistics show correctly
- [ ] Recent comments load
- [ ] Modal closes properly
- [ ] No console errors (F12)
- [ ] Mobile responsive design works

---

## 📞 Support

If you encounter issues:

1. Check this README's troubleshooting section
2. Check browser console (F12) for errors
3. Check backend terminal for errors
4. Verify all environment variables are set
5. Clear browser cache and try again

---

## 🎯 What's Next?

Once everything is working:

1. **Customize the design** to match your brand
2. **Add more features** (see below)
3. **Deploy to production**
4. **Share with users**

### Future Enhancement Ideas:

- Pagination for user comments
- Filter comments by anime
- User follow/bookmark feature
- User badges and achievements
- Comment notifications
- Direct messaging
- User reputation system

---

## 📝 Important Files to Review

1. **`.env`** - Configure your API keys
2. **`src/components/comments/CommentSection.jsx`** - Main comment component
3. **`src/components/comments/UserProfileModal.jsx`** - User profile modal
4. **`comment-backend/api/index.js`** - Backend API with new endpoint

---

## 🎉 Enjoy Your Enhanced HaruAnime!

Your anime streaming platform now has a professional user profile feature that lets users view each other's profiles, statistics, and comment history.

**Features Summary**:
✅ Clickable user profiles
✅ Beautiful modal design
✅ Real AniList integration
✅ User statistics
✅ Recent comments
✅ Responsive & mobile-friendly
✅ Dark theme
✅ Smooth animations
✅ Keyboard accessible

---

**Version**: 1.0.0 with User Profile Feature
**Last Updated**: January 9, 2025

Happy streaming! 🎬🍿
