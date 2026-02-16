import React from 'react';
import website_name from '@/src/config/website.js';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShield } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";
import { formatNumber } from "@/src/utils/numberConverter";

function DMCA() {
  const { language } = useLanguage();

  const requirements = language === 'en' ? [
    "A description of the copyrighted work that you claim is being infringed;",
    "A description of the material you claim is infringing and that you want removed or access to which you want disabled and the URL or other location of that material;",
    "Your name, title (if acting as an agent), address, telephone number, and email address;",
    'The following statement: "I have a good faith belief that the use of the copyrighted material I am complaining of is not authorized by the copyright owner, its agent, or the law (e.g., as a fair use)";',
    'The following statement: "The information in this notice is accurate and, under penalty of perjury, I am the owner, or authorized to act on behalf of the owner, of the copyright or of an exclusive right that is allegedly infringed";',
    "An electronic or physical signature of the owner of the copyright or a person authorized to act on the owner's behalf."
  ] : [
    "ការពិពណ៌នាអំពីស្នាដៃដែលមានរក្សាសិទ្ធិដែលអ្នកអះអាងថាកំពុងត្រូវបានរំលោភ;",
    "ការពិពណ៌នាអំពីសម្ភារៈដែលអ្នកអះអាងថាកំពុងរំលោភនិងដែលអ្នកចង់លុបចោល ឬចង់បិទការចូលប្រើ និងURL ឬទីតាំងផ្សេងទៀតនៃសម្ភារៈនោះ;",
    "ឈ្មោះ ចំណងជើង (ប្រសិនបើធ្វើសកម្មភាពជាភ្នាក់ងារ) អាសយដ្ឋាន លេខទូរសព្ទ និងអាសយដ្ឋានអ៊ីមែលរបស់អ្នក;",
    'សេចក្តីថ្លែងការណ៍ខាងក្រោម៖ \"ខ្ញុំមានជំនឿល្អថាការប្រើប្រាស់សម្ភារៈដែលមានរក្សាសិទ្ធិដែលខ្ញុំកំពុងតវ៉ាមិនត្រូវបានអនុញ្ញាតដោយម្ចាស់រក្សាសិទ្ធិ ភ្នាក់ងាររបស់វា ឬច្បាប់ (ឧ. ជាការប្រើប្រាស់យុត្តិធម៌)\"',
    'សេចក្តីថ្លែងការណ៍ខាងក្រោម៖ \"ព័ត៌មាននៅក្នុងការជូនដំណឹងនេះត្រឹមត្រូវ ហើយក្រោមទោសនៃការកុហក ខ្ញុំជាម្ចាស់ ឬត្រូវបានអនុញ្ញាតឱ្យធ្វើសកម្មភាពក្នុងនាមម្ចាស់ នៃរក្សាសិទ្ធិ ឬសិទ្ធិផ្តាច់មុខដែលត្រូវបានរំលោភ\"',
    "ហត្ថលេខាអេឡិចត្រូនិក ឬរូបវន្តរបស់ម្ចាស់រក្សាសិទ្ធិ ឬបុគ្គលដែលត្រូវបានអនុញ្ញាតឱ្យធ្វើសកម្មភាពក្នុងនាមម្ចាស់។"
  ];

  return (
    <div className="max-w-5xl mx-auto pt-16 pb-5">
      {/* Content */}
      <div className="space-y-12 text-white/60">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-white">
            {getTranslation(language, 'dmcaTitle')}
          </h1>
        </div>

        <div>
          <p className="leading-relaxed text-base">
            {getTranslation(language, 'dmcaIntro1')} {website_name} {getTranslation(language, 'dmcaIntro2')}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {getTranslation(language, 'dmcaRequirementsTitle')}
          </h2>
          <ul className="space-y-3">
            {requirements.map((requirement, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-6 h-6 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center text-sm mt-0.5">
                  {formatNumber(index + 1, language)}
                </span>
                <span className="leading-relaxed text-base">{requirement}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {getTranslation(language, 'dmcaSubmitTitle')}
          </h2>
          <p className="leading-relaxed text-base">
            {getTranslation(language, 'dmcaSubmitText')}{' '}
            <a 
              href="/contact" 
              className="text-white hover:text-white/80 underline underline-offset-4 decoration-white/20 hover:decoration-white/40 transition-colors"
            >
              https://justanime.to/contact
            </a>
          </p>
          <p className="mt-3 leading-relaxed text-base">
            {getTranslation(language, 'dmcaReviewText')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DMCA; 