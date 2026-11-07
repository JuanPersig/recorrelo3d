// Aplica al scene.json las cámaras ajustadas por motor/encuadre.html (T-27): node motor/encuadre.mjs <depto> [--aplicar] [--solo=dormitorio,cocina]
// Lee capturas/<depto>/encuadre.json y reemplaza "pos", "target" y "fov" de cada vista. Sin --solo, solo las vistas
// cuyo puntaje mejoró al menos 0,02 (mirar antes las láminas capturas/t27/<depto>-<vista>.jpg). Edita en su lugar.
import { readFileSync, writeFileSync } from 'node:fs';
import { parse, get } from './jsonpos.mjs';

const [id, ...flags] = process.argv.slice(2);
if (!id) { console.error('Uso: node motor/encuadre.mjs <depto> [--aplicar] [--solo=a,b]'); process.exit(1); }
const root = new URL('..', import.meta.url), file = new URL(`departamentos/${id}/scene.json`, root);
const list = JSON.parse(readFileSync(new URL(`capturas/${id}/encuadre.json`, root), 'utf8')).vistas;
const solo = flags.find(f => f.startsWith('--solo='))?.slice(7).split(',');
let text = readFileSync(file, 'utf8');
const views = get(parse(text), 'views'), edits = [];
for (const v of list) {
  const sel = solo ? solo.includes(v.vista) : v.despues.puntaje - v.antes.puntaje >= 0.02;
  console.log(`${sel ? '✔' : ' '} ${v.vista}: puntaje ${v.antes.puntaje} → ${v.despues.puntaje} (${Math.round(v.mueve * 100)} cm, ${v.gira}°, fov ${v.dfov}°)`);
  if (!sel) continue;
  const node = get(views, v.vista);
  for (const k of ['pos', 'target', 'fov']) { const n = get(node, k); if (n) edits.push({ at: n.start, end: n.end, s: k === 'fov' ? String(v.despues.fov) : `[${v.despues[k].join(', ')}]` }); }
}
if (!flags.includes('--aplicar')) { console.log('\nSin cambios (agregar --aplicar para escribir el scene.json).'); process.exit(0); }
edits.sort((a, b) => b.at - a.at);
for (const e of edits) text = text.slice(0, e.at) + e.s + text.slice(e.end);
JSON.parse(text);
writeFileSync(file, text);
console.log(`\n${edits.length} cambios escritos en departamentos/${id}/scene.json`);
