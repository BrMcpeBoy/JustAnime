import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faRandom,
  faMagnifyingGlass,
  faXmark,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { Users, X, Radio, Globe, ExternalLink } from 'lucide-react';
import { useLanguage } from "@/src/context/LanguageContext";
import { useAuth } from "@/src/context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import { SearchProvider } from "@/src/context/SearchContext";
import WebSearch from "../searchbar/WebSearch";
import MobileSearch from "../searchbar/MobileSearch";
import UserProfile from "./UserProfile";
import { createWatchTogetherSocket } from "@/src/utils/watchTogetherSocket";
import { getTranslation } from "@/src/translations/translations";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [isNotHomePage, setIsNotHomePage] = useState(
    location.pathname !== "/" && location.pathname !== "/home"
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isWatchTogetherModalOpen, setIsWatchTogetherModalOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const loginBtnRef = useRef(null);

  // Disable body scrolling when Watch Together modal is open
  useEffect(() => {
    if (isWatchTogetherModalOpen) {
      // Save current values
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyPaddingRight = document.body.style.paddingRight;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyTop = document.body.style.top;
      const originalBodyWidth = document.body.style.width;
      
      // Get current scroll position
      const scrollY = window.scrollY;
      
      // Get scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Disable scrolling on both html and body
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Add padding to prevent layout shift when scrollbar disappears
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      // Cleanup: restore scrolling when modal closes
      return () => {
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.top = originalBodyTop;
        document.body.style.width = originalBodyWidth;
        document.body.style.paddingRight = originalBodyPaddingRight;
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isWatchTogetherModalOpen]);
  
  // Close login dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (loginBtnRef.current && !loginBtnRef.current.contains(event.target)) {
        setIsLoginDropdownOpen(false);
      }
    }
    if (isLoginDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLoginDropdownOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleHamburgerClick = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleRandomClick = () => {
    if (location.pathname === "/random") {
      window.location.reload();
    }
  };

  const handleJoinRoom = async () => {
    const trimmedRoomId = roomCode.trim().toUpperCase();
    
    if (!trimmedRoomId) {
      setJoinError('Please enter a room code');
      return;
    }

    if (trimmedRoomId.length !== 6) {
      setJoinError('Room code must be 6 characters');
      return;
    }

    // Validate with backend before joining
    setIsValidating(true);
    setJoinError('');

    try {
      // Get socket server URL from environment variable
      const socketServerUrl = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';
      console.log('🔍 Validating room with server:', socketServerUrl);
      console.log('🔍 Room code:', trimmedRoomId);

      // Method 1: Try HTTP endpoint first (cleaner and faster)
      try {
        const response = await fetch(`${socketServerUrl}/api/room/${trimmedRoomId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const roomData = await response.json();
          console.log('✅ Room exists:', roomData);
          
          // Room exists! Navigate to watch page with room info
          navigate(`/watch-together/${roomData.animeId}?ep=${roomData.episodeId}&room=${trimmedRoomId}&server=HD-2`);
          setIsWatchTogetherModalOpen(false);
          setRoomCode('');
          setJoinError('');
          setIsValidating(false);
          return;
        } else if (response.status === 404) {
          // Room not found
          console.error('❌ Room not found');
          setIsValidating(false);
          setJoinError('Code is not correct. Please check the room code.');
          return;
        } else {
          // Other error, try socket validation as fallback
          console.warn('⚠️ HTTP check failed, trying socket validation...');
          throw new Error('HTTP check failed');
        }
      } catch (httpError) {
        console.warn('⚠️ HTTP validation failed, trying socket validation:', httpError.message);
        
        // Method 2: Fallback to socket validation
        const tempSocket = createWatchTogetherSocket();
        const tempUsername = `Validator${Math.floor(Math.random() * 10000)}`;

        // Set up listeners before connecting
        const joinPromise = new Promise((resolve, reject) => {
          // Success - room exists
          tempSocket.on('joined-room', (data) => {
            console.log('✅ Room validation successful:', data);
            resolve(data);
          });

          // Error - room doesn't exist or other error
          tempSocket.on('join-error', (data) => {
            console.error('❌ Room validation failed:', data);
            reject(new Error(data.message || 'Room not found'));
          });

          // Connection error
          tempSocket.on('connection-failed', (data) => {
            console.error('❌ Connection failed:', data);
            reject(new Error('Could not connect to server. Please check your connection.'));
          });

          // Timeout after 10 seconds
          setTimeout(() => {
            reject(new Error('Connection timeout. Please try again.'));
          }, 10000);
        });

        // Attempt to connect to the room
        console.log('🔍 Validating room via socket:', trimmedRoomId);
        tempSocket.connect(trimmedRoomId, tempUsername, false);

        // Wait for validation
        const roomData = await joinPromise;

        // Room exists! Disconnect temp socket and navigate
        tempSocket.disconnect();
        console.log('✅ Room validated, navigating to watch page');
        navigate(`/watch-together/${roomData.roomInfo.animeId}?ep=${roomData.roomInfo.episodeId}&room=${trimmedRoomId}&server=HD-2`);
        setIsWatchTogetherModalOpen(false);
        setRoomCode('');
        setJoinError('');
        setIsValidating(false);
      }

    } catch (error) {
      console.error('❌ Room validation error:', error);
      setIsValidating(false);
      
      // Set appropriate error message
      if (error.message.includes('Room not found') || error.message.includes('banned') || error.message.includes('kicked')) {
        setJoinError('Code is not correct. Please check the room code.');
      } else if (error.message.includes('timeout')) {
        setJoinError('Connection timeout. Please check your internet connection and try again.');
      } else if (error.message.includes('connect to server')) {
        setJoinError('Cannot connect to server. Please try again later.');
      } else {
        setJoinError('Code is not correct. Please check the room code.');
      }
    }
  };

  useEffect(() => {
    setIsNotHomePage(
      location.pathname !== "/" && location.pathname !== "/home"
    );
  }, [location.pathname]);

  return (
    <SearchProvider>
      <nav
        className={`fixed top-0 left-0 w-full z-[1000000] transition-all duration-300 ease-in-out bg-[#0a0a0a]
          ${isScrolled ? "bg-opacity-80 backdrop-blur-md shadow-lg" : "bg-opacity-100"}`}
      >
        <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <FontAwesomeIcon
                icon={faBars}
                className="text-xl text-gray-200 cursor-pointer hover:text-white hover:scale-110 transition-all"
                onClick={handleHamburgerClick}
              />
              {location.pathname.startsWith('/watch-together/') ? (
                <button 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('watchTogetherNavigationAttempt', { 
                      detail: { path: '/home' } 
                    }));
                  }}
                  className="flex items-center"
                >
                  <img src="/logo.png" alt="JustAnime Logo" className="h-9 w-auto" />
                </button>
              ) : (
                <Link to="/home" className="flex items-center">
                  <img src="/logo.png" alt="JustAnime Logo" className="h-9 w-auto" />
                </Link>
              )}
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 flex justify-center items-center max-w-none mx-8 hidden md:flex">
            <div className="flex items-center gap-2 w-[600px]">
              <WebSearch />
              <Link
                to={location.pathname === "/random" ? "#" : "/random"}
                onClick={handleRandomClick}
                className="p-[10px] aspect-square bg-[#000000]/75 text-white/50 rounded-lg border border-white/10 hover:bg-[#1a1a1a] hover:border-white/20 hover:text-white transition-all flex items-center justify-center"
                title="Random Anime"
              >
                <FontAwesomeIcon icon={faRandom} className="text-lg" />
              </Link>
              <button
                onClick={() => setIsWatchTogetherModalOpen(true)}
                className="p-[10px] aspect-square bg-[#000000]/75 text-white/50 rounded-lg border border-white/10 hover:bg-[#1a1a1a] hover:border-white/20 hover:text-white transition-all flex items-center justify-center"
                title="Watch Together"
              >
                <Radio className="w-[1.125rem] h-[1.125rem]" />
              </button>
            </div>
          </div>

          {/* Language Toggle - Desktop */}
            <div className="hidden md:flex items-center gap-2 bg-[#000000] rounded-lg border border-white/10 hover:border-white/20 transition-colors p-1">
              {["en", "kh"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1 text-sm font-medium rounded ${
                    language?.toLowerCase() === lang
                      ? "bg-[#1a1a1a] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

          {/* Mobile Search & Login Buttons */}
          <div className="flex items-center ml-2 gap-2 relative" ref={loginBtnRef}>
            {/* Mobile Search Icon */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-[10px] aspect-square bg-[#000000]/75 text-white/50 hover:bg-[#1a1a1a] hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-all flex items-center justify-center w-[38px] h-[38px]"
              title={isMobileSearchOpen ? "Close Search" : "Search Anime"}
            >
              <FontAwesomeIcon 
                icon={isMobileSearchOpen ? faXmark : faMagnifyingGlass} 
                className="w-[18px] h-[18px] transition-transform duration-200"
                style={{ transform: isMobileSearchOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
              />
            </button>
            
            {/* User Profile or Login Button */}
            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <button
                onClick={() => setIsLoginDropdownOpen((v) => !v)}
                className="p-[10px] aspect-square bg-[#000000]/75 text-white/50 hover:bg-[#1a1a1a] hover:text-white rounded-lg border border-white/100 hover:border-white/200 transition-all flex items-center justify-center w-[38px] h-[38px] relative"
                title="Login"
                aria-haspopup="true"
                aria-expanded={isLoginDropdownOpen}
              >
                <FontAwesomeIcon icon={faUser} className="w-[18px] h-[18px]" />
              </button>
            )}
            
            {isLoginDropdownOpen && !isAuthenticated && (
              <div className="absolute right-0 top-14 z-50 w-64 bg-[#0a0a0a] rounded-xl shadow-2xl border border-white/10 backdrop-blur-md overflow-hidden">
                <div className="p-4">
                  <div className="font-semibold text-white text-base mb-1 text-center">{getTranslation(language, 'connectAccount')}</div>
                  <div className="text-xs text-gray-400 mb-4 text-center">{getTranslation(language, 'trackProgress')}</div>
                  
                  <div className="flex flex-col gap-2">
                    {/* AniList Login Button */}
                    <a
                      href={`https://anilist.co/api/v2/oauth/authorize?client_id=${import.meta.env.VITE_ANILIST_CLIENT_ID}&redirect_uri=${encodeURIComponent(import.meta.env.VITE_ANILIST_REDIRECT_URI)}&response_type=code`}
                      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-[#000000] border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] text-white font-medium text-sm transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <img 
                        src="/anilist.png" 
                        alt="AniList" 
                        className="w-6 h-6 object-contain"
                      />
                      <span>{getTranslation(language, 'loginWithAnilist')}</span>
                    </a>
                    
                    {/* MAL Login Button */}
                    <a
                      href="/auth/mal"
                      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-[#000000] border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] text-white font-medium text-sm transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <img 
                        src="/mal.png" 
                        alt="MyAnimeList" 
                        className="w-6 h-6 object-contain"
                      />
                      <span>{getTranslation(language, 'loginWithMAL')}</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        {isMobileSearchOpen && (
          <div className="md:hidden bg-[#0a0a0a] shadow-lg">
            <MobileSearch onClose={() => setIsMobileSearchOpen(false)} />
        </div>
        )}

        {/* Watch Together Modal */}
        {isWatchTogetherModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-4">
            <div className={`bg-[#0a0a0a] border border-white/10 rounded-lg w-full shadow-2xl max-h-[92vh] md:max-h-[95vh] overflow-y-auto ${!isAuthenticated ? 'max-w-sm' : 'max-w-4xl'}`}>
              {/* Header */}
              <div className="flex items-center justify-between p-2.5 md:p-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white/80" />
                  <h2 className="text-sm md:text-base font-semibold text-white">{getTranslation(language, 'watchTogether')}</h2>
                </div>
                <button
                  onClick={() => {
                    setIsWatchTogetherModalOpen(false);
                    setRoomCode('');
                    setJoinError('');
                    setIsValidating(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Show Login UI if not authenticated */}
              {!isAuthenticated ? (
                <div className="p-3">
                  <div className="text-center mb-3">
                    <p className="text-white text-sm font-semibold mb-0.5">{getTranslation(language, 'loginRequired')}</p>
                    <p className="text-gray-400 text-xs">
                      {getTranslation(language, 'loginRequiredDesc')}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {/* AniList Login Button */}
                    <a
                      href={`https://anilist.co/api/v2/oauth/authorize?client_id=${import.meta.env.VITE_ANILIST_CLIENT_ID}&redirect_uri=${encodeURIComponent(import.meta.env.VITE_ANILIST_REDIRECT_URI)}&response_type=code`}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#000000] border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] text-white font-medium text-sm transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <img 
                        src="/anilist.png" 
                        alt="AniList" 
                        className="w-5 h-5 object-contain"
                      />
                      <span>{getTranslation(language, 'loginWithAnilist')}</span>
                    </a>
                    
                    {/* MAL Login Button */}
                    <a
                      href="/auth/mal"
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#000000] border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] text-white font-medium text-sm transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <img 
                        src="/mal.png" 
                        alt="MyAnimeList" 
                        className="w-5 h-5 object-contain"
                      />
                      <span>{getTranslation(language, 'loginWithMAL')}</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3 md:p-6">
                  <div className="grid gap-3 md:gap-5 grid-cols-1 md:grid-cols-2">
                    {/* Public Room Card */}
                    <div className="bg-[#000000] rounded-lg p-3 md:p-5 border border-white/10 hover:border-white/20 transition-colors flex flex-col min-h-[200px] md:min-h-[280px]">
                      <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
                        <Globe className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-sm md:text-base font-medium text-white mb-1">
                            {getTranslation(language, 'public')}
                          </h3>
                          <p className="text-gray-400 text-xs md:text-sm">
                            {getTranslation(language, 'browsePublicRooms')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsWatchTogetherModalOpen(false);
                          navigate('/public-rooms');
                        }}
                        className="w-full bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white font-medium py-2 md:py-3 px-4 rounded-lg transition-colors border border-white/10 hover:border-white/20 text-sm mt-auto"
                      >
                        {getTranslation(language, 'viewPublicRooms')}
                      </button>
                    </div>

                    {/* Join Room Card - Direct input */}
                    <div className="bg-[#000000] rounded-lg p-3 md:p-5 border border-white/10 hover:border-white/20 transition-colors flex flex-col min-h-[200px] md:min-h-[280px]">
                      <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
                        <span className="text-xl md:text-2xl">🔗</span>
                        <div className="flex-1">
                          <h3 className="text-sm md:text-base font-medium text-white mb-1">
                            {getTranslation(language, 'joinARoom')}
                          </h3>
                          <p className="text-gray-400 text-xs md:text-sm">
                            {getTranslation(language, 'enterRoomCodeDesc')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 md:gap-3 mt-auto">
                        <input
                          type="text"
                          value={roomCode}
                          onChange={(e) => {
                            setRoomCode(e.target.value.toUpperCase());
                            setJoinError('');
                          }}
                          placeholder="6-CHAR CODE"
                          maxLength="6"
                          disabled={isValidating}
                          className={`w-full bg-[#0a0a0a] border rounded-lg px-3 py-2 md:py-3 text-white text-xs md:text-sm placeholder-gray-500 focus:outline-none transition-colors text-center font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                            joinError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-white/30'
                          }`}
                          onKeyPress={(e) => e.key === 'Enter' && !isValidating && handleJoinRoom()}
                        />
                        <button
                          onClick={handleJoinRoom}
                          disabled={!roomCode.trim() || roomCode.length !== 6 || isValidating}
                          className="w-full bg-[#0a0a0a] hover:bg-[#1a1a1a] disabled:bg-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 md:py-3 px-4 rounded-lg transition-colors border border-white/10 hover:border-white/20 disabled:border-white/10 text-sm flex items-center justify-center gap-2"
                        >
                          {isValidating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                              <span>{getTranslation(language, 'validating')}</span>
                            </>
                          ) : (
                            getTranslation(language, 'joinRoomButton')
                          )}
                        </button>
                      </div>
                      {joinError && (
                        <div className="mt-2 md:mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2 md:p-3">
                          <span className="flex-shrink-0 text-red-400 text-sm md:text-base">⚠️</span>
                          <p className="text-red-400 text-xs md:text-sm font-medium">{joinError}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} onOpenWatchTogether={() => setIsWatchTogetherModalOpen(true)} />
      </nav>
    </SearchProvider>
  );
}

export default Navbar;
