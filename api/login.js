import { makeToken, sessionCookie, passwordOk } from '../lib/auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'metodo' });

  const secret = process.env.AUTH_SECRET;
  const expected = process.env.APP_PASSWORD;
  if (!secret || !expected) return res.status(500).json({ error: 'falta_config' });

  const password = req.body && req.body.password;
  if (!passwordOk(password, expected)) return res.status(401).json({ error: 'clave' });

  res.setHeader('Set-Cookie', sessionCookie(makeToken(secret)));
  return res.status(200).json({ ok: true });
}
