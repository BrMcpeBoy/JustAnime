import { useState, useEffect } from 'react';
import React from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/src/context/LanguageContext';
import { formatNumber } from '@/src/utils/numberConverter';
import { getTranslation, formatDateTime, formatRelativeTime } from '@/src/translations/translations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faThumbsUp,
  faThumbsDown,
  faReply,
  faEdit,
  faTrash,
  faPaperPlane,
  faSort,
  faChevronDown,
  faChevronUp,
  faGlobe,
  faPlayCircle,
  faTimes,
  faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';

const COMMENT_API_URL = import.meta.env.VITE_COMMENT_API_URL || 'http://localhost:5000';
const BACKGROUND_API_URL = import.meta.env.VITE_BACKGROUND_API_URL || 'https://profile-background-backend.vercel.app';

export default function CommentSection({ animeId, episodeId, episodeNumber, deviceType = 'desktop', showTabs = true }) {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(showTabs ? 'episode' : 'general');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  
  // Use episodeNumber directly if provided, otherwise extract from episodeId
  const getEpisodeNumber = () => {
    if (episodeNumber) return episodeNumber;
    if (!episodeId) return '';
    // If episodeId is just a number, return it
    const cleanNumber = String(episodeId).replace(/\D/g, '');
    return cleanNumber || episodeId;
  };
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replies, setReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userBackground, setUserBackground] = useState(null);
  const [userBackgroundLoading, setUserBackgroundLoading] = useState(false);
  const [userStats, setUserStats] = useState({ totalComments: 0, totalLikes: 0 });
  const [visibleRepliesCount, setVisibleRepliesCount] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(8);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch comments - load all at once for client-side pagination
  const fetchComments = async (currentPage = 1, resetComments = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: 1,
        limit: 1000, // Load all comments at once
        sort: sortBy
      });
      
      if (activeTab === 'episode' && episodeId) {
        params.append('episodeId', episodeId);
      } else if (activeTab === 'general') {
        params.append('episodeId', 'general');
      }
      
      const response = await fetch(`${COMMENT_API_URL}/api/comments/${animeId}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setComments(data.data);
        setHasMore(false); // No server-side pagination needed
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch replies for a comment
  const fetchReplies = async (commentId) => {
    try {
      setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
      const response = await fetch(
        `${COMMENT_API_URL}/api/comments/${animeId}/${commentId}/replies?episodeId=${activeTab === 'episode' ? episodeId : 'general'}`
      );
      const data = await response.json();
      
      if (data.success) {
        setReplies(prev => ({ ...prev, [commentId]: data.data }));
        setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  useEffect(() => {
    setComments([]);
    setPage(1);
    setVisibleCommentsCount(8);
    setIsExpanded(false);
    fetchComments(1, true);
  }, [animeId, episodeId, sortBy, activeTab]);

  // Handle scrolling to specific comment from notification
  useEffect(() => {
    const commentId = searchParams.get('commentId') || sessionStorage.getItem('pendingScrollComment');
    
    if (!commentId || comments.length === 0) {
      console.log(`[${deviceType}] ⚠️  No commentId or comments not loaded`);
      return;
    }
    
    // Check if THIS component instance is actually visible
    // Don't run scroll logic on hidden mobile/desktop instance
    const isThisInstanceVisible = deviceType === 'mobile' 
      ? window.innerWidth <= 1200 
      : window.innerWidth > 1200;
    
    if (!isThisInstanceVisible) {
      console.log(`[${deviceType}] 🙈 This component instance is hidden (screen: ${window.innerWidth}px), skipping scroll`);
      return;
    }
    
    console.log(`[${deviceType}] ✅ This component instance is VISIBLE (screen: ${window.innerWidth}px), proceeding with scroll`);
    
    // Prevent duplicate execution
    const scrollKey = `scrolledTo-${commentId}-${deviceType}`;
    if (sessionStorage.getItem(scrollKey)) {
      console.log(`[${deviceType}] ⚠️  Already scrolled to:`, commentId);
      return;
    }
    
    sessionStorage.setItem(scrollKey, 'true');
    console.log(`[${deviceType}] 🔍 Looking for comment:`, commentId);
    
    // Simple recursive function to find and scroll
    const findAndScroll = async (retries = 0) => {
      if (retries > 20) {
        console.log(`[${deviceType}] ❌ Gave up after 20 retries`);
        sessionStorage.removeItem(scrollKey);
        return;
      }
      
      console.log(`[${deviceType}] 🔄 Attempt ${retries + 1}/20`);
      
      // Find the element with deviceType-specific ID
      const element = document.getElementById(`comment-${deviceType}-${commentId}`);
      console.log(`[${deviceType}]   📊 Element found:`, element ? 'YES ✅' : 'NO ❌');
      
      if (element) {
        // Check if element is actually visible (not just exists)
        const rect = element.getBoundingClientRect();
        const isVisible = element.offsetParent !== null && rect.width > 0 && rect.height > 0;
        console.log(`[${deviceType}]   👁️  Visible:`, isVisible ? 'YES ✅' : 'NO ❌', `(${rect.width}x${rect.height})`);
        
        if (!isVisible && retries < 20) {
          console.log(`[${deviceType}]   ⏳ Element exists but not visible yet, retrying...`);
          setTimeout(() => findAndScroll(retries + 1), 500);
          return;
        }
      }
      
      if (element && element.offsetParent !== null) {
        console.log(`[${deviceType}] ✅ Found visible element!`);
        
        // Check if this is the ACTUAL target comment or just a parent
        const isMainComment = comments.some(c => c._id === commentId);
        
        if (isMainComment) {
          console.log(`[${deviceType}] 📌 This is a main comment, scrolling directly...`);
          
          // Scroll to it - use 'center' for perfect middle positioning
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          // Highlight it
          setTimeout(() => {
            element.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
            element.style.border = '2px solid rgba(59, 130, 246, 0.5)';
            element.style.borderRadius = '8px';
            element.style.transition = 'all 0.3s';
            
            setTimeout(() => {
              element.style.backgroundColor = '';
              element.style.border = '';
            }, 3000);
          }, 500);
          
          // Cleanup after 5 seconds
          setTimeout(() => {
            sessionStorage.removeItem('pendingScrollComment');
            sessionStorage.removeItem(scrollKey);
            
            if (searchParams.get('commentId')) {
              searchParams.delete('commentId');
              setSearchParams(searchParams, { replace: true });
            }
          }, 5000);
          
          return;
        }
        
        // It's a REPLY - check if it's inside an expanded parent
        console.log(`[${deviceType}] 📌 This is a reply comment, checking if parent is expanded...`);
        
        // Find which parent contains this reply
        let parentId = null;
        for (const parent of comments) {
          // Check if this reply is rendered inside this parent
          const parentEl = element.closest(`#comment-${deviceType}-${parent._id}`);
          if (parentEl) {
            // The reply is inside this parent's DOM tree
            parentId = parent._id;
            console.log(`[${deviceType}] 👨 Found parent:`, parentId.substring(0, 8));
            break;
          }
        }
        
        if (parentId) {
          console.log(`[${deviceType}] ✅ Reply is visible, scrolling to it...`);
          
          // Scroll to the reply - centered on screen for better visibility
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          // Highlight it
          setTimeout(() => {
            element.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
            element.style.border = '2px solid rgba(59, 130, 246, 0.5)';
            element.style.borderRadius = '8px';
            element.style.transition = 'all 0.3s';
            
            setTimeout(() => {
              element.style.backgroundColor = '';
              element.style.border = '';
            }, 3000);
          }, 500);
          
          // Cleanup after 5 seconds
          setTimeout(() => {
            sessionStorage.removeItem('pendingScrollComment');
            sessionStorage.removeItem(scrollKey);
            
            if (searchParams.get('commentId')) {
              searchParams.delete('commentId');
              setSearchParams(searchParams, { replace: true });
            }
          }, 5000);
          
          return;
        }
        
        console.log(`[${deviceType}] ⚠️  Reply found but parent relationship unclear, treating as not found...`);
        // Fall through to expansion logic below
      }
      
      // Not found yet - might be a reply that needs expanding
      console.log(`[${deviceType}] 🔍 Element not visible, checking if it's a reply...`);
      
      // Check EACH parent comment to see if this commentId is one of its replies
      for (const parent of comments) {
        console.log(`[${deviceType}] 📥 Checking parent ${parent._id.substring(0, 8)} for replies...`);
        
        // Fetch replies for this parent
        try {
          const response = await fetch(
            `${COMMENT_API_URL}/api/comments/${animeId}/${parent._id}/replies?episodeId=${activeTab === 'episode' ? episodeId : 'general'}`
          );
          const data = await response.json();
          
          if (data.success && data.data && data.data.length > 0) {
            console.log(`[${deviceType}]   ✓ Got ${data.data.length} replies`);
            
            // Check if our target comment is in these replies
            const foundReply = data.data.find(r => r._id === commentId);
            
            if (foundReply) {
              console.log(`[${deviceType}] 🎯 Target comment IS a reply of this parent!`);
              
              // Get the index of the target reply
              const replyIndex = data.data.findIndex(r => r._id === commentId);
              console.log(`[${deviceType}]   Reply is at index ${replyIndex} of ${data.data.length} replies`);
              
              // Store replies in state
              setReplies(prev => ({ ...prev, [parent._id]: data.data }));
              setExpandedReplies(prev => ({ ...prev, [parent._id]: true }));
              
              // Calculate how many replies we need to show to include the target
              const minRepliesNeeded = replyIndex + 1;
              const initialShow = Math.max(5, minRepliesNeeded);
              
              // Set visible replies count to show at least up to the target reply
              setVisibleRepliesCount(prev => ({ 
                ...prev, 
                [parent._id]: initialShow 
              }));
              
              console.log(`[${deviceType}]   Setting visibleRepliesCount to ${initialShow} to show target reply`);
              
              // Wait for the replies to render, then scroll
              setTimeout(() => findAndScroll(retries + 1), 1000);
              return;
            }
          }
        } catch (error) {
          console.error(`[${deviceType}] ❌ Error fetching replies for parent ${parent._id}:`, error);
        }
      }
      
      // Not a reply of any parent, just retry
      console.log(`[${deviceType}] 🔄 Not found in any parent replies, retrying in 1 second...`);
      setTimeout(() => findAndScroll(retries + 1), 1000);
    };
    
    // Start searching after comments are loaded
    setTimeout(() => findAndScroll(), 500);
    
  }, [searchParams, comments, animeId, episodeId, activeTab, deviceType]); // Run when URL or comments change

  // Handle View More
  const handleViewMore = () => {
    setVisibleCommentsCount(prev => prev + 5);
    setIsExpanded(true);
  };

  const handleCloseAll = () => {
    setVisibleCommentsCount(8);
    setIsExpanded(false);
  };

  // Post comment
  const handlePostComment = async () => {
    if (!newComment.trim() || !isAuthenticated) return;
    
    try {
      setSubmitting(true);
      const response = await fetch(`${COMMENT_API_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeId,
          episodeId: activeTab === 'episode' ? episodeId : 'general',
          episodeNumber: activeTab === 'episode' ? getEpisodeNumber() : null,
          userId: user.id.toString(),
          username: user.name,
          userAvatar: user.avatar || null,
          content: newComment
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewComment('');
        setPage(1);
        setVisibleCommentsCount(8);
        setIsExpanded(false);
        fetchComments(1, true);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Post reply
  const handlePostReply = async (parentId) => {
    if (!replyContent.trim() || !isAuthenticated) return;
    
    try {
      setSubmitting(true);
      const response = await fetch(`${COMMENT_API_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeId,
          episodeId: activeTab === 'episode' ? episodeId : 'general',
          episodeNumber: activeTab === 'episode' ? getEpisodeNumber() : null,
          userId: user.id.toString(),
          username: user.name,
          userAvatar: user.avatar || null,
          content: replyContent,
          parentId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReplyContent('');
        setReplyTo(null);
        setPage(1);
        setVisibleCommentsCount(8);
        setIsExpanded(false);
        // Make sure replies are expanded
        setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
        // Fetch updated replies
        await fetchReplies(parentId);
        // Also refresh parent comment to update reply count
        fetchComments(1, true);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit comment
  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) return;
    
    try {
      const response = await fetch(`${COMMENT_API_URL}/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeId: animeId,
          episodeId: activeTab === 'episode' ? episodeId : 'general',
          userId: user.id.toString(),
          content: editContent
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEditingComment(null);
        setEditContent('');
        setPage(1);
        setVisibleCommentsCount(8);
        setIsExpanded(false);
        fetchComments(1, true);
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(
        `${COMMENT_API_URL}/api/comments/${commentId}?userId=${user.id}&animeId=${animeId}&episodeId=${activeTab === 'episode' ? episodeId : 'general'}`,
        { method: 'DELETE' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setShowDeleteModal(false);
        setCommentToDelete(null);
        setPage(1);
        setVisibleCommentsCount(8);
        setIsExpanded(false);
        fetchComments(1, true);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const openDeleteModal = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCommentToDelete(null);
  };

  // Like comment - FIXED
  const handleLike = async (commentId, isReply = false, parentId = null) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`${COMMENT_API_URL}/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id.toString(),
          animeId: animeId,
          episodeId: activeTab === 'episode' ? episodeId : 'general'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (isReply && parentId) {
          // Update reply
          setReplies(prev => ({
            ...prev,
            [parentId]: prev[parentId].map(reply =>
              reply._id === commentId
                ? {
                    ...reply,
                    likes: data.data.likes,
                    dislikes: data.data.dislikes
                  }
                : reply
            )
          }));
        } else {
          // Update main comment
          setComments(prev => prev.map(comment => 
            comment._id === commentId 
              ? { 
                  ...comment, 
                  likes: data.data.likes,
                  dislikes: data.data.dislikes
                } 
              : comment
          ));
        }
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  // Dislike comment - FIXED
  const handleDislike = async (commentId, isReply = false, parentId = null) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`${COMMENT_API_URL}/api/comments/${commentId}/dislike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id.toString(),
          animeId: animeId,
          episodeId: activeTab === 'episode' ? episodeId : 'general'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (isReply && parentId) {
          // Update reply
          setReplies(prev => ({
            ...prev,
            [parentId]: prev[parentId].map(reply =>
              reply._id === commentId
                ? {
                    ...reply,
                    likes: data.data.likes,
                    dislikes: data.data.dislikes
                  }
                : reply
            )
          }));
        } else {
          // Update main comment
          setComments(prev => prev.map(comment => 
            comment._id === commentId 
              ? { 
                  ...comment, 
                  likes: data.data.likes,
                  dislikes: data.data.dislikes
                } 
              : comment
          ));
        }
      }
    } catch (error) {
      console.error('Error disliking comment:', error);
    }
  };

  // Helper function to get user avatar with fallback
  const getUserAvatar = (comment) => {
    if (comment.userAvatar) {
      return comment.userAvatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.username)}&background=random&size=128`;
  };

  // Handle profile click
  const handleProfileClick = (comment) => {
    setSelectedUserProfile({
      userId: comment.userId,
      username: comment.username,
      avatar: comment.userAvatar,
    });
    setShowProfileModal(true);
  };

  // Cleanup when modal closes
  useEffect(() => {
    if (!showProfileModal) {
      setUserBackground('/profile background/angkorwat.jpg');
      setUserBackgroundLoading(false);
      setSelectedUserProfile(null);
      setUserStats({ totalComments: 0, totalLikes: 0 });
    }
  }, [showProfileModal]);

  // Fetch user background and stats when modal opens
  useEffect(() => {
    const fetchUserProfileData = async () => {
      if (!showProfileModal || !selectedUserProfile) return;

      // Reset and set loading state
      setUserBackground(null);
      setUserBackgroundLoading(true);
      setUserStats({ totalComments: 0, totalLikes: 0 });

      try {
        // First, fetch custom background
        const bgResponse = await fetch(`${BACKGROUND_API_URL}/api/background/${selectedUserProfile.userId}`);
        
        let customBackground = null;
        
        if (bgResponse.ok) {
          const bgData = await bgResponse.json();
          if (bgData.success && bgData.data && bgData.data.backgroundPath) {
            customBackground = bgData.data.backgroundPath;
          }
        }

        // If no custom background, check for AniList banner
        if (!customBackground) {
          try {
            // Fetch user's AniList data to get their banner
            const anilistResponse = await fetch(`https://graphql.anilist.co`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: `
                  query ($userId: Int) {
                    User(id: $userId) {
                      bannerImage
                    }
                  }
                `,
                variables: {
                  userId: parseInt(selectedUserProfile.userId)
                }
              })
            });

            if (anilistResponse.ok) {
              const anilistData = await anilistResponse.json();
              if (anilistData.data?.User?.bannerImage) {
                customBackground = anilistData.data.User.bannerImage;
              }
            }
          } catch (anilistError) {
            console.log('Could not fetch AniList banner:', anilistError);
          }
        }

        // If still no background, use Angkor Wat as default
        if (!customBackground) {
          customBackground = '/profile background/angkorwat.jpg';
        }

        setUserBackground(customBackground);

        // Fetch user stats (total comments and likes)
        const statsResponse = await fetch(`${COMMENT_API_URL}/api/users/${selectedUserProfile.userId}/stats`);
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          
          if (statsData.success) {
            setUserStats({
              totalComments: statsData.data.totalComments || 0,
              totalLikes: statsData.data.totalLikes || 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user profile data:', error);
        // Even on error, set Angkor Wat as default
        setUserBackground('/profile background/angkorwat.jpg');
        setUserStats({ totalComments: 0, totalLikes: 0 });
      } finally {
        setUserBackgroundLoading(false);
      }
    };

    fetchUserProfileData();
  }, [showProfileModal, selectedUserProfile]);

  // Profile Modal Component
  const ProfileModal = () => {
    if (!selectedUserProfile) return null;

    const isOwnProfile = isAuthenticated && user?.id.toString() === selectedUserProfile.userId;
    const isVideoBackground = userBackground?.endsWith('.mp4') || userBackground?.endsWith('.webm');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowProfileModal(false)}
        />
        
        {/* Modal - Narrow and tall, smaller on mobile */}
        <div className="relative w-full max-w-[340px] sm:max-w-md bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={() => setShowProfileModal(false)}
            className="absolute top-3 right-3 z-20 w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 hover:bg-black/70 text-white/70 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm" />
          </button>

          {/* Banner background - Taller and better aligned */}
          <div className="relative h-32 overflow-hidden">
            {userBackground ? (
              <>
                {isVideoBackground ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover"
                    onError={() => {
                      console.error('Video background failed to load, using Angkor Wat');
                      setUserBackground('/profile background/angkorwat.jpg');
                    }}
                  >
                    <source src={userBackground} type="video/mp4" />
                  </video>
                ) : (
                  <img
                    src={userBackground}
                    alt="Profile Background"
                    className="w-full h-full object-cover"
                    onError={() => {
                      console.error('Image background failed to load, using Angkor Wat');
                      setUserBackground('/profile background/angkorwat.jpg');
                    }}
                  />
                )}
                {/* Gradient shadow like Profile.jsx */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]" style={{
                  background: 'linear-gradient(to bottom, transparent 0%, transparent 20%, #0a0a0a 100%)'
                }}></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
            )}
          </div>

          {/* Profile content - Avatar bottom aligns with background bottom */}
          <div className="relative px-4 pb-4 -mt-20">
            {/* Avatar - Bottom edge aligns with background bottom edge */}
            <div className="relative inline-block">
              <img
                src={selectedUserProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUserProfile.username)}&background=random&size=128`}
                alt={selectedUserProfile.username}
                className="w-20 h-20 rounded-xl object-cover border border-white/10 shadow-xl"
              />
            </div>

            {/* User info - Closer spacing */}
            <div className="mt-2">
              <h2 className="text-xl font-bold text-white mb-1">
                {selectedUserProfile.username}
              </h2>
              
              <div className="flex items-center gap-2 text-xs text-white/60 mb-3">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span>{getTranslation(language, 'connectedToAnilist')}</span>
              </div>

              {/* Stats Cards - Optimized with borders and bigger icons */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {/* Total Comments */}
                <div className="bg-[#0a0a0a] rounded-lg p-2.5 border border-white/10 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-7 h-7 bg-blue-500/20 rounded border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">💬</span>
                    </div>
                  </div>
                  <p className="text-base font-bold">{formatNumber(userStats.totalComments, language)}</p>
                  <p className="text-white/60 text-[10px] mt-0.5">
                    {getTranslation(language, 'totalComments')}
                  </p>
                </div>

                {/* Total Likes */}
                <div className="bg-[#0a0a0a] rounded-lg p-2.5 border border-white/10 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-7 h-7 bg-pink-500/20 rounded border border-pink-500/30 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faThumbsUp} className="text-xs" />
                    </div>
                  </div>
                  <p className="text-base font-bold">{formatNumber(userStats.totalLikes, language)}</p>
                  <p className="text-white/60 text-[10px] mt-0.5">
                    {getTranslation(language, 'totalLikes')}
                  </p>
                </div>
              </div>

              {/* View Profile Button */}
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  if (isOwnProfile) {
                    navigate('/profile');
                  } else {
                    navigate(`/user/${selectedUserProfile.userId}`);
                  }
                }}
                className="w-full px-3 py-2 bg-[#000000] hover:bg-[#1a1a1a] rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 mb-3"
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
                <span>{isOwnProfile ? getTranslation(language, 'myProfile') : getTranslation(language, 'viewProfile')}</span>
              </button>

              {/* Additional info */}
              <div className="p-2.5 bg-[#000000] rounded-lg border border-white/10">
                <p className="text-[10px] text-white/50 text-center">
                  {isOwnProfile 
                    ? getTranslation(language, 'viewYourAnimeList')
                    : getTranslation(language, 'viewTheirAnimeList')
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CommentItem = React.memo(({ comment, isReply = false, parentId = null }) => {
    const isCommentOwner = isAuthenticated && user?.id.toString() === comment.userId;
    // Ensure likes and dislikes are always arrays
    const userLikes = Array.isArray(comment.likes) ? comment.likes : [];
    const userDislikes = Array.isArray(comment.dislikes) ? comment.dislikes : [];
    const hasLiked = isAuthenticated && userLikes.some(l => l.userId === user?.id.toString());
    const hasDisliked = isAuthenticated && userDislikes.some(d => d.userId === user?.id.toString());
    
    return (
      <div 
        id={`comment-${deviceType}-${comment._id}`}
        className={`${isReply ? 'ml-4 pl-2' : ''}`}
      >
        <div className={`${isReply ? 'py-3' : 'py-4'} ${!isReply ? 'border-b border-white/5' : ''}`}>
          <div className="flex gap-3">
            {/* User Avatar - Clickable */}
            <button
              onClick={() => handleProfileClick(comment)}
              className="flex-shrink-0 self-start hover:opacity-80 transition-opacity"
            >
              <img
                src={getUserAvatar(comment)}
                alt={comment.username}
                className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover border border-white/10`}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.username)}&background=random&size=128`;
                }}
              />
            </button>
            
            <div className="flex-1 min-w-0">
              {/* Header - Username clickable */}
              <div className="flex items-baseline gap-2 mb-1">
                <button
                  onClick={() => handleProfileClick(comment)}
                  className={`font-medium text-white ${isReply ? 'text-xs' : 'text-sm'} hover:text-blue-400 transition-colors`}
                >
                  @{comment.username}
                </button>
                <span className={`text-gray-500 ${isReply ? 'text-[11px]' : 'text-xs'} whitespace-nowrap`}>
                  {formatRelativeTime(comment.createdAt, language)}
                </span>
                {comment.isEdited && (
                  <span className="text-gray-500 text-xs">({language === 'km' ? 'បានកែសម្រួល' : 'edited'})</span>
                )}
              </div>
              
              {/* Content */}
              {editingComment === comment._id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg p-3 text-gray-300 text-sm focus:outline-none focus:border-white/20 resize-none"
                    rows="3"
                    maxLength="1000"
                    dir="ltr"
                    lang="en"
                  ></textarea>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditComment(comment._id)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-sm text-white transition-colors"
                    >
                      {getTranslation(language, 'save')}
                    </button>
                    <button
                      onClick={() => {
                        setEditingComment(null);
                        setEditContent('');
                      }}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-md text-sm text-gray-400 transition-colors"
                    >
                      {getTranslation(language, 'cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`text-gray-300 ${isReply ? 'text-xs' : 'text-sm'} mb-2 whitespace-pre-wrap break-words`}>
                  {comment.content}
                </p>
              )}
              
              {/* Actions */}
              {editingComment !== comment._id && (
                <div className="flex items-center gap-4 mt-2">
                  {/* Like button - FIXED */}
                  <button
                    onClick={() => handleLike(comment._id, isReply, parentId)}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      hasLiked
                        ? 'text-blue-400'
                        : 'text-gray-400 hover:text-blue-400'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <FontAwesomeIcon icon={faThumbsUp} />
                    <span>{formatNumber(userLikes.length, language)}</span>
                  </button>
                  
                  {/* Dislike button - FIXED */}
                  <button
                    onClick={() => handleDislike(comment._id, isReply, parentId)}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      hasDisliked
                        ? 'text-red-400'
                        : 'text-gray-400 hover:text-red-400'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <FontAwesomeIcon icon={faThumbsDown} />
                    <span>{formatNumber(userDislikes.length, language)}</span>
                  </button>
                  
                  {/* Reply button - only show for other users' comments */}
                  {!isReply && isAuthenticated && !isCommentOwner && (
                    <button
                      onClick={() => {
                        setReplyTo(comment._id);
                        setReplyContent('');
                        // Scroll to the reply box after a small delay to let it render
                        setTimeout(() => {
                          const replyBox = document.querySelector(`[key="reply-box-${comment._id}"]`);
                          if (replyBox) {
                            replyBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 100);
                      }}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      <FontAwesomeIcon icon={faReply} />
                      <span>{getTranslation(language, 'reply')}</span>
                    </button>
                  )}
                  
                  {/* Edit & Delete buttons (only for comment owner) */}
                  {isCommentOwner && (
                    <>
                      <button
                        onClick={() => {
                          setEditingComment(comment._id);
                          setEditContent(comment.content);
                        }}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        <FontAwesomeIcon icon={faEdit} className="sm:inline" />
                        <span className="inline">{getTranslation(language, 'edit')}</span>
                      </button>
                      <button
                        onClick={() => openDeleteModal(comment._id)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <FontAwesomeIcon icon={faTrash} className="sm:inline" />
                        <span className="inline">{getTranslation(language, 'delete')}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
              
              {/* Reply box */}
              {replyTo === comment._id && (
                <div 
                  className="mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg" 
                  id={`reply-box-${comment._id}`}
                >
                  <div className="mb-2 flex items-center gap-2 text-blue-400 text-xs">
                    <FontAwesomeIcon icon={faReply} />
                    <span>{getTranslation(language, 'replyingTo')} <span className="font-semibold">{comment.username}</span></span>
                  </div>
                  <div className="flex gap-3">
                    <img
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name)}&background=random&size=128`}
                      alt={user?.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name)}&background=random&size=128`;
                      }}
                    />
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && replyContent.trim()) {
                            e.preventDefault();
                            handlePostReply(comment._id);
                          }
                        }}
                        placeholder={getTranslation(language, 'writeReply')}
                        className="w-full bg-[#000000] border border-blue-500/30 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-blue-500/50"
                        maxLength="1000"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePostReply(comment._id)}
                          disabled={submitting || !replyContent.trim()}
                          className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-md text-sm text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FontAwesomeIcon icon={faPaperPlane} className="mr-1.5" />
                          {submitting ? getTranslation(language, 'posting') : getTranslation(language, 'sendReply')}
                        </button>
                        <button
                          onClick={() => {
                            setReplyTo(null);
                            setReplyContent('');
                          }}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-md text-sm text-gray-400 transition-colors"
                        >
                          {getTranslation(language, 'cancel')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show replies button with vertical line */}
              {!isReply && comment.replyCount > 0 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      if (expandedReplies[comment._id]) {
                        setExpandedReplies(prev => ({ ...prev, [comment._id]: false }));
                        // Reset visible replies count when closing
                        setVisibleRepliesCount(prev => ({ ...prev, [comment._id]: 5 }));
                      } else {
                        fetchReplies(comment._id);
                      }
                    }}
                    className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-medium text-blue-400 hover:bg-blue-400/10 transition-all relative"
                  >
                    <FontAwesomeIcon 
                      icon={expandedReplies[comment._id] ? faChevronUp : faChevronDown} 
                      className="text-xs" 
                    />
                    <span>
                      {expandedReplies[comment._id] ? getTranslation(language, 'hide') : ''} {formatNumber(comment.replyCount, language)} {getTranslation(language, comment.replyCount === 1 ? 'replyCount' : 'replies')}
                    </span>
                  </button>
                  
                  {/* Vertical line when replies are shown */}
                  {expandedReplies[comment._id] && (
                    <div className="absolute left-2 top-12 bottom-0 w-0.5 bg-white/5" style={{height: 'calc(100% - 3rem)'}}></div>
                  )}
                  
                  {/* Replies list */}
                  {expandedReplies[comment._id] && replies[comment._id] && (
                    <div className="mt-4 space-y-0">
                      {loadingReplies[comment._id] ? (
                        <div className="text-gray-500 text-sm ml-4">{getTranslation(language, 'loadingReplies')}</div>
                      ) : (
                        <>
                          {replies[comment._id]
                            .slice(0, visibleRepliesCount[comment._id] || 5)
                            .map(reply => (
                              <CommentItem 
                                key={reply._id} 
                                comment={reply} 
                                isReply={true}
                                parentId={comment._id}
                              />
                            ))
                          }
                          {replies[comment._id].length > 5 && (
                            <div className="ml-4 mt-3 flex items-center gap-3">
                              {(visibleRepliesCount[comment._id] || 5) < replies[comment._id].length && (
                                <button
                                  onClick={() => {
                                    setVisibleRepliesCount(prev => ({
                                      ...prev,
                                      [comment._id]: (prev[comment._id] || 5) + 5
                                    }));
                                  }}
                                  className="px-3 py-1.5 bg-[#000000] border border-white/10 hover:border-white/20 rounded-md text-xs text-gray-300 hover:text-white transition-colors"
                                >
                                  {getTranslation(language, 'viewMore')}
                                </button>
                              )}
                              
                              {(visibleRepliesCount[comment._id] || 5) > 5 && (
                                <button
                                  onClick={() => {
                                    setVisibleRepliesCount(prev => ({
                                      ...prev,
                                      [comment._id]: 5
                                    }));
                                  }}
                                  className="px-3 py-1.5 bg-[#000000] border border-white/10 hover:border-white/20 rounded-md text-xs text-gray-300 hover:text-white transition-colors"
                                >
                                  {getTranslation(language, 'close')}
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  });

  return (
    <>
      {/* Mobile: Title with Sort button on right */}
      <div className="md:hidden mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {getTranslation(language, 'comments')}
        </h2>
        
        {/* Sort menu - Mobile */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#000000] border border-white/10 rounded-md text-sm text-gray-300 hover:border-white/20 transition-colors"
          >
            <FontAwesomeIcon icon={faSort} className="text-xs" />
            <span>
              {sortBy === 'recent' ? getTranslation(language, 'newestFirst') : sortBy === 'top' ? getTranslation(language, 'topComments') : getTranslation(language, 'oldestFirst')}
            </span>
          </button>
          
          {showSortMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-[#000000] border border-white/10 rounded-lg shadow-lg overflow-hidden z-10">
              {['recent', 'top', 'oldest'].map(option => (
                <button
                  key={option}
                  onClick={() => {
                    setSortBy(option);
                    setShowSortMenu(false);
                    setPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    sortBy === option
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {option === 'recent' ? getTranslation(language, 'newestFirst') : option === 'top' ? getTranslation(language, 'topComments') : getTranslation(language, 'oldestFirst')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0a0a0a] rounded-lg border border-white/10 p-3 sm:p-4 md:p-6">
        {/* Desktop: Header with Tabs inside border */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            {/* Desktop: Title inside border */}
            <h2 className="hidden md:block text-xl sm:text-2xl font-semibold text-white">
              {getTranslation(language, 'comments')}
            </h2>
            
            {/* Tab Buttons - Only show if showTabs is true */}
            {showTabs && (
              <div className="flex items-center gap-2 bg-[#000000] rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => {
                    setActiveTab('episode');
                    setComments([]);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                    activeTab === 'episode'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FontAwesomeIcon icon={faPlayCircle} className="text-xs" />
                  <span>{getTranslation(language, 'episode')} {formatNumber(getEpisodeNumber(), language)}</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('general');
                    setComments([]);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                    activeTab === 'general'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FontAwesomeIcon icon={faGlobe} className="text-xs" />
                  <span>{getTranslation(language, 'general')}</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Sort menu - Desktop only */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#000000] border border-white/10 rounded-md text-sm text-gray-300 hover:border-white/20 transition-colors"
            >
              <FontAwesomeIcon icon={faSort} className="text-xs" />
              <span>
                {sortBy === 'recent' ? getTranslation(language, 'newest') : sortBy === 'top' ? getTranslation(language, 'top') : getTranslation(language, 'oldest')}
              </span>
            </button>
            
            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-[#000000] border border-white/10 rounded-lg shadow-lg overflow-hidden z-10">
                {['recent', 'top', 'oldest'].map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortBy(option);
                      setShowSortMenu(false);
                      setPage(1);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      sortBy === option
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {option === 'recent' ? getTranslation(language, 'newestFirst') : option === 'top' ? getTranslation(language, 'topComments') : getTranslation(language, 'oldestFirst')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab Description - Only show if showTabs is true */}
        {showTabs && (
          <div className="mb-4 p-3 bg-[#000000] border border-white/10 rounded-lg">
            <p className="text-sm text-gray-400">
              {activeTab === 'episode' ? (
                <>
                  <FontAwesomeIcon icon={faPlayCircle} className="mr-2" />
                  {getTranslation(language, 'commentsForEpisode')}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faGlobe} className="mr-2" />
                  {getTranslation(language, 'commentsGeneral')}
                </>
              )}
            </p>
          </div>
        )}
        
        {/* New comment box */}
        {isAuthenticated ? (
          <div className="mb-6">
            {replyTo && (
              <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-400">
                    <FontAwesomeIcon icon={faReply} className="mr-2" />
                    {getTranslation(language, 'replyingTo')} <span className="font-semibold">{comments.find(c => c._id === replyTo)?.username || 'user'}</span>
                  </p>
                  <button
                    onClick={() => {
                      setReplyTo(null);
                      setReplyContent('');
                    }}
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    <FontAwesomeIcon icon={faTimes} className="mr-1" />
                    {getTranslation(language, 'cancel')}
                  </button>
                </div>
              </div>
            )}
            <div className={`flex gap-3 ${replyTo ? 'opacity-40 pointer-events-none' : ''}`}>
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name)}&background=random&size=128`}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name)}&background=random&size=128`;
                }}
              />
              <div className="flex-1 space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={activeTab === 'episode' ? getTranslation(language, 'addEpisodeComment') : getTranslation(language, 'addGeneralComment')}
                  className="w-full bg-[#000000] border border-white/10 rounded-lg p-3 text-gray-300 text-sm focus:outline-none focus:border-white/20 resize-none"
                  rows="3"
                  maxLength="1000"
                  dir="ltr"
                  lang="en"
                  disabled={replyTo !== null}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {formatNumber(newComment.length, language)}/{formatNumber(1000, language)}
                  </span>
                  <button
                    onClick={handlePostComment}
                    disabled={submitting || !newComment.trim() || replyTo !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                    <span>{submitting ? getTranslation(language, 'posting') : getTranslation(language, 'postComment')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-[#000000] border border-white/10 rounded-lg text-center">
            <p className="text-gray-400 text-sm">
              {getTranslation(language, 'pleaseSignInComment')}
            </p>
          </div>
        )}
        
        {/* Comments list */}
        <div className="space-y-0">
          {loading && comments.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {getTranslation(language, 'loadingComments')}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {getTranslation(language, 'noCommentsYet')}
            </div>
          ) : (
            <>
              {comments.slice(0, visibleCommentsCount).map(comment => (
                <CommentItem key={comment._id} comment={comment} />
              ))}
              
              {/* View More / Close All Buttons */}
              {comments.length > 8 && (
                <div className="pt-4">
                  <div className="flex items-center gap-3">
                    {visibleCommentsCount < comments.length && (
                      <button
                        onClick={handleViewMore}
                        className="px-4 py-2 bg-[#000000] border border-white/10 hover:border-white/20 rounded-md text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        {getTranslation(language, 'viewMore')}
                      </button>
                    )}
                    
                    {isExpanded && visibleCommentsCount > 8 && (
                      <button
                        onClick={handleCloseAll}
                        className="px-4 py-2 bg-[#000000] border border-white/10 hover:border-white/20 rounded-md text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        {getTranslation(language, 'close')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && <ProfileModal />}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              {getTranslation(language, 'deleteComment')}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {getTranslation(language, 'deleteCommentConfirm')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 text-sm font-medium transition-colors"
              >
                {getTranslation(language, 'cancel')}
              </button>
              <button
                onClick={() => handleDeleteComment(commentToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors"
              >
                {getTranslation(language, 'delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
