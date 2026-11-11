module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.NVIDIA_API_KEY) return res.status(503).json({ error: 'NVIDIA_API_KEY is not configured' });
  const input = String(req.body?.input || '').trim();
  if (!input) return res.status(400).json({ error: 'Missing input' });
  const prompt = `You are a presentation editor. Understand the spoken idea and rewrite it naturally instead of copying it. Preserve the user's language: Arabic input gets Arabic output; English input gets English output. Return ONLY JSON: {"title":"a concise paraphrased presentation title","subheader":"a polished AI-written subheader","speech":"one natural sentence to speak aloud","cards":[{"label":"short label","text":"short distinct idea","tone":"red|yellow|blue|green"}]}. Example input: "kingdom of emirates issues" -> title: "The Emirati Issues", with a clear explanatory subheader. Create 3-4 useful cards. No filler, no meta commentary, no mention of AI. Input: ${input}`;
  const upstream = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`, 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct', messages: [{ role: 'user', content: prompt }], temperature: 0.75, max_tokens: 700 }) });
  if (!upstream.ok) { const detail = await upstream.text(); return res.status(502).json({ error: `NVIDIA ${upstream.status}`, detail: detail.slice(0, 800) }); }
  const json = await upstream.json();
  const content = json.choices?.[0]?.message?.content || '';
  try { const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || content); return res.status(200).json(parsed); } catch { return res.status(502).json({ error: 'Invalid model response' }); }
}
