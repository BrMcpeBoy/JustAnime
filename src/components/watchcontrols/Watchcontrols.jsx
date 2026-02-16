import { faBackward, faForward } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";

const ToggleButton = ({ label, isActive, onClick }) => (
  <button 
    className="flex items-center text-xs px-3 py-1.5 rounded border border-white/10 hover:border-white/30 transition-colors hover:bg-[#1a1a1a]" 
    onClick={onClick}
  >
    <span className="text-gray-300">{label}</span>
    <span
      className={`ml-1.5 ${
        isActive ? "text-white font-semibold" : "text-gray-500"
      }`}
    >
      {isActive ? "ON" : "OFF"}
    </span>
  </button>
);

export default function WatchControls({
  autoPlay,
  setAutoPlay,
  autoSkipIntro,
  setAutoSkipIntro,
  autoNext,
  setAutoNext,
  episodeId,
  episodes = [],
  onButtonClick,
}) {
  const { language } = useLanguage();
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(
    episodes?.findIndex(
      (episode) => episode.id.match(/ep=(\d+)/)?.[1] === episodeId
    )
  );

  useEffect(() => {
    if (episodes?.length > 0) {
      const newIndex = episodes.findIndex(
        (episode) => episode.id.match(/ep=(\d+)/)?.[1] === episodeId
      );
      setCurrentEpisodeIndex(newIndex);
    }
  }, [episodeId, episodes]);

  return (
    <div className="w-full">
      {/* Desktop layout - single row */}
      <div className="hidden sm:flex justify-between items-center gap-1">
        <div className="flex gap-x-0.5">
          <ToggleButton
            label={getTranslation(language, "autoPlay")}
            isActive={autoPlay}
            onClick={() => setAutoPlay((prev) => !prev)}
          />
          <ToggleButton
            label={getTranslation(language, "skipIntro")}
            isActive={autoSkipIntro}
            onClick={() => setAutoSkipIntro((prev) => !prev)}
          />
          <ToggleButton
            label={getTranslation(language, "autoNext")}
            isActive={autoNext}
            onClick={() => setAutoNext((prev) => !prev)}
          />
        </div>
        <div className="flex items-center gap-x-0.5">
          <button
            onClick={() => {
              if (currentEpisodeIndex > 0) {
                const currentEpisode = episodes[currentEpisodeIndex];
                const currentEpisodeNum = parseInt(currentEpisode?.episode_no || 0);
                const prevEpisodeNum = currentEpisodeNum - 1;
                
                const prevEpisode = episodes.find(
                  (ep) => parseInt(ep?.episode_no || 0) === prevEpisodeNum
                );
                
                const prevEpisodeId = prevEpisode?.id.match(/ep=(\d+)/)?.[1];
                
                if (prevEpisodeId) {
                  onButtonClick(prevEpisodeId);
                }
              }
            }}
            disabled={currentEpisodeIndex <= 0}
            className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${
              currentEpisodeIndex <= 0 
                ? "text-gray-600 cursor-not-allowed border-gray-700" 
                : "text-gray-300 hover:text-white border-white/10 hover:border-white/30"
            }`}
          >
            <FontAwesomeIcon icon={faBackward} className="text-[14px]" />
          </button>
          <button
            onClick={() => {
              if (currentEpisodeIndex < episodes?.length - 1) {
                const currentEpisode = episodes[currentEpisodeIndex];
                const currentEpisodeNum = parseInt(currentEpisode?.episode_no || 0);
                const nextEpisodeNum = currentEpisodeNum + 1;
                
                const nextEpisode = episodes.find(
                  (ep) => parseInt(ep?.episode_no || 0) === nextEpisodeNum
                );
                
                const nextEpisodeId = nextEpisode?.id.match(/ep=(\d+)/)?.[1];
                
                if (nextEpisodeId) {
                  onButtonClick(nextEpisodeId);
                }
              }
            }}
            disabled={currentEpisodeIndex >= episodes?.length - 1}
            className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${
              currentEpisodeIndex >= episodes?.length - 1 
                ? "text-gray-600 cursor-not-allowed border-gray-700" 
                : "text-gray-300 hover:text-white border-white/10 hover:border-white/30"
            }`}
          >
            <FontAwesomeIcon icon={faForward} className="text-[14px]" />
          </button>
        </div>
      </div>

      {/* Mobile layout - 2 rows: toggles first, then navigation */}
      <div className="flex flex-col gap-1.5 sm:hidden">
        {/* Row 1: Auto Play, Skip Intro, Auto Next */}
        <div className="grid grid-cols-3 gap-1.5">
          <button 
            className={`flex flex-col items-center justify-center text-[10px] px-1.5 py-1 rounded border transition-colors ${
              autoPlay 
                ? "border-white/30 bg-[#1a1a1a] hover:border-white/30 hover:bg-[#1a1a1a]" 
                : "border-white/10"
            }`}
            onClick={() => setAutoPlay((prev) => !prev)}
          >
            <span className="text-gray-300 truncate">{getTranslation(language, "autoPlay")}</span>
            <span className={`mt-0.5 font-semibold ${autoPlay ? "text-white" : "text-gray-500"}`}>
              {autoPlay ? "ON" : "OFF"}
            </span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center text-[10px] px-1.5 py-1 rounded border transition-colors ${
              autoSkipIntro 
                ? "border-white/30 bg-[#1a1a1a] hover:border-white/30 hover:bg-[#1a1a1a]" 
                : "border-white/10"
            }`}
            onClick={() => setAutoSkipIntro((prev) => !prev)}
          >
            <span className="text-gray-300 truncate">{getTranslation(language, "skipIntro")}</span>
            <span className={`mt-0.5 font-semibold ${autoSkipIntro ? "text-white" : "text-gray-500"}`}>
              {autoSkipIntro ? "ON" : "OFF"}
            </span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center text-[10px] px-1.5 py-1 rounded border transition-colors ${
              autoNext 
                ? "border-white/30 bg-[#1a1a1a] hover:border-white/30 hover:bg-[#1a1a1a]" 
                : "border-white/10"
            }`}
            onClick={() => setAutoNext((prev) => !prev)}
          >
            <span className="text-gray-300 truncate">{getTranslation(language, "autoNext")}</span>
            <span className={`mt-0.5 font-semibold ${autoNext ? "text-white" : "text-gray-500"}`}>
              {autoNext ? "ON" : "OFF"}
            </span>
          </button>
        </div>
        
        {/* Row 2: Prev and Next */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              if (currentEpisodeIndex > 0) {
                const currentEpisode = episodes[currentEpisodeIndex];
                const currentEpisodeNum = parseInt(currentEpisode?.episode_no || 0);
                const prevEpisodeNum = currentEpisodeNum - 1;
                
                const prevEpisode = episodes.find(
                  (ep) => parseInt(ep?.episode_no || 0) === prevEpisodeNum
                );
                
                const prevEpisodeId = prevEpisode?.id.match(/ep=(\d+)/)?.[1];
                
                if (prevEpisodeId) {
                  onButtonClick(prevEpisodeId);
                }
              }
            }}
            disabled={currentEpisodeIndex <= 0}
            className={`flex items-center justify-center text-[11px] px-2 py-1.5 rounded border transition-colors ${
              currentEpisodeIndex <= 0 
                ? "text-gray-600 cursor-not-allowed border-gray-700" 
                : "text-gray-300 hover:text-white border-white/10 hover:border-white/30 hover:bg-[#1a1a1a]"
            }`}
          >
            <FontAwesomeIcon icon={faBackward} className="text-[11px] mr-1" />
            <span className="truncate">Prev</span>
          </button>
          <button
            onClick={() => {
              if (currentEpisodeIndex < episodes?.length - 1) {
                const currentEpisode = episodes[currentEpisodeIndex];
                const currentEpisodeNum = parseInt(currentEpisode?.episode_no || 0);
                const nextEpisodeNum = currentEpisodeNum + 1;
                
                const nextEpisode = episodes.find(
                  (ep) => parseInt(ep?.episode_no || 0) === nextEpisodeNum
                );
                
                const nextEpisodeId = nextEpisode?.id.match(/ep=(\d+)/)?.[1];
                
                if (nextEpisodeId) {
                  onButtonClick(nextEpisodeId);
                }
              }
            }}
            disabled={currentEpisodeIndex >= episodes?.length - 1}
            className={`flex items-center justify-center text-[11px] px-2 py-1.5 rounded border transition-colors ${
              currentEpisodeIndex >= episodes?.length - 1 
                ? "text-gray-600 cursor-not-allowed border-gray-700" 
                : "text-gray-300 hover:text-white border-white/10 hover:border-white/30 hover:bg-[#1a1a1a]"
            }`}
          >
            <span className="truncate">Next</span>
            <FontAwesomeIcon icon={faForward} className="text-[11px] ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
