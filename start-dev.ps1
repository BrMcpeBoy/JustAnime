#!/usr/bin/env pwsh

# AniList OAuth Development - Start Both Servers
# This script starts the OAuth dev server and Vite app server in PowerShell

Write-Host @"
╔══════════════════════════════════════════════════════╗
║  AniList OAuth Development - Starting Servers       ║
╚══════════════════════════════════════════════════════╝

This will start:
1. OAuth Dev Server on port 3001
2. Vite App Server on port 5173

Keep both running for local development.

"@ -ForegroundColor Cyan

Write-Host "Starting OAuth Dev Server on port 3001..." -ForegroundColor Yellow
$env:PORT = 3001
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PSScriptRoot'; node dev-server.js`"" -PassThru

Start-Sleep -Seconds 2

Write-Host "Starting Vite App Server on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PSScriptRoot'; npm run dev`"" -PassThru

Write-Host @"

✓ Both servers started!

App: http://localhost:5173
OAuth: http://localhost:3001

Close either terminal to stop that server.
Press Ctrl+C to stop a server.

"@ -ForegroundColor Green
