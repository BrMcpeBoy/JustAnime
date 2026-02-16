import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { FaHistory, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useLanguage } from "@/src/context/LanguageContext";
import { useAuth } from "@/src/context/AuthContext";
import { updateAniListProgress } from "@/src/utils/updateAniListProgress";
import { getAniListMediaId } from "@/src/utils/getAniListMediaId";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import { getTranslation } from "@/src/translations/translations";
import { formatNumber } from "@/src/utils/numberConverter";

const ContinueWatching = () => {
  const [watchList, setWatchList] = useState([]);
  const { language, titleLanguage } = useLanguage();
  const { isAuthenticated } = useAuth ? useAuth() : { isAuthenticated: false };
  const swiperRef = useRef(null);

  useEffect(() => {
    // Load initial data
    const data = JSON.parse(localStorage.getItem("continueWatching") || "[]");
    
    // Deduplicate on load - keep only the latest episode for each anime
    const seen = new Map();
    const cleanedData = [];
    for (const item of data) {
      const animeId = String(item.id);
      if (!seen.has(animeId)) {
        seen.set(animeId, true);
        cleanedData.push(item);
      }
    }
    
    // If there were duplicates, clean up localStorage
    if (cleanedData.length < data.length) {
      localStorage.setItem("continueWatching", JSON.stringify(cleanedData));
      console.log(`🧹 Cleaned up ${data.length - cleanedData.length} duplicate entries from Continue Watching`);
    }
    
    setWatchList(cleanedData);

    // Listen for storage changes from watch.jsx
    const handleStorageChange = (e) => {
      if (e.key === "continueWatching") {
        const updatedData = JSON.parse(e.newValue || "[]");
        setWatchList(updatedData);
      }
    };

    // Also listen for changes from the same window (watch.jsx updates)
    const handleLocalStorageChange = () => {
      const updatedData = JSON.parse(localStorage.getItem("continueWatching") || "[]");
      setWatchList(updatedData);
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Custom event listener for same-window updates
    window.addEventListener("continueWatchingUpdated", handleLocalStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("continueWatchingUpdated", handleLocalStorageChange);
    };
  }, []);

  const memoizedWatchList = useMemo(() => {
    // Deduplicate by anime ID - keep only the latest episode for each anime
    const seen = new Map();
    const deduplicatedList = [];
    
    // Iterate through the list and keep only the first occurrence of each anime ID
    for (const item of watchList) {
      const animeId = String(item.id);
      if (!seen.has(animeId)) {
        seen.set(animeId, true);
        deduplicatedList.push(item);
      }
    }
    
    return deduplicatedList;
  }, [watchList]);

  const removeFromWatchList = (episodeId) => {
    setWatchList((prevList) => {
      const updatedList = prevList.filter(
        (item) => item.episodeId !== episodeId
      );
      localStorage.setItem("continueWatching", JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const handleContinueWatching = async (item) => {
    // Sync episode to AniList when user clicks continue watching
    if (isAuthenticated && item?.title) {
      try {
        const accessToken = localStorage.getItem('anilist_token');
        if (!accessToken) return;

        console.log(`📚 Continue Watching: Syncing Episode ${item.episodeNum} (${item.title})`);
        
        // Get AniList media ID
        const anilistMediaId = await getAniListMediaId(item.title);
        console.log(`✅ Got AniList ID: ${anilistMediaId}`);

        // Update progress on AniList
        await updateAniListProgress({
          accessToken,
          mediaId: anilistMediaId,
          progress: Number(item.episodeNum) || 1,
        });

        // Update sync stats
        const syncStats = JSON.parse(localStorage.getItem('syncStats') || '{}');
        syncStats.episodesSynced = (syncStats.episodesSynced || 0) + 1;
        syncStats.lastSync = new Date().toLocaleString();
        syncStats.lastSyncedAnime = item.title;
        localStorage.setItem('syncStats', JSON.stringify(syncStats));

        console.log(`✅ Episode ${item.episodeNum} marked as watched on AniList!`);
      } catch (err) {
        console.error('❌ Failed to sync to AniList:', err);
      }
    }
  };

  if (memoizedWatchList.length === 0) return null;

  return (
    <div className="mt-6 max-md:mt-3">
      <div className="flex items-center justify-between mb-6 max-md:mb-4">
        <div className="flex items-center gap-x-3">
          <FaHistory className="text-gray-200 text-xl" />
          <h1 className="text-gray-200 text-2xl font-bold tracking-tight max-[450px]:text-xl max-[350px]:text-lg">
            {getTranslation(language, 'continueWatching')}
          </h1>
        </div>

        <div className="flex gap-x-3 max-[350px]:hidden">
          <button className="continue-btn-prev bg-[#0a0a0a] text-white p-2.5 rounded-xl hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 transition-all duration-300">
            <FaChevronLeft className="text-sm" />
          </button>
          <button className="continue-btn-next bg-[#0a0a0a] text-white p-2.5 rounded-xl hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 transition-all duration-300">
            <FaChevronRight className="text-sm" />
          </button>
        </div>
      </div>

      <div className="relative mx-auto overflow-hidden z-[1]">
        <Swiper
          ref={swiperRef}
          className="w-full h-full"
          slidesPerView={3}
          spaceBetween={20}
          breakpoints={{
            640: { slidesPerView: 4, spaceBetween: 20 },
            768: { slidesPerView: 4, spaceBetween: 20 },
            1024: { slidesPerView: 5, spaceBetween: 24 },
            1300: { slidesPerView: 6, spaceBetween: 24 },
            1600: { slidesPerView: 7, spaceBetween: 28 },
          }}
          modules={[Navigation]}
          navigation={{
            nextEl: ".continue-btn-next",
            prevEl: ".continue-btn-prev",
          }}
        >
          {memoizedWatchList.slice().map((item, index) => (
            <SwiperSlide
              key={index}
              className="text-center flex justify-center items-center"
            >
              <div className="w-full h-auto pb-[140%] relative inline-block overflow-hidden rounded-lg shadow-lg group">
                <button
                  className="absolute top-3 right-3 bg-black/70 text-gray-300 w-8 h-8 flex items-center justify-center rounded-lg text-sm z-10 font-medium hover:bg-white hover:text-black transition-all duration-300"
                  onClick={() => removeFromWatchList(item.episodeId)}
                >
                  ✖
                </button>

                <Link
                  to={`/watch/${item?.id}?ep=${item.episodeId}`}
                  onClick={() => handleContinueWatching(item)}
                  className="inline-block bg-gray-900 absolute left-0 top-0 w-full h-full group"
                >
                  <img
                    src={`${item?.poster}`}
                    alt={item?.title}
                    className="block w-full h-full object-cover transition-all duration-500 ease-in-out group-hover:scale-105 group-hover:blur-sm"
                    title={item?.title}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <FontAwesomeIcon
                        icon={faPlay}
                        className="text-[50px] text-white drop-shadow-lg max-[450px]:text-[36px]"
                      />
                    </div>
                  </div>
                </Link>
                {item?.adultContent === true && (
                  <div className="text-white px-2 py-0.5 rounded-lg bg-red-600 absolute top-3 left-3 flex items-center justify-center text-[12px] font-bold">
                    18+
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3 pb-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                  <p className="text-white text-[15px] font-bold text-left truncate mb-1.5 max-[450px]:text-sm drop-shadow-lg">
                    {titleLanguage === "en"
                      ? item?.title
                      : item?.japanese_title}
                  </p>
                  <p className="text-gray-200 text-[13px] font-semibold text-left max-[450px]:text-[12px] drop-shadow-md">
                    {getTranslation(language, 'episode')} {formatNumber(item.episodeNum, language)}
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default ContinueWatching;
