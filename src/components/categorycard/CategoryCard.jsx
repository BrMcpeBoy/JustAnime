import React, { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClosedCaptioning,
  faMicrophone,
  faPlay,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { FaChevronRight } from "react-icons/fa";
import "./CategoryCard.css";
import { useLanguage } from "@/src/context/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import getAnimeInfo from "@/src/utils/getAnimeInfo.utils";
import { getTranslation, translateEpisodeInfo, translateDuration } from "@/src/translations/translations";
import { formatNumber } from "@/src/utils/numberConverter";

const CategoryCard = React.memo(
  ({
    label,
    data,
    showViewMore = true,
    className,
    categoryPage = false,
    cardStyle,
    path,
    limit,
    continueWatching = [], // Accept continue watching data as prop
  }) => {
    const { language, titleLanguage } = useLanguage();
    const navigate = useNavigate();
    const [malScores, setMalScores] = useState({});
    const [watchProgress, setWatchProgress] = useState({});
    
    if (limit) {
      data = data.slice(0, limit);
    }

    const [itemsToRender, setItemsToRender] = useState({
      firstRow: [],
      remainingItems: [],
    });

    const getItemsToRender = useCallback(() => {
      // No special first row - all items rendered the same way
      return { firstRow: [], remainingItems: data.slice(0) };
    }, [data]);

    useEffect(() => {
      const handleResize = () => {
        setItemsToRender(getItemsToRender());
      };
      setItemsToRender(getItemsToRender());
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, [getItemsToRender]);

    // Load continue watching data from localStorage
    useEffect(() => {
      const loadWatchProgress = () => {
        const continueWatchingData = JSON.parse(
          localStorage.getItem("continueWatching") || "[]"
        );
        
        // Create a map of anime ID to episode info
        const progressMap = {};
        continueWatchingData.forEach((item) => {
          const animeId = String(item.id);
          // Only keep the first occurrence (latest episode)
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

      // Listen for storage changes
      const handleStorageChange = (e) => {
        if (e.key === "continueWatching") {
          loadWatchProgress();
        }
      };

      // Listen for custom event from same window
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

    // Fetch all MAL Scores on mount — parallel, runs only once
    const malFetched = React.useRef(false);
    useEffect(() => {
      if (malFetched.current) return;
      const allItems = [...itemsToRender.firstRow, ...itemsToRender.remainingItems];
      if (allItems.length === 0) return;
      malFetched.current = true;

      const fetchAllMalScores = async () => {
        const results = await Promise.all(
          allItems.map(async (item) => {
            try {
              const animeData = await getAnimeInfo(item.id);
              const score = animeData?.data?.animeInfo?.["MAL Score"];
              return score ? { id: item.id, score } : null;
            } catch {
              return null;
            }
          })
        );
        const scores = {};
        results.forEach((r) => { if (r) scores[r.id] = r.score; });
        if (Object.keys(scores).length > 0) setMalScores(scores);
      };

      fetchAllMalScores();
    }, [itemsToRender]);

    // Helper function to get the correct watch URL
    const getWatchUrl = (item) => {
      if (path === "top-upcoming") {
        return `/${item.id}`;
      }
      
      // Check if user has watch progress for this anime
      const progress = watchProgress[String(item.id)];
      if (progress && progress.episodeId) {
        return `/watch/${item.id}?ep=${progress.episodeId}`;
      }
      
      // Default to watch page (will start from episode 1)
      return `/watch/${item.id}`;
    };

    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-between mb-5 max-md:mb-4">
          <h1 className="font-bold text-2xl text-white tracking-tight max-[450px]:text-xl max-[350px]:text-lg">
            {label}
          </h1>
          {showViewMore && (
            <Link
              to={`/${path}`}
              className="flex items-center gap-x-1 py-1 px-2 -mr-2 rounded-md
                text-[13px] font-medium text-[#ffffff80] hover:text-white
                transition-all duration-300 group"
            >
              {getTranslation(language, 'viewAll')}
              <FaChevronRight className="text-[10px] transform transition-transform duration-300 
                group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
        <>
          {categoryPage && (
            <div
              className={`grid grid-cols-6 max-[1400px]:grid-cols-4 max-[758px]:grid-cols-3 max-[478px]:grid-cols-2 gap-x-3 gap-y-8 max-[478px]:gap-y-6 transition-all duration-300 ease-in-out max-[478px]:gap-x-2 ${
                categoryPage && itemsToRender.firstRow.length > 0
                  ? "mt-8 max-[758px]:hidden"
                  : ""
              }`}
            >
              {itemsToRender.firstRow.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col category-card-container"
                  style={{ height: "fit-content" }}
                >
                  <div className="w-full h-auto pb-[140%] relative inline-block overflow-hidden rounded-lg shadow-lg group">
                    <div
                      className="inline-block bg-gray-900 absolute left-0 top-0 w-full h-full group hover:cursor-pointer"
                      onClick={() => navigate(getWatchUrl(item))}
                    >
                      <img
                        src={`${item.poster}`}
                        alt={item.title}
                        loading="lazy"
                        className="block w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <FontAwesomeIcon
                            icon={faPlay}
                            className="text-[50px] text-white drop-shadow-lg max-[450px]:text-[36px]"
                          />
                        </div>
                      </div>
                    </div>
                    {(item.tvInfo?.rating === "18+" ||
                      item?.adultContent === true) && (
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-red-600/90 flex items-center justify-center">
                        <span className="text-white text-[11px] font-semibold">18+</span>
                      </div>
                    )}
                    {malScores[item.id] && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/70 flex items-center gap-1">
                        <FontAwesomeIcon icon={faStar} className="text-[#ffc107] text-[10px]" />
                        <span className="text-white text-[11px] font-semibold">
                          {formatNumber(malScores[item.id], language)}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3 pb-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                      <div className="flex flex-wrap items-center gap-0.5 z-[100]">
                        {item.tvInfo?.sub && (
                          <div className="badge-item px-1.5 py-0.5 text-[11px] min-w-0 h-5 leading-4 gap-x-0.5 !items-center" style={{minWidth:'unset'}}>
                            <FontAwesomeIcon icon={faClosedCaptioning} className="badge-icon text-[12px]" />
                            <span>{translateEpisodeInfo(item.tvInfo.sub, language)}</span>
                          </div>
                        )}
                        {item.tvInfo?.dub && (
                          <div className="badge-item px-1.5 py-0.5 text-[11px] min-w-0 h-5 leading-4 gap-x-0.5 !items-center" style={{minWidth:'unset'}}>
                            <FontAwesomeIcon icon={faMicrophone} className="badge-icon text-[12px]" />
                            <span>{translateEpisodeInfo(item.tvInfo.dub, language)}</span>
                          </div>
                        )}
                        {item.tvInfo?.showType && (
                          <div className="badge-item px-1.5 py-0.5 text-[11px] min-w-0 h-5 leading-4 gap-x-0.5 !items-center" style={{minWidth:'unset'}}>
                            <span>{item.tvInfo.showType.split(" ").shift()}</span>
                          </div>
                        )}
                        {item.releaseDate && (
                          <div className="badge-item px-1.5 py-0.5 text-[11px] min-w-0 h-5 leading-4 gap-x-0.5 !items-center" style={{minWidth:'unset'}}>
                            <span>{item.releaseDate}</span>
                          </div>
                        )}
                        {!item.tvInfo?.showType && item.type && (
                          <div className="badge-item px-1.5 py-0.5 text-[11px] min-w-0 h-5 leading-4 gap-x-0.5 !items-center" style={{minWidth:'unset'}}>
                            <span>{item.type}</span>
                          </div>
                        )}
                        {(item.tvInfo?.duration || item.duration) && (
                          <div className="badge-item px-1.5 py-0.5 text-[11px] min-w-0 h-5 leading-4 gap-x-0.5 !items-center" style={{minWidth:'unset'}}>
                            <span>
                              {item.tvInfo?.duration === "m" ||
                              item.tvInfo?.duration === "?" ||
                              item.duration === "m" ||
                              item.duration === "?"
                                ? "N/A"
                                : translateDuration(item.tvInfo?.duration || item.duration || "N/A", language)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/${item.id}`}
                    className="text-white font-semibold mt-3 max-[478px]:mt-2 item-title hover:text-white hover:cursor-pointer line-clamp-1"
                  >
                    {titleLanguage === "en" ? item.title : item.japanese_title}
                  </Link>
                </div>
              ))}
            </div>
          )}
          <div className={`grid ${cardStyle || 'grid-cols-6 max-[1400px]:grid-cols-4 max-[758px]:grid-cols-3 max-[478px]:grid-cols-2'} gap-x-3 gap-y-8 max-[478px]:gap-y-6 transition-all duration-300 ease-in-out max-[478px]:gap-x-2`}>
            {itemsToRender.remainingItems.map((item, index) => (
              <div
                key={index}
                className="flex flex-col transition-transform duration-300 ease-in-out"
                style={{ height: "fit-content" }}
              >
                <div className="w-full h-auto pb-[140%] relative inline-block overflow-hidden rounded-lg shadow-lg group">
                  <div
                    className="inline-block bg-gray-900 absolute left-0 top-0 w-full h-full group hover:cursor-pointer"
                    onClick={() => navigate(getWatchUrl(item))}
                  >
                    <img
                      src={`${item.poster}`}
                      alt={item.title}
                      loading="lazy"
                      className="block w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <FontAwesomeIcon
                          icon={faPlay}
                          className="text-[50px] text-white drop-shadow-lg max-[450px]:text-[36px]"
                        />
                      </div>
                    </div>
                  </div>
                  {(item.tvInfo?.rating === "18+" ||
                    item?.adultContent === true) && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-red-600/90 flex items-center justify-center">
                      <span className="text-white text-[11px] font-semibold">18+</span>
                    </div>
                  )}
                  {malScores[item.id] && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/70 flex items-center gap-1">
                      <FontAwesomeIcon icon={faStar} className="text-[#ffc107] text-[10px]" />
                      <span className="text-white text-[11px] font-semibold">
                        {formatNumber(malScores[item.id], language)}
                      </span>
                    </div>
                  )}
                    <div className="absolute bottom-0 left-0 right-0 p-3 pb-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                      <div className="flex flex-wrap items-center gap-0.5 z-[100]">
                        {item.tvInfo?.sub && (
                          <div className="badge-item px-1.5 py-0.5 text-[11px] min-w-0 h-5 leading-4 gap-x-0.5 !items-center" style={{minWidth:'unset'}}>
                            <FontAwesomeIcon icon={faClosedCaptioning} className="badge-icon text-[12px]" />
                            <span>{translateEpisodeInfo(item.tvInfo.sub, language)}</span>
                          </div>
                        )}
                        {item.tvInfo?.dub && (
                          <div className="badge-item px-1.5 py-0.5 text-[11px] min-w-0 h-5 leading-4 gap-x-0.5 !items-center" style={{minWidth:'unset'}}>
                            <FontAwesomeIcon icon={faMicrophone} className="badge-icon text-[12px]" />
                            <span>{translateEpisodeInfo(item.tvInfo.dub, language)}</span>
                          </div>
                        )}
                        {item.tvInfo?.showType && (
                          <div className="badge-item px-1.5 py-0.5 text-[11px] min-w-0 h-5 leading-4 gap-x-1 !items-center" style={{minWidth:'unset'}}>
                            <span>{item.tvInfo.showType.split(" ").shift()}</span>
                          </div>
                        )}
                        {item.releaseDate && (
                          <div className="badge-item px-1.5 py-0.5 text-[11px] min-w-0 h-5 leading-4 gap-x-0.5 !items-center" style={{minWidth:'unset'}}>
                            <span>{item.releaseDate}</span>
                          </div>
                        )}
                        {!item.tvInfo?.showType && item.type && (
                          <div className="badge-item px-1.5 py-0.5 text-[11px] min-w-0 h-5 leading-4 gap-x-0.5 !items-center" style={{minWidth:'unset'}}>
                            <span>{item.type}</span>
                          </div>
                        )}
                        {(item.tvInfo?.duration || item.duration) && (
                          <div className="badge-item px-1.5 py-0.5 text-[11px] min-w-0 h-5 leading-4 gap-x-1 !items-center" style={{minWidth:'unset'}}>
                            <span>
                              {item.tvInfo?.duration === "m" ||
                              item.tvInfo?.duration === "?" ||
                              item.duration === "m" ||
                              item.duration === "?"
                                ? "N/A"
                                : translateDuration(item.tvInfo?.duration || item.duration || "N/A", language)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                </div>
                <Link
                  to={`/${item.id}`}
                  className="text-white font-semibold mt-3 max-[478px]:mt-2 item-title hover:text-white hover:cursor-pointer line-clamp-1"
                >
                  {titleLanguage === "en" ? item.title : item.japanese_title}
                </Link>
              </div>
            ))}
          </div>
        </>
      </div>
    );
  }
);

CategoryCard.displayName = "CategoryCard";

export default CategoryCard;
