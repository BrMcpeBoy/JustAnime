import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, Copy, Check, ChevronDown, Lock, Globe } from 'lucide-react';
import { createWatchTogetherSocket } from '@/src/utils/watchTogetherSocket';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { getTranslation } from '@/src/translations/translations';

export default function WatchPartyModal({ animeId = null, episodeId = null, animeTitle = 'Unknown Anime', animePoster = null, episodeNumber = null, servers = null, onClose }) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [roomType, setRoomType] = useState('public'); // 'public' or 'private'
  const [selectedServer, setSelectedServer] = useState('HD-2'); // Default server
  const [showRoomTypeDropdown, setShowRoomTypeDropdown] = useState(false);
  const [showServerDropdown, setShowServerDropdown] = useState(false);
  
  // Check if dub is available for current episode
  const hasDubAvailable = servers && Array.isArray(servers) && servers.some(server => server.type === 'dub');
  
  // Set initial serverType based on dub availability
  const [serverType, setServerType] = useState(hasDubAvailable ? 'sub' : 'sub'); // Default to 'sub', only show 'dub' if available
  
  // Debug logging for serverType changes
  useEffect(() => {
    console.log('🎬 WatchPartyModal - serverType changed to:', serverType);
    console.log('🎬 WatchPartyModal - hasDubAvailable:', hasDubAvailable);
    console.log('🎬 WatchPartyModal - servers:', servers);
  }, [serverType, hasDubAvailable, servers]);

  // Disable body scrolling when modal is open
  useEffect(() => {
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
  }, []); // Empty dependency array - runs once on mount and cleanup on unmount

  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setIsCreating(true);
  };

  const handleStartWatching = () => {
    if (!animeId || !episodeId) {
      console.error('❌ Cannot create room: animeId or episodeId missing');
      alert('Please open this from a Watch page to create a room');
      return;
    }
    
    if (roomId) {
      const roomKey = `watch-together-room-${roomId}`;
      const roomData = {
        animeId,
        episodeId,
        animeTitle,
        animePoster,
        episodeNumber,
        createdAt: new Date().toISOString(),
        server: 'HD-2',
        serverType: serverType,
        roomType: roomType,
        isPrivate: roomType === 'private'
      };
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎬 WatchPartyModal - SAVING ROOM DATA');
      console.log('   Room ID:', roomId);
      console.log('   serverType state:', serverType);
      console.log('   Room data to save:', roomData);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      localStorage.setItem(roomKey, JSON.stringify(roomData));
      
      // Verify it was saved
      const savedData = JSON.parse(localStorage.getItem(roomKey));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ VERIFICATION - Room data saved:');
      console.log('   serverType in localStorage:', savedData.serverType);
      console.log('   Match with state?', savedData.serverType === serverType);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // ✅ Include audio parameter in URL so host gets correct audio type immediately
      navigate(`/watch-together/${animeId}?ep=${episodeId}&room=${roomId}&host=true&server=HD-2&audio=${serverType}`);
    }
  };

  const handleJoinRoom = async () => {
    const trimmedRoomId = joinRoomId.trim().toUpperCase();
    
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

  const copyRoomLink = () => {
    if (!animeId || !episodeId) {
      console.error('❌ Cannot copy room link: animeId or episodeId missing');
      return;
    }
    // CRITICAL: Include host=false and audio parameter so members join correctly
    const link = `${window.location.origin}/watch-together/${animeId}?ep=${episodeId}&room=${roomId}&server=HD-2&audio=${serverType}&host=false`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-4">
      <div className={`bg-[#0a0a0a] border border-white/10 rounded-lg w-full shadow-2xl max-h-[92vh] md:max-h-[95vh] overflow-y-auto ${!isAuthenticated ? 'max-w-sm' : 'max-w-4xl'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-2.5 md:p-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-white/80" />
            <h2 className="text-sm md:text-base font-semibold text-white">{getTranslation(language, "watchTogether")}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Show Login UI if not authenticated */}
        {!isAuthenticated ? (
          <div className="p-3">
            <div className="text-center mb-3">
              <p className="text-white text-sm font-semibold mb-0.5">{getTranslation(language, "loginRequired")}</p>
              <p className="text-gray-400 text-xs">
                {getTranslation(language, "loginRequiredDesc")}
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
                <span>{getTranslation(language, "loginWithAnilist")}</span>
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
                <span>{getTranslation(language, "loginWithMAL")}</span>
              </a>
            </div>
          </div>
        ) : !isCreating ? (
          <div className="p-3 md:p-6">
            {/* Grid: 2 columns on desktop if Create Room available, 1 column otherwise */}
            <div className={`grid gap-3 md:gap-5 ${animeId && episodeId ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Create Room Section - Only show if animeId and episodeId are provided */}
              {animeId && episodeId && (
                <div className="bg-[#000000] rounded-lg p-3 md:p-5 border border-white/10 hover:border-white/20 transition-colors flex flex-col">
                  <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
                    <span className="text-xl md:text-2xl">🎬</span>
                    <div className="flex-1">
                      <h3 className="text-sm md:text-base font-medium text-white mb-1">{getTranslation(language, "createRoom")}</h3>
                      <p className="text-gray-400 text-xs md:text-sm">
                        {getTranslation(language, "startWatchPartyDesc")}
                      </p>
                    </div>
                  </div>
                
                {/* Room Type Dropdown */}
                <div className="mb-2 md:mb-4">
                  <label className="text-gray-400 text-xs mb-1 md:mb-2 block">{getTranslation(language, "roomType")}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoomTypeDropdown(!showRoomTypeDropdown);
                        setShowServerDropdown(false);
                      }}
                      className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 md:py-2.5 text-white text-xs md:text-sm flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {roomType === 'public' ? (
                          <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                        )}
                        <span className="capitalize">{roomType}</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform ${showRoomTypeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showRoomTypeDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-[#0a0a0a] border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => {
                            setRoomType('public');
                            setShowRoomTypeDropdown(false);
                          }}
                          className="w-full px-3 py-2 md:py-2.5 text-left text-white hover:bg-white/5 flex items-center gap-2 transition-colors text-xs md:text-sm"
                        >
                          <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400" />
                          <span>{getTranslation(language, "publicRoom")}</span>
                        </button>
                        <button
                          onClick={() => {
                            setRoomType('private');
                            setShowRoomTypeDropdown(false);
                          }}
                          className="w-full px-3 py-2 md:py-2.5 text-left text-white hover:bg-white/5 flex items-center gap-2 transition-colors text-xs md:text-sm"
                        >
                          <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                          <span>{getTranslation(language, "privateRoom")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audio Selection Dropdown */}
                <div className="mb-2 md:mb-4">
                  <label className="text-gray-400 text-xs mb-1 md:mb-2 block">{getTranslation(language, "audio")}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowServerDropdown(!showServerDropdown);
                        setShowRoomTypeDropdown(false);
                      }}
                      className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 md:py-2.5 text-white text-xs md:text-sm flex items-center justify-between transition-colors"
                    >
                      <span>{serverType === 'sub' ? getTranslation(language, 'subAudio') : getTranslation(language, 'dubAudio')}</span>
                      <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform ${showServerDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showServerDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-[#0a0a0a] border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => {
                            setServerType('sub');
                            setShowServerDropdown(false);
                          }}
                          className="w-full px-3 py-2 md:py-2.5 text-left text-white hover:bg-white/5 transition-colors text-xs md:text-sm"
                        >
                          {getTranslation(language, 'subAudio')}
                        </button>
                        {hasDubAvailable && (
                          <button
                            onClick={() => {
                              setServerType('dub');
                              setShowServerDropdown(false);
                            }}
                            className="w-full px-3 py-2 md:py-2.5 text-left text-white hover:bg-white/5 transition-colors text-xs md:text-sm"
                          >
                            {getTranslation(language, 'dubAudio')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCreateRoom}
                  className="w-full bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white font-medium py-2 md:py-3 px-4 rounded-lg transition-colors border border-white/10 hover:border-white/20 mt-auto text-sm"
                >
                  {getTranslation(language, "createRoomButton")}
                </button>
              </div>
              )}

              {/* Join Room Section - Always visible */}
              <div className={`bg-[#000000] rounded-lg p-3 md:p-5 border border-white/10 hover:border-white/20 transition-colors flex flex-col ${!animeId || !episodeId ? 'max-w-md mx-auto w-full' : ''}`}>
                <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
                  <span className="text-xl md:text-2xl">🔗</span>
                  <div className="flex-1">
                    <h3 className="text-sm md:text-base font-medium text-white mb-1">{getTranslation(language, "joinRoom")}</h3>
                    <p className="text-gray-400 text-xs md:text-sm">
                      {getTranslation(language, "enterRoomCodeDesc")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:gap-3 mt-auto">
                  <input
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => {
                      setJoinRoomId(e.target.value.toUpperCase());
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
                    disabled={!joinRoomId.trim() || joinRoomId.length !== 6 || isValidating}
                    className="w-full bg-[#0a0a0a] hover:bg-[#1a1a1a] disabled:bg-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 md:py-3 px-5 rounded-lg transition-colors border border-white/10 hover:border-white/20 disabled:border-white/10 text-sm flex items-center justify-center gap-2"
                  >
                    {isValidating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                        <span>{getTranslation(language, "validating")}</span>
                      </>
                    ) : (
                      getTranslation(language, "joinRoomButton")
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
        ) : (
          <div className="p-3 md:p-6 space-y-3 md:space-y-5">
            {/* Room Created Banner */}
            <div className="bg-[#000000] border border-green-500/20 rounded-lg p-3 md:p-2">
              <div className="flex items-center gap-2 md:gap-1.5">
                <div className="w-2 h-2 md:w-1.5 md:h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-medium text-xs md:text-sm">{getTranslation(language, "roomCreated")}</span>
                <span className="text-gray-400 text-xs md:ml-2">{getTranslation(language, "shareCode")}</span>
              </div>
            </div>

            {/* Room Code Display */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-3 md:p-5">
              <div className="flex flex-col items-center gap-2 md:gap-4">
                <div className="w-full">
                  <p className="text-gray-400 text-xs mb-2">{getTranslation(language, "roomCode")}</p>
                  <p className="text-white font-mono text-xl md:text-3xl text-center break-all font-bold tracking-widest">{roomId}</p>
                </div>
                <button
                  onClick={copyRoomLink}
                  className="w-full bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white py-2 md:py-3 rounded-lg transition-colors border border-white/10 hover:border-white/20 flex items-center justify-center gap-2"
                  title="Copy room link"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                      <span className="text-xs md:text-sm">{getTranslation(language, "copied")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="text-xs md:text-sm">{getTranslation(language, "copyRoomLink")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-3 md:p-5">
              <div className="flex items-start gap-2 md:gap-3">
                <div className="text-gray-400 text-xs leading-relaxed">
                  <p className="mb-1 md:mb-2">
                    <span className="text-white font-medium">{getTranslation(language, "server")}:</span> HD-2
                  </p>
                  <p className="mb-1 md:mb-2">
                    <span className="text-white font-medium">{getTranslation(language, "audio")}:</span> {serverType === 'sub' ? getTranslation(language, "subAudio") : getTranslation(language, "dubAudio")}
                  </p>
                  <p className="mb-1 md:mb-2">
                    <span className="text-white font-medium">{getTranslation(language, "roomType")}:</span> {roomType === 'public' ? `🌐 ${getTranslation(language, "publicRoom")}` : `🔒 ${getTranslation(language, "privateRoom")}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 md:mt-3">
                    {getTranslation(language, "syncMessage")}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 pt-2">
              <button
                onClick={() => setIsCreating(false)}
                className="bg-[#000000] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 text-white font-medium py-2 md:py-3 px-4 rounded-lg transition-colors text-sm"
              >
                {getTranslation(language, "back")}
              </button>
              <button
                onClick={handleStartWatching}
                className="bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white font-medium py-2 md:py-3 px-4 rounded-lg transition-colors border border-white/10 hover:border-white/20 text-sm"
              >
                {getTranslation(language, "startWatching")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
