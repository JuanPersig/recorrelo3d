// Aplica al scene.json las texturas de imagen enderezadas desde las fotos (T-23): node motor/texturas.mjs <depto> [--aplicar] [--todas]
// Lee capturas/<depto>/texturas.json (lo escribe motor/texturas.html?depto=<depto>). Un piso recibe "texture" y
// "textureSize" en su "floor", y también los otros ambientes con el mismo piso (mismo tipo, color y baldosa); un
// revestimiento ("wall-tiles"), en sus "params". Por defecto solo las que pasaron el control de calidad; --todas aplica
// todas. Edita el texto en su lugar (ver jsonpos.mjs).
import { readFileSync, writeFileSync } from 'node:fs';
import { parse, get } from './jsonpos.mjs';

const [id, ...flags] = process.argv.slice(2);
if (!id) { console.error('Uso: node motor/texturas.mjs <depto> [--aplicar] [--todas]'); process.exit(1); }
const root = new URL('..', import.meta.url), file = new URL(`departamentos/${id}/scene.json`, root);
const list = JSON.parse(readFileSync(new URL(`capturas/${id}/texturas.json`, root), 'utf8')).texturas;
const all = flags.includes('--todas'), apply = flags.includes('--aplicar');
let text = readFileSync(file, 'utf8');
const tree = parse(text), levels = [tree, ...(get(tree, 'levels')?.items ?? [])], edits = [];
// "texture" y "textureSize" dentro de un objeto: se reemplazan si están, si no se agregan al principio
const setIn = (obj, t) => {
  for (const [k, v] of [['texture', JSON.stringify(t.texture)], ['textureSize', String(t.textureSize)]]) {
    const cur = get(obj, k);
    if (cur) edits.push({ at: cur.start, end: cur.end, s: v });
    else edits.push({ at: obj.start + 1, end: obj.start + 1, s: ` "${k}": ${v},` });
  }
};
const sameFloor = (a, b) => ['kind', 'color', 'tile'].every(k => get(a, k)?.v === get(b, k)?.v);
for (const t of list) {
  const sel = all || t.aceptada;
  console.log(`${sel ? '✔' : ' '} ${t.kind === 'floor' ? `piso de ${t.room}` : `revestimiento ${t.item}`}: ${t.texture} (${t.textureSize} m)${t.aceptada ? '' : ' · ' + t.fallas.join(', ')}`);
  if (!sel) continue;
  if (t.kind === 'floor') {
    const rooms = levels.flatMap(L => get(L, 'rooms')?.items ?? []), room = rooms.find(r => get(r, 'name')?.v === t.room), f = get(room, 'floor');
    if (!f) continue;
    for (const r of rooms) { const g = get(r, 'floor'); if (g && (g === f || (sameFloor(g, f) && !get(g, 'texture')))) setIn(g, t); }
  } else {
    const it = get(levels[t.level ?? 0], 'items')?.items[t.item], params = get(it, 'params');
    if (params) setIn(params, t);
  }
}
if (!apply) { console.log('\nSin cambios (agregar --aplicar para escribir el scene.json).'); process.exit(0); }
edits.sort((a, b) => b.at - a.at);
for (const e of edits) text = text.slice(0, e.at) + e.s + text.slice(e.end);
JSON.parse(text);
writeFileSync(file, text);
console.log(`\n${edits.length} cambios escritos en departamentos/${id}/scene.json`);
