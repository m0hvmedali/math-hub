import { auth } from './auth';

const BASE_URL = 'https://translation.googleapis.com/language/translate/v2';

class TranslateService {
  /**
   * Translates text to the target language
   */
  public async translateText(text: string, targetLanguage: string) {
    const res = await auth.fetchWithAuth(`${BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        target: targetLanguage
      })
    });
    return res.json();
  }
}

export const translate = new TranslateService();
