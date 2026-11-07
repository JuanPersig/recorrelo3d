// Aplica al scene.json los colores medidos en las fotos (T-22): node motor/colores.mjs <depto> [--aplicar] [--todas] [--solo=1,4,7]
// Lee capturas/<depto>/colores.json (lo escribe motor/colores.html?depto=<depto>) y, para cada propuesta, busca qué
// parámetro del scene tiene ese color: un "color" del mueble (también anidado: respaldo, almohadones, manta), el piso
// del ambiente, "wallColor", "ceiling", "baseboard" o el color de la abertura. Si el mueble usa el color por defecto del
// componente, agrega el parámetro (lo saca del catálogo). Sin --aplicar solo muestra qué cambiaría. Por defecto aplica
// solo las propuestas confiables (las fotos coinciden entre sí); --todas aplica todas. Edita el texto en su lugar: el
// resto del archivo queda igual, con su formato.
import { readFileSync, writeFileSync } from 'node:fs';
import { parse, get, findColor } from './jsonpos.mjs';

const [id, ...flags] = process.argv.slice(2);
if (!id) { console.error('Uso: node motor/colores.mjs <depto> [--aplicar] [--todas] [--solo=1,4,7]'); process.exit(1); }
const root = new URL('..', import.meta.url), file = new URL(`departamentos/${id}/scene.json`, root);
const props = JSON.parse(readFileSync(new URL(`capturas/${id}/colores.json`, root), 'utf8')).propuestas;
const catalog = JSON.parse(readFileSync(new URL('motor/catalogo.json', root), 'utf8'));
const solo = flags.find(f => f.startsWith('--solo='))?.slice(7).split(',').map(Number);
const all = flags.includes('--todas'), apply = flags.includes('--aplicar');
let text = readFileSync(file, 'utf8');

const tree = parse(text), levels = [tree, ...(get(tree, 'levels')?.items ?? [])];
const edits = [], report = [];
props.forEach((p, n) => {
  const num = n + 1, sel = solo ? solo.includes(num) : (all || p.confiable);
  const what = p.kind === 'item' ? `${p.type} (${(p.items ?? [p]).map(i => `[${i.at.join(', ')}]`).join(' ')})` : p.kind === 'floor' ? `piso de ${p.room}` : p.kind === 'wall' ? 'paredes' : p.kind;
  const Lv = levels[p.level ?? 0];
  let targets = [], insert = null;
  if (p.kind === 'item') {
    // todos los muebles iguales (mismo tipo y mismo color), también los que no salen en ninguna foto: así las seis sillas
    // de un comedor siguen siendo iguales
    const name = Object.entries(catalog[p.type]?.params ?? {}).find(([k, d]) => !k.includes('.') && d.toLowerCase().includes(p.de.toLowerCase()))?.[0];
    // el color por defecto puede cambiar con el estilo: se agrega solo a los del mismo estilo que los medidos
    const styleOf = it => get(get(it, 'params'), 'style')?.v ?? null;
    const styles = new Set((p.items ?? [p]).map(r => styleOf(get(levels[r.level ?? 0], 'items')?.items[r.item])));
    for (const item of levels.flatMap(L => get(L, 'items')?.items ?? []).filter(it => get(it, 'type')?.v === p.type)) {
      const params = get(item, 'params'), found = findColor(params, p.de);
      targets.push(...found);
      // con el color por defecto del componente (no define ese parámetro): se agrega
      if (!found.length && name && !get(params, name) && styles.has(styleOf(item))) (insert ??= []).push(params ? (params.props.length ? { at: params.start + 1, s: ` "${name}": "${p.a}",` } : { at: params.start + 1, s: ` "${name}": "${p.a}" ` })
        : { at: item.end - 1, s: `, "params": { "${name}": "${p.a}" } ` });
    }
  } else if (p.kind === 'floor') {
    const room = get(Lv, 'rooms')?.items.find(r => get(r, 'name')?.v === p.room);
    targets = findColor(get(room, 'floor'), p.de);
  } else if (p.kind === 'wall' || p.kind === 'ceiling' || p.kind === 'baseboard') {
    const key = { wall: 'wallColor', ceiling: 'ceiling', baseboard: 'baseboard' }[p.kind];
    targets = [get(Lv, key), get(tree, key)].filter(v => v?.t === 'str' && v.v.toLowerCase() === p.de.toLowerCase()).slice(0, 1);
    if (!targets.length) {
      const rooms = get(Lv, 'rooms')?.items ?? [];
      targets = rooms.map(r => get(r, p.kind === 'wall' ? 'walls' : 'ceiling')).filter(v => v?.t === 'str' && v.v.toLowerCase() === p.de.toLowerCase());
    }
    if (!targets.length) { const name = get(tree, 'name'); insert = { at: name.end, s: `,\n  "${key}": "${p.a}"` }; }
  } else if (p.kind === 'door' || p.kind === 'passage') {
    const op = get(get(Lv, 'walls')?.items[p.wall], 'openings')?.items[p.opening];
    targets = findColor(op, p.de);
    if (!targets.length && op) insert = { at: op.end - 1, s: `, "color": "${p.a}" ` };
  }
  const how = [targets.length ? `${targets.length} valor(es)` : '', insert ? `${[insert].flat().length} parámetro(s) nuevo(s)` : ''].filter(Boolean).join(' y ') || 'no se encontró dónde';
  report.push(`${sel ? '✔' : ' '} ${String(num).padStart(2)} ${what}: ${p.de} → ${p.a} (ΔE ${p.dE}${p.confiable ? '' : ', poco confiable'}) · ${how}`);
  if (!sel) return;
  for (const t of targets) edits.push({ at: t.start, end: t.end, s: `"${p.a}"` });
  for (const ins of [insert ?? []].flat()) if (p.kind === 'item' || !targets.length) edits.push({ at: ins.at, end: ins.at, s: ins.s });
});
console.log(report.join('\n'));
if (!apply) { console.log('\nSin cambios (agregar --aplicar para escribir el scene.json).'); process.exit(0); }
edits.sort((a, b) => b.at - a.at);
for (const e of edits) text = text.slice(0, e.at) + e.s + text.slice(e.end);
JSON.parse(text);   // si algo quedó mal, falla antes de escribir
writeFileSync(file, text);
console.log(`\n${edits.length} cambios escritos en departamentos/${id}/scene.json`);
