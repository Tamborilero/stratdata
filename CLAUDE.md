# StratData — contexto del proyecto

Sitio estático de StratData. Este archivo documenta **cómo funciona el proyecto y su despliegue**, para humanos y para Claude Code.

## Qué es

Sitio web estático (HTML + assets, sin framework ni build propio). La home está en `index.html`. No hay backend.

## Integración GitHub ↔ Vercel (despliegue automático)

El proyecto está conectado de punta a punta: **escribir código → `git push` → sitio en vivo**. No se sube nada "a mano" a Vercel.

```
carpeta local  ──push──>  GitHub (repo Tamborilero/stratdata, rama main)  ──auto──>  Vercel (proyecto "index")  ──>  https://www.stratdata.cl
```

- **Repo GitHub:** `Tamborilero/stratdata`, rama de producción: `main`.
- **Vercel:** proyecto llamado **`index`**, conectado a ese repo. Cada push a `main` dispara un **deploy automático** a producción. (Esto es la "integración" de Vercel con GitHub: Vercel observa el repo y redespliega solo.)
- **Flujo para publicar un cambio:**
  ```bash
  git add <archivos>
  git commit -m "descripcion del cambio"
  git push origin main      # Vercel detecta el push y despliega en ~1-2 min
  ```

## DNS y dominios

- El dominio `stratdata.cl` usa los **nameservers de Vercel** (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`). Es decir, **el DNS lo administra Vercel**, no NIC Chile.
- Consecuencia práctica: al agregar un dominio o subdominio en el panel de Vercel, **Vercel crea el registro DNS automáticamente** y emite el certificado SSL. No hay que crear CNAMEs ni tocar un proveedor externo.
- Dominios actuales del proyecto: `stratdata.cl` (apex, redirige a www), `www.stratdata.cl` (home), `rentaselisur.stratdata.cl` (dashboard de cobranza).

## Subdominios con contenido distinto (mecanismo)

Para servir un archivo distinto en un subdominio (ej. `rentaselisur.stratdata.cl` → `dashboard_deuda.html`) se usa **Routing Middleware** de Vercel, no `vercel.json`.

**Por qué no `vercel.json`:** un `rewrite` con `source: "/"` no funciona, porque la ruta `/` ya coincide con `index.html` (archivo real) y el sistema de archivos gana; el rewrite se ignora.

**Solución que sí funciona** — `middleware.js` en la raíz, que corre *antes* del sistema de archivos y reescribe según el host:

- `middleware.js`: intercepta `/` y, si el host es el del subdominio, reescribe a su HTML; el resto (`apex`/`www`) continúa normal con `next()`.
- `package.json`: declara la dependencia `@vercel/edge` (sin build script; el sitio sigue siendo estático).

### Cómo agregar un nuevo subdominio

1. **Vercel:** proyecto `index` → Settings → Domains → escribir `nuevo.stratdata.cl` → Add. (El DNS y el SSL se configuran solos.)
2. **Código:** dejar el HTML del subdominio en la raíz (ej. `nuevo.html`) y agregar una rama por hostname en `middleware.js`:
   ```js
   if (hostname === 'nuevo.stratdata.cl') {
     return rewrite(new URL('/nuevo.html', request.url));
   }
   ```
3. `git commit` + `git push origin main`.

## Estructura de archivos

| Archivo | Rol |
|---|---|
| `index.html` | Home (www / apex) |
| `dashboard_deuda.html` | Dashboard servido en `rentaselisur.stratdata.cl` |
| `middleware.js` | Enrutamiento por subdominio (corre antes del filesystem) |
| `package.json` | Solo declara `@vercel/edge` para el middleware |
| `favicon.*`, `apple-touch-icon.png`, `og-image.jpg`, `site.webmanifest`, `android-chrome-*.png` | Íconos y metadatos del sitio |

## Nota de seguridad

No incrustar tokens de acceso (PAT de GitHub) en la URL del remote de git. Usar **Git Credential Manager** para que las credenciales no queden en texto plano dentro de `.git/config`.
