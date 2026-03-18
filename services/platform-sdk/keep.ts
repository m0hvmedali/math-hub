import { auth } from './auth';

const BASE_URL = 'https://keep.googleapis.com/v1';

class KeepService {
  /**
   * Retrieves notes using the Google Keep Enterprise API
   */
  public async getNotes() {
    const res = await auth.fetchWithAuth(`${BASE_URL}/notes`);
    return res.json();
  }
}

export const keep = new KeepService();
