# 🌍 Language Feature - English & Khmer Support

This version of HaruAnime includes full bilingual support for English and Khmer languages.

## ✨ New Features

### Language Settings
Users can now change the interface language in **Settings → Language Settings**:
- 🇬🇧 **English** (Default)
- 🇰🇭 **Khmer** (ខ្មែរ)

The language preference is automatically saved and persists across sessions.

## 📝 What's Translated

### Navigation & Modals
- Watch Together modal and all related text
- Login prompts and buttons

### Main Content Sections
- **Continue Watching** → បន្តមើល
- **Episode** labels → ភាគ
- **Top 10** section → ចំណាត់ថ្នាក់ 10
  - Today → ថ្ងៃនេះ
  - Week → សប្តាហ៍
  - Month → ខែ
- **Trending** → និយមន័យ
- **Latest Episodes** → ភាគថ្មីៗ
- **Schedule** → កាលវិភាគប៉ាន់ស្មាន

### Footer
- A-Z List section → បញ្ជី A-Z
- Browse anime alphabetically → រកមើលអាន៊ីម៉េតាមលំដាប់អក្សរ
- Terms of Service → លក្ខខណ្ឌសេវាកម្ម
- DMCA text
- Contact → ទំនាក់ទំនង
- All legal disclaimers and copyright notices

### Banners
- "Love the Site?" → "ចូលចិត្តគេហទំព័រទេ?"
- Rotating messages:
  - "Bookmark it for Later" → "រក្សាទុកសម្រាប់ពេលក្រោយ"
  - "Join our Community" → "ចូលរួមសហគមន៍របស់យើង"
  - "Share it With your Friends!" → "ចែករំលែកជាមួយមិត្តភក្តិរបស់អ្នក!"

## 🔧 Technical Implementation

### Translation System
- **Location:** `src/translations/translations.js`
- Contains all English and Khmer translations
- Simple key-value structure for easy maintenance

### Language Context
- **Location:** `src/context/LanguageContext.jsx`
- Manages language state globally
- Syncs with localStorage automatically

### Usage in Components
```javascript
import { useLanguage } from "@/src/context/LanguageContext";
import { getTranslation } from "@/src/translations/translations";

function MyComponent() {
  const { language } = useLanguage();
  
  return (
    <h1>{getTranslation(language, 'myKey')}</h1>
  );
}
```

## 🎯 Adding More Translations

To add new translations:

1. Open `src/translations/translations.js`
2. Add your new key to both language objects:

```javascript
export const translations = {
  en: {
    myNewText: "Hello World",
    // ... existing translations
  },
  km: {
    myNewText: "សួស្តី​ពិភពលោក",
    // ... existing translations
  }
};
```

3. Use in your component:
```javascript
{getTranslation(language, 'myNewText')}
```

## 📂 Modified Files

The following files have been updated with language support:

### New Files
- `src/translations/translations.js` (NEW)

### Updated Files
- `src/context/LanguageContext.jsx`
- `src/pages/settings/Settings.jsx`
- `src/components/continue/ContinueWatching.jsx`
- `src/components/trending/Trending.jsx`
- `src/components/topten/Topten.jsx`
- `src/components/footer/Footer.jsx`
- `src/components/schedule/Schedule.jsx`
- `src/components/banner/LoveSiteBanner.jsx`
- `src/pages/Home/Home.jsx`

## 🚀 How to Use

1. Run the application as usual
2. Navigate to **Profile → Settings**
3. Find **Language Settings** at the top
4. Select your preferred language
5. The entire interface will update immediately!

## 💡 Notes

- Only text content is translated - no functionality changes
- Genre names remain in English (standard internationally)
- All styling and layouts remain unchanged
- Language preference is stored in browser localStorage
- Works seamlessly with existing features

---

**Enjoy HaruAnime in your preferred language! 🎉**

For support or to add more languages, check the documentation in the code comments.
