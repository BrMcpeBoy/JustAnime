import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";
import { formatNumber } from "@/src/utils/numberConverter";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faClock,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useRef } from 'react';
import getAnimeIdByTitle from '@/src/utils/getAnimeIdByTitle.js';

// ============= BACKEND API CONFIGURATION =============
// Get backend URL from environment variable
const BACKGROUND_API_URL = import.meta.env.VITE_BACKGROUND_API_URL || 'https://profile-background-backend.vercel.app';
// =====================================================

export default function PublicProfile() {
  const { userId } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [activeTab, setActiveTab] = useState('watching');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileTabDropdownOpen, setMobileTabDropdownOpen] = useState(false);
  const itemsPerPage = 10;
  const [customBackground, setCustomBackground] = useState(null);

  // ============= BACKEND INTEGRATION: Fetch from Database =============
  const fetchUserBackground = async (userIdParam) => {
    try {
      console.log(`🔍 Fetching custom background for user: ${userIdParam}`);
      
      const response = await fetch(`${BACKGROUND_API_URL}/api/background/${userIdParam}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Found custom background:', data.data);
        return data.data.backgroundPath;
      } else {
        console.log('ℹ️ No custom background found, will use default');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching custom background:', error);
      return null;
    }
  };
  // ================================================================

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch user profile data from AniList
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        const query = `
          query ($id: Int) {
            User(id: $id) {
              id
              name
              avatar {
                large
                medium
              }
              bannerImage
              about
            }
          }
        `;

        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: { id: parseInt(userId) }
          })
        });

        const data = await response.json();
        
        if (data.data && data.data.User) {
          const user = data.data.User;
          setProfileUser({
            id: user.id,
            name: user.name,
            avatar: user.avatar?.large || user.avatar?.medium,
            banner: user.bannerImage,
            about: user.about
          });

          // ============= DIRECT BACKGROUND LOADING (Like CommentSection) =============
          // Fetch custom background from backend
          const bgResponse = await fetch(`${BACKGROUND_API_URL}/api/background/${userId}`);
          
          let customBg = null;
          
          if (bgResponse.ok) {
            const bgData = await bgResponse.json();
            if (bgData.success && bgData.data && bgData.data.backgroundPath) {
              customBg = bgData.data.backgroundPath;
            }
          }
          
          // Set background: custom > AniList banner > default
          if (customBg) {
            console.log('✅ Using custom background:', customBg);
            setCustomBackground(customBg);
          } else if (user.bannerImage) {
            console.log('ℹ️ Using AniList banner');
            setCustomBackground(user.bannerImage);
          } else {
            console.log('ℹ️ Using default background');
            setCustomBackground('/profile background/angkorwat.jpg');
          }
          // ======================================================

          // Fetch anime list (stats will be calculated there)
          fetchUserAnimeList(parseInt(userId));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  // Fetch user's anime list
  const fetchUserAnimeList = async (userIdNum) => {
    try {
      const query = `
        query ($userId: Int) {
          MediaListCollection(userId: $userId, type: ANIME) {
            lists {
              name
              status
              entries {
                id
                status
                score
                progress
                repeat
                startedAt { year month day }
                completedAt { year month day }
                notes
                media {
                  id
                  title { romaji english native }
                  coverImage { large }
                  episodes
                  format
                  status
                  genres
                  averageScore
                  seasonYear
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { userId: userIdNum }
        })
      });

      const data = await response.json();
      
      if (data.data && data.data.MediaListCollection) {
        const lists = data.data.MediaListCollection.lists;
        const organized = {
          watching: [],
          planning: [],
          completed: [],
          rewatching: [],
          paused: [],
          dropped: [],
        };

        lists.forEach(list => {
          const status = list.status?.toLowerCase();
          const mappedEntries = list.entries.map(entry => ({
            id: entry.id,
            title: entry.media.title.romaji || entry.media.title.english,
            cover: entry.media.coverImage.large,
            score: entry.score,
            progress: entry.progress,
            totalEpisodes: entry.media.episodes,
            status: entry.media.status,
            genres: entry.media.genres,
            format: entry.media.format,
            seasonYear: entry.media.seasonYear,
            anilistMediaId: entry.media.id
          }));

          if (status === 'current') {
            organized.watching = mappedEntries;
          } else if (status === 'planning') {
            organized.planning = mappedEntries;
          } else if (status === 'completed') {
            organized.completed = mappedEntries;
          } else if (status === 'repeating') {
            organized.rewatching = mappedEntries;
          } else if (status === 'paused') {
            organized.paused = mappedEntries;
          } else if (status === 'dropped') {
            organized.dropped = mappedEntries;
          }
        });

        setAnimeList(organized);
        
        // Calculate stats from anime list (like Profile.jsx)
        const totalAnime = Object.values(organized).flat().length;
        const totalEpisodes = Object.values(organized).flat().reduce((sum, anime) => sum + (anime.progress || 0), 0);
        const daysWatched = totalEpisodes * 0.42; // Rough estimate: ~25 min per episode
        
        console.log('📊 Calculated stats from anime list:', {
          totalAnime,
          totalEpisodes,
          daysWatched: Math.round(daysWatched * 10) / 10
        });
        
        setUserStats({
          totalAnime,
          totalEpisodes,
          daysWatched: Math.round(daysWatched * 10) / 10,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching anime list:', error);
      setLoading(false);
    }
  };

  const handleAnimeNavigation = async (anime) => {
    try {
      const animeIdResult = await getAnimeIdByTitle(anime.title);
      if (animeIdResult) {
        navigate(`/${animeIdResult}`);
      }
    } catch (error) {
      console.error('Error navigating to anime:', error);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  if (loading && !profileUser) {
    return (
      <div className="w-full min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="w-full min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">User not found</div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Current tab data
  const currentTabAnime = animeList[activeTab] || [];
  const totalPages = Math.ceil(currentTabAnime.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedAnime = currentTabAnime.slice(startIdx, endIdx);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-16 relative">
      {/* Back Button - Aligned with content container, absolute position */}
      {(customBackground || profileUser?.banner) && (
        <div className="absolute top-[72px] sm:top-20 left-0 right-0 z-50 pointer-events-none">
          <div className="px-3 sm:px-6 max-w-7xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg backdrop-blur-md bg-black/30 hover:bg-black/50 border border-white/20 hover:border-white/40 transition-all flex items-center gap-2 text-xs sm:text-sm font-medium text-white shadow-lg cursor-pointer pointer-events-auto"
              title={getTranslation(language, 'back')}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{getTranslation(language, 'back')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Banner Background - Same as Profile.jsx */}
      {(customBackground || profileUser?.banner) && (
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
              src={profileUser.banner}
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
              srcSet={`${profileUser.banner} 1x, ${profileUser.banner} 2x`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]" style={{
            background: 'linear-gradient(to bottom, transparent 0%, transparent 20%, #0a0a0a 100%)'
          }}></div>
        </div>
      )}
      
      <div className="w-full relative z-10">
        {/* Header with User Info - Closer to banner */}
        <div className={`px-3 sm:px-6 max-w-7xl mx-auto ${(customBackground || profileUser?.banner) ? 'pt-20 sm:pt-44 lg:pt-56' : 'pt-12'} mb-6 sm:mb-8`}>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-6 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-4 w-full sm:w-auto">
              {profileUser.avatar && (
                <img
                  src={profileUser.avatar}
                  alt={profileUser.name}
                  className="w-14 h-14 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl object-cover shadow-2xl flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 truncate">{profileUser.name}</h1>
                <p className="text-white/60 text-[10px] sm:text-sm flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full inline-block flex-shrink-0"></span>
                  <span className="truncate">Connected to AniList</span>
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards - Optimized with borders and bigger icons */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
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
              className="w-full px-4 py-3 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-white/10 rounded-lg text-sm text-white font-medium transition-all flex items-center justify-between"
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
              <span className={`transition-transform ${mobileTabDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {mobileTabDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto bg-[#0a0a0a] border border-white/10">
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
                    className={`w-full text-left px-4 py-3 transition-all flex items-center justify-between ${
                      activeTab === tab.id
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${tab.color}`}></span>
                      <span className="font-medium tracking-tight">{tab.label}</span>
                    </div>
                    {tab.count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
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

        {/* Anime List - READ ONLY, exact same styling as Profile.jsx */}
        <div className="px-3 sm:px-6 max-w-7xl mx-auto mb-12">
          {loading ? (
            <div className="text-center py-8 text-white/60">
              Loading anime list...
            </div>
          ) : currentTabAnime.length === 0 ? (
            <div className="bg-[#0a0a0a] rounded-lg p-8 border border-white/10 text-center">
              <p className="text-white/60">No anime in this list</p>
            </div>
          ) : (
            <>
              {/* Header Row - Desktop Only */}
              <div className="hidden md:grid grid-cols-[1fr_120px_140px] gap-6 px-5 py-3 mb-4 bg-[#0a0a0a] border border-white/10 rounded-lg">
                <div>
                  <span className="text-white/60 font-medium text-xs">{getTranslation(language, 'title')}</span>
                </div>
                <div className="text-center">
                  <span className="text-white/60 font-medium text-xs">{getTranslation(language, 'score')}</span>
                </div>
                <div className="text-center">
                  <span className="text-white/60 font-medium text-xs">{getTranslation(language, 'progress')}</span>
                </div>
              </div>

              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-3">
                {paginatedAnime.map((anime, idx) => (
                  <div 
                    key={idx} 
                    className="bg-[#0a0a0a] border border-white/10 rounded-lg p-3 sm:p-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer"
                    onClick={() => handleAnimeNavigation(anime)}
                  >
                    <div className="flex gap-3 items-start sm:items-center group">
                      {anime.cover && (
                        <img
                          src={anime.cover}
                          alt={anime.title}
                          className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg object-cover flex-shrink-0 hover:opacity-80 transition-opacity"
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
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Card Layout */}
              <div className="hidden md:block space-y-3">
                {paginatedAnime.map((anime, idx) => (
                  <div 
                    key={idx}
                    className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer grid grid-cols-[1fr_120px_140px] gap-6 items-center"
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

                    {/* Score */}
                    <div className="text-center">
                      <span className="font-medium text-sm text-white">
                        {anime.score ? `${formatNumber(anime.score, language)}/${formatNumber(10, language)}` : '-'}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="text-center">
                      <span className="font-medium text-sm text-white">
                        {formatNumber(anime.progress || 0, language)}/{anime.totalEpisodes ? formatNumber(anime.totalEpisodes, language) : '?'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination - Mobile shows 3 numbers, Desktop shows all */}
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
          )}
        </div>
      </div>
    </div>
  );
}
