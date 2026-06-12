import { get, put } from '@vercel/blob';

// Historial de compromisos como un único JSON en el Blob privado (fuente de verdad).
const PATH = 'compromisos/historial.json';

async function streamToString(stream) {
  if (stream && typeof stream.getReader === 'function') {
    return await new Response(stream).text();
  }
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

export async function leerHistorial() {
  const res = await get(PATH, { access: 'private' });
  if (!res || !res.stream) return [];
  try {
    return JSON.parse(await streamToString(res.stream)) || [];
  } catch (e) {
    return [];
  }
}

export async function guardarHistorial(arr) {
  await put(PATH, JSON.stringify(arr), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}
