import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";

function Genre({ data }) {
  const { language } = useLanguage();
  const scrollContainerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef(null);
  const [isIOS, setIsIOS] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollDirection, setScrollDirection] = useState(1); // 1 for right, -1 for left

  // Detect iOS on mount
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);
  }, []);

  // Convert genre string to translation key
  const getGenreKey = (genreStr) => {
    // Map of URL genre names to translation keys
    const genreKeyMap = {
      'action': 'action',
      'adventure': 'adventure',
      'cars': 'cars',
      'comedy': 'comedy',
      'dementia': 'dementia',
      'demons': 'demons',
      'drama': 'drama',
      'fantasy': 'fantasy',
      'game': 'game',
      'harem': 'harem',
      'historical': 'historical',
      'horror': 'horror',
      'josei': 'josei',
      'kids': 'kids',
      'magic': 'magic',
      'martial-arts': 'martialArts',
      'mecha': 'mecha',
      'military': 'military',
      'music': 'music',
      'mystery': 'mystery',
      'parody': 'parody',
      'police': 'police',
      'psychological': 'psychological',
      'romance': 'romance',
      'samurai': 'samurai',
      'school': 'school',
      'sci-fi': 'sciFi',
      'seinen': 'seinen',
      'shoujo': 'shoujo',
      'shoujo-ai': 'shoujoAi',
      'shounen': 'shounen',
      'shounen-ai': 'shounenAi',
      'slice-of-life': 'sliceOfLife',
      'space': 'space',
      'sports': 'sports',
      'super-power': 'superPower',
      'supernatural': 'supernatural',
      'thriller': 'thriller',
      'vampire': 'vampire',
    };
    return genreKeyMap[genreStr.toLowerCase()] || genreStr;
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      // Temporarily pause auto-scroll
      setIsPaused(true);
      
      const scrollAmount = direction === 'left' ? -300 : 300;
      
      if (isIOS) {
        // For iOS, animate the scroll smoothly
        const container = scrollContainerRef.current;
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
        scrollContainerRef.current.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      }

      // Resume auto-scroll after a delay
      setTimeout(() => {
        setIsPaused(false);
      }, 1000);
    }
  };

  // Auto-scroll animation - back and forth
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !data || data.length === 0) return;

    // Same speed for all platforms
    const scrollSpeed = 0.8;

    const animate = () => {
      if (!isPaused && container) {
        const currentScroll = isIOS ? scrollPosition : container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const newPosition = currentScroll + (scrollSpeed * scrollDirection);

        // Check if we've reached the end or beginning
        if (newPosition >= maxScroll) {
          // Reached the end, reverse direction to go left
          setScrollDirection(-1);
          if (isIOS) {
            setScrollPosition(maxScroll);
            container.scrollLeft = maxScroll;
          } else {
            container.scrollLeft = maxScroll;
          }
        } else if (newPosition <= 0) {
          // Reached the beginning, reverse direction to go right
          setScrollDirection(1);
          if (isIOS) {
            setScrollPosition(0);
            container.scrollLeft = 0;
          } else {
            container.scrollLeft = 0;
          }
        } else {
          // Normal scrolling
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, data, isIOS, scrollPosition, scrollDirection]);

  // No need to duplicate for back-and-forth scrolling
  const displayData = data || [];

  return (
    <div className="relative pt-[20px] max-sm:pt-[8px]">
      <div className="relative flex items-center min-h-[32px] max-sm:min-h-[28px]">
        {/* Content first for proper stacking */}
        <div 
          ref={scrollContainerRef}
          className="absolute inset-0 overflow-x-auto no-scrollbar"
          style={{
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: isIOS ? 'auto' : 'smooth'
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => {
            setIsPaused(true);
            if (isIOS && scrollContainerRef.current) {
              setScrollPosition(scrollContainerRef.current.scrollLeft);
            }
          }}
          onTouchEnd={() => {
            // Resume auto-scroll after touch ends
            setTimeout(() => setIsPaused(false), 500);
          }}
          onScroll={(e) => {
            // Sync scroll position for iOS when user manually scrolls
            if (isIOS && isPaused) {
              setScrollPosition(e.target.scrollLeft);
            }
          }}
        >
          <div className="flex gap-2 h-8 max-sm:h-7 items-center min-w-max px-24 max-sm:px-16">
            {displayData.map((item, index) => (
              <Link
                to={`/genre/${item}`}
                key={index}
                className="rounded-lg border border-white/10 px-3.5 max-sm:px-3 h-8 max-sm:h-7 flex items-center bg-[#0a0a0a] hover:bg-[#252525] rounded-[4px] transition-all duration-300 ease-in-out group"
              >
                <div className="text-white font-medium whitespace-nowrap text-[13px] max-sm:text-xs tracking-wide group-hover:text-white/90 transition-colors duration-300">
                  {getTranslation(language, getGenreKey(item))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Left button and gradient */}
        <div className="relative z-20 flex items-center">
          <button 
            onClick={() => scroll('left')}
            className="rounded-lg border border-white/10 bg-[#0a0a0a] hover:bg-[#252525] h-8 max-sm:h-7 w-8 max-sm:w-7 flex items-center justify-center rounded-[4px] transition-all duration-300 ease-in-out focus:outline-none active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 max-sm:h-3.5 w-4 max-sm:w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="h-8 max-sm:h-7 w-20 max-sm:w-12 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent max-sm:from-[#0a0a0a]/60 max-sm:via-[#0a0a0a]/40 pointer-events-none"></div>
        </div>

        {/* Spacer for content */}
        <div className="flex-1"></div>

        {/* Right button and gradient */}
        <div className="relative z-20 flex items-center">
          <div className="h-8 max-sm:h-7 w-20 max-sm:w-12 bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent max-sm:from-[#0a0a0a]/60 max-sm:via-[#0a0a0a]/40 pointer-events-none"></div>
          <button 
            onClick={() => scroll('right')}
            className="rounded-lg border border-white/10 bg-[#0a0a0a] hover:bg-[#252525] h-8 max-sm:h-7 w-8 max-sm:w-7 flex items-center justify-center rounded-[4px] transition-all duration-300 ease-in-out focus:outline-none active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 max-sm:h-3.5 w-4 max-sm:w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Genre);