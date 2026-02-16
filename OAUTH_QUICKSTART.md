# 🚀 OAuth Login - Quick Start Guide

## TL;DR - Get Running in 30 Seconds

### What's Already Done ✓
- ✅ Backend (oauth-exchange-backend) is **ready** on port 3001
- ✅ Frontend (HaruAnime) is **ready** on port 5173
- ✅ Configuration is **correct**

### To Test Login NOW

**Step 1**: Open browser to `http://localhost:5173`

**Step 2**: Click the **"Login"** button

**Step 3**: Approve AniList permissions

**Step 4**: You're logged in! ✅

---

## If Servers Aren't Running

### Start Backend (Terminal 1)
```powershell
cd C:\Users\x\Desktop\oauth-exchange-backend
npm start
```
Wait for: `🚀 Backend server is running on http://localhost:3001`

### Start Frontend (Terminal 2)
```powershell
cd C:\Users\x\Desktop\HaruAnime-main
npm run dev
```
Wait for: `Local: http://localhost:5173`

---

## 🔍 Health Check

### Everything Working?
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok"}

curl http://localhost:5173
# Should return HTTP 200
```

---

## ⚠️ Common Issues

**"Connection refused on port 3001"**
- Backend not running
- Run: `cd oauth-exchange-backend && npm start`

**"Port 3001 already in use"**
```powershell
# Kill the process:
Get-NetTCPConnection -LocalPort 3001 | Stop-Process -Force
```

**"Login button not working"**
- Clear browser cache: `Ctrl+Shift+Delete`
- Try incognito/private mode
- Check both servers are running

**"Token exchange failed"**
- Verify both `.env` files are identical
- Restart backend server
- Check AniList app redirect URI is correct

---

## 📞 Need Help?

1. Check the detailed guides:
   - `OAUTH_COMPLETE_SETUP.md` - Full setup info
   - `OAUTH_INTEGRATION_GUIDE.md` - Technical details

2. Verify configuration:
   - `HaruAnime-main/.env` - Frontend config
   - `oauth-exchange-backend/.env` - Backend config

3. Test endpoints:
   - `http://localhost:3001/health` - Backend health
   - `http://localhost:5173` - Frontend access

---

**Status**: ✅ Ready to Test  
**Next**: Open `http://localhost:5173` and click Login!
