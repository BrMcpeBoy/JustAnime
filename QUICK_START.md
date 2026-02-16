# 🚀 Quick Start Guide

## Welcome to HaruAnime with User Profile Feature!

### ⚡ Get Started in 5 Minutes

#### 1. Install Dependencies
```bash
npm install
cd comment-backend && npm install && cd ..
```

#### 2. Configure Environment
Create `.env` file in root:
```env
VITE_ANILIST_CLIENT_ID=your_client_id
VITE_ANILIST_CLIENT_SECRET=your_client_secret
VITE_ANILIST_REDIRECT_URI=http://localhost:5173/login
VITE_COMMENT_API_URL=http://localhost:5000
VITE_API_BASE_URL=https://api.ani.zip
VITE_CONSUMET_API=https://api-consumet-org-beryl.vercel.app
```

Get AniList credentials: https://anilist.co/settings/developer

#### 3. Start Servers

**Terminal 1 - Backend:**
```bash
cd comment-backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

#### 4. Open Browser
Go to: **http://localhost:5173**

---

## ✨ New Feature: User Profiles

### How to Use:
1. Login with AniList
2. Go to any anime's watch page
3. Click on any user's **avatar** or **username** in comments
4. A beautiful modal opens showing:
   - User's profile with blurred background
   - Statistics (comments, likes, replies)
   - Recent comment history
   - Link to AniList profile

---

## 📚 Documentation

- **USER_PROFILE_FEATURE_SETUP.md** - Complete setup guide
- **README.md** - Project overview
- **comment-backend/README.md** - Backend documentation

---

## 🐛 Troubleshooting

**Modal not opening?**
- Check browser console (F12)
- Clear cache (Ctrl+Shift+R)

**Backend errors?**
- Check port 5000 is not in use
- Verify environment variables

**Images not loading?**
- Make sure you're logged in with AniList
- Check CORS configuration

---

## ✅ Verification

Test these features:
- [ ] Login with AniList works
- [ ] Comments load correctly
- [ ] Clicking avatar opens profile modal
- [ ] Modal displays user info
- [ ] Modal closes properly
- [ ] No console errors

---

**Need Help?** Read USER_PROFILE_FEATURE_SETUP.md for detailed instructions!

**Enjoy your enhanced anime streaming experience!** 🎬✨
