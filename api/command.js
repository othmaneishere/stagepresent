module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.NVIDIA_API_KEY) return res.status(503).json({ error: 'NVIDIA_API_KEY is not configured' });
  const input = String(req.body?.input || '').trim();
  const prompt = `Interpret this spoken presentation-editor command. Return ONLY JSON with one of these actions: add_slide, clear_slide, next_slide, previous_slide, build_slide, build_deck. Shape: {"action":"...","text":"rewritten content or empty"}. Examples: "add a slide about pricing" => add_slide with text pricing; "clear this slide" => clear_slide; "make this more concise" => build_slide with rewritten content. Command: ${input}`;
  const upstream = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct', messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 180 }) });
  if (!upstream.ok) return res.status(502).json({ error: 'NVIDIA request failed' });
  const json = await upstream.json(); const content = json.choices?.[0]?.message?.content || '';
  try { return res.status(200).json(JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || content)); } catch { return res.status(502).json({ error: 'Invalid command response' }); }
};
