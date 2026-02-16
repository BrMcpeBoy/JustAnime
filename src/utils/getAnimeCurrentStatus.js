/**
 * Fetch current anime status from user's AniList
 * Returns the status if anime is on user's list, null otherwise
 */

const ANILIST_API_URL = 'https://graphql.anilist.co';

const GET_ANIME_STATUS_QUERY = `
  query ($userId: Int!, $mediaId: Int!) {
    MediaList(userId: $userId, mediaId: $mediaId) {
      id
      status
      progress
    }
  }
`;

const GET_USER_ID_QUERY = `
  query {
    Viewer {
      id
    }
  }
`;

export async function getAnimeCurrentStatus({ accessToken, mediaId }) {
  if (!accessToken || !mediaId) {
    throw new Error('Access token and media ID are required');
  }

  try {
    // First get the current user ID
    const userResponse = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_USER_ID_QUERY,
      }),
    });

    const userData = await userResponse.json();
    
    if (userData.errors) {
      console.error('Error fetching user ID:', userData.errors);
      return null;
    }

    const userId = userData.data?.Viewer?.id;
    if (!userId) {
      console.error('Could not get user ID');
      return null;
    }

    // Now fetch the media list entry
    const mediaResponse = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_ANIME_STATUS_QUERY,
        variables: {
          userId: userId,
          mediaId: parseInt(mediaId),
        },
      }),
    });

    const mediaData = await mediaResponse.json();

    if (mediaData.errors) {
      console.log(`Anime not in user's list yet`);
      return null;
    }

    const status = mediaData.data?.MediaList?.status;
    
    if (status) {
      // Convert AniList status to internal format
      const statusMap = {
        'CURRENT': 'watching',
        'PLANNING': 'planning',
        'COMPLETED': 'completed',
        'REPEATING': 'rewatching',
        'PAUSED': 'paused',
        'DROPPED': 'dropped'
      };

      const internalStatus = statusMap[status] || null;
      console.log(`✅ Found anime status: ${status} (${internalStatus})`);
      
      return {
        status: internalStatus,
        anilistStatus: status,
        progress: mediaData.data?.MediaList?.progress || 0,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching anime status:', error);
    throw error;
  }
}
