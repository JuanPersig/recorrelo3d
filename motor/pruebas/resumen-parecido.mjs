// Resume capturas/<depto>/parecido.json (lo escribe motor/comparar.html?scene=...&medir=<depto>): puntaje global y por vista, y el
// error de color (ΔE normalizado por exposición y balance de blancos de cada foto) de las superficies que se piden.
// Uso: node motor/pruebas/resumen-parecido.mjs <depto> [filtro ...] [--base=archivo.json]
//   filtro: kind (floor, wall, ceiling, door...), "item:<tipo>" (item:curtains), o "room:<nombre>" (parte del nombre del ambiente)
//   --base: compara contra otra medición (p. ej. una copia guardada antes del cambio)
import { readFileSync } from 'node:fs';
const [id, ...rest] = process.argv.slice(2), flags = rest.filter(a => a.startsWith('--')), filtros = rest.filter(a => !a.startsWith('--'));
const load = f => JSON.parse(readFileSync(f, 'utf8')), cur = load(`capturas/${id}/parecido.json`), baseFile = flags.find(f => f.startsWith('--base='))?.slice(7), base = baseFile ? load(baseFile) : null;
const match = (o, f) => f.startsWith('item:') ? o.kind === 'item' && o.type === f.slice(5) : f.startsWith('room:') ? (o.room ?? '').toLowerCase().includes(f.slice(5).toLowerCase()) : o.kind === f;
const stat = (d, f) => { let px = 0, s = 0; for (const v of Object.values(d.vistas)) for (const o of v.objetos) if (match(o, f)) { px += o.px; s += o.px * o.dEn; } return px ? { dE: s / px, px } : null; };
const line = (label, a, b) => console.log(`${label.padEnd(26)} ${a == null ? '—' : a.toFixed(1).padStart(5)}${b != null ? `   (antes ${b.toFixed(1)}, ${a - b >= 0 ? '+' : ''}${(a - b).toFixed(1)})` : ''}`);
console.log(`${id}: puntaje global ${cur.puntaje}${base ? ` (antes ${base.puntaje})` : ''}  — menor es más parecido`);
for (const [k, v] of Object.entries(cur.vistas)) line(`  vista ${k}`, v.puntaje, base?.vistas?.[k]?.puntaje);
if (filtros.length) { console.log('\nsuperficies (ΔE medio ponderado por píxeles):'); for (const f of filtros) line(f, stat(cur, f)?.dE ?? null, base ? stat(base, f)?.dE : undefined); }
