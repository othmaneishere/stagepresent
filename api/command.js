module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.NVIDIA_API_KEY) return res.status(503).json({ error: 'NVIDIA_API_KEY is not configured' });
  const input = String(req.body?.input || '').trim();
  const prompt = `You are a presentation canvas command interpreter. Execute the user's instruction as an operation, not as a summary. Return ONLY JSON. Allowed shapes: {"action":"add_slide|clear_slide|next_slide|previous_slide|add_elements|remove_elements|build_slide","elements":[{"type":"rectangle|circle|line|text|card","x":0-100,"y":0-100,"w":1-100,"h":1-100,"color":"#hex","text":""}],"text":""}. Coordinates are percentages of a 16:9 slide. For a white rectangle in the middle return add_elements with one rectangle x=35,y=35,w=30,h=30,color=#F5F5F0. For clear/delete return clear_slide. Preserve existing content unless explicitly asked to clear. Command: ${input}`;
  const upstream = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', { method:'POST', headers:{'Authorization':`Bearer ${process.env.NVIDIA_API_KEY}`,'Content-Type':'application/json'}, body:JSON.stringify({model:process.env.NVIDIA_MODEL||'meta/llama-3.1-8b-instruct',messages:[{role:'user',content:prompt}],temperature:.15,max_tokens:300})});
  if (!upstream.ok) return res.status(502).json({error:'NVIDIA request failed'});
  const j=await upstream.json();const c=j.choices?.[0]?.message?.content||'';try{return res.status(200).json(JSON.parse(c.match(/\{[\s\S]*\}/)?.[0]||c))}catch{return res.status(502).json({error:'Invalid command response'})}
};
