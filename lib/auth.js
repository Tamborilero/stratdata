// Autenticación por clave compartida con cookie firmada (HMAC). Sin dependencias externas.
import crypto from 'node:crypto';

export const COOKIE = 'cob_session';
const MAX_AGE = 60 * 60 * 12; // 12 horas

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

export function makeToken(secret) {
  const payload = String(Date.now() + MAX_AGE * 1000); // expiración
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyToken(token, secret) {
  if (!token || !secret) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const exp = Number(payload);
  return Number.isFinite(exp) && Date.now() <= exp;
}

export function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

export function isAuthed(req) {
  return verifyToken(getCookie(req, COOKIE), process.env.AUTH_SECRET);
}

export function sessionCookie(token) {
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`;
}

export function clearedCookie() {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

// Comparación de la clave en tiempo constante.
export function passwordOk(input, expected) {
  if (!expected) return false;
  const a = Buffer.from(String(input ?? ''));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
