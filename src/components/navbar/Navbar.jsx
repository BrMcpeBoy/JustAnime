import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faRandom,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/src/context/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import { SearchProvider } from "@/src/context/SearchContext";
import WebSearch from "../searchbar/WebSearch";
import MobileSearch from "../searchbar/MobileSearch";

function Navbar() {
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleRandomClick = () => {
    if (location.pathname === "/random") window.location.reload();
  };

  return (
    <SearchProvider>
      <nav
        className={`fixed top-0 left-0 w-full z-[1000000] transition-all duration-300 ease-in-out border-b ${
          isScrolled
            ? "bg-[#0a0a0a]/80 backdrop-blur-md shadow-lg border-white/5"
            : "bg-[#0a0a0a] border-transparent"
        }`}
      >
        <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between">

          {/* Left */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-8 h-8 flex items-center justify-center border border-white/10 hover:border-white/25 hover:bg-white/5 rounded-md transition-all duration-200"
            >
              <FontAwesomeIcon icon={faBars} className="text-white/70 hover:text-white text-sm" />
            </button>
            <Link to="/home" className="flex items-center">
              <img src="/logo.png" alt="JustAnime Logo" className="h-9 w-auto" />
            </Link>
          </div>

          {/* Center - Search */}
          <div className="flex-1 flex justify-center items-center mx-8 hidden md:flex">
            <div className="flex items-center gap-2 w-[600px]">
              <WebSearch />
              <Link
                to={location.pathname === "/random" ? "#" : "/random"}
                onClick={handleRandomClick}
                className="w-[38px] h-[38px] flex items-center justify-center border border-white/10 hover:border-white/25 hover:bg-white/5 rounded-lg transition-all duration-200"
                title="Random Anime"
              >
                <FontAwesomeIcon icon={faRandom} className="text-white/50 hover:text-white text-sm" />
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Language toggle - Desktop */}
            <div className="hidden md:flex items-center border border-white/10 rounded-md overflow-hidden">
              {["EN", "JP"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    language === lang
                      ? "bg-white text-black"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Mobile search icon */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center border border-white/10 hover:border-white/25 hover:bg-white/5 rounded-md transition-all duration-200"
              title={isMobileSearchOpen ? "Close" : "Search"}
            >
              <FontAwesomeIcon
                icon={isMobileSearchOpen ? faXmark : faMagnifyingGlass}
                className="text-white/70 text-sm transition-transform duration-200"
                style={{ transform: isMobileSearchOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              />
            </button>
          </div>
        </div>

        {/* Mobile search dropdown */}
        {isMobileSearchOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-t border-white/5">
            <MobileSearch onClose={() => setIsMobileSearchOpen(false)} />
          </div>
        )}

        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </nav>
    </SearchProvider>
  );
}

export default Navbar;
