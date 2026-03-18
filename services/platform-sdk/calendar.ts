import { auth } from './auth';

const BASE_URL = 'https://www.googleapis.com/calendar/v3';

class CalendarService {
  /**
   * Retrieves events from the specified calendar
   */
  public async getEvents(calendarId: string = 'primary') {
    const res = await auth.fetchWithAuth(`${BASE_URL}/calendars/${calendarId}/events`);
    return res.json();
  }

  /**
   * Adds an event to the specified calendar
   */
  public async addEvent(event: any, calendarId: string = 'primary') {
    const res = await auth.fetchWithAuth(`${BASE_URL}/calendars/${calendarId}/events`, {
      method: 'POST',
      body: JSON.stringify(event)
    });
    return res.json();
  }
}

export const calendar = new CalendarService();
