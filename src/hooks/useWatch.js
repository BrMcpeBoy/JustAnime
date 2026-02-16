/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import getAnimeInfo from "@/src/utils/getAnimeInfo.utils";
import getEpisodes from "@/src/utils/getEpisodes.utils";
import getNextEpisodeSchedule from "../utils/getNextEpisodeSchedule.utils";
import getServers from "../utils/getServers.utils";
import getStreamInfo from "../utils/getStreamInfo.utils";

// ✅ Import custom subtitles configuration
// Uncomment this line after creating the customSubtitles.js file
// import { customSubtitles } from "@/src/config/customSubtitles";

export const useWatch = (animeId, initialEpisodeId, watchTogetherOptions = null) => {
  const [error, setError] = useState(null);
  const [buffering, setBuffering] = useState(true);
  const [streamInfo, setStreamInfo] = useState(null);
  const [animeInfo, setAnimeInfo] = useState(null);
  const [episodes, setEpisodes] = useState(null);
  const [animeInfoLoading, setAnimeInfoLoading] = useState(false);
  const [totalEpisodes, setTotalEpisodes] = useState(null);
  const [seasons, setSeasons] = useState(null);
  const [servers, setServers] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [isFullOverview, setIsFullOverview] = useState(false);
  const [subtitles, setSubtitles] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [intro, setIntro] = useState(null);
  const [outro, setOutro] = useState(null);
  const [episodeId, setEpisodeId] = useState(null);
  const [activeEpisodeNum, setActiveEpisodeNum] = useState(null);
  const [activeServerId, setActiveServerId] = useState(null);
  const [activeServerType, setActiveServerType] = useState(null);
  const [activeServerName, setActiveServerName] = useState(null);
  const [serverLoading, setServerLoading] = useState(true);
  const [nextEpisodeSchedule, setNextEpisodeSchedule] = useState(null);
  const isServerFetchInProgress = useRef(false);
  const isStreamFetchInProgress = useRef(false);

  useEffect(() => {
    setEpisodes(null);
    setEpisodeId(null);
    setActiveEpisodeNum(null);
    setServers(null);
    setActiveServerId(null);
    setStreamInfo(null);
    setStreamUrl(null);
    setSubtitles([]);
    setThumbnail(null);
    setIntro(null);
    setOutro(null);
    setBuffering(true);
    setServerLoading(true);
    setError(null);
    setAnimeInfo(null);
    setSeasons(null);
    setTotalEpisodes(null);
    setAnimeInfoLoading(true);
    isServerFetchInProgress.current = false;
    isStreamFetchInProgress.current = false;
  }, [animeId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setAnimeInfoLoading(true);
        const [animeData, episodesData] = await Promise.all([
          getAnimeInfo(animeId, false),
          getEpisodes(animeId),
        ]);
        setAnimeInfo(animeData?.data);
        setSeasons(animeData?.seasons);
        setEpisodes(episodesData?.episodes);
        setTotalEpisodes(episodesData?.totalEpisodes);
        const newEpisodeId =
          initialEpisodeId ||
          (episodesData?.episodes?.length > 0
            ? episodesData.episodes[0].id.match(/ep=(\d+)/)?.[1]
            : null);
        setEpisodeId(newEpisodeId);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError(err.message || "An error occurred.");
      } finally {
        setAnimeInfoLoading(false);
      }
    };
    fetchInitialData();
  }, [animeId]);

  useEffect(() => {
    const fetchNextEpisodeSchedule = async () => {
      try {
        const data = await getNextEpisodeSchedule(animeId);
        setNextEpisodeSchedule(data);
      } catch (err) {
        console.error("Error fetching next episode schedule:", err);
      }
    };
    fetchNextEpisodeSchedule();
  }, [animeId]);

  useEffect(() => {
    if (!episodes || !episodeId) {
      setActiveEpisodeNum(null);
      return;
    }
    const activeEpisode = episodes.find((episode) => {
      const match = episode.id.match(/ep=(\d+)/);
      return match && match[1] === episodeId;
    });
    const newActiveEpisodeNum = activeEpisode ? activeEpisode.episode_no : null;
    if (activeEpisodeNum !== newActiveEpisodeNum) {
      setActiveEpisodeNum(newActiveEpisodeNum);
    }
  }, [episodeId, episodes]);

  useEffect(() => {
    // Reset stream fetch flag when episodeId or episodes change
    // This allows new fetches to start even if old one is in progress
    isStreamFetchInProgress.current = false;
    
    if (!episodeId || !episodes) {
      setActiveEpisodeNum(null);
      return;
    }
    
    // Reset server fetch flag when starting a new episode
    isServerFetchInProgress.current = false;
    
    const fetchServers = async () => {
      isServerFetchInProgress.current = true;
      setServerLoading(true);
      try {
        const data = await getServers(animeId, episodeId);
        console.log(data);
        
        const filteredServers = data?.filter(
          (server) =>
            server.serverName === "HD-1" ||
            server.serverName === "HD-2" ||
            server.serverName === "HD-3"
        );
        if (filteredServers.some((s) => s.type === "sub")) {
          filteredServers.push({
            type: "sub",
            data_id: "69696969",
            server_id: "41",
            serverName: "HD-4",
          });
        }
        if (filteredServers.some((s) => s.type === "dub")) {
          filteredServers.push({
            type: "dub",
            data_id: "96969696",
            server_id: "42",
            serverName: "HD-4",
          });
        }
        // Priority order:
        // 1. Watch Together settings (HIGHEST priority - overrides everything)
        // 2. Continue Watching preferences (if returning to same anime)
        // 3. Settings preferences (from Settings page - for new anime)
        // 4. Last watched server (from previous watch session - for new anime)
        // 5. Default values (HD-2 + sub)
        
        let savedServerName, savedServerType;
        
        console.log('🔍 Watch Together Options:', watchTogetherOptions);
        
        if (watchTogetherOptions?.isWatchTogether) {
          // ✅ Watch Together mode - ALWAYS use room settings, NEVER use continue watching
          // This ensures members get host's preferences, not their own
          savedServerName = watchTogetherOptions.serverName;
          savedServerType = watchTogetherOptions.serverType;
          console.log('🎭 Using Watch Together settings (ignoring continue watching):', {
            serverName: savedServerName,
            serverType: savedServerType,
            fromOptions: watchTogetherOptions
          });
        } else {
          // Normal watch mode - use continue watching and other preferences
          // ✅ Check if user is returning to this anime from continue watching
          const continueWatchingList = JSON.parse(localStorage.getItem('continueWatching') || '[]');
          const animeInContinueWatching = continueWatchingList.find(item => String(item.id) === String(animeId));
          
          const settingsServer = localStorage.getItem("preferredServer");
          const settingsAudioType = localStorage.getItem("audioType");
          const lastWatchedServer = localStorage.getItem("lastWatchedServer");
          const lastWatchedAudioType = localStorage.getItem("lastWatchedAudioType");
          
          if (animeInContinueWatching?.lastServerType && animeInContinueWatching?.lastServerName) {
            // User is returning to this anime - use their last selection for THIS anime
            savedServerName = animeInContinueWatching.lastServerName;
            savedServerType = animeInContinueWatching.lastServerType;
            console.log('🔄 Returning to anime, using saved selection:', {
              anime: animeInContinueWatching.title,
              serverName: savedServerName,
              serverType: savedServerType
            });
          } else if (settingsServer && settingsAudioType) {
            // Settings preferences
            savedServerName = settingsServer;
            savedServerType = settingsAudioType;
            console.log('⚙️ Using Settings preferences:', {
              serverName: savedServerName,
              serverType: savedServerType
            });
          } else if (lastWatchedServer && lastWatchedAudioType) {
            // Last watched (fallback)
            savedServerName = lastWatchedServer;
            savedServerType = lastWatchedAudioType;
            console.log('🕐 Using Last Watched:', {
              serverName: savedServerName,
              serverType: savedServerType
            });
          } else {
            // Default values
            savedServerName = "HD-2";
            savedServerType = "sub";
            console.log('📌 Using defaults:', {
              serverName: savedServerName,
              serverType: savedServerType
            });
          }
        }
        
        // Try to find the target server with preferred audio type
        let targetServer = filteredServers.find(
          (s) => 
            s.type.toLowerCase() === savedServerType.toLowerCase() && 
            s.serverName.toLowerCase() === savedServerName.toLowerCase()
        );
        
        // CRITICAL: If dub not found, fallback to sub with same server name
        if (!targetServer && savedServerType.toLowerCase() === 'dub') {
          console.log('⚠️ Dub server not found, attempting fallback to sub with same server name');
          targetServer = filteredServers.find(
            (s) => 
              s.type.toLowerCase() === 'sub' && 
              s.serverName.toLowerCase() === savedServerName.toLowerCase()
          );
          if (targetServer) {
            console.log('✅ Fallback successful: Using sub version of', savedServerName);
          }
        }
        
        // If still no server found, use first available
        const targetServerId = targetServer
          ? targetServer.data_id
          : filteredServers[0]?.data_id;
          
        setServers(filteredServers);
        setActiveServerId(targetServerId);
        setActiveServerType(
          targetServer ? targetServer.type : filteredServers[0]?.type
        );
        setActiveServerName(
          targetServer ? targetServer.serverName : filteredServers[0]?.serverName
        );
      } catch (err) {
        console.error("Error fetching servers:", err);
        setError(err.message || "An error occurred.");
      } finally {
        setServerLoading(false);
        isServerFetchInProgress.current = false;
      }
    };
    fetchServers();
  }, [episodeId, episodes]);

  useEffect(() => {
    // Reset flag when activeServerId or servers change
    // This allows new stream fetches to start immediately
    isStreamFetchInProgress.current = false;
    
    if (!activeServerId || !servers) return;

    const fetchStreamInfo = async () => {
      isStreamFetchInProgress.current = true;
      setBuffering(true);
      try {
        const server = servers.find((s) => s.data_id === activeServerId);
        console.log("Fetching stream info for server:", server);
        if (server) {
          const data = await getStreamInfo(
            animeId,
            episodeId,
            server.serverName.toLowerCase()==="hd-3"?"hd-1":server.serverName.toLowerCase(),
            server.type.toLowerCase()
          );
          console.log("Stream info received:", data);
          console.log("🎥 Full streaming link data:", data?.streamingLink);
          
          // Try multiple possible paths for the video URL
          const videoUrl = 
            data?.streamingLink?.link?.file || // New structure
            data?.streamingLink?.sources?.[0]?.file || // Old structure
            null;
          
          console.log("🎥 Extracted video URL:", videoUrl ? videoUrl.substring(0, 100) + "..." : "null");
          
          setStreamInfo(data);
          setStreamUrl(videoUrl);
          
          if (!videoUrl) {
            console.error("❌ No video URL found in stream data!");
            console.error("Stream data structure:", JSON.stringify(data, null, 2));
          } else {
            console.log("✅ Video URL set successfully!");
          }
          if (data?.streamingLink?.intro) setIntro(data.streamingLink.intro);
          else setIntro({ start: 0, end: 0 });
          if (data?.streamingLink?.outro) setOutro(data.streamingLink.outro);
          else setOutro({ start: 0, end: 0 });
          
          // Process current subtitles (from current server)
          const currentSubtitles =
            data?.streamingLink?.tracks
              ?.filter((track) => {
                if (track.kind === "captions" || track.kind === "subtitles") return true;
                if (track.file && (track.file.endsWith('.vtt') || track.file.endsWith('.srt'))) return true;
                if (track.kind === "thumbnails") return false;
                return track.file && track.label;
              })
              .map(({ file, label, kind }) => ({ 
                file, 
                label: label || 'Unknown', 
                kind: kind || 'captions' 
              })) || [];
          
          console.log('🎯 Original subtitles from', server.type.toUpperCase(), ':', currentSubtitles.length);
          console.log('📋 Original subtitle labels:', currentSubtitles.map(s => s.label).join(', '));
          console.log('📋 Original subtitle files:', currentSubtitles.map(s => s.file.split('/').pop()).join(', '));
          
          let processedSubtitles = [];
          
          // ✅ FOR DUB ONLY: Keep all subtitles but rename duplicates clearly
          if (server.type.toLowerCase() === 'dub') {
            console.log('🎤 DUB detected - Renaming duplicate subtitles for clarity...');
            
            const languageCounts = new Map();
            
            for (const sub of currentSubtitles) {
              // Clean the base language name
              const baseLanguage = sub.label
                .toLowerCase()
                .replace(/\s*\(cc\)\s*/gi, '')
                .replace(/\s*cc\s*/gi, '')
                .replace(/\s*\d+\s*$/g, '') // Remove existing numbers
                .replace(/\s*\([^)]*\)\s*/g, '') // Remove parentheses
                .trim();
              
              // Count occurrences
              const count = languageCounts.get(baseLanguage) || 0;
              languageCounts.set(baseLanguage, count + 1);
              
              // Create clean label with number
              const capitalizedLanguage = baseLanguage.charAt(0).toUpperCase() + baseLanguage.slice(1);
              const finalLabel = count === 0 
                ? capitalizedLanguage 
                : `${capitalizedLanguage} ${count + 1}`;
              
              processedSubtitles.push({
                ...sub,
                label: finalLabel
              });
              
              console.log(`  ✅ ${sub.label} → ${finalLabel}`);
            }
            
            console.log('✅ DUB subtitle renaming complete:', processedSubtitles.length, 'total subtitles');
            console.log('📝 Renamed DUB labels:', processedSubtitles.map(s => s.label).join(', '));
            
          } else {
            // ✅ FOR SUB/RAW: Don't touch, keep original
            console.log('📝 SUB/RAW mode - Keeping original subtitles unchanged');
            processedSubtitles = currentSubtitles;
          }
          
          let allSubtitles = processedSubtitles;
          const serverTypeNormalized = server.type.toLowerCase();
          
          // ✅ FIXED: Only use subtitles that exist for the current audio track
          // No merging with SUB subtitles for DUB anymore
          if (serverTypeNormalized === 'sub') {
            // SUB mode - can optionally merge with DUB subtitles if needed
            console.log('🎵 SUB mode detected');
            console.log('🔍 Current SUB subtitles:', processedSubtitles.length);
            
            // Try to fetch DUB subtitles to merge
            try {
              console.log('📝 Attempting to fetch DUB subtitles to merge with SUB...');
              const dubData = await getStreamInfo(
                animeId,
                episodeId,
                server.serverName.toLowerCase()==="hd-3"?"hd-1":server.serverName.toLowerCase(),
                "dub" // Fetch DUB version ONLY for subtitles
              );
              
              console.log('🔍 Raw DUB data received for merging');
              
              const dubSubtitles =
                dubData?.streamingLink?.tracks
                  ?.filter((track) => {
                    if (track.kind === "captions" || track.kind === "subtitles") return true;
                    if (track.file && (track.file.endsWith('.vtt') || track.file.endsWith('.srt'))) return true;
                    if (track.kind === "thumbnails") return false;
                    return track.file && track.label;
                  })
                  .map(({ file, label, kind }) => ({ 
                    file, 
                    label: label || 'Unknown', 
                    kind: kind || 'captions' 
                  })) || [];
              
              console.log('✅ Found', dubSubtitles.length, 'DUB subtitles to merge');
              
              // Merge with SUB subtitles, avoiding exact duplicates (same file)
              const mergedSubtitles = [...processedSubtitles];
              const existingFiles = new Set(processedSubtitles.map(s => s.file));
              const existingLanguages = new Set(processedSubtitles.map(s => 
                s.label.toLowerCase().replace(/\s*\(cc\)\s*/gi, '').trim()
              ));
              
              for (const dubSub of dubSubtitles) {
                const dubLanguage = dubSub.label
                  .toLowerCase()
                  .replace(/\s*\(cc\)\s*/gi, '')
                  .replace(/\s*cc\s*/gi, '')
                  .replace(/\s*\d+\s*$/g, '')
                  .trim();
                
                // Only add if file is different AND language doesn't exist yet
                if (!existingFiles.has(dubSub.file) && !existingLanguages.has(dubLanguage)) {
                  mergedSubtitles.push({
                    ...dubSub,
                    label: dubLanguage.charAt(0).toUpperCase() + dubLanguage.slice(1)
                  });
                  existingFiles.add(dubSub.file);
                  existingLanguages.add(dubLanguage);
                  console.log('✅ Adding DUB subtitle:', dubLanguage);
                } else {
                  console.log('🔄 Skipping duplicate DUB subtitle:', dubSub.label);
                }
              }
              
              allSubtitles = mergedSubtitles;
              console.log('🎯 Total merged subtitles:', allSubtitles.length);
              console.log('✅ SUB stream data preserved, only subtitles were merged');
            } catch (error) {
              console.warn('⚠️ Could not fetch DUB subtitles:', error);
              // Use only current subtitles if DUB fetch fails
              allSubtitles = processedSubtitles;
            }
          } else {
            // ✅ ANY non-SUB audio (DUB, RAW, etc.)
            // FIXED: Only use subtitles from the current audio track, no merging with SUB
            console.log(`🎤 ${serverTypeNormalized.toUpperCase()} mode detected`);
            console.log(`✅ Using only ${serverTypeNormalized.toUpperCase()} subtitles (no SUB subtitle merging)`);
            console.log('🔍 Current', serverTypeNormalized.toUpperCase(), 'subtitles:', processedSubtitles.length);
            console.log('📋', serverTypeNormalized.toUpperCase(), 'subtitle labels:', processedSubtitles.map(s => s.label).join(', '));
            
            // Simply use the current subtitles without fetching from SUB
            allSubtitles = processedSubtitles;
            
            if (allSubtitles.length === 0) {
              console.log('⚠️', serverTypeNormalized.toUpperCase(), 'has no subtitles available');
            } else {
              console.log('✅', serverTypeNormalized.toUpperCase(), 'has', allSubtitles.length, 'subtitle(s)');
            }
          }
          
          console.log('🎬 Subtitles loaded:', {
            total: allSubtitles.length,
            serverName: server.serverName,
            serverType: server.type,
            allTracks: data?.streamingLink?.tracks,
            filteredSubtitles: allSubtitles
          });
          
          // ✅ ADD CUSTOM SUBTITLES (if configured)
          // Uncomment this block after creating customSubtitles.js
          /*
          try {
            if (customSubtitles && customSubtitles[animeId]?.[episodeId]) {
              const customSubs = customSubtitles[animeId][episodeId];
              console.log(`🎨 Adding ${customSubs.length} custom subtitle(s) for ${animeId} EP${episodeId}`);
              
              // Add custom subtitles to the list
              allSubtitles = [...allSubtitles, ...customSubs];
              
              console.log('✅ Custom subtitles added!');
              console.log('📝 Custom subtitle labels:', customSubs.map(s => s.label).join(', '));
            }
          } catch (error) {
            console.warn('⚠️ Error loading custom subtitles:', error);
          }
          */
          
          console.log('📤 SETTING SUBTITLES TO STATE:', allSubtitles.length, 'subtitles');
          console.log('📝 Final subtitle list:', allSubtitles.map(s => s.label).join(', '));
          setSubtitles(allSubtitles);
          console.log('✅ setSubtitles() called with', allSubtitles.length, 'subtitles');
          const thumbnailTrack = data?.streamingLink?.tracks?.find(
            (track) => track.kind === "thumbnails" && track.file
          );
          if (thumbnailTrack) setThumbnail(thumbnailTrack.file);
        } else {
          setError("No server found with the activeServerId.");
        }
      } catch (err) {
        console.error("Error fetching stream info:", err);
        setError(err.message || "An error occurred.");
      } finally {
        setBuffering(false);
        isStreamFetchInProgress.current = false;
      }
    };
    fetchStreamInfo();
  }, [episodeId, activeServerId, servers]);

  return {
    error,
    buffering,
    serverLoading,
    streamInfo,
    animeInfo,
    episodes,
    nextEpisodeSchedule,
    animeInfoLoading,
    totalEpisodes,
    seasons,
    servers,
    streamUrl,
    isFullOverview,
    setIsFullOverview,
    subtitles,
    thumbnail,
    intro,
    outro,
    episodeId,
    setEpisodeId,
    activeEpisodeNum,
    setActiveEpisodeNum,
    activeServerId,
    setActiveServerId,
    activeServerType,
    setActiveServerType,
    activeServerName,
    setActiveServerName,
  };
};
