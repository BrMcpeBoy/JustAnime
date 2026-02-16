import { useState } from "react";
import { useLanguage } from "@/src/context/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { FaChevronRight } from "react-icons/fa";
import useToolTipPosition from "@/src/hooks/useToolTipPosition";
import Qtip from "../qtip/Qtip";
import { getTranslation } from "@/src/translations/translations";
import { formatNumber } from "@/src/utils/numberConverter";

const TopUpcoming = ({ topUpcoming, className }) => {
  const { language, titleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  // Limit to 10 items
  const displayData = topUpcoming ? topUpcoming.slice(0, 10) : [];

  const handleNavigate = (id) => {
    navigate(`/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { tooltipPosition, tooltipHorizontalPosition, cardRefs } =
    useToolTipPosition(hoveredItem, displayData);

  const handleMouseEnter = (item, index) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoveredItem(item.id + index);
  };

  const handleMouseLeave = () => {
    setHoverTimeout(
      setTimeout(() => {
        setHoveredItem(null);
      }, 300) // Small delay to prevent flickering
    );
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-2xl text-white tracking-tight">
          {getTranslation(language, 'topUpcoming')}
        </h1>
      </div>

      <div className="flex flex-col space-y-3 bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors p-3 pt-6 rounded-lg shadow-lg">
        {displayData &&
          displayData.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-x-3 group"
              ref={(el) => (cardRefs.current[index] = el)}
            >
              <h1
                className={`font-bold text-2xl transition-colors ${
                  index < 3
                    ? "text-white border-b-2 border-white pb-0.5"
                    : "text-gray-600"
                } max-[350px]:hidden`}
              >
                {formatNumber(`${index + 1 < 10 ? "0" : ""}${index + 1}`, language)}
              </h1>
              <div
                style={{
                  borderBottom:
                    index + 1 < 10
                      ? "1px solid rgba(255, 255, 255, .1)"
                      : "none",
                }}
                className="flex pb-3 relative container items-center group-hover:bg-[#2a2a2a] transition-colors duration-200 rounded-lg p-1.5"
              >
                <img
                  src={`${item.poster}`}
                  alt={item.title}
                  className="w-[55px] h-[70px] rounded-lg object-cover flex-shrink-0 cursor-pointer shadow-md transition-transform duration-200 group-hover:scale-[1.02]"
                  onClick={() => navigate(`/${item.id}`)}
                  onMouseEnter={() => handleMouseEnter(item, index)}
                  onMouseLeave={handleMouseLeave}
                />

                {/* Tooltip positioned near image */}
                {hoveredItem === item.id + index &&
                  window.innerWidth > 1024 && (
                    <div
                      className={`absolute ${tooltipPosition} ${tooltipHorizontalPosition} 
                      ${
                        tooltipPosition === "top-1/2"
                          ? "translate-y-[50px]"
                          : "translate-y-[-50px]"
                      } 
                      z-[100000] transform transition-all duration-300 ease-in-out 
                      ${
                        hoveredItem === item.id + index
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-2"
                      }`}
                      onMouseEnter={() => {
                        if (hoverTimeout) clearTimeout(hoverTimeout);
                      }}
                      onMouseLeave={handleMouseLeave}
                    >
                      <Qtip id={item.id} />
                    </div>
                  )}

                <div className="flex flex-col ml-3 space-y-1.5">
                  <Link
                    to={`/${item.id}`}
                    className="text-[0.95em] font-medium text-gray-200 hover:text-white transform transition-all ease-out line-clamp-1 max-[478px]:line-clamp-2 max-[478px]:text-[14px]"
                    onClick={() => handleNavigate(item.id)}
                  >
                    {titleLanguage === "en" ? item.title : item.japanese_title}
                  </Link>
                  <div className="flex flex-wrap items-center w-fit space-x-2 max-[350px]:gap-y-[3px]">
                    {item.releaseDate && (
                      <div className="flex space-x-1 justify-center items-center bg-[#0a0a0a] rounded-md border border-white/10 hover:border-white/20 px-1.5 py-0.5 transition-colors duration-200 hover:bg-opacity-20">
                        <FontAwesomeIcon
                          icon={faCalendar}
                          className="text-[11px] text-gray-300"
                        />
                        <p className="text-[11px] font-medium text-gray-300">
                          {item.releaseDate}
                        </p>
                      </div>
                    )}
                    {item.type && (
                      <div className="flex space-x-1 justify-center items-center bg-[#0a0a0a] rounded-md border border-white/10 hover:border-white/20 px-1.5 py-0.5 transition-colors duration-200 hover:bg-opacity-20">
                        <p className="text-[11px] font-medium text-gray-300">
                          {item.type}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        
        {/* View All Button */}
        <Link
          to="/top-upcoming"
          className="flex items-center justify-center gap-x-2 py-3 px-4 mt-2
            rounded-lg border border-white/10 hover:border-white/20
            bg-[#111111] hover:bg-[#1a1a1a]
            text-[13px] font-medium text-white/80 hover:text-white
            transition-all duration-300 group"
        >
          {getTranslation(language, 'viewAll')}
          <FaChevronRight className="text-[10px] transform transition-transform duration-300 
            group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};

export default TopUpcoming;
