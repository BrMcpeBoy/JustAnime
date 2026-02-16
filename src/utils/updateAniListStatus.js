/**
 * Update AniList entry status
 * Maps internal status values to AniList MediaListStatus values
 */

const ANILIST_API_URL = 'https://graphql.anilist.co';

const statusMap = {
  'watching': 'CURRENT',
  'planning': 'PLANNING',
  'completed': 'COMPLETED',
  'rewatching': 'REPEATING',
  'paused': 'PAUSED',
  'dropped': 'DROPPED'
};

const UPDATE_STATUS_MUTATION = `
  mutation ($mediaId: Int!, $status: MediaListStatus) {
    SaveMediaListEntry(mediaId: $mediaId, status: $status) {
      id
      status
      media {
        id
        title {
          english
          romaji
        }
      }
    }
  }
`;

export async function updateAniListStatus({ accessToken, mediaId, status }) {
  if (!accessToken || !mediaId || !status) {
    throw new Error('Missing required parameters: accessToken, mediaId, status');
  }

  const anilistStatus = statusMap[status];
  if (!anilistStatus) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${Object.keys(statusMap).join(', ')}`);
  }

  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: UPDATE_STATUS_MUTATION,
        variables: { 
          mediaId: parseInt(mediaId),
          status: anilistStatus 
        },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('AniList API Error:', data.errors);
      throw new Error('Failed to update AniList: ' + JSON.stringify(data.errors));
    }

    return data.data.SaveMediaListEntry;
  } catch (error) {
    console.error('Error updating AniList status:', error);
    throw error;
  }
}
