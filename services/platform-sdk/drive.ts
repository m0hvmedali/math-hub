import { auth } from './auth';

const BASE_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

class DriveService {
  /**
   * Search files in Google Drive by name
   * Uses proper Drive API query syntax: name contains 'term'
   */
  /**
   * Search files in Google Drive
   * Targeted for personal file discovery
   */
  public async search(rawQuery: string = '') {
    let q: string;

    if (!rawQuery.trim()) {
      q = "trashed = false";
    } else {
      const isRawDriveQuery = rawQuery.includes(' in ') || rawQuery.includes('name ') || rawQuery.includes('mimeType');
      if (isRawDriveQuery) {
        q = rawQuery;
      } else {
        const safe = rawQuery.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        q = `name contains '${safe}' and trashed = false`;
      }
    }

    const res = await auth.fetchWithAuth(
      `${BASE_URL}/files?q=${encodeURIComponent(q)}&spaces=drive&fields=nextPageToken,files(id,name,mimeType,webViewLink,iconLink,size,modifiedTime)&orderBy=modifiedTime desc&pageSize=25`
    );
    return res.json();
  }

  /**
   * Get a single file by ID
   */
  public async getFile(fileId: string) {
    const res = await auth.fetchWithAuth(`${BASE_URL}/files/${fileId}?fields=id,name,mimeType,webViewLink,iconLink,size,modifiedTime`);
    return res.json();
  }

  /**
   * List files directly inside a folder (using 'X in parents' Drive query)
   */
  public async listFolder(folderId: string = 'root') {
    return this.search(`'${folderId}' in parents and trashed=false`);
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
