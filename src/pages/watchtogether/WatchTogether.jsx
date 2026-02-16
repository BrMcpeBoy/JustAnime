/* eslint-disable react/prop-types */
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/src/context/LanguageContext";
import { useAuth } from "@/src/context/AuthContext";
import { getAniListMediaId } from "@/src/utils/getAniListMediaId";
import { updateAniListProgress } from "@/src/utils/updateAniListProgress";
import { getTranslation } from "@/src/translations/translations";
import { formatNumber } from "@/src/utils/numberConverter";
import { useWatch } from "@/src/hooks/useWatch";
import BouncingLoader from "@/src/components/ui/bouncingloader/Bouncingloader";
import IframePlayer from "@/src/components/player/IframePlayer";
import Episodelist from "@/src/components/episodelist/Episodelist";
import website_name from "@/src/config/website";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClosedCaptioning, faMicrophone, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Player from "@/src/components/player/Player";
import WatchTogetherChat from "@/src/components/watchparty/WatchTogetherChat";
import { createWatchTogetherSocket } from "@/src/utils/watchTogetherSocket";
import Watchcontrols from "@/src/components/watchcontrols/Watchcontrols";
import useWatchControl from "@/src/hooks/useWatchControl";
import { Users, Crown, Copy, Check } from 'lucide-react';
import CommentSection from "@/src/components/comments/CommentSection";
import getServers from "@/src/utils/getServers.utils";

export default function WatchTogether() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: animeId } = useParams();
  const { user, isAuthenticated, logout } = useAuth ? useAuth() : { user: null, isAuthenticated: false, logout: () => {} };
  
  const queryParams = new URLSearchParams(location.search);
  const initialEpisodeId = queryParams.get("ep");
  const roomId = queryParams.get("room");
  const isHost = queryParams.get("host") === "true";
  const urlAudioType = queryParams.get("audio"); // Read audio type from URL
  
  // ✅ SET LOCALSTORAGE BEFORE ANY HOOKS - This runs during component initialization
  // This ensures useWatch reads the correct preferences from the start
  const { roomServerType, roomType: initialRoomType, animeTitle: roomAnimeTitle, episodeNumber: roomEpisodeNumber, animePoster: roomAnimePoster } = (() => {
    if (!roomId) return { roomServerType: null, roomType: null, animeTitle: null, episodeNumber: null, animePoster: null };
    
    // Priority 1: URL parameter (most reliable for members joining)
    if (urlAudioType && (urlAudioType === 'sub' || urlAudioType === 'dub')) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎬 INITIALIZATION - Using URL audio parameter');
      console.log('   URL audio type:', urlAudioType);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Set localStorage preferences
      localStorage.setItem("preferredServer", "HD-2");
      localStorage.setItem("audioType", urlAudioType);
      localStorage.setItem("lastWatchedServer", "HD-2");
      localStorage.setItem("lastWatchedAudioType", urlAudioType);
      
      console.log('✅ Set all localStorage preferences to:', urlAudioType);
      
      // Try to get room metadata from localStorage
      const roomKey = `watch-together-room-${roomId}`;
      const roomData = localStorage.getItem(roomKey);
      let roomMetadata = { roomType: 'public', animeTitle: null, episodeNumber: null, animePoster: null };
      
      if (roomData) {
        try {
          const parsed = JSON.parse(roomData);
          roomMetadata = {
            roomType: parsed.roomType || 'public',
            animeTitle: parsed.animeTitle,
            episodeNumber: parsed.episodeNumber,
            animePoster: parsed.animePoster
          };
        } catch (err) {
          console.error('Error parsing room metadata:', err);
        }
      }
      
      return {
        roomServerType: urlAudioType,
        roomType: roomMetadata.roomType,
        animeTitle: roomMetadata.animeTitle,
        episodeNumber: roomMetadata.episodeNumber,
        animePoster: roomMetadata.animePoster
      };
    }
    
    // Priority 2: localStorage (for when returning to room or after JoinRoom navigation)
    const roomKey = `watch-together-room-${roomId}`;
    const roomData = localStorage.getItem(roomKey);
    
    if (roomData) {
      try {
        const parsed = JSON.parse(roomData);
        if (parsed.serverType) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎬 INITIALIZATION - Setting localStorage from room data');
          console.log('   Room serverType:', parsed.serverType);
          console.log('   Room type:', parsed.roomType);
          console.log('   Anime title:', parsed.animeTitle);
          console.log('   Episode number:', parsed.episodeNumber);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          // Override ALL localStorage preferences BEFORE useWatch reads them
          localStorage.setItem("preferredServer", "HD-2");
          localStorage.setItem("audioType", parsed.serverType);
          localStorage.setItem("lastWatchedServer", "HD-2");
          localStorage.setItem("lastWatchedAudioType", parsed.serverType);
          
          console.log('✅ Set all localStorage preferences to:', parsed.serverType);
          
          return { 
            roomServerType: parsed.serverType,
            roomType: parsed.roomType || 'public',
            animeTitle: parsed.animeTitle,
            episodeNumber: parsed.episodeNumber,
            animePoster: parsed.animePoster
          };
        }
      } catch (err) {
        console.error('Error reading room data:', err);
      }
    }
    return { roomServerType: null, roomType: null, animeTitle: null, episodeNumber: null, animePoster: null };
  })();
  
  const [roomType, setRoomType] = useState(initialRoomType || 'public');
  
  // ✅ Determine initial room server type
  const initialRoomServerType = roomServerType || 'sub';
  
  // ✅ CRITICAL: Track ORIGINAL room preference (never changes)
  const [originalRoomAudioPreference] = useState(initialRoomServerType);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎬 WatchTogether COMPONENT INIT');
  console.log('   Is Host:', isHost);
  console.log('   Room ID:', roomId);
  console.log('   roomServerType from init:', roomServerType);
  console.log('   initialRoomServerType:', initialRoomServerType);
  console.log('   originalRoomAudioPreference:', originalRoomAudioPreference);
  console.log('   localStorage audioType:', localStorage.getItem("audioType"));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const [currentRoomServerType, setCurrentRoomServerType] = useState(initialRoomServerType);
  
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [memberCount, setMemberCount] = useState(0); // Track member count from chat
  const [isReconnecting, setIsReconnecting] = useState(false); // Track reconnection state
  const [copied, setCopied] = useState(false);
  const [videoHeight, setVideoHeight] = useState(600); // Default height
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [streamEnded, setStreamEnded] = useState(false);
  const [isKicked, setIsKicked] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [audioType, setAudioType] = useState(currentRoomServerType); // Track audio type (sub/dub)
  const [isSyncing, setIsSyncing] = useState(false); // No syncing - members load immediately
  const [pendingSyncData, setPendingSyncData] = useState(null); // Store sync data until player is ready
  const [showDubUnavailableModal, setShowDubUnavailableModal] = useState(false);
  const [pendingEpisodeChange, setPendingEpisodeChange] = useState(null);
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
  const { language } = useLanguage();
  const playerRef = useRef(null);
  const videoContainerRef = useRef(null);
  const episodesRef = useRef(null);
  const controlsRef = useRef(null);
  const isFirstSet = useRef(true);
  const ignoreNextEvent = useRef(false);
  const previousEpisodeRef = useRef(null);
  const initialSyncReceived = useRef(false); // Track if member received initial sync

  const {
    autoPlay,
    setAutoPlay,
    autoSkipIntro,
    setAutoSkipIntro,
    autoNext,
    setAutoNext,
  } = useWatchControl();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Block navigation and show confirmation modal when trying to leave
  useEffect(() => {
    // Custom event listener for navigation attempts from Navbar/UserProfile
    const handleNavigationAttempt = (event) => {
      const targetPath = event.detail?.path;
      const action = event.detail?.action;
      if (targetPath && targetPath !== location.pathname) {
        event.preventDefault();
        setPendingNavigationPath(targetPath);
        setPendingAction(action || null);
        setShowLeaveModal(true);
      }
    };

    // Listen for custom navigation events
    window.addEventListener('watchTogetherNavigationAttempt', handleNavigationAttempt);

    // Prevent accidental navigation via browser back/forward
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('watchTogetherNavigationAttempt', handleNavigationAttempt);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname]);

  // Track video container height to match chat height on desktop
  useEffect(() => {
    if (!videoContainerRef.current) return;

    const updateHeight = () => {
      if (window.innerWidth >= 1200) { // Desktop only
        const height = videoContainerRef.current?.offsetHeight || 600;
        setVideoHeight(height);
      }
    };

    // Initial measurement
    updateHeight();

    // Create ResizeObserver to track changes
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(videoContainerRef.current);

    // Also listen to window resize
    window.addEventListener('resize', updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []); // Empty dependency - set up once and let ResizeObserver handle updates

  // Members: Use URL episode as initial guess, will sync to host's real episode immediately
  const [hasReceivedSync, setHasReceivedSync] = useState(isHost); // Host doesn't need sync
  
  const getInitialEpisodeForMember = () => {
    if (isHost) return null; // Host uses initialEpisodeId from URL normally
    
    // ⚠️ CRITICAL: Use URL episode as initial "best guess"
    // This prevents defaulting to episode 1
    // The joined-room event will IMMEDIATELY replace this with host's real episode
    // hasReceivedSync tracks if we've gotten the real episode yet
    console.log('🚀 INIT: Member using URL episode as initial guess:', initialEpisodeId);
    console.log('   Will be replaced by host episode in joined-room event');
    console.log('   Continue watching will be IGNORED');
    return initialEpisodeId || '1'; // Use URL episode, or fallback to "1"
  };
  
  const [memberSyncedEpisodeId, setMemberSyncedEpisodeId] = useState(getInitialEpisodeForMember());

  const {
    buffering,
    streamInfo,
    streamUrl,
    animeInfo,
    episodes,
    intro,
    outro,
    subtitles,
    thumbnail,
    activeEpisodeNum,
    episodeId: useWatchEpisodeId,
    setEpisodeId: setUseWatchEpisodeId,
    servers,
    activeServerName,
    setActiveServerId,
    setActiveServerType,
    setActiveServerName,
    isFullOverview: watchIsFullOverview,
    setIsFullOverview: watchSetIsFullOverview,
  } = useWatch(
    animeId, 
    isHost ? initialEpisodeId : memberSyncedEpisodeId,
    // CRITICAL: Always pass ORIGINAL room preference (not current type)
    // This ensures every episode change tries the original preference first
    roomId ? {
      serverType: originalRoomAudioPreference, // ORIGINAL preference (dub stays dub)
      serverName: 'HD-2', // Always use HD-2 for Watch Together
      isWatchTogether: true
    } : null
  );
  
  // Expose correct episodeId based on role
  const episodeId = isHost ? useWatchEpisodeId : memberSyncedEpisodeId;
  
  // Wrapper setEpisodeId that updates the right state
  const setEpisodeId = (newEpisodeId) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 setEpisodeId called: ${newEpisodeId}`);
    console.log(`   Is Host: ${isHost}`);
    console.log(`   Current member episode: ${memberSyncedEpisodeId}`);
    console.log(`   Current useWatch episode: ${useWatchEpisodeId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 RESETTING activeServerId to force server reselection from new episode');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // CRITICAL FIX: Reset activeServerId so useWatch will re-select server
    // based on the new episode's available servers using originalRoomAudioPreference
    setActiveServerId(null);
    setActiveServerType(null);
    setActiveServerName(null);
    
    if (isHost) {
      setUseWatchEpisodeId(newEpisodeId);
    } else {
      console.log('🔄 MEMBER: Setting synced episode to:', newEpisodeId);
      setMemberSyncedEpisodeId(newEpisodeId);
      setUseWatchEpisodeId(newEpisodeId); // Also update useWatch so it fetches servers
    }
  };

  // Verify and force HD-2 server selection (backup in case useWatch doesn't pick it up)
  useEffect(() => {
    if (!servers || servers.length === 0 || !roomId || !currentRoomServerType) return;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFICATION - Checking server selection');
    console.log('   Room serverType:', currentRoomServerType);
    console.log('   Available servers:', servers.map(s => `${s.serverName}-${s.type}`));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const hd2Server = servers.find(server => 
      server.serverName?.toLowerCase() === 'hd-2' && 
      server.type === currentRoomServerType
    );
    
    if (hd2Server) {
      console.log('✅ Found HD-2 server:', hd2Server);
      console.log('   Setting data_id:', hd2Server.data_id);
      console.log('   Setting type:', currentRoomServerType);
      
      // Force set the correct server
      setActiveServerId(hd2Server.data_id);
      setActiveServerType(currentRoomServerType);
      setActiveServerName('HD-2');
      setAudioType(currentRoomServerType); // Update audioType state
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ SERVER SET SUCCESSFULLY');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ HD-2 server with type', currentRoomServerType, 'NOT FOUND!');
      console.error('   Available servers:', servers);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }, [servers, roomId, currentRoomServerType, setActiveServerId, setActiveServerType, setActiveServerName]);

  // AniList update function for Watch Together members
  // Defined here so it has access to animeInfo from useWatch
  // Wrapped in useCallback to prevent unnecessary re-renders
  const updateAniListForWatchTogether = useCallback(async (currentEpisodeNum) => {
    // Only update if user is authenticated and has AniList connected
    if (!isAuthenticated || !user?.anilistToken || !animeInfo?.title) return;
    
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Updating AniList progress');
      console.log('   Anime:', animeInfo.title);
      console.log('   Episode:', currentEpisodeNum);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Get AniList media ID for this anime
      const mediaId = await getAniListMediaId(animeInfo.title);
      
      if (!mediaId) {
        console.log('⚠️ Could not find AniList media ID for:', animeInfo.title);
        return;
      }
      
      // Update progress on AniList
      await updateAniListProgress({
        accessToken: user.anilistToken,
        mediaId: mediaId,
        progress: Number(currentEpisodeNum) || 1,
      });
      
      console.log('✅ AniList updated successfully!');
      console.log('   Media ID:', mediaId);
      console.log('   Progress:', currentEpisodeNum);
    } catch (error) {
      console.error('❌ Failed to update AniList:', error);
      // Don't throw - this shouldn't break the watch experience
    }
  }, [isAuthenticated, user?.anilistToken, animeInfo?.title]); // Only recreate if these change

  // Maintain room audio preference across episode changes
  useEffect(() => {
    if (!roomId || !currentRoomServerType) return;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 EPISODE ID CHANGED - Re-enforcing room preference');
    console.log('   Episode ID:', episodeId);
    console.log('   Room serverType:', currentRoomServerType);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Re-apply room preferences whenever episode changes
    localStorage.setItem("preferredServer", "HD-2");
    localStorage.setItem("audioType", currentRoomServerType);
    localStorage.setItem("lastWatchedServer", "HD-2");
    localStorage.setItem("lastWatchedAudioType", currentRoomServerType);
    
    console.log('✅ Room audio preference maintained');
  }, [episodeId, roomId, currentRoomServerType]);

  // Cleanup: Restore user preferences when leaving watch together
  useEffect(() => {
    // Store original preferences on mount
    const originalPreferences = {
      preferredServer: localStorage.getItem("preferredServer"),
      audioType: localStorage.getItem("audioType"),
      lastWatchedServer: localStorage.getItem("lastWatchedServer"),
      lastWatchedAudioType: localStorage.getItem("lastWatchedAudioType")
    };
    
    console.log('💾 Saved original preferences:', originalPreferences);
    
    return () => {
      // Restore all preferences on unmount
      console.log('🔄 Restoring user preferences to:', originalPreferences);
      
      // Restore preferredServer
      if (originalPreferences.preferredServer && originalPreferences.preferredServer !== "HD-2") {
        localStorage.setItem("preferredServer", originalPreferences.preferredServer);
      } else if (originalPreferences.preferredServer === null) {
        localStorage.removeItem("preferredServer");
      }
      
      // Restore audioType
      if (originalPreferences.audioType && originalPreferences.audioType !== currentRoomServerType) {
        localStorage.setItem("audioType", originalPreferences.audioType);
      } else if (originalPreferences.audioType === null) {
        localStorage.removeItem("audioType");
      }
      
      // Restore lastWatchedServer
      if (originalPreferences.lastWatchedServer && originalPreferences.lastWatchedServer !== "HD-2") {
        localStorage.setItem("lastWatchedServer", originalPreferences.lastWatchedServer);
      } else if (originalPreferences.lastWatchedServer === null) {
        localStorage.removeItem("lastWatchedServer");
      }
      
      // Restore lastWatchedAudioType
      if (originalPreferences.lastWatchedAudioType && originalPreferences.lastWatchedAudioType !== currentRoomServerType) {
        localStorage.setItem("lastWatchedAudioType", originalPreferences.lastWatchedAudioType);
      } else if (originalPreferences.lastWatchedAudioType === null) {
        localStorage.removeItem("lastWatchedAudioType");
      }
      
      console.log('✅ User preferences restored!');
    };
  }, [currentRoomServerType]); // Only run once on mount and unmount

  // Sync current episode to Continue Watching and AniList when episode changes
  // NOTE: In Watch Together mode, this ONLY records what the user watched
  // It does NOT affect which episode loads - members always get host's episode
  useEffect(() => {
    console.log('🔔 WatchTogether sync effect triggered:', { activeEpisodeNum, isAuthenticated, animeTitle: animeInfo?.title });
    
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
      // NOTE: This is just for tracking user's progress. In Watch Together mode,
      // this data is NOT used for loading episodes - members always load host's episode
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
            // ✅ Save audio selection
            lastServerType: audioType, // 'sub' or 'dub'
            lastServerName: 'HD-2', // Watch Together uses HD-2
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
  }, [activeEpisodeNum, episodeId, animeInfo?.title, animeId, animeInfo, isAuthenticated]);

  // ✅ Periodic save of playback position for Watch Together (both host and members)
  useEffect(() => {
    if (!animeInfo || !episodeId || !activeEpisodeNum) return; // Both host and member can save

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
            
            console.log(`💾 [Watch Together ${isHost ? 'Host' : 'Member'}] Playback position saved:`, {
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
  }, [animeInfo, episodeId, activeEpisodeNum, animeId, isHost]);

  // Initialize username
  useEffect(() => {
    // Priority: 1. Authenticated user name, 2. Saved guest name, 3. New guest name
    let finalUsername;
    
    if (user?.name) {
      // If user is authenticated, always use their real name
      finalUsername = user.name;
      console.log('✅ Using authenticated username:', finalUsername);
    } else {
      // Not authenticated - check for saved guest name
      let savedUsername = localStorage.getItem('watchTogetherUsername');
      
      if (!savedUsername) {
        // No saved name - generate new guest name
        savedUsername = `Guest${Math.floor(Math.random() * 1000)}`;
        console.log('🆔 Generated new guest username:', savedUsername);
      } else {
        console.log('🔄 Using saved guest username:', savedUsername);
      }
      
      finalUsername = savedUsername;
    }
    
    // Save to localStorage (updates if user logged in, or saves new guest name)
    localStorage.setItem('watchTogetherUsername', finalUsername);
    setUsername(finalUsername);
  }, [user]);

  // Initialize socket connection
  useEffect(() => {
    if (!roomId || !username) return;

    // For host: use initialEpisodeId to create room (from URL)
    // For member: use null, they will sync from backend
    const episodeForConnection = isHost ? initialEpisodeId : null;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 SOCKET CONNECTION INITIALIZING');
    console.log('   Room ID:', roomId);
    console.log('   Username:', username);
    console.log('   Is Host:', isHost);
    console.log('   Anime ID:', animeId);
    console.log('   Episode for connection:', episodeForConnection);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const newSocket = createWatchTogetherSocket();
    
    // ✅ Members wait for joined-room event to get correct episode before loading video
    console.log('🎬 Member waiting for episode sync from host...');
    
    // Timeout for joined-room event (for sync confirmation only)
    let joinRoomTimeout = null;
    
    // Listen for joined-room event to SYNC (video already loading!)
    if (!isHost) {
      newSocket.on('joined-room', (data) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 MEMBER: Received room sync data');
        console.log('   Episode from backend:', data.roomInfo?.episodeId);
        console.log('   ServerType from backend:', data.roomInfo?.serverType);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Clear timeout
        if (joinRoomTimeout) {
          clearTimeout(joinRoomTimeout);
          joinRoomTimeout = null;
        }
        
        // Apply serverType
        if (data.roomInfo?.serverType) {
          console.log('🎵 MEMBER: Applying room serverType:', data.roomInfo.serverType);
          
          localStorage.setItem("preferredServer", "HD-2");
          localStorage.setItem("audioType", data.roomInfo.serverType);
          localStorage.setItem("lastWatchedServer", "HD-2");
          localStorage.setItem("lastWatchedAudioType", data.roomInfo.serverType);
          
          // Store room data
          const roomKey = `watch-together-room-${roomId}`;
          const roomData = {
            animeId: data.roomInfo.animeId,
            episodeId: data.roomInfo.episodeId,
            serverType: data.roomInfo.serverType,
            roomType: data.roomInfo.roomType,
            joinedAt: new Date().toISOString()
          };
          localStorage.setItem(roomKey, JSON.stringify(roomData));
          
          setCurrentRoomServerType(data.roomInfo.serverType);
          setAudioType(data.roomInfo.serverType);
          
          console.log('✅ Room settings synced');
        }
        
        // ⚠️ CRITICAL: ALWAYS sync episode when joining
        // Members MUST get the real current episode from the host
        // This completely ignores:
        // - URL parameters (might be stale from cache)
        // - Continue watching data (user's personal progress, not relevant in watch together)
        // - Any local storage data
        // Solution: Trust ONLY the backend's current room state (what host is watching NOW)
        if (data.roomInfo?.episodeId) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔄 MEMBER: Syncing to host\'s REAL current episode');
          console.log('   ✅ Host current episode:', data.roomInfo.episodeId);
          console.log('   ❌ Ignoring URL episode:', initialEpisodeId);
          console.log('   ❌ Ignoring continue watching');
          console.log('   Member URL episode:', memberSyncedEpisodeId);
          console.log('   Action: Sync to host episode NOW');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          // Mark that we've received sync
          setHasReceivedSync(true);
          
          // Set member's episode to host's current episode
          setMemberSyncedEpisodeId(data.roomInfo.episodeId);
          setEpisodeId(data.roomInfo.episodeId);
        }
        
        initialSyncReceived.current = true;
        
        // Update AniList
        setTimeout(() => {
          if (episodes && episodes.length > 0 && data.roomInfo?.episodeId) {
            const syncedEpisode = episodes.find(ep => {
              const match = ep.id.match(/ep=(\d+)/);
              return match && match[1] === data.roomInfo.episodeId;
            });
            if (syncedEpisode?.episode_no) {
              updateAniListForWatchTogether(syncedEpisode.episode_no);
            }
          }
        }, 2000);
      });
      
      // Timeout - just for sync confirmation (video already loading!)
      joinRoomTimeout = setTimeout(() => {
        console.log('⚠️ Sync confirmation delayed, but video already loading...');
        if (!initialSyncReceived.current) {
          newSocket.emit('request-sync');
        }
      }, 3000);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 ABOUT TO CONNECT SOCKET');
    console.log('   currentRoomServerType:', currentRoomServerType);
    console.log('   Will send to backend:', currentRoomServerType || 'sub');
    console.log('   roomType:', roomType);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    newSocket.connect(
      roomId, 
      username,
      user?.id || null, // Pass real userId (user.id not user.userId)
      isHost, 
      animeId, 
      episodeForConnection, 
      currentRoomServerType || 'sub', 
      roomType,
      roomAnimeTitle || animeInfo?.title || 'Unknown Anime',
      roomEpisodeNumber || activeEpisodeNum,
      roomAnimePoster || animeInfo?.poster
    );
    setSocket(newSocket);
    setIsConnected(true);
    
    // Listen for reconnection events
    newSocket.on('disconnect', () => {
      console.log('🔴 Socket disconnected');
      setIsReconnecting(true);
    });
    
    newSocket.on('reconnecting', () => {
      console.log('🟠 Socket reconnecting...');
      setIsReconnecting(true);
    });
    
    newSocket.on('reconnect', () => {
      console.log('🟢 Socket reconnected');
      setIsReconnecting(false);
    });
    
    newSocket.on('connect', () => {
      console.log('🟢 Socket connected');
      setIsReconnecting(false);
    });

    // If member, request initial sync from backend as backup
    if (!isHost) {
      let syncAttempts = 0;
      const maxSyncAttempts = 2; // Reduced - video is already loading
      let syncTimeoutId = null;
      
      const requestSync = () => {
        // Stop retrying if we already received initial sync
        if (initialSyncReceived.current) {
          console.log('✅ Initial sync already received, stopping retry attempts');
          return;
        }
        
        syncAttempts++;
        console.log(`🔄 Member requesting backup sync (attempt ${syncAttempts}/${maxSyncAttempts})`);
        newSocket.requestSync(); // Backup sync request
        
        // Retry if needed
        if (syncAttempts < maxSyncAttempts) {
          syncTimeoutId = setTimeout(requestSync, 2000 * syncAttempts);
        } else {
          console.warn('⚠️ Max sync attempts reached.');
          // Fallback: Use URL episode if available, or episode 1
          if (!memberSyncedEpisodeId) {
            const fallbackEpisodeId = initialEpisodeId || '1';
            console.log('🔄 Falling back to episode:', fallbackEpisodeId);
            setEpisodeId(fallbackEpisodeId);
            setIsSyncing(false);
          }
        }
      };
      
      // Request backup sync after joined-room should have fired
      syncTimeoutId = setTimeout(requestSync, 2000);
      
      // Cleanup timeout on unmount
      return () => {
        if (syncTimeoutId) {
          clearTimeout(syncTimeoutId);
        }
        if (joinRoomTimeout) {
          clearTimeout(joinRoomTimeout);
        }
        if (newSocket) {
          newSocket.off('joined-room');
          newSocket.disconnect();
        }
      };
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [roomId, username, isHost, animeId, initialEpisodeId]);

  // Handle video sync events (members only)
  useEffect(() => {
    if (!socket || isHost) return;

    const handleVideoEvent = (data) => {
      if (!playerRef.current) return;
      
      const player = playerRef.current;

      console.log('Member received video event:', data.eventType, data.data);

      // Set flag to allow sync operations
      ignoreNextEvent.current = true;

      switch (data.eventType) {
        case 'play':
          // Sync time first, then play
          if (data.data && data.data.time !== undefined && player?.video) {
            let targetTime = data.data.time;
            
            // Compensate for network latency
            if (data.data.timestamp) {
              const latency = (Date.now() - data.data.timestamp) / 1000;
              targetTime += latency;
              console.log(`Play with latency compensation: ${data.data.time} + ${latency.toFixed(2)}s = ${targetTime.toFixed(2)}`);
            }
            
            player.currentTime = targetTime;
          }
          if (player?.video && player.video.paused) {
            // Directly control the video element for members
            player.video.play().catch(err => {
              console.log('Play error:', err);
              // Store as pending if failed
              setPendingSyncData({ time: data.data?.time || 0, paused: false });
            });
          }
          break;
        case 'pause':
          // Sync time first, then pause
          if (data.data && data.data.time !== undefined && player?.video) {
            player.currentTime = data.data.time;
          }
          if (player?.video && !player.video.paused) {
            // Directly control the video element for members
            player.video.pause();
          } else if (!player?.video) {
            // Store as pending if player not ready
            setPendingSyncData({ time: data.data?.time || 0, paused: true });
          }
          break;
        case 'seek':
          if (player?.video && data.data && data.data.time !== undefined) {
            let targetTime = data.data.time;
            
            // If video is playing (not paused), compensate for network latency
            if (!data.data.paused && data.data.timestamp) {
              const latency = (Date.now() - data.data.timestamp) / 1000; // Convert to seconds
              targetTime += latency;
              console.log(`Seek with latency compensation: ${data.data.time} + ${latency.toFixed(2)}s = ${targetTime.toFixed(2)}`);
            } else {
              console.log(`Seek to exact time: ${targetTime} (paused)`);
            }
            
            player.currentTime = targetTime;
          } else if (!player?.video && data.data?.time !== undefined) {
            // Store as pending if player not ready
            setPendingSyncData({ time: data.data.time, paused: data.data.paused || true });
          }
          break;
        case 'sync':
          // Periodic sync from host
          if (player?.video && data.data && data.data.time !== undefined) {
            let targetTime = data.data.time;
            
            // Compensate for network latency if timestamp is available
            if (data.data.timestamp) {
              const latency = (Date.now() - data.data.timestamp) / 1000; // Convert to seconds
              targetTime += latency;
            }
            
            const timeDiff = Math.abs(player.currentTime - targetTime);
            // Only sync if difference is more than 1.5 seconds to avoid constant micro-adjustments
            if (timeDiff > 1.5) {
              console.log(`Periodic sync: ${player.currentTime.toFixed(2)} -> ${targetTime.toFixed(2)} (diff: ${timeDiff.toFixed(2)}s)`);
              player.currentTime = targetTime;
            }
          }
          break;
        case 'initial-sync':
          // Initial sync when joining - includes video state AND episode
          if (data.data) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔄 MEMBER: Received initial sync from host');
            console.log('   Episode ID:', data.data.episodeId);
            console.log('   Current member episode:', episodeId);
            console.log('   Time:', data.data.time);
            console.log('   Paused:', data.data.paused);
            console.log('   Player ready:', !!player?.video);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            // Mark that we received initial sync (stops retry attempts)
            initialSyncReceived.current = true;
            
            // ALWAYS sync episode - THIS IS THE CRITICAL PART
            if (data.data.episodeId) {
              console.log('🎬 MEMBER: Syncing to host episode:', data.data.episodeId);
              setEpisodeId(data.data.episodeId); // This now properly updates member state
              
              // ✅ Save to continue watching for member when joining room
              if (animeInfo && !isHost) {
                try {
                  const continueWatchingList = JSON.parse(localStorage.getItem('continueWatching') || '[]');
                  const currentEpNum = parseInt(activeEpisodeNum) || 1;
                  
                  const continueWatchingEntry = {
                    id: String(animeId),
                    data_id: animeInfo?.data_id || animeInfo?.id,
                    title: animeInfo?.title || '',
                    japanese_title: animeInfo?.japanese_title || '',
                    poster: animeInfo?.poster || '',
                    episodeId: data.data.episodeId,
                    episodeNum: currentEpNum,
                    adultContent: animeInfo?.isAdult || false,
                    leftAt: Math.floor(data.data.time || 0), // Save host's current time
                    lastServerType: audioType,
                    lastServerName: 'HD-2',
                  };
                  
                  const existingIndex = continueWatchingList.findIndex(item => String(item.id) === String(animeId));
                  if (existingIndex !== -1) {
                    continueWatchingList.splice(existingIndex, 1);
                  }
                  continueWatchingList.unshift(continueWatchingEntry);
                  
                  localStorage.setItem('continueWatching', JSON.stringify(continueWatchingList));
                  window.dispatchEvent(new Event('continueWatchingUpdated'));
                  
                  console.log('💾 [Member Initial Join] Saved to continue watching:', {
                    anime: animeInfo.title,
                    episodeId: data.data.episodeId,
                    episodeNum: currentEpNum,
                    time: Math.floor(data.data.time || 0)
                  });
                } catch (err) {
                  console.error('Failed to save continue watching for member:', err);
                }
              }
              
              // Update AniList with synced episode (backup method)
              setTimeout(() => {
                if (episodes && episodes.length > 0) {
                  const syncedEpisode = episodes.find(ep => {
                    const match = ep.id.match(/ep=(\d+)/);
                    return match && match[1] === data.data.episodeId;
                  });
                  if (syncedEpisode?.episode_no) {
                    console.log('📊 Updating AniList via initial-sync:', syncedEpisode.episode_no);
                    updateAniListForWatchTogether(syncedEpisode.episode_no);
                  }
                }
              }, 2000);
            }
            
            // Sync video state only if player is ready
            if (player?.video) {
              player.currentTime = data.data.time || 0;
              if (data.data.paused && !player.video.paused) {
                player.video.pause();
              } else if (!data.data.paused && player.video.paused) {
                player.video.play().catch(err => console.log('Play error:', err));
              }
              console.log('✅ Applied video state immediately');
            } else {
              // Store sync data to apply when player is ready
              console.log('⏳ Player not ready, storing sync data for later');
              setPendingSyncData({
                time: data.data.time || 0,
                paused: data.data.paused
              });
            }
            
            // Mark syncing as complete
            setIsSyncing(false);
            console.log('✅ Initial sync complete - member on episode:', data.data.episodeId);
          }
          break;
      }

      setTimeout(() => {
        ignoreNextEvent.current = false;
      }, 1000);
    };

    socket.on('video-event', handleVideoEvent);

    return () => {
      socket.off('video-event', handleVideoEvent);
    };
  }, [socket, isHost, episodeId]);

  // Handle episode changes
  useEffect(() => {
    if (!socket || isHost) return;

    const handleEpisodeChange = (data) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📺 MEMBER: Host changed episode');
      console.log('   From:', episodeId);
      console.log('   To:', data.episodeId);
      console.log('   Ignoring any continue watching data');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (data.episodeId !== episodeId) {
        setIsSyncing(true); // Show syncing indicator
        
        // Update both the member synced episode and the actual episode
        setMemberSyncedEpisodeId(data.episodeId);
        setEpisodeId(data.episodeId);
        
        console.log('✅ Member episode updated to host episode');
        
        // Update AniList with the new episode
        // Small delay to ensure episodes data is available
        setTimeout(() => {
          if (episodes && episodes.length > 0) {
            const newEpisode = episodes.find(ep => {
              const match = ep.id.match(/ep=(\d+)/);
              return match && match[1] === data.episodeId;
            });
            if (newEpisode?.episode_no) {
              console.log('📊 Updating AniList after episode change:', newEpisode.episode_no);
              updateAniListForWatchTogether(newEpisode.episode_no);
            }
          }
        }, 1000);
      }
    };

    socket.on('episode-change', handleEpisodeChange);

    return () => {
      socket.off('episode-change', handleEpisodeChange);
    };
  }, [socket, episodeId, isHost]);

  // Apply pending sync data when player becomes ready (members only)
  useEffect(() => {
    if (isHost) return;

    // If we have pending sync data and player is ready, apply it
    if (pendingSyncData && playerRef.current?.video) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎬 MEMBER: Player is ready, applying pending sync data');
      console.log('   Time:', pendingSyncData.time);
      console.log('   Paused:', pendingSyncData.paused);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const player = playerRef.current;
      
      // Set the time
      player.currentTime = pendingSyncData.time;
      
      // Set play/pause state
      if (pendingSyncData.paused && !player.video.paused) {
        player.video.pause();
        console.log('⏸️ Paused video');
      } else if (!pendingSyncData.paused && player.video.paused) {
        player.video.play().catch(err => {
          console.log('Play error (will retry):', err);
          // Retry play after a short delay
          setTimeout(() => {
            if (player.video?.paused && !pendingSyncData.paused) {
              player.video.play().catch(e => console.log('Retry play error:', e));
            }
          }, 500);
        });
        console.log('▶️ Playing video');
      }

      // Clear pending sync data
      setPendingSyncData(null);
      console.log('✅ Pending sync data applied');
    }
    // If player just became ready and we don't have sync yet, request it
    else if (playerRef.current?.video && socket && !initialSyncReceived.current && !pendingSyncData) {
      console.log('🔄 Player ready but no sync data yet, requesting sync');
      socket.requestSync(); // ✅ Use correct method
    }
  }, [isHost, pendingSyncData, playerRef.current?.video, socket]);

  // Periodic check for pending sync (members only) - ensures sync is applied even with timing issues
  useEffect(() => {
    if (isHost || !pendingSyncData) return;

    const checkInterval = setInterval(() => {
      if (playerRef.current?.video && pendingSyncData) {
        console.log('🔄 Periodic check: Applying pending sync data');
        const player = playerRef.current;
        
        player.currentTime = pendingSyncData.time;
        
        if (pendingSyncData.paused && !player.video.paused) {
          player.video.pause();
        } else if (!pendingSyncData.paused && player.video.paused) {
          player.video.play().catch(err => console.log('Play error:', err));
        }
        
        setPendingSyncData(null);
      }
    }, 1000); // Check every second

    return () => clearInterval(checkInterval);
  }, [isHost, pendingSyncData]);

  // Monitor when player becomes ready and apply sync (members only)
  useEffect(() => {
    if (isHost || !streamUrl) return;

    // Wait a bit for player to initialize
    const checkPlayerReady = setInterval(() => {
      if (playerRef.current?.video) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎬 MEMBER: Player is now ready!');
        console.log('   Has pending sync:', !!pendingSyncData);
        console.log('   Initial sync received:', initialSyncReceived.current);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // If we have pending sync, it will be applied by the other effect
        // If we don't have sync yet, request it
        if (!pendingSyncData && !initialSyncReceived.current && socket) {
          console.log('🔄 Player ready, requesting sync from backend');
          socket.requestSync(); // ✅ Use correct method
          initialSyncReceived.current = true; // Mark to avoid repeated requests
        }

        clearInterval(checkPlayerReady);
      }
    }, 500); // Check every 500ms

    // Cleanup after 10 seconds max
    const timeout = setTimeout(() => {
      clearInterval(checkPlayerReady);
    }, 10000);

    return () => {
      clearInterval(checkPlayerReady);
      clearTimeout(timeout);
    };
  }, [isHost, streamUrl, socket]);

  // Clear syncing state when episode loads (members only)
  useEffect(() => {
    if (!isHost && streamUrl && !buffering) {
      // Episode has loaded successfully
      setTimeout(() => {
        setIsSyncing(false);
        
        // Request sync again to ensure we have latest state
        if (socket && !initialSyncReceived.current) {
          console.log('🔄 Episode loaded, requesting final sync check');
          socket.requestSync(); // ✅ Use correct method
        }
      }, 500); // Small delay to ensure smooth transition
    }
  }, [isHost, streamUrl, buffering, socket]);

  // Handle stream ended (host left)
  useEffect(() => {
    if (!socket || isHost) return;

    const handleStreamEnded = (data) => {
      console.log('Stream ended:', data);
      setStreamEnded(true);
      
      // Disconnect from socket after a short delay
      setTimeout(() => {
        if (socket) {
          socket.disconnect();
        }
      }, 100);
    };

    socket.on('stream-ended', handleStreamEnded);

    return () => {
      socket.off('stream-ended', handleStreamEnded);
    };
  }, [socket, isHost]);

  // Handle kicked event
  useEffect(() => {
    if (!socket || isHost) return;

    const handleKicked = (data) => {
      console.log('You were kicked:', data);
      setIsKicked(true);
      
      // Disconnect from socket
      setTimeout(() => {
        if (socket) {
          socket.disconnect();
        }
      }, 100);
    };

    socket.on('user-kicked', handleKicked);

    return () => {
      socket.off('user-kicked', handleKicked);
    };
  }, [socket, isHost]);

  // Handle banned event
  useEffect(() => {
    if (!socket || isHost) return;

    const handleBanned = (data) => {
      console.log('You were banned:', data);
      setIsBanned(true);
      
      // Disconnect from socket
      setTimeout(() => {
        if (socket) {
          socket.disconnect();
        }
      }, 100);
    };

    socket.on('user-banned', handleBanned);

    return () => {
      socket.off('user-banned', handleBanned);
    };
  }, [socket, isHost]);

  // Host: Broadcast video events (play/pause/seek) to backend which forwards to members
  const handlePlay = () => {
    if (isHost && socket && !ignoreNextEvent.current && playerRef.current) {
      const currentTime = playerRef.current.currentTime;
      console.log('Host playing at:', currentTime);
      socket.sendVideoEvent('play', { 
        time: currentTime,
        timestamp: Date.now()
      });
    }
  };

  const handlePause = () => {
    if (isHost && socket && !ignoreNextEvent.current && playerRef.current) {
      const currentTime = playerRef.current.currentTime;
      console.log('Host paused at:', currentTime);
      socket.sendVideoEvent('pause', { 
        time: currentTime,
        timestamp: Date.now()
      });
    }
  };

  const handleSeeked = () => {
    if (isHost && socket && !ignoreNextEvent.current && playerRef.current) {
      const currentTime = playerRef.current.currentTime;
      const isPaused = playerRef.current.video?.paused || false;
      console.log('Host seeked to:', currentTime, 'paused:', isPaused);
      socket.sendVideoEvent('seek', { 
        time: currentTime,
        timestamp: Date.now(), // Add timestamp for latency compensation
        paused: isPaused
      });
    }
  };

  // Add periodic sync for members (host broadcasts current time every 2 seconds)
  useEffect(() => {
    if (!isHost || !socket || !playerRef.current) return;

    const syncInterval = setInterval(() => {
      if (playerRef.current && playerRef.current.video && !playerRef.current.video.paused) {
        const currentTime = playerRef.current.currentTime;
        socket.sendVideoEvent('sync', { 
          time: currentTime,
          timestamp: Date.now() // Add timestamp for better sync
        });
      }
    }, 2000); // Sync every 2 seconds (reduced from 5s for tighter sync)

    return () => clearInterval(syncInterval);
  }, [isHost, socket]);

  // Check if dub is available for a specific episode
  const checkDubAvailability = async (episodeId) => {
    try {
      const serversData = await getServers(animeId, episodeId);
      const hasDub = serversData?.some(server => 
        (server.serverName === "HD-1" || server.serverName === "HD-2" || server.serverName === "HD-3") && 
        server.type === "dub"
      );
      console.log(`🎬 Dub availability check for episode ${episodeId}:`, hasDub);
      return hasDub;
    } catch (error) {
      console.error('Error checking dub availability:', error);
      return false;
    }
  };

  // Broadcast episode change (host only)
  const handleEpisodeChange = async (newEpisodeId) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 EPISODE CHANGE - Checking audio availability');
    console.log('   Original room preference:', originalRoomAudioPreference);
    console.log('   New Episode ID:', newEpisodeId);
    console.log('   Is Host:', isHost);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // If the room was created with dub preference and user is host, check if dub is available for next episode
    if (originalRoomAudioPreference === 'dub' && isHost) {
      const hasDub = await checkDubAvailability(newEpisodeId);
      
      if (!hasDub) {
        // Find the episode number for the new episode
        let nextEpisodeNumber = newEpisodeId;
        if (episodes && episodes.length > 0) {
          const foundEpisode = episodes.find(ep => {
            const match = ep.id.match(/ep=(\d+)/);
            return match && match[1] === newEpisodeId;
          });
          if (foundEpisode) {
            nextEpisodeNumber = foundEpisode.episode_no || foundEpisode.number || newEpisodeId;
          }
        }
        
        // Dub not available - show confirmation modal with episode number
        console.log('⚠️ Dub not available for episode', nextEpisodeNumber, ', showing confirmation modal');
        setPendingEpisodeChange({ episodeId: newEpisodeId, episodeNumber: nextEpisodeNumber });
        setShowDubUnavailableModal(true);
        return; // Don't proceed with episode change yet
      } else {
        console.log('✅ Dub is available for next episode');
      }
    }
    
    // Proceed with normal episode change
    proceedWithEpisodeChange(newEpisodeId);
  };

  // Proceed with episode change (extracted from handleEpisodeChange)
  const proceedWithEpisodeChange = (newEpisodeId) => {
    console.log('✅ Proceeding with episode change to:', newEpisodeId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 EPISODE CHANGE - Maintaining room audio preference');
    console.log('   Original room preference:', originalRoomAudioPreference);
    console.log('   New Episode ID:', newEpisodeId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // CRITICAL: Use ORIGINAL room preference (not current type)
    // This ensures we always try dub first if room was created with dub
    if (originalRoomAudioPreference) {
      localStorage.setItem("preferredServer", "HD-2");
      localStorage.setItem("audioType", originalRoomAudioPreference);
      localStorage.setItem("lastWatchedServer", "HD-2");
      localStorage.setItem("lastWatchedAudioType", originalRoomAudioPreference);
      console.log('✅ Re-applied ORIGINAL room audio preference:', originalRoomAudioPreference);
    }
    
    setEpisodeId(newEpisodeId); // This also resets activeServerId
    if (isHost && socket) {
      // Find the episode number from the episodes array
      let newEpisodeNumber = newEpisodeId; // Fallback to episodeId
      
      if (episodes && episodes.length > 0) {
        const foundEpisode = episodes.find(ep => {
          const match = ep.id.match(/ep=(\d+)/);
          return match && match[1] === newEpisodeId;
        });
        
        if (foundEpisode) {
          // Use episode_no from the episode object
          newEpisodeNumber = foundEpisode.episode_no || foundEpisode.number || newEpisodeId;
        }
      }
      
      console.log(`📺 Episode change: ${newEpisodeId} -> Episode ${newEpisodeNumber}`);
      
      // Update room metadata with new episode
      const roomKey = `watch-together-room-${roomId}`;
      const roomData = localStorage.getItem(roomKey);
      if (roomData) {
        try {
          const parsed = JSON.parse(roomData);
          parsed.episodeId = newEpisodeId;
          parsed.episodeNumber = newEpisodeNumber;
          localStorage.setItem(roomKey, JSON.stringify(parsed));
        } catch (err) {
          console.error('Error updating room metadata:', err);
        }
      }
      
      socket.sendEpisodeChange(newEpisodeId, newEpisodeNumber);
    }
  };

  // Handle confirmation to continue with sub
  const handleConfirmSubSwitch = () => {
    console.log('✅ User confirmed switching to sub');
    setShowDubUnavailableModal(false);
    if (pendingEpisodeChange) {
      proceedWithEpisodeChange(pendingEpisodeChange.episodeId);
      setPendingEpisodeChange(null);
    }
  };

  // Handle cancellation of episode change
  const handleCancelEpisodeChange = () => {
    console.log('❌ User canceled episode change');
    setShowDubUnavailableModal(false);
    setPendingEpisodeChange(null);
  };

  // Update URL when episode changes
  useEffect(() => {
    if (!episodes || episodes.length === 0) return;
    
    const isValidEpisode = episodes.some(ep => {
      const epNumber = ep.id.split('ep=')[1];
      return epNumber === episodeId;
    });
    
    if (!episodeId || !isValidEpisode) {
      const fallbackId = episodes[0].id.match(/ep=(\d+)/)?.[1];
      if (fallbackId && fallbackId !== episodeId) {
        setEpisodeId(fallbackId);
      }
      return;
    }
  
    // Update backend when episode changes (host only)
    if (isHost && socket && episodeId && activeEpisodeNum) {
      const roomKey = `watch-together-room-${roomId}`;
      const roomData = localStorage.getItem(roomKey);
      if (roomData) {
        try {
          const parsed = JSON.parse(roomData);
          // Only update if episode actually changed
          if (parsed.episodeId !== episodeId || parsed.episodeNumber !== activeEpisodeNum) {
            parsed.episodeId = episodeId;
            parsed.episodeNumber = activeEpisodeNum;
            localStorage.setItem(roomKey, JSON.stringify(parsed));
            console.log(`📺 Updated room episode: ${episodeId} (Episode ${activeEpisodeNum})`);
          }
        } catch (err) {
          console.error('Error updating room metadata:', err);
        }
      }
    }
  
    const newUrl = `/watch-together/${animeId}?ep=${episodeId}&room=${roomId}${isHost ? '&host=true' : ''}`;
    if (isFirstSet.current) {
      navigate(newUrl, { replace: true });
      isFirstSet.current = false;
    } else {
      navigate(newUrl);
    }
  }, [episodeId, animeId, navigate, episodes, roomId, isHost]);

  // Update document title
  useEffect(() => {
    if (animeInfo) {
      document.title = `Watch Together - ${animeInfo.title} | ${website_name}`;
    }
    return () => {
      document.title = `${website_name} | Free anime streaming platform`;
    };
  }, [animeInfo]);

  // Handle copy room link
  const copyRoomLink = () => {
    const link = `${window.location.origin}/watch-together/${animeId}?ep=${episodeId}&room=${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle member count change from chat
  const handleMemberCountChange = (count) => {
    console.log('👥 Member count updated:', count);
    setMemberCount(count);
  };

  // Handle leave room confirmation
  const handleLeaveRoom = () => {
    // Disconnect from socket
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
    
    setShowLeaveModal(false);
    
    // Handle logout action if pending
    if (pendingAction === 'logout' && logout) {
      logout();
    }
    
    // If there's a pending navigation (from navbar/profile), go there
    // Otherwise go to anime info page
    const destination = pendingNavigationPath || `/${animeId}`;
    setPendingNavigationPath(null);
    setPendingAction(null);
    navigate(destination);
  };

  if (!roomId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">{getTranslation(language, "invalidRoom")}</h2>
          <p className="text-gray-400 mb-4">No room ID provided</p>
          <Link
            to={`/watch/${animeId}?ep=${episodeId}`}
            className="bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white px-6 py-2 rounded-lg transition-colors border border-white/10 hover:border-white/20"
          >
            Back to Watch Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0a0a0a]">
      <div className="w-full max-w-[1920px] mx-auto pt-16 pb-6 w-full max-[1200px]:pt-16">
        <div className="grid grid-cols-[minmax(0,70%),minmax(0,30%)] gap-6 w-full h-full max-[1200px]:flex max-[1200px]:flex-col">
          {/* Left Column - Player, Info, Episodes */}
          <div className="flex flex-col w-full gap-6">
            
            {/* Video Player */}
            <div ref={playerRef} className="player w-full h-fit bg-black flex flex-col rounded-xl overflow-hidden">
              <div ref={videoContainerRef} className="w-full relative aspect-video bg-black">
                {!buffering && (isHost || memberSyncedEpisodeId) ? (
                  // WatchTogether only uses HD-2, which uses regular Player (not IframePlayer)
                  ["hd-4"].includes(activeServerName?.toLowerCase()) ? (
                    <IframePlayer
                      key={`iframe-${episodeId}`}
                      episodeId={episodeId}
                      servertype="sub"
                      serverName={activeServerName}
                      animeInfo={animeInfo}
                      episodeNum={activeEpisodeNum}
                      episodes={episodes}
                      playNext={(id) => handleEpisodeChange(id)}
                      autoNext={isHost ? autoNext : false}
                    />
                  ) : (
                    <Player
                      key={`player-${episodeId}-${streamUrl}`}
                      streamUrl={streamUrl}
                      subtitles={subtitles}
                      intro={intro}
                      outro={outro}
                      serverName={activeServerName?.toLowerCase()}
                      serverType={audioType}
                      thumbnail={thumbnail}
                      autoSkipIntro={isHost ? autoSkipIntro : false}
                      autoPlay={false}
                      autoNext={isHost ? autoNext : false}
                      episodeId={episodeId}
                      episodes={episodes}
                      playNext={(id) => handleEpisodeChange(id)}
                      animeInfo={animeInfo}
                      episodeNum={activeEpisodeNum}
                      streamInfo={streamInfo}
                      onPlay={handlePlay}
                      onPause={handlePause}
                      onSeeked={handleSeeked}
                      playerRef={playerRef}
                      isWatchTogetherMember={!isHost}
                      isWatchTogether={true}
                    />
                  )
                ) : (
                  <div className="absolute inset-0 flex justify-center items-center bg-black">
                    {!isHost && !memberSyncedEpisodeId ? (
                      <div className="text-center">
                        <BouncingLoader />
                        <p className="text-white/60 mt-4 text-sm">Syncing with host...</p>
                      </div>
                    ) : (
                      <BouncingLoader />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Watch Controls Section - Host Only */}
            {!buffering && isHost && (
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
                    totalEpisodes={episodes?.length || 0}
                    episodeId={episodeId}
                    onButtonClick={(id) => handleEpisodeChange(id)}
                  />
                </div>
              </div>
            )}

            {/* Chat Section - Mobile Host (under watch controls) */}
            {isHost && (
              <div 
                className="hidden max-[1200px]:block bg-[#0a0a0a] rounded-lg border border-white/10 hover:border-white/20 transition-colors overflow-hidden h-[500px]"
              >
                {isConnected && socket ? (
                  <WatchTogetherChat
                    onMemberCountChange={handleMemberCountChange}
                    roomId={roomId}
                    socket={socket}
                    username={username}
                    isHost={isHost}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/20 mx-auto mb-4"></div>
                      <p className="text-gray-400 text-sm">Connecting to room...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Room Info Bar */}
            <div className="bg-[#0a0a0a] rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setPendingNavigationPath(`/watch/${animeId}?ep=${episodeId}`);
                      setShowLeaveModal(true);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/80" />
                    <span className="text-white text-sm font-medium">Watch Together</span>
                    {isHost && (
                      <div className="flex items-center gap-1 bg-[#000000] px-2 py-0.5 rounded border border-white/10">
                        <Crown className="w-3 h-3 text-white/80" />
                        <span className="text-xs text-white/80 font-medium">{getTranslation(language, "hostLabel")}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs">|</span>
                  <span className="text-gray-400 text-xs font-mono">{getTranslation(language, "room")}: {roomId}</span>
                </div>
                <button
                  onClick={copyRoomLink}
                  className="flex items-center gap-2 bg-[#000000] hover:bg-[#1a1a1a] text-white text-xs px-3 py-1.5 rounded border border-white/10 hover:border-white/20 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>{getTranslation(language, "copied")}</span>
                    </>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {/* Tooltip */}
                  <span className="absolute bottom-full mb-2 hidden group-hover:block bg-[#1a1a1a] text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-white/10">
                    {copied ? getTranslation(language, "copied") : getTranslation(language, "copyLink")}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#1a1a1a]"></span>
                  </span>
                </button>
              </div>
            </div>

            {/* Chat Section - Mobile Guest (at the top) */}
            {!isHost && (
              <div 
                className="hidden max-[1200px]:block bg-[#0a0a0a] rounded-lg border border-white/10 hover:border-white/20 transition-colors overflow-hidden h-[500px]"
              >
                {isConnected && socket ? (
                  <WatchTogetherChat
                    onMemberCountChange={handleMemberCountChange}
                    roomId={roomId}
                    socket={socket}
                    username={username}
                    isHost={isHost}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/20 mx-auto mb-4"></div>
                      <p className="text-gray-400 text-sm">Connecting to room...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Server Info - HD-2 Only with Connection Status */}
            <div className="bg-[#0a0a0a] rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isReconnecting ? (
                    // Reconnecting state - show status with room info
                    <>
                      {/* Orange Dot - Pulsing */}
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                      
                      {/* Reconnecting Text with animated dots */}
                      <span className="text-sm font-medium text-orange-400 flex items-center gap-1">
                        Reconnecting
                        <span className="inline-flex gap-0.5">
                          <span className="animate-[bounce_1s_ease-in-out_0s_infinite]">.</span>
                          <span className="animate-[bounce_1s_ease-in-out_0.2s_infinite]">.</span>
                          <span className="animate-[bounce_1s_ease-in-out_0.4s_infinite]">.</span>
                        </span>
                      </span>
                      
                      <span className="text-gray-500 text-xs">•</span>
                      
                      {/* Room Type */}
                      <span className={`text-sm font-medium ${roomType === 'private' ? 'text-purple-400' : 'text-green-400'}`}>
                        {roomType === 'private' ? `🔒 ${getTranslation(language, "privateRoom")}` : `🌐 ${getTranslation(language, "publicRoom")}`}
                      </span>
                      
                      <span className="text-gray-500 text-xs">•</span>
                      
                      {/* Server Info */}
                      <span className="text-white text-sm font-medium">
                        HD-2 {audioType && (
                          <span className="text-gray-300">
                            ({audioType === 'sub' ? 'Sub' : 'Dub'})
                          </span>
                        )}
                      </span>
                    </>
                  ) : memberCount >= 1 ? (
                    // Connected state (member count >= 1) - show all info
                    <>
                      {/* Green Dot - Pulsing like public rooms */}
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      
                      {/* Connection Status Text */}
                      <span className="text-sm font-medium text-green-400">
                        Connected
                      </span>
                      
                      <span className="text-gray-500 text-xs">•</span>
                      
                      {/* Room Type */}
                      <span className={`text-sm font-medium ${roomType === 'private' ? 'text-purple-400' : 'text-green-400'}`}>
                        {roomType === 'private' ? `🔒 ${getTranslation(language, "privateRoom")}` : `🌐 ${getTranslation(language, "publicRoom")}`}
                      </span>
                      
                      <span className="text-gray-500 text-xs">•</span>
                      
                      {/* Server Info */}
                      <span className="text-white text-sm font-medium">
                        HD-2 {audioType && (
                          <span className="text-gray-300">
                            ({audioType === 'sub' ? 'Sub' : 'Dub'})
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    // Not connected state (member count = 0) - show status with room info
                    <>
                      {/* Red Dot - Pulsing */}
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                      
                      {/* Connecting Text with animated dots */}
                      <span className="text-sm font-medium text-red-400 flex items-center gap-1">
                        Connecting
                        <span className="inline-flex gap-0.5">
                          <span className="animate-[bounce_1s_ease-in-out_0s_infinite]">.</span>
                          <span className="animate-[bounce_1s_ease-in-out_0.2s_infinite]">.</span>
                          <span className="animate-[bounce_1s_ease-in-out_0.4s_infinite]">.</span>
                        </span>
                      </span>
                      
                      <span className="text-gray-500 text-xs">•</span>
                      
                      {/* Room Type */}
                      <span className={`text-sm font-medium ${roomType === 'private' ? 'text-purple-400' : 'text-green-400'}`}>
                        {roomType === 'private' ? `🔒 ${getTranslation(language, "privateRoom")}` : `🌐 ${getTranslation(language, "publicRoom")}`}
                      </span>
                      
                      <span className="text-gray-500 text-xs">•</span>
                      
                      {/* Server Info */}
                      <span className="text-white text-sm font-medium">
                        HD-2 {audioType && (
                          <span className="text-gray-300">
                            ({audioType === 'sub' ? 'Sub' : 'Dub'})
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Role-specific text on desktop */}
                <div className="hidden min-[1200px]:block">
                  {isHost ? (
                    <span className="text-xs text-gray-400">
                      You control everything
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      Member mode
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Anime Info Section - Desktop only */}
            <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors max-[1200px]:hidden">
              <div className="flex gap-x-6 max-[600px]:flex-row max-[600px]:gap-4">
                {animeInfo && animeInfo?.poster ? (
                  <img
                    src={`${animeInfo?.poster}`}
                    alt=""
                    className="w-[120px] h-[180px] object-cover rounded-md max-[600px]:w-[100px] max-[600px]:h-[150px]"
                  />
                ) : (
                  <div className="w-[120px] h-[180px] bg-gray-800 rounded-md max-[600px]:w-[100px] max-[600px]:h-[150px]" />
                )}
                <div className="flex flex-col gap-y-4 flex-1 max-[600px]:gap-y-2">
                  {animeInfo && animeInfo?.title ? (
                    <div 
                      onClick={(e) => {
                        e.preventDefault();
                        setShowLeaveModal(true);
                      }}
                      className="group cursor-pointer"
                    >
                      <h1 className="text-[28px] font-medium text-white leading-tight group-hover:text-gray-300 transition-colors max-[600px]:text-[20px]">
                        {language?.toLowerCase() === "en" ? animeInfo?.title : animeInfo?.japanese_title}
                      </h1>
                      <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-sm group-hover:text-white transition-colors max-[600px]:text-[12px] max-[600px]:mt-0.5">
                        <span>{getTranslation(language, "viewDetails")}</span>
                        <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform max-[600px]:w-3 max-[600px]:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="w-[170px] h-[20px] bg-gray-800 rounded-xl" />
                  )}
                  <div className="flex flex-wrap gap-2 max-[600px]:gap-1.5">
                    {animeInfo?.animeInfo?.tvInfo?.rating && (
                      <span className="px-2 py-1 bg-[#000000] rounded-md border border-white/10 hover:border-white/20 transition-colors text-sm flex items-center gap-x-0.5 text-gray-300 max-[600px]:px-2 max-[600px]:py-0.5 max-[600px]:text-[11px]">
                        {animeInfo.animeInfo.tvInfo.rating}
                      </span>
                    )}
                    {animeInfo?.animeInfo?.tvInfo?.quality && (
                      <span className="px-2 py-1 bg-[#000000] rounded-md border border-white/10 hover:border-white/20 transition-colors text-sm flex items-center gap-x-0.5 text-gray-300 max-[600px]:px-2 max-[600px]:py-0.5 max-[600px]:text-[11px]">
                        {animeInfo.animeInfo.tvInfo.quality}
                      </span>
                    )}
                    {animeInfo?.animeInfo?.tvInfo?.sub && (
                      <span className="px-2 py-1 bg-[#000000] rounded-md border border-white/10 hover:border-white/20 transition-colors text-sm flex items-center gap-x-0.5 text-gray-300 max-[600px]:px-2 max-[600px]:py-0.5 max-[600px]:text-[11px]">
                        <FontAwesomeIcon icon={faClosedCaptioning} className="text-[12px] max-[600px]:text-[10px]" />
                        {animeInfo.animeInfo.tvInfo.sub}
                      </span>
                    )}
                    {animeInfo?.animeInfo?.tvInfo?.dub && (
                      <span className="px-2 py-1 bg-[#000000] rounded-md border border-white/10 hover:border-white/20 transition-colors text-sm flex items-center gap-x-0.5 text-gray-300 max-[600px]:px-2 max-[600px]:py-0.5 max-[600px]:text-[11px]">
                        <FontAwesomeIcon icon={faMicrophone} className="text-[12px] max-[600px]:text-[10px]" />
                        {animeInfo.animeInfo.tvInfo.dub}
                      </span>
                    )}
                  </div>
                  {animeInfo?.animeInfo?.Overview && (
                    <p className="text-[15px] text-gray-400 leading-relaxed max-[600px]:text-[13px] max-[600px]:leading-normal">
                      {animeInfo?.animeInfo?.Overview.length > 270 ? (
                        <>
                          {watchIsFullOverview
                            ? animeInfo?.animeInfo?.Overview
                            : `${animeInfo?.animeInfo?.Overview.slice(0, 270)}...`}
                          <button
                            className="ml-2 text-gray-300 hover:text-white transition-colors max-[600px]:text-[12px] max-[600px]:ml-1"
                            onClick={() => watchSetIsFullOverview(!watchIsFullOverview)}
                          >
                            {watchIsFullOverview ? getTranslation(language, "showLess") : getTranslation(language, "readMore")}
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

            {/* Comment Section - Desktop */}
            <div className="w-full min-[1201px]:block hidden">
              <CommentSection animeId={animeId} episodeId={episodeId} episodeNumber={activeEpisodeNum} />
            </div>

          </div>

          {/* Right Column - Episodes for Desktop */}
          <div className="flex flex-col gap-6">

            {/* Chat Section - Desktop (on top of episode list) */}
            <div 
              className="max-[1200px]:hidden bg-[#0a0a0a] rounded-lg border border-white/10 hover:border-white/20 transition-colors overflow-hidden"
              style={{ height: `${videoHeight}px` }}
            >
              {isConnected && socket ? (
                <WatchTogetherChat
                    onMemberCountChange={handleMemberCountChange}
                  roomId={roomId}
                  socket={socket}
                  username={username}
                  isHost={isHost}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/20 mx-auto mb-4"></div>
                    <p className="text-gray-400 text-sm">Connecting to room...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile-only Episodes Section - Only for Host */}
            {isHost && (
              <div className="hidden max-[1200px]:block">
                <div ref={episodesRef} className="episodes flex-shrink-0 bg-[#000000] rounded-lg overflow-hidden">
                  {!episodes ? (
                    <div className="h-full flex items-center justify-center p-8">
                      <BouncingLoader />
                    </div>
                  ) : (
                    <Episodelist
                      episodes={episodes}
                      currentEpisode={episodeId}
                      onEpisodeClick={(id) => handleEpisodeChange(id)}
                      totalEpisodes={episodes.length}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Mobile Guest Info - Shows current episode info for guests */}
            {!isHost && (
              <div className="hidden max-[1200px]:block bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors mb-4">
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className="text-3xl">👥</div>
                  <h3 className="text-white font-semibold text-sm">{getTranslation(language, "memberView")}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {getTranslation(language, "hostControlsEpisode")}
                  </p>
                  <div className="mt-1 bg-[#000000] border border-white/10 rounded-lg p-2.5 w-full">
                    <p className="text-white text-xs mb-0.5">{getTranslation(language, "currentEpisode")}</p>
                    <p className="text-gray-300 text-sm font-medium">{getTranslation(language, "episode")} {formatNumber(activeEpisodeNum, language) || '...'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Anime Info Section - Mobile only (below episodes) */}
            <div className="hidden max-[1200px]:block bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex gap-x-6 max-[600px]:flex-row max-[600px]:gap-4">
                {animeInfo && animeInfo?.poster ? (
                  <img
                    src={`${animeInfo?.poster}`}
                    alt=""
                    className="w-[120px] h-[180px] object-cover rounded-md max-[600px]:w-[100px] max-[600px]:h-[150px]"
                  />
                ) : (
                  <div className="w-[120px] h-[180px] bg-gray-800 rounded-md max-[600px]:w-[100px] max-[600px]:h-[150px]" />
                )}
                <div className="flex flex-col gap-y-4 flex-1 max-[600px]:gap-y-2">
                  {animeInfo && animeInfo?.title ? (
                    <div 
                      onClick={(e) => {
                        e.preventDefault();
                        setShowLeaveModal(true);
                      }}
                      className="group cursor-pointer"
                    >
                      <h1 className="text-[28px] font-medium text-white leading-tight group-hover:text-gray-300 transition-colors max-[600px]:text-[20px]">
                        {language?.toLowerCase() === "en" ? animeInfo?.title : animeInfo?.japanese_title}
                      </h1>
                      <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-sm group-hover:text-white transition-colors max-[600px]:text-[12px] max-[600px]:mt-0.5">
                        <span>{getTranslation(language, "viewDetails")}</span>
                        <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform max-[600px]:w-3 max-[600px]:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="w-[170px] h-[20px] bg-gray-800 rounded-xl" />
                  )}
                  <div className="flex flex-wrap gap-2 max-[600px]:gap-1.5">
                    {animeInfo?.animeInfo?.tvInfo?.rating && (
                      <span className="px-2 py-1 bg-[#000000] rounded-md border border-white/10 hover:border-white/20 transition-colors text-sm flex items-center gap-x-0.5 text-gray-300 max-[600px]:px-2 max-[600px]:py-0.5 max-[600px]:text-[11px]">
                        {animeInfo.animeInfo.tvInfo.rating}
                      </span>
                    )}
                    {animeInfo?.animeInfo?.tvInfo?.quality && (
                      <span className="px-2 py-1 bg-[#000000] rounded-md border border-white/10 hover:border-white/20 transition-colors text-sm flex items-center gap-x-0.5 text-gray-300 max-[600px]:px-2 max-[600px]:py-0.5 max-[600px]:text-[11px]">
                        {animeInfo.animeInfo.tvInfo.quality}
                      </span>
                    )}
                    {animeInfo?.animeInfo?.tvInfo?.sub && (
                      <span className="px-2 py-1 bg-[#000000] rounded-md border border-white/10 hover:border-white/20 transition-colors text-sm flex items-center gap-x-0.5 text-gray-300 max-[600px]:px-2 max-[600px]:py-0.5 max-[600px]:text-[11px]">
                        <FontAwesomeIcon icon={faClosedCaptioning} className="text-[12px] max-[600px]:text-[10px]" />
                        {animeInfo.animeInfo.tvInfo.sub}
                      </span>
                    )}
                    {animeInfo?.animeInfo?.tvInfo?.dub && (
                      <span className="px-2 py-1 bg-[#000000] rounded-md border border-white/10 hover:border-white/20 transition-colors text-sm flex items-center gap-x-0.5 text-gray-300 max-[600px]:px-2 max-[600px]:py-0.5 max-[600px]:text-[11px]">
                        <FontAwesomeIcon icon={faMicrophone} className="text-[12px] max-[600px]:text-[10px]" />
                        {animeInfo.animeInfo.tvInfo.dub}
                      </span>
                    )}
                  </div>
                  {animeInfo?.animeInfo?.Overview && (
                    <p className="text-[15px] text-gray-400 leading-relaxed max-[600px]:text-[13px] max-[600px]:leading-normal">
                      {animeInfo?.animeInfo?.Overview.length > 270 ? (
                        <>
                          {watchIsFullOverview
                            ? animeInfo?.animeInfo?.Overview
                            : `${animeInfo?.animeInfo?.Overview.slice(0, 270)}...`}
                          <button
                            className="ml-2 text-gray-300 hover:text-white transition-colors max-[600px]:text-[12px] max-[600px]:ml-1"
                            onClick={() => watchSetIsFullOverview(!watchIsFullOverview)}
                          >
                            {watchIsFullOverview ? getTranslation(language, "showLess") : getTranslation(language, "readMore")}
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

            {/* Desktop-only Episodes Section - Only for Host */}
            {isHost && (
              <div className="max-[1200px]:hidden">
                <div ref={episodesRef} className="episodes flex-shrink-0 bg-[#000000] rounded-lg overflow-hidden">
                  {!episodes ? (
                    <div className="h-full flex items-center justify-center p-8">
                      <BouncingLoader />
                    </div>
                  ) : (
                    <Episodelist
                      episodes={episodes}
                      currentEpisode={episodeId}
                      onEpisodeClick={(id) => handleEpisodeChange(id)}
                      totalEpisodes={episodes.length}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Member Info - Show instead of episodes for members */}
            {!isHost && (
              <div className="max-[1200px]:hidden">
                <div className="bg-[#000000] rounded-lg border border-white/10 p-4">
                  <div className="flex flex-col items-center justify-center text-center gap-3 py-6">
                    <div className="text-4xl">👥</div>
                    <h3 className="text-white font-semibold text-base">{getTranslation(language, "memberView")}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {getTranslation(language, "hostControlsEpisode")}
                    </p>
                    {isSyncing ? (
                      <div className="mt-2 bg-[#0a0a0a] border border-white/10 rounded-lg p-3 w-full">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                          <p className="text-gray-300 text-sm font-medium">{getTranslation(language, "syncingWithHost") || "Syncing with host..."}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 bg-[#0a0a0a] border border-white/10 rounded-lg p-3 w-full">
                        <p className="text-white text-xs mb-1">{getTranslation(language, "currentEpisode")}</p>
                        <p className="text-gray-300 text-sm font-medium">{getTranslation(language, "episode")} {formatNumber(activeEpisodeNum, language) || '...'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comment Section - Mobile First */}
        <div className="w-full max-[1200px]:block hidden mt-6">
          <CommentSection animeId={animeId} episodeId={episodeId} episodeNumber={activeEpisodeNum} />
        </div>
      </div>

      {/* Leave Room Confirmation Modal */}
      {/* Dub Unavailable Confirmation Modal */}
      {showDubUnavailableModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-semibold text-lg">Dub Not Available</h3>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <p className="text-gray-400 text-sm leading-relaxed">
                {pendingEpisodeChange && animeInfo && (
                  <>
                    <span className="text-white font-medium">{animeInfo.title}</span> - Episode {formatNumber(pendingEpisodeChange.episodeNumber, language)} doesn't have a dubbed version available. Do you want to continue watching with sub audio instead?
                  </>
                )}
              </p>
              <div className="mt-3 bg-[#000000] border border-white/10 rounded-lg p-3">
                <p className="text-gray-400 text-xs leading-relaxed">
                  <span className="text-purple-400 font-medium">ℹ️ Note:</span> If the next episode has dub available, the audio will automatically switch back to dub.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-white/10 flex gap-3">
              <button
                onClick={handleCancelEpisodeChange}
                className="flex-1 bg-[#000000] hover:bg-[#1a1a1a] text-white font-medium py-2.5 px-4 rounded-lg transition-colors border border-white/10 hover:border-white/20 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubSwitch}
                className="flex-1 bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white font-medium py-2.5 px-4 rounded-lg transition-colors border border-white/10 hover:border-white/20 text-sm"
              >
                Continue with Sub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Party Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-semibold text-lg">{getTranslation(language, 'leaveWatchParty')}</h3>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <p className="text-gray-400 text-sm leading-relaxed">
                {getTranslation(language, 'leaveRoomConfirmation')}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  setPendingNavigationPath(null);
                  setPendingAction(null);
                }}
                className="flex-1 bg-[#000000] hover:bg-[#1a1a1a] text-white font-medium py-2.5 px-4 rounded-lg transition-colors border border-white/10 hover:border-white/20 text-sm"
              >
                {getTranslation(language, 'stayInRoom')}
              </button>
              <button
                onClick={handleLeaveRoom}
                className="flex-1 bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white font-medium py-2.5 px-4 rounded-lg transition-colors border border-white/10 hover:border-white/20 text-sm"
              >
                {getTranslation(language, 'leaveRoom')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Ended Modal */}
      {streamEnded && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg w-full max-w-md shadow-2xl">
            {/* Modal Content */}
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-purple-500/10 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-white font-semibold text-2xl mb-3">{getTranslation(language, "streamEnded")}</h3>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                {getTranslation(language, "streamEndedMessage")}
              </p>
              <button
                onClick={() => navigate('/home')}
                className="w-full bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white font-medium py-3 px-6 rounded-lg transition-colors border border-white/10 hover:border-white/20"
              >
                {getTranslation(language, "returnToHome")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kicked Modal */}
      {isKicked && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#0a0a0a] border border-orange-500/20 rounded-lg w-full max-w-md shadow-2xl">
            {/* Modal Content */}
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-orange-500/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-2xl mb-3">{getTranslation(language, "youveBeenKicked")}</h3>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                {getTranslation(language, "kickedMessage")}
              </p>
              <button
                onClick={() => navigate('/home')}
                className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-medium py-3 px-6 rounded-lg transition-colors border border-orange-500/30 hover:border-orange-500/50"
              >
                {getTranslation(language, "returnToHome")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banned Modal */}
      {isBanned && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#0a0a0a] border border-red-500/20 rounded-lg w-full max-w-md shadow-2xl">
            {/* Modal Content */}
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-2xl mb-3">{getTranslation(language, "youveBeenBanned")}</h3>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                {getTranslation(language, "bannedMessage")}
              </p>
              <button
                onClick={() => navigate('/home')}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium py-3 px-6 rounded-lg transition-colors border border-red-500/30 hover:border-red-500/50"
              >
                {getTranslation(language, "returnToHome")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
