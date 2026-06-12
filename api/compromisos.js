import { isAuthed } from '../lib/auth.js';
import { leerHistorial, agregarCompromiso, borrarCompromiso } from '../lib/compromisos.js';

const ACCIONES_VALIDAS = ['C', 'W', 'LL'];

export default async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).json({ error: 'auth' });
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ items: await leerHistorial() });
    }

    if (req.method === 'POST') {
      const nuevos = (req.body && req.body.compromisos) || [];
      if (!Array.isArray(nuevos) || !nuevos.length) {
        return res.status(400).json({ error: 'sin_datos' });
      }
      const ahora = new Date().toISOString();
      for (let i = 0; i < nuevos.length; i++) {
        const c = nuevos[i];
        await agregarCompromiso({
          id: Date.now().toString(36) + '-' + i + '-' + Math.random().toString(36).slice(2, 8),
          operador: String(c.operador || '').slice(0, 200),
          unidad: String(c.unidad || '').slice(0, 120),
          deuda: Number(c.deuda) || 0,
          monto: Number(c.monto) || 0,
          acciones: Array.isArray(c.acciones)
            ? c.acciones.filter((a) => ACCIONES_VALIDAS.includes(a))
            : [],
          deadline: String(c.deadline || '').slice(0, 20),
          comentario: String(c.comentario || '').slice(0, 500),
          registradoEn: ahora,
        });
      }
      return res.status(200).json({ items: await leerHistorial() });
    }

    if (req.method === 'DELETE') {
      const id = (req.query.id || '').toString();
      if (id) await borrarCompromiso(id);
      return res.status(200).json({ items: await leerHistorial() });
    }

    return res.status(405).json({ error: 'metodo' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
