import { put } from '@vercel/blob';
import { isAuthed } from '../lib/auth.js';

// Recibe el .xlsx como cuerpo binario (application/octet-stream) y lo guarda en Blob.
// El nombre original viaja en el header x-filename.
export default async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).json({ error: 'auth' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'metodo' });

  try {
    const rawName = (req.headers['x-filename'] || 'carga.xlsx').toString();
    const safeName = rawName.replace(/[^\w.\-]+/g, '_').slice(-80) || 'carga.xlsx';

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buf = Buffer.concat(chunks);
    if (!buf.length) return res.status(400).json({ error: 'archivo_vacio' });

    const blob = await put(`cargas/${safeName}`, buf, {
      access: 'private',
      addRandomSuffix: true,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    return res.status(200).json({ ok: true, pathname: blob.pathname });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
