// Utility to save and fetch continue watching list to/from AniList using custom list or notes field
// This is a stub. You may need to implement a backend for full support if AniList API does not support arbitrary data storage.

import { getAniListMediaId } from './getAniListMediaId';
import { updateAniListProgress } from './updateAniListProgress';

// Save continue watching list to AniList by updating progress for each anime
export async function saveContinueWatchingToAniList(list, accessToken) {
  if (!Array.isArray(list) || !accessToken) return;
  for (const item of list) {
    try {
      const mediaId = await getAniListMediaId(item.title);
      await updateAniListProgress({
        accessToken,
        mediaId,
        progress: Number(item.episodeNum) || 1,
      });
    } catch (err) {
      console.error('Failed to sync continue watching item to AniList:', item, err);
    }
  }
}

// Fetch continue watching list from AniList (CURRENT status)
import { getAniListWatchlist } from './getAnilistUserList';

export async function fetchContinueWatchingFromAniList(accessToken) {
  if (!accessToken) return [];
  // Get all currently watching anime
  const list = await getAniListWatchlist(null, accessToken, 'CURRENT');
  // Map to local continue watching format
  return list.map(item => ({
    id: item.id,
    title: item.title,
    poster: item.image,
    episodeNum: item.progress,
    episodeId: item.progress, // You may want to adjust this mapping
    // Add more fields if needed
  }));
}
