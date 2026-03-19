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

  // INTERNAL FALLBACK KEYS
  const BASE_KEY = '4e1fe3f137c14098b49c0349cb63d7ab.MjZZusjbMyjNkLgp33uW_0uD';
  const variations = [
    BASE_KEY,
    `${BASE_KEY}cloud`,
    `Bearer ${BASE_KEY}`,
    `Bearer ${BASE_KEY}cloud`
  ];

  const keysToTry = (authHeader && authHeader !== 'Bearer ') 
    ? [authHeader, ...variations] 
    : variations;

  console.log(`[Ollama Proxy] Starting diagnostic run with ${keysToTry.length} keys...`);

  let lastStatus = 0;
  let lastBody = '';

  for (const apiKey of keysToTry) {
    try {
      // Ensure we have a properly formatted Bearer token for the real request
      const finalAuth = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
      
      const response = await fetch('https://ollama.com/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': finalAuth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: stream || false,
          format: format || undefined,
        }),
      });

      lastStatus = response.status;
      lastBody = await response.text();

      if (response.ok) {
        console.log('[Ollama Proxy] ✅ Success');
        return res.status(200).json(JSON.parse(lastBody));
      }

      console.warn(`[Ollama Proxy] ⚠️ Key failed with ${response.status}: ${lastBody.slice(0, 50)}...`);
      if (response.status !== 401) break; // If it's not an auth error, don't keep trying keys
    } catch (error: any) {
      console.error('[Ollama Proxy] ❌ Fetch Error:', error.message);
      lastBody = error.message;
    }
  }

  // If we got here, all attempts failed. Return a 200 with an error object
  // so the frontend can read the internal details without browser 401 blocking.
  return res.status(200).json({ 
    error: true,
    message: 'Ollama Cloud Authentication Failed',
    lastStatus,
    upstreamBody: lastBody,
    diagnostics: {
      model,
      keysAttempted: keysToTry.length,
      envKeySet: !!process.env.VITE_OLLAMA_API_KEY
    }
  });
}
