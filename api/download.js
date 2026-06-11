import { list } from '@vercel/blob';
import { isAuthed } from '../lib/auth.js';

// Devuelve el .xlsx pedido. No expone la URL pública del Blob: la resuelve en
// el servidor y transmite los bytes solo a un cliente autenticado.
export default async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).json({ error: 'auth' });

  const pathname = (req.query.pathname || '').toString();
  if (!pathname.startsWith('cargas/')) return res.status(400).json({ error: 'path' });

  try {
    const { blobs } = await list({ prefix: 'cargas/' });
    const match = blobs.find((b) => b.pathname === pathname);
    if (!match) return res.status(404).json({ error: 'no_existe' });

    const upstream = await fetch(match.url);
    if (!upstream.ok) return res.status(502).json({ error: 'blob' });
    const arrayBuf = await upstream.arrayBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(Buffer.from(arrayBuf));
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
