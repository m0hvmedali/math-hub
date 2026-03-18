import { auth } from './auth';

const BASE_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

class DriveService {
  /**
   * Search files in Google Drive by name
   * Uses proper Drive API query syntax: name contains 'term'
   */
  public async search(rawQuery: string) {
    let q: string;

    // If the caller passed a pre-built Drive query (e.g. "'root' in parents"), use it as-is
    // Otherwise build a proper name-based search query
    const isRawDriveQuery = rawQuery.includes(' in ') || rawQuery.includes('name ') || rawQuery.includes('mimeType');
    if (isRawDriveQuery) {
      q = rawQuery;
    } else {
      // Escape single quotes in the search term
      const safe = rawQuery.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      q = `name contains '${safe}' and trashed=false`;
    }

    const res = await auth.fetchWithAuth(
      `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=nextPageToken,files(id,name,mimeType,webViewLink,iconLink,size)&orderBy=modifiedTime desc`
    );
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
