import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClosedCaptioning,
  faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/src/context/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import useToolTipPosition from "@/src/hooks/useToolTipPosition";
import Qtip from "../qtip/Qtip";
import getSafeTitle from "@/src/utils/getSafetitle";

function Topten({ data, className }) {
  const { language } = useLanguage();
  const [activePeriod, setActivePeriod] = useState("today");
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const navigate = useNavigate();

  const handlePeriodChange = (period) => setActivePeriod(period);

  const handleNavigate = (id) => {
    navigate(`/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentData =
    activePeriod === "today" ? data.today : activePeriod === "week" ? data.week : data.month;

  const { tooltipPosition, tooltipHorizontalPosition, cardRefs } =
    useToolTipPosition(hoveredItem, currentData);

  const handleMouseEnter = (item, index) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoveredItem(item.id + index);
  };

  const handleMouseLeave = () => {
    setHoverTimeout(setTimeout(() => setHoveredItem(null), 300));
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Header - same style as Trending */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-white">Top 10</h2>
        <div className="flex ml-auto">
          <ul className="flex bg-[#0a0a0a] border border-white/5 rounded-lg overflow-hidden">
            {["today", "week", "month"].map((period) => (
              <li
                key={period}
                className={`cursor-pointer py-1 px-3 text-[13px] transition-all duration-200 ${
                  activePeriod === period
                    ? "bg-white text-black font-medium"
                    : "text-gray-400 hover:text-white hover:bg-[#111111]"
                }`}
                onClick={() => handlePeriodChange(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* List - same card style as Trending */}
      <div className="flex flex-col space-y-2 bg-[#0a0a0a] border border-white/5 rounded-lg p-3">
        {currentData &&
          currentData.map((item, index) => (
            <div
              key={index}
              className="group"
              ref={(el) => (cardRefs.current[index] = el)}
            >
              <div
                style={{
                  borderBottom: index + 1 < currentData.length ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
                className="flex items-start gap-3 p-2 pb-3 rounded-lg transition-colors hover:bg-[#111111] relative"
              >
                <span className={`font-bold text-lg w-6 text-center flex-shrink-0 mt-1 ${
                  index < 3 ? "text-white" : "text-white/20"
                }`}>
                  {`${index + 1 < 10 ? "0" : ""}${index + 1}`}
                </span>

                <div className="relative flex-shrink-0">
                  <img
                    src={`${item.poster}`}
                    alt={getSafeTitle(item.title, language, item.japanese_title)}
                    className="w-[50px] h-[70px] rounded object-cover cursor-pointer shadow-md transition-transform duration-200 group-hover:scale-[1.02]"
                    onClick={() => navigate(`/watch/${item.id}`)}
                    onMouseEnter={() => handleMouseEnter(item, index)}
                    onMouseLeave={handleMouseLeave}
                  />
                  {hoveredItem === item.id + index && window.innerWidth > 1024 && (
                    <div
                      className={`absolute ${tooltipPosition} ${tooltipHorizontalPosition} ${
                        tooltipPosition === "top-1/2" ? "translate-y-[50px]" : "translate-y-[-50px]"
                      } z-[100000] transform transition-all duration-300 ease-in-out ${
                        hoveredItem === item.id + index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                      }`}
                      onMouseEnter={() => { if (hoverTimeout) clearTimeout(hoverTimeout); }}
                      onMouseLeave={handleMouseLeave}
                    >
                      <Qtip id={item.id} />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <Link
                    to={`/${item.id}`}
                    className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors line-clamp-2"
                    onClick={() => handleNavigate(item.id)}
                  >
                    {getSafeTitle(item.title, language, item.japanese_title)}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.tvInfo?.sub && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#111111] border border-white/5 rounded text-gray-300">
                        <FontAwesomeIcon icon={faClosedCaptioning} className="text-[10px]" />
                        <span className="text-[10px] font-medium">{item.tvInfo.sub}</span>
                      </div>
                    )}
                    {item.tvInfo?.dub && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#111111] border border-white/5 rounded text-gray-300">
                        <FontAwesomeIcon icon={faMicrophone} className="text-[10px]" />
                        <span className="text-[10px] font-medium">{item.tvInfo.dub}</span>
                      </div>
                    )}
                    {item.tvInfo?.showType && (
                      <span className="text-xs text-gray-400">{item.tvInfo.showType}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default React.memo(Topten);
