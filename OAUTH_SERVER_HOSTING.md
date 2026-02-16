# 🔐 OAuth Server - Complete Hosting Guide

This guide contains everything needed to host the AniList OAuth server on any platform.

---

## 📋 What You Need

### Environment Variables (Required)
Set these in your hosting platform:

```
VITE_ANILIST_CLIENT_ID=your_client_id_here
VITE_ANILIST_CLIENT_SECRET=your_client_secret_here
VITE_ANILIST_REDIRECT_URI=https://your-domain.com/login (production URL)
```

### Get These Values From:
1. Go to https://anilist.co/settings/developer
2. Create/Edit your application
3. Copy the Client ID and Client Secret
4. Set the Redirect URI to your app's login callback URL

---

## 🚀 Deployment Options

### Option 1: Vercel (RECOMMENDED - Easiest)

#### Setup:
1. Push your code to GitHub
2. Connect to Vercel: https://vercel.com/import
3. Select your repository
4. Vercel auto-detects the `/api` folder
5. Add Environment Variables in Vercel Dashboard:
   - `VITE_ANILIST_CLIENT_ID`
   - `VITE_ANILIST_CLIENT_SECRET`
   - `VITE_ANILIST_REDIRECT_URI`
6. Deploy

#### Why Vercel:
✅ Auto-scales  
✅ Free tier available  
✅ No server maintenance  
✅ Already configured in your `/api/auth/anilist-token.js`  

**Your OAuth endpoint will be:**
```
https://your-project.vercel.app/api/auth/anilist-token
```

---

### Option 2: Heroku

#### Setup:
1. Create a `Procfile` in root:
   ```
   web: node oauth-server.js
   ```

2. Create `.env.production`:
   ```
   VITE_ANILIST_CLIENT_ID=your_value
   VITE_ANILIST_CLIENT_SECRET=your_value
   VITE_ANILIST_REDIRECT_URI=https://your-app.herokuapp.com
   ```

3. Deploy:
   ```bash
   heroku create your-app-name
   heroku config:set VITE_ANILIST_CLIENT_ID=your_value
   heroku config:set VITE_ANILIST_CLIENT_SECRET=your_value
   heroku config:set VITE_ANILIST_REDIRECT_URI=https://your-app.herokuapp.com
   git push heroku main
   ```

**Your OAuth endpoint will be:**
```
https://your-app.herokuapp.com/api/auth/anilist-token
```

---

### Option 3: Railway.app

#### Setup:
1. Go to https://railway.app
2. Connect your GitHub repo
3. Add service: Node.js
4. Add Environment Variables in dashboard
5. Set start command: `node oauth-server.js`
6. Deploy

**Your OAuth endpoint will be:**
```
https://your-project.up.railway.app/api/auth/anilist-token
```

---

### Option 4: Self-Hosted (VPS/Cloud)

#### For AWS EC2, DigitalOcean, Linode, etc:

1. SSH into your server
2. Install Node.js (v16+)
3. Clone your repository
4. Create `.env` file with credentials:
   ```
   VITE_ANILIST_CLIENT_ID=your_value
   VITE_ANILIST_CLIENT_SECRET=your_value
   VITE_ANILIST_REDIRECT_URI=https://your-domain.com
   PORT=3000
   ```

5. Install PM2 (process manager):
   ```bash
   npm install -g pm2
   pm2 start oauth-server.js --name "oauth-server"
   pm2 startup
   pm2 save
   ```

6. Setup Nginx reverse proxy:
   ```nginx
   server {
       listen 443 ssl;
       server_name api.your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

7. Setup SSL with Let's Encrypt:
   ```bash
   sudo certbot certonly --nginx -d api.your-domain.com
   ```

**Your OAuth endpoint will be:**
```
https://api.your-domain.com/api/auth/anilist-token
```

---

## 📁 OAuth Server Code

### For Vercel (`api/auth/anilist-token.js`)
```javascript
/**
 * Vercel Serverless Function for AniList OAuth
 * Deploy with your code to Vercel
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    const clientId = process.env.VITE_ANILIST_CLIENT_ID;
    const clientSecret = process.env.VITE_ANILIST_CLIENT_SECRET;
    const redirectUri = process.env.VITE_ANILIST_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({ 
        error: 'Missing server configuration',
        details: 'Check environment variables'
      });
    }

    const tokenResponse = await fetch('https://anilist.co/api/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(401).json({ 
        error: tokenData.error || 'Failed to exchange code for token',
        description: tokenData.error_description,
      });
    }

    return res.status(200).json(tokenData);
  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
```

### For Heroku/Self-Hosted (`oauth-server.js`)
```javascript
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const env = {};
  
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not read .env file:', err.message);
  }
  
  return { ...env, ...process.env };
}

const env = loadEnv();
const PORT = process.env.PORT || env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.url === '/api/auth/anilist-token' && req.method === 'POST') {
    try {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { code } = JSON.parse(body);

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No authorization code provided' }));
            return;
          }

          const clientId = env.VITE_ANILIST_CLIENT_ID || env.ANILIST_CLIENT_ID;
          const clientSecret = env.VITE_ANILIST_CLIENT_SECRET || env.ANILIST_CLIENT_SECRET;
          const redirectUri = env.VITE_ANILIST_REDIRECT_URI || env.ANILIST_REDIRECT_URI;

          if (!clientId || !clientSecret || !redirectUri) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'Missing server configuration',
              details: 'Check environment variables',
            }));
            return;
          }

          const tokenResponse = await fetch('https://anilist.co/api/v2/oauth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              grant_type: 'authorization_code',
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              code,
            }),
          });

          const tokenData = await tokenResponse.json();

          if (!tokenResponse.ok) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: tokenData.error || 'Failed to exchange code for token',
              description: tokenData.error_description,
            }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(tokenData));
        } catch (error) {
          console.error('Error processing request:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Internal server error',
            message: error.message,
          }));
        }
      });
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  AniList OAuth Server (Node.js)        ║
║  Running on http://localhost:${PORT}      ║
╚════════════════════════════════════════╝

Environment variables:
${env.VITE_ANILIST_CLIENT_ID ? '✓' : '✗'} VITE_ANILIST_CLIENT_ID
${env.VITE_ANILIST_CLIENT_SECRET ? '✓' : '✗'} VITE_ANILIST_CLIENT_SECRET
${env.VITE_ANILIST_REDIRECT_URI ? '✓' : '✗'} VITE_ANILIST_REDIRECT_URI

Endpoints:
  POST /api/auth/anilist-token - OAuth token exchange
  GET /health - Health check
  `);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`\nUse a different port: PORT=3001 node oauth-server.js`);
    process.exit(1);
  } else {
    throw err;
  }
});
```

---

## 🔧 Updating Your App for Production

Update your app to use the production OAuth URL:

### In `src/context/AuthContext.jsx` or your auth handler:
```javascript
// Use environment variable for API endpoint
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Token exchange
const response = await fetch(`${API_BASE_URL}/api/auth/anilist-token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code }),
});
```

### In `.env` (local):
```
VITE_API_BASE_URL=http://localhost:3001
```

### In `.env.production` (production):
```
VITE_API_BASE_URL=https://your-oauth-server.com
```

---

## ✅ Testing Your OAuth Server

```bash
# Test health check
curl https://your-oauth-server.com/health

# Test OAuth endpoint (with actual code from AniList)
curl -X POST https://your-oauth-server.com/api/auth/anilist-token \
  -H "Content-Type: application/json" \
  -d '{"code":"authorization_code_from_anilist"}'
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Missing Environment Variables
- Check your platform's dashboard for env vars
- Restart the server after adding new variables
- Verify exact spelling matches

### CORS Errors
- Server already handles CORS (`Access-Control-Allow-Origin: *`)
- Check that your request includes proper headers

### Token Exchange Fails
1. Verify AniList credentials are correct
2. Check REDIRECT_URI matches AniList settings
3. Ensure code hasn't expired (valid for ~10 minutes)
4. Check server logs for detailed error messages

---

## 📚 Additional Resources

- AniList API: https://anilist.co/api/v2/docs
- Vercel Deployment: https://vercel.com/docs
- OAuth 2.0 Spec: https://tools.ietf.org/html/rfc6749
