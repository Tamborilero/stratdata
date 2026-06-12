import { list } from '@vercel/blob';
import { isAuthed } from '../lib/auth.js';

export default async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).json({ error: 'auth' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { blobs } = await list({ prefix: 'cargas/' });
    const items = blobs
      .map((b) => ({
        pathname: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt,
      }))
      .sort((x, y) => new Date(y.uploadedAt) - new Date(x.uploadedAt));
    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
