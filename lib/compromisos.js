import { list, get, put, del } from '@vercel/blob';

// Cada compromiso es un blob independiente: compromisos/items/<id>.json
// Así eliminar es ATÓMICO (del de ese blob) y no hay carreras de
// lectura-modificación-escritura sobre un archivo compartido (que con el
// caché de Blob hacía "revivir" registros borrados).
const PREFIX = 'compromisos/items/';

async function streamToString(stream) {
  if (stream && typeof stream.getReader === 'function') {
    return await new Response(stream).text();
  }
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

export async function leerHistorial() {
  const { blobs } = await list({ prefix: PREFIX });
  const items = await Promise.all(
    blobs.map(async (b) => {
      try {
        const r = await get(b.pathname, { access: 'private' });
        if (!r || !r.stream) return null; // borrado pero aún listado: se ignora
        return JSON.parse(await streamToString(r.stream));
      } catch (e) {
        return null;
      }
    })
  );
  return items
    .filter(Boolean)
    .sort((a, b) => new Date(b.registradoEn) - new Date(a.registradoEn));
}

export async function agregarCompromiso(obj) {
  await put(PREFIX + obj.id + '.json', JSON.stringify(obj), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
}

export async function borrarCompromiso(id) {
  const path = PREFIX + id + '.json';
  const { blobs } = await list({ prefix: path });
  const b = blobs.find((x) => x.pathname === path);
  if (b) await del(b.url);
}
