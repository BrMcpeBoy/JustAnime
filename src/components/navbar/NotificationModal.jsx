import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faReply, faAt, faComment, faUser, faUsers, faBell, faClock } from '@fortawesome/free-solid-svg-icons';
import { formatDateTime } from '@/src/translations/translations';

const COMMENT_API_URL = import.meta.env.VITE_COMMENT_API_URL || 'http://localhost:5000';

export default function NotificationModal({ isOpen, onClose, userId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, replies, mentions
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId, activeTab]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Store original values
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const originalPosition = document.body.style.position;
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      // For iOS Safari and mobile devices - prevent bounce scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';

      // Return cleanup function
      return () => {
        // Restore original values
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        document.body.style.position = originalPosition;
        document.body.style.top = '';
        document.body.style.width = '';
        
        // Restore scroll position for mobile
        const scrollY = document.body.style.top;
        if (scrollY) {
          const scrollPosition = parseInt(scrollY || '0') * -1;
          window.scrollTo(0, scrollPosition);
        }
      };
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log('Fetching notifications for user:', userId, 'type:', activeTab);
      const response = await fetch(`${COMMENT_API_URL}/api/notifications/${userId}?type=${activeTab}`);
      
      if (!response.ok) {
        // Backend endpoint doesn't exist yet
        if (response.status === 404) {
          console.warn('Notification endpoint not found. Backend needs to be set up.');
          setNotifications([]);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('Notifications fetched:', data);
      
      if (data.success) {
        // Filter out invalid notifications (missing required fields)
        // Community notifications may not have commentText, so handle them separately
        const validNotifications = (data.data || []).filter(notif => {
          if (notif.type === 'community') {
            // Community notifications only need userId, message, and type
            return notif._id && notif.userId && notif.message;
          } else {
            // Reply and mention notifications need commentText
            return notif._id && notif.userId && notif.commentText;
          }
        });
        
        setNotifications(validNotifications);
        console.log('Loaded', validNotifications.length, 'valid notifications');
        
        if (validNotifications.length < (data.data || []).length) {
          console.warn(`Filtered out ${(data.data || []).length - validNotifications.length} invalid notifications`);
        }
      } else {
        console.error('Failed to fetch notifications:', data.error);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Set empty array instead of erroring out
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${COMMENT_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${COMMENT_API_URL}/api/notifications/${userId}/read-all`, {
        method: 'PUT',
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Community notifications don't have a link, just mark as read
    if (notification.type === 'community') {
      return;
    }

    const { animeId, episodeId, commentId } = notification;
    
    // Close modal first
    onClose();

    // CRITICAL: Store commentId in sessionStorage BEFORE navigation
    sessionStorage.setItem('fromNotification', 'true');
    sessionStorage.setItem('pendingScrollComment', commentId);
    
    // Check if this is a general comment or episode-specific comment
    const isGeneralComment = !episodeId || episodeId === 'general';
    
    if (isGeneralComment) {
      // Navigate to anime info page for general comments
      console.log('Navigating to anime info page for general comment:', `/${animeId}?commentId=${commentId}`);
      navigate(`/${animeId}?commentId=${commentId}`);
    } else {
      // Navigate to watch page for episode-specific comments
      console.log('Navigating to watch page for episode comment:', `/watch/${animeId}?ep=${episodeId}&commentId=${commentId}`);
      navigate(`/watch/${animeId}?ep=${episodeId}&commentId=${commentId}`);
    }
  };

  const handleUserClick = (e, userInfo) => {
    e.stopPropagation();
    
    // Navigate to public profile page
    console.log('Navigating to user profile:', userInfo.userId);
    onClose();
    navigate(`/user/${userInfo.userId}`);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reply':
        return faReply;
      case 'mention':
        return faAt;
      case 'community':
        return faUsers;
      default:
        return faComment;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'reply':
        return 'text-blue-400';
      case 'mention':
        return 'text-purple-400';
      case 'community':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose} // Close when clicking backdrop
      onTouchMove={(e) => e.preventDefault()} // Prevent scroll on touch devices
      style={{ touchAction: 'none' }} // Additional touch prevention
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-modal-title"
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#0a0a0a] rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
        onTouchMove={(e) => e.stopPropagation()} // Allow scrolling within modal
        style={{ touchAction: 'auto' }} // Enable touch actions within modal
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/10">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 id="notification-modal-title" className="text-xl font-bold text-white">Notifications</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faTimes} className="text-white/60 w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 pb-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
              All
            </button>
            <button
              onClick={() => setActiveTab('replies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'replies'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <FontAwesomeIcon icon={faReply} className="w-3.5 h-3.5" />
              Replies
            </button>
            <button
              onClick={() => setActiveTab('mentions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'mentions'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <FontAwesomeIcon icon={faAt} className="w-3.5 h-3.5" />
              Mentions
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'community'
                  ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <FontAwesomeIcon icon={faUsers} className="w-3.5 h-3.5" />
              Community
            </button>
            
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllAsRead}
                className="ml-auto text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faComment} className="text-white/30 w-8 h-8" />
              </div>
              <p className="text-white/50 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => {
                // Check if this is a general comment
                const isGeneralComment = !notification.episodeId || notification.episodeId === 'general';
                const isCommunity = notification.type === 'community';
                
                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-6 py-4 hover:bg-white/5 transition-colors ${
                      isCommunity ? '' : 'cursor-pointer'
                    } ${
                      !notification.read ? 'bg-blue-500/5' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Notification Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center ${
                          !notification.read ? 'ring-2 ring-blue-400/50' : ''
                        }`}>
                          <FontAwesomeIcon
                            icon={getNotificationIcon(notification.type)}
                            className={`w-4 h-4 ${getNotificationColor(notification.type)}`}
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {isCommunity ? (
                          /* Community Notification */
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              {notification.fromUser?.avatar ? (
                                <img
                                  src={notification.fromUser.avatar}
                                  alt={notification.fromUser.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                  <FontAwesomeIcon icon={faUsers} className="text-white text-xs" />
                                </div>
                              )}
                              <span className="font-semibold text-green-400">
                                {notification.fromUser?.name || 'Just Anime'}
                              </span>
                              <span className="text-white/60 text-sm">
                                • Community Update
                              </span>
                            </div>

                            {/* Message */}
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-2">
                              <p className="text-sm text-white/90">
                                {notification.message}
                              </p>
                            </div>

                            {/* Timestamp */}
                            <div className="flex items-center gap-2 text-xs text-white/40">
                              <span>{formatDateTime(notification.createdAt)}</span>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-green-400 rounded-full" />
                              )}
                            </div>
                          </>
                        ) : (
                          /* Reply/Mention Notification */
                          <>
                            {/* User and Action */}
                            <div className="flex items-center gap-2 mb-2">
                              {notification.fromUser ? (
                                <button
                                  onClick={(e) => handleUserClick(e, notification.fromUser)}
                                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                >
                                  {notification.fromUser.avatar ? (
                                    <img
                                      src={notification.fromUser.avatar}
                                      alt={notification.fromUser.username}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                      <FontAwesomeIcon icon={faUser} className="text-white text-xs" />
                                    </div>
                                  )}
                                  <span className="font-semibold text-white hover:text-blue-400 transition-colors">
                                    {notification.fromUser.username}
                                  </span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faUser} className="text-white text-xs" />
                                  </div>
                                  <span className="font-semibold text-white/60">
                                    Unknown User
                                  </span>
                                </div>
                              )}
                              <span className="text-white/60 text-sm">
                                {notification.type === 'reply' ? 'replied to your comment' : 'mentioned you'}
                              </span>
                            </div>

                            {/* Anime and Episode Info */}
                            <div className="flex items-center gap-2 mb-2 text-xs text-white/50">
                              <span className="truncate">{notification.animeTitle}</span>
                              {!isGeneralComment && notification.episodeNumber && (
                                <>
                                  <span>•</span>
                                  <span>Episode {notification.episodeNumber}</span>
                                </>
                              )}
                              {isGeneralComment && (
                                <>
                                  <span>•</span>
                                  <span className="text-purple-400">General Comments</span>
                                </>
                              )}
                            </div>

                            {/* Comment Preview */}
                            <div className="bg-white/5 rounded-lg p-3 mb-2">
                              <p className="text-sm text-white/80 line-clamp-3">
                                {notification.commentText}
                              </p>
                            </div>

                            {/* Timestamp */}
                            <div className="flex items-center gap-2 text-xs text-white/40">
                              <span>{formatDateTime(notification.createdAt)}</span>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-400 rounded-full" />
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
