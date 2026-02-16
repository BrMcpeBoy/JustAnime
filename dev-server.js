/**
 * Development Server for AniList OAuth (No external dependencies!)
 * 
 * Run this alongside your Vite dev server:
 * node dev-server.js
 * 
 * This handles the OAuth token exchange locally without CORS issues
 * Uses only Node.js built-in modules
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple .env file parser (no external dependencies)
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const env = {};
  
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      // Parse KEY=VALUE
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        const value = valueParts.join('='); // In case value contains '='
        env[key.trim()] = value.trim();
      }
    }
  } catch (err) {
    console.warn('⚠️  Could not read .env file:', err.message);
  }
  
  // Merge with process.env (process.env takes precedence)
  return { ...env, ...process.env };
}

const env = loadEnv();

const PORT = process.env.PORT || env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // OAuth token exchange endpoint
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

          // Get environment variables
          const clientId = env.VITE_ANILIST_CLIENT_ID || env.ANILIST_CLIENT_ID;
          const clientSecret = env.VITE_ANILIST_CLIENT_SECRET || env.ANILIST_CLIENT_SECRET;
          const redirectUri = env.VITE_ANILIST_REDIRECT_URI || env.ANILIST_REDIRECT_URI;

          if (!clientId || !clientSecret || !redirectUri) {
            console.error('Missing environment variables:', {
              clientId: !!clientId,
              clientSecret: !!clientSecret,
              redirectUri: !!redirectUri,
            });
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'Missing server configuration',
              details: 'Check ANILIST_CLIENT_ID, ANILIST_CLIENT_SECRET, ANILIST_REDIRECT_URI in .env',
            }));
            return;
          }

          console.log('Token exchange attempt:', {
            clientId,
            hasSecret: !!clientSecret,
            redirectUri,
            code: code.substring(0, 20) + '...',
          });

          // Exchange code for token
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
            console.error('Token exchange failed:', {
              status: tokenResponse.status,
              error: tokenData.error,
              description: tokenData.error_description,
            });
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: tokenData.error || 'Failed to exchange code for token',
              description: tokenData.error_description,
            }));
            return;
          }

          console.log('Token exchange successful');
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
      console.error('Request parsing error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }));
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  AniList OAuth Dev Server (Node.js)    ║
║  Running on http://localhost:${PORT}        ║
╚════════════════════════════════════════╝

Environment variables loaded:
${env.VITE_ANILIST_CLIENT_ID ? '✓' : '✗'} VITE_ANILIST_CLIENT_ID
${env.VITE_ANILIST_CLIENT_SECRET ? '✓' : '✗'} VITE_ANILIST_CLIENT_SECRET
${env.VITE_ANILIST_REDIRECT_URI ? '✓' : '✗'} VITE_ANILIST_REDIRECT_URI

Keep this running alongside:
  npm run dev

Endpoints:
  POST /api/auth/anilist-token - OAuth token exchange
  GET /health - Health check
  `);
});

// Error handling
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`\nSolutions:`);
    console.error(`1. Kill the process using port ${PORT}:`);
    console.error(`   Windows: netstat -ano | findstr :${PORT}`);
    console.error(`   Then: taskkill /PID <PID> /F`);
    console.error(`\n2. Use a different port:`);
    console.error(`   PORT=3000 node dev-server.js`);
    process.exit(1);
  } else {
    throw err;
  }
});
