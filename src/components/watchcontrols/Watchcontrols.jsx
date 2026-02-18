import { faBackward, faForward } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

const ToggleButton = ({ label, isActive, onClick }) => (
  <button
    className="flex items-center text-xs px-2.5 py-1 rounded border border-[#20c8a0]/12 hover:border-[#20c8a0]/30 bg-transparent hover:bg-[#20c8a0]/06 transition-all duration-200"
    onClick={onClick}
  >
    <span className="text-white/50">{label}</span>
    <span className={`ml-1.5 font-medium ${isActive ? "text-[#20c8a0]" : "text-white/25"}`}>
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
    <div className="w-full flex justify-between items-center px-3 py-2 border-b border-[#20c8a0]/10">
      <div className="flex gap-x-2">
        <ToggleButton label="Auto Play" isActive={autoPlay} onClick={() => setAutoPlay((prev) => !prev)} />
        <ToggleButton label="Skip Intro" isActive={autoSkipIntro} onClick={() => setAutoSkipIntro((prev) => !prev)} />
        <ToggleButton label="Auto Next" isActive={autoNext} onClick={() => setAutoNext((prev) => !prev)} />
      </div>
      <div className="flex items-center gap-x-1.5">
        <button
          onClick={() => {
            if (currentEpisodeIndex > 0) {
              onButtonClick(episodes[currentEpisodeIndex - 1].id.match(/ep=(\d+)/)?.[1]);
            }
          }}
          disabled={currentEpisodeIndex <= 0}
          className={`w-7 h-7 flex items-center justify-center rounded border transition-all duration-200 ${
            currentEpisodeIndex <= 0
              ? "border-white/05 text-white/20 cursor-not-allowed"
              : "border-[#20c8a0]/15 text-white/50 hover:border-[#20c8a0]/35 hover:text-[#20c8a0] hover:bg-[#20c8a0]/06"
          }`}
        >
          <FontAwesomeIcon icon={faBackward} className="text-[13px]" />
        </button>
        <button
          onClick={() => {
            if (currentEpisodeIndex < episodes?.length - 1) {
              onButtonClick(episodes[currentEpisodeIndex + 1].id.match(/ep=(\d+)/)?.[1]);
            }
          }}
          disabled={currentEpisodeIndex >= episodes?.length - 1}
          className={`w-7 h-7 flex items-center justify-center rounded border transition-all duration-200 ${
            currentEpisodeIndex >= episodes?.length - 1
              ? "border-white/05 text-white/20 cursor-not-allowed"
              : "border-[#20c8a0]/15 text-white/50 hover:border-[#20c8a0]/35 hover:text-[#20c8a0] hover:bg-[#20c8a0]/06"
          }`}
        >
          <FontAwesomeIcon icon={faForward} className="text-[13px]" />
        </button>
      </div>
    </div>
  );
}
