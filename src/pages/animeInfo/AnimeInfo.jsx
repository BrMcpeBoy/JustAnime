import getAnimeInfo from "@/src/utils/getAnimeInfo.utils";
import getAnimeIdByTitle from "@/src/utils/getAnimeIdByTitle.js";
import { updateAniListStatus } from "@/src/utils/updateAniListStatus";
import { getTranslation, translateEpisodeInfo } from "@/src/translations/translations";
import { formatNumber } from "@/src/utils/numberConverter";
import { updateAniListProgress } from "@/src/utils/updateAniListProgress";
import { getAniListMediaId } from "@/src/utils/getAniListMediaId";
import { getAnimeCurrentStatus } from "@/src/utils/getAnimeCurrentStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faClosedCaptioning,
  faMicrophone,
  faPlus,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import website_name from "@/src/config/website";
import CategoryCard from "@/src/components/categorycard/CategoryCard";
import Sidecard from "@/src/components/sidecard/Sidecard";
import Loader from "@/src/components/Loader/Loader";
import Error from "@/src/components/error/Error";
import { useLanguage } from "@/src/context/LanguageContext";
import { useHomeInfo } from "@/src/context/HomeInfoContext";
import { useAuth } from "@/src/context/AuthContext";
import Voiceactor from "@/src/components/voiceactor/Voiceactor";
import CommentSection from "@/src/components/comments/CommentSection";

function InfoItem({ label, value, isProducer = true }) {
  return (
    value && (
      <div className="text-[11px] sm:text-[14px] font-medium transition-all duration-300">
        <span className="text-gray-400">{`${label}: `}</span>
        <span className="font-light text-white/90">
          {Array.isArray(value) ? (
            value.map((item, index) =>
              isProducer ? (
                <Link
                  to={`/producer/${item
                    .replace(/[&'"^%$#@!()+=<>:;,.?/\\|{}[\]`~*_]/g, "")
                    .split(" ")
                    .join("-")
                    .replace(/-+/g, "-")}`}
                  key={index}
                  className="cursor-pointer transition-colors duration-300 hover:text-gray-300"
                >
                  {item}
                  {index < value.length - 1 && ", "}
                </Link>
              ) : (
                <span key={index}>
                  {item}
                  {index < value.length - 1 && ", "}
                </span>
              )
            )
          ) : isProducer ? (
            <Link
              to={`/producer/${value
                .replace(/[&'"^%$#@!()+=<>:;,.?/\\|{}[\]`~*_]/g, "")
                .split(" ")
                .join("-")
                .replace(/-+/g, "-")}`}
              className="cursor-pointer transition-colors duration-300 hover:text-gray-300"
            >
              {value}
            </Link>
          ) : (
            <span>{value}</span>
          )}
        </span>
      </div>
    )
  );
}

function Tag({ bgColor, index, icon, text }) {
  return (
    <div
      className="flex space-x-1 justify-center items-center bg-[#0a0a0a] rounded-md border border-white/10 hover:border-white/20 px-1.5 py-0.5 md:px-2.5 md:py-1 transition-colors duration-200"
    >
      {icon && <FontAwesomeIcon icon={icon} className="text-[11px] md:text-[13px] text-gray-300" />}
      <p className="text-[11px] md:text-[13px] font-medium text-gray-300">{text}</p>
    </div>
  );
}

function AnimeInfo({ random = false }) {
  const { language, titleLanguage } = useLanguage();
  const { id: paramId } = useParams();
  const location = useLocation();
  const id = random ? null : paramId;
  const [isFull, setIsFull] = useState(false);
  const [animeInfo, setAnimeInfo] = useState(null);
  const [seasons, setSeasons] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [watchProgress, setWatchProgress] = useState({});
  const { homeInfo } = useHomeInfo();
  const { id: currentId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-dropdown-menu]')) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  // Load continue watching data from localStorage
  useEffect(() => {
    const loadWatchProgress = () => {
      const continueWatchingData = JSON.parse(
        localStorage.getItem("continueWatching") || "[]"
      );
      
      const progressMap = {};
      continueWatchingData.forEach((item) => {
        const animeId = String(item.id);
        if (!progressMap[animeId]) {
          progressMap[animeId] = {
            episodeId: item.episodeId,
            episodeNum: item.episodeNum,
          };
        }
      });
      
      setWatchProgress(progressMap);
    };

    loadWatchProgress();

    const handleStorageChange = (e) => {
      if (e.key === "continueWatching") {
        loadWatchProgress();
      }
    };

    const handleLocalStorageChange = () => {
      loadWatchProgress();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("continueWatchingUpdated", handleLocalStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("continueWatchingUpdated", handleLocalStorageChange);
    };
  }, []);

  useEffect(() => {
    if (id === "404-not-found-page") {
      console.log("404 got!");
      return null;
    }
    
    const fetchAnimeInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('🎬 [AnimeInfo] AnimeInfo mounted with ID:', id);
        let data = null;
        
        // Check if we have a title in sessionStorage (came from Profile)
        const animeTitle = sessionStorage.getItem('anilist_anime_title');
        
        if (animeTitle && animeTitle.trim()) {
          // We came from Profile with an already-resolved ID
          console.log('📌 [AnimeInfo] Came from Profile - title:', animeTitle);
          console.log('✅ [AnimeInfo] Using already-resolved ID from URL:', id);
          
          // The Profile page already matched and resolved the correct ID
          // So we should just use that ID directly instead of re-searching
          try {
            data = await getAnimeInfo(id, random);
            
            if (data?.data?.title) {
              console.log('✅ [AnimeInfo] SUCCESS! Got anime:', data.data.title);
              // Clean up sessionStorage
              sessionStorage.removeItem('anilist_anime_title');
            } else {
              console.error('❌ [AnimeInfo] Invalid data structure from fetch');
              throw new Error('Invalid anime data from API');
            }
          } catch (fetchErr) {
            console.error('❌ [AnimeInfo] Error fetching anime with resolved ID:', fetchErr.message || fetchErr);
            setError(fetchErr);
            setAnimeInfo(null);
            setLoading(false);
            return;
          }
        } else {
          // No title in sessionStorage - try direct fetch with provided ID
          console.log('📡 [AnimeInfo] No title found, trying direct fetch with ID:', id);
          
          try {
            data = await getAnimeInfo(id, random);
            
            if (data?.data?.title) {
              console.log('✅ [AnimeInfo] Direct fetch SUCCESS:', data.data.title);
            } else {
              console.error('❌ [AnimeInfo] Direct fetch returned invalid data');
              throw new Error('Invalid anime data');
            }
          } catch (directErr) {
            console.error('❌ [AnimeInfo] Direct fetch failed:', directErr.message || directErr);
            setError(directErr);
            setAnimeInfo(null);
            setLoading(false);
            return;
          }
        }
        
        // Validate we have data
        if (!data?.data || !data.data.title) {
          console.error('❌ [AnimeInfo] No valid anime data');
          throw new Error('Failed to load anime data');
        }
        
        console.log('✅ [AnimeInfo] Setting anime info:', data.data.title);
        setSeasons(data?.seasons);
        setAnimeInfo(data.data);
      } catch (err) {
        console.error("❌ [AnimeInfo] Error:", err.message || err);
        setError(err);
        setAnimeInfo(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnimeInfo();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, random]);
  useEffect(() => {
    if (animeInfo && location.pathname === `/${animeInfo.id}`) {
      document.title = `Watch ${animeInfo.title} English Sub/Dub online Free on ${website_name}`;
    }
    return () => {
      document.title = `${website_name} | Free anime streaming platform`;
    };
  }, [animeInfo]);

  // Load current anime status from AniList when anime info is loaded
  useEffect(() => {
    if (!animeInfo?.title || !isAuthenticated) return;

    const loadCurrentStatus = async () => {
      try {
        const accessToken = localStorage.getItem('anilist_token');
        if (!accessToken) return;

        console.log(`📦 Loading current status for: ${animeInfo.title}`);
        
        // Get the AniList media ID
        const mediaId = await getAniListMediaId(animeInfo.title);
        
        // Get the current status
        const statusData = await getAnimeCurrentStatus({ 
          accessToken, 
          mediaId 
        });

        if (statusData) {
          console.log(`✅ Current status: ${statusData.status}`);
          setSelectedStatus(statusData.status);
        } else {
          console.log('ℹ️ Anime not yet in user\'s list');
          setSelectedStatus(null);
        }
      } catch (error) {
        console.error('⚠️ Error loading status:', error);
        // Silently fail - user can still add to list
      }
    };

    loadCurrentStatus();
  }, [animeInfo?.title, isAuthenticated]);

  const handleAddToList = async (status) => {
    if (!isAuthenticated || !user) {
      navigate('/page/auth/login');
      return;
    }

    try {
      setSelectedStatus(status);
      setDropdownOpen(false);

      // Get access token from localStorage
      const accessToken = localStorage.getItem('anilist_token');
      if (!accessToken) {
        console.error('❌ No access token found');
        alert('No access token found. Please log in again.');
        return;
      }

      // Get the anime title for AniList search
      const title = animeInfo?.title;
      if (!title) {
        console.error('❌ No anime title found');
        alert('Could not find anime title');
        return;
      }

      // Search for AniList media ID
      console.log(`🔍 Searching AniList for: ${title}`);
      const mediaId = await getAniListMediaId(title);

      // Update AniList status
      console.log(`🔄 Updating AniList for anime: ${title} (ID: ${mediaId}), status: ${status}`);
      const result = await updateAniListStatus({ 
        accessToken, 
        mediaId, 
        status 
      });

      // If status is 'watching' or 'rewatching', set progress to 1
      if (status === 'watching' || status === 'rewatching') {
        try {
          await updateAniListProgress({ accessToken, mediaId, progress: 1 });
          console.log('📺 Set episode progress to 1');
        } catch (progressErr) {
          console.error('⚠️ Failed to set episode progress to 1:', progressErr);
        }
      }

      // After updating, reload status from AniList to reflect changes
      try {
        const statusData = await getAnimeCurrentStatus({ accessToken, mediaId });
        if (statusData) {
          setSelectedStatus(statusData.status);
        } else {
          setSelectedStatus(null);
        }
      } catch (e) {
        // fallback: keep selectedStatus as is
      }

      console.log(`✅ Successfully updated AniList:`, result);
      console.log(`📊 Profile will reflect this change when you visit it next`);
    } catch (error) {
      console.error('❌ Error adding to list:', error);
      alert(`Failed to add to list: ${error.message}`);
      setSelectedStatus(null);
    }
  };

  const listOptions = [
    { value: 'watching', label: getTranslation(language, 'watching') },
    { value: 'planning', label: getTranslation(language, 'planning') },
    { value: 'completed', label: getTranslation(language, 'completed') },
    { value: 'rewatching', label: getTranslation(language, 'rewatching') },
    { value: 'paused', label: getTranslation(language, 'paused') },
    { value: 'dropped', label: getTranslation(language, 'dropped') },
  ];

  // Helper function to get the correct watch URL
  const getWatchUrl = (animeId) => {
    const progress = watchProgress[String(animeId)];
    if (progress && progress.episodeId) {
      return `/watch/${animeId}?ep=${progress.episodeId}`;
    }
    return `/watch/${animeId}`;
  };

  if (loading) return <Loader type="animeInfo" />;
  if (error || !animeInfo) {
    console.error('🚨 Anime not found or error occurred:', error?.message || 'No anime info');
    return <Error error="404" />;
  }
  const { title, japanese_title, poster, animeInfo: info } = animeInfo;
  const tags = [
    {
      condition: info.tvInfo?.rating,
      bgColor: "#ffffff",
      text: info.tvInfo.rating,
    },
    {
      condition: info.tvInfo?.quality,
      bgColor: "#FFBADE",
      text: info.tvInfo.quality,
    },
    {
      condition: info.tvInfo?.sub,
      icon: faClosedCaptioning,
      bgColor: "#B0E3AF",
      text: translateEpisodeInfo(info.tvInfo.sub, language),
    },
    {
      condition: info.tvInfo?.dub,
      icon: faMicrophone,
      bgColor: "#B9E7FF",
      text: translateEpisodeInfo(info.tvInfo.dub, language),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="relative w-full overflow-hidden mt-[74px] max-md:mt-[60px]">

        {/* Main Content */}
        <div className="relative z-10 container mx-auto py-3 sm:py-4 lg:py-6">
          {/* Mobile Layout */}
          <div className="block md:hidden">
            <div className="flex flex-row gap-4">
              {/* Poster Section */}
              <div className="flex-shrink-0">
                <div className="relative w-[130px] xs:w-[150px] aspect-[2/3] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                  <img
                    src={`${poster}`}
                    alt={`${title} Poster`}
                    className="w-full h-full object-cover"
                  />
                  {animeInfo.adultContent && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500/90 backdrop-blur-sm rounded-md text-[10px] font-medium">
                      18+
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info Section */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Title */}
                <div className="space-y-0.5">
                  <h1 className="text-lg xs:text-xl font-bold tracking-tight truncate">
                    {titleLanguage === "en" ? title : japanese_title}
                  </h1>
                  {titleLanguage === "en" && japanese_title && (
                    <p className="text-white/50 text-[11px] xs:text-xs truncate">JP Title: {japanese_title}</p>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(({ condition, icon, text }, index) =>
                    condition && (
                      <Tag
                        key={index}
                        index={index}
                        icon={icon}
                        text={text}
                      />
                    )
                  )}
                </div>

                {/* Overview - Limited for mobile */}
                {info?.Overview && (
                  <div className="text-gray-300 leading-relaxed text-xs">
                    {info.Overview.length > 150 ? (
                      <>
                        {isFull ? (
                          info.Overview
                        ) : (
                          <div className="line-clamp-3">{info.Overview}</div>
                        )}
                        <button
                          className="mt-1 text-white/70 hover:text-white transition-colors text-[10px] font-medium"
                          onClick={() => setIsFull(!isFull)}
                        >
                          {isFull ? getTranslation(language, "showLess") : getTranslation(language, "readMore")}
                        </button>
                      </>
                    ) : (
                      info.Overview
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Login Buttons - Only show when NOT authenticated - Above Watch Button */}
            {!isAuthenticated && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                {/* AniList Login Button */}
                <button
                  onClick={() => {
                    const clientId = import.meta.env.VITE_ANILIST_CLIENT_ID;
                    const redirectUri = import.meta.env.VITE_ANILIST_REDIRECT_URI;
                    const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
                    window.location.href = authUrl;
                  }}
                  className="px-4 py-2.5 bg-[#0a0a0a] rounded-lg border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] transition-colors duration-200 flex items-center justify-center"
                >
                  <img 
                    src="/anilist.png" 
                    alt="AniList" 
                    className="w-5 h-5 object-contain"
                  />
                </button>

                {/* MAL Login Button */}
                <button
                  onClick={() => {
                    // MAL OAuth implementation would go here
                    alert('MAL login coming soon!');
                  }}
                  className="px-4 py-2.5 bg-[#0a0a0a] rounded-lg border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] transition-colors duration-200 flex items-center justify-center"
                >
                  <img 
                    src="/mal.png" 
                    alt="MyAnimeList" 
                    className="w-6 h-6 object-contain"
                  />
                </button>
              </div>
            )}

            {/* Watch Button - Full Width on Mobile */}
            <div className={`${!isAuthenticated ? 'mt-3' : 'mt-6'} flex gap-3`}>
              {animeInfo?.animeInfo?.Status?.toLowerCase() !== "not-yet-aired" ? (
                <Link
                  to={getWatchUrl(animeInfo.id)}
                  className="flex-1 px-4 py-3 bg-[#0a0a0a] rounded-lg border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] text-white transition-colors duration-200 flex items-center justify-center gap-2 group"
                >
                  <FontAwesomeIcon
                    icon={faPlay}
                    className="text-xs group-hover:text-white"
                  />
                  <span className="font-medium text-sm">{getTranslation(language, "watchNow")}</span>
                </Link>
              ) : (
                <div className="flex-1 flex justify-center items-center px-4 py-3 bg-[#0a0a0a] rounded-lg border border-white/10">
                  <span className="font-medium text-sm">{getTranslation(language, "notReleased")}</span>
                </div>
              )}

              {/* Add to List Dropdown - Only show when authenticated and anime is released */}
              {isAuthenticated && animeInfo?.animeInfo?.Status?.toLowerCase() !== "not-yet-aired" && (
                <div className="relative" data-dropdown-menu>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex-1 px-4 py-3 bg-[#0a0a0a] rounded-lg border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] text-white transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {selectedStatus && (
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    )}
                    {selectedStatus ? (
                      <>
                        <span className="text-sm">{listOptions.find(o => o.value === selectedStatus)?.label}</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPlus} className="text-sm" />
                        <span className="text-sm">{getTranslation(language, "addToList")}</span>
                      </>
                    )}
                    <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 min-w-full bg-[#0a0a0a] rounded-lg border border-white/10 hover:border-white/20 shadow-lg z-50">
                      {listOptions.map((option, idx) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            handleAddToList(option.value);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-2 ${
                            selectedStatus === option.value
                              ? 'bg-green-500/20 text-green-300 border-l-2 border-green-500'
                              : 'text-white hover:bg-white/10'
                          } ${idx === 0 ? 'rounded-t-lg' : ''} ${idx === listOptions.length - 1 ? 'rounded-b-lg' : ''}`}
                        >
                          {selectedStatus === option.value && (
                            <span className="text-green-400 font-bold">✓</span>
                          )}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Details Section - Full Width on Mobile */}
            <div className="mt-6 space-y-3 py-3 bg-[#0a0a0a] rounded-lg border border-white/10 hover:border-white/20 transition-colors px-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: getTranslation(language, "japanese"), value: info?.Japanese },
                  { label: getTranslation(language, "synonyms"), value: info?.Synonyms },
                  { label: getTranslation(language, "aired"), value: info?.Aired },
                  { label: getTranslation(language, "premiered"), value: info?.Premiered },
                  { label: getTranslation(language, "duration"), value: info?.Duration },
                  { label: getTranslation(language, "status"), value: info?.Status },
                  { label: getTranslation(language, "malScore"), value: info?.[getTranslation(language, "malScore")] },
                ].map((item, index) => (
                  <InfoItem
                    key={index}
                    label={item.label}
                    value={item.value}
                    isProducer={false}
                  />
                ))}
              </div>

              {/* Genres */}
              {info?.Genres && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-gray-400 text-xs mb-1.5">{getTranslation(language, "genres")}</p>
                  <div className="flex flex-wrap gap-1">
                    {info.Genres.map((genre, index) => (
                      <Link
                        to={`/genre/${genre.split(" ").join("-")}`}
                        key={index}
                        className="px-2 py-0.5 text-[10px] bg-[#0a0a0a] rounded-md border border-white/10 hover:border-white/20 transition-colors"
                      >
                        {genre}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Studios & Producers */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                {[
                  { label: getTranslation(language, "studios"), value: info?.Studios },
                  { label: getTranslation(language, "producers"), value: info?.Producers },
                ].map((item, index) => (
                  <InfoItem
                    key={index}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Layout - Existing Code */}
          <div className="hidden md:block">
            <div className="flex flex-row gap-6 lg:gap-10">
              {/* Poster Section */}
              <div className="flex-shrink-0">
                <div className="relative w-[220px] lg:w-[260px] aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                  <img
                    src={`${poster}`}
                    alt={`${title} Poster`}
                    className="w-full h-full object-cover"
                  />
                  {animeInfo.adultContent && (
                    <div className="absolute top-3 left-3 px-2.5 py-0.5 bg-red-500/90 backdrop-blur-sm rounded-lg text-xs font-medium">
                      18+
                    </div>
                  )}
                </div>
                
                {/* Login Buttons - Only show when NOT authenticated */}
                {!isAuthenticated && (
                  <div className="mt-4 grid grid-cols-2 gap-2 w-[220px] lg:w-[260px]">
                    {/* AniList Login Button */}
                    <button
                      onClick={() => {
                        const clientId = import.meta.env.VITE_ANILIST_CLIENT_ID;
                        const redirectUri = import.meta.env.VITE_ANILIST_REDIRECT_URI;
                        const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
                        window.location.href = authUrl;
                      }}
                      className="flex items-center justify-center px-3 py-1.5 bg-[#0a0a0a] rounded-xl border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] transition-colors duration-200"
                    >
                      <img 
                        src="/anilist.png" 
                        alt="AniList" 
                        className="w-6 h-6 object-contain"
                      />
                    </button>

                    {/* MAL Login Button */}
                    <button
                      onClick={() => {
                        // MAL OAuth implementation would go here
                        alert('MAL login coming soon!');
                      }}
                      className="flex items-center justify-center px-3 py-1.5 bg-[#0a0a0a] rounded-xl border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] transition-colors duration-200"
                    >
                      <img 
                        src="/mal.png" 
                        alt="MyAnimeList" 
                        className="w-8 h-8 object-contain"
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="flex-1 space-y-4 lg:space-y-5 min-w-0">
                {/* Title */}
                <div className="space-y-1">
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight truncate">
                    {titleLanguage === "en" ? title : japanese_title}
                  </h1>
                  {titleLanguage === "en" && japanese_title && (
                    <p className="text-white/50 text-sm lg:text-base truncate">JP Title: {japanese_title}</p>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {tags.map(({ condition, icon, text }, index) =>
                    condition && (
                      <Tag
                        key={index}
                        index={index}
                        icon={icon}
                        text={text}
                      />
                    )
                  )}
                </div>

                {/* Overview */}
                {info?.Overview && (
                  <div className="text-gray-300 leading-relaxed max-w-3xl text-sm lg:text-base">
                    {info.Overview.length > 270 ? (
                      <>
                        {isFull
                          ? info.Overview
                          : `${info.Overview.slice(0, 270)}...`}
                        <button
                          className="ml-2 text-white/70 hover:text-white transition-colors text-sm font-medium"
                          onClick={() => setIsFull(!isFull)}
                        >
                          {isFull ? getTranslation(language, "showLess") : getTranslation(language, "readMore")}
                        </button>
                      </>
                    ) : (
                      info.Overview
                    )}
                  </div>
                )}

                {/* Watch Button & Add to List Dropdown */}
                <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                  {animeInfo?.animeInfo?.Status?.toLowerCase() !== "not-yet-aired" ? (
                    <Link
                      to={getWatchUrl(animeInfo.id)}
                      className="inline-flex items-center px-5 py-2.5 bg-[#0a0a0a] rounded-xl border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] text-white transition-colors duration-200 gap-2 group"
                    >
                      <FontAwesomeIcon
                        icon={faPlay}
                        className="text-sm group-hover:text-white"
                      />
                      <span className="font-medium text-sm">{getTranslation(language, "watchNow")}</span>
                    </Link>
                  ) : (
                    <div className="inline-flex items-center px-5 py-2.5 bg-[#0a0a0a] rounded-xl border border-white/10">
                      <span className="font-medium text-sm">{getTranslation(language, "notReleased")}</span>
                    </div>
                  )}

                  {/* Add to List Button with Dropdown - Only show when authenticated and anime is released */}
                  {isAuthenticated && animeInfo?.animeInfo?.Status?.toLowerCase() !== "not-yet-aired" && (
                    <div className="relative" data-dropdown-menu>
                      <button 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="inline-flex items-center px-5 py-2.5 bg-[#0a0a0a] rounded-xl border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] text-white transition-colors duration-200 gap-2"
                      >
                        {selectedStatus && (
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                        )}
                        {selectedStatus ? (
                          <span className="font-medium text-sm">{listOptions.find(o => o.value === selectedStatus)?.label}</span>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faPlus} className="text-sm" />
                            <span className="font-medium text-sm">{getTranslation(language, "addToList")}</span>
                          </>
                        )}
                        <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {dropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 min-w-full bg-[#0a0a0a] rounded-lg border border-white/10 hover:border-white/20 shadow-lg z-50">
                          {listOptions.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                handleAddToList(option.value);
                                setDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                                selectedStatus === option.value
                                  ? 'bg-green-500/20 text-green-300 border-l-2 border-green-500'
                                  : 'text-white hover:bg-white/10'
                              } ${idx === 0 ? 'rounded-t-lg' : ''} ${idx === listOptions.length - 1 ? 'rounded-b-lg' : ''}`}
                            >
                              {selectedStatus === option.value && (
                                <span className="text-green-400 font-bold">✓</span>
                              )}
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="space-y-4 py-4 bg-[#0a0a0a] rounded-xl border border-white/10 hover:border-white/20 transition-colors px-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: getTranslation(language, "japanese"), value: info?.Japanese },
                      { label: getTranslation(language, "synonyms"), value: info?.Synonyms },
                      { label: getTranslation(language, "aired"), value: info?.Aired },
                      { label: getTranslation(language, "premiered"), value: info?.Premiered },
                      { label: getTranslation(language, "duration"), value: info?.Duration },
                      { label: getTranslation(language, "status"), value: info?.Status },
                      { label: getTranslation(language, "malScore"), value: info?.[getTranslation(language, "malScore")] },
                    ].map((item, index) => (
                      <InfoItem
                        key={index}
                        label={item.label}
                        value={item.value}
                        isProducer={false}
                      />
                    ))}
                  </div>

                  {/* Genres */}
                  {info?.Genres && (
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-gray-400 text-sm mb-2">{getTranslation(language, "genres")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {info.Genres.map((genre, index) => (
                          <Link
                            to={`/genre/${genre.split(" ").join("-")}`}
                            key={index}
                            className="px-3 py-1 text-xs bg-[#0a0a0a] rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                          >
                            {genre}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Studios & Producers */}
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    {[
                      { label: getTranslation(language, "studios"), value: info?.Studios },
                      { label: getTranslation(language, "producers"), value: info?.Producers },
                    ].map((item, index) => (
                      <InfoItem
                        key={index}
                        label={item.label}
                        value={item.value}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seasons Section */}
      {seasons?.length > 0 && (
        <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors container mx-auto my-8 sm:my-12">
          <h2 className="text-xl font-semibold mb-4 text-white">More Seasons</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {seasons.map((season, index) => (
              <Link
                to={`/${season.id}`}
                key={index}
                className={`relative w-full aspect-[3/1] sm:aspect-[3/1] rounded-lg overflow-hidden cursor-pointer group ${
                  currentId === String(season.id)
                    ? "ring-2 ring-white/40 shadow-lg shadow-white/10"
                    : ""
                }`}
              >
                <img
                  src={season.season_poster}
                  alt={season.season}
                  className={`w-full h-full object-cover scale-150 ${
                    currentId === String(season.id)
                      ? "opacity-50"
                      : "opacity-40"
                  }`}
                />
                {/* Dots Pattern Overlay */}
                <div 
                  className="absolute inset-0 z-10" 
                  style={{ 
                    backgroundImage: `url('data:image/svg+xml,<svg width="3" height="3" viewBox="0 0 3 3" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="1.5" cy="1.5" r="0.5" fill="white" fill-opacity="0.25"/></svg>')`,
                    backgroundSize: '3px 3px'
                  }}
                />
                {/* Dark Gradient Overlay */}
                <div className={`absolute inset-0 z-20 bg-gradient-to-r ${
                  currentId === String(season.id)
                    ? "from-black/50 to-transparent"
                    : "from-black/40 to-transparent"
                }`} />
                {/* Title Container */}
                <div className="absolute inset-0 z-30 flex items-center justify-center">
                  <p className={`text-[14px] sm:text-[16px] md:text-[18px] font-bold text-center px-2 sm:px-4 transition-colors duration-300 ${
                    currentId === String(season.id)
                      ? "text-white"
                      : "text-white/90 group-hover:text-white"
                  }`}>
                    {season.season}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Voice Actors Section */}
      {animeInfo?.charactersVoiceActors.length > 0 && (
        <div className="container mx-auto py-12">
          <Voiceactor animeInfo={animeInfo} />
        </div>
      )}

      {/* General Comments Section */}
      <div className="container mx-auto py-12">
        <div className="bg-[#0a0a0a] rounded-lg p-4 sm:p-6 border border-white/10">
          <h2 className="text-2xl font-bold mb-6 text-white">
            General Comments
          </h2>
          <CommentSection 
            animeId={id}
            episodeId="general"
            deviceType="desktop"
            showTabs={false}
          />
        </div>
      </div>

      {/* Recommendations Section */}
      {animeInfo.recommended_data.length > 0 && (
        <div className="container mx-auto py-12">
          <CategoryCard
            label={getTranslation(language, "recommendedForYou")}
            data={animeInfo.recommended_data}
            limit={animeInfo.recommended_data.length}
            showViewMore={false}
          />
        </div>
      )}
    </div>
  );
}

export default AnimeInfo;
