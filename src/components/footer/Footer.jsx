import logoTitle from "@/src/config/logoTitle.js";
import website_name from "@/src/config/website.js";
import { Link } from "react-router-dom";
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";

function Footer() {
  const { language } = useLanguage();
  
  return (
    <footer className="w-full mt-16">
      {/* Logo Section */}
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex justify-center sm:justify-start items-center gap-6">
          <img
            src="/footer.png"
            alt={logoTitle}
            className="h-[100px] w-[200px] object-contain"
          />
        </div>
      </div>

      <div className="bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-[1920px] mx-auto px-4 py-6">
          {/* A-Z List Section */}
          <div className="mb-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 items-center sm:items-start">
              <h2 className="text-sm font-medium text-white">{getTranslation(language, 'azList')}</h2>
              <span className="text-sm text-white/60">{getTranslation(language, 'browseAlphabetically')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
              {["All", "#", "0-9", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))].map((item, index) => (
                <Link
                  to={`az-list/${item === "All" ? "" : item}`}
                  key={index}
                  className="px-2.5 py-1 text-sm bg-[#0a0a0a] border border-white/10 hover:border-white/20 hover:bg-[#1a1a1a] text-white/60 hover:text-white rounded-md transition-all duration-300"
                >
                  {item}
                </Link>
              ))}
            </div>
            <div className="flex gap-4 flex-wrap justify-center sm:justify-start mt-4">
              <Link
                to="/terms-of-service"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {getTranslation(language, 'termsOfService')}
              </Link>
              <Link
                to="/dmca"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {getTranslation(language, 'dmca')}
              </Link>
              <Link
                to="/contact"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {getTranslation(language, 'contact')}
              </Link>
              <Link
                to="/admin-manage"
                className="text-sm text-white/30 hover:text-indigo-400 transition-colors"
              >
                Admin Manage
              </Link>
            </div>
          </div>

          {/* Legal Text */}
          <div className="space-y-2 text-sm text-white/40 text-center sm:text-left">
            <p className="max-w-4xl mx-auto sm:mx-0">
              {website_name} {getTranslation(language, 'disclaimer')} {website_name} {getTranslation(language, 'notResponsible')}
            </p>
            <p>© {website_name}. {getTranslation(language, 'allRightsReserved')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
