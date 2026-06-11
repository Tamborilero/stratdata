import { get } from '@vercel/blob';
import { isAuthed } from '../lib/auth.js';

// Lee un .xlsx privado y transmite sus bytes solo a un cliente autenticado.
// En un store privado el contenido se entrega con get() (usa el token),
// nunca por una URL pública.
async function streamToBuffer(stream) {
  if (stream && typeof stream.getReader === 'function') {
    return Buffer.from(await new Response(stream).arrayBuffer());
  }
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).json({ error: 'auth' });

  const pathname = (req.query.pathname || '').toString();
  if (!pathname.startsWith('cargas/')) return res.status(400).json({ error: 'path' });

  try {
    const result = await get(pathname, { access: 'private' });
    if (!result || !result.stream) return res.status(404).json({ error: 'no_existe' });
    const buf = await streamToBuffer(result.stream);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
