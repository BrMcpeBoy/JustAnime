import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Globe, ExternalLink, Crown, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/src/context/LanguageContext';
import { useAuth } from '@/src/context/AuthContext';
import { getTranslation } from '@/src/translations/translations';
import { formatNumber } from '@/src/utils/numberConverter';

export default function PublicRooms() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [publicRooms, setPublicRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 15; // 5 lines × 3 columns

  // Calculate pagination
  const totalPages = Math.ceil(publicRooms.length / roomsPerPage);
  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
  const currentRooms = publicRooms.slice(indexOfFirstRoom, indexOfLastRoom);

  // Fetch public rooms
  const fetchPublicRooms = async () => {
    setIsLoading(true);
    try {
      const socketServerUrl = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';
      const response = await fetch(`${socketServerUrl}/api/rooms/public`);
      
      if (response.ok) {
        const rooms = await response.json();
        setPublicRooms(rooms);
      } else {
        console.error('Failed to fetch public rooms');
      }
    } catch (error) {
      console.error('Error fetching public rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchPublicRooms();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPublicRooms();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Format duration with Khmer number support
  const formatDuration = (createdAt) => {
    const now = Date.now();
    const diff = now - createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (language === 'kh' || language === 'km') {
      // Khmer format: ១ម៉ោង ២៣នាទី
      if (hours > 0) {
        return `${formatNumber(hours, language)}ម៉ោង ${formatNumber(remainingMinutes, language)}នាទី`;
      }
      return `${formatNumber(minutes, language)}នាទី`;
    } else {
      // English format: 1h 23mn
      if (hours > 0) {
        return `${hours}h ${remainingMinutes}mn`;
      }
      return `${minutes}mn`;
    }
  };

  // Join room - FIXED: Removed host presence check
  // Users can join and the WatchTogether component will handle host disconnection
  const handleJoinRoom = (room) => {
    if (!user) {
      alert('Please login to join a room');
      return;
    }

    // ✅ Include serverType in URL so member gets correct audio immediately
    const serverType = room.serverType || 'sub';
    console.log('🎬 Joining room from PublicRooms:', {
      roomId: room.roomId,
      animeId: room.animeId,
      episodeId: room.episodeId,
      serverType: serverType
    });
    
    // Navigate directly to the room with serverType
    // The WatchTogether component will handle checking if host is connected
    // and show appropriate UI if host disconnects
    // CRITICAL: Add host=false so user joins as member, not host
    navigate(`/watch-together/${room.animeId}?ep=${room.episodeId}&room=${room.roomId}&server=HD-2&audio=${serverType}&host=false`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-20 pb-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Globe className="w-6 h-6 text-white" />
              <h1 className="text-2xl md:text-3xl">
                {getTranslation(language, 'publicRooms')}
              </h1>
            </div>
            <button
              onClick={fetchPublicRooms}
              className="px-4 py-2 bg-[#000000] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 rounded-lg transition-colors text-sm"
            >
              🔄 {getTranslation(language, 'refresh')}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-white"></div>
          </div>
        ) : publicRooms.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Users className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">{getTranslation(language, 'noPublicRooms')}</p>
            <p className="text-sm">{getTranslation(language, 'createOneFromWatch')}</p>
          </div>
        ) : (
          /* Rooms Grid - 1 column mobile, 3 columns desktop */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {currentRooms.map((room, index) => (
              <div
                key={index}
                className="bg-[#000000] border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors"
              >
                <div className="flex gap-3 mb-2 pb-2 border-b border-white/10">
                  {/* Anime Poster - Left Side with own border */}
                  {room.animePoster && (
                    <div className="w-24 flex-shrink-0 border border-white/10 rounded-lg overflow-hidden">
                      <img
                        src={room.animePoster}
                        alt={room.animeTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Room Content - Right Side */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    {/* Top Content */}
                    <div>
                      {/* Anime Title & Participants */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white font-semibold text-sm line-clamp-2 flex-1">
                          {room.animeTitle}
                        </h3>
                        <span className="flex items-center gap-1 text-gray-400 text-xs flex-shrink-0">
                          <Users className="w-3.5 h-3.5" />
                          {formatNumber(room.participants || 0, language)}
                        </span>
                      </div>
                      
                      {/* Room Code */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-400 font-mono text-xs">
                          {room.roomId}
                        </span>
                      </div>
                      
                      {/* Episode */}
                      <div className="mb-2">
                        <span className="text-gray-400 text-xs block mb-2">
                          {getTranslation(language, 'episode')} {formatNumber(room.episodeNumber, language)}
                        </span>
                        {/* Server Type */}
                        {room.serverType && (
                          <span className="inline-block px-1.5 py-0.5 bg-[#1a1a1a] text-white rounded text-xs font-medium border border-white/10">
                            {room.serverType.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Host & Duration */}
                    <div className="flex items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Crown className="w-3 h-3" />
                        {room.hostUserId ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Navigating to user profile:', room.hostUserId);
                              navigate(`/user/${room.hostUserId}`);
                            }}
                            className="truncate hover:text-white hover:underline transition-colors cursor-pointer text-left"
                          >
                            {room.hostUsername}
                          </button>
                        ) : (
                          <span className="truncate">{room.hostUsername}</span>
                        )}
                        <span>•</span>
                        <span>{formatDuration(room.createdAt)}</span>
                      </div>
                      <span className="text-red-500 font-semibold text-sm animate-pulse flex-shrink-0">Live</span>
                    </div>
                  </div>
                </div>
                
                {/* Join Button - Full Width */}
                <button
                  onClick={() => handleJoinRoom(room)}
                  className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white text-xs font-medium py-1.5 rounded-lg transition-colors border border-white/10 hover:border-white/20 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  {getTranslation(language, 'joinRoomButton')}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#000000] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getTranslation(language, 'previous')}
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-400">
                {getTranslation(language, 'page')} {formatNumber(currentPage, language)} {getTranslation(language, 'of')} {formatNumber(totalPages, language)}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#000000] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getTranslation(language, 'next')}
              </button>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
