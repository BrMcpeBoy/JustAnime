/**
 * useServerPreference Hook
 * 
 * Handles server selection based on user preferences
 * If preferred server is not available, falls back to available servers
 * 
 * Usage in Watch.jsx:
 * const selectedServer = useServerPreference(availableServers);
 */

export function getPreferredServer(availableServers) {
  // Get user's preferred server from localStorage
  const preferredServer = localStorage.getItem('preferredServer') || 'h1';
  
  if (!availableServers || availableServers.length === 0) {
    return null;
  }

  // Check if preferred server is available
  const serverExists = availableServers.some(
    server => server.name?.toLowerCase() === preferredServer?.toLowerCase()
  );

  if (serverExists) {
    // Use preferred server if available
    return availableServers.find(
      server => server.name?.toLowerCase() === preferredServer?.toLowerCase()
    );
  } else {
    // Fallback: Use first available server
    console.warn(
      `Preferred server ${preferredServer} not available for this anime. Using ${availableServers[0].name}`
    );
    return availableServers[0];
  }
}

/**
 * Get audio type preference
 */
export function getAudioTypePreference() {
  return localStorage.getItem('audioType') || 'sub';
}

/**
 * Get video quality preference
 */
export function getVideoQualityPreference() {
  return localStorage.getItem('videoQuality') || '720p';
}

/**
 * Format server name for display
 */
export function formatServerName(serverName) {
  if (!serverName) return 'Unknown Server';
  return serverName.charAt(0).toUpperCase() + serverName.slice(1);
}

/**
 * Example implementation in Watch.jsx:
 * 
 * import { getPreferredServer, getAudioTypePreference, getVideoQualityPreference } from '@/src/hooks/useServerPreference';
 * 
 * // In your Watch component, when you have servers:
 * const selectedServer = getPreferredServer(servers);
 * const audioType = getAudioTypePreference(); // 'sub', 'dub', or 'raw'
 * const quality = getVideoQualityPreference(); // '720p', '1080p', etc
 * 
 * // Then use these values to:
 * // 1. Select the server ID
 * // 2. Filter available audio tracks based on type
 * // 3. Select video quality for the player
 */
