import { FaChevronLeft, FaChevronDown, FaChevronUp, FaTags } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilm, faRandom, faHome, faClock, faFire, faTv, faPlay, faCirclePlay, faFilePen, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Radio } from 'lucide-react';
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const MENU_ITEMS = [
  { nameKey: "home", path: "/home", icon: faHome },
  // Genres will be handled separately
  { nameKey: "recentlyAdded", path: "/recently-added", icon: faCirclePlay },
  { nameKey: "topUpcoming", path: "/top-upcoming", icon: faFilePen },
  { nameKey: "subbedAnime", path: "/subbed-anime", icon: faFilePen },
  { nameKey: "dubbedAnime", path: "/dubbed-anime", icon: faPlay },
  { nameKey: "mostPopular", path: "/most-popular", icon: faFire },
  { nameKey: "movies", path: "/movie", icon: faFilm },
  { nameKey: "tvSeries", path: "/tv", icon: faTv },
  { nameKey: "ovas", path: "/ova", icon: faCirclePlay },
  { nameKey: "onas", path: "/ona", icon: faPlay },
  { nameKey: "specials", path: "/special", icon: faClock },
];

const GENRES = [
  { name: "Action", key: "action" },
  { name: "Adventure", key: "adventure" },
  { name: "Cars", key: "cars" },
  { name: "Comedy", key: "comedy" },
  { name: "Dementia", key: "dementia" },
  { name: "Demons", key: "demons" },
  { name: "Drama", key: "drama" },
  { name: "Fantasy", key: "fantasy" },
  { name: "Game", key: "game" },
  { name: "Harem", key: "harem" },
  { name: "Historical", key: "historical" },
  { name: "Horror", key: "horror" },
  { name: "Josei", key: "josei" },
  { name: "Kids", key: "kids" },
  { name: "Magic", key: "magic" },
  { name: "Martial Arts", key: "martialArts" },
  { name: "Mecha", key: "mecha" },
  { name: "Military", key: "military" },
  { name: "Music", key: "music" },
  { name: "Mystery", key: "mystery" },
  { name: "Parody", key: "parody" },
  { name: "Police", key: "police" },
  { name: "Psychological", key: "psychological" },
  { name: "Romance", key: "romance" },
  { name: "Samurai", key: "samurai" },
  { name: "School", key: "school" },
  { name: "Sci-Fi", key: "sciFi" },
  { name: "Seinen", key: "seinen" },
  { name: "Shoujo", key: "shoujo" },
  { name: "Shoujo Ai", key: "shoujoAi" },
  { name: "Shounen", key: "shounen" },
  { name: "Shounen Ai", key: "shounenAi" },
  { name: "Slice of Life", key: "sliceOfLife" },
  { name: "Space", key: "space" },
  { name: "Sports", key: "sports" },
  { name: "Super Power", key: "superPower" },
  { name: "Supernatural", key: "supernatural" },
  { name: "Thriller", key: "thriller" },
  { name: "Vampire", key: "vampire" },
  { name: "Yaoi", key: "yaoi" },
  { name: "Yuri", key: "yuri" }
];

const Sidebar = ({ isOpen, onClose, onOpenWatchTogether }) => {
  const [genresOpen, setGenresOpen] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const scrollPosition = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!isOpen) {
        scrollPosition.current = window.scrollY;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollPosition.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition.current}px`;
      document.body.style.width = '100%';
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollPosition.current);
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  useEffect(() => {
    onClose();
  }, [location]);

  return (
    <div className="sidebar-container" aria-hidden={!isOpen}>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar-main ${isOpen ? 'sidebar-open' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="sidebar-content">
          {/* Header */}
          <div className="sidebar-header">
            <button
              onClick={onClose}
              className="close-button"
            >
              <FaChevronLeft className="text-sm" />
              <span className="text-sm font-medium">{getTranslation(language, 'closeMenu')}</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <div className="quick-actions-grid">
              <Link
                to="/random"
                className="quick-action-item quick-action-random"
              >
                <FontAwesomeIcon icon={faRandom} className="text-lg" />
                <span className="text-xs font-medium">{getTranslation(language, 'random')}</span>
              </Link>
              <button
                onClick={() => {
                  onOpenWatchTogether();
                  onClose();
                }}
                className="quick-action-item quick-action-movie"
              >
                <Radio className="w-6 h-6" />
                <span className="text-xs font-medium">{getTranslation(language, 'watchTogether')}</span>
              </button>
              <div className="quick-action-item quick-action-language">
                <div className="language-switcher-new">
                  {["en", "kh"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`lang-button-new ${language?.toLowerCase() === lang ? 'active' : ''}`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-medium text-white">{getTranslation(language, 'language')}</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="menu-items">
            {/* Home */}
            <Link to="/home" className="menu-item">
              <FontAwesomeIcon icon={faHome} className="text-lg w-5" />
              <span className="font-medium">{getTranslation(language, 'home')}</span>
            </Link>

            {/* Genres Dropdown */}
            <div className={`menu-item genres-dropdown ${genresOpen ? 'open' : ''}`} style={{cursor: 'pointer'}} onClick={() => setGenresOpen(v => !v)}>
              <FaTags className="text-lg w-5" />
              <span className="font-medium">{getTranslation(language, 'genres')}</span>
              {genresOpen ? <FaChevronUp className="ml-auto text-xs" /> : <FaChevronDown className="ml-auto text-xs" />}
            </div>
            {genresOpen && (
              <div
                className="genres-list"
                style={{
                  background: '#0a0a0a',
                  borderRadius: 8,
                  margin: '4px 0 8px 0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  maxHeight: 260,
                  overflowY: 'auto',
                  padding: '8px 0',
                }}
              >
                {GENRES.map((genre) => (
                  <Link
                    key={genre.name}
                    to={`/genre/${genre.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="genre-item"
                    style={{
                      padding: '8px 24px',
                      display: 'block',
                      color: '#fff',
                      borderRadius: 4,
                      margin: '2px 8px',
                      fontSize: 14,
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {getTranslation(language, genre.key)}
                  </Link>
                ))}
              </div>
            )}

            {/* Other Menu Items */}
            {MENU_ITEMS.filter(item => item.nameKey !== "home").map((item, index) => (
              <Link
                key={item.nameKey}
                to={item.path}
                className="menu-item"
              >
                <FontAwesomeIcon icon={item.icon} className="text-lg w-5" />
                <span className="font-medium">{getTranslation(language, item.nameKey)}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
