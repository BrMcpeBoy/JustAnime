import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Genre({ data }) {
  const scrollContainerRef = useRef(null);
  const animFrameRef = useRef(null);
  const isPausedRef = useRef(false);
  const posRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Auto-rolling scroll
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const SPEED = 0.5; // px per frame

    const tick = () => {
      if (!isPausedRef.current && el) {
        posRef.current += SPEED;
        // Loop: when we've scrolled half the duplicated content, reset
        if (posRef.current >= el.scrollWidth / 2) {
          posRef.current = 0;
        }
        el.scrollLeft = posRef.current;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [data]);

  // Pause on hover
  useEffect(() => {
    isPausedRef.current = isHovered;
  }, [isHovered]);

  // Duplicate data for seamless loop
  const loopedData = data ? [...data, ...data] : [];

  return (
    <div className="relative pt-[20px] max-sm:pt-[15px]">
      <div className="relative flex items-center min-h-[32px] max-sm:min-h-[28px]">

        {/* Scrolling content */}
        <div
          ref={scrollContainerRef}
          className="absolute inset-0 overflow-x-hidden"
          style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex gap-2 h-8 max-sm:h-7 items-center min-w-max px-24 max-sm:px-16">
            {loopedData.map((item, index) => (
              <Link
                to={`/genre/${item}`}
                key={index}
                className="px-3.5 max-sm:px-3 h-8 max-sm:h-7 flex items-center bg-[#0d1a1a] border border-[#20c8a0]/15 hover:border-[#20c8a0]/35 hover:bg-[#20c8a0]/08 rounded-[4px] transition-all duration-300 ease-in-out group"
                style={{ background: "rgba(13,26,26,0.9)" }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <div className="text-white/75 font-medium whitespace-nowrap text-[13px] max-sm:text-xs tracking-wide group-hover:text-[#20c8a0] transition-colors duration-300">
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Left button + fade */}
        <div className="relative z-20 flex items-center">
          <button
            onClick={() => scroll("left")}
            className="h-8 max-sm:h-7 w-8 max-sm:w-7 flex items-center justify-center rounded-[4px] border border-[#20c8a0]/20 bg-[#0d1a1a] hover:border-[#20c8a0]/40 hover:bg-[#20c8a0]/10 transition-all duration-300 ease-in-out focus:outline-none active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 max-sm:h-3.5 w-4 max-sm:w-3.5 text-[#20c8a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="h-8 max-sm:h-7 w-20 max-sm:w-12 bg-gradient-to-r from-[#0d0f14] via-[#0d0f14]/80 to-transparent pointer-events-none"></div>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Right button + fade */}
        <div className="relative z-20 flex items-center">
          <div className="h-8 max-sm:h-7 w-20 max-sm:w-12 bg-gradient-to-l from-[#0d0f14] via-[#0d0f14]/80 to-transparent pointer-events-none"></div>
          <button
            onClick={() => scroll("right")}
            className="h-8 max-sm:h-7 w-8 max-sm:w-7 flex items-center justify-center rounded-[4px] border border-[#20c8a0]/20 bg-[#0d1a1a] hover:border-[#20c8a0]/40 hover:bg-[#20c8a0]/10 transition-all duration-300 ease-in-out focus:outline-none active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 max-sm:h-3.5 w-4 max-sm:w-3.5 text-[#20c8a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Genre);
