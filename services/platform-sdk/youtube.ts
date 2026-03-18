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
}

export const youtube = new YouTubeService();
