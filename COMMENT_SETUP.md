# 🎬 HaruAnime with Comment System - Complete Setup Guide

This is your HaruAnime frontend **with the comment system already integrated**. Everything is ready to go!

## 📦 What's Included

✅ **Complete HaruAnime frontend** with all existing features
✅ **Comment system** fully integrated in Watch.jsx
✅ **CommentSection component** already added
✅ **Environment variables** pre-configured
✅ **All styling** matching your dark theme

## 🚀 Quick Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Comment backend server running (see backend folder)

### Installation Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment**
The `.env` file is already configured with:
- All your existing API URLs
- AniList authentication
- Watch together server
- **Comment API URL** (pointing to localhost:5000)

**Important:** Make sure the comment backend is running on port 5000!

3. **Start Development Server**
```bash
npm run dev
```

The app will run on `http://localhost:5173` (or your configured port)

## 🎯 What's Changed

### New Files Added
- `src/components/comments/CommentSection.jsx` - The complete comment component

### Modified Files
- `src/pages/watch/Watch.jsx` - Added CommentSection import and component
- `.env` - Added `VITE_COMMENT_API_URL=http://localhost:5000`

### Where Comments Appear
Comments are displayed at the **bottom of the watch page**, after:
- Video player
- Episode list
- Anime information
- Related anime section

## 🔧 Configuration

### Comment API URL
In your `.env` file, you'll find:
```env
VITE_COMMENT_API_URL=http://localhost:5000
```

**For Development:**
- Keep as `http://localhost:5000` if backend runs locally

**For Production:**
- Update to your deployed backend URL
- Example: `VITE_COMMENT_API_URL=https://your-comment-api.vercel.app`

## 📱 Features Working

### Existing HaruAnime Features (All Working)
✅ Anime browsing and search
✅ Video player with multiple servers
✅ Episode management
✅ AniList integration
✅ Watch together
✅ Trending and recommendations
✅ All your existing features

### New Comment Features
✅ Post comments (requires login)
✅ Reply to comments
✅ Like/dislike comments
✅ Edit own comments
✅ Delete own comments
✅ Sort by Recent/Top/Oldest
✅ View reply threads
✅ Load more pagination
✅ Character counter
✅ Smart timestamps

## 🎨 Styling

The comment section perfectly matches your existing theme:
- Background: `#0a0a0a`, `#000000`
- Borders: `white/10`, `white/20`
- Text colors: white, gray-300, gray-400
- Same hover effects and transitions
- Fully responsive design

## 🔐 Authentication

Comments require users to be logged in with AniList:
- **Guest users** can view comments
- **Logged-in users** can post, edit, delete, like, and reply
- User avatars come from AniList profile

## 📝 Using Comments

### As a User:
1. Watch an anime episode
2. Scroll down to the comment section
3. Sign in with AniList (if not already)
4. Type your comment and click "Post Comment"
5. Like/dislike other comments
6. Reply to create discussions
7. Edit or delete your own comments

### Comment Features:
- **1000 character limit** with counter
- **Real-time validation**
- **Smart timestamps** (2h ago, 3d ago, etc.)
- **Edit indicator** shows when comments are edited
- **Reply threads** can be expanded/collapsed

## 🐛 Troubleshooting

### Comments Not Loading
**Problem:** Comments section shows "Loading..." forever
**Solution:**
1. Check backend is running on port 5000
2. Verify `VITE_COMMENT_API_URL` in `.env`
3. Check browser console for CORS errors
4. Make sure you're logged in

### Can't Post Comments
**Problem:** "Post Comment" button doesn't work
**Solution:**
1. Make sure you're logged in with AniList
2. Check backend server is running
3. Verify text is not empty
4. Check browser console for errors

### CORS Errors
**Problem:** Browser console shows CORS errors
**Solution:**
1. Update backend's allowed origins in `server.js`
2. Add your frontend URL to the allowed list
3. Restart backend server

### Backend Connection Failed
**Problem:** Cannot connect to comment backend
**Solution:**
1. Start backend: `cd backend && npm start`
2. Verify backend is on port 5000
3. Check MongoDB is connected
4. Visit `http://localhost:5000/health` (should return OK)

## 📂 Project Structure

```
HaruAnime-with-comments/
├── src/
│   ├── components/
│   │   ├── comments/
│   │   │   └── CommentSection.jsx  ← NEW: Comment component
│   │   ├── banner/
│   │   ├── cart/
│   │   ├── player/
│   │   └── ... (all existing components)
│   ├── pages/
│   │   └── watch/
│   │       └── Watch.jsx  ← MODIFIED: Added comments
│   └── ... (all other files)
├── .env  ← MODIFIED: Added comment API URL
├── package.json
└── ... (all other files)
```

## 🌐 Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Update .env for production:**
```env
VITE_COMMENT_API_URL=https://your-comment-backend.vercel.app
```

2. **Add environment variable in hosting platform:**
- Vercel: Settings → Environment Variables
- Netlify: Site settings → Environment variables

3. **Deploy as usual:**
```bash
npm run build
# Deploy the dist/ folder
```

### Important Notes
- Make sure backend is deployed first
- Update `VITE_COMMENT_API_URL` to production backend URL
- Configure CORS in backend to allow your frontend domain

## 🔗 Backend Connection

This frontend is configured to connect to the comment backend at:
- **Development:** `http://localhost:5000`
- **Production:** Update in `.env` file

**Make sure the backend is running before testing comments!**

See the `backend/` folder for backend setup instructions.

## 📊 What to Check

After setup, verify:
- [ ] Frontend runs without errors
- [ ] Can browse anime and watch episodes
- [ ] Comment section appears at bottom of watch page
- [ ] Can see existing comments (if any)
- [ ] Can post comment when logged in
- [ ] Can like/dislike comments
- [ ] Can reply to comments
- [ ] Can edit own comments
- [ ] Can delete own comments

## 💡 Tips

1. **Test Locally First**
   - Start backend on port 5000
   - Start frontend on default port
   - Test all features before deploying

2. **Clear Browser Cache**
   - If changes don't appear, clear cache
   - Do hard refresh (Ctrl+Shift+R)

3. **Check Console**
   - Open browser console (F12)
   - Look for any errors
   - Check network tab for failed requests

4. **MongoDB Connection**
   - Backend needs MongoDB to work
   - Use MongoDB Atlas for cloud hosting
   - Or local MongoDB for development

## 📚 Additional Resources

- **Backend Setup:** See `backend/README.md`
- **Comment Documentation:** See backend folder's documentation
- **Deployment Guide:** Check backend's DEPLOYMENT_GUIDE.md
- **Original HaruAnime:** All original features preserved

## 🎉 You're Ready!

Everything is set up and ready to go:
1. Install dependencies: `npm install`
2. Start backend (in backend folder)
3. Start frontend: `npm run dev`
4. Open browser and test comments!

**Enjoy your new comment system! 🚀**

---

## Quick Commands

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

**Need Help?**
- Check browser console for errors
- Verify backend is running
- Check environment variables
- Review documentation in backend folder
