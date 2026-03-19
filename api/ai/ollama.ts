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

  // INTERNAL FALLBACK KEY
  const DEFAULT_KEY = '4e1fe3f137c14098b49c0349cb63d7ab.MjZZusjbMyjNkLgp33uW_0uDcloud';
  const apiKey = (authHeader && authHeader !== 'Bearer ') ? authHeader : `Bearer ${process.env.VITE_OLLAMA_API_KEY || DEFAULT_KEY}`;

  console.log(`[Ollama Proxy] Request: model=${model}, usingFallback=${!authHeader || authHeader === 'Bearer '}`);

  try {
    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
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
      console.error(`[Ollama Proxy] Upstream Error ${response.status}:`, errorText);
      return res.status(response.status).json({ error: errorText || 'Ollama API error' });
    }

    const data = await response.json();
    console.log('[Ollama Proxy] Success');
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[Ollama Proxy] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
