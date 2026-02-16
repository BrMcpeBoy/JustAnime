import { useEffect, useState } from 'react';
// Utility to detect mobile devices
function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { tokenExchangeWithFallback } from '@/src/utils/corsProxy.utils';

export default function Login() {
  const isMobile = isMobileDevice();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing your login...');
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Skip if already processed to prevent double execution in strict mode
    if (hasProcessed) return;

    // If on mobile, do not redirect or change to desktop site
    if (isMobile) {
      // Mobile-specific logic can be added here if needed
      // For now, just stay on this page and process login as normal
    }

    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Check for OAuth error response
    if (error) {
      setHasProcessed(true);
      setStatus('error');
      setMessage(`OAuth Error: ${error} - ${errorDescription || 'Unknown error'}`);
      console.error('AniList OAuth Error:', { error, errorDescription });
      return;
    }

    if (user) {
      setHasProcessed(true);
      setStatus('success');
      setMessage('Already logged in!');
      return;
    }

    if (!code) {
      setHasProcessed(true);
      setStatus('error');
      setMessage('No authorization code received. Please try again.');
      console.error('No auth code in URL');
      return;
    }

    console.log('Auth code received:', code.substring(0, 20) + '...');
    console.log('Env vars loaded:', {
      clientId: import.meta.env.VITE_ANILIST_CLIENT_ID,
      redirectUri: import.meta.env.VITE_ANILIST_REDIRECT_URI,
      hasSecret: !!import.meta.env.VITE_ANILIST_CLIENT_SECRET,
    });

    // Exchange code for token
    const exchangeCode = async () => {
      try {
        const tokenData = await tokenExchangeWithFallback(
          code,
          import.meta.env.VITE_ANILIST_CLIENT_ID,
          import.meta.env.VITE_ANILIST_CLIENT_SECRET,
          import.meta.env.VITE_ANILIST_REDIRECT_URI
        );

        if (!tokenData || !tokenData.access_token) {
          throw new Error('No access token received from AniList');
        }

        // Get user info via GraphQL
        const userResponse = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
          body: JSON.stringify({
            query: `
              query {
                Viewer {
                  id
                  name
                  about
                  avatar {
                    large
                  }
                  bannerImage
                  statistics {
                    anime {
                      count
                      meanScore
                    }
                    manga {
                      count
                      meanScore
                    }
                  }
                }
              }
            `,
          }),
        });

        if (!userResponse.ok) {
          throw new Error(`HTTP ${userResponse.status}: Failed to fetch user information`);
        }

        const userData = await userResponse.json();

        if (userData.errors) {
          throw new Error(userData.errors[0]?.message || 'Failed to fetch user info');
        }

        if (!userData.data || !userData.data.Viewer) {
          throw new Error('No viewer data returned from AniList');
        }

        const viewer = userData.data.Viewer;

        // Store user data and token
        login({
          id: viewer.id,
          name: viewer.name,
          avatar: viewer.avatar?.large,
          banner: viewer.bannerImage,
          about: viewer.about,
          statistics: viewer.statistics,
        }, tokenData.access_token);

        setHasProcessed(true);
        setStatus('success');
        setMessage(`Welcome ${viewer.name}!`);

      } catch (err) {
        console.error('Login error:', err);
        setHasProcessed(true);
        setStatus('error');
        // More user-friendly error messages
        let errorMsg = err.message;
        if (errorMsg.includes('Failed to fetch')) {
          errorMsg = 'Network error. Make sure api/auth/anilist-token.js exists and is properly configured.';
        } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          errorMsg = 'Invalid code or credentials. Please try again.';
        } else if (errorMsg.includes('redirect_uri')) {
          errorMsg = 'Redirect URI mismatch. Check your .env and AniList app settings.';
        }
        setMessage(`Login failed: ${errorMsg}`);
      }
    };

    exchangeCode();
  }, [searchParams, isMobile]);

  return (
    <div className="w-full h-screen flex justify-center items-center bg-[#0a0a0a] px-4">
      <div className="flex flex-col w-fit h-fit items-center justify-center mx-auto">
        {status === 'processing' && (
          <>
            <FontAwesomeIcon 
              icon={faSpinner} 
              className="w-16 h-16 text-[#22b2ff] mb-6 animate-spin"
            />
            <h2 className="font-bold text-white text-[32px] tracking-tight text-center">Logging in</h2>
          </>
        )}

        {(status === 'success' || status === 'error') && (
          <>
            <div className="w-[300px] h-[300px] max-[500px]:w-[200px] max-[500px]:h-[200px] relative overflow-hidden rounded-lg">
              <img
                src={
                  status === 'success' ?
                    'https://media1.tenor.com/m/MSlshZS6CVYAAAAC/satoru-gojo---correndo.gif' :
                    'https://64.media.tumblr.com/tumblr_lhnjv52vzw1qcrzkko1_500.gif'
                }
                alt={status === 'success' ? 'Login Success' : 'Login Error'}
                className="w-full h-full object-cover grayscale"
              />
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            {status === 'success' && (
              <h2 className="font-bold text-white text-[32px] mt-8 tracking-tight text-center">Login Successful</h2>
            )}
            {status === 'error' && (
              <h2 className="font-bold text-white text-[32px] mt-8 tracking-tight text-center">Login Failed</h2>
            )}
          </>
        )}

        <p className={`text-center text-lg mt-2 ${
          status === 'error' ? 'text-red-400' :
          status === 'success' ? 'text-green-400' :
          'text-gray-300'
        }`}>
          {message}
        </p>
        {(status === 'success' || status === 'error') && (
          <button
            onClick={() => navigate('/home')}
            className="mt-8 bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800 py-2 px-4 w-fit rounded-3xl flex items-center gap-x-2"
          >
            <span className="text-[18px]">Back to homepage</span>
          </button>
        )}
      </div>
    </div>
  );
}
