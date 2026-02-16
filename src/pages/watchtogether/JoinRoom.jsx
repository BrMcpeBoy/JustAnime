import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createWatchTogetherSocket } from '@/src/utils/watchTogetherSocket';
import { Users, Loader2 } from 'lucide-react';
import { useLanguage } from '@/src/context/LanguageContext';
import { getTranslation } from '@/src/translations/translations';

export default function JoinRoom() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    // Get room code from URL
    const params = new URLSearchParams(location.search);
    const room = params.get('room');

    if (!room) {
      setError('No room code provided');
      return;
    }

    setRoomCode(room);

    // Generate a temporary username
    const tempUsername = `Guest${Math.floor(Math.random() * 1000)}`;

    // Create socket connection to fetch room info
    const socket = createWatchTogetherSocket();

    let joinTimeout = null;
    let hasNavigated = false;

    // Listen for successful join (backend sends room info)
    socket.on('joined-room', (data) => {
      if (hasNavigated) return; // Already navigated
      
      console.log('✅ Joined room, received data:', data);
      
      // Clear timeout
      if (joinTimeout) {
        clearTimeout(joinTimeout);
        joinTimeout = null;
      }
      
      // Backend sends roomInfo with animeId, episodeId, serverType, etc.
      if (data.roomInfo && data.roomInfo.animeId && data.roomInfo.episodeId) {
        const { animeId, episodeId, serverType, roomType } = data.roomInfo;
        const server = 'HD-2'; // Default server
        
        // ✅ CRITICAL FIX: Store room data in localStorage BEFORE navigating
        // This ensures WatchTogether component can read the correct serverType and episode
        const roomKey = `watch-together-room-${room}`;
        const roomData = {
          serverType: serverType || 'sub',
          roomType: roomType || 'public',
          animeId: animeId,
          episodeId: episodeId,
          animeTitle: data.roomInfo.animeTitle || 'Unknown Anime',
          episodeNumber: data.roomInfo.episodeNumber || episodeId,
          animePoster: data.roomInfo.animePoster || null
        };
        
        localStorage.setItem(roomKey, JSON.stringify(roomData));
        console.log('💾 Stored room data in localStorage:', roomData);
        
        hasNavigated = true;
        // Disconnect and navigate to actual watch page with serverType in URL
        // CRITICAL: Add host=false so member is not treated as host
        socket.disconnect();
        navigate(`/watch-together/${animeId}?ep=${episodeId}&room=${room}&server=${server}&audio=${serverType}&host=false`);
      } else {
        setError('Room information incomplete. Please try again.');
        socket.disconnect();
      }
    });

    // Listen for join errors
    socket.on('join-error', (data) => {
      if (hasNavigated) return;
      
      console.error('❌ Join error:', data);
      
      if (joinTimeout) {
        clearTimeout(joinTimeout);
        joinTimeout = null;
      }
      
      setError(data.message || 'Room not found. Please check the room code.');
      socket.disconnect();
    });
    
    // Set timeout - if no response in 3 seconds, show error
    joinTimeout = setTimeout(() => {
      if (!hasNavigated) {
        console.error('⏱️ Join timeout - no response from server');
        setError('Connection timeout. Please try again.');
        socket.disconnect();
      }
    }, 3000);

    // Connect to room
    console.log('🔌 Attempting to join room:', room);
    socket.connect(room, tempUsername, false); // Not host

    // Cleanup
    return () => {
      if (joinTimeout) {
        clearTimeout(joinTimeout);
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-lg w-full max-w-md shadow-2xl">
        <div className="p-8 text-center">
          {error ? (
            <>
              {/* Error State */}
              <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-2xl mb-3">{getTranslation(language, "unableToJoin")}</h3>
              <p className="text-gray-400 text-base leading-relaxed mb-2">
                {error}
              </p>
              {roomCode && (
                <p className="text-gray-500 text-sm mb-6">
                  Room Code: <span className="font-mono font-bold">{roomCode}</span>
                </p>
              )}
              <button
                onClick={() => navigate('/home')}
                className="w-full bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white font-medium py-3 px-6 rounded-lg transition-colors border border-white/10 hover:border-white/20"
              >
                Return to Home
              </button>
            </>
          ) : (
            <>
              {/* Loading State */}
              <div className="w-20 h-20 mx-auto mb-6 bg-purple-500/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              </div>
              <h3 className="text-white font-semibold text-2xl mb-3">Joining Room...</h3>
              <p className="text-gray-400 text-base leading-relaxed mb-2">
                Please wait while we connect you to the watch party
              </p>
              {roomCode && (
                <p className="text-gray-500 text-sm">
                  Room Code: <span className="font-mono font-bold">{roomCode}</span>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
