/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";
import { formatNumber } from "@/src/utils/numberConverter";
import { useHomeInfo } from "@/src/context/HomeInfoContext";
import { useWatch } from "@/src/hooks/useWatch";
import { useAuth } from "@/src/context/AuthContext";
import { updateAniListProgress } from "@/src/utils/updateAniListProgress";
import { getAniListMediaId } from "@/src/utils/getAniListMediaId";
import BouncingLoader from "@/src/components/ui/bouncingloader/Bouncingloader";
import IframePlayer from "@/src/components/player/IframePlayer";
import Episodelist from "@/src/components/episodelist/Episodelist";
import website_name from "@/src/config/website";
import Sidecard from "@/src/components/sidecard/Sidecard";
import Trending from "@/src/components/trending/Trending";
import {
  faClosedCaptioning,
  faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Servers from "@/src/components/servers/Servers";
import { Skeleton } from "@/src/components/ui/Skeleton/Skeleton";
import SidecardLoader from "@/src/components/Loader/Sidecard.loader";
import Watchcontrols from "@/src/components/watchcontrols/Watchcontrols";
import useWatchControl from "@/src/hooks/useWatchControl";
import Player from "@/src/components/player/Player";
import WatchPartyModal from "@/src/components/watchparty/WatchPartyModal";
import CommentSection from "@/src/components/comments/CommentSection";

export default function Watch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: animeId } = useParams();
  const { user, isAuthenticated } = useAuth ? useAuth() : { user: null, isAuthenticated: false };
  const queryParams = new URLSearchParams(location.search);
  let initialEpisodeId = queryParams.get("ep");
  const [tags, setTags] = useState([]);
  const [showWatchPartyModal, setShowWatchPartyModal] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showDonateQR, setShowDonateQR] = useState(false);
  const { language } = useLanguage();
  const { homeInfo } = useHomeInfo();
  const isFirstSet = useRef(true);
  // State for showing/hiding the auto-skip info banner (reappears after 1 hour)
  const [showAutoSkipInfo, setShowAutoSkipInfo] = useState(() => {
    const saved = localStorage.getItem('autoSkipInfoDismissed');
    if (!saved) return true;
    
    const dismissedTime = parseInt(saved);
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    const currentTime = Date.now();
    
    // If more than 1 hour has passed, show the banner again
    if (currentTime - dismissedTime > oneHour) {
      localStorage.removeItem('autoSkipInfoDismissed');
      return true;
    }
    
    return false;
  });
  const [showNextEpisodeSchedule, setShowNextEpisodeSchedule] = useState(true);
  const {
    // error,
    buffering,
    streamInfo,
    streamUrl,
    animeInfo,
    episodes,
    nextEpisodeSchedule,
    animeInfoLoading,
    totalEpisodes,
    isFullOverview,
    intro,
    outro,
    subtitles,
    thumbnail,
    setIsFullOverview,
    activeEpisodeNum,
    seasons,
    episodeId,
    setEpisodeId,
    activeServerId,
    setActiveServerId,
    servers,
    serverLoading,
    activeServerType,
    setActiveServerType,
    activeServerName,
    setActiveServerName,
  } = useWatch(animeId, initialEpisodeId);
  const {
    autoPlay,
    setAutoPlay,
    autoSkipIntro,
    setAutoSkipIntro,
    autoNext,
    setAutoNext,
  } = useWatchControl();
  const playerRef = useRef(null);
  const videoContainerRef = useRef(null);
  const controlsRef = useRef(null);
  const episodesRef = useRef(null);
  const previousEpisodeRef = useRef(null);

  useEffect(() => {
    if (!episodes || episodes.length === 0) return;
    
    const isValidEpisode = episodes.some(ep => {
      const epNumber = ep.id.split('ep=')[1];
      return epNumber === episodeId; 
    });
    
    // If missing or invalid episodeId, fallback to first
    if (!episodeId || !isValidEpisode) {
      const fallbackId = episodes[0].id.match(/ep=(\d+)/)?.[1];
      if (fallbackId && fallbackId !== episodeId) {
        setEpisodeId(fallbackId);
      }
      return;
    }
  
    const newUrl = `/watch/${animeId}?ep=${episodeId}`;
    if (isFirstSet.current) {
      navigate(newUrl, { replace: true });
      isFirstSet.current = false;
    } else {
      navigate(newUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId, animeId, navigate, episodes]);

  // Update document title
  useEffect(() => {
    if (animeInfo) {
      document.title = `Watch ${animeInfo.title} English Sub/Dub online Free on ${website_name}`;
    }
    return () => {
      document.title = `${website_name} | Free anime streaming platform`;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeId]);

  // Redirect if no episodes
  useEffect(() => {
    if (totalEpisodes !== null && totalEpisodes === 0) {
      navigate(`/${animeId}`);
    }
  }, [streamInfo, episodeId, animeId, totalEpisodes, navigate]);

  // Sync current episode when user clicks in Episodes Section
  useEffect(() => {
    console.log('🔔 Watch sync effect triggered:', { activeEpisodeNum, isAuthenticated, animeTitle: animeInfo?.title });
    
    if (!activeEpisodeNum) {
      console.warn('⚠️ No activeEpisodeNum');
      return;
    }
    
    if (!animeInfo?.title) {
      console.warn('⚠️ No animeInfo.title');
      return;
    }

    const currentEpNum = parseInt(activeEpisodeNum);
    if (isNaN(currentEpNum) || currentEpNum <= 0) {
      console.warn('⚠️ Invalid episode number:', activeEpisodeNum);
      return;
    }

    // Check if this is a new episode selection OR initial page load
    // Run on initial load (previousEpisodeRef.current === null) OR when episode changes
    if (previousEpisodeRef.current === null || previousEpisodeRef.current !== currentEpNum) {
      console.log(`📺 Episode sync: ${previousEpisodeRef.current} → ${currentEpNum}`);
      
      // Update continue watching localStorage
      const updateContinueWatching = () => {
        try {
          const continueWatchingList = JSON.parse(localStorage.getItem('continueWatching') || '[]');
          
          console.log('📋 Current Continue Watching List:', continueWatchingList.map(item => ({ id: item.id, ep: item.episodeNum })));
          console.log('🔍 Looking for anime ID:', animeId, 'Type:', typeof animeId);
          
          // Create the continue watching entry
          const continueWatchingEntry = {
            id: String(animeId), // Ensure ID is a string
            data_id: animeInfo?.data_id || animeInfo?.id, // Add data_id for compatibility
            title: animeInfo?.title || '',
            japanese_title: animeInfo?.japanese_title || '',
            poster: animeInfo?.poster || '',
            episodeId: episodeId, // Store the episode ID
            episodeNum: currentEpNum,
            adultContent: animeInfo?.isAdult || false,
            // ✅ Save current audio selection for this anime
            lastServerType: activeServerType, // 'sub' or 'dub'
            lastServerName: activeServerName, // 'HD-2', etc.
          };
          
          // Check if this anime is already in the list (compare as strings)
          const existingIndex = continueWatchingList.findIndex(item => String(item.id) === String(animeId));
          
          console.log('🔎 Existing index found:', existingIndex);
          
          if (existingIndex !== -1) {
            // ✅ IMPORTANT: Keep existing leftAt if same episode, don't reset to 0
            const existingEntry = continueWatchingList[existingIndex];
            if (String(existingEntry.episodeId) === String(episodeId)) {
              // Same episode - keep the saved position
              continueWatchingEntry.leftAt = existingEntry.leftAt;
              console.log(`✅ Same episode - keeping saved position: ${existingEntry.leftAt} seconds`);
            } else {
              // Different episode - start from 0
              continueWatchingEntry.leftAt = 0;
              console.log(`🔄 Different episode - starting from 0`);
            }
            
            // Remove existing entry and add it at the beginning (move to first position)
            console.log(`🔄 Moving existing anime to first position: EP ${existingEntry.episodeNum} → EP ${currentEpNum}`);
            continueWatchingList.splice(existingIndex, 1); // Remove from current position
            continueWatchingList.unshift(continueWatchingEntry); // Add to beginning
          } else {
            // Add new entry at the beginning - start from 0
            continueWatchingEntry.leftAt = 0;
            console.log(`➕ Adding new anime to continue watching list`);
            continueWatchingList.unshift(continueWatchingEntry);
          }
          
          console.log('📋 Updated Continue Watching List:', continueWatchingList.map(item => ({ id: item.id, ep: item.episodeNum })));
          
          // Save to localStorage
          localStorage.setItem('continueWatching', JSON.stringify(continueWatchingList));
          
          // Dispatch custom event to notify ContinueWatching component of updates
          window.dispatchEvent(new Event('continueWatchingUpdated'));
          
          console.log(`✅ Continue watching updated: ${animeInfo?.title} - Episode ${currentEpNum}`);
        } catch (err) {
          console.error('❌ Failed to update continue watching:', err);
        }
      };

      updateContinueWatching();
      
      // Sync to AniList if authenticated
      if (isAuthenticated) {
        const syncCurrentEpisode = async () => {
          try {
            const accessToken = localStorage.getItem('anilist_token');
            console.log('🔑 Checking token:', accessToken ? '✓ Found' : '✗ Not found');
            
            if (!accessToken) {
              console.warn('⚠️ No AniList token found in localStorage');
              return;
            }

            console.log(`🔍 Getting AniList media ID for: "${animeInfo.title}"`);
            
            // Get the AniList media ID from the anime title
            const anilistMediaId = await getAniListMediaId(animeInfo.title);
            console.log(`📱 AniList Media ID received: ${anilistMediaId}`);
            
            if (!anilistMediaId) {
              console.error('❌ Failed to get AniList media ID');
              return;
            }

            console.log(`📚 Calling updateAniListProgress: EP ${currentEpNum}, MediaID: ${anilistMediaId}`);

            const result = await updateAniListProgress({
              accessToken,
              mediaId: anilistMediaId,
              progress: currentEpNum,
            });
            
            console.log(`✅ API Response:`, result);

            // Update sync stats
            const syncStats = JSON.parse(localStorage.getItem('syncStats') || '{}');
            syncStats.episodesSynced = (syncStats.episodesSynced || 0) + 1;
            syncStats.lastSync = new Date().toLocaleString();
            syncStats.lastSyncedAnime = animeInfo?.title;
            localStorage.setItem('syncStats', JSON.stringify(syncStats));

            console.log(`✅ SUCCESS: Episode ${currentEpNum} marked as watched on AniList!`);
          } catch (err) {
            console.error('❌ AniList sync failed:', err.message);
            console.error('Full error:', err);
            const syncStats = JSON.parse(localStorage.getItem('syncStats') || '{}');
            syncStats.failedSyncs = (syncStats.failedSyncs || 0) + 1;
            syncStats.lastError = err.message;
            localStorage.setItem('syncStats', JSON.stringify(syncStats));
          }
        };

        syncCurrentEpisode();
      }
    }

    // Update the previous episode ref to current
    previousEpisodeRef.current = currentEpNum;
  }, [activeEpisodeNum, episodeId, animeInfo?.title, animeId, animeInfo, isAuthenticated, activeServerType, activeServerName]);

  // ✅ Periodic save of playback position
  useEffect(() => {
    if (!animeInfo || !episodeId || !activeEpisodeNum) return;

    // Save playback position every 10 seconds
    const saveInterval = setInterval(() => {
      if (playerRef.current) {
        try {
          const continueWatchingList = JSON.parse(localStorage.getItem('continueWatching') || '[]');
          const currentEpNum = parseInt(activeEpisodeNum);
          
          if (isNaN(currentEpNum) || currentEpNum <= 0) return;
          
          // Find existing entry for this anime
          const existingIndex = continueWatchingList.findIndex(item => String(item.id) === String(animeId));
          
          if (existingIndex !== -1) {
            // Update leftAt for existing entry
            continueWatchingList[existingIndex].leftAt = Math.floor(playerRef.current.currentTime || 0);
            continueWatchingList[existingIndex].episodeId = episodeId;
            continueWatchingList[existingIndex].episodeNum = currentEpNum;
            
            // Save to localStorage
            localStorage.setItem('continueWatching', JSON.stringify(continueWatchingList));
            
            console.log('💾 Playback position saved:', {
              anime: animeInfo.title,
              episode: currentEpNum,
              time: Math.floor(playerRef.current.currentTime || 0)
            });
          }
        } catch (err) {
          console.error('Failed to save playback position:', err);
        }
      }
    }, 10000); // Save every 10 seconds

    return () => clearInterval(saveInterval);
  }, [animeInfo, episodeId, activeEpisodeNum, animeId]);

  useEffect(() => {
    // Function to adjust the height of episodes list to match only video + controls
    const adjustHeight = () => {
      if (window.innerWidth > 1200) {
        if (videoContainerRef.current && controlsRef.current && episodesRef.current) {
          // Calculate combined height of video container and controls
          const videoHeight = videoContainerRef.current.offsetHeight;
          const controlsHeight = controlsRef.current.offsetHeight;
          const totalHeight = videoHeight + controlsHeight;
          
          // Apply the combined height to episodes container
          episodesRef.current.style.height = `${totalHeight}px`;
        }
      } else {
        if (episodesRef.current) {
          episodesRef.current.style.height = 'auto';
        }
      }
    };

    // Initial adjustment with delay to ensure player is fully rendered
    const initialTimer = setTimeout(() => {
      adjustHeight();
    }, 500);
    
    // Set up resize listener
    window.addEventListener('resize', adjustHeight);
    
    // Create MutationObserver to monitor player changes
    const observer = new MutationObserver(() => {
      setTimeout(adjustHeight, 100);
    });
    
    // Start observing both video container and controls
    if (videoContainerRef.current) {
      observer.observe(videoContainerRef.current, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }
    
    if (controlsRef.current) {
      observer.observe(controlsRef.current, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }
    
    // Set up additional interval for continuous adjustments
    const intervalId = setInterval(adjustHeight, 1000);
    
    // Clean up
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
      observer.disconnect();
      window.removeEventListener('resize', adjustHeight);
    };
  }, [buffering, activeServerType, activeServerName, episodeId, streamUrl, episodes]);

  // Sharing modal — single global 1-hour cooldown
  //
  // Storage shape (one key, two fields):
  //   sharingModalCooldown = { "shownAt": <timestamp>, "animeId": "<id>" }
  //
  // Rules (in order):
  //   1. Cooldown is still active (< 1 h since shownAt)
  //      → do nothing, regardless of which anime the user is on.
  //   2. Cooldown has expired (≥ 1 h) BUT user is still on the SAME anime
  //      → do nothing; wait until they navigate to a different anime.
  //   3. Cooldown has expired AND user is on a DIFFERENT anime (or first ever visit)
  //      → show the modal after 3 s, then save a new stamp + current animeId.
  useEffect(() => {
    const fromNotification = sessionStorage.getItem('fromNotification');
    if (fromNotification) {
      sessionStorage.removeItem('fromNotification');
      return;
    }

    if (!animeId) return;

    const ONE_HOUR_MS = 60 * 60 * 1000;
    const STORAGE_KEY = 'sharingModalCooldown'; // single object, not per-anime

    let saved = { shownAt: 0, animeId: null };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {
      /* ignore parse errors, treat as fresh */ }

    const now = Date.now();
    const cooldownActive = saved.shownAt && (now - saved.shownAt < ONE_HOUR_MS);

    // Rule 1: cooldown still running → do nothing at all
    if (cooldownActive) return;

    // Rule 2: cooldown expired but user hasn't moved to a new anime → do nothing
    if (saved.animeId && saved.animeId === animeId) return;

    // Rule 3: cooldown expired AND on a different anime (or very first visit) → show
    const timer = setTimeout(() => {
      setShowSharingModal(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ shownAt: Date.now(), animeId }));
    }, 3000);

    return () => clearTimeout(timer);
  }, [animeId]);

  function Tag({ bgColor, index, icon, text }) {
    return (
      <div
        className={`flex space-x-1 justify-center items-center px-[4px] py-[1px] text-black font-semibold text-[13px] ${
          index === 0 ? "rounded-l-[4px]" : "rounded-none"
        }`}
        style={{ backgroundColor: bgColor }}
      >
        {icon && <FontAwesomeIcon icon={icon} className="text-[12px]" />}
        <p className="text-[12px]">{text}</p>
      </div>
    );
  }

  useEffect(() => {
    setTags([
      {
        condition: animeInfo?.animeInfo?.tvInfo?.rating,
        bgColor: "#ffffff",
        text: animeInfo?.animeInfo?.tvInfo?.rating,
      },
      {
        condition: animeInfo?.animeInfo?.tvInfo?.quality,
        bgColor: "#FFBADE",
        text: animeInfo?.animeInfo?.tvInfo?.quality,
      },
      {
        condition: animeInfo?.animeInfo?.tvInfo?.sub,
        icon: faClosedCaptioning,
        bgColor: "#B0E3AF",
        text: animeInfo?.animeInfo?.tvInfo?.sub,
      },
      {
        condition: animeInfo?.animeInfo?.tvInfo?.dub,
        icon: faMicrophone,
        bgColor: "#B9E7FF",
        text: animeInfo?.animeInfo?.tvInfo?.dub,
      },
    ]);
  }, [animeId, animeInfo]);

  const relatedHasItems = animeInfo && animeInfo.related_data && animeInfo.related_data.length > 0;
  const trendingWithCurrent = (() => {
    const base = homeInfo?.trending ? [...homeInfo.trending] : [];
    if (!animeInfo) return base;
    const currentId = animeId || animeInfo.id;
    const exists = base.some((it) => String(it.id) === String(currentId) || String(it.id) === String(animeInfo.id));
    if (exists) return base;
    const current = {
      id: animeId || animeInfo.id,
      title: animeInfo?.title || animeInfo?.animeInfo?.title,
      japanese_title: animeInfo?.japanese_title,
      poster: animeInfo?.poster,
      tvInfo: animeInfo?.animeInfo?.tvInfo,
    };
    return [current, ...base];
  })();
  return (
    <div className="w-full min-h-screen bg-[#0a0a0a]">
      <div className="w-full max-w-[1920px] mx-auto pt-16 pb-6 w-full max-[1200px]:pt-16">
        <div className="grid grid-cols-[minmax(0,70%),minmax(0,30%)] gap-6 w-full h-full max-[1200px]:flex max-[1200px]:flex-col">
          {/* Left Column - Player, Controls, Servers */}
          <div className="flex flex-col w-full gap-6">
            <div ref={playerRef} className="player w-full h-fit bg-black flex flex-col rounded-xl overflow-hidden">
              {/* Video Container */}
              <div ref={videoContainerRef} className="w-full relative aspect-video bg-black">
                {!buffering ? (["hd-1", "hd-4"].includes(activeServerName.toLowerCase()) ?
                  <IframePlayer
                    episodeId={episodeId}
                    servertype={activeServerType}
                    serverName={activeServerName}
                    animeInfo={animeInfo}
                    episodeNum={activeEpisodeNum}
                    episodes={episodes}
                    playNext={(id) => setEpisodeId(id)}
                    autoNext={autoNext}
                  /> : <Player
                    streamUrl={streamUrl}
                    subtitles={subtitles}
                    intro={intro}
                    outro={outro}
                    serverName={activeServerName.toLowerCase()}
                    serverType={activeServerType}
                    thumbnail={thumbnail}
                    autoSkipIntro={autoSkipIntro}
                    autoPlay={autoPlay}
                    autoNext={autoNext}
                    episodeId={episodeId}
                    episodes={episodes}
                    playNext={(id) => setEpisodeId(id)}
                    animeInfo={animeInfo}
                    episodeNum={activeEpisodeNum}
                    streamInfo={streamInfo}
                  />
                ) : (
                  <div className="absolute inset-0 flex justify-center items-center bg-black">
                    <BouncingLoader />
                  </div>
                )}
                <p className="text-center underline font-medium text-[15px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                  {!buffering && !activeServerType ? (
                    servers ? (
                      <>
                        {getTranslation(language, "serverDown")}
                        <br />
                        {getTranslation(language, "reloadOrTryAgain")}
                      </>
                    ) : (
                      <>
                        {getTranslation(language, "streamingServerDown")}
                        <br />
                        {getTranslation(language, "reloadOrTryAgain")}
                      </>
                    )
                  ) : null}
                </p>
              </div>
            </div>

            {/* Watch Controls Section */}
            {!buffering && (
              <div className="space-y-3">
                {/* Info Banner */}
                {showAutoSkipInfo && (
                  <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-3 flex items-start gap-3 hover:border-white/20 transition-colors">
                    <p className="text-white/70 text-xs sm:text-sm leading-relaxed flex-1">
                      <span className="font-semibold text-white">{getTranslation(language, "note")}</span> {getTranslation(language, "autoSkipNote")}
                    </p>
                    <button
                      onClick={() => {
                        setShowAutoSkipInfo(false);
                        localStorage.setItem('autoSkipInfoDismissed', Date.now().toString());
                      }}
                      className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0 text-lg leading-none"
                      aria-label="Close notification"
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {/* Watch Controls */}
                <div ref={controlsRef} className="bg-[#0a0a0a] rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors">
                  <Watchcontrols
                    autoPlay={autoPlay}
                    setAutoPlay={setAutoPlay}
                    autoSkipIntro={autoSkipIntro}
                    setAutoSkipIntro={setAutoSkipIntro}
                    autoNext={autoNext}
                    setAutoNext={setAutoNext}
                    episodes={episodes}
                    totalEpisodes={totalEpisodes}
                    episodeId={episodeId}
                    onButtonClick={(id) => setEpisodeId(id)}
                  />
                </div>
              </div>
            )}

            {/* Watch Together with Friends Section - Only show after servers load */}
            {!serverLoading && (
              <div className="bg-[#0a0a0a] rounded-lg px-4 py-3 border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎬</span>
                    <p className="text-white text-sm sm:text-base font-medium">
                      {getTranslation(language, "watchWithFriend")}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowWatchPartyModal(true)}
                    className="px-5 py-1.5 bg-[#000000] text-white border border-white/10 hover:border-white/20 rounded-lg font-medium text-sm transition-colors duration-200 flex-shrink-0 whitespace-nowrap"
                  >
                    {getTranslation(language, "watchTogether")}
                  </button>
                </div>
                <div className="mt-2 pt-2 border-t border-white/5">
                  <p className="text-center text-white/60 text-xs">
                    {getTranslation(language, "featureNotWorking")}
                  </p>
                </div>
              </div>
            )}

            {/* Server Selection Section */}
            <div className="bg-[#0a0a0a] rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors">
              <Servers
                servers={servers}
                activeEpisodeNum={activeEpisodeNum}
                activeServerId={activeServerId}
                setActiveServerId={setActiveServerId}
                serverLoading={serverLoading}
                setActiveServerType={setActiveServerType}
                activeServerType={activeServerType}
                setActiveServerName={setActiveServerName}
              />
            </div>

            {/* Next Episode Schedule Section */}
            {nextEpisodeSchedule?.nextEpisodeSchedule && showNextEpisodeSchedule && (
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-[16px] flex-shrink-0">🚀</span>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-xs sm:text-sm">{getTranslation(language, "nextEpisodeAt")}</p>
                      <p className="text-white text-xs sm:text-sm font-medium truncate">
                        {(() => {
                          const formattedDate = new Date(
                            new Date(nextEpisodeSchedule.nextEpisodeSchedule).getTime() -
                            new Date().getTimezoneOffset() * 60000
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          });
                          
                          // Convert to Khmer if language is Khmer
                          if (language === 'km' || language === 'kh') {
                            return formatNumber(formattedDate, language)
                              .replace(/am/gi, 'ព្រឹក')  // AM = morning
                              .replace(/pm/gi, 'ល្ងាច');  // PM = evening
                          }
                          
                          return formattedDate;
                        })()}
                      </p>
                    </div>
                  </div>
                  <button
                    className="text-xl text-gray-500 hover:text-white transition-colors flex-shrink-0"
                    onClick={() => setShowNextEpisodeSchedule(false)}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Mobile-only Episodes Section */}
            <div className="hidden max-[1200px]:block">
              <div ref={episodesRef} className="episodes flex-shrink-0 bg-[#000000] border border-white/10 hover:border-white/20 transition-colors rounded-lg overflow-hidden">
                {!episodes ? (
                  <div className="h-full flex items-center justify-center">
                    <BouncingLoader />
                  </div>
                ) : (
                  <Episodelist
                    episodes={episodes}
                    currentEpisode={episodeId}
                    onEpisodeClick={(id) => setEpisodeId(id)}
                    totalEpisodes={totalEpisodes}
                  />
                )}
              </div>
            </div>

            {/* Anime Info Section */}
            <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex gap-x-6 max-[600px]:flex-row max-[600px]:gap-4">
                {animeInfo && animeInfo?.poster ? (
                  <img
                    src={`${animeInfo?.poster}`}
                    alt=""
                    className="w-[120px] h-[180px] object-cover rounded-md max-[600px]:w-[100px] max-[600px]:h-[150px]"
                  />
                ) : (
                  <Skeleton className="w-[120px] h-[180px] rounded-md max-[600px]:w-[100px] max-[600px]:h-[150px]" />
                )}
                <div className="flex flex-col gap-y-4 flex-1 max-[600px]:gap-y-2">
                  {animeInfo && animeInfo?.title ? (
                    <Link 
                      to={`/${animeId}`}
                      className="group"
                    >
                      <h1 className="text-[28px] font-medium text-white leading-tight group-hover:text-gray-300 transition-colors max-[600px]:text-[20px]">
                        {language ? animeInfo?.title : animeInfo?.japanese_title}
                      </h1>
                      <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-sm group-hover:text-white transition-colors max-[600px]:text-[12px] max-[600px]:mt-0.5">
                        <span>{getTranslation(language, "viewDetails")}</span>
                        <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform max-[600px]:w-3 max-[600px]:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ) : (
                    <Skeleton className="w-[170px] h-[20px] rounded-xl" />
                  )}
                  <div className="flex flex-wrap gap-2 max-[600px]:gap-1.5">
                    {animeInfo ? (
                      tags.map(
                        ({ condition, icon, text }, index) =>
                          condition && (
                            <span key={index} className="px-2 py-1 bg-[#000000] rounded-md border border-white/10 hover:border-white/20 transition-colors text-sm flex items-center gap-x-0.5 text-gray-300 max-[600px]:px-2 max-[600px]:py-0.5 max-[600px]:text-[11px]">
                              {icon && <FontAwesomeIcon icon={icon} className="text-[12px] max-[600px]:text-[10px]" />}
                              {text}
                            </span>
                          )
                      )
                    ) : (
                      <Skeleton className="w-[70px] h-[20px] rounded-xl" />
                    )}
                  </div>
                  {animeInfo?.animeInfo?.Overview && (
                    <p className="text-[15px] text-gray-400 leading-relaxed max-[600px]:text-[13px] max-[600px]:leading-normal">
                      {animeInfo?.animeInfo?.Overview.length > 270 ? (
                        <>
                          {isFullOverview
                            ? animeInfo?.animeInfo?.Overview
                            : `${animeInfo?.animeInfo?.Overview.slice(0, 270)}...`}
                          <button
                            className="ml-2 text-gray-300 hover:text-white transition-colors max-[600px]:text-[12px] max-[600px]:ml-1"
                            onClick={() => setIsFullOverview(!isFullOverview)}
                          >
                            {isFullOverview ? getTranslation(language, "showLess") : getTranslation(language, "readMore")}
                          </button>
                        </>
                      ) : (
                        animeInfo?.animeInfo?.Overview
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile-only Seasons Section */}
            {seasons?.length > 0 && (
              <div className="hidden max-[1200px]:block bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors">
                <h2 className="text-xl font-semibold mb-4 text-white">{getTranslation(language, "moreSeasons")}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {seasons.map((season, index) => (
                    <Link
                      to={`/${season.id}`}
                      key={index}
                      className={`relative w-full aspect-[3/1] rounded-lg overflow-hidden cursor-pointer group ${
                        animeId === String(season.id)
                          ? "ring-2 ring-white/40 shadow-lg shadow-white/10"
                          : ""
                      }`}
                    >
                      <img
                        src={season.season_poster}
                        alt={season.season}
                        className={`w-full h-full object-cover scale-150 ${
                          animeId === String(season.id)
                            ? "opacity-50"
                            : "opacity-40 group-hover:opacity-50 transition-opacity"
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
                        animeId === String(season.id)
                          ? "from-black/50 to-transparent"
                          : "from-black/40 to-transparent"
                      }`} />
                      {/* Title Container */}
                      <div className="absolute inset-0 z-30 flex items-center justify-center">
                        <p className={`text-[14px] font-bold text-center px-2 transition-colors duration-300 ${
                          animeId === String(season.id)
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

            {/* Desktop-only Seasons Section */}
            {seasons?.length > 0 && (
              <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors max-[1200px]:hidden">
                <h2 className="text-xl font-semibold mb-4 text-white">{getTranslation(language, "moreSeasons")}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                  {seasons.map((season, index) => (
                    <Link
                      to={`/${season.id}`}
                      key={index}
                      className={`relative w-full aspect-[3/1] rounded-lg overflow-hidden cursor-pointer group ${
                        animeId === String(season.id)
                          ? "ring-2 ring-white/40 shadow-lg shadow-white/10"
                          : ""
                      }`}
                    >
                      <img
                        src={season.season_poster}
                        alt={season.season}
                        className={`w-full h-full object-cover scale-150 ${
                          animeId === String(season.id)
                            ? "opacity-50"
                            : "opacity-40 group-hover:opacity-50 transition-opacity"
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
                        animeId === String(season.id)
                          ? "from-black/50 to-transparent"
                          : "from-black/40 to-transparent"
                      }`} />
                      {/* Title Container */}
                      <div className="absolute inset-0 z-30 flex items-center justify-center">
                        <p className={`text-[14px] sm:text-[16px] font-bold text-center px-2 sm:px-4 transition-colors duration-300 ${
                          animeId === String(season.id)
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
          </div>

          {/* Right Column - Episodes and Related (Desktop Only) */}
          <div className="flex flex-col gap-6 h-full max-[1200px]:hidden">
            {/* Episodes Section */}
            <div ref={episodesRef} className="episodes flex-shrink-0 bg-[#000000] border border-white/10 hover:border-white/20 transition-colors rounded-lg overflow-hidden">
              {!episodes ? (
                <div className="h-full flex items-center justify-center">
                  <BouncingLoader />
                </div>
              ) : (
                <Episodelist
                  episodes={episodes}
                  currentEpisode={episodeId}
                  onEpisodeClick={(id) => setEpisodeId(id)}
                  totalEpisodes={totalEpisodes}
                />
              )}
            </div>

            {/* Related Anime Section */}
            {relatedHasItems ? (
              <div className="bg-[#0a0a0a] rounded-lg p-4 sm:p-4 border border-white/10 hover:border-white/20 transition-colors">
                <h2 className="text-xl font-semibold mb-4 text-white">{getTranslation(language, "relatedAnime")}</h2>
                <div className="flex flex-col space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-[#1a1a1a] scrollbar-thumb-[#2a2a2a] hover:scrollbar-thumb-[#333] scrollbar-thumb-rounded">
                  {animeInfo.related_data.map((item, index) => (
                    <div key={index} className="group">
                      <Link
                        to={`/${item.id}`}
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="block"
                      >
                        <div className="flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-[#1f1f1f]">
                          <img
                            src={`${item.poster}`}
                            alt={item.title}
                            className="w-[50px] h-[70px] rounded object-cover"
                          />
                          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors line-clamp-1">
                              {language?.toLowerCase() === "en" ? item.title : item.japanese_title}
                            </span>
                            <div className="flex flex-wrap items-center w-fit space-x-2">
                              {item.tvInfo?.sub && (
                                <div className="flex space-x-1 justify-center items-center bg-[#0a0a0a] rounded-md border border-white/10 hover:border-white/20 px-1.5 py-0.5 transition-colors duration-200">
                                  <FontAwesomeIcon
                                    icon={faClosedCaptioning}
                                    className="text-[11px] text-gray-300"
                                  />
                                  <p className="text-[11px] font-medium text-gray-300">
                                    {item.tvInfo.sub}
                                  </p>
                                </div>
                              )}
                              {item.tvInfo?.dub && (
                                <div className="flex space-x-1 justify-center items-center bg-[#0a0a0a] rounded-md border border-white/10 hover:border-white/20 px-1.5 py-0.5 transition-colors duration-200">
                                  <FontAwesomeIcon
                                    icon={faMicrophone}
                                    className="text-[11px] text-gray-300"
                                  />
                                  <p className="text-[11px] font-medium text-gray-300">
                                    {item.tvInfo.dub}
                                  </p>
                                </div>
                              )}
                              {item.tvInfo?.showType && (
                                <span className="text-[11px] font-medium text-gray-300 bg-[#0a0a0a] rounded-md border border-white/10 px-1.5 py-0.5">
                                  {item.tvInfo.showType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : homeInfo?.trending ? (
              <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors">
                <h2 className="text-xl font-semibold mb-4 text-white">{getTranslation(language, "trendingNow")}</h2>
                <div className="flex flex-col space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-[#1a1a1a] scrollbar-thumb-[#2a2a2a] hover:scrollbar-thumb-[#333] scrollbar-thumb-rounded">
                  {trendingWithCurrent.map((item, index) => (
                    <div key={index} className="group">
                      <Link
                        to={`/${item.id}`}
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="block"
                      >
                        <div className="flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-[#1a1a1a]">
                          <div className="relative">
                            <img
                              src={item.poster}
                              alt={item.title}
                              className="w-[50px] h-[70px] rounded object-cover"
                            />
                            <div className="absolute top-0 left-0 bg-white/90 text-black text-xs font-bold px-1.5 rounded-br">
                              #{index + 1}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors line-clamp-2">
                              {language?.toLowerCase() === "en" ? item.title : item.japanese_title}
                            </span>
                            <div className="flex flex-wrap items-center w-fit space-x-2">
                              {item.tvInfo?.sub && (
                                <div className="flex space-x-1 justify-center items-center bg-[#0a0a0a] rounded-md border border-white/10 hover:border-white/20 px-1.5 py-0.5 transition-colors duration-200">
                                  <FontAwesomeIcon
                                    icon={faClosedCaptioning}
                                    className="text-[11px] text-gray-300"
                                  />
                                  <p className="text-[11px] font-medium text-gray-300">
                                    {item.tvInfo.sub}
                                  </p>
                                </div>
                              )}
                              {item.tvInfo?.dub && (
                                <div className="flex space-x-1 justify-center items-center bg-[#0a0a0a] rounded-md border border-white/10 hover:border-white/20 px-1.5 py-0.5 transition-colors duration-200">
                                  <FontAwesomeIcon
                                    icon={faMicrophone}
                                    className="text-[11px] text-gray-300"
                                  />
                                  <p className="text-[11px] font-medium text-gray-300">
                                    {item.tvInfo.dub}
                                  </p>
                                </div>
                              )}
                              {item.tvInfo?.showType && (
                                <span className="text-[11px] font-medium text-gray-300 bg-[#0a0a0a] rounded-md border border-white/10 px-1.5 py-0.5">
                                  {item.tvInfo.showType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <SidecardLoader />
              </div>
            )}
          </div>

          {/* Comment Section - Mobile First */}
          <div className="w-full max-[1200px]:block hidden">
            <CommentSection animeId={animeId} episodeId={episodeId} episodeNumber={activeEpisodeNum} deviceType="mobile" />
          </div>

          {/* Mobile-only Related Section */}
          {relatedHasItems ? (
            <div className="hidden max-[1200px]:block bg-[#0a0a0a] rounded-lg p-4 sm:p-4 border border-white/10 hover:border-white/20 transition-colors">
              <h2 className="text-xl font-semibold mb-4 text-white">{getTranslation(language, "relatedAnime")}</h2>
              <div className="flex flex-col space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-[#1a1a1a] scrollbar-thumb-[#2a2a2a] hover:scrollbar-thumb-[#333] scrollbar-thumb-rounded">
                {animeInfo.related_data.map((item, index) => (
                  <div key={index} className="group">
                    <Link
                      to={`/${item.id}`}
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="block"
                    >
                      <div className="flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-[#1f1f1f]">
                        <img
                          src={`${item.poster}`}
                          alt={item.title}
                          className="w-[50px] h-[70px] rounded object-cover"
                        />
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors line-clamp-1">
                            {language?.toLowerCase() === "en" ? item.title : item.japanese_title}
                          </span>
                          <div className="flex flex-wrap items-center w-fit space-x-2">
                            {item.tvInfo?.sub && (
                              <div className="flex space-x-1 justify-center items-center bg-[#0a0a0a] rounded-md border border-white/10 hover:border-white/20 px-1.5 py-0.5 transition-colors duration-200">
                                <FontAwesomeIcon
                                  icon={faClosedCaptioning}
                                  className="text-[11px] text-gray-300"
                                />
                                <p className="text-[11px] font-medium text-gray-300">
                                  {item.tvInfo.sub}
                                </p>
                              </div>
                            )}
                            {item.tvInfo?.dub && (
                              <div className="flex space-x-1 justify-center items-center bg-[#0a0a0a] rounded-md border border-white/10 hover:border-white/20 px-1.5 py-0.5 transition-colors duration-200">
                                <FontAwesomeIcon
                                  icon={faMicrophone}
                                  className="text-[11px] text-gray-300"
                                />
                                <p className="text-[11px] font-medium text-gray-300">
                                  {item.tvInfo.dub}
                                </p>
                              </div>
                            )}
                            {item.tvInfo?.showType && (
                              <span className="text-[11px] font-medium text-gray-300 bg-[#0a0a0a] rounded-md border border-white/10 px-1.5 py-0.5">
                                {item.tvInfo.showType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : homeInfo?.trending ? (
            <div className="hidden max-[1200px]:block bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors">
              <h2 className="text-xl font-semibold mb-4 text-white">{getTranslation(language, "trendingNow")}</h2>
              <div className="flex flex-col space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-[#1a1a1a] scrollbar-thumb-[#2a2a2a] hover:scrollbar-thumb-[#333] scrollbar-thumb-rounded">
                {trendingWithCurrent.map((item, index) => (
                  <div key={index} className="group">
                    <Link
                      to={`/${item.id}`}
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="block"
                    >
                      <div className="flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-[#1a1a1a]">
                        <div className="relative">
                          <img
                            src={item.poster}
                            alt={item.title}
                            className="w-[50px] h-[70px] rounded object-cover"
                          />
                          <div className="absolute top-0 left-0 bg-white/90 text-black text-xs font-bold px-1.5 rounded-br">
                            #{index + 1}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors line-clamp-2">
                            {language?.toLowerCase() === "en" ? item.title : item.japanese_title}
                          </span>
                          <div className="flex flex-wrap items-center w-fit space-x-2">
                            {item.tvInfo?.sub && (
                              <div className="flex space-x-1 justify-center items-center bg-[#0a0a0a] rounded-md border border-white/10 hover:border-white/20 px-1.5 py-0.5 transition-colors duration-200">
                                <FontAwesomeIcon
                                  icon={faClosedCaptioning}
                                  className="text-[11px] text-gray-300"
                                />
                                <p className="text-[11px] font-medium text-gray-300">
                                  {item.tvInfo.sub}
                                </p>
                              </div>
                            )}
                            {item.tvInfo?.dub && (
                              <div className="flex space-x-1 justify-center items-center bg-[#0a0a0a] rounded-md border border-white/10 hover:border-white/20 px-1.5 py-0.5 transition-colors duration-200">
                                <FontAwesomeIcon
                                  icon={faMicrophone}
                                  className="text-[11px] text-gray-300"
                                />
                                <p className="text-[11px] font-medium text-gray-300">
                                  {item.tvInfo.dub}
                                </p>
                              </div>
                            )}
                            {item.tvInfo?.showType && (
                              <span className="text-[11px] font-medium text-gray-300 bg-[#0a0a0a] rounded-md border border-white/10 px-1.5 py-0.5">
                                {item.tvInfo.showType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Comment Section - Desktop */}
          <div className="w-full min-[1201px]:block hidden">
            <CommentSection animeId={animeId} episodeId={episodeId} episodeNumber={activeEpisodeNum} deviceType="desktop" />
          </div>
        </div>
      </div>
      
      {/* Sharing is Caring Modal */}
      {showSharingModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => {
            setShowSharingModal(false);
            setShowDonateQR(false);
          }}
        >
          <div 
            className="relative bg-[#0a0a0a] rounded-xl border border-white/10 shadow-2xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowSharingModal(false);
                setShowDonateQR(false);
              }}
              className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Anime Image - Smaller */}
            <div className="relative h-32 w-full overflow-hidden">
              <img
                src="/yay.gif"
                alt="Anime character"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {!showDonateQR ? (
                <>
                  {/* Heading */}
                  <div className="text-center space-y-1.5">
                    <h2 className="text-xl font-bold text-white">
                      {getTranslation(language, 'sharingIsCaring')}
                    </h2>
                    <p className="text-white/60 text-xs">
                      {getTranslation(language, 'biggestMotivation')}
                    </p>
                    <p className="text-white/70 text-xs mt-1">
                      {getTranslation(language, 'donateKeepAlive')}
                    </p>
                    <p className="text-white text-lg font-bold mt-3">
                      {getTranslation(language, 'thankYouSupport')}
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-2">
                    {/* Discord Button */}
                    <button
                      onClick={() => {
                        window.open('https://discord.gg/your-invite-link', '_blank');
                      }}
                      className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-[#000000] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 rounded-lg transition-all text-white font-medium text-sm"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      {getTranslation(language, 'joinDiscordButton')}
                    </button>

                    {/* Donate Button */}
                    <button
                      onClick={() => setShowDonateQR(true)}
                      className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-[#000000] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 rounded-lg transition-all text-white font-medium text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {getTranslation(language, 'donateButton')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* QR Code Display - Compact */}
                  <div className="text-center space-y-3">
                    <h2 className="text-lg font-bold text-white">
                      {getTranslation(language, 'supportUs')}
                    </h2>
                    <p className="text-white/60 text-xs">
                      {getTranslation(language, 'scanQRCode')}
                    </p>
                    
                    {/* QR Code Image - Smaller */}
                    <div className="bg-white p-3 rounded-lg inline-block mx-auto">
                      <img
                        src="/qr.png"
                        alt="Donate QR Code"
                        className="w-36 h-36 object-contain"
                      />
                    </div>

                    {/* Back Button */}
                    <button
                      onClick={() => setShowDonateQR(false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#000000] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 rounded-lg transition-all text-white font-medium text-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      {getTranslation(language, 'back')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showWatchPartyModal && (
        <WatchPartyModal 
          animeId={animeId}
          episodeId={episodeId}
          animeTitle={animeInfo?.title || animeInfo?.japanese_title || 'Unknown Anime'}
          animePoster={animeInfo?.poster}
          episodeNumber={activeEpisodeNum}
          servers={servers}
          onClose={() => setShowWatchPartyModal(false)}
        />
      )}
    </div>
  );
}
