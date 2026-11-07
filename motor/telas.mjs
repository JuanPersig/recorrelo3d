// Aplica los estampados recortados de las fotos (T-24): node motor/telas.mjs <depto> [--aplicar] [--todas] [--solo=1,3]
// Lee capturas/<depto>/telas.json (lo escribe motor/telas.html?depto=<depto>) y agrega en cada mueble de ese tipo
// que tiene la tela de ese color "textures": { "<color>": "tex/tela-….jpg" } (el motor le pone la imagen a esa pieza).
// Por defecto solo las aceptadas; --todas, todas; --solo, las elegidas por número. Edita el texto en su lugar.
import { readFileSync, writeFileSync } from 'node:fs';
import { parse, get, findColor } from './jsonpos.mjs';

const [id, ...flags] = process.argv.slice(2);
if (!id) { console.error('Uso: node motor/telas.mjs <depto> [--aplicar] [--todas] [--solo=1,3]'); process.exit(1); }
const root = new URL('..', import.meta.url), file = new URL(`departamentos/${id}/scene.json`, root);
const list = JSON.parse(readFileSync(new URL(`capturas/${id}/telas.json`, root), 'utf8')).telas;
const solo = flags.find(f => f.startsWith('--solo='))?.slice(7).split(',').map(Number);
const all = flags.includes('--todas'), apply = flags.includes('--aplicar');
let text = readFileSync(file, 'utf8');
const tree = parse(text), items = [tree, ...(get(tree, 'levels')?.items ?? [])].flatMap(L => get(L, 'items')?.items ?? []), edits = [];
list.forEach((t, n) => {
  const sel = solo ? solo.includes(n + 1) : (all || t.aceptada);
  // los muebles de ese tipo que tienen ese color en sus parámetros (si es el color por defecto del componente, no se
  // puede saber cuáles son: se informa y no se aplica)
  const targets = items.filter(it => get(it, 'type')?.v === t.type && findColor(get(it, 'params'), t.color).length && !get(get(it, 'params'), 'textures'));
  console.log(`${sel ? '✔' : ' '} ${String(n + 1).padStart(2)} ${t.type} ${t.color}: ${t.texture} (dibujo ${t.dibujo}) · ${targets.length} mueble(s)`);
  if (!sel) return;
  for (const it of targets) { const p = get(it, 'params'); edits.push({ at: p.start + 1, s: ` "textures": { "${t.color}": "${t.texture}" },` }); }
});
if (!apply) { console.log('\nSin cambios (agregar --aplicar para escribir el scene.json).'); process.exit(0); }
edits.sort((a, b) => b.at - a.at);
for (const e of edits) text = text.slice(0, e.at) + e.s + text.slice(e.at);
JSON.parse(text);
writeFileSync(file, text);
console.log(`\n${edits.length} cambios escritos en departamentos/${id}/scene.json`);
