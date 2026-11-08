// Servidor estático para abrir el visor en local desde la raíz del proyecto: node motor/serve.mjs
// Después: http://localhost:5180/motor/visor.html?scene=/departamentos/depto5/scene.json
import http from 'node:http';
import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

// ROOT=sitio sirve esa carpeta como raíz, igual que Cloudflare Pages (para probar el sitio armado sin subirlo); las
// carpetas abren su index.html
const project = fileURLToPath(new URL('..', import.meta.url));
const root = process.env.ROOT ? join(project, process.env.ROOT, '/') : project;
const port = Number(process.env.PORT) || 5180;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

http.createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  // comparar.html y verificar.html guardan sus hojas y resúmenes en /capturas, exportar.html las entregas en /entregas
  // (solo imágenes, JSON y SVG, solo dentro de esas dos carpetas); texturas.html, las texturas de imagen en
  // departamentos/<id>/tex/
  if (req.method === 'POST') {
    const file = normalize(join(root, path)), rel = file.slice(root.length).split(/[\\/]/).filter(Boolean);
    const okDir = ['capturas', 'entregas'].some(d => file.startsWith(join(root, d)))
      || (rel[0] === 'departamentos' && rel.length === 4 && rel[2] === 'tex' && rel[3].endsWith('.jpg'))
      || (rel[0] === 'departamentos' && rel.length === 3 && rel[2] === 'gi.json')   // luz rebotada (motor/hornear.html)
      || (rel[0] === 'motor' && rel[1] === 'texturas' && rel.length === 3 && /\.(webp|js)$/.test(rel[2]));   // motor/generar-texturas.html
    if (!okDir || !/\.(png|jpg|json|svg|webp|js)$/.test(file)) { res.writeHead(403); return res.end(); }
    const chunks = []; for await (const c of req) chunks.push(c);
    await mkdir(dirname(file), { recursive: true }); await writeFile(file, Buffer.concat(chunks));
    res.writeHead(201); return res.end();
  }
  // lista de departamentos (carpetas de departamentos/ con scene.json), para verificar.html
  if (path === '/api/deptos') {
    const all = await readdir(join(root, 'departamentos'), { withFileTypes: true }), ids = [];
    for (const d of all) if (d.isDirectory()) await access(join(root, 'departamentos', d.name, 'scene.json')).then(() => ids.push(d.name), () => {});
    res.writeHead(200, { 'content-type': types['.json'], 'cache-control': 'no-store' }); return res.end(JSON.stringify(ids));
  }
  if (path === '/' && !process.env.ROOT) path = '/motor/visor.html';
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(root, path));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('No encontrado');
  }
}).listen(port, () => console.log(`Visor en http://localhost:${port}/motor/visor.html?scene=/departamentos/depto5/scene.json`));
