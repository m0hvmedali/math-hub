import { auth } from './auth';

const BASE_URL = 'https://www.googleapis.com/calendar/v3';

class CalendarService {
  /**
   * List user's primary calendar events from now
   */
  public async getEvents(maxResults: number = 10) {
    const now = new Date().toISOString();
    const res = await auth.fetchWithAuth(
      `${BASE_URL}/calendars/primary/events?timeMin=${now}&maxResults=${maxResults}&orderBy=startTime&singleEvents=true`
    );
    return res.json();
  }

  /**
   * Create a new event
   * @param summary Title
   * @param start ISO String
   * @param end ISO String
   * @param description Optional
   */
  public async createEvent(summary: string, start: string, end: string, description?: string) {
    const res = await auth.fetchWithAuth(`${BASE_URL}/calendars/primary/events`, {
      method: 'POST',
      body: JSON.stringify({
        summary,
        description,
        start: { dateTime: start },
        end: { dateTime: end }
      })
    });
    return res.json();
  }

  /**
   * Delete an event
   */
  public async deleteEvent(eventId: string) {
    const res = await auth.fetchWithAuth(`${BASE_URL}/calendars/primary/events/${eventId}`, {
      method: 'DELETE'
    });
    return res;
  }
}

export const calendar = new CalendarService();
