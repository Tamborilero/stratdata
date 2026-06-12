import { get, put } from '@vercel/blob';
import { isAuthed } from '../lib/auth.js';

// Excel acumulativo de compromisos en el servidor. El .xlsx lo genera el
// cliente (con SheetJS) y lo sube aquí; este endpoint lo guarda y lo entrega.
const PATH = 'compromisos/historial.xlsx';
const XLSX_CT = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

async function streamToBuffer(stream) {
  if (stream && typeof stream.getReader === 'function') {
    return Buffer.from(await new Response(stream).arrayBuffer());
  }
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).json({ error: 'auth' });
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'POST') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const buf = Buffer.concat(chunks);
      if (!buf.length) return res.status(400).json({ error: 'vacio' });
      await put(PATH, buf, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: XLSX_CT,
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'GET') {
      const r = await get(PATH, { access: 'private' });
      if (!r || !r.stream) return res.status(404).json({ error: 'no_existe' });
      const buf = await streamToBuffer(r.stream);
      res.setHeader('Content-Type', XLSX_CT);
      return res.status(200).send(buf);
    }

    return res.status(405).json({ error: 'metodo' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
