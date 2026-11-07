// Arma el sitio público con todos los recorridos (T-17): node motor/publicar.mjs [depto …]
// Un solo sitio estático para todos los departamentos, cada uno en su carpeta: https://<sitio>/<carpeta>/. Así alcanza
// con una sola dirección gratuita (por ejemplo <proyecto>.pages.dev de Cloudflare Pages) y no hace falta un dominio por
// departamento; si algún día hay dominio propio, se apunta al mismo sitio y las carpetas no cambian.
// - publicar.json (en la raíz) guarda la dirección del sitio y la carpeta de cada departamento. La carpeta se inventa
//   una sola vez (id + 4 letras al azar, para que no se pueda adivinar la de otro) y no cambia nunca: el QR de la
//   tarjeta impresa apunta ahí. Se puede editar a mano antes de imprimir el primer QR; si se cambia después, la vieja
//   va en "redirecciones" ({ "vieja": "nueva" }) y el sitio la redirige (_redirects de Cloudflare Pages).
// - Sin argumentos publica los que ya están en publicar.json; con argumentos, agrega o actualiza esos.
// - Deja todo en sitio/: una carpeta por departamento (el paquete de empaquetar.mjs), la portada (la landing si
//   publicar.json tiene "landing"; si no, una neutra sin lista: nadie ve los otros departamentos), robots.txt y
//   _headers para que los buscadores no indexen los recorridos.
// - En el visor publicado el scene.json es fijo: se saca el ?scene=, que permitiría mostrar otro departamento con
//   nuestra dirección.
// Después: subir la carpeta sitio/ al hosting (ver SKILL.md, paso 8) y regenerar el QR con la dirección que imprime.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const cfgFile = path.join(root, 'publicar.json');
const cfg = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')) : { sitio: '', deptos: {} };
const asked = process.argv.slice(2);
const ids = [...new Set([...Object.keys(cfg.deptos), ...asked])];
if (!ids.length) { console.error('Uso: node motor/publicar.mjs <depto> [depto …]'); process.exit(1); }

const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const code = () => [...randomBytes(4)].map(b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');
const out = path.join(root, 'sitio');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const id of ids) {
  const sceneFile = path.join(root, 'departamentos', id, 'scene.json');
  if (!fs.existsSync(sceneFile)) { console.error(`No existe departamentos/${id}/scene.json`); process.exit(1); }
  const scene = JSON.parse(fs.readFileSync(sceneFile, 'utf8'));
  // carpeta neutra (el id + 4 letras): el nombre puede traer calles y la dirección no va en nada público; se puede
  // cambiar a mano por un nombre propio ("departamento-prueba") en publicar.json antes de imprimir el primer QR
  cfg.deptos[id] ??= `${slug(id)}-${code()}`;
  execFileSync(process.execPath, [path.join(root, 'motor', 'empaquetar.mjs'), id], { stdio: 'ignore' });
  const dest = path.join(out, cfg.deptos[id]);
  fs.cpSync(path.join(root, 'dist', id), dest, { recursive: true });
  const page = path.join(dest, 'index.html'), html = fs.readFileSync(page, 'utf8');
  const fixed = "const src = params.get('scene') ?? './scene.json';";
  if (!html.includes(fixed)) throw new Error(`${id}: no encuentro dónde fijar el scene.json en el visor`);
  // los recorridos no van a los buscadores: también en la página, por si el encabezado no llega
  const noindex = '<meta name="robots" content="noindex">\n';
  fs.writeFileSync(page, noindex + html.replace(fixed, "const src = './scene.json';"));
}

// Portada. Con "landing" en publicar.json (la carpeta compilada de la landing, por ejemplo
// "../LANDING_PAGE_RECORRELO3D/dist"), la raíz del sitio es la landing; si no, una portada neutra sin lista. De la
// landing se copian su index.html, sus .js/.css y solo las imágenes que nombran (no la carpeta pública entera: tenía
// fotos de otros anuncios sin usar). Su carpeta "assets" no puede chocar con la de un departamento.
const landing = cfg.landing ? path.resolve(root, cfg.landing) : null;
if (landing) {
  if (!fs.existsSync(path.join(landing, 'index.html'))) { console.error(`No encuentro ${landing}/index.html: compilá la landing (npm run build)`); process.exit(1); }
  if (Object.values(cfg.deptos).includes('assets')) { console.error('Ningún departamento puede usar la carpeta "assets" (la usa la landing)'); process.exit(1); }
  const dir = path.join(landing, 'assets'), srcs = [path.join(landing, 'index.html')];
  const all = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  srcs.push(...all.filter(f => /\.(js|css)$/.test(f)).map(f => path.join(dir, f)));
  const text = srcs.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const used = all.filter(f => /\.(js|css)$/.test(f) || text.includes(`/assets/${f}`) || text.includes(`assets/${f}`));
  fs.mkdirSync(path.join(out, 'assets'), { recursive: true });
  // los archivos sueltos de la raíz de la landing (index.html, el ícono); carpetas, solo "assets"
  for (const e of fs.readdirSync(landing, { withFileTypes: true })) if (e.isFile()) fs.copyFileSync(path.join(landing, e.name), path.join(out, e.name));
  for (const f of used) fs.copyFileSync(path.join(dir, f), path.join(out, 'assets', f));
  console.log(`Landing: ${used.length} de ${all.length} archivos de assets (los demás no se usan y no se publican)`);
} else {
  const brand = Object.keys(cfg.deptos).map(id => JSON.parse(fs.readFileSync(path.join(root, 'departamentos', id, 'scene.json'), 'utf8')).brand).find(Boolean);
  fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${brand?.name ?? 'Recorridos 3D'}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f4ef;color:#1f2328;font:16px/1.5 system-ui,"Segoe UI",sans-serif;text-align:center;padding:16px}
@media (prefers-color-scheme:dark){body{background:#17191c;color:#eceae6}}</style></head>
<body><div><h1 style="font-size:1.4rem;margin:0 0 .3em">${brand?.name ?? 'Recorridos 3D'}</h1><p style="margin:0;opacity:.7">Para ver un departamento, abrí el link o escaneá el QR que te pasaron.</p></div></body></html>
`);
}
// Buscadores: con landing, la portada sí se indexa y los recorridos no. robots.txt no nombra las carpetas (es público y
// las dejaría a la vista): el "noindex" va por encabezado en cada carpeta (_headers no se publica) y en cada página
fs.writeFileSync(path.join(out, 'robots.txt'), landing ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(out, '_headers'), landing
  ? '/*\n  Referrer-Policy: no-referrer\n' + Object.values(cfg.deptos).map(c => `/${c}/*\n  X-Robots-Tag: noindex\n`).join('')
  : '/*\n  X-Robots-Tag: noindex\n  Referrer-Policy: no-referrer\n');
// carpetas que cambiaron de nombre: "redirecciones": { "<carpeta vieja>": "<carpeta nueva>" } en publicar.json. Así un
// QR ya impreso con la dirección vieja sigue llegando (con la vista y la noche que traiga el link). 302 y no 301: el
// navegador no lo recuerda para siempre, por si la carpeta vuelve a cambiar
const moved = Object.entries(cfg.redirecciones ?? {}).filter(([from, to]) => from !== to);
if (moved.length) fs.writeFileSync(path.join(out, '_redirects'),
  moved.map(([from, to]) => `/${from} /${to}/ 302\n/${from}/* /${to}/:splat 302\n`).join(''));
fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2) + '\n');

let files = 0, bytes = 0;
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { files++; bytes += fs.statSync(p).size; } } })(out);
console.log(`Sitio listo en sitio/: ${ids.length} departamentos, ${files} archivos, ${(bytes / 1e6).toFixed(1)} MB`);
const base = cfg.sitio ? cfg.sitio.replace(/\/?$/, '/') : '';
for (const id of ids) console.log(`  ${id}: ${base ? base + cfg.deptos[id] + '/' : `<sitio>/${cfg.deptos[id]}/`}`);
if (!base) console.log('Falta "sitio" en publicar.json (la dirección que da el hosting, por ejemplo https://recorridos.pages.dev).');
else console.log('QR: exportar.html?scene=/departamentos/<id>/scene.json&id=<id>&portada=<vista>&url=<link de arriba> y después node motor/kit.mjs <id>');
