import { useAuth } from '@/src/context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/src/context/LanguageContext';
import { getTranslation } from '@/src/translations/translations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faUser, faCog, faUserCircle, faCircleDollarToSlot, faGear, faAddressBook, faPodcast, faShieldHalved, faBell } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import NotificationModal from './NotificationModal';

export default function UserProfile() {
  const { user, logout, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [aniListActive, setAniListActive] = useState(true);
  const [donateOpen, setDonateOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [profileBackground, setProfileBackground] = useState(() => {
    return localStorage.getItem('profileBackground') || null;
  });
  const isWatchTogether = location.pathname.startsWith('/watch-together/');

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const COMMENT_API_URL = import.meta.env.VITE_COMMENT_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const saved = localStorage.getItem('aniListActive');
    if (saved !== null) {
      setAniListActive(JSON.parse(saved));
    }

    // Listen for changes
    const handleStorageChange = () => {
      const saved = localStorage.getItem('aniListActive');
      if (saved !== null) {
        setAniListActive(JSON.parse(saved));
      }
    };

    const handleBackgroundChange = () => {
      const savedBg = localStorage.getItem('profileBackground');
      setProfileBackground(savedBg);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileBackgroundChanged', handleBackgroundChange);
    
    // Poll for changes every 500ms (for same-tab updates)
    const checkInterval = setInterval(() => {
      const saved = localStorage.getItem('aniListActive');
      if (saved !== null) {
        const newValue = JSON.parse(saved);
        setAniListActive(prev => prev !== newValue ? newValue : prev);
      }
      
      // Also check background changes
      const savedBg = localStorage.getItem('profileBackground');
      setProfileBackground(prev => prev !== savedBg ? savedBg : prev);
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileBackgroundChanged', handleBackgroundChange);
      clearInterval(checkInterval);
    };
  }, []);

  // Fetch unread notification count + check for new community broadcasts
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id) return;
      
      try {
        // Check for new community broadcasts first (inject them as notifications for this user)
        const lastSeen = localStorage.getItem('communityLastSeen') || '';
        try {
          const communityRes = await fetch(
            `${COMMENT_API_URL}/api/community/latest?userId=${user.id}${lastSeen ? `&lastSeen=${encodeURIComponent(lastSeen)}` : ''}`
          );
          if (communityRes.ok) {
            const communityData = await communityRes.json();
            if (communityData.success && communityData.count > 0) {
              // Update lastSeen to now so we don't re-inject same broadcasts
              localStorage.setItem('communityLastSeen', new Date().toISOString());
            }
          }
        } catch (communityErr) {
          // Silently fail community check
          console.warn('Community broadcast check failed:', communityErr);
        }

        const response = await fetch(`${COMMENT_API_URL}/api/notifications/${user.id}/unread-count`);
        
        // If endpoint doesn't exist, silently fail
        if (!response.ok) {
          if (response.status === 404) {
            console.warn('Notification endpoint not found. Please set up backend.');
            return;
          }
        }
        
        const data = await response.json();
        
        if (data.success) {
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
        // Silently fail - don't break the UI
      }
    };

    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id, COMMENT_API_URL]);

  const handleLogout = () => {
    if (isWatchTogether) {
      window.dispatchEvent(new CustomEvent('watchTogetherNavigationAttempt', { 
        detail: { path: '/logout-success', action: 'logout' } 
      }));
      setIsOpen(false);
    } else {
      logout();
      setIsOpen(false);
      navigate('/logout-success');
    }
  };

  const handleNavigate = (path) => {
    if (isWatchTogether) {
      window.dispatchEvent(new CustomEvent('watchTogetherNavigationAttempt', { 
        detail: { path } 
      }));
      setIsOpen(false);
    } else {
      navigate(path);
      setIsOpen(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Avatar Button - Clean style matching EN/JP */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg border border-white/10 bg-[#000000] hover:bg-[#1a1a1a] hover:border-white/20 cursor-pointer transition-all duration-200"
        aria-label="User menu"
      >
        {/* Avatar */}
        <div className="w-[30px] h-[30px] rounded-md overflow-hidden flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="text-white text-sm" />
            </div>
          )}
        </div>
        
        {/* Small Arrow */}
        <svg 
          className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path 
            stroke="currentColor" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 top-14 z-50 w-64 bg-[#0a0a0a] rounded-xl shadow-2xl border border-white/10 backdrop-blur-md overflow-hidden"
        >
          {/* Content */}
          <div className="relative z-10">
          {/* Profile Section */}
          <div className="px-3 py-4 border-b border-white/5 relative overflow-hidden min-h-[80px]">
            {/* Dynamic background - synced with Profile.jsx */}
            {profileBackground ? (
              profileBackground.endsWith('.mp4') ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="absolute inset-0 w-full h-full"
                  style={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    filter: 'brightness(1.1)',
                    imageRendering: '-webkit-optimize-contrast',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    willChange: 'transform',
                    WebkitFontSmoothing: 'antialiased'
                  }}
                >
                  <source src={profileBackground} type="video/mp4" />
                </video>
              ) : (
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage: `url("${profileBackground}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: 'brightness(1.1)',
                    imageRendering: '-webkit-optimize-contrast',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    willChange: 'transform',
                    WebkitFontSmoothing: 'antialiased'
                  }}
                />
              )
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
            
            <div className="relative z-10 flex items-center gap-2.5">
              <div className="relative flex-shrink-0">
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-11 h-11 rounded-full object-cover ring-1.5 ring-white/30 shadow-md"
                  />
                )}
                {!user.avatar && (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center ring-1.5 ring-white/30 shadow-md">
                    <FontAwesomeIcon icon={faUser} className="text-white text-sm" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-0.5">
                  <span 
                    className="font-bold text-white text-[15px] truncate leading-snug uppercase tracking-wide"
                    style={{ letterSpacing: '0.5px', fontWeight: '700', lineHeight: '1.2' }}
                  >
                    {user.name}
                  </span>
                  {aniListActive && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[11px] text-white/80 font-medium normal-case tracking-normal">Connected to AniList</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Bell Notification Button */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => {
                    setNotificationModalOpen(true);
                    setIsOpen(false); // Close dropdown when opening notifications
                  }}
                  className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 border border-white/10"
                  aria-label="Notifications"
                >
                  <FontAwesomeIcon icon={faBell} className="w-4 h-4 text-white/80" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#0a0a0a]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-2 py-2 flex flex-col">

            <button
              onClick={() => handleNavigate('/profile')}
              className="flex items-center gap-3 w-full px-3 py-2 text-white rounded-md transition-all duration-300 text-sm font-medium bg-[#0a0a0a] hover:bg-[#1a1a1a]"
            >
              <FontAwesomeIcon icon={faUserCircle} className="w-4 h-4 text-white/70" />
              <span>{getTranslation(language, 'myProfile')}</span>
            </button>
            <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <button
              onClick={() => handleNavigate('/settings')}
              className="flex items-center gap-3 w-full px-3 py-2 text-white rounded-md transition-all duration-300 text-sm font-medium bg-[#0a0a0a] hover:bg-[#1a1a1a]"
            >
              <FontAwesomeIcon icon={faGear} className="w-4 h-4 text-white/70" />
              <span>{getTranslation(language, 'settings')}</span>
            </button>
            <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Donate Button with QR Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDonateOpen((prev) => !prev)}
                className={`flex items-center gap-3 w-full px-3 py-2 text-white rounded-md transition-all duration-300 text-sm font-medium bg-[#0a0a0a] hover:bg-green-600/20 hover:text-green-400 ${donateOpen ? 'ring-2 ring-green-400/60' : ''}`}
                style={{ marginTop: 0 }}
              >
                <FontAwesomeIcon
                  icon={faCircleDollarToSlot}
                  className="w-4 h-4 text-green-400"
                />
                <span>{getTranslation(language, 'donate')}</span>
                <svg className={`ml-auto transition-transform duration-200 ${donateOpen ? 'rotate-180' : ''}`} width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>
              </button>
              {donateOpen && (
                <div className="flex flex-col items-center py-3 animate-fade-in">
                  <img
                    src="/qr.png"
                    alt="QR Code"
                    className="w-24 h-24 object-contain rounded-lg border border-white/10 bg-[#23232b] p-2 shadow-md"
                    style={{ background: 'rgba(20,22,30,0.85)' }}
                  />
                  <a
                    href="/qr.png"
                    download="HaruAnime-Donate-QR.png"
                    className="mt-2 px-3 py-1 bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded text-xs font-semibold border border-green-400/30 transition-colors"
                  >
                    {getTranslation(language, 'downloadQR')}
                  </a>
                </div>
              )}
            </div>
            <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />


            {/* Contact, DMCA, Terms of Service */}

            <button
              onClick={() => handleNavigate('/contact')}
              className="flex items-center gap-3 w-full px-3 py-2 text-white rounded-md transition-all duration-300 text-sm font-medium bg-[#0a0a0a] hover:bg-[#1a1a1a]"
            >
              <FontAwesomeIcon icon={faAddressBook} className="w-4 h-4 text-white/70" />
              <span>{getTranslation(language, 'contact')}</span>
            </button>
            <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <button
              onClick={() => handleNavigate('/dmca')}
              className="flex items-center gap-3 w-full px-3 py-2 text-white rounded-md transition-all duration-300 text-sm font-medium bg-[#0a0a0a] hover:bg-[#1a1a1a]"
            >
              <FontAwesomeIcon icon={faPodcast} className="w-4 h-4 text-white/70" />
              <span>{getTranslation(language, 'dmca')}</span>
            </button>
            <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {isWatchTogether ? (
              <button
                onClick={() => handleNavigate('/terms-of-service')}
                className="flex items-center gap-3 w-full px-3 py-2 text-white rounded-md transition-all duration-300 text-sm font-medium bg-[#0a0a0a] hover:bg-[#1a1a1a]"
              >
                <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-white/70" />
                <span>{getTranslation(language, 'termsOfService')}</span>
              </button>
            ) : (
              <Link
                to="/terms-of-service"
                className="flex items-center gap-3 w-full px-3 py-2 text-white rounded-md transition-all duration-300 text-sm font-medium bg-[#0a0a0a] hover:bg-[#1a1a1a]"
                onClick={() => setIsOpen(false)}
              >
                <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-white/70" />
                <span>{getTranslation(language, 'termsOfService')}</span>
              </Link>
            )}

            <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-white rounded-md transition-all duration-300 text-sm font-medium bg-[#0a0a0a] hover:bg-red-500/10 hover:text-red-400"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4 text-red/70" />
              <span>{getTranslation(language, 'logout')}</span>
            </button>
          </div>
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        userId={user?.id}
      />
    </div>
  );
}
