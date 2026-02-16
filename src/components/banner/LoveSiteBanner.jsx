import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { useState, useEffect } from "react";
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";

function LoveSiteBanner() {
  const { language } = useLanguage();
  const messageKeys = [
    "bookmarkLater",
    "joinCommunity",
    "shareWithFriends"
  ];
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messageKeys.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleDiscordClick = () => {
    // Replace with your actual Discord invite link
    window.open("https://discord.gg/P3yqksmGun", "_blank");
  };

  return (
    <div className="w-full bg-[#0a0a0a] rounded-xl border border-white/10 hover:border-white/20 p-2 mb-6 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0 bg-black/50">
            <img 
              src="/socialgif.gif" 
              alt="Love the site" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="leading-none">
            <h3 className="text-white font-semibold text-[13px] sm:text-[15px] tracking-tight leading-none">
              {getTranslation(language, 'loveSite')}
            </h3>
            <p className="text-gray-400 text-[11px] sm:text-[13px] mt-[3px] tracking-normal leading-none transition-opacity duration-300">
              {getTranslation(language, messageKeys[currentMessageIndex])}
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <button
            onClick={handleDiscordClick}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-white/10 bg-[#0d0d0d] hover:bg-[#1a1a1a] hover:border-white/20 hover:scale-105 flex items-center justify-center transition-all duration-200 flex-shrink-0"
            title="Join our Discord"
          >
            <FontAwesomeIcon icon={faDiscord} className="text-gray-300 hover:text-white text-[13px] sm:text-[15px] transition-colors duration-200" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoveSiteBanner;
