/* eslint-disable react/prop-types */
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import Artplayer from "artplayer";
import artplayerPluginChapter from "./artPlayerPluinChaper";
import autoSkip from "./autoSkip";
import artplayerPluginVttThumbnail from "./artPlayerPluginVttThumbnail";
import {
  backward10Icon,
  backwardIcon,
  captionIcon,
  forward10Icon,
  forwardIcon,
  fullScreenOffIcon,
  fullScreenOnIcon,
  loadingIcon,
  logo,
  muteIcon,
  pauseIcon,
  pipIcon,
  playIcon,
  playIconLg,
  settingsIcon,
  volumeIcon,
} from "./PlayerIcons";
import "./Player.css";
import website_name from "@/src/config/website";
import getChapterStyles from "./getChapterStyle";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import artplayerPluginUploadSubtitle from "./artplayerPluginUploadSubtitle";

Artplayer.LOG_VERSION = false;
Artplayer.CONTEXTMENU = false;

const KEY_CODES = {
  M: "m",
  I: "i",
  F: "f",
  V: "v",
  SPACE: " ",
  ARROW_UP: "arrowup",
  ARROW_DOWN: "arrowdown",
  ARROW_RIGHT: "arrowright",
  ARROW_LEFT: "arrowleft",
};

export default function Player({
  streamUrl,
  subtitles,
  thumbnail,
  intro,
  outro,
  autoSkipIntro,
  autoPlay,
  autoNext,
  episodeId,
  episodes,
  playNext,
  animeInfo,
  episodeNum,
  streamInfo,
  playerRef,
  onPlay,
  onPause,
  onSeeked,
  isWatchTogetherMember = false,
  isWatchTogether = false, // ✅ NEW: Explicitly indicates Watch Together mode
  serverType = 'sub', // ✅ NEW: Audio type (sub/dub)
}) {
  const artRef = useRef(null);
  const leftAtRef = useRef(0); 
  const proxy = import.meta.env.VITE_PROXY_URL;
  const m3u8proxy = import.meta.env.VITE_M3U8_PROXY_URL?.split(",") || [];
  
  // Add refs to track the latest values for closures
  const autoNextRef = useRef(autoNext);
  const autoSkipIntroRef = useRef(autoSkipIntro);
  const currentEpisodeIndexRef = useRef(null);
  const episodesRef = useRef(episodes);
  const playNextRef = useRef(playNext);
  const artInstanceRef = useRef(null); // Track the art instance internally
  
  // Update refs when props change
  useEffect(() => {
    autoNextRef.current = autoNext;
  }, [autoNext]);
  
  useEffect(() => {
    autoSkipIntroRef.current = autoSkipIntro;
  }, [autoSkipIntro]);
  
  useEffect(() => {
    episodesRef.current = episodes;
  }, [episodes]);
  
  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);
  
  console.log('🎬 Player mode:', { 
    isWatchTogether, 
    isWatchTogetherMember,
    serverType: serverType,
    audioType: serverType?.toLowerCase() === 'dub' ? 'DUB (English Audio)' : 'SUB (Japanese Audio)',
    mode: isWatchTogether ? (isWatchTogetherMember ? 'WT-Member' : 'WT-Host') : 'Normal'
  });
  
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(
    episodes?.findIndex(
      (episode) => episode.id.match(/ep=(\d+)/)?.[1] === episodeId
    )
  );

  useEffect(() => {
    if (episodes?.length > 0) {
      const newIndex = episodes.findIndex(
        (episode) => episode.id.match(/ep=(\d+)/)?.[1] === episodeId
      );
      setCurrentEpisodeIndex(newIndex);
      currentEpisodeIndexRef.current = newIndex; // Update ref
    }
  }, [episodeId, episodes]);
  
  useEffect(() => {
    const applyChapterStyles = () => {
      const existingStyles = document.querySelectorAll(
        "style[data-chapter-styles]"
      );
      existingStyles.forEach((style) => style.remove());
      const styleElement = document.createElement("style");
      styleElement.setAttribute("data-chapter-styles", "true");
      const styles = getChapterStyles(intro, outro);
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
      return () => {
        styleElement.remove();
      };
    };

    if (streamUrl || intro || outro) {
      const cleanup = applyChapterStyles();
      return cleanup;
    }
  }, [streamUrl, intro, outro]);

  const playM3u8 = (video, url, art) => {
    if (Hls.isSupported()) {
      if (art.hls) art.hls.destroy();
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      art.hls = hls;

      art.on("destroy", () => hls.destroy());

      video.addEventListener("timeupdate", () => {
        const currentTime = Math.round(video.currentTime);
        const duration = Math.round(video.duration);
        if (duration > 0 && currentTime >= duration) {
            art.pause();
            // Use refs to get current values
            const currentIndex = currentEpisodeIndexRef.current;
            const eps = episodesRef.current;
            if (currentIndex < eps?.length - 1 && autoNextRef.current) {
              playNextRef.current(
                eps[currentIndex + 1].id.match(/ep=(\d+)/)?.[1]
              );
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.addEventListener("timeupdate", () => {
        const currentTime = Math.round(video.currentTime);
        const duration = Math.round(video.duration);
        if (duration > 0 && currentTime >= duration) {
            art.pause();
            // Use refs to get current values
            const currentIndex = currentEpisodeIndexRef.current;
            const eps = episodesRef.current;
            if (currentIndex < eps?.length - 1 && autoNextRef.current) {
              playNextRef.current(
                eps[currentIndex + 1].id.match(/ep=(\d+)/)?.[1]
              );
          }
        }
      });
    } else {
      console.log("Unsupported playback format: m3u8");
    }
  };

  const createChapters = () => {
    const chapters = [];
    if (intro?.start !== 0 || intro?.end !== 0) {
      chapters.push({ start: intro.start, end: intro.end, title: "intro" });
    }
    if (outro?.start !== 0 || outro?.end !== 0) {
      chapters.push({ start: outro.start, end: outro.end, title: "outro" });
    }
    return chapters;
  };

  const handleKeydown = (event, art) => {
    const tagName = event.target.tagName.toLowerCase();

    if (tagName === "input" || tagName === "textarea") return;

    switch (event.key.toLowerCase()) {
      case KEY_CODES.M:
        art.muted = !art.muted;
        break;
      case KEY_CODES.I:
        art.pip = !art.pip;
        break;
      case KEY_CODES.F:
        event.preventDefault();
        event.stopPropagation();
        art.fullscreen = !art.fullscreen;
        break;
      case KEY_CODES.V:
        event.preventDefault();
        event.stopPropagation();
        art.subtitle.show = !art.subtitle.show;
        break;
      case KEY_CODES.SPACE:
        event.preventDefault();
        event.stopPropagation();
        art.playing ? art.pause() : art.play();
        break;
      case KEY_CODES.ARROW_UP:
        event.preventDefault();
        event.stopPropagation();
        art.volume = Math.min(art.volume + 0.1, 1);
        break;
      case KEY_CODES.ARROW_DOWN:
        event.preventDefault();
        event.stopPropagation();
        art.volume = Math.max(art.volume - 0.1, 0);
        break;
      case KEY_CODES.ARROW_RIGHT:
        event.preventDefault();
        event.stopPropagation();
        art.currentTime = Math.min(art.currentTime + 10, art.duration);
        break;
      case KEY_CODES.ARROW_LEFT:
        event.preventDefault();
        event.stopPropagation();
        art.currentTime = Math.max(art.currentTime - 10, 0);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!streamUrl || !artRef.current) return;
    
    // ✅ Add Watch Together class to container for CSS targeting
    if (isWatchTogether && artRef.current) {
      artRef.current.classList.add('watch-together-player');
      if (isWatchTogetherMember) {
        artRef.current.classList.add('watch-together-member');
      } else {
        artRef.current.classList.add('watch-together-host');
      }
    }
    
    const iframeUrl = streamInfo?.streamingLink?.iframe;
    const headers = {};
    headers.referer=new URL(iframeUrl).origin+"/";

    console.log('🎬 Player initializing...', {
      isWatchTogetherMember,
      hasSubtitles: subtitles && subtitles.length > 0,
      subtitleCount: subtitles?.length || 0,
      subtitleDetails: subtitles,
      streamInfo: streamInfo,
      rawTracks: streamInfo?.streamingLink?.tracks
    });

    const art = new Artplayer({
      url:
        m3u8proxy[Math.floor(Math.random() * m3u8proxy?.length)] +
        encodeURIComponent(streamUrl) +
         "&headers=" +
         encodeURIComponent(JSON.stringify(headers)),
      container: artRef.current,
      type: "m3u8",
      autoplay: autoPlay,
      volume: 1,
      setting: true, // ✅ Always enable for all users including members
      playbackRate: true, // ✅ Enable for members
      pip: true, // ✅ Enable for members
      hotkey: !isWatchTogetherMember, // Keep disabled for sync
      fullscreen: true,
      mutex: true,
      playsInline: true,
      lock: true,
      airplay: true, // ✅ Enable for members
      autoOrientation: true,
      fastForward: true, // ✅ Enable for members
      aspectRatio: true, // ✅ Enable for members
      moreVideoAttr: {
        crossOrigin: 'anonymous',
        preload: 'none',
        playsInline: true,
      },
      plugins: [
        artplayerPluginHlsControl({
          quality: {
            setting: true, // ✅ Enable Quality for members
            getName: (level) => level.height + "P",
            title: "Quality",
            auto: "Auto",
          },
        }),
        artplayerPluginUploadSubtitle(),
        artplayerPluginChapter({ chapters: createChapters() }),
      ],
      subtitle: {
        url: subtitles && subtitles.length > 0 ? subtitles[0].file : '', // ✅ Set default subtitle URL
        type: 'vtt', // Specify subtitle type
        style: {
          color: "#fff",
          "font-weight": "400",
          left: "50%",
          transform: "translateX(-50%)",
          "margin-bottom": "2rem",
        },
        escape: false,
      },
      layers: [
        {
          name: website_name,
          html: logo,
          tooltip: website_name,
          style: {
            opacity: 1,
            position: "absolute",
            top: "8px",
            right: "10px",
            transition: "opacity 0.5s ease-out",
          },
          mounted: (el) => {
            if (Artplayer.utils.isMobile) {
              const logoEl = el;
              logoEl.style.fontSize = '9px'; // Increase from 8px to 9px
              logoEl.style.top = '8px'; // Move down slightly from 5px
              logoEl.style.right = '8px';
              logoEl.style.left = 'auto';
              logoEl.style.bottom = 'auto';
              const img = logoEl.querySelector('img');
              if (img) img.style.height = '16px'; // Increase height from 13px to 16px
              const p = logoEl.querySelector('p');
              if (p) {
                p.style.padding = '5px 7px'; // Increase padding for more height
                p.style.gap = '5px'; // Increase from 4px
              }
            }
          }
        },
        {
          html: "",
          style: {
            position: "absolute",
            left: "50%",
            top: 0,
            width: "20%",
            height: "100%",
            transform: "translateX(-50%)",
          },
          disable: !Artplayer.utils.isMobile, // ✅ Enable for members
          click: () => art.toggle(), // Allow members to toggle play/pause by clicking
        },
        {
          name: "rewind",
          html: "",
          style: { position: "absolute", left: 0, top: 0, width: "40%", height: "100%" },
          disable: !Artplayer.utils.isMobile, // ✅ Enable for members
          click: () => {
            art.controls.show = !art.controls.show; // Allow members to show controls
          },
        },
        {
          name: "forward",
          html: "",
          style: { position: "absolute", right: 0, top: 0, width: "40%", height: "100%" },
          disable: !Artplayer.utils.isMobile, // ✅ Enable for members
          click: () => {
            art.controls.show = !art.controls.show; // Allow members to show controls
          },
        },
        {
          name: "backwardIcon",
          html: backwardIcon,
          style: {
            position: "absolute",
            left: "25%",
            top: "50%",
            transform: "translate(50%,-50%)",
            opacity: 0,
            transition: "opacity 0.5s ease-in-out",
          },
          disable: !Artplayer.utils.isMobile,
        },
        {
          name: "forwardIcon",
          html: forwardIcon,
          style: {
            position: "absolute",
            right: "25%",
            top: "50%",
            transform: "translate(50%, -50%)",
            opacity: 0,
            transition: "opacity 0.5s ease-in-out",
          },
          disable: !Artplayer.utils.isMobile,
        },
      ],
      controls: [
        {
          html: backward10Icon,
          position: "right",
          tooltip: "Backward 10s",
          click: () => {
            art.currentTime = Math.max(art.currentTime - 10, 0);
          },
        },
        {
          html: forward10Icon,
          position: "right",
          tooltip: "Forward 10s",
          click: () => {
            art.currentTime = Math.min(art.currentTime + 10, art.duration);
          },
        },
      ],
      icons: {
        play: playIcon,
        pause: pauseIcon,
        setting: settingsIcon,
        volume: volumeIcon,
        pip: pipIcon,
        volumeClose: muteIcon,
        state: playIconLg,
        loading: loadingIcon,
        fullscreenOn: fullScreenOnIcon,
        fullscreenOff: fullScreenOffIcon,
      },
      customType: { m3u8: playM3u8 },
    });
    
    // ✅ Log initial player subtitle state with audio type info
    const isDub = serverType?.toLowerCase() === 'dub';
    console.log('🎬 Player created with subtitle config:', {
      'Audio Type': isDub ? '🎤 DUB (English Audio - Subtitles MUST show!)' : '🎵 SUB (Japanese Audio)',
      'subtitle.url': art.subtitle.url,
      'subtitle.show': art.subtitle.show,
      'hasSubtitles': subtitles && subtitles.length > 0,
      'firstSubtitle': subtitles && subtitles.length > 0 ? subtitles[0] : null,
      'CRITICAL': isDub ? 'DUB needs visible subtitles for accessibility!' : 'SUB needs visible subtitles for translation!'
    });
    
    // ============================================
    // ✅ FORCE ADD SUBTITLE MENU IMMEDIATELY - SAME TIME AS QUALITY
    // ============================================
    console.log('🎬 Player created, forcing subtitle menu to load NOW...');
    console.log('📝 Subtitle data:', { 
      hasSubtitles: subtitles && subtitles.length > 0, 
      count: subtitles?.length,
      subtitles: subtitles
    });

    // Build subtitle selector array
    const subtitleSelector = [];
    let defaultSubtitleName = "No subtitles";
    
    // Check if this is a movie DUB (reuse isDub from above)
    const showType = animeInfo?.animeInfo?.tvInfo?.showType || animeInfo?.tvInfo?.showType || '';
    const isMovie = showType.toLowerCase().includes('movie');
    const isMovieDub = isMovie && isDub;
    
    console.log('🎬 Content type check:', {
      showType,
      isMovie,
      isDub,
      isMovieDub,
      hasSubtitles: subtitles && subtitles.length > 0,
      serverType
    });

    // Add Display toggle with INTUITIVE logic
    // Toggle ON = Show subtitles, Toggle OFF = Hide subtitles
    subtitleSelector.push({
      html: "Display",
      switch: true, // TRUE = ON = showing by default
      onSwitch: function(item) {
        const newState = !item.switch;
        item.switch = newState;
        // TRUE switch (ON) = SHOW subtitles ✅
        // FALSE switch (OFF) = HIDE subtitles ✅
        art.subtitle.show = newState;
        item.tooltip = newState ? "Show" : "Hide";
        console.log('🔄 Subtitle display toggled:', { 
          switch: newState, 
          subtitleShow: art.subtitle.show,
          explanation: newState ? "Toggle ON = Showing subtitles ✅" : "Toggle OFF = Hiding subtitles ✅"
        });
        return newState;
      },
    });

    // Add subtitle tracks or placeholder
    if (subtitles && subtitles.length > 0) {
      console.log('✅ Adding', subtitles.length, 'subtitles to menu');
      
      // ✅ Check for saved subtitle preference for this anime
      const animeId = animeInfo?.id || animeInfo?.data_id;
      const savedSubtitleKey = `subtitle_pref_${animeId}`;
      const savedSubtitleLabel = localStorage.getItem(savedSubtitleKey);
      
      console.log('🔍 Checking saved subtitle for anime:', animeId, '→', savedSubtitleLabel);
      
      // Find subtitle: 1) Saved preference, 2) Smart English selection for dub
      let defaultSubIndex = 0;
      
      // First try to find saved subtitle
      if (savedSubtitleLabel) {
        for (let i = 0; i < subtitles.length; i++) {
          if (subtitles[i].label === savedSubtitleLabel) {
            defaultSubIndex = i;
            console.log('✅ Found saved subtitle:', savedSubtitleLabel);
            break;
          }
        }
      }
      
      // If no saved subtitle or saved subtitle not found, use smart English selection
      // First, collect all English subtitle indices for use throughout
      const englishSubtitles = [];
      for (let i = 0; i < subtitles.length; i++) {
        const label = subtitles[i].label.toLowerCase();
        if (label === "english" || label.includes("english")) {
          englishSubtitles.push({ index: i, label: subtitles[i].label });
        }
      }
      
      console.log('🔍 Found English subtitles:', englishSubtitles);
      
      if (!savedSubtitleLabel || subtitles[defaultSubIndex].label !== savedSubtitleLabel) {
        // For DUB: If there are two English subtitles, prefer "English 2"
        // For SUB: Use first English subtitle found
        
        if (englishSubtitles.length > 0) {
          if (isDub && englishSubtitles.length >= 2) {
            // DUB with multiple English subtitles: prioritize "English 2"
            const english2 = englishSubtitles.find(sub => 
              sub.label.toLowerCase() === "english 2" || 
              sub.label.toLowerCase() === "english2"
            );
            
            if (english2) {
              defaultSubIndex = english2.index;
              console.log('✅ DUB: Selected "English 2" subtitle');
            } else {
              // If no "English 2", use the last English subtitle
              defaultSubIndex = englishSubtitles[englishSubtitles.length - 1].index;
              console.log('✅ DUB: Selected last English subtitle:', subtitles[defaultSubIndex].label);
            }
          } else {
            // SUB or only one English subtitle: use first English
            defaultSubIndex = englishSubtitles[0].index;
            console.log('✅ Selected first English subtitle:', subtitles[defaultSubIndex].label);
          }
        }
        
        console.log('📝 Using default English subtitle');
      }
      
      // Set default subtitle name for tooltip
      // If the selected subtitle is "English 2" and there are multiple English subs, show as "English"
      defaultSubtitleName = subtitles[defaultSubIndex].label;
      const selectedLabel = defaultSubtitleName.toLowerCase();
      if ((selectedLabel === "english 2" || selectedLabel === "english2") && englishSubtitles.length >= 2) {
        defaultSubtitleName = "English";
        console.log('🎯 Renaming tooltip from "English 2" to "English"');
      }
      console.log('🎯 Final subtitle selection:', defaultSubtitleName);
      
      // ✅ Build subtitle list with smart English merging
      // If there are "English" and "English 2", show only "English" but use English 2's file
      const processedSubtitles = new Map(); // Use Map to track unique labels
      
      // Add each subtitle with smart handling
      for (let i = 0; i < subtitles.length; i++) {
        const label = subtitles[i].label.toLowerCase();
        
        // Skip "English" if we have "English 2" (we'll add English 2 as "English" later)
        if ((label === "english") && englishSubtitles.length >= 2) {
          console.log('⏭️ Skipping "English" because "English 2" exists');
          continue;
        }
        
        // If this is "English 2" and there are multiple English subs, rename to "English"
        if ((label === "english 2" || label === "english2") && englishSubtitles.length >= 2) {
          console.log('✅ Renaming "English 2" to "English" in menu');
          subtitleSelector.push({
            html: "English", // Show as "English" in menu
            url: subtitles[i].file, // But use English 2's file
            default: i === defaultSubIndex,
          });
        } else {
          // Add all other subtitles normally
          subtitleSelector.push({
            html: subtitles[i].label,
            url: subtitles[i].file,
            default: i === defaultSubIndex,
          });
        }
      }
      
      // Load selected subtitle immediately
      if (subtitles[defaultSubIndex]) {
        const isDub = serverType?.toLowerCase() === 'dub';
        console.log('📥 Loading subtitle:', subtitles[defaultSubIndex].label);
        console.log('📝 Subtitle details:', {
          audioType: isDub ? '🎤 DUB' : '🎵 SUB',
          label: subtitles[defaultSubIndex].label,
          file: subtitles[defaultSubIndex].file,
          hasFile: !!subtitles[defaultSubIndex].file,
          reason: isDub ? 'DUB audio needs subtitles for accessibility (deaf/hard of hearing)' : 'SUB audio needs subtitles for translation'
        });
        
        // ✅ Store the default subtitle to load after video is ready
        const defaultSubtitle = subtitles[defaultSubIndex];
        
        // Use video:canplay event to ensure video is ready before loading subtitle
        const loadSubtitleWhenReady = () => {
          console.log('⏰ Video ready, loading subtitle...');
          art.subtitle.switch(defaultSubtitle.file, {
            name: defaultSubtitle.label,
          });
          // ✅ FORCE show subtitles - CRITICAL for both SUB and DUB
          art.subtitle.show = true;
          
          console.log('✅ Subtitle loaded and FORCED to show:', {
            audioType: isDub ? '🎤 DUB Audio' : '🎵 SUB Audio',
            file: defaultSubtitle.file,
            label: defaultSubtitle.label,
            visible: art.subtitle.show,
            subtitleUrl: art.subtitle.url,
            subtitleUrlMatches: art.subtitle.url === defaultSubtitle.file,
            message: isDub ? '✅ DUB subtitles enabled!' : '✅ SUB subtitles enabled!'
          });
        };
        
        // Listen for video ready event
        art.on('video:canplay', loadSubtitleWhenReady);
        
        // Also try immediately with timeout as fallback
        setTimeout(() => {
          if (!art.subtitle.url) {
            console.log('⏰ Fallback subtitle load triggered...');
            loadSubtitleWhenReady();
          }
        }, 200);
      }
    } else {
      console.log('⚠️ No subtitles available');
      // For movie DUB, show "None" instead of the upload message
      if (isMovieDub) {
        subtitleSelector.push({
          html: "None",
        });
      } else {
        // For anime series or movie SUB, show the upload button option
        subtitleSelector.push({
          html: "No subtitles - Use Upload button",
        });
      }
    }

    // FORCE ADD SUBTITLE MENU NOW - NO CONDITIONS, NO WAITING
    // For movie DUB without subtitles, hide the subtitle menu
    const shouldAddSubtitleMenu = !isMovieDub || (isMovieDub && subtitles && subtitles.length > 0);
    
    console.log('🔧 Subtitle menu decision:', {
      isMovie,
      isDub,
      isMovieDub,
      hasSubtitles: subtitles && subtitles.length > 0,
      shouldAddSubtitleMenu,
      reason: isMovieDub && (!subtitles || subtitles.length === 0) 
        ? 'Movie DUB without subtitles - hiding menu' 
        : 'Adding subtitle menu'
    });
    
    if (shouldAddSubtitleMenu) {
      console.log('🔧 FORCING subtitle menu into settings...');
      
      try {
        art.setting.add({
          name: "captions",
          icon: captionIcon,
          html: "Subtitle",
          tooltip: defaultSubtitleName, // ✅ FIXED: Show actual subtitle name
          position: "right",
          selector: subtitleSelector,
        onSelect: function(item) {
          console.log('👆 User selected:', item.html);
          if (item.url) {
            art.subtitle.switch(item.url, { name: item.html });
            art.subtitle.show = true; // Show when user selects
            
            // ✅ Save subtitle preference for this anime
            const animeId = animeInfo?.id || animeInfo?.data_id;
            if (animeId) {
              const savedSubtitleKey = `subtitle_pref_${animeId}`;
              localStorage.setItem(savedSubtitleKey, item.html);
              console.log('💾 Saved subtitle preference:', item.html, 'for anime:', animeId);
            }
            
            console.log('✅ Switched to:', item.html);
            return item.html;
          }
        },
      });
      console.log('✅✅✅ SUBTITLE MENU ADDED SUCCESSFULLY! ✅✅✅');
    } catch (error) {
      console.error('❌ ERROR adding subtitle menu:', error);
    }
    } else {
      console.log('🚫 Skipping subtitle menu for movie DUB without subtitles');
    }
    
    // ✅ Mobile PIP button visibility control
    // Normal watch: Hide PIP on mobile
    // Watch Together: Show PIP on mobile for both host and members
    if (typeof window !== 'undefined' && window.innerWidth <= 640) {
      const pipButton = art.template.$pip;
      if (pipButton) {
        if (isWatchTogether) {
          // Watch Together mode: Show PIP on mobile
          // Use setProperty with priority to override CSS !important
          pipButton.style.setProperty('display', 'flex', 'important');
          console.log('📱 Watch Together: PIP button visible on mobile');
        } else {
          // Normal mode: Hide PIP on mobile
          pipButton.style.setProperty('display', 'none', 'important');
          console.log('📱 Normal mode: PIP button hidden on mobile');
        }
      }
    }

    art.on("resize", () => {
      art.subtitle.style({
        fontSize:
          (art.width > 500 ? art.width * 0.02 : art.width * 0.03) + "px",
      });
    });
    
    art.on("ready", () => {
      console.log('🎬 Player ready event fired!', { isWatchTogetherMember });
      
      if (playerRef) {
        playerRef.current = art;
      }
      artInstanceRef.current = art; // Also store in internal ref
      
      // ✅ Set up Media Session API for mobile notifications
      if ('mediaSession' in navigator && animeInfo) {
        try {
          console.log('🎬 Setting up Media Session with:', {
            animeInfo,
            episodeNum,
            episodeId,
            isWatchTogether
          });
          
          // Build the display text
          const appName = isWatchTogether ? 'Watch2gether' : 'Watch Anime';
          
          // Extract season from title or from animeInfo
          let seasonInfo = '';
          const seasonMatch = animeInfo.title?.match(/Season (\d+)/i);
          if (seasonMatch) {
            seasonInfo = `Season ${seasonMatch[1]}`;
          }
          
          // Build episode info - ENSURE we get the episode number
          let episodeInfo = '';
          if (episodeNum) {
            episodeInfo = `Episode ${episodeNum}`;
          } else if (episodeId) {
            episodeInfo = `Episode ${episodeId}`;
          }
          console.log('📝 Episode info:', { episodeNum, episodeId, episodeInfo });
          
          // Clean anime title (remove season from title if present)
          let cleanAnimeTitle = animeInfo.title?.replace(/Season \d+/i, '').trim() || animeInfo.title || '';
          
          // Smart detection: Use device characteristics to determine format
          // Check if device likely supports full album display
          const userAgent = navigator.userAgent.toLowerCase();
          const isAndroid = /android/.test(userAgent);
          const isOldAndroid = /android [1-7]\./.test(userAgent); // Android 7 and below
          const isSmallScreen = window.innerWidth < 400;
          
          // Use compact format if: Old Android OR very small screen
          const useCompactFormat = isOldAndroid || (isAndroid && isSmallScreen);
          
          console.log('📱 Device detection:', {
            userAgent: userAgent.substring(0, 50),
            isAndroid,
            isOldAndroid,
            screenWidth: window.innerWidth,
            useCompactFormat
          });
          
          const mainTitle = `Just Anime • ${appName}`;
          let artistLine, albumLine;
          
          if (useCompactFormat) {
            // Compact format: "One-Punch Man S3E1" (everything on one line)
            console.log('📱 Using COMPACT format (device may not show album field)');
            const seasonShort = seasonInfo ? seasonInfo.replace('Season ', 'S') : '';
            const episodeShort = episodeInfo ? episodeInfo.replace('Episode ', 'E') : '';
            const seasonEpPart = [seasonShort, episodeShort].filter(Boolean).join('');
            
            artistLine = seasonEpPart 
              ? `${cleanAnimeTitle} ${seasonEpPart}` 
              : cleanAnimeTitle;
            
            // Still set album for devices that do show it
            const albumParts = [];
            if (seasonInfo) albumParts.push(seasonInfo);
            if (episodeInfo) albumParts.push(episodeInfo);
            albumLine = albumParts.join(' • ');
          } else {
            // Full format: "One-Punch Man" + "Season 3 • Episode 1" (separate lines)
            console.log('📱 Using FULL format (device should show album field)');
            artistLine = cleanAnimeTitle;
            
            const albumParts = [];
            if (seasonInfo) albumParts.push(seasonInfo);
            if (episodeInfo) albumParts.push(episodeInfo);
            albumLine = albumParts.join(' • ');
          }
          
          // Use anime poster as background
          const posterUrl = animeInfo.poster || animeInfo.image || '/favicon.png';
          
          console.log('🎨 Final notification structure:', {
            title: mainTitle,
            artist: artistLine,
            album: albumLine,
            format: useCompactFormat ? 'COMPACT (S3E1)' : 'FULL (separate lines)',
            poster: posterUrl
          });
          
          navigator.mediaSession.metadata = new MediaMetadata({
            title: mainTitle,                   // "Just Anime • Watch Anime"
            artist: artistLine,                 // "One-Punch Man S3E1" OR "One-Punch Man"
            album: albumLine,                   // "Season 3 • Episode 1"
            artwork: [
              {
                src: posterUrl,
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: posterUrl,
                sizes: '384x384',
                type: 'image/png'
              },
              {
                src: posterUrl,
                sizes: '256x256',
                type: 'image/png'
              },
              {
                src: posterUrl,
                sizes: '128x128',
                type: 'image/png'
              },
              {
                src: posterUrl,
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          });
          
          console.log('✅ Media Session metadata set successfully');
        } catch (error) {
          console.warn('⚠️ Failed to set Media Session:', error);
        }
      }

      if (isWatchTogetherMember) {
        console.log('🔒 Setting up member restrictions...');
        
        const progressBar = art.template.$progress;
        if (progressBar) {
          progressBar.style.pointerEvents = 'none';
          progressBar.style.cursor = 'default';
        }
        
        art.hotkey.disable = true; // Keep hotkeys disabled for sync
        
        const playButton = art.template.$play;
        if (playButton) {
          playButton.style.display = 'none';
        }
        
        // ✅ ALLOW members to click video to show/hide controls
        // But prevent playback control (play/pause/seek)
        if (art.video) {
          art.video.removeAttribute('controls');
          // Allow pointer events so members can tap to show controls
          art.video.style.pointerEvents = 'auto';
          
          // Prevent play/pause on click
          art.video.onclick = (e) => {
            e.preventDefault();
            // Toggle controls visibility
            art.controls.show = !art.controls.show;
            console.log('👆 Member tapped video, controls:', art.controls.show ? 'shown' : 'hidden');
          };
          
          // Prevent fullscreen on double click
          art.video.ondblclick = (e) => {
            e.preventDefault();
            return false;
          };
        }
        
        // ✅ Note: Settings menu is now available for members
        // They can control subtitle, quality, aspect ratio, etc.
        // Only playback controls (play/pause/seek) are restricted for sync
        
        // ✅ FIXED: Don't override read-only properties
        // Just disable UI interactions - socket handles play/pause
        
        // ✅ Allow clicking on controls UI for members (settings, volume, etc.)
        // But prevent clicking the play button and progress bar
        art.on('click', (e) => {
          // Allow clicks on controls (settings, volume, PIP, etc.)
          // Only prevent clicks on play/pause area
          const target = e.target;
          if (target.closest('.art-control-play') || 
              target.closest('.art-progress')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
          // Allow other control clicks (settings, volume, PIP, etc.)
        });
        
        art.on('dblclick', (e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        });
        
        const preventControls = (e) => {
          if (e.code === 'Space' || e.key === ' ' || 
              e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
              e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
              e.key === 'k' || e.key === 'j' || e.key === 'l') {
            e.preventDefault();
            e.stopPropagation();
          }
        };
        document.addEventListener('keydown', preventControls, true);
        document.addEventListener('keypress', preventControls, true);
        document.addEventListener('keyup', preventControls, true);
        
        art.layers.add({
          name: 'member-info',
          html: '<div style="position: absolute; top: 50px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); padding: 10px 20px; border-radius: 8px; color: white; font-size: 13px; pointer-events: none; opacity: 0; transition: opacity 0.3s; border: 1px solid rgba(255,255,255,0.1);">👥 Following host - Subtitles available in Settings!</div>',
          style: { pointerEvents: 'none' }
        });
        
        setTimeout(() => {
          const memberInfo = document.querySelector('[data-name="member-info"]');
          if (memberInfo) {
            memberInfo.style.opacity = '1';
            setTimeout(() => {
              memberInfo.style.opacity = '0';
            }, 5000);
          }
        }, 500);
        
        console.log('✅ Member restrictions applied');
      }

      if (onPlay) {
        art.on('play', onPlay);
      }
      if (onPause) {
        art.on('pause', onPause);
      }
      if (onSeeked) {
        art.on('seeked', onSeeked);
      }

      const continueWatchingList = JSON.parse(localStorage.getItem("continueWatching")) || [];
      const currentEntry = continueWatchingList.find((item) => item.episodeId === episodeId);
      if (currentEntry?.leftAt) art.currentTime = currentEntry.leftAt;

      art.on("video:timeupdate", () => {
        leftAtRef.current = Math.floor(art.currentTime);
      });

      // ✅ Save position every 10 seconds while playing (like JustAnime pattern)
      setInterval(() => {
        if (art.playing && animeInfo?.data_id) {
          const continueWatching = JSON.parse(localStorage.getItem("continueWatching")) || [];
          const newEntry = {
            id: animeInfo.id,
            data_id: animeInfo.data_id,
            episodeId,
            episodeNum,
            adultContent: animeInfo.adultContent,
            poster: animeInfo.poster,
            title: animeInfo.title,
            japanese_title: animeInfo.japanese_title,
            leftAt: leftAtRef.current,
          };

          const existingIndex = continueWatching.findIndex((item) => item.data_id === newEntry.data_id);
          if (existingIndex !== -1) {
            continueWatching[existingIndex] = newEntry;
          } else {
            continueWatching.push(newEntry);
          }
          localStorage.setItem("continueWatching", JSON.stringify(continueWatching));
        }
      }, 10000); // Every 10 seconds

      // Logo visibility control: show on pause, hide on play
      setTimeout(() => {
        art.layers[website_name].style.opacity = 0;
      }, 5000);

      // Add event listeners to show/hide logo based on play/pause state
      art.on('play', () => {
        art.layers[website_name].style.opacity = 0;
      });

      art.on('pause', () => {
        art.layers[website_name].style.opacity = 1;
      });

      // ✅ ENSURE subtitles are visible after player is ready
      // This is CRITICAL for DUB audio to show subtitles (accessibility)
      const isDub = serverType?.toLowerCase() === 'dub';
      console.log('🎬 Player ready - checking subtitle visibility...', {
        audioType: isDub ? '🎤 DUB' : '🎵 SUB',
        criticalFor: isDub ? 'Accessibility (deaf/hard of hearing)' : 'Translation'
      });
      
      setTimeout(() => {
        if (subtitles && subtitles.length > 0) {
          // Log current subtitle state BEFORE any changes
          console.log('📊 Current subtitle state BEFORE check:', {
            audioType: isDub ? '🎤 DUB Audio' : '🎵 SUB Audio',
            'art.subtitle.show': art.subtitle.show,
            'art.subtitle.url': art.subtitle.url,
            'Available subtitles': subtitles.map(s => s.label).join(', ')
          });
          
          // Force subtitle to be visible if there are subtitles available
          if (!art.subtitle.show) {
            console.log(`⚠️ Subtitle was hidden for ${isDub ? 'DUB' : 'SUB'} audio, forcing it to show!`);
            art.subtitle.show = true;
          }
          
          // If no subtitle is loaded, load the first one
          if (!art.subtitle.url && subtitles.length > 0) {
            console.log(`⚠️ No subtitle loaded for ${isDub ? 'DUB' : 'SUB'} audio, loading first subtitle:`, subtitles[0].label);
            art.subtitle.switch(subtitles[0].file, {
              name: subtitles[0].label,
            });
            art.subtitle.show = true;
          }
          
          // Log final state
          console.log('✅ Subtitle visibility check complete:', {
            audioType: isDub ? '🎤 DUB Audio' : '🎵 SUB Audio',
            hasSubtitles: subtitles.length > 0,
            subtitleCount: subtitles.length,
            isVisible: art.subtitle.show,
            currentSubtitle: art.subtitle.url,
            subtitleLoaded: !!art.subtitle.url,
            status: art.subtitle.show && art.subtitle.url ? '✅ WORKING!' : '❌ NOT WORKING!'
          });
        } else {
          console.log('⚠️ No subtitles available in ready event');
        }
      }, 200);

      const skipRanges = [
        ...(intro.start != null && intro.end != null ? [[intro.start + 1, intro.end - 1]] : []),
        ...(outro.start != null && outro.end != null ? [[outro.start + 1, outro.end]] : []),
      ];
      
      // Always add the autoSkip plugin with a function that checks if skipping is enabled
      if (skipRanges.length > 0) {
        art.plugins.add(autoSkip(skipRanges, () => autoSkipIntroRef.current));
      }

      document.addEventListener("keydown", (event) => handleKeydown(event, art));

      art.subtitle.style({
        fontSize: (art.width > 500 ? art.width * 0.02 : art.width * 0.03) + "px",
      });

      if (thumbnail) {
        art.plugins.add(
          artplayerPluginVttThumbnail({
            vtt: `${proxy}${thumbnail}`,
          })
        );
      }
      
      const $rewind = art.layers["rewind"];
      const $forward = art.layers["forward"];
      Artplayer.utils.isMobile &&
        art.proxy($rewind, "dblclick", () => {
          art.currentTime = Math.max(0, art.currentTime - 10);
          art.layers["backwardIcon"].style.opacity = 1;
          setTimeout(() => {
            art.layers["backwardIcon"].style.opacity = 0;
          }, 300);
        });
      Artplayer.utils.isMobile &&
        art.proxy($forward, "dblclick", () => {
          art.currentTime = Math.max(0, art.currentTime + 10);
          art.layers["forwardIcon"].style.opacity = 1;
          setTimeout(() => {
            art.layers["forwardIcon"].style.opacity = 0;
          }, 300);
        });
        
      // ✅ Subtitle menu already added immediately after player creation (see line ~395)
      console.log('📝 Skipping duplicate subtitle menu - already added at player initialization');

    });

    return () => {
      if (art && art.destroy) {
        art.destroy(false);
      }
      artInstanceRef.current = null; // Clear internal ref
      document.removeEventListener("keydown", handleKeydown);
      const continueWatching = JSON.parse(localStorage.getItem("continueWatching")) || [];
      const newEntry = {
        id: animeInfo?.id,
        data_id: animeInfo?.data_id,
        episodeId,
        episodeNum,
        adultContent: animeInfo?.adultContent,
        poster: animeInfo?.poster,
        title: animeInfo?.title,
        japanese_title: animeInfo?.japanese_title,
        leftAt: leftAtRef.current,
      };

      if (!newEntry.data_id) return;

      const existingIndex = continueWatching.findIndex((item) => item.data_id === newEntry.data_id);
      if (existingIndex !== -1) {
        continueWatching[existingIndex] = newEntry;
      } else {
        continueWatching.push(newEntry);
      }
      localStorage.setItem("continueWatching", JSON.stringify(continueWatching));
    };
  }, [streamUrl, subtitles, intro, outro]);

  return <div ref={artRef} className="w-full h-full"></div>;
}
