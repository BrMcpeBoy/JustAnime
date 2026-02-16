import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";
import { formatNumber } from "@/src/utils/numberConverter";
import {
  faAngleDown,
  faCirclePlay,
  faList,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useRef } from "react";
import "./Episodelist.css";

function Episodelist({
  episodes,
  onEpisodeClick,
  currentEpisode,
  totalEpisodes,
}) {
  const [activeEpisodeId, setActiveEpisodeId] = useState(currentEpisode);
  const { language, titleLanguage } = useLanguage();
  const listContainerRef = useRef(null);
  const activeEpisodeRef = useRef(null);
  const [showDropDown, setShowDropDown] = useState(false);
  const [selectedRange, setSelectedRange] = useState([1, 100]);
  const [activeRange, setActiveRange] = useState("1-100");
  const [episodeNum, setEpisodeNum] = useState(currentEpisode);
  const dropDownRef = useRef(null);
  const [searchedEpisode, setSearchedEpisode] = useState(null);

  const scrollToActiveEpisode = () => {
    if (activeEpisodeRef.current && listContainerRef.current) {
      const container = listContainerRef.current;
      const activeEpisode = activeEpisodeRef.current;
      const containerTop = container.getBoundingClientRect().top;
      const containerHeight = container.clientHeight;
      const activeEpisodeTop = activeEpisode.getBoundingClientRect().top;
      const activeEpisodeHeight = activeEpisode.clientHeight;
      const offset = activeEpisodeTop - containerTop;
      container.scrollTop =
        container.scrollTop +
        offset -
        containerHeight / 2 +
        activeEpisodeHeight / 2;
    }
  };
  
  useEffect(() => {
    setActiveEpisodeId(episodeNum);
  }, [episodeNum]);
  
  useEffect(() => {
    scrollToActiveEpisode();
  }, [activeEpisodeId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropDownRef.current && !dropDownRef.current.contains(event.target)) {
        setShowDropDown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    if (value.trim() === "") {
      const newRange = findRangeForEpisode(1);
      setSelectedRange(newRange);
      setActiveRange(`${newRange[0]}-${newRange[1]}`);
      setSearchedEpisode(null);
    } else if (!value || isNaN(value)) {
      setSearchedEpisode(null);
    } else if (
      !isNaN(value) &&
      parseInt(value, 10) > totalEpisodes &&
      episodeNum !== null
    ) {
      const newRange = findRangeForEpisode(episodeNum);
      setSelectedRange(newRange);
      setActiveRange(`${newRange[0]}-${newRange[1]}`);
      setSearchedEpisode(null);
    } else if (!isNaN(value) && value.trim() !== "") {
      const num = parseInt(value, 10);
      const foundEpisode = episodes.find((item) => item?.episode_no === num);
      if (foundEpisode) {
        const newRange = findRangeForEpisode(num);
        setSelectedRange(newRange);
        setActiveRange(`${newRange[0]}-${newRange[1]}`);
        setSearchedEpisode(foundEpisode?.id);
      }
    } else {
      setSearchedEpisode(null);
    }
  }

  function findRangeForEpisode(episodeNumber) {
    const step = 100;
    const start = Math.floor((episodeNumber - 1) / step) * step + 1;
    const end = Math.min(start + step - 1, totalEpisodes);
    return [start, end];
  }

  function generateRangeOptions(totalEpisodes) {
    const ranges = [];
    const step = 100;

    for (let i = 0; i < totalEpisodes; i += step) {
      const start = i + 1;
      const end = Math.min(i + step, totalEpisodes);
      ranges.push({ start, end, label: `${start}-${end}` });
    }
    return ranges;
  }

  useEffect(() => {
    if (currentEpisode && episodeNum) {
      if (episodeNum < selectedRange[0] || episodeNum > selectedRange[1]) {
        const newRange = findRangeForEpisode(episodeNum);
        setSelectedRange(newRange);
        setActiveRange(`${newRange[0]}-${newRange[1]}`);
      }
    }
  }, [currentEpisode, totalEpisodes, episodeNum]);

  const handleRangeSelect = (range) => {
    const [start, end] = range.split("-").map(Number);
    setSelectedRange([start, end]);
  };

  useEffect(() => {
    const activeEpisode = episodes.find(
      (item) => item?.id.match(/ep=(\d+)/)?.[1] === activeEpisodeId
    );
    if (activeEpisode) {
      setEpisodeNum(activeEpisode?.episode_no);
    }
  }, [activeEpisodeId, episodes]);

  return (
    <div className="flex flex-col w-full h-full max-w-sm max-[600px]:max-w-full bg-[#0a0a0a] rounded-lg overflow-hidden max-[1200px]:max-w-full max-[1200px]:bg-transparent max-[1200px]:border-0 max-[1200px]:rounded-none">
      {/* Header - Inside Border */}
      <div className="sticky top-0 z-10 flex flex-col bg-[#0a0a0a] max-[1200px]:bg-[#0a0a0a]">
        <div className="flex items-center justify-between px-5 py-2.5">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-semibold text-white">
              {getTranslation(language, "episodes")}
            </h1>
            {totalEpisodes > 100 && (
              <div className="flex items-center">
                <div
                  onClick={() => setShowDropDown((prev) => !prev)}
                  className="text-gray-300 relative cursor-pointer flex items-center gap-2 hover:text-white transition-colors"
                  ref={dropDownRef}
                >
                  <FontAwesomeIcon icon={faList} className="text-gray-400" />
                  <p className="text-[12px]">
                    {formatNumber(selectedRange[0], language)}-{formatNumber(selectedRange[1], language)}
                  </p>
                  <FontAwesomeIcon
                    icon={faAngleDown}
                    className="text-[10px]"
                  />
                  {showDropDown && (
                    <div className="absolute top-full mt-2 left-0 z-30 bg-[#000000] w-[150px] max-h-[200px] overflow-y-auto rounded-lg border border-[#3a3a3a] shadow-lg">
                      {generateRangeOptions(totalEpisodes).map((rangeObj, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            handleRangeSelect(rangeObj.label);
                            setActiveRange(rangeObj.label);
                          }}
                          className={`hover:bg-[#0a0a0a] cursor-pointer transition-colors ${
                            rangeObj.label === activeRange ? "bg-[#1a1a1a]" : ""
                          }`}
                        >
                          <p className="font-medium text-[12px] p-2.5 flex justify-between items-center text-gray-300 hover:text-white">
                            {formatNumber(rangeObj.start, language)}-{formatNumber(rangeObj.end, language)}
                            {rangeObj.label === activeRange ? (
                              <FontAwesomeIcon icon={faCheck} className="text-white" />
                            ) : null}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

                    {totalEpisodes > 100 && (
            <div className="flex items-center ml-auto">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#000000] rounded-lg border border-[#2a2a2a] focus-within:border-gray-500 transition-colors w-[160px] max-[600px]:w-[130px]">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="text-[12px] text-gray-400 flex-shrink-0 mr-0.5"
                />
                <input
                  type="number"
                  className="w-full bg-transparent focus:outline-none text-[12px] text-white placeholder:text-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder={getTranslation(language, "searchEpisode")}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
        </div>
        <div className="h-px bg-white/10"></div>
      </div>

      {/* Episodes List Container - No Additional Border */}
      <div
        ref={listContainerRef}
        className="w-full flex-1 overflow-y-auto bg-[#0a0a0a] max-h-[461px] max-[1200px]:max-h-[400px]"
      >
        <div className="pt-3 pb-1 px-3">
          {/* List View - Grid for 30+ episodes, List for less */}
          {totalEpisodes > 30 ? (
            // Grid layout for large episode counts
            <div
              className={`${
                totalEpisodes > 30
                  ? "grid gap-2" +
                    (totalEpisodes > 100
                      ? " grid-cols-5"
                      : " grid-cols-5 max-[1200px]:grid-cols-12 max-[860px]:grid-cols-10 max-[575px]:grid-cols-8 max-[478px]:grid-cols-6 max-[350px]:grid-cols-5")
                  : ""
              }`}
            >
              {episodes
                .slice(selectedRange[0] - 1, selectedRange[1])
                .map((item, index) => {
                  const episodeNumber = item?.id.match(/ep=(\d+)/)?.[1];
                  const isActive =
                    activeEpisodeId === episodeNumber ||
                    currentEpisode === episodeNumber;
                  const isSearched = searchedEpisode === item?.id;

                  return (
                    <div
                      key={item?.id}
                      ref={isActive ? activeEpisodeRef : null}
                      className={`flex items-center justify-center rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-colors h-[35px] text-[13px] font-medium cursor-pointer transition-all ${
                        item?.filler
                          ? isActive
                            ? "bg-white text-black"
                            : "bg-[#000000] text-gray-400"
                          : ""
                      } hover:bg-[#404040] 
                          hover:text-white
                       ${
                         isActive
                           ? "bg-white text-black ring-1 ring-white"
                           : "bg-[#000000] text-gray-400"
                       } ${isSearched ? "ring-2 ring-white" : ""}`}
                      onClick={() => {
                        if (episodeNumber) {
                          onEpisodeClick(episodeNumber);
                          setActiveEpisodeId(episodeNumber);
                          setSearchedEpisode(null);
                        }
                      }}
                    >
                      <span className="transition-colors">
                        {formatNumber(item?.episode_no, language)}
                      </span>
                    </div>
                  );
                })}
            </div>
          ) : (
            // Clean list layout for small episode counts (matching screenshot)
            <div className="flex flex-col">
              {episodes
                .slice(selectedRange[0] - 1, selectedRange[1])
                .map((item, index) => {
                  const episodeNumber = item?.id.match(/ep=(\d+)/)?.[1];
                  const isActive =
                    activeEpisodeId === episodeNumber ||
                    currentEpisode === episodeNumber;
                  const isSearched = searchedEpisode === item?.id;
                  const actualEpisodeNumber = selectedRange[0] + index;
                  const isLastItem = index === episodes.slice(selectedRange[0] - 1, selectedRange[1]).length - 1;

                  return (
                    <div key={item?.id}>
                      <div
                        ref={isActive ? activeEpisodeRef : null}
                        className={`relative w-full px-3 py-2.5 rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-between ${
                          isActive
                            ? "bg-[#2a2a2a] border border-white/20"
                            : ""
                        } hover:bg-white/5 ${isSearched ? "ring-2 ring-white/40" : ""}`}
                        onClick={() => {
                          if (episodeNumber) {
                            onEpisodeClick(episodeNumber);
                            setActiveEpisodeId(episodeNumber);
                            setSearchedEpisode(null);
                          }
                        }}
                      >
                        {/* Episode Number & Title */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`font-semibold text-sm transition-colors duration-300 min-w-fit ${
                            isActive
                              ? "text-white"
                              : "text-gray-400"
                          }`}>
                            {getTranslation(language, "episode")} {formatNumber(item?.episode_no, language)}
                          </span>

                          <h3 className={`text-sm line-clamp-1 transition-colors duration-300 ${
                            isActive
                              ? "text-white font-medium"
                              : "text-gray-400"
                          }`}>
                            {titleLanguage === "en"
                              ? (item?.title && !item?.title.toLowerCase().match(/^episode\s*\d+$/i) ? item?.title : "")
                              : (item?.japanese_title && !item?.japanese_title.toLowerCase().match(/^episode\s*\d+$/i) ? item?.japanese_title : "")}
                          </h3>
                        </div>

                        {/* Active Indicator & Filler */}
                        <div className="flex items-center gap-1.5 ml-1.5 flex-shrink-0">
                          {item?.filler && (
                            <div className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded text-xs text-yellow-300">
                              Filler
                            </div>
                          )}
                          {isActive && (
                            <FontAwesomeIcon
                              icon={faCirclePlay}
                              className="w-5 h-5 text-white"
                            />
                          )}
                        </div>
                      </div>
                      {/* Divider Line - Fits Content Width with Blur Edges */}
                      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Episodelist;
