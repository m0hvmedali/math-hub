import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * 🛰️ Ollama Proxy Service
 * Bypass CORS restrictions by routing Ollama Cloud requests through Vercel's edge/serverless layer.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { model, messages, stream, format } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  try {
    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: stream || false,
        format: format || undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText || 'Ollama API error' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[Ollama Proxy] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
