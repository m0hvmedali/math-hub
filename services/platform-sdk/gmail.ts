import { auth } from './auth';

const BASE_URL = 'https://gmail.googleapis.com/gmail/v1';

class GmailService {
  /**
   * Search for messages in Gmail
   */
  public async listMessages(query: string = '') {
    const res = await auth.fetchWithAuth(`${BASE_URL}/users/me/messages?q=${encodeURIComponent(query)}`);
    return res.json();
  }

  /**
   * Send an email cleanly
   */
  public async send(to: string, subject: string, body: string) {
    const email = [
      `To: ${to}`,
      'Content-type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');
    
    // Convert to web-safe Base64 as required by Gmail API
    const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const res = await auth.fetchWithAuth(`${BASE_URL}/users/me/messages/send`, {
      method: 'POST',
      body: JSON.stringify({ raw: base64EncodedEmail })
    });
    return res.json();
  }
}

export const gmail = new GmailService();
