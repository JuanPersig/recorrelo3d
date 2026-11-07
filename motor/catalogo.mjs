// Arma el catálogo de componentes para la skill: node motor/catalogo.mjs → motor/CATALOGO.md y motor/catalogo.json
// Lee components.js como texto (sin Three.js): de cada componente toma el comentario que lo precede, los parámetros
// que usa ("p.algo ?? valor por defecto") y su ficha (META). Correrlo después de agregar o cambiar un componente.
import { readFile, writeFile } from 'node:fs/promises';

const motor = new URL('./', import.meta.url);
const src = await readFile(new URL('components.js', motor), 'utf8');

const registry = Object.fromEntries([...src.match(/export const COMPONENTS = \{([\s\S]*?)\};/)[1].matchAll(/'([\w-]+)':\s*(\w+)/g)].map(m => [m[1], m[2]]));
const metaSrc = src.match(/const FLAT = [\s\S]*?\n\}\)\.map\(([\s\S]*?)\)\);\n/)[0];
const META = new Function(`${metaSrc.replace('export const META', 'const META')}; return META;`)();
const MOUNT = { floor: 'Piso', wall: 'Pared', ceiling: 'Techo', on: 'Encima de otro mueble', window: 'Frente a una ventana' };

// comentario de las líneas "//" que preceden a la función, y su cuerpo hasta la llave de cierre en la columna 0
function parse(fn) {
  const at = src.search(new RegExp(`\\nfunction ${fn}\\(`));
  if (at < 0) return null;
  const before = src.slice(0, at).split('\n'), doc = [];
  for (let i = before.length - 1; i >= 0 && before[i].startsWith('//'); i--) doc.unshift(before[i].replace(/^\/\/\s?/, ''));
  const body = src.slice(at, src.indexOf('\n}\n', at));
  // "p.algo ?? defecto" o "p.algo.sub ?? defecto" (subparámetro: "algo.sub"); el defecto se lee con corchetes y
  // paréntesis balanceados hasta la coma, el cierre o el operador que lo termina
  const params = new Map();
  for (const m of body.matchAll(/\bp\.(\w+)((?:\??\.\w+)*)/g)) {
    const name = m[1] + m[2].replace(/\?/g, '');
    let def, i = m.index + m[0].length;
    const rest = body.slice(i).match(/^\s*\?\?\s*/);
    if (rest) {
      i += rest[0].length; let depth = 0, j = i;
      for (; j < body.length; j++) {
        const c = body[j];
        if ('([{'.includes(c)) depth++;
        else if (')]}'.includes(c)) { if (!depth) break; depth--; }
        else if (!depth && (',;\n'.includes(c) || /^\s+[-+*/<>=|&?:]/.test(body.slice(j, j + 3)))) break;
      }
      def = body.slice(i, j).trim().replace(/\s+/g, ' ');
      if (def.length > 60) def = def.slice(0, 57) + '…';
    }
    // un mismo parámetro con defectos distintos según el estilo: se listan todos ("a / b")
    const had = params.get(name);
    if (!params.has(name) || (had === undefined && def !== undefined)) params.set(name, def);
    else if (def !== undefined && !had.split(' / ').includes(def)) params.set(name, `${had} / ${def}`);
  }
  // los parámetros de las funciones a las que el componente le pasa "p" (un estilo armado aparte, como el futón)
  for (const [, fn2] of body.matchAll(/\b(\w+)\(p, \{/g)) if (fn2 !== fn) for (const [k, d] of parse(fn2)?.params ?? []) if (!params.has(k)) params.set(k, d);
  // si hay subparámetros, el parámetro padre se lista solo una vez y sin valor
  for (const k of [...params.keys()]) { const top = k.split('.')[0]; if (k !== top && !params.has(top)) params.set(top, undefined); }
  return { doc: doc.join(' '), params: new Map([...params].sort(([a], [b]) => (a.split('.')[0] === b.split('.')[0] ? a.length - b.length : 0))) };
}

const items = Object.entries(registry).map(([type, fn]) => ({ type, fn, ...META[type], ...parse(fn) }));
const missing = items.filter(i => !i.doc).map(i => i.type);

const cell = s => String(s).replace(/\|/g, '\\|');
const lines = [
  '# Catálogo de componentes',
  '',
  'Generado con `node motor/catalogo.mjs` desde `motor/components.js`: no editar a mano. Cada mueble del scene.json es',
  '`{ "type", "at": [x, z], "y"?, "rotation"?, "params"?, "decor"? }`. Los parámetros salen del código: los que no',
  'muestran valor por defecto son opcionales y sin valor fijo, o se calculan a partir de otros.',
  '',
  'Columnas: **monta** dónde va (en "Pared", detrás tiene que haber pared o viga); **estorba** si cuenta para caminar y',
  'para la circulación de 60 cm; **se usa** si necesita lugar para pararse al lado; **encastra** con qué tipos se puede',
  'superponer a propósito (`*` = cualquiera). Cualquier mueble acepta además `textures`: { "<color>": "tex/<archivo>.jpg" },',
  'la imagen que lleva la pieza de ese color (estampados tomados de las fotos).',
  '',
];
for (const [mount, title] of Object.entries(MOUNT)) {
  const group = items.filter(i => i.mount === mount);
  if (!group.length) continue;
  lines.push(`## ${title}`, '', '| Tipo | Qué es | Parámetros | Estorba | Se usa | Encastra |', '|---|---|---|---|---|---|');
  for (const i of group) {
    const ps = [...i.params].map(([k, d]) => (d === undefined ? `\`${k}\`` : `\`${k}\` = ${cell(d)}`)).join(', ') || '—';
    lines.push(`| \`${i.type}\` | ${cell(i.doc || '(sin descripción)')} | ${ps} | ${i.solid ? 'sí' : 'no'} | ${i.use ? 'sí' : '—'} | ${i.nests.join(', ') || '—'} |`);
  }
  lines.push('');
}
await writeFile(new URL('CATALOGO.md', motor), lines.join('\n'));
await writeFile(new URL('catalogo.json', motor), JSON.stringify(Object.fromEntries(items.map(i => [i.type,
  { mount: i.mount, solid: i.solid, use: i.use, nests: i.nests, params: Object.fromEntries(i.params) }])), null, 1) + '\n');
console.log(`Catálogo: ${items.length} componentes${missing.length ? ` · sin comentario: ${missing.join(', ')}` : ''}`);

// parámetros que un scene.json usa y el componente no lee (un nombre mal escrito se ignora en silencio)
const { readdir } = await import('node:fs/promises');
// "textures" lo lee el motor para cualquier mueble (estampados tomados de las fotos, T-24)
const known = Object.fromEntries(items.map(i => [i.type, new Set([...[...i.params.keys()].map(k => k.split('.')[0]), 'textures'])]));
const near = (k, set) => [...set].map(s => [s, lev(k.toLowerCase(), s.toLowerCase())]).sort((a, b) => a[1] - b[1]).find(([, d]) => d <= 3)?.[0];
function lev(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] !== b[j - 1])); return d[a.length][b.length]; }
const root = new URL('../departamentos/', motor);
for (const dir of await readdir(root, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const scene = JSON.parse(await readFile(new URL(`${dir.name}/scene.json`, root), 'utf8').catch(() => 'null'));
  if (!scene) continue;
  const bad = [];
  for (const lv of [scene, ...(scene.levels ?? [])]) for (const it of lv.items ?? []) for (const k of Object.keys(it.params ?? {})) {
    if (known[it.type] && !known[it.type].has(k)) { const s = near(k, known[it.type]); bad.push(`· ${it.type} en [${it.at}]: "${k}" no existe${s ? ` (¿"${s}"?)` : ''}`); }
  }
  console.log(`${dir.name}: ${bad.length ? `${bad.length} parámetros desconocidos\n${bad.join('\n')}` : 'parámetros bien'}`);
}
