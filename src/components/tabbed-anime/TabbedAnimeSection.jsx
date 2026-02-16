import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import CategoryCard from "@/src/components/categorycard/CategoryCard.jsx";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";
import getCategoryInfo from "@/src/utils/getCategoryInfo.utils.js";

function TabbedAnimeSection({ topAiring, mostFavorite, latestCompleted, className = "" }) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("airing");
  const [movieData, setMovieData] = useState([]);
  const [tvData, setTvData] = useState([]);
  const [specialData, setSpecialData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch additional category data on mount
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        const [movies, tvSeries, specials] = await Promise.all([
          getCategoryInfo("movie", 1),
          getCategoryInfo("tv", 1),
          getCategoryInfo("special", 1),
        ]);
        
        setMovieData(movies?.data || []);
        setTvData(tvSeries?.data || []);
        setSpecialData(specials?.data || []);
      } catch (error) {
        console.error("Error fetching category data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, []);

  const tabs = [
    { id: "airing", labelKey: "topAiring", data: topAiring, path: "top-airing" },
    { id: "favorite", labelKey: "mostFavorite", data: mostFavorite, path: "most-favorite" },
    { id: "completed", labelKey: "latestCompleted", data: latestCompleted, path: "completed" },
    { id: "movie", labelKey: "movie", data: movieData, path: "movie" },
    { id: "tv", labelKey: "tvSeries", data: tvData, path: "tv" },
    { id: "special", labelKey: "special", data: specialData, path: "special" },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 relative pb-0 sm:pb-0">
        {/* Mobile: Show first 3 tabs + View All */}
        <div className="grid grid-cols-4 sm:hidden w-full gap-0">
          {tabs.slice(0, 3).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3 py-3 text-[13px] font-medium transition-all duration-300 
                ${activeTab === tab.id 
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-white after:rounded-t-full"
                  : "text-[#ffffff80] hover:text-white"
                }
                before:absolute before:bottom-0 before:left-1/2 before:w-0 before:h-[2px] before:bg-[#ffffff40]
                before:transition-all before:duration-300 before:-translate-x-1/2
                hover:before:w-full
                group
              `}
            >
              <span className="relative z-10 transition-transform duration-300 group-hover:transform group-hover:translate-y-[-1px]">
                {getTranslation(language, tab.labelKey)}
              </span>
            </button>
          ))}
          <Link
            to={`/${activeTabData.path}`}
            className="flex items-center justify-center gap-x-1 py-3 px-3 rounded-md
              text-[13px] font-medium text-[#ffffff80] hover:text-white
              transition-all duration-300 group"
          >
            {getTranslation(language, 'viewAll')}
            <FaChevronRight className="text-[10px] transform transition-transform duration-300 
              group-hover:translate-x-0.5" />
          </Link>
        </div>
        
        {/* Desktop: Show all tabs */}
        <div className="hidden sm:flex w-full items-center justify-between gap-2">
          <div className="flex gap-0 flex-wrap items-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 md:px-4 lg:px-5 py-3 lg:py-4 text-[13px] md:text-[14px] lg:text-[15px] font-medium transition-all duration-300 whitespace-nowrap
                  ${activeTab === tab.id 
                    ? "text-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-white after:rounded-t-full"
                    : "text-[#ffffff80] hover:text-white"
                  }
                  before:absolute before:bottom-0 before:left-1/2 before:w-0 before:h-[2px] before:bg-[#ffffff40]
                  before:transition-all before:duration-300 before:-translate-x-1/2
                  hover:before:w-full
                  group
                `}
              >
                <span className="relative z-10 transition-transform duration-300 group-hover:transform group-hover:translate-y-[-1px]">
                  {getTranslation(language, tab.labelKey)}
                </span>
              </button>
            ))}
          </div>
          
          <Link
            to={`/${activeTabData.path}`}
            className="flex items-center gap-x-1 py-1 px-2 rounded-md flex-shrink-0
              text-[13px] font-medium text-[#ffffff80] hover:text-white
              transition-all duration-300 group"
          >
            {getTranslation(language, 'viewAll')}
            <FaChevronRight className="text-[10px] transform transition-transform duration-300 
              group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {loading && !activeTabData.data?.length ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      ) : (
        <CategoryCard
          data={activeTabData.data}
          path={activeTabData.path}
          limit={12}
          showViewMore={false}
        />
      )}
    </div>
  );
}

TabbedAnimeSection.propTypes = {
  topAiring: PropTypes.array.isRequired,
  mostFavorite: PropTypes.array.isRequired,
  latestCompleted: PropTypes.array.isRequired,
  className: PropTypes.string,
};

export default TabbedAnimeSection; 
