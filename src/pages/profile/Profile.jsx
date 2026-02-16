import { useAuth } from '@/src/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";
import { formatNumber } from "@/src/utils/numberConverter";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faClock,
  faEllipsisV,
  faSync,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useRef } from 'react';
import { getAniListUserList } from '@/src/utils/getAnilistUserList.js';
import { processUserListForAutoCompletion } from '@/src/utils/autoCompleteAnime.js';
import getAnimeIdByTitle from '@/src/utils/getAnimeIdByTitle.js';

// ============= BACKEND API CONFIGURATION =============
// Get backend URL from environment variable
const BACKGROUND_API_URL = import.meta.env.VITE_BACKGROUND_API_URL || 'https://profile-background-backend.vercel.app';
// =====================================================

export default function Profile() {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('watching');
  // Mobile detection (screen width <= 768px)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [userStats, setUserStats] = useState({
    totalAnime: 0,
    totalEpisodes: 0,
    daysWatched: 0,
  });
  const [animeList, setAnimeList] = useState({
    watching: [],
    planning: [],
    completed: [],
    rewatching: [],
    paused: [],
    dropped: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tabScrollPos, setTabScrollPos] = useState(0);
  const [mobileTabDropdownOpen, setMobileTabDropdownOpen] = useState(false);
  const [editingAnime, setEditingAnime] = useState(null);
  const [editFormData, setEditFormData] = useState({
    status: '',
    score: 0,
    progress: 0,
    startDate: '',
    endDate: '',
    rewatches: 0,
    notes: '',
  });
  const [savingChanges, setSavingChanges] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const tabContainerRef = useRef(null);
  const itemsPerPage = 10;

  // Custom profile background
  const [customBackground, setCustomBackground] = useState(() => {
    return localStorage.getItem('profileBackground') || null;
  });

  // AniList Active state
  const [aniListActive, setAniListActive] = useState(() => {
    const saved = localStorage.getItem('aniListActive');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Listen for localStorage changes (from Settings page)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('aniListActive');
      if (saved !== null) {
        setAniListActive(JSON.parse(saved));
      }
    };

    const handleBackgroundChange = () => {
      const savedBg = localStorage.getItem('profileBackground');
      setCustomBackground(savedBg);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileBackgroundChanged', handleBackgroundChange);
    
    // Also check on mount and when returning to this page
    const checkInterval = setInterval(() => {
      const saved = localStorage.getItem('aniListActive');
      if (saved !== null) {
        const newValue = JSON.parse(saved);
        setAniListActive(prev => {
          if (prev !== newValue) {
            return newValue;
          }
          return prev;
        });
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileBackgroundChanged', handleBackgroundChange);
      clearInterval(checkInterval);
    };
  }, []);

  // Set default background based on AniList banner availability
  useEffect(() => {
    const savedBg = localStorage.getItem('profileBackground');
    
    if (!savedBg) {
      // No saved background - set default
      if (isAuthenticated && user?.banner) {
        // User has AniList banner - use it as default
        setCustomBackground(user.banner);
      } else {
        // No AniList banner - use Angkor Wat as default
        const angkorWatPath = '/profile background/angkorwat.jpg';
        setCustomBackground(angkorWatPath);
        localStorage.setItem('profileBackground', angkorWatPath);
      }
    }
  }, [user, isAuthenticated]);

  // Available backgrounds - only show AniList banner if user has one
  const availableBackgrounds = [
    // Add AniList banner ONLY if user has one
    ...(isAuthenticated && user?.banner ? [
      { id: 'anilist', path: user.banner, type: 'image', name: getTranslation(language, 'anilistBanner') }
    ] : []),
    { id: 'angkorwat', path: '/profile background/angkorwat.jpg', type: 'image', name: 'Angkor Wat' },
    { id: 'Hoshimi Miyabi', path: '/profile background/Hoshimi Miyabi.mp4', type: 'video', name: 'Hoshimi Miyabi' },
  ];

  // ============= BACKEND INTEGRATION: Save to Database =============
  const saveBackgroundToBackend = async (backgroundData) => {
    try {
      if (!user?.id) {
        console.error('❌ No user ID available');
        return false;
      }

      console.log('💾 Saving background to backend...', {
        userId: user.id,
        background: backgroundData.name
      });

      const response = await fetch(`${BACKGROUND_API_URL}/api/background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id.toString(),
          backgroundPath: backgroundData.path,
          backgroundType: backgroundData.type,
          backgroundName: backgroundData.name
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Background saved to backend successfully!');
        return true;
      } else {
        console.error('❌ Failed to save background to backend:', data.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving background to backend:', error);
      return false;
    }
  };
  // ================================================================

  // Save background preference
  const handleSaveBackground = async () => {
    if (selectedBackground) {
      // Save to localStorage (for immediate UI update on current profile)
      localStorage.setItem('profileBackground', selectedBackground.path);
      setCustomBackground(selectedBackground.path);
      
      // Save to backend (for public profile visibility) - Direct fetch like CommentSection
      try {
        console.log('💾 Saving background to backend...', {
          userId: user.id,
          background: selectedBackground.name
        });

        const response = await fetch(`${BACKGROUND_API_URL}/api/background`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id.toString(),
            backgroundPath: selectedBackground.path,
            backgroundType: selectedBackground.type,
            backgroundName: selectedBackground.name
          })
        });

        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Background saved to backend successfully!');
        } else {
          console.error('❌ Failed to save background to backend:', data.error);
        }
      } catch (error) {
        console.error('❌ Error saving background to backend:', error);
      }
      
      window.dispatchEvent(new Event('profileBackgroundChanged'));
      setShowBackgroundSelector(false);
    }
  };

  // Open background selector with current background preselected
  const handleOpenBackgroundSelector = () => {
    let currentBg = availableBackgrounds.find(bg => bg.path === customBackground);
    
    // If no custom background is set and user has AniList banner, select it by default
    if (!currentBg && isAuthenticated && user?.banner) {
      currentBg = availableBackgrounds.find(bg => bg.id === 'anilist');
    }
    
    setSelectedBackground(currentBg || null);
    setShowBackgroundSelector(true);
  };


  // Helper function to navigate to anime using correct HaruAnime ID
  const handleAnimeNavigation = async (anime) => {
    try {
      if (!anime?.title) {
        console.error('❌ Invalid anime - missing title');
        return;
      }
      
      console.log('🔍 Profile Navigation - Full anime data:', {
        title: anime.title,
        englishTitle: anime.englishTitle,
        romajiTitle: anime.romajiTitle,
        nativeTitle: anime.nativeTitle,
        id: anime.id,
        mediaId: anime.mediaId,
        format: anime.format,
        genres: anime.genres,
        season: anime.season,
        seasonYear: anime.seasonYear
      });
      
      // Pass the full anime object to the improved matching function
      // This allows it to use genres, format, and season data for accurate matching
      console.log('🎯 Starting smart anime matching...');
      const haruAnimeId = await getAnimeIdByTitle(anime);
      
      if (!haruAnimeId) {
        console.error('❌ Could not find matching anime in streaming API');
        alert('Could not find this anime in the streaming database. The title might be different or the anime might not be available.');
        return;
      }
      
      console.log('✅ Found HaruAnime ID:', haruAnimeId);
      
      // Store the title for potential use in AnimeInfo page
      sessionStorage.setItem('anilist_anime_title', anime.title);
      navigate(`/${haruAnimeId}`);
    } catch (error) {
      console.error('❌ Error navigating to anime:', error);
      alert('An error occurred while trying to navigate to the anime.');
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        if (!isAuthenticated) {
          setLoading(false);
          return;
        }

        const accessToken = localStorage.getItem('anilist_token');
        if (!accessToken) {
          setLoading(false);
          return;
        }

        console.log('📊 Fetching user data from AniList...');
        const lists = await getAniListUserList(null, accessToken);
        
        if (lists) {
          // Log sample anime data to debug IDs
          const sampleAnime = lists.watching?.[0];
          if (sampleAnime) {
            console.log('✅ Sample anime loaded:', {
              id: sampleAnime.id,
              title: sampleAnime.title,
              cover: sampleAnime.cover,
            });
            console.log('🎬 Ready to navigate to: /' + sampleAnime.id);
          }
          
          // Check and auto-complete anime based on threshold
          console.log('🔄 Processing anime for auto-completion...');
          const autoCompleteResult = await processUserListForAutoCompletion(lists, accessToken);
          console.log(`✅ Auto-completion result:`, autoCompleteResult);

          // Refresh list after auto-completion
          if (autoCompleteResult.completed > 0) {
            console.log('🔄 Refreshing user list after auto-completion...');
            const updatedLists = await getAniListUserList(null, accessToken);
            setAnimeList(updatedLists);
            
            // Calculate updated stats
            const totalAnime = Object.values(updatedLists).flat().length;
            const totalEpisodes = Object.values(updatedLists).flat().reduce((sum, anime) => sum + (anime.progress || 0), 0);
            const daysWatched = totalEpisodes * 0.42;
            
            setUserStats({
              totalAnime,
              totalEpisodes,
              daysWatched: Math.round(daysWatched * 10) / 10,
            });
            
            console.log('✅ User data refreshed after auto-completion');
          } else {
            setAnimeList(lists);
            
            // Calculate stats
            const totalAnime = Object.values(lists).flat().length;
            const totalEpisodes = Object.values(lists).flat().reduce((sum, anime) => sum + (anime.progress || 0), 0);
            const daysWatched = totalEpisodes * 0.42; // Rough estimate: ~25 min per episode
            
            setUserStats({
              totalAnime,
              totalEpisodes,
              daysWatched: Math.round(daysWatched * 10) / 10,
            });
            
            console.log('✅ User data loaded:', lists);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, location.pathname]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      const accessToken = localStorage.getItem('anilist_token');
      if (!accessToken) {
        console.error('No access token');
        return;
      }

      console.log('🔄 Manually refreshing user data...');
      const lists = await getAniListUserList(null, accessToken);
      
      if (lists) {
        setAnimeList(lists);
        
        // Calculate updated stats
        const totalAnime = Object.values(lists).flat().length;
        const totalEpisodes = Object.values(lists).flat().reduce((sum, anime) => sum + (anime.progress || 0), 0);
        const daysWatched = totalEpisodes * 0.42;
        
        setUserStats({
          totalAnime,
          totalEpisodes,
          daysWatched: Math.round(daysWatched * 10) / 10,
        });
        
        console.log('✅ User data refreshed');
      }
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="text-white/60 mb-6">Please log in to view your profile</p>
          <button
            onClick={() => navigate('/page/auth/login')}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const currentTabAnime = animeList[activeTab] || [];

  const getTabBadgeColor = (tabId) => {
    const colors = {
      watching: 'bg-cyan-500/30 text-cyan-300',
      planning: 'bg-yellow-500/30 text-yellow-300',
      completed: 'bg-green-500/30 text-green-300',
      rewatching: 'bg-purple-500/30 text-purple-300',
      paused: 'bg-orange-500/30 text-orange-300',
      dropped: 'bg-red-500/30 text-red-300',
    };
    return colors[tabId] || 'bg-white/10 text-white/70';
  };

  const handleTabScroll = (direction) => {
    if (tabContainerRef.current) {
      // Each tab is approximately 80px width (px-3 * 2 + text width + gap)
      // Scroll to show exactly 3 tabs per page
      const tabWidth = 90; // Approximate width per tab including gap
      const tabsPerPage = 3;
      const scrollAmount = tabWidth * tabsPerPage;
      const newPos = tabScrollPos + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      // Clamp between 0 and max scroll
      const maxScroll = tabContainerRef.current.scrollWidth - tabContainerRef.current.clientWidth;
      const clampedPos = Math.max(0, Math.min(newPos, maxScroll));
      
      tabContainerRef.current.scrollLeft = clampedPos;
      setTabScrollPos(clampedPos);
    }
  };

  const handleEditAnime = (anime) => {
    const startDate = anime.startDate || '';
    const endDate = anime.endDate || '';
    
    // Reset all modal states
    setShowDeleteConfirm(false);
    setDeleteConfirming(false);
    setDeleteSuccess(false);
    setSaveSuccess(false);
    setSavingChanges(false);
    setStatusDropdownOpen(false);
    
    setEditingAnime(anime);
    setEditFormData({
      status: activeTab,
      score: anime.score || 0,
      progress: anime.progress || 0,
      startDate: startDate,
      endDate: endDate,
      rewatches: anime.rewatches || 0,
      notes: anime.notes || '',
    });
  };

  const handleCloseModal = () => {
    setEditingAnime(null);
    setEditFormData({
      status: '',
      score: 0,
      progress: 0,
      startDate: '',
      endDate: '',
      rewatches: 0,
      notes: '',
    });
    setShowDeleteConfirm(false);
    setDeleteConfirming(false);
    setDeleteSuccess(false);
    setSaveSuccess(false);
    setSavingChanges(false);
    setStatusDropdownOpen(false);
  };

  const handleSaveChanges = async () => {
    if (!editingAnime) return;
    try {
      setSavingChanges(true);
      const accessToken = localStorage.getItem('anilist_token');
      if (!accessToken) {
        console.error('❌ No access token found');
        setSavingChanges(false);
        return;
      }

      console.log('💾 Starting save process for anime:', editingAnime.title);
      console.log('📝 Form data:', editFormData);

      // Parse dates
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        return {
          year: parseInt(parts[0]),
          month: parseInt(parts[1]),
          day: parseInt(parts[2]),
        };
      };

      // Status mapping to AniList format
      const statusMap = {
        watching: 'CURRENT',
        planning: 'PLANNING',
        completed: 'COMPLETED',
        rewatching: 'REPEATING',
        paused: 'PAUSED',
        dropped: 'DROPPED',
      };

      // GraphQL mutation to update anime entry
      const query = `
        mutation SaveMediaListEntry($id: Int, $mediaId: Int, $status: MediaListStatus, $score: Float, $progress: Int, $startedAt: FuzzyDateInput, $completedAt: FuzzyDateInput, $repeat: Int, $notes: String) {
          SaveMediaListEntry(id: $id, mediaId: $mediaId, status: $status, score: $score, progress: $progress, startedAt: $startedAt, completedAt: $completedAt, repeat: $repeat, notes: $notes) {
            id
            mediaId
            status
            score
            progress
            startedAt {
              year
              month
              day
            }
            completedAt {
              year
              month
              day
            }
            repeat
            notes
          }
        }
      `;

      const mediaId = Number(editingAnime.mediaId || editingAnime.id);
      const entryId = editingAnime.mediaListId ? Number(editingAnime.mediaListId) : null;
      
      const variables = {
        id: entryId,
        mediaId: mediaId,
        status: statusMap[editFormData.status] || editFormData.status.toUpperCase(),
        score: editFormData.score ? parseFloat(editFormData.score) : null,
        progress: editFormData.progress ? parseInt(editFormData.progress) : 0,
        startedAt: parseDate(editFormData.startDate),
        completedAt: parseDate(editFormData.endDate),
        repeat: editFormData.rewatches ? parseInt(editFormData.rewatches) : 0,
        notes: editFormData.notes || null,
      };

      console.log('🔄 Sending mutation with entryId:', entryId, 'mediaId:', mediaId);
      console.log('🔄 Full variables:', variables);

      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.errors) {
        console.error('❌ AniList error:', data.errors);
        alert('Error saving: ' + data.errors.map(e => e.message).join(', '));
        setSavingChanges(false);
        return;
      }

      console.log('✅ Saved to AniList:', data.data);

      // Update local state immediately for UI feedback
      setAnimeList(prev => {
        const oldStatus = activeTab;
        const newStatus = editFormData.status;
        
        if (oldStatus !== newStatus) {
          // Move anime to different status
          const updatedOldList = prev[oldStatus].filter(anime => anime.mediaId !== editingAnime.mediaId);
          const updatedAnime = {
            ...editingAnime,
            score: parseInt(editFormData.score) || 0,
            progress: parseInt(editFormData.progress) || 0,
            startDate: editFormData.startDate,
            endDate: editFormData.endDate,
            rewatches: parseInt(editFormData.rewatches) || 0,
            notes: editFormData.notes,
            status: newStatus,
          };
          return {
            ...prev,
            [oldStatus]: updatedOldList,
            [newStatus]: [updatedAnime, ...prev[newStatus]],
          };
        } else {
          // Update in same status - ensure score updates in the list
          return {
            ...prev,
            [oldStatus]: prev[oldStatus].map(anime =>
              anime.mediaId === editingAnime.mediaId
                ? {
                    ...anime,
                    score: parseInt(editFormData.score) || 0,
                    progress: parseInt(editFormData.progress) || 0,
                    startDate: editFormData.startDate,
                    endDate: editFormData.endDate,
                    rewatches: parseInt(editFormData.rewatches) || 0,
                    notes: editFormData.notes,
                  }
                : anime
            ),
          };
        }
      });

      // Show success message
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        handleCloseModal();
      }, 1500);
    } catch (error) {
      console.error('❌ Error saving changes:', error);
      alert('Error: ' + error.message);
      setSavingChanges(false);
    } finally {
      setSavingChanges(false);
    }
  };

  const handleDeleteAnime = async () => {
    if (!editingAnime) return;
    
    try {
      setDeleteConfirming(true);
      const accessToken = localStorage.getItem('anilist_token');
      if (!accessToken) {
        console.error('No access token found');
        setDeleteConfirming(false);
        setShowDeleteConfirm(false);
        return;
      }

      const query = `
        mutation DeleteMediaListEntry($id: Int) {
          DeleteMediaListEntry(id: $id) {
            deleted
          }
        }
      `;

      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query,
          variables: {
            id: editingAnime.mediaListId,
          },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        console.error('❌ AniList error:', data.errors);
        setDeleteConfirming(false);
        setShowDeleteConfirm(false);
        return;
      }

      console.log('✅ Deleted from AniList:', data.data);

      // Update local state
      setAnimeList(prev => {
        const status = editFormData.status || activeTab;
        return {
          ...prev,
          [status]: prev[status].filter(anime => anime.mediaId !== editingAnime.mediaId),
        };
      });

      // Show success message
      setDeleteSuccess(true);
      setShowDeleteConfirm(false);
      setTimeout(() => {
        setDeleteSuccess(false);
        handleCloseModal();
      }, 1500);
    } catch (error) {
      console.error('❌ Error deleting anime:', error);
      setDeleteConfirming(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-16 relative"> 
      {/* Banner Background - Behind Everything */}
      {(customBackground || user.banner) && (
        <div className="absolute top-16 left-0 right-0 w-full h-48 sm:h-80 lg:h-96 overflow-hidden z-0">
          {customBackground ? (
            // Custom background (image or video)
            customBackground.endsWith('.mp4') ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full min-h-full"
                style={{ 
                  minWidth: '100%',
                  minHeight: '100%',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  imageRendering: '-webkit-optimize-contrast',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  willChange: 'transform',
                  WebkitFontSmoothing: 'antialiased'
                }}
              >
                <source src={customBackground} type="video/mp4" />
              </video>
            ) : (
              <img
                src={customBackground}
                alt="Profile Background"
                loading="eager"
                className="w-full h-full min-h-full"
                style={{ 
                  minWidth: '100%',
                  minHeight: '100%',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  imageRendering: 'crisp-edges',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  willChange: 'transform',
                  WebkitFontSmoothing: 'antialiased',
                  MozImageRendering: 'crisp-edges',
                  msInterpolationMode: 'nearest-neighbor',
                  imageResolution: '300dpi'
                }}
                srcSet={`${customBackground} 1x, ${customBackground} 2x`}
              />
            )
          ) : (
            // AniList banner fallback
            <img
              src={user.banner}
              alt="Profile Banner"
              loading="eager"
              className="w-full h-full min-h-full"
              style={{ 
                minWidth: '100%',
                minHeight: '100%',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                imageRendering: 'crisp-edges',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                willChange: 'transform',
                WebkitFontSmoothing: 'antialiased',
                MozImageRendering: 'crisp-edges',
                msInterpolationMode: 'nearest-neighbor',
                imageResolution: '300dpi'
              }}
              srcSet={`${user.banner} 1x, ${user.banner} 2x`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]" style={{
            background: 'linear-gradient(to bottom, transparent 0%, transparent 20%, #0a0a0a 100%)'
          }}></div>
        </div>
      )}
      
      <div className="w-full relative z-10">
        {/* Header with User Info */}
        <div className={`px-3 sm:px-6 max-w-7xl mx-auto ${(customBackground || user.banner) ? 'pt-20 sm:pt-44 lg:pt-56' : 'pt-12'} mb-6 sm:mb-8`}>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-6 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-4 w-full sm:w-auto">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-14 h-14 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl object-cover shadow-2xl flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 truncate">{user.name}</h1>
                {aniListActive && (
                  <p className="text-white/60 text-[10px] sm:text-sm flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full inline-block flex-shrink-0"></span>
                    <span className="truncate">Connected to AniList</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleOpenBackgroundSelector}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg backdrop-blur-md bg-black/30 hover:bg-black/50 border border-white/20 hover:border-white/40 transition-all flex items-center gap-2 text-xs sm:text-sm font-medium text-white shadow-lg"
                title={getTranslation(language, "background")}
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{getTranslation(language, "background")}</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg backdrop-blur-md bg-black/30 hover:bg-black/50 border border-white/20 hover:border-white/40 transition-all flex items-center gap-2 text-xs sm:text-sm font-medium text-white shadow-lg"
                title={getTranslation(language, "settings")}
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{getTranslation(language, "settings")}</span>
              </button>
            </div>
          </div>

          {/* Stats Cards - Optimized with borders and bigger icons */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
            <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-cyan-500/20 rounded border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm sm:text-base">▶</span>
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-bold">{formatNumber(userStats.totalAnime, language)}</p>
              <p className="text-white/60 text-xs mt-1">{getTranslation(language, 'totalAnime')}</p>
            </div>

            <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-pink-500/20 rounded border border-pink-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm sm:text-base">⏱</span>
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-bold">{formatNumber(userStats.totalEpisodes, language)}</p>
              <p className="text-white/60 text-xs mt-1">{getTranslation(language, 'episodes')}</p>
            </div>

            <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-green-500/20 rounded border border-green-500/30 flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faClock} className="text-sm sm:text-base" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-bold">{formatNumber(userStats.daysWatched, language)}</p>
              <p className="text-white/60 text-xs mt-1">{getTranslation(language, 'daysWatched')}</p>
            </div>
          </div>
        </div>

        {/* Tabs with Navigation Arrows - Genre Style */}
        <div className="mb-8 px-3 sm:px-6 max-w-7xl mx-auto">
          {/* Desktop: Centered tabs without navigation buttons */}
          <div className="hidden md:block">
            <div className="flex gap-0 pb-2">
              {[ 
                { id: 'watching', label: getTranslation(language, 'watching'), count: animeList.watching.length, color: 'bg-green-500' },
                { id: 'planning', label: getTranslation(language, 'planning'), count: animeList.planning.length, color: 'bg-purple-500' },
                { id: 'completed', label: getTranslation(language, 'completed'), count: animeList.completed.length, color: 'bg-blue-500' },
                { id: 'rewatching', label: getTranslation(language, 'rewatching'), count: animeList.rewatching.length, color: 'bg-orange-500' },
                { id: 'paused', label: getTranslation(language, 'paused'), count: animeList.paused.length, color: 'bg-yellow-500' },
                { id: 'dropped', label: getTranslation(language, 'dropped'), count: animeList.dropped.length, color: 'bg-red-500' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className="relative flex items-center gap-2 px-4 py-2 transition-all duration-200 group"
                >
                  <span className={`w-2 h-2 rounded-full ${tab.color}`}></span>
                  <span className="text-white text-sm font-medium tracking-tight whitespace-nowrap">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-white/10 text-white/60'
                    }`}>
                      {formatNumber(tab.count, language)}
                    </span>
                  )}
                  {/* White underline for active tab */}
                  {activeTab === tab.id && (
                    <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-white"></span>
                  )}
                  {/* Gray underline on hover for inactive tabs */}
                  {activeTab !== tab.id && (
                    <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  )}
                </button>
              ))}
            </div>
            {/* Ruler line */}
            <div className="border-b border-white/10"></div>
          </div>

          {/* Mobile: Dropdown tabs */}
          <div className="md:hidden relative">
            <button
              onClick={() => setMobileTabDropdownOpen(!mobileTabDropdownOpen)}
              className="w-full px-3 py-2.5 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-white/10 rounded-lg text-sm text-white font-medium transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  activeTab === 'watching' ? 'bg-green-500' :
                  activeTab === 'planning' ? 'bg-purple-500' :
                  activeTab === 'completed' ? 'bg-blue-500' :
                  activeTab === 'rewatching' ? 'bg-orange-500' :
                  activeTab === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></span>
                <span className="tracking-tight">
                  {getTranslation(language, activeTab)}
                </span>
              </div>
              <span className={`transition-transform text-sm ${mobileTabDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {mobileTabDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl z-50 overflow-hidden bg-[#0a0a0a] border border-white/10">
                {[
                  { id: 'watching', label: getTranslation(language, 'watching'), count: animeList.watching.length, color: 'bg-green-500' },
                  { id: 'planning', label: getTranslation(language, 'planning'), count: animeList.planning.length, color: 'bg-purple-500' },
                  { id: 'completed', label: getTranslation(language, 'completed'), count: animeList.completed.length, color: 'bg-blue-500' },
                  { id: 'rewatching', label: getTranslation(language, 'rewatching'), count: animeList.rewatching.length, color: 'bg-orange-500' },
                  { id: 'paused', label: getTranslation(language, 'paused'), count: animeList.paused.length, color: 'bg-yellow-500' },
                  { id: 'dropped', label: getTranslation(language, 'dropped'), count: animeList.dropped.length, color: 'bg-red-500' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setCurrentPage(1);
                      setMobileTabDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 transition-all flex items-center justify-between ${
                      activeTab === tab.id
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${tab.color}`}></span>
                      <span className="font-medium tracking-tight text-sm">{tab.label}</span>
                    </div>
                    {tab.count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                        activeTab === tab.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {formatNumber(tab.count, language)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="px-3 sm:px-6 max-w-7xl mx-auto">
          <h2 className="text-lg sm:text-xl font-bold mb-5 capitalize">
            {getTranslation(language, activeTab)}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-white/60 text-sm">Loading anime list...</p>
            </div>
          ) : currentTabAnime.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 text-sm">No anime in this category</p>
            </div>
          ) : (
            <>
              {/* Calculate paginated data */}
              {(() => {
                const totalPages = Math.ceil(currentTabAnime.length / itemsPerPage);
                const startIdx = (currentPage - 1) * itemsPerPage;
                const endIdx = startIdx + itemsPerPage;
                const paginatedAnime = currentTabAnime.slice(startIdx, endIdx);

                return (
                  <>
                    {/* Header Row - Desktop Only */}
                    <div className="hidden md:grid grid-cols-[1fr_120px_140px_60px] gap-6 px-5 py-3 mb-4 bg-[#0a0a0a] border border-white/10 rounded-lg">
                      <div>
                        <span className="text-white/60 font-medium text-xs">{getTranslation(language, 'title')}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-white/60 font-medium text-xs">{getTranslation(language, 'score')}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-white/60 font-medium text-xs">{getTranslation(language, 'progress')}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-white/60 font-medium text-xs">{getTranslation(language, 'actions')}</span>
                      </div>
                    </div>

                    <div className="md:bg-transparent">
                      {/* Mobile Card Layout */}
                      <div className="block md:hidden space-y-3">
                        {paginatedAnime.map((anime, idx) => (
                          <div key={idx} className="bg-[#0a0a0a] border border-white/10 rounded-lg p-3 sm:p-4 hover:border-white/20 hover:bg-white/5 transition-all">
                            <div className="flex gap-3 items-start sm:items-center group cursor-pointer" onClick={() => handleAnimeNavigation(anime)}>
                              {anime.cover && (
                                <img
                                  src={anime.cover}
                                  alt={anime.title}
                                  className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate text-sm sm:text-base group-hover:text-cyan-400 transition-colors">{anime.title}</p>
                                <p className="text-xs text-white/50 mb-2 mt-0.5">{anime.status || '-'}</p>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 text-xs">
                                  <span className="font-medium text-yellow-400">⭐ {formatNumber(anime.score || 0, language)}/{formatNumber(10, language)}</span>
                                  <span className="font-medium text-emerald-400">▶️ {formatNumber(anime.progress || 0, language)}/{anime.totalEpisodes ? formatNumber(anime.totalEpisodes, language) : '?'}</span>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAnime(anime);
                                }}
                                className="text-white/40 hover:text-white transition-colors ml-2 flex-shrink-0 hover:bg-white/10 p-2 rounded"
                              >
                                <FontAwesomeIcon icon={faEllipsisV} className="text-sm" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Desktop Card Layout */}
                      <div className="hidden md:block space-y-3">
                        {paginatedAnime.map((anime, idx) => (
                          <div 
                            key={idx}
                            className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer grid grid-cols-[1fr_120px_140px_60px] gap-6 items-center"
                            onClick={() => handleAnimeNavigation(anime)}
                          >
                            {/* Title Section */}
                            <div className="flex items-center gap-4 min-w-0">
                              {anime.cover && (
                                <img
                                  src={anime.cover}
                                  alt={anime.title}
                                  className="w-11 h-16 rounded-md object-cover flex-shrink-0 hover:opacity-80 transition-opacity"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm hover:text-cyan-400 transition-colors truncate">{anime.title}</p>
                              </div>
                            </div>

                            {/* Score - Centered in its own column */}
                            <div className="text-center">
                              <span className="font-medium text-sm text-white">
                                {anime.score ? `${formatNumber(anime.score, language)}/${formatNumber(10, language)}` : '-'}
                              </span>
                            </div>

                            {/* Progress - Centered in its own column */}
                            <div className="text-center">
                              <span className="font-medium text-sm text-white">
                                {formatNumber(anime.progress || 0, language)}/{anime.totalEpisodes ? formatNumber(anime.totalEpisodes, language) : '?'}
                              </span>
                            </div>

                            {/* Actions - Centered in its own column */}
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => handleEditAnime(anime)}
                                className="text-white/40 hover:text-white transition-colors hover:bg-white/10 p-2 rounded"
                              >
                                <FontAwesomeIcon icon={faEllipsisV} className="text-sm" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pagination Controls - Mobile shows 3 numbers, Desktop shows all */}
                    {totalPages > 1 && (
                      <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-4 sm:p-5 mt-6 sm:mt-8">
                        <div className="flex flex-col gap-4">
                          <p className="text-xs sm:text-sm text-white/60 text-center sm:text-left">
                            {getTranslation(language, 'page')} {formatNumber(currentPage, language)} {getTranslation(language, 'of')} {formatNumber(totalPages, language)} • {formatNumber(startIdx + 1, language)}-{formatNumber(Math.min(endIdx, currentTabAnime.length), language)} {getTranslation(language, 'of')} {formatNumber(currentTabAnime.length, language)}
                          </p>
                          <div className="flex items-center gap-1 sm:gap-2 justify-center sm:justify-start">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-shrink-0 ${
                                currentPage === 1
                                  ? 'bg-white/5 text-white/40 cursor-not-allowed'
                                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                              }`}
                            >
                              ← {getTranslation(language, 'prev')}
                            </button>
                            
                            {/* Mobile: Show only 3 page numbers */}
                            <div className="flex sm:hidden items-center gap-1">
                              {(() => {
                                // Calculate which 3 pages to show
                                let pagesToShow = [];
                                if (totalPages <= 3) {
                                  // If 3 or fewer pages, show all
                                  pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
                                } else if (currentPage === 1) {
                                  // At start: show 1, 2, 3
                                  pagesToShow = [1, 2, 3];
                                } else if (currentPage === totalPages) {
                                  // At end: show last 3
                                  pagesToShow = [totalPages - 2, totalPages - 1, totalPages];
                                } else {
                                  // In middle: show current - 1, current, current + 1
                                  pagesToShow = [currentPage - 1, currentPage, currentPage + 1];
                                }
                                
                                return pagesToShow.map(page => (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all flex-shrink-0 flex items-center justify-center ${
                                      currentPage === page
                                        ? 'bg-white text-black border border-white'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20 border border-white/10'
                                    }`}
                                  >
                                    {formatNumber(page, language)}
                                  </button>
                                ));
                              })()}
                            </div>
                            
                            {/* Desktop: Show all page numbers */}
                            <div className="hidden sm:flex items-center gap-1">
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all flex-shrink-0 flex items-center justify-center ${
                                    currentPage === page
                                      ? 'bg-white text-black border border-white'
                                      : 'bg-white/10 text-white/60 hover:bg-white/20 border border-white/10'
                                  }`}
                                >
                                  {formatNumber(page, language)}
                                </button>
                              ))}
                            </div>
                            
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-shrink-0 ${
                                currentPage === totalPages
                                  ? 'bg-white/5 text-white/40 cursor-not-allowed'
                                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                              }`}
                            >
                              {getTranslation(language, 'next')} →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* Edit Anime Modal */}
      {editingAnime && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4 lg:px-8 xl:px-16 lg:py-16">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-sm sm:max-w-md lg:max-w-4xl max-h-[70vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header with Close Button */}
            {/* Mobile Header - Poster and Title */}
            <div className="md:hidden bg-[#000000] border-b border-[#101012] px-4 py-3 flex justify-between items-center gap-3 flex-shrink-0">
              {editingAnime.cover && (
                <img
                  src={editingAnime.cover}
                  alt={editingAnime.title}
                  className="w-14 h-20 rounded-lg object-cover border border-white/10 shadow-md flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-bold text-white line-clamp-2 sm:line-clamp-3 leading-snug">{editingAnime.title}</p>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={savingChanges || deleteConfirming}
                className="text-white/50 hover:text-white text-xl transition-colors disabled:opacity-50 flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex bg-[#000000] border-b border-[#101012] px-5 py-3 justify-between items-center flex-shrink-0">
              <h2 className="text-base font-bold text-white">{getTranslation(language, 'editAnime')}</h2>
              <button
                onClick={handleCloseModal}
                disabled={savingChanges || deleteConfirming}
                className="text-white/60 hover:text-white bg-[#000000] border border-[#23232a] rounded px-2 py-1 text-base transition-colors disabled:opacity-50"
                title={getTranslation(language, "close")}
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Poster on Top Mobile, Side by Side Desktop */}
            <div className="flex-1 overflow-y-auto">
              {/* Mobile: Poster at top with title on right, form below */}
              <div className="md:hidden flex flex-col gap-3 p-3 sm:p-4 h-full">
                {/* Mobile Form Fields */}
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                  {/* Status - Prominent */}
                  <div className="relative bg-white/5 rounded-lg p-3 border border-white/10">
                    <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">{getTranslation(language, 'status')}</label>
                    <div className="relative">
                      <button
                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                        disabled={savingChanges || deleteConfirming}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <span>
                          {editFormData.status ? getTranslation(language, editFormData.status) : getTranslation(language, 'selectStatus')}
                        </span>
                        <span className={`text-white/60 transition-transform text-xs ${statusDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      {statusDropdownOpen && (
                        <div 
                          className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden max-h-[200px] overflow-y-auto"
                          style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
                          }}
                        >
                          {['watching', 'planning', 'completed', 'rewatching', 'paused', 'dropped'].map((status) => (
                            <button
                              key={status}
                              onClick={() => {
                                setEditFormData({ ...editFormData, status });
                                setStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm transition-all ${
                                editFormData.status === status
                                  ? 'bg-white/10 text-white font-semibold'
                                  : 'text-white/70 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {editFormData.status === status && <span className="text-white text-xs">✓</span>}
                                <span>{getTranslation(language, status)}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score & Progress Row */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Score (0-10) */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">{getTranslation(language, 'score')}</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={editFormData.score || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const capped = Math.min(Math.max(val, 0), 10);
                          setEditFormData({ ...editFormData, score: capped });
                        }}
                        disabled={savingChanges || deleteConfirming}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 hover:bg-white/15 focus:bg-white/20 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="0"
                      />
                    </div>

                    {/* Episode Progress */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">{getTranslation(language, 'progress')}</label>
                      <input
                        type="number"
                        min="0"
                        max={editingAnime.totalEpisodes !== '?' ? editingAnime.totalEpisodes : undefined}
                        value={editFormData.progress || ''}
                        onChange={(e) => {
                          let val = parseInt(e.target.value) || 0;
                          if (editingAnime.totalEpisodes !== '?') {
                            val = Math.min(Math.max(val, 0), editingAnime.totalEpisodes);
                          }
                          setEditFormData({ ...editFormData, progress: val });
                        }}
                        disabled={savingChanges || deleteConfirming}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 hover:bg-white/15 focus:bg-white/20 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="0"
                      />
                      <p className="text-xs text-white/50 mt-1.5 font-medium">/ {editingAnime.totalEpisodes}</p>
                    </div>
                  </div>

                  {/* Start & End Date Row */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Start Date */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">{getTranslation(language, 'start')}</label>
                      <input
                        type="date"
                        value={editFormData.startDate}
                        onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                        disabled={savingChanges || deleteConfirming}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 hover:bg-white/15 focus:bg-white/20 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* End Date */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">{getTranslation(language, 'end')}</label>
                      <input
                        type="date"
                        value={editFormData.endDate}
                        onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                        disabled={savingChanges || deleteConfirming}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 hover:bg-white/15 focus:bg-white/20 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Rewatches */}
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">{getTranslation(language, 'rewatches')}</label>
                    <input
                      type="number"
                      min="0"
                      value={editFormData.rewatches || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, rewatches: parseInt(e.target.value) || 0 })}
                      disabled={savingChanges || deleteConfirming}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 hover:bg-white/15 focus:bg-white/20 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="0"
                    />
                  </div>

                  {/* Notes */}
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex flex-col flex-1">
                    <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">{getTranslation(language, 'notes')}</label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      disabled={savingChanges || deleteConfirming}
                      className="flex-1 w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 hover:bg-white/15 focus:bg-white/20 focus:border-cyan-500 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed min-h-[80px]"
                      placeholder={getTranslation(language, "addNotes")}
                    />
                  </div>
                </div>
              </div>

              {/* Desktop: Poster on Left, Form on Right */}
              <div className="hidden md:flex gap-6 lg:gap-8 p-4 lg:p-6 h-full">
                {/* Left Side - Poster */}
                <div className="flex flex-col items-center gap-3 flex-shrink-0">
                  {editingAnime.cover && (
                    <>
                      <img
                        src={editingAnime.cover}
                        alt={editingAnime.title}
                        className="w-28 h-40 lg:w-40 lg:h-56 rounded-lg object-cover border border-white/10 shadow-lg"
                      />
                      <div className="text-center w-28 lg:w-40">
                        <p className="text-xs lg:text-sm font-bold text-white line-clamp-3 lg:line-clamp-4 leading-tight">{editingAnime.title}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Side - Form Fields Grid */}
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  {/* Status, Score, Progress Row */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Status */}
                    <div className="relative">
                      <label className="block text-xs lg:text-sm font-semibold text-white/70 mb-1.5 uppercase tracking-wide">{getTranslation(language, 'status')}</label>
                      <button
                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                        disabled={savingChanges || deleteConfirming}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-white hover:bg-white/10 focus:bg-white/15 focus:border-white/40 transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="truncate">
                          {editFormData.status ? getTranslation(language, editFormData.status) : getTranslation(language, 'selectStatus')}
                        </span>
                        <span className={`text-white/60 transition-transform text-xs lg:text-sm ${statusDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      {statusDropdownOpen && (
                        <div 
                          className="absolute top-full left-0 right-0 mt-1 lg:-mt-3 bg-[#0a0a0a] border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden max-h-[200px] overflow-y-auto"
                          style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
                          }}
                        >
                          <style>{`
                            .absolute.top-full::-webkit-scrollbar {
                              width: 5px;
                            }
                            .absolute.top-full::-webkit-scrollbar-track {
                              background: transparent;
                            }
                            .absolute.top-full::-webkit-scrollbar-thumb {
                              background-color: rgba(255, 255, 255, 0.2);
                              border-radius: 20px;
                            }
                          `}</style>
                          {['watching', 'planning', 'completed', 'rewatching', 'paused', 'dropped'].map((status) => (
                            <button
                              key={status}
                              onClick={() => {
                                setEditFormData({ ...editFormData, status });
                                setStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm transition-all ${
                                editFormData.status === status
                                  ? 'bg-white/10 text-white font-semibold'
                                  : 'text-white/70 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {editFormData.status === status && <span className="text-white text-xs lg:text-sm">✓</span>}
                                <span className="truncate">{getTranslation(language, status)}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Score (0-10) */}
                    <div>
                      <label className="block text-xs lg:text-sm font-semibold text-white/70 mb-1.5 uppercase tracking-wide">{getTranslation(language, 'score')}</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={editFormData.score || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const capped = Math.min(Math.max(val, 0), 10);
                          setEditFormData({ ...editFormData, score: capped });
                        }}
                        disabled={savingChanges || deleteConfirming}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-white placeholder-white/40 hover:bg-white/10 focus:bg-white/15 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="0"
                      />
                    </div>

                    {/* Episode Progress */}
                    <div>
                      <label className="block text-xs lg:text-sm font-semibold text-white/70 mb-1.5 uppercase tracking-wide">{getTranslation(language, 'progress')}</label>
                      <input
                        type="number"
                        min="0"
                        max={editingAnime.totalEpisodes !== '?' ? editingAnime.totalEpisodes : undefined}
                        value={editFormData.progress || ''}
                        onChange={(e) => {
                          let val = parseInt(e.target.value) || 0;
                          if (editingAnime.totalEpisodes !== '?') {
                            val = Math.min(Math.max(val, 0), editingAnime.totalEpisodes);
                          }
                          setEditFormData({ ...editFormData, progress: val });
                        }}
                        disabled={savingChanges || deleteConfirming}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-white placeholder-white/40 hover:bg-white/10 focus:bg-white/15 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="0"
                      />
                      <p className="text-xs text-white/50 mt-1">Max: {editingAnime.totalEpisodes}</p>
                    </div>
                  </div>

                  {/* Start Date, End Date, Rewatches Row */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Start Date */}
                    <div>
                      <label className="block text-xs lg:text-sm font-semibold text-white/70 mb-1.5 uppercase tracking-wide">{getTranslation(language, "start")}</label>
                      <input
                        type="date"
                        value={editFormData.startDate}
                        onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                        disabled={savingChanges || deleteConfirming}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-white placeholder-white/40 hover:bg-white/10 focus:bg-white/15 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-xs lg:text-sm font-semibold text-white/70 mb-1.5 uppercase tracking-wide">{getTranslation(language, "end")}</label>
                      <input
                        type="date"
                        value={editFormData.endDate}
                        onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                        disabled={savingChanges || deleteConfirming}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-white placeholder-white/40 hover:bg-white/10 focus:bg-white/15 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Rewatches */}
                    <div>
                      <label className="block text-xs lg:text-sm font-semibold text-white/70 mb-1.5 uppercase tracking-wide">{getTranslation(language, 'rewatches')}</label>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.rewatches || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, rewatches: parseInt(e.target.value) || 0 })}
                        disabled={savingChanges || deleteConfirming}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-white placeholder-white/40 hover:bg-white/10 focus:bg-white/15 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Notes - Full Width, Flex to Fill */}
                  <div className="flex-1 min-h-0 flex flex-col">
                    <label className="block text-xs lg:text-sm font-semibold text-white/70 mb-1.5 uppercase tracking-wide">{getTranslation(language, 'notes')}</label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      disabled={savingChanges || deleteConfirming}
                      className="flex-1 w-full bg-white/5 border border-white/20 rounded-lg px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-white placeholder-white/40 hover:bg-white/10 focus:bg-white/15 focus:border-cyan-500 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={getTranslation(language, "notesPlaceholder")}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Clean and Simple */}
            {/* Desktop Footer */}
            <div className="hidden md:flex bg-[#000000] border-t border-[#101012] px-5 py-3 justify-between items-center flex-shrink-0">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={savingChanges || deleteConfirming}
                className="px-3 py-1 bg-red-600 hover:bg-red-600 text-white hover:text-white border border-[#23232a] hover:border-red-600 rounded text-base font-semibold transition-all flex-shrink-0"
                title={getTranslation(language, "deleteEntry")}
              >
                🗑️ {getTranslation(language, 'deleteEntry')}
              </button>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={handleCloseModal}
                  disabled={savingChanges || deleteConfirming}
                  className="px-3 py-1 bg-[#23232a] hover:bg-[#23232a]/80 text-white/70 hover:text-white border border-[#23232a] rounded text-base font-medium transition-all"
                >
                  {getTranslation(language, 'cancel')}
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={savingChanges || deleteConfirming}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white border border-green-700 rounded text-base font-medium transition-all flex items-center gap-2"
                >
                  {saveSuccess ? (
                    <>✅ {getTranslation(language, 'saved')}</>
                  ) : savingChanges ? (
                    <>
                      <FontAwesomeIcon icon={faSync} className="animate-spin text-base" />
                      <span>{getTranslation(language, "saving")}</span>
                    </>
                  ) : (
                    <>💾 {getTranslation(language, 'saveChanges')}</>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="md:hidden bg-[#000000] border-t border-[#101012] px-4 py-3 flex gap-2 justify-between items-center flex-shrink-0">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={savingChanges || deleteConfirming}
                className="px-3 py-2 bg-red-600 hover:bg-red-600 text-white hover:text-white border border-[#23232a] hover:border-red-600 rounded text-sm font-semibold transition-all flex-shrink-0"
                title={getTranslation(language, "deleteEntry")}
              >
                🗑️ {getTranslation(language, 'deleteEntry')}
              </button>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={handleCloseModal}
                  disabled={savingChanges || deleteConfirming}
                  className="px-3 py-2 bg-[#23232a] hover:bg-[#23232a]/80 text-white/70 hover:text-white border border-[#23232a] rounded text-sm font-medium transition-all"
                >
                  {getTranslation(language, 'cancel')}
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={savingChanges || deleteConfirming}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white border border-green-700 rounded text-sm font-medium transition-all flex items-center gap-2"
                >
                  {saveSuccess ? (
                    <>✅ {getTranslation(language, 'saved')}</>
                  ) : savingChanges ? (
                    <>
                      <FontAwesomeIcon icon={faSync} className="animate-spin text-sm" />
                      <span>{getTranslation(language, "saving")}</span>
                    </>
                  ) : (
                    <>💾 {getTranslation(language, 'saveChanges')}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && editingAnime && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-2 sm:p-3">
          <div className="bg-[#1a1a1a] rounded-lg border border-red-500/30 max-w-md w-full flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#0f0f12] border-b border-red-500/30 px-4 sm:px-6 py-4">
              <h2 className="text-base sm:text-lg font-bold text-white">Remove Anime from List?</h2>
            </div>

            {/* Modal Content */}
            <div className="px-4 sm:px-6 py-4 flex-1">
              {deleteSuccess ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-white font-semibold mb-2">Anime Removed!</p>
                  <p className="text-white/60 text-sm">"{editingAnime.title}" has been removed from your list and AniList.</p>
                </div>
              ) : (
                <>
                  <p className="text-white/80 mb-4">{getTranslation(language, "areYouSure")} <span className="font-semibold text-white">"{editingAnime.title}"</span> {getTranslation(language, "fromYourList")}</p>
                  <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                    <p className="text-xs text-red-400">⚠️ This action cannot be undone. The anime will be removed from both your profile and AniList.</p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!deleteSuccess && (
              <div className="bg-[#0f0f12] border-t border-red-500/30 px-4 sm:px-6 py-3 flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteConfirming}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white disabled:text-white/50 text-xs font-medium rounded transition-all border border-white/10 hover:border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAnime}
                  disabled={deleteConfirming}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:bg-red-500/10 text-red-400 hover:text-red-300 disabled:text-red-400/50 text-xs font-medium rounded transition-all border border-red-500/30 hover:border-red-500/50 disabled:border-red-500/20 flex items-center gap-1.5"
                >
                  {deleteConfirming ? (
                    <>
                      <FontAwesomeIcon icon={faSync} className="animate-spin text-xs" />
                      Deleting...
                    </>
                  ) : (
                    '🗑️ Remove'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Background Selector Modal */}
      {showBackgroundSelector && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3"
          onClick={() => setShowBackgroundSelector(false)}
        >
          <div 
            className="relative bg-[#0a0a0a] rounded-lg border border-white/10 shadow-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white">
                {getTranslation(language, 'chooseBackground')}
              </h2>
              <button
                onClick={() => setShowBackgroundSelector(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Background Options */}
            <div className="p-3 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                {availableBackgrounds.map((bg) => (
                  <div
                    key={bg.id}
                    onClick={() => setSelectedBackground(bg)}
                    className={`relative cursor-pointer transition-all ${
                      selectedBackground?.id === bg.id
                        ? 'rainbow-border-animated'
                        : 'ring-1 ring-white/10 hover:ring-white/20 rounded-lg overflow-hidden'
                    }`}
                  >
                    <div>
                      {/* Preview */}
                      <div className="aspect-video relative bg-black/20">
                        {bg.type === 'video' ? (
                          <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            className="w-full h-full object-cover"
                          >
                            <source src={bg.path} type="video/mp4" />
                          </video>
                        ) : (
                          <img
                            src={bg.path}
                            alt={bg.name}
                            loading="eager"
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {/* Blurred Rounded Square Checkmark */}
                        {selectedBackground?.id === bg.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="checkmark-glow-container">
                              <div className="w-12 h-12 bg-white/5 backdrop-blur-lg rounded-xl flex items-center justify-center shadow-2xl border border-white/15">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-2.5 bg-[#000000] border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium text-xs">{bg.name}</span>
                          <span className="text-xs text-white/60 px-1.5 py-0.5 bg-white/5 rounded">
                            {bg.type === 'video' ? 'Video' : 'Image'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-3 py-2.5 border-t border-white/10 flex gap-2 justify-end bg-[#0a0a0a]">
              <button
                onClick={() => setShowBackgroundSelector(false)}
                className="px-3 py-2 bg-[#000000] hover:bg-[#1a1a1a] text-white text-xs font-medium rounded-lg transition-colors border border-white/10 hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBackground}
                disabled={!selectedBackground}
                className="px-3 py-2 bg-[#000000] hover:bg-[#1a1a1a] disabled:opacity-50 text-white disabled:text-white/50 text-xs font-medium rounded-lg transition-colors border border-white/10 hover:border-white/20 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes rainbow-slide {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        .rainbow-border-animated {
          position: relative;
          padding: 3px;
          background: linear-gradient(
            90deg,
            #ff006e,
            #ff8500,
            #ffbe0b,
            #00f5ff,
            #0080ff,
            #8338ec,
            #ff006e
          );
          background-size: 300% 100%;
          animation: rainbow-slide 4s linear infinite;
          border-radius: 0.75rem;
        }

        .rainbow-border-animated > div {
          border-radius: 0.625rem;
          background: #0a0a0a;
          overflow: hidden;
        }

        .rainbow-border-animated > div > div:first-child {
          border-top-left-radius: 0.625rem;
          border-top-right-radius: 0.625rem;
          overflow: hidden;
        }

        .rainbow-border-animated > div > div:last-child {
          border-bottom-left-radius: 0.625rem;
          border-bottom-right-radius: 0.625rem;
        }

        .checkmark-glow-container {
          position: relative;
        }

        .checkmark-glow-container::before {
          content: '';
          position: absolute;
          inset: -15px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%);
          filter: blur(15px);
          z-index: -1;
        }
      `}</style>
    </div>
  );
}
