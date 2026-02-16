import React from 'react';
import website_name from '@/src/config/website.js';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";

function Contact() {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto pt-16 pb-8">
      <h1 className="text-2xl font-bold mb-6">{getTranslation(language, 'contactTitle')}</h1>
      <div className="space-y-8 text-white/60">
        <p>
          {getTranslation(language, 'contactIntro')} {website_name} {getTranslation(language, 'contactIntro2')}
        </p>
        <div className="flex flex-wrap gap-6">
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="text-xl text-white/60 group-hover:text-white" />
            <span className="text-white/60 group-hover:text-white">{getTranslation(language, 'joinTelegram')}</span>
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
          >
            <FontAwesomeIcon icon={faDiscord} className="text-xl text-white/60 group-hover:text-white" />
            <span className="text-white/60 group-hover:text-white">{getTranslation(language, 'joinDiscord')}</span>
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
          >
            <FontAwesomeIcon icon={faGithub} className="text-xl text-white/60 group-hover:text-white" />
            <span className="text-white/60 group-hover:text-white">GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Contact; 