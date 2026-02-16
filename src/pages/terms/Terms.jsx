import React from 'react';
import website_name from '@/src/config/website.js';
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";
import { formatNumber } from "@/src/utils/numberConverter";

function Terms() {
  const { language } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto pt-16 pb-5">
      {/* Content */}
      <div className="space-y-12 text-white/60">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-white">
            {getTranslation(language, 'termsTitle')}
          </h1>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {formatNumber(1, language)}. {getTranslation(language, 'terms1Title')}
          </h2>
          <p className="leading-relaxed text-base">
            {getTranslation(language, 'terms1Content')}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {formatNumber(2, language)}. {getTranslation(language, 'terms2Title')}
          </h2>
          <p className="leading-relaxed text-base mb-4">
            {getTranslation(language, 'terms2Intro')} {website_name} {getTranslation(language, 'terms2Intro2')}
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base">
            <li>{getTranslation(language, 'terms2Item1')}</li>
            <li>{getTranslation(language, 'terms2Item2')}</li>
            <li>{getTranslation(language, 'terms2Item3')} {website_name} {getTranslation(language, 'terms2Item3b')}</li>
            <li>{getTranslation(language, 'terms2Item4')}</li>
            <li>{getTranslation(language, 'terms2Item5')}</li>
          </ul>
          <p className="leading-relaxed text-base mt-4">
            {getTranslation(language, 'terms2Outro1')} {website_name} {getTranslation(language, 'terms2Outro2')}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {formatNumber(3, language)}. {getTranslation(language, 'terms3Title')}
          </h2>
          <p className="leading-relaxed text-base">
            {getTranslation(language, 'terms3Content1')} {website_name} {getTranslation(language, 'terms3Content2')} {website_name} {getTranslation(language, 'terms3Content3')} {website_name} {getTranslation(language, 'terms3Content4')}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {formatNumber(4, language)}. {getTranslation(language, 'terms4Title')}
          </h2>
          <p className="leading-relaxed text-base">
            {getTranslation(language, 'terms4Content1')} {website_name} {getTranslation(language, 'terms4Content2')} {website_name} {getTranslation(language, 'terms4Content3')} {website_name} {getTranslation(language, 'terms4Content4')}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {formatNumber(5, language)}. {getTranslation(language, 'terms5Title')}
          </h2>
          <p className="leading-relaxed text-base">
            {getTranslation(language, 'terms5Content1')} {website_name} {getTranslation(language, 'terms5Content2')} {website_name} {getTranslation(language, 'terms5Content3')} {website_name} {getTranslation(language, 'terms5Content4')} {website_name} {getTranslation(language, 'terms5Content5')}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {formatNumber(6, language)}. {getTranslation(language, 'terms6Title')}
          </h2>
          <p className="leading-relaxed text-base">
            {getTranslation(language, 'terms6Content1')} {website_name} {getTranslation(language, 'terms6Content2')} {website_name} {getTranslation(language, 'terms6Content3')}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {formatNumber(7, language)}. {getTranslation(language, 'terms7Title')}
          </h2>
          <p className="leading-relaxed text-base">
            {getTranslation(language, 'terms7Content1')} {website_name} {getTranslation(language, 'terms7Content2')}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {formatNumber(8, language)}. {getTranslation(language, 'terms8Title')}
          </h2>
          <p className="leading-relaxed text-base">
            {getTranslation(language, 'terms8Content')}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {formatNumber(9, language)}. {getTranslation(language, 'terms9Title')}
          </h2>
          <p className="leading-relaxed text-base">
            {getTranslation(language, 'terms9Content1')} {website_name} {getTranslation(language, 'terms9Content2')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Terms; 