/**
 * Google AI Services for Platform SDK
 * Wraps @google/generative-ai
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Uses the API key from env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

class GoogleAIManager {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(API_KEY);
  }

  /**
   * Generates text content using Gemini Pro
   */
  public async generateText(prompt: string, modelType: string = 'gemini-1.5-pro'): Promise<string> {
    if (!API_KEY) {
      throw new Error('Gemini API Key is missing');
    }

    const model = this.genAI.getGenerativeModel({ model: modelType });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Generates answers using an image provided via Base64 or Blob
   */
  public async generateWithImage(prompt: string, base64Image: string, mimeType: string): Promise<string> {
    if (!API_KEY) {
      throw new Error('Gemini API Key is missing');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const imageParts = [
      {
        inlineData: {
          data: base64Image.split(',')[1] || base64Image, // remove data prefix if exists
          mimeType
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return response.text();
  }
}

export const ai = new GoogleAIManager();
