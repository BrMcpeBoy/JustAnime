import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Genre({ data }) {
  const scrollContainerRef = useRef(null);
  const animFrameRef = useRef(null);
  const isPausedRef = useRef(false);
  const posRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const SPEED = 0.4;
    const tick = () => {
      if (!isPausedRef.current && el) {
        posRef.current += SPEED;
        if (posRef.current >= el.scrollWidth / 2) posRef.current = 0;
        el.scrollLeft = posRef.current;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [data]);

  useEffect(() => {
    isPausedRef.current = isHovered;
  }, [isHovered]);

  const scroll = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = direction === "left" ? -300 : 300;
    const target = Math.max(0, posRef.current + amount);
    const start = posRef.current;
    const distance = target - start;
    const duration = 400;
    let startTime = null;

    const ease = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      posRef.current = start + distance * ease(progress);
      el.scrollLeft = posRef.current;
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  };

  const loopedData = data ? [...data, ...data] : [];

  return (
    <div className="relative pt-[20px] max-sm:pt-[15px]">
      <div className="relative flex items-center min-h-[32px] max-sm:min-h-[28px]">

        {/* Scrolling tags */}
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
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="px-3.5 max-sm:px-3 h-8 max-sm:h-7 flex items-center border border-white/10 hover:border-white/25 hover:bg-white/5 rounded-[4px] transition-all duration-200 group"
              >
                <span className="text-white/70 font-medium whitespace-nowrap text-[13px] max-sm:text-xs tracking-wide group-hover:text-white transition-colors duration-200">
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Left */}
        <div className="relative z-20 flex items-center">
          <button
            onClick={() => scroll("left")}
            className="h-8 max-sm:h-7 w-8 max-sm:w-7 flex items-center justify-center bg-[#0a0a0a] border border-white/10 hover:border-white/25 hover:bg-[#1a1a1a] rounded-[4px] transition-all duration-200 focus:outline-none active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 max-sm:h-3.5 w-4 max-sm:w-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="h-8 max-sm:h-7 w-20 max-sm:w-12 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent pointer-events-none" />
        </div>

        <div className="flex-1" />

        {/* Right */}
        <div className="relative z-20 flex items-center">
          <div className="h-8 max-sm:h-7 w-20 max-sm:w-12 bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent pointer-events-none" />
          <button
            onClick={() => scroll("right")}
            className="h-8 max-sm:h-7 w-8 max-sm:w-7 flex items-center justify-center bg-[#0a0a0a] border border-white/10 hover:border-white/25 hover:bg-[#1a1a1a] rounded-[4px] transition-all duration-200 focus:outline-none active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 max-sm:h-3.5 w-4 max-sm:w-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Genre);
