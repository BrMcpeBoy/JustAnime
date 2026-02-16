import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faClosedCaptioning,
  faMicrophone,
  faCalendar,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation, translateShowType, translateEpisodeInfo, translateDuration, translateQuality, translateDate } from "@/src/translations/translations";
import { formatNumber } from "@/src/utils/numberConverter";
import "./Banner.css";

// Helper function to calculate time remaining until next episode
function getTimeRemaining(nextEpisodeSchedule) {
  if (!nextEpisodeSchedule) return null;
  
  const now = Date.now();
  const airingTime = new Date(nextEpisodeSchedule).getTime();
  const diff = airingTime - now;
  
  if (diff <= 0) return null;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
}

function Banner({ item, index }) {
  const { language, titleLanguage } = useLanguage();
  const [watchProgress, setWatchProgress] = useState({});

  // Load continue watching data from localStorage
  useEffect(() => {
    const loadWatchProgress = () => {
      const continueWatchingData = JSON.parse(
        localStorage.getItem("continueWatching") || "[]"
      );
      
      const progressMap = {};
      continueWatchingData.forEach((cwItem) => {
        const animeId = String(cwItem.id);
        if (!progressMap[animeId]) {
          progressMap[animeId] = {
            episodeId: cwItem.episodeId,
            episodeNum: cwItem.episodeNum,
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

  // Helper function to get the correct watch URL
  const getWatchUrl = (id) => {
    const progress = watchProgress[String(id)];
    if (progress && progress.episodeId) {
      return `/watch/${id}?ep=${progress.episodeId}`;
    }
    return `/watch/${id}`;
  };

  return (
    <section className="spotlight w-full h-full relative rounded-2xl overflow-hidden">
      <img
        src={`${item.poster}`}
        alt={item.title}
        className="absolute inset-0 object-cover w-full h-full rounded-2xl"
      />
      <div className="spotlight-overlay absolute inset-0 z-[1] rounded-2xl"></div>
      
      {/* Next Episode Schedule Badge - Desktop: top-left, Mobile: with nav buttons */}
      {item.nextEpisodeSchedule && (() => {
        const timeRemaining = getTimeRemaining(item.nextEpisodeSchedule);
        if (!timeRemaining) return null;
        
        const { days, hours, minutes } = timeRemaining;
        
        // Get next episode number from schedule data, or calculate from current episode
        let nextEpNumber = item.nextEpisodeNumber;
        if (!nextEpNumber) {
          const currentEp = item.tvInfo?.episodeInfo?.sub || item.tvInfo?.episodeInfo?.dub;
          nextEpNumber = currentEp ? parseInt(currentEp) + 1 : '?';
        }
        
        // Format date and time
        const dateObj = new Date(
          new Date(item.nextEpisodeSchedule).getTime() -
          new Date().getTimezoneOffset() * 60000
        );
        
        const formattedDate = dateObj.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
        
        // Convert date and AM/PM to Khmer
        let displayDate = formattedDate;
        if (language === 'km' || language === 'kh') {
          // Convert numbers to Khmer numerals
          displayDate = formatNumber(formattedDate, language);
          // Replace AM/PM with Khmer equivalents
          displayDate = displayDate
            .replace(/am/gi, 'ព្រឹក')  // AM = morning (prɨk)
            .replace(/pm/gi, 'ល្ងាច');  // PM = evening (lŋiec)
        }
        
        // Convert episode number to Khmer if needed
        const displayEpNumber = formatNumber(nextEpNumber, language);
        
        return (
          <>
            {/* Desktop: Top-left matching nav button size */}
            <div className="absolute top-[20px] left-[20px] z-[3] max-md:hidden">
              <div className="flex items-center gap-3">
                <div className="w-[48px] h-[48px] bg-black/30 backdrop-blur-md border border-white/30 hover:bg-black/40 hover:backdrop-blur-lg hover:border-white/50 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300">
                  <FontAwesomeIcon icon={faCalendar} className="text-white text-[20px]" />
                </div>
                <div className="flex flex-col justify-center min-w-0 h-[48px]">
                  <p className="text-white/90 text-[13px] leading-[16px] whitespace-nowrap font-semibold">
                    {language === 'km' || language === 'kh' 
                      ? `ភាគបន្ទាប់ ${displayEpNumber} ប៉ាន់ស្មាននៅ`
                      : `Next Episode ${displayEpNumber} Estimated at`}
                  </p>
                  <p className="text-white text-[13px] font-bold leading-[16px] whitespace-nowrap">
                    {displayDate}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Mobile: On same line as nav buttons, left side */}
            <div className="hidden max-md:block absolute top-[15px] left-[10px] z-[5]">
              <div className="flex items-center gap-2.5">
                <div className="w-[40px] h-[40px] bg-black/30 backdrop-blur-md border border-white/30 hover:bg-black/40 hover:backdrop-blur-lg hover:border-white/50 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300">
                  <FontAwesomeIcon icon={faCalendar} className="text-white text-[16px]" />
                </div>
                <div className="flex flex-col justify-center min-w-0 h-[40px]">
                  <p className="text-white/90 text-[11px] leading-[13px] whitespace-nowrap font-semibold">
                    {language === 'km' || language === 'kh'
                      ? `ភាគបន្ទាប់ ${displayEpNumber} ប៉ាន់ស្មាននៅ`
                      : `Next Episode ${displayEpNumber} Estimated at`}
                  </p>
                  <p className="text-white text-[11px] font-bold leading-[13px] whitespace-nowrap">
                    {displayDate}
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      })()}
      
      <div className="absolute flex flex-col left-0 bottom-[40px] w-[55%] p-4 z-[2] max-[1390px]:w-[45%] max-[1390px]:bottom-[40px] max-[1300px]:w-[600px] max-[1120px]:w-[60%] max-md:w-[90%] max-md:bottom-[20px] max-[300px]:w-full">
        
        <h3 className="text-white line-clamp-2 text-[38px] font-bold text-left max-[1390px]:text-[36px] max-[1300px]:text-3xl max-md:text-2xl max-[575px]:text-[22px] max-sm:leading-6">
          {titleLanguage === "en" ? item.title : item.japanese_title}
          {/* Spotlight Number */}
          <span className="text-white/90 font-extrabold ml-3 text-[32px] max-[1390px]:text-[30px] max-[1300px]:text-[28px] max-md:text-[22px] max-[575px]:text-[20px] leading-none max-[1300px]:ml-2 max-md:ml-1.5">
            #{formatNumber(index + 1, language)}
          </span>
        </h3>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-4 max-[1300px]:mt-3 max-md:mt-2 max-md:gap-1.5 md:gap-3">
          {item.tvInfo && (
            <>
              {item.tvInfo.showType && (
                <div className="badge-item badge-tv">
                  <span className="badge-play-icon">
                    <FontAwesomeIcon icon={faPlay} className="badge-icon" />
                  </span>
                  <span>{translateShowType(item.tvInfo.showType, language)}</span>
                </div>
              )}

              {item.tvInfo.duration && (
                <div className="badge-item badge-duration max-md:hidden">
                  <FontAwesomeIcon icon={faClock} className="badge-icon" />
                  <span>{translateDuration(item.tvInfo.duration, language)}</span>
                </div>
              )}

              {item.tvInfo.releaseDate && (
                <div className="badge-item badge-date max-md:hidden">
                  <FontAwesomeIcon icon={faCalendar} className="badge-icon" />
                  <span>{translateDate(item.tvInfo.releaseDate, language)}</span>
                </div>
              )}

              {item.tvInfo.quality && (
                <div className="badge-item">
                  <span>{translateQuality(item.tvInfo.quality, language)}</span>
                </div>
              )}

              <div className="flex items-center gap-[1px] -ml-1 max-md:ml-0">
                {item.tvInfo.episodeInfo?.sub && (
                  <div className={`badge-item ${item.tvInfo.episodeInfo?.dub ? 'badge-sub' : 'badge-sub-alone'}`}>
                    <FontAwesomeIcon icon={faClosedCaptioning} className="badge-icon" />
                    <span>{translateEpisodeInfo(item.tvInfo.episodeInfo.sub, language)}</span>
                  </div>
                )}

                {item.tvInfo.episodeInfo?.dub && (
                  <div className="badge-item badge-dub">
                    <FontAwesomeIcon icon={faMicrophone} className="badge-icon" />
                    <span>{translateEpisodeInfo(item.tvInfo.episodeInfo.dub, language)}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Description - Desktop shows 3 lines, Mobile shows 2 lines */}
        <p className="text-white/70 text-[17px] font-sm mt-4 text-left line-clamp-3 max-[1200px]:line-clamp-2 max-[1300px]:w-[500px] max-[1120px]:w-[90%] max-md:line-clamp-2 max-md:text-xs max-md:mt-2">
          {item.description}
        </p>

        {/* Mobile Buttons */}
        <div className="hidden max-md:flex max-md:mt-3 max-md:gap-x-3 max-md:w-full">
          <Link
            to={getWatchUrl(item.id)}
            className="bg-white/90 hover:bg-white text-black font-medium px-5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-x-2 text-sm"
          >
            <FontAwesomeIcon
              icon={faPlay}
              className="text-[10px]"
            />
            <span>{getTranslation(language, "watchNow")}</span>
          </Link>
          <Link
            to={`/${item.id}`}
            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium px-5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-x-2 text-sm"
          >
            <span>{getTranslation(language, "viewDetails")}</span>
          </Link>
        </div>
      </div>
      {/* Desktop Buttons */}
      <div className="absolute bottom-[50px] right-[40px] flex gap-x-5 z-[2] max-md:hidden">
        <Link
          to={getWatchUrl(item.id)}
          className="bg-white/90 hover:bg-white text-black font-medium px-7 py-2 rounded-xl transition-all duration-200 flex items-center gap-x-2.5 shadow-lg shadow-black/10 backdrop-blur-sm hover:translate-y-[-1px]"
        >
          <FontAwesomeIcon
            icon={faPlay}
            className="text-[10px]"
          />
          <span>{getTranslation(language, "watchNow")}</span>
        </Link>
        <Link
          to={`/${item.id}`}
          className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium px-7 py-2 rounded-xl transition-all duration-200 flex items-center gap-x-2.5 backdrop-blur-sm hover:translate-y-[-1px]"
        >
          <span>{getTranslation(language, "viewDetails")}</span>
        </Link>
      </div>
    </section>
  );
}

export default Banner;
