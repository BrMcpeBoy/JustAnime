/**
 * Search for anime on AniList to get its media ID
 * Enhanced with progressive title shortening for better subtitle handling
 */

const ANILIST_API_URL = 'https://graphql.anilist.co';

const SEARCH_ANIME_QUERY = `
  query ($search: String!) {
    Media(search: $search, type: ANIME) {
      id
      title {
        english
        romaji
        native
      }
    }
  }
`;

const SEARCH_ANIME_MULTIPLE = `
  query ($search: String!) {
    Page(perPage: 10) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        id
        title {
          english
          romaji
          native
        }
        synonyms
      }
    }
  }
`;

/**
 * Generate title variations by progressively removing subtitles
 * Example: "Title: Subtitle 1: Subtitle 2" → ["Title: Subtitle 1: Subtitle 2", "Title: Subtitle 1", "Title"]
 */
function generateTitleVariations(title) {
  if (!title) return [];
  
  const variations = [];
  
  // Clean up the title
  const cleanTitle = title
    .replace(/\s*\([^)]*\)\s*/g, ' ') // Remove anything in parentheses
    .replace(/\s+/g, ' ') // Remove extra whitespace
    .trim();
  
  variations.push(cleanTitle);
  
  // Split by colon and create progressively shorter versions
  const parts = cleanTitle.split(':').map(p => p.trim());
  
  if (parts.length > 1) {
    // Add versions with fewer subtitles
    for (let i = parts.length - 1; i > 0; i--) {
      const shorter = parts.slice(0, i).join(': ').trim();
      if (shorter && !variations.includes(shorter)) {
        variations.push(shorter);
      }
    }
  }
  
  // Also try removing common prefixes/suffixes
  const withoutSeason = cleanTitle.replace(/\s+(season|s)\s*\d+/gi, '').trim();
  if (withoutSeason !== cleanTitle && !variations.includes(withoutSeason)) {
    variations.push(withoutSeason);
  }
  
  console.log(`🔍 Generated title variations for "${title}":`, variations);
  return variations;
}

/**
 * Calculate similarity between two titles (0-1)
 */
function calculateTitleSimilarity(title1, title2) {
  if (!title1 || !title2) return 0;
  
  const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const t1 = normalize(title1);
  const t2 = normalize(title2);
  
  // Exact match
  if (t1 === t2) return 1.0;
  
  // One contains the other
  if (t1.includes(t2) || t2.includes(t1)) return 0.9;
  
  // Calculate word overlap
  const words1 = t1.split(/\s+/).filter(w => w.length > 2);
  const words2 = t2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(w => words2.includes(w)).length;
  const totalWords = Math.max(words1.length, words2.length);
  
  return commonWords / totalWords;
}

/**
 * Find the best matching anime from a list of results
 */
function findBestMatch(searchTitle, mediaList) {
  if (!mediaList || mediaList.length === 0) return null;
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const media of mediaList) {
    const titles = [
      media.title.english,
      media.title.romaji,
      media.title.native,
      ...(media.synonyms || [])
    ].filter(Boolean);
    
    // Calculate max similarity across all title variants
    let maxSimilarity = 0;
    for (const title of titles) {
      const similarity = calculateTitleSimilarity(searchTitle, title);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
    
    console.log(`  📊 ${media.title.english || media.title.romaji}: similarity = ${(maxSimilarity * 100).toFixed(1)}%`);
    
    if (maxSimilarity > bestScore) {
      bestScore = maxSimilarity;
      bestMatch = media;
    }
  }
  
  // Only return if we have a reasonable match (>50% similarity)
  if (bestScore >= 0.5) {
    console.log(`  ✅ Best match: ${bestMatch.title.english || bestMatch.title.romaji} (${(bestScore * 100).toFixed(1)}%)`);
    return bestMatch;
  }
  
  return null;
}

export async function searchAniListAnime(title) {
  if (!title) {
    throw new Error('Title is required for anime search');
  }

  console.log(`🔍 Searching AniList for: "${title}"`);
  
  // Generate title variations (full title, shortened versions, etc.)
  const titleVariations = generateTitleVariations(title);
  
  // Try each title variation
  for (let i = 0; i < titleVariations.length; i++) {
    const searchTitle = titleVariations[i];
    console.log(`\n🎯 Attempt ${i + 1}: Searching with "${searchTitle}"`);
    
    try {
      // First try exact/fuzzy match with Media query
      let response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: SEARCH_ANIME_QUERY,
          variables: { search: searchTitle },
        }),
      });

      let data = await response.json();

      // If exact match found, verify it's a good match
      if (data.data?.Media) {
        const media = data.data.Media;
        const titles = [media.title.english, media.title.romaji, media.title.native].filter(Boolean);
        
        // Check if this is actually a good match
        const similarity = Math.max(...titles.map(t => calculateTitleSimilarity(searchTitle, t)));
        
        console.log(`  ✓ Found exact match: ${media.title.english || media.title.romaji} (ID: ${media.id})`);
        console.log(`  📊 Similarity: ${(similarity * 100).toFixed(1)}%`);
        
        if (similarity >= 0.5) {
          console.log(`  ✅ Good match! Using this result.`);
          return media.id;
        } else {
          console.log(`  ⚠️ Low similarity, trying fuzzy search...`);
        }
      }

      // If exact match not good enough, try Page search with multiple results
      console.log(`  🔎 Trying fuzzy search for "${searchTitle}"...`);
      response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: SEARCH_ANIME_MULTIPLE,
          variables: { search: searchTitle },
        }),
      });

      data = await response.json();

      if (data.errors) {
        console.warn(`  ⚠️ AniList search error for "${searchTitle}":`, data.errors);
        continue; // Try next variation
      }

      const mediaList = data.data?.Page?.media || [];
      if (mediaList.length > 0) {
        console.log(`  📋 Found ${mediaList.length} results, finding best match...`);
        const bestMatch = findBestMatch(searchTitle, mediaList);
        
        if (bestMatch) {
          console.log(`\n✅ SUCCESS! Found anime: ${bestMatch.title.english || bestMatch.title.romaji} (ID: ${bestMatch.id})`);
          return bestMatch.id;
        } else {
          console.log(`  ⚠️ No good matches in fuzzy search results`);
        }
      } else {
        console.log(`  ⚠️ No results found for "${searchTitle}"`);
      }
    } catch (error) {
      console.warn(`  ⚠️ Error searching with "${searchTitle}":`, error.message);
      // Continue to next variation
    }
  }
  
  // If all variations failed, throw error
  const errorMsg = `Anime "${title}" not found on AniList after trying ${titleVariations.length} title variations`;
  console.error(`❌ ${errorMsg}`);
  throw new Error(errorMsg);
}

/**
 * Get or search for AniList media ID with caching
 */
export async function getAniListMediaId(title) {
  if (!title) {
    throw new Error('Title is required');
  }

  // Check localStorage cache first
  const cacheKey = `anilist_media_${title.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    console.log(`📦 Using cached AniList ID for "${title}": ${cached}`);
    return parseInt(cached);
  }

  try {
    const mediaId = await searchAniListAnime(title);
    // Cache the result
    localStorage.setItem(cacheKey, mediaId.toString());
    return mediaId;
  } catch (error) {
    console.error(`Failed to find AniList ID for "${title}":`, error);
    throw error;
  }
}
