/**
 * AniList GraphQL API utility for fetching user's anime list
 */

const ANILIST_API_URL = 'https://graphql.anilist.co';

const GET_USER_ID_QUERY = `
  query {
    Viewer {
      id
      name
      avatar {
        large
      }
    }
  }
`;

const USER_ANIME_QUERY = `
  query ($userId: Int!, $status: MediaListStatus) {
    MediaListCollection(userId: $userId, type: ANIME, status: $status) {
      lists {
        entries {
          id
          mediaId
          media {
            id
            title {
              english
              romaji
              native
            }
            coverImage {
              large
            }
            episodes
            format
            season
            seasonYear
            genres
          }
          progress
          status
          score
          startedAt {
            year
            month
            day
          }
          completedAt {
            year
            month
            day
          }
          repeat
          notes
        }
      }
    }
  }
`;

const USER_STATS_QUERY = `
  query ($userId: Int!) {
    User(id: $userId) {
      statistics {
        anime {
          count
          meanScore
          minutesWatched
        }
      }
      mediaListOptions {
        animeList {
          customLists
          advancedScoringEnabled
          advancedScoring
        }
      }
    }
    currentWatching: MediaListCollection(userId: $userId, type: ANIME, status: CURRENT) {
      lists {
        entries {
          progress
          media {
            episodes
          }
        }
      }
    }
    completed: MediaListCollection(userId: $userId, type: ANIME, status: COMPLETED) {
      lists {
        entries {
          progress
        }
      }
    }
    paused: MediaListCollection(userId: $userId, type: ANIME, status: PAUSED) {
      lists {
        entries {
          progress
        }
      }
    }
    dropped: MediaListCollection(userId: $userId, type: ANIME, status: DROPPED) {
      lists {
        entries {
          progress
        }
      }
    }
  }
`;

export async function getAniListUserData(accessToken) {
  try {
    console.log('🔍 Fetching AniList user data...');
    
    if (!accessToken) {
      console.error('❌ No access token provided');
      return null;
    }

    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_USER_ID_QUERY,
      }),
    });

    if (!response.ok) {
      console.error('❌ Network error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('❌ GraphQL errors:', data.errors);
      return null;
    }

    console.log('✅ User data retrieved:', data.data?.Viewer);
    return data.data?.Viewer;
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    return null;
  }
}

export async function getAniListUserStats(userId, accessToken) {
  try {
    console.log('📊 Fetching user statistics...');

    if (!accessToken) {
      console.error('❌ No access token provided');
      return null;
    }

    // Get user ID if not provided
    let actualUserId = userId;
    if (!actualUserId) {
      console.log('🔍 No userId provided, fetching from AniList...');
      const userdata = await getAniListUserData(accessToken);
      if (!userdata) {
        console.error('❌ Failed to fetch user data');
        return null;
      }
      actualUserId = userdata.id;
      console.log('✅ Got userId:', actualUserId);
    }

    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: USER_STATS_QUERY,
        variables: {
          userId: actualUserId,
        },
      }),
    });

    if (!response.ok) {
      console.error('❌ Network error:', response.status, response.statusText);
      return null;
    }

    const responseData = await response.json();
    
    if (responseData.errors) {
      console.error('❌ GraphQL errors:', responseData.errors);
      return null;
    }

    const data = responseData.data;
    
    // Count entries by status
    const countEntries = (lists) => {
      if (!lists) return 0;
      let count = 0;
      for (const list of lists) {
        if (list.entries) {
          count += list.entries.length;
        }
      }
      return count;
    };

    const stats = {
      watching: countEntries(data.currentWatching?.lists),
      completed: countEntries(data.completed?.lists),
      onHold: countEntries(data.paused?.lists),
      dropped: countEntries(data.dropped?.lists),
      favorites: data.User?.statistics?.anime?.count || 0,
      totalWatchTime: Math.floor((data.User?.statistics?.anime?.minutesWatched || 0) / 60), // Convert to hours
    };

    console.log('✅ User statistics:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    return null;
  }
}

export async function getAniListWatchlist(userId, accessToken, status) {
  try {
    console.log('📋 Fetching watchlist:', { userId, status, hasToken: !!accessToken });

    if (!accessToken) {
      console.error('❌ No access token provided');
      return [];
    }

    // Get user ID if not provided
    let actualUserId = userId;
    if (!actualUserId) {
      console.log('🔍 No userId provided, fetching from AniList...');
      const userdata = await getAniListUserData(accessToken);
      if (!userdata) {
        console.error('❌ Failed to fetch user data');
        return [];
      }
      actualUserId = userdata.id;
      console.log('✅ Got userId:', actualUserId);
    }

    // Map status names to AniList format
    const statusMap = {
      watching: 'CURRENT',
      completed: 'COMPLETED',
      onHold: 'PAUSED',
      dropped: 'DROPPED',
      favorites: 'CURRENT',
      CURRENT: 'CURRENT',
      COMPLETED: 'COMPLETED',
      PAUSED: 'PAUSED',
      DROPPED: 'DROPPED',
    };

    const anilistStatus = statusMap[status] || 'CURRENT';
    console.log('🔄 Status mapping:', status, '->', anilistStatus);

    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: USER_ANIME_QUERY,
        variables: {
          userId: actualUserId,
          status: anilistStatus,
        },
      }),
    });

    if (!response.ok) {
      console.error('❌ Network error:', response.status, response.statusText);
      return [];
    }

    const responseData = await response.json();
    
    if (responseData.errors) {
      console.error('❌ GraphQL errors:', responseData.errors);
      return [];
    }

    // Extract entries from all lists
    const lists = responseData.data?.MediaListCollection?.lists;
    if (!lists || lists.length === 0) {
      console.warn('⚠️ No lists found in response');
      return [];
    }

    const animeList = [];
    for (const list of lists) {
      if (list.entries && list.entries.length > 0) {
        console.log(`📺 Found ${list.entries.length} entries in list`);
        for (const entry of list.entries) {
          animeList.push({
            id: entry.media.id,
            title: entry.media.title.english || entry.media.title.romaji,
            image: entry.media.coverImage?.large,
            episodes: entry.media.episodes || '?',
            progress: entry.progress,
            status: entry.status,
          });
        }
      }
    }

    console.log(`✅ Found ${animeList.length} anime in ${anilistStatus} status`);
    return animeList;
  } catch (error) {
    console.error('❌ Error fetching watchlist:', error);
    return [];
  }
}

export async function getAniListFavorites(userId, accessToken) {
  try {
    console.log('❤️ Fetching favorite anime...');

    if (!accessToken) {
      console.error('❌ No access token provided');
      return [];
    }

    // Get user ID if not provided
    let actualUserId = userId;
    if (!actualUserId) {
      console.log('🔍 No userId provided, fetching from AniList...');
      const userdata = await getAniListUserData(accessToken);
      if (!userdata) {
        console.error('❌ Failed to fetch user data');
        return [];
      }
      actualUserId = userdata.id;
      console.log('✅ Got userId:', actualUserId);
    }

    // Fetch all statuses to get comprehensive list
    const statuses = ['CURRENT', 'COMPLETED', 'PAUSED', 'DROPPED', 'PLANNING'];
    const allEntries = [];

    for (const status of statuses) {
      console.log(`🔄 Fetching status: ${status}`);
      
      const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: USER_ANIME_QUERY,
          variables: {
            userId: actualUserId,
            status: status,
          },
        }),
      });

      if (!response.ok) {
        console.error(`❌ Network error for status ${status}:`, response.status);
        continue;
      }

      const data = await response.json();
      
      if (data.errors) {
        console.error(`❌ GraphQL errors for status ${status}:`, data.errors);
        continue;
      }

      const lists = data.data?.MediaListCollection?.lists;
      if (lists) {
        for (const list of lists) {
          if (list.entries) {
            console.log(`📺 Found ${list.entries.length} entries in ${status}`);
            allEntries.push(...list.entries);
          }
        }
      }
    }

    const animeList = allEntries.map((entry) => ({
      id: entry.media.id,
      title: entry.media.title.english || entry.media.title.romaji,
      image: entry.media.coverImage?.large,
      episodes: entry.media.episodes || '?',
      progress: entry.progress,
      status: entry.status,
    }));

    console.log(`✅ Total favorite anime: ${animeList.length}`);
    return animeList;
  } catch (error) {
    console.error('❌ Error fetching favorites:', error);
    return [];
  }
}

/**
 * Fetch user's entire anime list organized by status
 */
export async function getAniListUserList(userId, accessToken) {
  try {
    console.log('📚 Fetching complete user anime list...');

    if (!accessToken) {
      console.error('❌ No access token provided');
      return {
        watching: [],
        planning: [],
        completed: [],
        rewatching: [],
        paused: [],
        dropped: [],
      };
    }

    // Get user ID if not provided
    let actualUserId = userId;
    if (!actualUserId) {
      console.log('🔍 No userId provided, fetching from AniList...');
      const userdata = await getAniListUserData(accessToken);
      if (!userdata) {
        console.error('❌ Failed to fetch user data');
        return {
          watching: [],
          planning: [],
          completed: [],
          rewatching: [],
          paused: [],
          dropped: [],
        };
      }
      actualUserId = userdata.id;
      console.log('✅ Got userId:', actualUserId);
    }

    // Status mapping
    const statusMap = {
      CURRENT: 'watching',
      PLANNING: 'planning',
      COMPLETED: 'completed',
      REPEATING: 'rewatching',
      PAUSED: 'paused',
      DROPPED: 'dropped',
    };

    const animeByStatus = {
      watching: [],
      planning: [],
      completed: [],
      rewatching: [],
      paused: [],
      dropped: [],
    };

    // Fetch all statuses
    const statuses = ['CURRENT', 'PLANNING', 'COMPLETED', 'REPEATING', 'PAUSED', 'DROPPED'];

    for (const status of statuses) {
      try {
        console.log(`🔄 Fetching status: ${status}`);
        
        const response = await fetch(ANILIST_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: USER_ANIME_QUERY,
            variables: {
              userId: actualUserId,
              status: status,
            },
          }),
        });

        if (!response.ok) {
          console.error(`❌ Network error for status ${status}:`, response.status);
          continue;
        }

        const data = await response.json();
        
        if (data.errors) {
          console.error(`❌ GraphQL errors for status ${status}:`, data.errors);
          continue;
        }

        const lists = data.data?.MediaListCollection?.lists;
        if (lists) {
          for (const list of lists) {
            if (list.entries && list.entries.length > 0) {
              console.log(`📺 Found ${list.entries.length} entries in ${status}`);
              const statusKey = statusMap[status];
              
              for (const entry of list.entries) {
                const startedAt = entry.startedAt;
                const completedAt = entry.completedAt;
                
                animeByStatus[statusKey].push({
                  id: entry.media.id,
                  mediaListId: entry.id,
                  mediaId: entry.mediaId,
                  title: entry.media.title.english || entry.media.title.romaji,
                  englishTitle: entry.media.title.english,
                  romajiTitle: entry.media.title.romaji,
                  nativeTitle: entry.media.title.native,
                  cover: entry.media.coverImage?.large,
                  totalEpisodes: entry.media.episodes || '?',
                  progress: entry.progress || 0,
                  status: entry.status,
                  score: entry.score > 10 ? entry.score / 10 : entry.score || 0,
                  startDate: startedAt ? `${startedAt.year}-${String(startedAt.month).padStart(2, '0')}-${String(startedAt.day).padStart(2, '0')}` : '',
                  endDate: completedAt ? `${completedAt.year}-${String(completedAt.month).padStart(2, '0')}-${String(completedAt.day).padStart(2, '0')}` : '',
                  rewatches: entry.repeat || 0,
                  notes: entry.notes || '',
                  // Additional fields for smart matching
                  format: entry.media.format, // TV, MOVIE, OVA, etc.
                  genres: entry.media.genres || [],
                  season: entry.media.season,
                  seasonYear: entry.media.seasonYear,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error fetching ${status}:`, error);
      }
    }

    console.log('✅ Complete user list fetched:', {
      watching: animeByStatus.watching.length,
      planning: animeByStatus.planning.length,
      completed: animeByStatus.completed.length,
      rewatching: animeByStatus.rewatching.length,
      paused: animeByStatus.paused.length,
      dropped: animeByStatus.dropped.length,
    });

    return animeByStatus;
  } catch (error) {
    console.error('❌ Error fetching user list:', error);
    return {
      watching: [],
      planning: [],
      completed: [],
      rewatching: [],
      paused: [],
      dropped: [],
    };
  }
}
