/**
 * Token Exchange Utility for AniList OAuth
 * Uses backend endpoint to securely exchange code for token
 */

export async function tokenExchangeWithFallback(code, clientId, clientSecret, redirectUri) {
  // Use Vercel endpoint in production, local endpoint in development
  const vercelApiUrl = import.meta.env.VITE_ANILIST_TOKEN_API_URL || 'https://your-vercel-app.vercel.app/api/auth/anilist-token';
  const localApiUrl = '/api/auth/anilist-token';
  const apiUrl = import.meta.env.PROD ? vercelApiUrl : localApiUrl;

  console.log('Token Exchange Debug:', {
    PROD: import.meta.env.PROD,
    VITE_ANILIST_TOKEN_API_URL: import.meta.env.VITE_ANILIST_TOKEN_API_URL,
    apiUrl,
  });

  try {
    console.log('Attempting token exchange via backend at:', apiUrl);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error response:', errorData);
      throw new Error(`Backend error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const tokenData = await response.json();
    console.log('Token exchange successful');
    return tokenData;
  } catch (error) {
    console.error('Token exchange failed:', error.message);
    throw new Error(
      `Token exchange failed: ${error.message}\n\n` +
      'Make sure:\n' +
      '1) Backend is running at ' + apiUrl + '\n' +
      '2) VITE_ANILIST_TOKEN_API_URL is set correctly\n' +
      '3) Backend environment variables are configured\n' +
      '4) CORS is enabled on backend'
    );
  }
}
