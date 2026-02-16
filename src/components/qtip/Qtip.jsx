import BouncingLoader from "../ui/bouncingloader/Bouncingloader";
import getAnimeInfo from "@/src/utils/getAnimeInfo.utils";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faStar,
  faClosedCaptioning,
  faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useLanguage } from "@/src/context/LanguageContext";

// Tag component - exact copy from AnimeInfo.jsx with colored star icon
function Tag({ icon, text }) {
  const isStarIcon = icon === faStar;
  
  return (
    <div className="flex space-x-1 justify-center items-center bg-[#0a0a0a] rounded-md border border-white/10 hover:border-white/20 px-1.5 py-0.5 transition-colors duration-200">
      {icon && (
        <FontAwesomeIcon 
          icon={icon} 
          className={`text-[11px] ${isStarIcon ? 'text-[#ffc107]' : 'text-gray-300'}`}
        />
      )}
      <p className="text-[11px] font-medium text-gray-300">{text}</p>
    </div>
  );
}

function Qtip({ id, animeData = null }) {
  const { language } = useLanguage();
  const [animeInfo, setAnimeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchProgress, setWatchProgress] = useState({});

  useEffect(() => {
    const fetchQtipInfo = async () => {
      setLoading(true);
      try {
        console.log('Fetching full anime info for ID:', id);
        
        // Use getAnimeInfo to get full data just like AnimeInfo.jsx does
        const data = await getAnimeInfo(id);
        console.log('Full anime data received:', data);
        
        if (data?.data) {
          setAnimeInfo(data.data);
        } else {
          setError(new Error('No data available'));
        }
      } catch (err) {
        console.error("Error fetching anime info:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQtipInfo();
  }, [id]);

  // Load continue watching data from localStorage
  useEffect(() => {
    const loadWatchProgress = () => {
      const continueWatchingData = JSON.parse(
        localStorage.getItem("continueWatching") || "[]"
      );
      
      const progressMap = {};
      continueWatchingData.forEach((item) => {
        const animeId = String(item.id);
        if (!progressMap[animeId]) {
          progressMap[animeId] = {
            episodeId: item.episodeId,
            episodeNum: item.episodeNum,
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

  console.log('Qtip render state:', { loading, error: !!error, hasAnimeInfo: !!animeInfo });

  // Helper function to get the correct watch URL
  const getWatchUrl = (animeId) => {
    const progress = watchProgress[String(animeId)];
    if (progress && progress.episodeId) {
      return `/watch/${animeId}?ep=${progress.episodeId}`;
    }
    return `/watch/${animeId}`;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-[280px] h-[100px] rounded-lg overflow-hidden bg-[#0a0a0a] border border-white/10 shadow-2xl z-50 flex items-center justify-center">
        <BouncingLoader />
      </div>
    );
  }

  // Don't render if there's an error or no data
  if (error || !animeInfo) {
    console.log('Qtip not showing because:', { error: error?.message, hasAnimeInfo: !!animeInfo });
    return (
      <div className="w-[280px] h-fit rounded-lg overflow-hidden bg-[#0a0a0a] border border-red-500 shadow-2xl z-50 p-3">
        <p className="text-xs text-red-500">Error loading anime info</p>
        <p className="text-[9px] text-white/50 mt-1">{error?.message || 'No data'}</p>
      </div>
    );
  }

  console.log('Qtip data to display:', animeInfo);

  // Extract data - same as AnimeInfo.jsx
  const { title, japanese_title, animeInfo: info } = animeInfo;
  
  console.log('Extracted info object:', info);
  console.log('MAL Score value:', info?.["MAL Score"]);
  console.log('All info keys:', Object.keys(info || {}));
  
  // Define tags - adding MAL Score as first badge with star icon
  const tags = [
    {
      condition: info?.["MAL Score"],
      icon: faStar,
      text: info?.["MAL Score"],
    },
    {
      condition: info?.tvInfo?.rating,
      text: info?.tvInfo?.rating,
    },
    {
      condition: info?.tvInfo?.quality,
      text: info?.tvInfo?.quality,
    },
    {
      condition: info?.tvInfo?.sub,
      icon: faClosedCaptioning,
      text: info?.tvInfo?.sub,
    },
    {
      condition: info?.tvInfo?.dub,
      icon: faMicrophone,
      text: info?.tvInfo?.dub,
    },
  ];

  return (
    <div className="w-[300px] h-fit rounded-lg overflow-hidden bg-[#0a0a0a] border border-white/10 shadow-2xl z-50">
      {/* Title Section - Bigger and Cleaner */}
      <div className="px-4 pt-3 pb-3 bg-[#0a0a0a] border-b border-white/10">
        <h1 className="text-sm font-bold text-white leading-5 line-clamp-2">
          {language?.toLowerCase() === "en" ? title : (japanese_title || title)}
        </h1>
      </div>

      {/* Info Tags - Same as AnimeInfo.jsx */}
      <div className="px-3 py-2 flex flex-wrap gap-2">
        {tags.map(({ condition, icon, text }, index) =>
          condition && (
            <Tag
              key={index}
              icon={icon}
              text={text}
            />
          )
        )}
      </div>

      {/* Description */}
      {info?.Overview && (
        <div className="px-3 py-2 border-t border-white/10">
          <p className="text-white/70 text-[10px] leading-3 line-clamp-3">
            {info.Overview}
          </p>
        </div>
      )}

      {/* Details Section */}
      <div className="px-3 py-2 border-t border-white/10 space-y-1">
        {info?.Synonyms && (
          <div className="text-[10px]">
            <span className="text-white/50">Synonyms: </span>
            <span className="text-white/90">{info.Synonyms}</span>
          </div>
        )}
        {info?.Aired && (
          <div className="text-[10px]">
            <span className="text-white/50">Aired: </span>
            <span className="text-white/90">{info.Aired}</span>
          </div>
        )}
        {info?.Premiered && (
          <div className="text-[10px]">
            <span className="text-white/50">Premiered: </span>
            <span className="text-white/90">{info.Premiered}</span>
          </div>
        )}
        {info?.Duration && (
          <div className="text-[10px]">
            <span className="text-white/50">Duration: </span>
            <span className="text-white/90">{info.Duration}</span>
          </div>
        )}
        {info?.Status && (
          <div className="text-[10px]">
            <span className="text-white/50">Status: </span>
            <span className="text-white/90">{info.Status}</span>
          </div>
        )}
        {info?.Genres && info.Genres.length > 0 && (
          <div className="text-[10px]">
            <span className="text-white/50">Genres: </span>
            <span className="text-white/90">
              {info.Genres.slice(0, 3).join(", ")}
              {info.Genres.length > 3 && "..."}
            </span>
          </div>
        )}
      </div>

      {/* Watch Now Button */}
      <div className="px-3 py-2 border-t border-white/10">
        <Link
          to={getWatchUrl(animeInfo.id)}
          className="w-full flex justify-center items-center gap-x-2 bg-[#0a0a0a] border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] py-2 rounded-lg transition-colors"
        >
          <FontAwesomeIcon icon={faPlay} className="text-xs text-white" />
          <p className="text-xs font-medium text-white">Watch Now</p>
        </Link>
      </div>
    </div>
  );
}

export default Qtip;
