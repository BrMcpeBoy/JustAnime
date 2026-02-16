import axios from "axios";

export default async function getStreamInfo(animeId, episodeId, serverName, type) {
  const api_url = import.meta.env.VITE_API_URL;
  try {
    const response = await axios.get(`${api_url}/stream?id=${animeId}?ep=${episodeId}&server=${serverName}&type=${type}`);
    return response.data.results;
  } catch (error) {
    console.error(`Error fetching stream info with type=${type}:`, error);
    
    // If dub fails, try to fallback to sub
    if (type === "dub") {
      console.log("⚠️ Dub not available for this episode, trying sub fallback...");
      try {
        const subResponse = await axios.get(`${api_url}/stream?id=${animeId}?ep=${episodeId}&server=${serverName}&type=sub`);
        console.log("✅ Successfully fetched sub version as fallback");
        return {
          ...subResponse.data.results,
          isFallback: true,
          requestedType: "dub",
          actualType: "sub"
        };
      } catch (subError) {
        console.error("Error fetching sub fallback:", subError);
        return error;
      }
    }
    
    return error;
  }
}
