// Utility to update AniList progress for a user
// Usage: updateAniListProgress({ userId, accessToken, mediaId, progress })

const ANILIST_API_URL = 'https://graphql.anilist.co';

const UPDATE_PROGRESS_MUTATION = `
  mutation ($mediaId: Int!, $progress: Int!) {
    SaveMediaListEntry(mediaId: $mediaId, progress: $progress) {
      id
      status
      progress
    }
  }
`;

export async function updateAniListProgress({ accessToken, mediaId, progress }) {
  if (!accessToken || !mediaId || typeof progress !== 'number') {
    throw new Error('Missing required parameters for AniList progress update');
  }
  
  // Ensure mediaId is an integer
  const intMediaId = parseInt(mediaId);
  if (isNaN(intMediaId)) {
    throw new Error(`Invalid mediaId: ${mediaId} is not a valid number`);
  }
  
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: UPDATE_PROGRESS_MUTATION,
      variables: { mediaId: intMediaId, progress },
    }),
  });
  const data = await response.json();
  if (data.errors) {
    throw new Error('AniList update error: ' + JSON.stringify(data.errors));
  }
  return data.data.SaveMediaListEntry;
}
