import { auth } from './auth';

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

class GoogleDocsService {
  /**
   * Creates a new Google Doc from plain text content.
   * Returns the document ID.
   */
  public async exportNoteToDoc(title: string, content: string): Promise<{ id: string, url: string }> {
    const boundary = 'foo_bar_baz_boundary';
    const metadata = {
      name: title,
      mimeType: 'application/vnd.google-apps.document'
    };

    const requestBody =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: text/plain; charset=UTF-8\r\n\r\n` +
      `${content}\r\n` +
      `--${boundary}--`;

    const res = await auth.fetchWithAuth(DRIVE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: requestBody
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to create Google Doc:", errorText);
        throw new Error("Failed to export to Google Docs");
    }

    const data = await res.json();
    return {
        id: data.id,
        url: `https://docs.google.com/document/d/${data.id}/edit`
    };
  }
}

export const docs = new GoogleDocsService();
