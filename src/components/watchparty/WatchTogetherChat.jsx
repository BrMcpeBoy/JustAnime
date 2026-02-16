import { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageCircle, ChevronDown, MoreVertical, UserX, Ban, Shield } from 'lucide-react';
import { useLanguage } from '@/src/context/LanguageContext';
import { getTranslation } from '@/src/translations/translations';
import { formatNumber } from '@/src/utils/numberConverter';

export default function WatchTogetherChat({ roomId, socket, username, isHost, onMemberCountChange }) {
  const { language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showMemberList, setShowMemberList] = useState(false); // Changed to dropdown control
  const [openDropdownUserId, setOpenDropdownUserId] = useState(null); // Track which user's dropdown is open
  const [showManageMembersModal, setShowManageMembersModal] = useState(false); // Manage members modal
  const [streamEnded, setStreamEnded] = useState(false);
  const [isChangingEpisode, setIsChangingEpisode] = useState(false); // Track episode changes
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const dropdownRefs = useRef({});
  const hasShownInitialJoinMessage = useRef(false);
  const isHostRef = useRef(isHost);
  const episodeChangeTimeoutRef = useRef(null);
  const knownUsersRef = useRef(new Set()); // Track users who have already joined

  // Update isHost ref when prop changes
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (episodeChangeTimeoutRef.current) {
        clearTimeout(episodeChangeTimeoutRef.current);
      }
    };
  }, []);

  // Show initial join message when component mounts (for host creating room)
  useEffect(() => {
    if (socket && username && !hasShownInitialJoinMessage.current) {
      // Add initial join message for current user
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        message: `${username}${isHostRef.current ? ` (${getTranslation(language, "host")})` : ''} ${getTranslation(language, "joinedTheRoom")}`,
        timestamp: Date.now(),
        isSystem: true,
        type: 'join' // Add type for easier duplicate detection
      }]);
      hasShownInitialJoinMessage.current = true;
      knownUsersRef.current.add(username); // Track current user as already joined
      console.log('✅ Initial join message added for:', username);
    }
  }, [socket, username]); // Removed isHost from dependencies

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (openDropdownUserId && dropdownRefs.current[openDropdownUserId]) {
        if (!dropdownRefs.current[openDropdownUserId].contains(event.target)) {
          setOpenDropdownUserId(null);
        }
      }
    }
    
    if (openDropdownUserId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownUserId]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    // Remove any existing listeners first to prevent duplicates
    socket.off('chat-message');
    socket.off('users-update');
    socket.off('user-joined');
    socket.off('user-left');
    socket.off('user-kicked');
    socket.off('user-banned');
    socket.off('stream-ended');
    socket.off('episode-change');

    // Listen for episode changes to suppress join/leave messages
    const handleEpisodeChange = (data) => {
      console.log('📺 Episode change detected, suppressing join/leave messages for 3 seconds');
      setIsChangingEpisode(true);
      
      // Clear any existing timeout
      if (episodeChangeTimeoutRef.current) {
        clearTimeout(episodeChangeTimeoutRef.current);
      }
      
      // Re-enable join/leave messages after 3 seconds
      episodeChangeTimeoutRef.current = setTimeout(() => {
        console.log('✅ Episode change complete, re-enabling join/leave messages');
        setIsChangingEpisode(false);
      }, 3000);
    };

    // Listen for chat messages from others
    const handleChatMessage = (data) => {
      console.log('📨 Received chat message:', data);
      // Add ALL messages including from current user
      // Backend handles broadcasting, so we receive our own messages too
      setMessages(prev => {
        // Prevent duplicates by checking if message already exists
        const isDuplicate = prev.some(msg => 
          msg.timestamp === data.timestamp && 
          msg.username === data.username && 
          msg.message === data.message
        );
        
        if (isDuplicate) {
          console.log('⚠️ Duplicate message detected, skipping');
          return prev;
        }
        
        return [...prev, {
          id: Date.now() + Math.random(),
          username: data.username,
          message: data.message,
          timestamp: data.timestamp,
          isSystem: data.isSystem || false
        }];
      });
    };

    // Listen for user list updates
    const handleUsersUpdate = (users) => {
      console.log('👥 Users update received:', users.length, 'users');
      
      // Deduplicate users based on userId AND username
      const uniqueUsers = [];
      const seenUserIds = new Set();
      const seenUsernames = new Set();
      
      for (const user of users) {
        const userId = user.userId || '';
        const userName = user.username || '';
        
        // Skip if we've seen this userId or username already
        if ((userId && seenUserIds.has(userId)) || (userName && seenUsernames.has(userName))) {
          console.log('⚠️ Duplicate user detected, skipping:', userName, userId);
          continue;
        }
        
        // Add to unique list
        uniqueUsers.push(user);
        if (userId) seenUserIds.add(userId);
        if (userName) seenUsernames.add(userName);
      }
      
      console.log('✅ Deduplicated users:', uniqueUsers.length, 'unique users');
      setOnlineUsers(uniqueUsers);
      
      // Update known users set with current online users
      const currentUsernames = new Set(uniqueUsers.map(u => u.username).filter(Boolean));
      knownUsersRef.current = currentUsernames;
      console.log('📋 Known users updated:', Array.from(knownUsersRef.current));
      
      // Notify parent of member count change
      if (onMemberCountChange) {
        onMemberCountChange(uniqueUsers.length);
      }
    };

    // Listen for user joined
    const handleUserJoined = (data) => {
      console.log('👋 User joined event:', data.username);
      
      // Skip join messages during episode changes
      if (isChangingEpisode) {
        console.log('⏭️ Skipping join message during episode change');
        return;
      }
      
      // Check if this user was already in the room (prevents reconnect spam)
      if (knownUsersRef.current.has(data.username)) {
        console.log('⏭️ User already known (reconnect), skipping join message:', data.username);
        return;
      }
      
      // Show message for new users only
      if (data.username) {
        setMessages(prev => {
          // Prevent duplicate join messages by checking recent messages
          const recentJoinMessage = prev.slice(-5).some(msg => 
            msg.isSystem && 
            msg.type === 'join' &&
            msg.message.includes(`${data.username}`) &&
            (Date.now() - msg.timestamp) < 2000 // Within last 2 seconds
          );
          
          if (recentJoinMessage) {
            console.log('⚠️ Duplicate join message detected, skipping');
            return prev;
          }
          
          const displayName = data.isHost ? `${data.username} (${getTranslation(language, "host")})` : data.username;
          
          // Add user to known users set
          knownUsersRef.current.add(data.username);
          console.log('✅ New user joined, adding to known users:', data.username);
          
          return [...prev, {
            id: Date.now() + Math.random(),
            message: `${displayName} ${getTranslation(language, "joinedTheRoom")}`,
            timestamp: Date.now(),
            isSystem: true,
            type: 'join'
          }];
        });
      }
    };

    // Listen for user left
    const handleUserLeft = (data) => {
      console.log('👋 User left event:', data.username);
      
      // Skip leave messages during episode changes (could be reconnecting)
      if (isChangingEpisode) {
        console.log('⏭️ Skipping leave message during episode change');
        return;
      }
      
      if (data.username) {
        setMessages(prev => {
          // Prevent duplicate leave messages by checking recent messages
          const recentLeaveMessage = prev.slice(-5).some(msg => 
            msg.isSystem && 
            msg.type === 'leave' &&
            msg.message.includes(`${data.username}`) &&
            (Date.now() - msg.timestamp) < 2000 // Within last 2 seconds
          );
          
          if (recentLeaveMessage) {
            console.log('⚠️ Duplicate leave message detected, skipping');
            return prev;
          }
          
          // Remove user from known users set
          knownUsersRef.current.delete(data.username);
          console.log('👋 User left, removing from known users:', data.username);
          
          return [...prev, {
            id: Date.now() + Math.random(),
            message: `${data.username} ${getTranslation(language, "leftTheRoom")}`,
            timestamp: Date.now(),
            isSystem: true,
            type: 'leave'
          }];
        });
      }
    };

    // Listen for kick events (only add chat messages for other users)
    const handleUserKicked = (data) => {
      // Parent component handles if it's current user
      if (data.username && data.username !== username) {
        setMessages(prev => {
          // Prevent duplicate kick messages
          const recentKickMessage = prev.slice(-5).some(msg => 
            msg.isSystem && 
            msg.message.includes(`${data.username}`) &&
            msg.message.includes('kicked') &&
            (Date.now() - msg.timestamp) < 2000
          );
          
          if (recentKickMessage) {
            console.log('⚠️ Duplicate kick message detected, skipping');
            return prev;
          }
          
          return [...prev, {
            id: Date.now() + Math.random(),
            message: `${data.username} was kicked from the room`,
            timestamp: Date.now(),
            isSystem: true
          }];
        });
      }
    };

    // Listen for ban events (only add chat messages for other users)
    const handleUserBanned = (data) => {
      // Parent component handles if it's current user
      if (data.username && data.username !== username) {
        setMessages(prev => {
          // Prevent duplicate ban messages
          const recentBanMessage = prev.slice(-5).some(msg => 
            msg.isSystem && 
            msg.message.includes(`${data.username}`) &&
            msg.message.includes('banned') &&
            (Date.now() - msg.timestamp) < 2000
          );
          
          if (recentBanMessage) {
            console.log('⚠️ Duplicate ban message detected, skipping');
            return prev;
          }
          
          return [...prev, {
            id: Date.now() + Math.random(),
            message: `${data.username} was banned from the room`,
            timestamp: Date.now(),
            isSystem: true
          }];
        });
      }
    };

    // Listen for stream ended (host left)
    const handleStreamEnded = (data) => {
      console.log('Stream ended event received:', data);
      setStreamEnded(true);
    };

    // Register all event listeners
    socket.on('chat-message', handleChatMessage);
    socket.on('users-update', handleUsersUpdate);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('user-kicked', handleUserKicked);
    socket.on('user-banned', handleUserBanned);
    socket.on('stream-ended', handleStreamEnded);
    socket.on('episode-change', handleEpisodeChange);

    console.log('✅ Socket event listeners registered');

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('chat-message', handleChatMessage);
      socket.off('users-update', handleUsersUpdate);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('user-kicked', handleUserKicked);
      socket.off('user-banned', handleUserBanned);
      socket.off('stream-ended', handleStreamEnded);
      socket.off('episode-change', handleEpisodeChange);
    };
  }, [socket, username, isChangingEpisode]);

  const handleKickUser = (user) => {
    if (!socket || !isHost) return;
    
    socket.kickUser(user.username, user.userId);
    setOpenDropdownUserId(null);
    
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      message: `${user.username} was kicked from the room`,
      timestamp: Date.now(),
      isSystem: true
    }]);
  };

  const handleBanUser = (user) => {
    if (!socket || !isHost) return;
    
    socket.banUser(user.username, user.userId);
    setOpenDropdownUserId(null);
    
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      message: `${user.username} was banned from the room`,
      timestamp: Date.now(),
      isSystem: true
    }]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    // Just send to backend - it will broadcast to everyone including us
    // No need to add locally, we'll receive it back via the socket listener
    socket.sendMessage(newMessage.trim());

    setNewMessage('');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Show kicked/banned UI
  if (streamEnded) {
    return (
      <div className="flex flex-col h-full bg-[#000000] rounded-lg overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/10 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">{getTranslation(language, "streamEnded")}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {getTranslation(language, "hostLeftMessage")}
            </p>
            <button
              onClick={() => window.location.href = '/home'}
              className="bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white font-medium py-2 px-4 rounded-lg transition-colors border border-white/10 hover:border-white/20 text-sm"
            >
              {getTranslation(language, "returnToHome")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#000000] rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-[#0a0a0a] border-b border-white/10 p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
            <h3 className="text-white font-semibold text-sm md:text-base">{getTranslation(language, "liveChat")}</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Host Control Button */}
            {isHost && (
              <button
                onClick={() => setShowManageMembersModal(true)}
                className="flex items-center gap-1.5 bg-[#000000] hover:bg-[#1a1a1a] text-purple-400 hover:text-purple-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors border border-purple-500/20 hover:border-purple-500/40"
                title={getTranslation(language, "manageMembers")}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{getTranslation(language, "manage")}</span>
              </button>
            )}
            
            {/* Members Count Button */}
            <button
              onClick={() => setShowMemberList(!showMemberList)}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-xs md:text-sm transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>{onlineUsers.length}</span>
              <ChevronDown 
                className={`w-3 h-3 transition-transform ${showMemberList ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Online Users Dropdown */}
      {showMemberList && onlineUsers.length > 0 && (
        <div className="bg-[#0a0a0a] border-b border-white/10 p-2 md:p-3">
          <div className="flex flex-col gap-1.5">
            {onlineUsers.map((user) => (
              <div
                key={user.userId || user.username}
                className="flex items-center justify-between bg-[#000000] border border-white/10 rounded-lg px-2 md:px-3 py-1.5 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <span className="text-[10px] md:text-xs text-gray-300 truncate">
                    {user.username}
                    {user.isHost && (
                      <span className="ml-1 text-purple-400 font-medium">(Host)</span>
                    )}
                  </span>
                </div>
                
                {/* Host Actions - Only show if current user is host and target is not host */}
                {isHost && !user.isHost && user.username !== username && (
                  <div className="relative flex-shrink-0" ref={el => dropdownRefs.current[user.userId] = el}>
                    <button
                      onClick={() => setOpenDropdownUserId(openDropdownUserId === user.userId ? null : user.userId)}
                      className="p-1 aspect-square bg-[#0a0a0a] text-white/50 hover:text-white rounded border border-white/10 hover:border-white/20 transition-colors flex items-center justify-center w-[24px] h-[24px]"
                      title={getTranslation(language, "moreActions")}
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {openDropdownUserId === user.userId && (
                      <div className="absolute right-0 top-full mt-1 z-50 w-32 bg-[#0a0a0a] rounded-lg shadow-xl border border-white/10 overflow-hidden">
                        <button
                          onClick={() => handleKickUser(user)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-orange-400 hover:bg-white/5 transition-colors text-xs"
                        >
                          <UserX className="w-3 h-3" />
                          <span>{getTranslation(language, "kick")}</span>
                        </button>
                        <button
                          onClick={() => handleBanUser(user)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-white/5 transition-colors text-xs"
                        >
                          <Ban className="w-3 h-3" />
                          <span>{getTranslation(language, "ban")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 bg-[#000000] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs md:text-sm">
            <MessageCircle className="w-10 h-10 md:w-12 md:h-12 mb-2 opacity-20" />
            <p>{getTranslation(language, "noMessagesYet")}</p>
            <p className="text-[10px] md:text-xs mt-1 text-gray-600">{getTranslation(language, "beFirstToSay")}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id}>
              {msg.isSystem ? (
                <div className="flex justify-center">
                  <div className="bg-[#0a0a0a] border border-white/10 rounded-full px-2 md:px-3 py-1">
                    <p className="text-[10px] md:text-xs text-gray-400 text-center">{msg.message}</p>
                  </div>
                </div>
              ) : (
                <div className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline gap-1.5 md:gap-2 mb-1">
                    <span className={`text-xs md:text-sm font-medium ${msg.username === username ? 'text-green-400' : 'text-purple-400'}`}>
                      {msg.username === username ? 'You' : msg.username}
                    </span>
                    <span className="text-gray-500 text-[10px] md:text-xs">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className={`rounded-lg px-2.5 md:px-3 py-1.5 md:py-2 max-w-[85%] ${
                    msg.username === username 
                      ? 'bg-[#0a0a0a] border border-green-500/30' 
                      : 'bg-[#0a0a0a] border border-white/10'
                  }`}>
                    <p className="text-gray-200 text-xs md:text-sm break-words">{msg.message}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="bg-[#0a0a0a] border-t border-white/10 p-3 md:p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={getTranslation(language, 'typeMessage')}
            className="flex-1 bg-[#000000] border border-white/10 hover:border-white/20 focus:border-white/30 rounded-lg px-3 md:px-4 py-2 text-white placeholder-gray-500 focus:outline-none transition-colors text-xs md:text-sm"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-[#0a0a0a] hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors border border-white/10 hover:border-white/20 disabled:border-white/10"
          >
            <Send className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
        <p className="text-[10px] md:text-xs text-gray-500 mt-2">
          {formatNumber(newMessage.length, language)}/{formatNumber(500, language)} {getTranslation(language, "charactersCount")}
        </p>
      </form>

      {/* Manage Members Modal */}
      {showManageMembersModal && isHost && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowManageMembersModal(false)}
        >
          <div 
            className="bg-[#0a0a0a] border border-white/10 rounded-lg w-full max-w-md shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold text-lg">{getTranslation(language, "manageMembers")}</h3>
              </div>
              <button
                onClick={() => setShowManageMembersModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="mb-3">
                <p className="text-gray-400 text-xs mb-3">
                  {formatNumber(onlineUsers.length, language)} {onlineUsers.length !== 1 ? getTranslation(language, "members") : getTranslation(language, "member")} {getTranslation(language, "online")}
                </p>
              </div>

              {onlineUsers.map((user) => (
                <div
                  key={user.userId || user.username}
                  className="bg-[#000000] border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    {/* User Info */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {user.username}
                          {user.username === username && (
                            <span className="text-green-400 text-xs ml-1">({getTranslation(language, "you")})</span>
                          )}
                        </p>
                        {user.isHost && (
                          <p className="text-purple-400 text-xs">{getTranslation(language, "host")}</p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - Only show if not host and not current user */}
                    {!user.isHost && user.username !== username && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            handleKickUser(user);
                            // Don't close modal so host can manage multiple users
                          }}
                          className="flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-orange-500/10 text-orange-400 hover:text-orange-300 px-3 py-1.5 rounded-lg transition-colors border border-orange-500/20 hover:border-orange-500/40 text-xs"
                          title={getTranslation(language, "kickUser")}
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>{getTranslation(language, "kick")}</span>
                        </button>
                        <button
                          onClick={() => {
                            handleBanUser(user);
                            // Don't close modal so host can manage multiple users
                          }}
                          className="flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-red-500/10 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/40 text-xs"
                          title={getTranslation(language, "banUser")}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{getTranslation(language, "ban")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {onlineUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400 text-sm">{getTranslation(language, "noMembersOnline")}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => setShowManageMembersModal(false)}
                className="w-full bg-[#000000] hover:bg-[#1a1a1a] text-white font-medium py-2.5 px-4 rounded-lg transition-colors border border-white/10 hover:border-white/20 text-sm"
              >
                {getTranslation(language, "close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
