import { auth } from './auth';

const BASE_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

class DriveService {
  /**
   * Search files in Google Drive
   */
  public async search(query: string) {
    const res = await auth.fetchWithAuth(`${BASE_URL}/files?q=${encodeURIComponent(query)}`);
    return res.json();
  }

  /**
   * Upload a File object to Google Drive
   */
  public async upload(file: File) {
    const metadata = {
      name: file.name,
      mimeType: file.type,
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    
    // auth.fetchWithAuth dynamically skips Content-Type so browser can set boundary
    const res = await auth.fetchWithAuth(`${UPLOAD_URL}/files?uploadType=multipart`, {
      method: 'POST',
      body: form
    });
    
    return res.json();
  }
}

export const drive = new DriveService();
