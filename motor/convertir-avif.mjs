// Convierte las fotos .avif de una carpeta a .png (el navegador las decodifica y este servidor guarda el resultado).
// Uso: node motor/convertir-avif.mjs fotosDepartamento1   → abrir http://localhost:5179 en el navegador
// Resultado: <carpeta>-png/ con un .png por foto. Las originales no se tocan.
import http from 'node:http';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, basename, resolve } from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('Uso: node motor/convertir-avif.mjs <carpeta>'); process.exit(1); }
const SRC = resolve(dir), OUT = SRC + '-png', port = Number(process.env.PORT) || 5179;

const page = `<!doctype html><meta charset="utf-8"><body><pre id="log"></pre><script>
(async () => {
  const list = await (await fetch('/list')).json();
  const log = t => document.getElementById('log').textContent += t + '\\n';
  for (const f of list) {
    const img = new Image(); img.src = '/src/' + encodeURIComponent(f);
    await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    await fetch('/save/' + encodeURIComponent(f), { method: 'POST', body: c.toDataURL('image/png') });
    log(f + ' ' + img.naturalWidth + 'x' + img.naturalHeight);
  }
  log('LISTO');
})();
</script>`;

http.createServer(async (req, res) => {
  const [, kind, raw] = req.url.split('/'), file = raw ? decodeURIComponent(raw) : '';
  if (req.url === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page); }
  if (kind === 'list') {
    const all = (await readdir(SRC)).filter(f => f.toLowerCase().endsWith('.avif'));
    res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(all));
  }
  if (file && !file.includes('/') && !file.includes('\\') && !file.includes('..')) {
    if (kind === 'src') { res.writeHead(200, { 'content-type': 'image/avif' }); return res.end(await readFile(join(SRC, file))); }
    if (kind === 'save' && req.method === 'POST') {
      let body = ''; for await (const ch of req) body += ch;
      await mkdir(OUT, { recursive: true });
      await writeFile(join(OUT, basename(file, '.avif') + '.png'), Buffer.from(body.split(',')[1], 'base64'));
      res.writeHead(204); return res.end();
    }
  }
  res.writeHead(404); res.end();
}).listen(port, () => console.log(`Abrí http://localhost:${port} para convertir ${SRC} → ${OUT}`));
