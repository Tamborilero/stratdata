import { next, rewrite } from '@vercel/edge';

// Corre antes del sistema de archivos. Solo en la raiz "/".
export const config = {
  matcher: '/',
};

export default function middleware(request) {
  const { hostname } = new URL(request.url);

  // En el subdominio, servir el dashboard en la raiz sin cambiar la URL.
  if (hostname === 'rentaselisur.stratdata.cl') {
    return rewrite(new URL('/dashboard_deuda.html', request.url));
  }

  // Apex y www siguen con su comportamiento normal (index.html).
  return next();
}
