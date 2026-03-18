import { auth } from './auth';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

class YouTubeService {
  /**
   * Retrieve current user's YouTube playlists
   */
  public async getPlaylists() {
    const res = await auth.fetchWithAuth(`${BASE_URL}/playlists?part=snippet,contentDetails&mine=true`);
    return res.json();
  }

  /**
   * Search all of YouTube
   */
  public async searchGlobal(query: string = '') {
    const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
    const res = await auth.fetchWithAuth(`${BASE_URL}/search?part=snippet&type=video&maxResults=25${qParam}`);
    return res.json();
  }

  /**
   * Search current user's YouTube videos
   */
  public async searchMyVideos(query: string = '') {
    const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
    const res = await auth.fetchWithAuth(`${BASE_URL}/search?part=snippet&forMine=true&type=video&maxResults=25${qParam}`);
    return res.json();
  }
}

export const youtube = new YouTubeService();
