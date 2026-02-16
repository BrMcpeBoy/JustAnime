import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlay } from "@fortawesome/free-solid-svg-icons";
import { FaChevronLeft, FaChevronRight, FaChevronDown, FaEye, FaEyeSlash } from "react-icons/fa";
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation, formatDateTime, formatRelativeTime } from "@/src/translations/translations";
import getAnimeInfo from "@/src/utils/getAnimeInfo.utils";
import Qtip from "../qtip/Qtip";

const COMMENT_API_URL = import.meta.env.VITE_COMMENT_API_URL || "http://localhost:5000";

function RecentComments() {
  const { language, titleLanguage } = useLanguage();
  const scrollRef = useRef(null);
  const animationRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [comments, setComments] = useState([]);
  const [animeData, setAnimeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sortType, setSortType] = useState('new'); // 'new' or 'top'
  const [showDropdown, setShowDropdown] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollDirection, setScrollDirection] = useState(1); // 1 for right, -1 for left
  const [loopEnabled, setLoopEnabled] = useState(() => {
    const saved = localStorage.getItem('recentCommentsLoop');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [commentsVisible, setCommentsVisible] = useState(() => {
    const saved = localStorage.getItem('showRecentComments');
    return saved !== null ? JSON.parse(saved) : true;
  });
  // showComments is for the hide/show button, synced with commentsVisible
  const [showComments, setShowComments] = useState(() => {
    const saved = localStorage.getItem('showRecentComments');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // New refs for better user interaction handling
  const userInteractionTimeoutRef = useRef(null);
  const autoScrollDirectionRef = useRef(1); // Track auto-scroll direction separately
  const edgePauseTimeoutRef = useRef(null); // Track edge pause timeout
  const isAtEdgePausedRef = useRef(false); // Track if paused at edge

  // Detect iOS on mount
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);
  }, []);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedLoop = localStorage.getItem('recentCommentsLoop');
      const savedVisible = localStorage.getItem('showRecentComments');
      
      if (savedLoop !== null) {
        setLoopEnabled(JSON.parse(savedLoop));
      }
      if (savedVisible !== null) {
        const visible = JSON.parse(savedVisible);
        setCommentsVisible(visible);
        setShowComments(visible); // Sync both states
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check on interval for same-tab changes
    const interval = setInterval(handleStorageChange, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Fetch recent comments across all anime, then re-fetch every 5 min
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setLoading(true);
        const endpoint = sortType === 'top' 
          ? `${COMMENT_API_URL}/api/comments/top?limit=16`
          : `${COMMENT_API_URL}/api/comments/recent?limit=16`;
        
        console.log('Fetching from endpoint:', endpoint);
        
        const res = await fetch(endpoint);
        const data = await res.json();
        
        console.log('Response data:', data);
        console.log('Number of comments received:', data.data?.length || 0);
        
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // Filter to only include parent comments (not replies)
          const parentComments = data.data.filter(comment => !comment.parentId);
          console.log('Parent comments after filter:', parentComments.length);
          setComments(parentComments);
        } else {
          console.log('No comments or empty response');
          setComments([]);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();

    const interval = setInterval(fetchRecent, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(interval);
  }, [sortType]);

  // Touch and scroll event handlers - inline like Genre component
  const handleTouchStart = () => {
    // Immediately stop auto-scroll when user touches to scroll
    setIsPaused(true);
    
    // Cancel any edge pause
    isAtEdgePausedRef.current = false;
    if (edgePauseTimeoutRef.current) {
      clearTimeout(edgePauseTimeoutRef.current);
      edgePauseTimeoutRef.current = null;
    }
    
    // Clear any existing resume timeout
    if (userInteractionTimeoutRef.current) {
      clearTimeout(userInteractionTimeoutRef.current);
      userInteractionTimeoutRef.current = null;
    }
    
    // Sync scroll position for iOS
    if (isIOS && scrollRef.current) {
      setScrollPosition(scrollRef.current.scrollLeft);
    }
  };
  
  const handleTouchEnd = () => {
    // On release, wait 3 seconds then check position and resume
    if (userInteractionTimeoutRef.current) {
      clearTimeout(userInteractionTimeoutRef.current);
    }
    
    userInteractionTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      
      const currentPos = isIOS ? scrollPosition : scrollRef.current.scrollLeft;
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      const threshold = 10;
      
      // Check position and set direction
      if (currentPos >= maxScroll - threshold) {
        autoScrollDirectionRef.current = -1; // At right edge - scroll left
      } else if (currentPos <= threshold) {
        autoScrollDirectionRef.current = 1; // At left edge - scroll right
      }
      
      // Resume auto-scroll
      setIsPaused(false);
    }, 3000);
  };
  
  const handleScroll = (e) => {
    // Sync scroll position for iOS when user manually scrolls
    if (isIOS && isPaused) {
      setScrollPosition(e.target.scrollLeft);
    }
  };
  
  const handleMouseEnter = () => {
    setIsPaused(true);
  };
  
  const handleMouseLeave = () => {
    setIsPaused(false);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }
      if (edgePauseTimeoutRef.current) {
        clearTimeout(edgePauseTimeoutRef.current);
      }
    };
  }, []);

  // Fetch anime title + poster for all unique animeIds in parallel
  useEffect(() => {
    if (comments.length === 0) return;
    const uniqueIds = [...new Set(comments.map((c) => c.animeId).filter(Boolean))];
    if (uniqueIds.length === 0) return;

    const fetchAll = async () => {
      const results = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const info = await getAnimeInfo(id);
            const title =
              titleLanguage === "jp" && info?.data?.japanese_title
                ? info.data.japanese_title
                : info?.data?.title || null;
            const poster = info?.data?.poster || null;
            return title ? { id, title, poster } : null;
          } catch {
            return null;
          }
        })
      );
      const map = {};
      results.forEach((r) => {
        if (r) map[r.id] = { title: r.title, poster: r.poster };
      });
      setAnimeData(map);
    };
    fetchAll();
  }, [comments, titleLanguage]);

  // Manual scroll buttons
  const scroll = (direction) => {
    if (!scrollRef.current) return;
    
    // Temporarily pause auto-scroll
    setIsPaused(true);
    
    const scrollAmount = direction === "left" ? -280 : 280;
    
    if (isIOS) {
      // For iOS, animate the scroll smoothly
      const container = scrollRef.current;
      const startPosition = scrollPosition;
      const targetPosition = Math.max(0, Math.min(
        scrollPosition + scrollAmount,
        container.scrollWidth - container.clientWidth
      ));
      
      // Smooth animation using requestAnimationFrame
      const duration = 300; // 300ms animation
      const startTime = performance.now();
      
      const animateScroll = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation (easeInOutCubic)
        const easeProgress = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        const currentPosition = startPosition + ((targetPosition - startPosition) * easeProgress);
        
        setScrollPosition(currentPosition);
        container.scrollLeft = currentPosition;
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };
      
      requestAnimationFrame(animateScroll);
    } else {
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }

    // Resume auto-scroll after a delay
    setTimeout(() => {
      setIsPaused(false);
    }, 1000);
  };

  // Auto-scroll animation - bounces back and forth at edges
  // Only enable auto-scroll when there are more than 5 comments AND auto-scroll is enabled
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || comments.length === 0) return;

    // Only auto-scroll if there are more than 5 comments AND auto-scroll toggle is enabled
    const shouldAutoScroll = comments.length > 5 && loopEnabled;
    
    if (!shouldAutoScroll) {
      // If auto-scroll disabled or 5 or fewer comments, don't auto-scroll
      return;
    }

    // Same speed for all platforms
    const speed = 0.8;

    const animate = () => {
      // Don't animate if paused or paused at edge
      if (!isPaused && !isAtEdgePausedRef.current && container) {
        const currentScroll = isIOS ? scrollPosition : container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        // Calculate new position based on current direction
        const newPosition = currentScroll + (speed * autoScrollDirectionRef.current);

        // Check boundaries and pause before reversing
        if (newPosition >= maxScroll) {
          // Hit right edge - STOP, pause for 3s, then reverse
          if (isIOS) {
            setScrollPosition(maxScroll);
            container.scrollLeft = maxScroll;
          } else {
            container.scrollLeft = maxScroll;
          }
          
          // Set paused state
          isAtEdgePausedRef.current = true;
          
          // Clear any existing edge pause timeout
          if (edgePauseTimeoutRef.current) {
            clearTimeout(edgePauseTimeoutRef.current);
          }
          
          // Wait 3 seconds before reversing direction
          edgePauseTimeoutRef.current = setTimeout(() => {
            autoScrollDirectionRef.current = -1; // Reverse to scroll left
            isAtEdgePausedRef.current = false;
          }, 3000);
          
        } else if (newPosition <= 0) {
          // Hit left edge - STOP, pause for 3s, then reverse
          if (isIOS) {
            setScrollPosition(0);
            container.scrollLeft = 0;
          } else {
            container.scrollLeft = 0;
          }
          
          // Set paused state
          isAtEdgePausedRef.current = true;
          
          // Clear any existing edge pause timeout
          if (edgePauseTimeoutRef.current) {
            clearTimeout(edgePauseTimeoutRef.current);
          }
          
          // Wait 3 seconds before reversing direction
          edgePauseTimeoutRef.current = setTimeout(() => {
            autoScrollDirectionRef.current = 1; // Reverse to scroll right
            isAtEdgePausedRef.current = false;
          }, 3000);
          
        } else {
          // Normal scrolling within bounds - safe to move
          if (isIOS) {
            setScrollPosition(newPosition);
            container.scrollLeft = newPosition;
          } else {
            container.scrollLeft = newPosition;
          }
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (edgePauseTimeoutRef.current) clearTimeout(edgePauseTimeoutRef.current);
    };
  }, [isPaused, comments, isIOS, scrollPosition, loopEnabled]);

  // ── empty / error state ─────────────────────────────────────────────
  const hasData = comments.length > 0;

  // Show comments only once, no duplication
  const displayComments = hasData ? comments : [];

  return (
    <div className="w-full mt-4 mb-2">
      {/* ── Header with Dropdown and Toggle ── */}
      <div className="flex items-center justify-between gap-2 mb-5 max-md:mb-4">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-2xl text-white tracking-tight max-[450px]:text-xl max-[350px]:text-lg">
            {getTranslation(language, "recentComments")}
          </h1>
          
          {/* Dropdown Button - adjusted vertical alignment for desktop */}
          <div className="relative flex items-center md:mt-1">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
            >
              {/* Desktop: Full text, Mobile: Short text */}
              <span className="hidden sm:inline">
                {sortType === 'new' ? getTranslation(language, "newComment") : getTranslation(language, "topComments")}
              </span>
              <span className="inline sm:hidden">
                {sortType === 'new' ? getTranslation(language, "new") : getTranslation(language, "top")}
              </span>
              <FaChevronDown className={`text-xs transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute left-0 top-full mt-2 w-40 bg-[#000000] border border-white/10 rounded-lg shadow-lg overflow-hidden z-10">
                <button
                  onClick={() => {
                    setSortType('new');
                    setShowDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    sortType === 'new'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {getTranslation(language, "newComment")}
                </button>
                <button
                  onClick={() => {
                    setSortType('top');
                    setShowDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    sortType === 'top'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {getTranslation(language, "topComments")}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Toggle Show/Hide Button - adjusted vertical alignment for desktop */}
        <button
          onClick={() => {
            const newValue = !showComments;
            setShowComments(newValue);
            setCommentsVisible(newValue);
            localStorage.setItem('showRecentComments', JSON.stringify(newValue));
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-lg text-sm text-gray-300 hover:text-white transition-colors md:mt-1"
        >
          {showComments ? (
            <>
              <FaEye className="text-sm" />
              <span className="hidden sm:inline">{getTranslation(language, "hide")}</span>
            </>
          ) : (
            <>
              <FaEyeSlash className="text-sm" />
              <span className="hidden sm:inline">{getTranslation(language, "show")}</span>
            </>
          )}
        </button>
      </div>

      {/* ── Bordered container (only show if showComments is true) ── */}
      {showComments && (
        <div className="w-full bg-[#0a0a0a] rounded-lg border border-white/10 hover:border-white/20 transition-colors shadow-lg relative">
        {/* Left gradient fade at border - less visible */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0a0a]/80 via-[#0a0a0a]/50 to-transparent pointer-events-none z-10 rounded-l-lg" />
        
        {/* Right gradient fade at border - less visible */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0a0a]/80 via-[#0a0a0a]/50 to-transparent pointer-events-none z-10 rounded-r-lg" />

        {/* ── No-data / error fallback ── */}
        {!hasData && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 px-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-white/40 text-[13px] text-center">
              {loading
                ? "..."
                : getTranslation(language, "noCommentsYet")}
            </p>
          </div>
        )}

        {/* ── Scrolling strip (only when we have data) ── */}
        {hasData && (
          <div className="relative flex items-center py-3">

            {/* scrollable area – with padding to prevent border clipping */}
            <div
              ref={scrollRef}
              className="absolute top-3 bottom-3 left-0 right-0 overflow-x-auto overflow-y-visible px-1"
              style={{ 
                msOverflowStyle: "none", 
                scrollbarWidth: "none",
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: isIOS ? 'auto' : 'smooth'
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onScroll={handleScroll}
            >
              <div className="flex gap-2 min-w-max px-2">
                {displayComments.map((comment, i) => (
                  <CommentCard
                    key={`${comment._id || comment.id}-${i}`}
                    comment={comment}
                    animeTitle={animeData[comment.animeId]?.title || null}
                    animePoster={animeData[comment.animeId]?.poster || null}
                    language={language}
                  />
                ))}
              </div>
            </div>

            {/* ── left: btn at border ── */}
            <div className="relative z-20 flex items-center flex-shrink-0 min-w-fit ml-3">
              <button
                onClick={() => scroll("left")}
                className="rounded-xl bg-[#0a0a0a] text-white p-2.5 hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center focus:outline-none active:scale-95 z-30"
              >
                <FaChevronLeft className="text-sm" />
              </button>
            </div>

            {/* invisible spacer – sets the row height to one card */}
            <div className="flex-1 invisible min-w-0">
              <CommentCard
                comment={comments[0]}
                animeTitle={animeData[comments[0]?.animeId]?.title || null}
                animePoster={animeData[comments[0]?.animeId]?.poster || null}
                language={language}
              />
            </div>

            {/* ── right: btn at border ── */}
            <div className="relative z-20 flex items-center flex-shrink-0 min-w-fit mr-3">
              <button
                onClick={() => scroll("right")}
                className="rounded-xl bg-[#0a0a0a] text-white p-2.5 hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center focus:outline-none active:scale-95 z-30"
              >
                <FaChevronRight className="text-sm" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

/* ── Single card ── */
const CommentCard = React.memo(({ comment, animeTitle, language, animePoster }) => {
  const [hoveredPoster, setHoveredPoster] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [tooltipHorizontalPosition, setTooltipHorizontalPosition] = useState("right-full");
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const posterRef = useRef(null);
  
  const avatarSrc =
    comment.userAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.username || "U")}&background=random&size=128`;

  const updateTooltipPosition = () => {
    if (posterRef.current) {
      const rect = posterRef.current.getBoundingClientRect();
      const qtipWidth = 300;
      const gap = 10;
      
      // Calculate position in viewport (for position: fixed)
      let top = rect.top + rect.height / 2 - 50;
      let left = rect.right + gap;
      
      // If tooltip goes off right edge, show on left
      if (left + qtipWidth > window.innerWidth) {
        left = rect.left - qtipWidth - gap;
      }
      
      // Clamp to viewport
      if (left < 0) left = 10;
      if (left + qtipWidth > window.innerWidth) left = window.innerWidth - qtipWidth - 10;
      
      setTooltipPos({ top, left });
      setTooltipHorizontalPosition("right-full");
    }
  };

  const handlePosterEnter = () => {
    // Only show Qtip on desktop (screen width > 768px)
    if (window.innerWidth <= 768) return;
    
    if (hoverTimeout) clearTimeout(hoverTimeout);
    updateTooltipPosition();
    setHoveredPoster(true);
  };

  const handlePosterLeave = () => {
    setHoverTimeout(
      setTimeout(() => {
        setHoveredPoster(false);
      }, 300)
    );
  };

  // Update tooltip position on scroll and resize
  useEffect(() => {
    if (!hoveredPoster) return;
    
    const handleScroll = () => updateTooltipPosition();
    const handleResize = () => updateTooltipPosition();
    
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [hoveredPoster]);

  return (
    <div
      className="flex flex-col bg-[#111111] border border-white/8 hover:border-white/18 rounded-lg w-[280px] max-sm:w-[240px] transition-colors duration-200 relative"
      style={{ zIndex: hoveredPoster ? 1000 : 1, overflow: "visible" }}
    >
      {/* Top + Body – normal bg */}
      <div className="p-2.5 flex flex-col gap-2 flex-1">
        {/* avatar + user + time - clickable */}
        <Link
          to={`/user/${comment.userId}`}
          className="flex items-start gap-2 transition-colors duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={avatarSrc}
            alt={comment.username}
            loading="lazy"
            className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                comment.username || "U"
              )}&background=random&size=128`;
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-white/80 text-[14px] font-medium truncate hover:text-white transition-colors">@{comment.username}</p>
            <p className="text-white/40 text-[11px] leading-tight">
              {formatRelativeTime(comment.createdAt, language)}
            </p>
          </div>
        </Link>

        {/* Main content area with comment text and poster */}
        <div className="flex gap-2.5 items-start">
          {/* comment text */}
          <div className="flex-1 min-w-0 h-[105px] flex flex-col justify-start">
            <p 
              className="text-white/65 text-[12px] leading-[1.7] line-clamp-5 break-words"
            >
              {comment.content}
            </p>
          </div>

          {/* Anime poster - bigger on desktop */}
          {animePoster && (
            <div className="relative flex-shrink-0" ref={posterRef}>
              <Link
                to={comment.animeId ? `/${comment.animeId}` : "#"}
                className="block"
                onMouseEnter={handlePosterEnter}
                onMouseLeave={handlePosterLeave}
                onTouchStart={(e) => {
                  // Prevent hover effect on touch devices
                  e.currentTarget.onmouseenter = null;
                }}
              >
                <img
                  src={animePoster}
                  alt={animeTitle || "Anime poster"}
                  loading="lazy"
                  className="w-[70px] h-[100px] rounded-lg object-cover border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-[1.02] shadow-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </Link>
              
              {/* Qtip tooltip - absolute positioning like Top Ten */}
              {hoveredPoster && comment.animeId && (
                <div
                  className="fixed z-[999999] pointer-events-auto"
                  style={{
                    top: `${tooltipPos.top}px`,
                    left: `${tooltipPos.left}px`,
                    opacity: 1
                  }}
                  onMouseEnter={() => {
                    if (hoverTimeout) clearTimeout(hoverTimeout);
                    setHoveredPoster(true);
                  }}
                  onMouseLeave={handlePosterLeave}
                >
                  <Qtip id={comment.animeId} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer – anime title link with more height */}
      <Link
        to={comment.animeId ? `/${comment.animeId}` : "#"}
        className="flex items-center gap-2 px-2.5 py-2.5 border-t border-white/8 text-white/45 hover:text-white/75 transition-colors duration-200"
      >
        <FontAwesomeIcon
          icon={faCirclePlay}
          className="text-[13px] flex-shrink-0"
        />
        <span className="text-[11px] truncate font-medium">{animeTitle || comment.animeId || "—"}</span>
      </Link>
    </div>
  );
});

CommentCard.displayName = "CommentCard";
export default React.memo(RecentComments);
