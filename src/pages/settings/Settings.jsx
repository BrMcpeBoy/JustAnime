import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { getTranslation } from '@/src/translations/translations';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSync, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { getAniListUserList } from '@/src/utils/getAnilistUserList.js';
import { processUserListForAutoCompletion } from '@/src/utils/autoCompleteAnime.js';

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const { language, toggleLanguage, titleLanguage, toggleTitleLanguage } = useLanguage();
  const navigate = useNavigate();

  // Server Settings State
  const [preferredServer, setPreferredServer] = useState(() => {
    const saved = localStorage.getItem('preferredServer');
    return saved || 'HD-2';
  });

  const [audioType, setAudioType] = useState(() => {
    const saved = localStorage.getItem('audioType');
    return saved || 'sub';
  });

  const [autoPlay, setAutoPlay] = useState(() => {
    const saved = localStorage.getItem('autoPlay');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [autoSkipIntro, setAutoSkipIntro] = useState(() => {
    const saved = localStorage.getItem('autoSkipIntro');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [autoNext, setAutoNext] = useState(() => {
    const saved = localStorage.getItem('autoNext');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Recent Comments Settings State
  const [showRecentComments, setShowRecentComments] = useState(() => {
    const saved = localStorage.getItem('showRecentComments');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [recentCommentsLoop, setRecentCommentsLoop] = useState(() => {
    const saved = localStorage.getItem('recentCommentsLoop');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Only one dropdown open at a time
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Sync Status State
  const [syncStats, setSyncStats] = useState(() => {
    const saved = localStorage.getItem('syncStats');
    return saved ? JSON.parse(saved) : {
      lastSync: 'Never',
      animeCompleted: 0,
      failedSyncs: 0,
    };
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // AniList Active State
  const [aniListActive, setAniListActive] = useState(() => {
    const saved = localStorage.getItem('aniListActive');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Clear sync confirmation modal state
  const [showClearSyncModal, setShowClearSyncModal] = useState(false);

  // Load initial stats from AniList on mount
  useEffect(() => {
    const loadInitialStats = async () => {
      const accessToken = localStorage.getItem('anilist_token');
      if (!accessToken || !user) return;

      try {
        const lists = await getAniListUserList(null, accessToken);
        if (lists) {
          const totalEpisodes = Object.values(lists).flat().reduce((sum, anime) => {
            return sum + (anime.progress || 0);
          }, 0);

          if (totalEpisodes > 0) {
            setSyncStats(prev => ({
              ...prev,
              animeCompleted: totalEpisodes,
              lastSync: prev.lastSync === 'Never' ? new Date().toLocaleString() : prev.lastSync
            }));
          }
        }
      } catch (error) {
        console.log('Could not load initial stats:', error);
      }
    };

    loadInitialStats();
  }, [user]);

  // Save watch settings to localStorage
  useEffect(() => {
    localStorage.setItem('preferredServer', preferredServer);
  }, [preferredServer]);

  useEffect(() => {
    localStorage.setItem('audioType', audioType);
  }, [audioType]);

  useEffect(() => {
    localStorage.setItem('autoPlay', JSON.stringify(autoPlay));
  }, [autoPlay]);

  useEffect(() => {
    localStorage.setItem('autoSkipIntro', JSON.stringify(autoSkipIntro));
  }, [autoSkipIntro]);

  useEffect(() => {
    localStorage.setItem('autoNext', JSON.stringify(autoNext));
  }, [autoNext]);

  useEffect(() => {
    localStorage.setItem('showRecentComments', JSON.stringify(showRecentComments));
  }, [showRecentComments]);

  useEffect(() => {
    localStorage.setItem('recentCommentsLoop', JSON.stringify(recentCommentsLoop));
  }, [recentCommentsLoop]);

  useEffect(() => {
    localStorage.setItem('syncStats', JSON.stringify(syncStats));
  }, [syncStats]);

  useEffect(() => {
    localStorage.setItem('aniListActive', JSON.stringify(aniListActive));
  }, [aniListActive]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-dropdown]')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const accessToken = localStorage.getItem('anilist_token');
      if (!accessToken) {
        alert('Please log in with AniList first');
        setSyncStats(prev => ({
          ...prev,
          failedSyncs: (prev.failedSyncs || 0) + 1,
          lastSync: new Date().toLocaleString(),
        }));
        return;
      }

      const lists = await getAniListUserList(null, accessToken);
      if (!lists) {
        alert('Failed to fetch anime list');
        setSyncStats(prev => ({
          ...prev,
          failedSyncs: (prev.failedSyncs || 0) + 1,
          lastSync: new Date().toLocaleString(),
        }));
        return;
      }

      const totalEpisodes = Object.values(lists).flat().reduce((sum, anime) => {
        return sum + (anime.progress || 0);
      }, 0);

      const result = await processUserListForAutoCompletion(lists, accessToken);
      setSyncStats({
        animeCompleted: totalEpisodes,
        failedSyncs: 0,
        lastSync: new Date().toLocaleString(),
      });
      
      alert(`Successfully synced! Episodes watched: ${totalEpisodes}`);
    } catch (error) {
      alert(`Sync failed: ${error.message}`);
      setSyncStats(prev => ({
        ...prev,
        failedSyncs: (prev.failedSyncs || 0) + 1,
        lastSync: new Date().toLocaleString(),
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  // Clean Dropdown — only one open at a time via activeDropdown
  const CleanDropdown = ({ id, label, value, options, onChange }) => {
    const isOpen = activeDropdown === id;
    const selected = options.find(o => o.value === value);
    return (
      <div className="relative" data-dropdown>
        <button
          type="button"
          onClick={() => setActiveDropdown(isOpen ? null : id)}
          className="w-full px-4 py-3 bg-[#000000] border border-white/10 hover:border-white/20 rounded-lg focus:outline-none transition-all duration-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-base">{selected?.icon}</span>
            <div className="text-left min-w-0">
              <p className="text-gray-400 text-xs">{label}</p>
              <p className="text-white text-sm font-medium">{selected?.label}</p>
            </div>
          </div>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-white/60 text-xs transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
            {options.map((option, idx) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setActiveDropdown(null);
                }}
                className={`w-full px-4 py-2.5 text-left transition-all duration-200 border-l flex items-center gap-3 ${
                  value === option.value
                    ? 'bg-white/10 border-l-white text-white'
                    : 'border-l-white/20 text-white/70 hover:bg-white/5 hover:text-white'
                } ${idx !== options.length - 1 ? 'border-b border-white/5' : ''}`}
                style={{ borderLeftWidth: '3px' }}
              >
                <span className="text-base">{option.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{option.label}</p>
                  {option.description && <p className="text-xs text-white/50 mt-0.5">{option.description}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{getTranslation(language, 'loginRequired')}</h1>
          <p className="text-white/60 mb-6">{getTranslation(language, 'pleaseLogin')}</p>
          <button
            onClick={() => navigate('/page/auth/login')}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 font-semibold"
          >
            {getTranslation(language, 'goToLogin')}
          </button>
        </div>
      </div>
    );
  }

  // Server Options
  const serverOptions = [
    { value: 'HD-1', label: 'HD-1', icon: '🎬', description: getTranslation(language, 'hd1Desc') },
    { value: 'HD-2', label: 'HD-2', icon: '🎬', description: getTranslation(language, 'hd2Desc') },
    { value: 'HD-3', label: 'HD-3', icon: '🎬', description: getTranslation(language, 'hd3Desc') },
    { value: 'HD-4', label: 'HD-4', icon: '🎬', description: getTranslation(language, 'hd4Desc') },
  ];

  // Audio Type Options
  const audioOptions = [
    { value: 'sub', label: getTranslation(language, 'audioSubbed'), icon: '📝', description: getTranslation(language, 'originalAudio') },
    { value: 'dub', label: getTranslation(language, 'audioDubbed'), icon: '🎤', description: getTranslation(language, 'differentAudio') },
  ];

  // Language Options
  const languageOptions = [
    { value: 'en', label: getTranslation(language, 'english'), icon: '🇬🇧', description: getTranslation(language, 'interfaceInEnglish') },
    { value: 'kh', label: getTranslation(language, 'khmer'), icon: '🇰🇭', description: getTranslation(language, 'interfaceInKhmer') },
  ];

  // Title Language Options
  const titleLanguageOptions = [
    { value: 'en', label: getTranslation(language, 'english'), icon: '🇬🇧', description: getTranslation(language, 'englishTitles') },
    { value: 'jp', label: getTranslation(language, 'japanese'), icon: '🇯🇵', description: getTranslation(language, 'japaneseTitles') },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-16">
      <div className="px-3 sm:px-6 max-w-7xl mx-auto pb-6 sm:pb-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-200 mt-4 mb-4 text-xs sm:text-sm font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          {getTranslation(language, 'backToProfile')}
        </button>

        {/* Header */}
        <div className="mb-5 sm:mb-6">
          <h1 className="text-lg sm:text-xl font-bold text-white mb-0.5">{getTranslation(language, 'settings')}</h1>
          <p className="text-white/60 text-xs sm:text-sm">{getTranslation(language, 'customizePlayback')}</p>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Language Settings */}
          <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all duration-200">
            <div className="mb-4 pb-3 border-b border-white/10">
              <h2 className="text-lg sm:text-xl font-bold text-white">{getTranslation(language, 'languageSettings')}</h2>
              <p className="text-gray-400 text-xs sm:text-sm">{getTranslation(language, 'choosePreferredLanguage')}</p>
            </div>

            <div className="space-y-4">
              <CleanDropdown
                id="language"
                label={getTranslation(language, 'interfaceLanguage')}
                value={language}
                options={languageOptions}
                onChange={toggleLanguage}
              />

              <CleanDropdown
                id="titleLanguage"
                label={getTranslation(language, 'titleLanguage')}
                value={titleLanguage}
                options={titleLanguageOptions}
                onChange={toggleTitleLanguage}
              />
            </div>
          </div>

          {/* Watch Settings */}
          <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all duration-200">
            <div className="mb-4 pb-3 border-b border-white/10">
              <h2 className="text-lg sm:text-xl font-bold text-white">{getTranslation(language, 'watchSettings')}</h2>
              <p className="text-gray-400 text-xs sm:text-sm">{getTranslation(language, 'customizeViewing')}</p>
            </div>

            <div className="space-y-4">
              <CleanDropdown
                id="server"
                label={getTranslation(language, 'preferredServer')}
                value={preferredServer}
                options={serverOptions}
                onChange={setPreferredServer}
              />

              <CleanDropdown
                id="audio"
                label={getTranslation(language, 'audioType')}
                value={audioType}
                options={audioOptions}
                onChange={setAudioType}
              />
            </div>
          </div>

          {/* Playback Settings */}
          <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all duration-200">
            <div className="mb-4 pb-3 border-b border-white/10">
              <h2 className="text-lg sm:text-xl font-bold text-white">{getTranslation(language, 'playbackSettings')}</h2>
              <p className="text-gray-400 text-xs sm:text-sm">{getTranslation(language, 'configurePlayback')}</p>
            </div>

            <div className="space-y-3">
              {/* Auto Play */}
              <div className="flex items-center justify-between p-3 bg-[#000000] border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">▶️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{getTranslation(language, 'autoPlayTitle')}</p>
                    <p className="text-xs text-white/60 mt-0.5">
                      {autoPlay ? getTranslation(language, 'autoPlayDesc') : getTranslation(language, 'manualStart')}
                    </p>
                  </div>
                </div>
                <label className="relative flex cursor-pointer items-center ml-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={autoPlay}
                    onChange={(e) => setAutoPlay(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className={`h-6 w-11 rounded-full border transition-all duration-300 ease-in-out ${
                    autoPlay 
                      ? 'bg-[#1a1a1a] border-white/30 shadow-lg shadow-white/10' 
                      : 'bg-white/5 border-white/20'
                  }`} />
                  <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
                    autoPlay ? 'translate-x-5 scale-110' : 'scale-100'
                  }`} />
                </label>
              </div>

              {/* Skip Intro */}
              <div className="flex items-center justify-between p-3 bg-[#000000] border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">⏭️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{getTranslation(language, 'skipIntroTitle')}</p>
                    <p className="text-xs text-white/60 mt-0.5">
                      {autoSkipIntro ? getTranslation(language, 'skipIntroDesc') : getTranslation(language, 'introsPlay')}
                    </p>
                  </div>
                </div>
                <label className="relative flex cursor-pointer items-center ml-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={autoSkipIntro}
                    onChange={(e) => setAutoSkipIntro(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className={`h-6 w-11 rounded-full border transition-all duration-300 ease-in-out ${
                    autoSkipIntro 
                      ? 'bg-[#1a1a1a] border-white/30 shadow-lg shadow-white/10' 
                      : 'bg-white/5 border-white/20'
                  }`} />
                  <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
                    autoSkipIntro ? 'translate-x-5 scale-110' : 'scale-100'
                  }`} />
                </label>
              </div>

              {/* Auto Next */}
              <div className="flex items-center justify-between p-3 bg-[#000000] border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🔄</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{getTranslation(language, 'autoNextTitle')}</p>
                    <p className="text-xs text-white/60 mt-0.5">
                      {autoNext ? getTranslation(language, 'autoNextDesc') : getTranslation(language, 'manualSelection')}
                    </p>
                  </div>
                </div>
                <label className="relative flex cursor-pointer items-center ml-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={autoNext}
                    onChange={(e) => setAutoNext(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className={`h-6 w-11 rounded-full border transition-all duration-300 ease-in-out ${
                    autoNext 
                      ? 'bg-[#1a1a1a] border-white/30 shadow-lg shadow-white/10' 
                      : 'bg-white/5 border-white/20'
                  }`} />
                  <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
                    autoNext ? 'translate-x-5 scale-110' : 'scale-100'
                  }`} />
                </label>
              </div>
            </div>
          </div>

          {/* Recent Comments Settings */}
          <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all duration-200">
            <div className="mb-4 pb-3 border-b border-white/10">
              <h2 className="text-lg sm:text-xl font-bold text-white">Recent Comments Settings</h2>
              <p className="text-gray-400 text-xs sm:text-sm">Configure recent comments display</p>
            </div>

            <div className="space-y-3">
              {/* Show Recent Comments */}
              <div className="flex items-center justify-between p-3 bg-[#000000] border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">💬</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">Show Recent Comments</p>
                    <p className="text-xs text-white/60 mt-0.5">
                      {showRecentComments ? 'Recent comments section is visible' : 'Recent comments section is hidden'}
                    </p>
                  </div>
                </div>
                <label className="relative flex cursor-pointer items-center ml-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={showRecentComments}
                    onChange={(e) => setShowRecentComments(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className={`h-6 w-11 rounded-full border transition-all duration-300 ease-in-out ${
                    showRecentComments 
                      ? 'bg-[#1a1a1a] border-white/30 shadow-lg shadow-white/10' 
                      : 'bg-white/5 border-white/20'
                  }`} />
                  <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
                    showRecentComments ? 'translate-x-5 scale-110' : 'scale-100'
                  }`} />
                </label>
              </div>

              {/* Auto-Scroll Enable/Disable */}
              <div className="flex items-center justify-between p-3 bg-[#000000] border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">↔️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">Auto-Scroll Comments</p>
                    <p className="text-xs text-white/60 mt-0.5">
                      {recentCommentsLoop ? 'Auto-scroll with bounce at edges' : 'Manual scroll only, no auto-scroll'}
                    </p>
                  </div>
                </div>
                <label className="relative flex cursor-pointer items-center ml-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={recentCommentsLoop}
                    onChange={(e) => setRecentCommentsLoop(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className={`h-6 w-11 rounded-full border transition-all duration-300 ease-in-out ${
                    recentCommentsLoop 
                      ? 'bg-[#1a1a1a] border-white/30 shadow-lg shadow-white/10' 
                      : 'bg-white/5 border-white/20'
                  }`} />
                  <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
                    recentCommentsLoop ? 'translate-x-5 scale-110' : 'scale-100'
                  }`} />
                </label>
              </div>
            </div>
          </div>

          {/* AniList Integration */}
          <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all duration-200">
            <div className="mb-4 pb-3 border-b border-white/10">
              <h2 className="text-lg sm:text-xl font-bold text-white">{getTranslation(language, 'aniListIntegration')}</h2>
              <p className="text-gray-400 text-xs sm:text-sm">{getTranslation(language, 'trackProgress')}</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#000000] border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📊</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{getTranslation(language, 'enableAniList')}</p>
                  <p className="text-xs text-white/60 mt-0.5">
                    {aniListActive ? getTranslation(language, 'progressTracking') : getTranslation(language, 'trackingDisabled')}
                  </p>
                </div>
              </div>
              <label className="relative flex cursor-pointer items-center ml-4 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={aniListActive}
                  onChange={(e) => setAniListActive(e.target.checked)}
                  className="peer sr-only"
                />
                <div className={`h-6 w-11 rounded-full border transition-all duration-300 ease-in-out ${
                  aniListActive 
                    ? 'bg-[#1a1a1a] border-white/30 shadow-lg shadow-white/10' 
                    : 'bg-white/5 border-white/20'
                }`} />
                <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
                  aniListActive ? 'translate-x-5 scale-110' : 'scale-100'
                }`} />
              </label>
            </div>
          </div>

          {/* Sync Statistics */}
          <div className="bg-[#0a0a0a] rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all duration-200">
            <div className="mb-4 pb-3 border-b border-white/10">
              <h2 className="text-lg sm:text-xl font-bold text-white">{getTranslation(language, 'syncStatistics')}</h2>
              <p className="text-gray-400 text-xs sm:text-sm">{getTranslation(language, 'viewSyncStats')}</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Episodes Synced */}
                <div className="bg-[#000000] border border-white/10 rounded-lg p-3">
                  <p className="text-xs text-white/60 mb-1.5">{getTranslation(language, 'episodesSynced')}</p>
                  <p className="text-2xl font-bold text-white">{syncStats.animeCompleted || 0}</p>
                </div>

                {/* Failed Syncs */}
                <div className="bg-[#000000] border border-white/10 rounded-lg p-3">
                  <p className="text-xs text-white/60 mb-1.5">{getTranslation(language, 'failedSyncs')}</p>
                  <p className="text-2xl font-bold text-white">{syncStats.failedSyncs || 0}</p>
                </div>
              </div>

              {/* Last Sync */}
              <div className="bg-[#000000] border border-white/10 rounded-lg p-3">
                <p className="text-xs text-white/60 mb-1.5">{getTranslation(language, 'lastSync')}</p>
                <p className="text-sm font-semibold text-white">
                  {syncStats.lastSync === 'Never'
                    ? getTranslation(language, 'never')
                    : new Date(syncStats.lastSync).toLocaleString()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowClearSyncModal(true)}
                  className="flex-1 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  {getTranslation(language, 'clearSyncHistory')}
                </button>
                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="flex-1 px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/30 text-green-400 hover:text-green-300 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faSync} className={`text-xs ${isSyncing ? 'animate-spin' : ''}`} />
                  {getTranslation(language, 'refreshStats')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Sync History Confirmation Modal */}
        {showClearSyncModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0a0a0a] border border-white/20 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2">{getTranslation(language, 'clearAllSyncHistory')}</h3>
              <p className="text-white/80 text-sm mb-2">{getTranslation(language, 'areYouSure')}</p>
              <p className="text-white/60 text-sm mb-6">{getTranslation(language, 'resetAllStats')}</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearSyncModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-lg text-sm font-medium transition-all duration-200"
                >
                  {getTranslation(language, 'cancel')}
                </button>
                <button
                  onClick={() => {
                    setSyncStats({
                      lastSync: 'Never',
                      animeCompleted: 0,
                      failedSyncs: 0,
                    });
                    localStorage.setItem('syncStats', JSON.stringify({
                      lastSync: 'Never',
                      animeCompleted: 0,
                      failedSyncs: 0,
                    }));
                    setShowClearSyncModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all duration-200"
                >
                  {getTranslation(language, 'clearHistory')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
