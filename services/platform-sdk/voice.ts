import { auth } from './auth';

const BASE_URL = 'https://speech.googleapis.com/v1';

class VoiceService {
  /**
   * Recognizes speech from audio content using Google Cloud Speech-to-Text
   */
  public async recognize(audioContentBase64: string, languageCode: string = 'ar-SA') {
    const res = await auth.fetchWithAuth(`${BASE_URL}/speech:recognize`, {
      method: 'POST',
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          languageCode: languageCode,
        },
        audio: {
          content: audioContentBase64
        }
      })
    });
    return res.json();
  }
}

export const voice = new VoiceService();
