#!/usr/bin/env node

/**
 * OAuth Backend Connection Test
 * Run this to verify all services are working correctly
 * 
 * Usage: node oauth-test.js
 */

const http = require('http');
const https = require('https');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        resolve({
          status: response.statusCode,
          data: data,
          headers: response.headers
        });
      });
    });
    request.on('error', reject);
    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testServices() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  OAuth Backend Connection Test                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const tests = [
    {
      name: 'Backend Health Check',
      url: 'http://localhost:3001/health',
      expected: 200
    },
    {
      name: 'Frontend Access',
      url: 'http://localhost:5173',
      expected: 200
    },
    {
      name: 'Token Endpoint (method check)',
      url: 'http://localhost:3001/api/auth/anilist-token',
      expected: 405 // Should reject GET with 405 Method Not Allowed
    }
  ];

  for (const test of tests) {
    try {
      console.log(`📋 Testing: ${test.name}...`);
      const result = await makeRequest(test.url);
      
      if (result.status === test.expected) {
        console.log(`   ✅ PASS - Status: ${result.status}\n`);
      } else {
        console.log(`   ⚠️  WARN - Expected ${test.expected}, got ${result.status}\n`);
      }
    } catch (error) {
      console.log(`   ❌ FAIL - ${error.message}\n`);
    }
  }

  console.log('═════════════════════════════════════════════════════════\n');
  console.log('Summary:');
  console.log('  ✓ Backend must be running on http://localhost:3001');
  console.log('  ✓ Frontend must be running on http://localhost:5173');
  console.log('  ✓ Both .env files must be configured correctly\n');
  console.log('To start backend: cd oauth-exchange-backend && npm start');
  console.log('To start frontend: cd HaruAnime-main && npm run dev\n');
}

testServices().catch(console.error);
