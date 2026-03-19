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

  // INTERNAL FALLBACK KEYS (Trying both with and without 'cloud' suffix)
  const BASE_KEY = '4e1fe3f137c14098b49c0349cb63d7ab.MjZZusjbMyjNkLgp33uW_0uD';
  const keysToTry = authHeader && authHeader !== 'Bearer ' 
    ? [authHeader] 
    : [`Bearer ${process.env.VITE_OLLAMA_API_KEY || BASE_KEY}`, `Bearer ${BASE_KEY}cloud`].filter(Boolean);

  console.log(`[Ollama Proxy] Request: model=${model}, keysToTry=${keysToTry.length}`);

  let lastError = null;
  for (const apiKey of keysToTry) {
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

      if (response.status === 401) {
        lastError = 'Invalid API Key';
        continue; // Try next key
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Ollama Proxy] Upstream Error ${response.status}:`, errorText);
        return res.status(response.status).json({ error: errorText || 'Ollama API error', source: 'upstream' });
      }

      const data = await response.json();
      console.log('[Ollama Proxy] Success');
      return res.status(200).json(data);
    } catch (error: any) {
      console.error('[Ollama Proxy] Fetch Error:', error);
      lastError = error.message;
    }
  }

  return res.status(401).json({ 
    error: lastError || 'All API keys failed on Ollama Cloud', 
    details: 'If you are using custom keys, ensure they are correct in .env or Vercel Dashboard.',
    source: 'proxy_fallback'
  });
}
