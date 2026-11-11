module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.NVIDIA_API_KEY) return res.status(503).json({ error: 'NVIDIA_API_KEY is not configured' });
  const input = String(req.body?.input || '').trim();
  if (!input) return res.status(400).json({ error: 'Missing input' });
  const prompt = `أنت مصمم ومقدم عروض باللغة العربية. افهم الكلام المنطوق ثم أعد صياغته بذكاء، لا تنسخه. أرجع JSON فقط بهذا الشكل: {"speech":"رد عربي قصير طبيعي يُنطق بصوت عالٍ","cards":[{"label":"عنوان قصير","text":"عبارة عربية مختصرة","tone":"red|yellow|blue|green"}]}. أنشئ 4 بطاقات فقط، كل بطاقة تحمل فكرة واضحة ومختلفة. اجعل النص مناسباً لواجهة RTL حديثة، بلا مقدمات أو حشو أو كلام عن الذكاء الاصطناعي. الكلام: ${input}`;
  const upstream = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct', messages: [{ role: 'user', content: prompt }], temperature: 0.75, max_tokens: 700 }) });
  if (!upstream.ok) return res.status(502).json({ error: 'NVIDIA request failed' });
  const json = await upstream.json();
  const content = json.choices?.[0]?.message?.content || '';
  try { const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || content); return res.status(200).json(parsed); } catch { return res.status(502).json({ error: 'Invalid model response' }); }
}
