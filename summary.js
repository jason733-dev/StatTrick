async function callClaude(prompt, apiKey) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      // Check docs.claude.com for the current recommended model string
      // if this one is ever retired.
      model: 'claude-sonnet-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await r.json();
  if (!r.ok) {
    console.error('Claude API error', data);
    throw { status: r.status, message: data.error?.message || 'Claude API error' };
  }
  return (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

async function callGemini(prompt, apiKey) {
  // Check ai.google.dev/gemini-api/docs/models for the current recommended
  // model string if this one is ever retired.
  const model = 'gemini-2.5-flash';
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000 },
      }),
    }
  );
  const data = await r.json();
  if (!r.ok) {
    console.error('Gemini API error', data);
    throw { status: r.status, message: data.error?.message || 'Gemini API error' };
  }
  return (data.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || '')
    .join('\n')
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { prompt, provider } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  const chosen = provider === 'gemini' ? 'gemini' : 'claude';

  try {
    let text;
    if (chosen === 'gemini') {
      const key = process.env.GEMINI_API_KEY;
      if (!key) { res.status(500).json({ error: 'Server is missing GEMINI_API_KEY' }); return; }
      text = await callGemini(prompt, key);
    } else {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) { res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' }); return; }
      text = await callClaude(prompt, key);
    }
    res.status(200).json({ text, provider: chosen });
  } catch (err) {
    console.error('summary API error', err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Summary request failed' });
  }
}
