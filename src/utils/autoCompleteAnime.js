/**
 * Check and auto-complete anime based on watch threshold
 * If user has watched >= threshold%, auto-mark as completed in AniList
 */

import { updateAniListStatus } from './updateAniListStatus';
import { getAniListMediaId } from './getAniListMediaId';

export async function checkAndAutoCompleteAnime({
  accessToken,
  title,
  progress,
  totalEpisodes,
  currentStatus
}) {
  try {
    // Get completion threshold from localStorage (default 95%)
    const threshold = parseInt(localStorage.getItem('completionThreshold') || '95');
    
    // Calculate watch percentage
    const watchPercentage = totalEpisodes > 0 
      ? Math.round((progress / totalEpisodes) * 100) 
      : 0;

    console.log(`📊 Watch progress: ${progress}/${totalEpisodes} (${watchPercentage}%), Threshold: ${threshold}%`);

    // Check if threshold is reached and anime is not already completed
    if (watchPercentage >= threshold && currentStatus !== 'COMPLETED' && currentStatus !== 'completed') {
      console.log(`✅ Threshold reached! Auto-completing anime: ${title}`);
      
      try {
        // Search for AniList ID
        const mediaId = await getAniListMediaId(title);
        
        // Update to completed status
        const result = await updateAniListStatus({
          accessToken,
          mediaId,
          status: 'completed'
        });
        
        console.log(`✅ Successfully auto-completed: ${title}`, result);
        return {
          autoCompleted: true,
          watchPercentage,
          threshold,
          mediaId,
          result
        };
      } catch (error) {
        console.error(`⚠️ Failed to auto-complete anime:`, error);
        return {
          autoCompleted: false,
          watchPercentage,
          threshold,
          error: error.message
        };
      }
    } else {
      return {
        autoCompleted: false,
        watchPercentage,
        threshold,
        reason: watchPercentage < threshold 
          ? `Not reached threshold (${watchPercentage}% < ${threshold}%)`
          : 'Already completed'
      };
    }
  } catch (error) {
    console.error('❌ Error in auto-complete check:', error);
    return {
      autoCompleted: false,
      error: error.message
    };
  }
}

/**
 * Process all anime from user's list and auto-complete those that meet threshold
 */
export async function processUserListForAutoCompletion(animeList, accessToken) {
  try {
    const threshold = parseInt(localStorage.getItem('completionThreshold') || '95');
    const autoSyncEnabled = JSON.parse(localStorage.getItem('aniListActive') ?? 'true');
    
    if (!autoSyncEnabled) {
      console.log('⚠️ Auto-sync is disabled');
      return { processed: 0, completed: 0 };
    }

    console.log(`🔄 Processing ${Object.keys(animeList).length} anime lists for auto-completion...`);
    
    let totalProcessed = 0;
    let totalCompleted = 0;

    // Process watching list (candidates for auto-completion)
    const watchingList = animeList.watching || [];
    
    for (const anime of watchingList) {
      totalProcessed++;
      const watchPercentage = anime.totalEpisodes > 0
        ? Math.round((anime.progress / anime.totalEpisodes) * 100)
        : 0;

      if (watchPercentage >= threshold) {
        console.log(`⚡ Auto-completing: ${anime.title} (${watchPercentage}%)`);
        try {
          const mediaId = await getAniListMediaId(anime.title);
          await updateAniListStatus({
            accessToken,
            mediaId,
            status: 'completed'
          });
          totalCompleted++;
          console.log(`✅ Completed: ${anime.title}`);
        } catch (error) {
          console.error(`❌ Failed to complete ${anime.title}:`, error.message);
        }
      }
    }

    console.log(`📊 Auto-completion summary: ${totalCompleted}/${totalProcessed} anime completed`);
    return {
      processed: totalProcessed,
      completed: totalCompleted,
      threshold
    };
  } catch (error) {
    console.error('❌ Error processing list:', error);
    return { processed: 0, completed: 0, error: error.message };
  }
}
