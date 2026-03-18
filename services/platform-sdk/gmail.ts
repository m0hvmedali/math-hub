import { auth } from './auth';

const BASE_URL = 'https://gmail.googleapis.com/gmail/v1';

class GmailService {
  /**
   * Get mailbox profile (email address, etc)
   */
  public async getProfile() {
    const res = await auth.fetchWithAuth(`${BASE_URL}/users/me/profile`);
    return res.json();
  }

  /**
   * List emails with optional query (inbox, sent, etc.)
   */
  public async listMessages(query: string = '', maxResults = 20) {
    const q = query ? `&q=${encodeURIComponent(query)}` : '';
    const res = await auth.fetchWithAuth(`${BASE_URL}/users/me/messages?maxResults=${maxResults}${q}`);
    return res.json();
  }

  /**
   * Get a single email by ID with full payload
   */
  public async getMessage(messageId: string) {
    const res = await auth.fetchWithAuth(`${BASE_URL}/users/me/messages/${messageId}?format=full`);
    return res.json();
  }

  /**
   * Get email thread
   */
  public async getThread(threadId: string) {
    const res = await auth.fetchWithAuth(`${BASE_URL}/users/me/threads/${threadId}?format=full`);
    return res.json();
  }

  /**
   * Send a plain text or HTML email
   */
  public async send(to: string, subject: string, body: string, replyToThreadId?: string) {
    const headers = [
      `To: ${to}`,
      'Content-type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
    ];
    const email = [...headers, '', body].join('\n');
    const base64 = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-').replace(/\//g, '_');

    const payload: any = { raw: base64 };
    if (replyToThreadId) payload.threadId = replyToThreadId;

    const res = await auth.fetchWithAuth(`${BASE_URL}/users/me/messages/send`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  /**
   * Trash a message (soft delete)
   */
  public async trash(messageId: string) {
    const res = await auth.fetchWithAuth(`${BASE_URL}/users/me/messages/${messageId}/trash`, {
      method: 'POST',
    });
    return res.json();
  }

  /**
   * Permanently delete a message
   */
  public async deleteForever(messageId: string) {
    const res = await auth.fetchWithAuth(`${BASE_URL}/users/me/messages/${messageId}`, {
      method: 'DELETE',
    });
    return res;
  }

  /**
   * Mark message as read
   */
  public async markAsRead(messageId: string) {
    const res = await auth.fetchWithAuth(`${BASE_URL}/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
    });
    return res.json();
  }

  /**
   * Star / unstar a message
   */
  public async star(messageId: string, star = true) {
    const res = await auth.fetchWithAuth(`${BASE_URL}/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      body: JSON.stringify(
        star
          ? { addLabelIds: ['STARRED'] }
          : { removeLabelIds: ['STARRED'] }
      )
    });
    return res.json();
  }
}

export const gmail = new GmailService();
