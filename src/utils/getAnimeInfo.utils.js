import axios from "axios";

export default async function fetchAnimeInfo(id, random = false) {
  const api_url = import.meta.env.VITE_API_URL;
  try {
    if (random) {
      const idResp = await axios.get(`${api_url}/random/id`);
      const response = await axios.get(`${api_url}/info?id=${idResp.data.results}`);
      // Return both data and seasons fields as per API
      return {
        data: response.data.results.data,
        seasons: response.data.results.seasons,
      };
    } else {
      const response = await axios.get(`${api_url}/info?id=${id}`);
      // Return both data and seasons fields as per API
      return {
        data: response.data.results.data,
        seasons: response.data.results.seasons,
      };
    }
  } catch (error) {
    console.error("Error fetching anime info:", error);
    return { error };
  }
}
