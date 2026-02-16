/**
 * IMPROVED: Get streaming API anime ID by intelligently matching AniList data with anime-api
 * This function now:
 * 1. Uses multiple title variants (English, Romaji, Japanese)
 * 2. Compares genres to verify correct anime
 * 3. Handles season/sequel information correctly
 * 4. Uses fuzzy matching with first letter as fallback
 * 5. Cross-references format (TV, Movie, OVA, etc.)
 * 6. **NEW**: Fetches anime info for top candidates to check Aired/Premiered year for accurate differentiation
 */
import getSearch from './getSearch.utils';
import fetchAnimeInfo from './getAnimeInfo.utils';

/**
 * Normalize a title for comparison
 */
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Extract first letters of each word for fuzzy matching
 */
function getFirstLetters(title) {
  if (!title) return '';
  return title
    .split(/\s+/)
    .map(word => word.charAt(0).toLowerCase())
    .join('');
}

/**
 * Calculate similarity between two strings (0-1)
 */
function calculateSimilarity(str1, str2) {
  const s1 = normalizeTitle(str1);
  const s2 = normalizeTitle(str2);
  
  if (s1 === s2) return 1.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Calculate word overlap
  const words1 = s1.split(' ').filter(w => w.length > 2);
  const words2 = s2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(w => words2.includes(w)).length;
  const totalWords = Math.max(words1.length, words2.length);
  
  return commonWords / totalWords;
}

/**
 * Compare genres between AniList and anime-api
 * Note: Search results may not include genres, so this is used when available
 */
function compareGenres(anilistGenres, apiGenres) {
  if (!anilistGenres || !apiGenres) return 0;
  
  const normalizeGenre = (g) => g.toLowerCase().replace(/[^\w]/g, '');
  
  const anilistSet = new Set(
    (Array.isArray(anilistGenres) ? anilistGenres : [anilistGenres])
      .map(normalizeGenre)
  );
  
  // Handle different possible formats for API genres
  let apiGenreArray = [];
  if (Array.isArray(apiGenres)) {
    apiGenreArray = apiGenres;
  } else if (typeof apiGenres === 'string') {
    apiGenreArray = apiGenres.split(',').map(g => g.trim());
  }
  
  const apiSet = new Set(apiGenreArray.map(normalizeGenre));
  
  const intersection = [...anilistSet].filter(g => apiSet.has(g));
  const union = new Set([...anilistSet, ...apiSet]);
  
  return union.size > 0 ? intersection.length / union.size : 0;
}

/**
 * Extract season number from title
 */
function extractSeasonNumber(title, format) {
  if (!title) return null;
  
  const lowerTitle = title.toLowerCase();
  
  // Check for explicit season numbers
  const seasonMatch = lowerTitle.match(/season\s*(\d+)|s(\d+)|part\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*season/);
  if (seasonMatch) {
    return parseInt(seasonMatch[1] || seasonMatch[2] || seasonMatch[3] || seasonMatch[4]);
  }
  
  // Check for sequel indicators
  if (lowerTitle.includes('2nd') || lowerTitle.includes('second')) return 2;
  if (lowerTitle.includes('3rd') || lowerTitle.includes('third')) return 3;
  if (lowerTitle.includes('4th') || lowerTitle.includes('fourth')) return 4;
  
  // Check format - if it's a sequel/season 2+, the format might indicate it
  if (format && format.toLowerCase().includes('sequel')) return 2;
  
  return 1; // Default to season 1
}

/**
 * Extract year from anime info "Aired" field
 * Examples: "Jan 3, 2026 to ?" -> 2026
 *           "Dec 31, 2019" -> 2019
 *           "2019" -> 2019
 */
function extractYearFromAired(aired) {
  if (!aired) return null;
  
  // Try to match a 4-digit year
  const yearMatch = aired.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return parseInt(yearMatch[0]);
  }
  
  return null;
}

/**
 * Extract year from anime info "Premiered" field
 * Examples: "Winter 2026" -> 2026
 */
function extractYearFromPremiered(premiered) {
  if (!premiered) return null;
  
  const yearMatch = premiered.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return parseInt(yearMatch[0]);
  }
  
  return null;
}

/**
 * Smart anime matching with multiple strategies
 */
export async function getAnimeIdByTitle(titleOrAnime, anilistData = null) {
  try {
    // Handle both string title and anime object with AniList data
    let searchTitles = [];
    let anilistGenres = null;
    let anilistSeason = null;
    let anilistSeasonYear = null;
    let anilistFormat = null;
    
    if (typeof titleOrAnime === 'string') {
      searchTitles = [titleOrAnime.trim()];
    } else if (typeof titleOrAnime === 'object') {
      // Extract all available title variants
      if (titleOrAnime.englishTitle) searchTitles.push(titleOrAnime.englishTitle);
      if (titleOrAnime.romajiTitle) searchTitles.push(titleOrAnime.romajiTitle);
      if (titleOrAnime.title) searchTitles.push(titleOrAnime.title);
      if (titleOrAnime.nativeTitle) searchTitles.push(titleOrAnime.nativeTitle);
      
      // Get AniList metadata for better matching
      anilistGenres = titleOrAnime.genres;
      anilistSeason = extractSeasonNumber(titleOrAnime.title, titleOrAnime.format);
      anilistSeasonYear = titleOrAnime.seasonYear; // **NEW**: The year the anime aired/premiered
      anilistFormat = titleOrAnime.format; // TV, MOVIE, OVA, etc.
      
      console.log('🎯 AniList Data:', {
        titles: searchTitles,
        genres: anilistGenres,
        season: anilistSeason,
        seasonYear: anilistSeasonYear,
        format: anilistFormat
      });
    }
    
    if (searchTitles.length === 0) {
      console.error('❌ No valid titles provided');
      return null;
    }
    
    // Collect all search results from different title variants
    const allResults = new Map(); // Use Map to deduplicate by ID
    
    for (const searchTitle of searchTitles) {
      console.log(`🔍 Searching with title: "${searchTitle}"`);
      
      // Search first 2 pages to get more results
      for (let page = 1; page <= 2; page++) {
        const searchResponse = await getSearch(searchTitle, page);
        
        let results = [];
        if (Array.isArray(searchResponse)) {
          results = searchResponse;
        } else if (searchResponse?.data && Array.isArray(searchResponse.data)) {
          results = searchResponse.data;
        } else if (searchResponse?.results && Array.isArray(searchResponse.results)) {
          results = searchResponse.results;
        }
        
        // Add results to map (deduplicate by ID)
        results.forEach(result => {
          if (result?.id && !allResults.has(result.id)) {
            allResults.set(result.id, result);
          }
        });
        
        // If we found good results on page 1, no need for page 2
        if (page === 1 && results.length >= 10) break;
      }
      
      // If we already have good candidates, no need to search more title variants
      if (allResults.size >= 15) break;
    }
    
    const searchResults = Array.from(allResults.values());
    console.log(`📊 Total unique results found: ${searchResults.length}`);
    
    if (searchResults.length === 0) {
      console.warn('⚠️ No anime found for any title variant');
      return null;
    }
    
    // Score and rank each result
    let bestMatch = null;
    let bestScore = -Infinity;
    
    // Fetch detailed info for top candidates if we have seasonYear from AniList
    // This helps differentiate between same-name anime from different years
    const shouldFetchInfo = anilistSeasonYear && searchResults.length > 1;
    const candidateInfoMap = new Map();
    
    if (shouldFetchInfo) {
      console.log('🔍 Fetching anime info for top candidates to check year...');
      // Fetch info for top 5 candidates to check their aired year
      const topCandidates = searchResults.slice(0, 5);
      await Promise.all(
        topCandidates.map(async (anime) => {
          try {
            const info = await fetchAnimeInfo(anime.id);
            if (info?.data?.animeInfo) {
              const airedYear = extractYearFromAired(info.data.animeInfo.Aired);
              const premieredYear = extractYearFromPremiered(info.data.animeInfo.Premiered);
              candidateInfoMap.set(anime.id, {
                airedYear: airedYear || premieredYear,
                animeInfo: info.data.animeInfo
              });
              console.log(`  📅 ${anime.title}: Aired year = ${airedYear || premieredYear || 'unknown'}`);
            }
          } catch (error) {
            console.warn(`  ⚠️ Could not fetch info for ${anime.title}:`, error.message);
          }
        })
      );
    }
    
    for (const anime of searchResults) {
      const animeTitle = anime?.title || '';
      const animeJapaneseTitle = anime?.japanese_title || '';
      let score = 0;
      
      console.log(`\n📋 Evaluating: "${animeTitle}"`);
      
      // STEP 1: Title Similarity (0-1000 points)
      let maxTitleSimilarity = 0;
      for (const searchTitle of searchTitles) {
        const similarity = calculateSimilarity(searchTitle, animeTitle);
        const jpSimilarity = calculateSimilarity(searchTitle, animeJapaneseTitle);
        maxTitleSimilarity = Math.max(maxTitleSimilarity, similarity, jpSimilarity);
      }
      score += maxTitleSimilarity * 1000;
      console.log(`  📝 Title similarity: ${(maxTitleSimilarity * 100).toFixed(1)}% (+${Math.floor(maxTitleSimilarity * 1000)} points)`);
      
      // STEP 2: First Letter Matching (bonus 200 points for acronym match)
      const firstLettersMatches = searchTitles.some(searchTitle => {
        const searchFirstLetters = getFirstLetters(searchTitle);
        const animeFirstLetters = getFirstLetters(animeTitle);
        return searchFirstLetters === animeFirstLetters && searchFirstLetters.length >= 3;
      });
      if (firstLettersMatches) {
        score += 200;
        console.log('  🔤 First letters match (+200 points)');
      }
      
      // STEP 3: Genre Matching (0-300 points)
      // Try to use fetched anime info for genre matching if available
      const candidateInfo = candidateInfoMap.get(anime.id);
      let animeGenres = anime.genres;
      if (candidateInfo?.animeInfo?.Genres) {
        // Convert genres string/array from anime info
        if (typeof candidateInfo.animeInfo.Genres === 'string') {
          animeGenres = candidateInfo.animeInfo.Genres.split(',').map(g => g.trim());
        } else if (Array.isArray(candidateInfo.animeInfo.Genres)) {
          animeGenres = candidateInfo.animeInfo.Genres;
        }
      }
      
      if (anilistGenres && anilistGenres.length > 0 && animeGenres) {
        const genreSimilarity = compareGenres(anilistGenres, animeGenres);
        const genrePoints = Math.floor(genreSimilarity * 300);
        score += genrePoints;
        console.log(`  🎭 Genre match: ${(genreSimilarity * 100).toFixed(1)}% (+${genrePoints} points)`);
      }
      
      // STEP 4: Format Matching (bonus 150 points)
      if (anilistFormat) {
        const animeShowType = anime?.tvInfo?.showType?.toUpperCase() || '';
        const formatMap = {
          'TV': ['TV', 'SERIES'],
          'MOVIE': ['MOVIE', 'FILM'],
          'OVA': ['OVA'],
          'ONA': ['ONA'],
          'SPECIAL': ['SPECIAL'],
          'MUSIC': ['MUSIC']
        };
        
        const expectedTypes = formatMap[anilistFormat.toUpperCase()] || [];
        const formatMatches = expectedTypes.some(type => animeShowType.includes(type));
        
        if (formatMatches) {
          score += 150;
          console.log(`  📺 Format match: ${anilistFormat} = ${animeShowType} (+150 points)`);
        }
      }
      
      // STEP 5: **CRITICAL** Year Matching (from Aired/Premiered field)
      // This is the key improvement to differentiate same-name anime from different years
      if (anilistSeasonYear && candidateInfo?.airedYear) {
        const yearDiff = Math.abs(anilistSeasonYear - candidateInfo.airedYear);
        
        if (yearDiff === 0) {
          // Perfect year match
          score += 500;
          console.log(`  📅 PERFECT year match: AniList=${anilistSeasonYear}, API=${candidateInfo.airedYear} (+500 points)`);
        } else if (yearDiff === 1) {
          // Off by 1 year (could be season boundary issue)
          score += 200;
          console.log(`  📅 Close year match: AniList=${anilistSeasonYear}, API=${candidateInfo.airedYear} (+200 points)`);
        } else if (yearDiff <= 2) {
          // Off by 2 years - small penalty
          score -= 100;
          console.log(`  ⚠️ Year mismatch (small): AniList=${anilistSeasonYear}, API=${candidateInfo.airedYear} (-100 points)`);
        } else {
          // Significant year mismatch - large penalty
          score -= 700;
          console.log(`  ❌ Year mismatch (large): AniList=${anilistSeasonYear}, API=${candidateInfo.airedYear} (-700 points)`);
        }
      }
      
      // STEP 6: Season/Sequel Handling (critical -500 penalty for wrong season)
      const animeSeasonNumber = extractSeasonNumber(animeTitle, anime?.tvInfo?.showType);
      
      if (anilistSeason && animeSeasonNumber) {
        if (anilistSeason === animeSeasonNumber) {
          score += 250;
          console.log(`  🔢 Season match: ${anilistSeason} (+250 points)`);
        } else {
          score -= 500;
          console.log(`  ❌ Season mismatch: AniList=${anilistSeason}, API=${animeSeasonNumber} (-500 points)`);
        }
      }
      
      // STEP 7: Penalize specials/movies unless explicitly searching for them
      const isSpecialContent = animeTitle.match(/special|ova|ona|movie/i);
      const isLookingForSpecial = searchTitles.some(t => 
        t.match(/movie|film|special|ova|ona/i)
      );
      
      if (isSpecialContent && !isLookingForSpecial && !anilistFormat?.match(/MOVIE|OVA|ONA|SPECIAL/i)) {
        score -= 400;
        console.log('  ⚠️ Special content penalty (-400 points)');
      }
      
      console.log(`  ⭐ Total Score: ${score}`);
      
      // Track best match
      if (score > bestScore) {
        bestScore = score;
        bestMatch = anime;
      }
    }
    
    if (!bestMatch) {
      console.warn('⚠️ No suitable match found after scoring');
      return null;
    }
    
    console.log(`\n✅ BEST MATCH: "${bestMatch.title}" with score ${bestScore}`);
    console.log('📌 Match Details:', {
      id: bestMatch.id,
      title: bestMatch.title,
      japanese_title: bestMatch.japanese_title,
      showType: bestMatch?.tvInfo?.showType,
      score: bestScore
    });
    
    return bestMatch.id;
    
  } catch (error) {
    console.error('❌ Error in getAnimeIdByTitle:', error);
    return null;
  }
}

export default getAnimeIdByTitle;
