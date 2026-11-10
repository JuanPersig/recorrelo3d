// Plano medido (PLAN-PRECISION.md, pieza 1): el código mide el plano del anuncio; quien lo lee solo interpreta.
// Uso:
//   node motor/plano-medido.mjs detectar <imagen> [--out=carpeta] [--oscuro=95] [--largo=18] [--grosor=4]
//       Busca los muros (franjas oscuras horizontales y verticales) del plano y guarda <out>/muros.json con sus
//       coordenadas en píxeles y <out>/muros.png con cada franja numerada sobre el plano. Necesita ImageMagick (magick),
//       que el proyecto ya usa. No modifica nada más.
//   node motor/plano-medido.mjs comparar <depto> <muros.json> <config.json>
//       Pasa los muros del plano a metros con la escala y las anclas de <config.json> y mide cuánto se aparta de ese
//       plano cada pared del scene.json del depto (ver el formato en motor/plano-medido.md).
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const [cmd, ...rest] = process.argv.slice(2), flags = Object.fromEntries(rest.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; })), args = rest.filter(a => !a.startsWith('--'));
const magick = (a, opt = {}) => execFileSync('magick', a, { maxBuffer: 1 << 29, ...opt });

// franjas de píxeles oscuros: "a" es la coordenada a lo largo de la franja y "b" la de través
export function franjas(gray, w, h, { thr = 95, minLen = 18, minThick = 4, horizontal = true } = {}) {
  const A = horizontal ? w : h, B = horizontal ? h : w, at = (a, b) => (horizontal ? gray[b * w + a] : gray[a * w + b]), done = [];
  let active = [];
  for (let b = 0; b < B; b++) {
    const runs = [];
    for (let a = 0; a < A;) {
      if (at(a, b) < thr) {
        let s = a, e = a;
        while (e + 1 < A && (at(e + 1, b) < thr || (e + 2 < A && at(e + 2, b) < thr))) e++;   // tolera un píxel claro suelto (ruido JPEG)
        if (e - s + 1 >= minLen) runs.push([s, e]);
        a = e + 1;
      } else a++;
    }
    const next = [], used = new Set();
    for (const r of runs) {
      let best = null, bo = 0;
      for (const [i, f] of active.entries()) { const o = Math.min(r[1], f.a1) - Math.max(r[0], f.a0) + 1, m = Math.min(r[1] - r[0] + 1, f.a1 - f.a0 + 1); if (o / m > 0.6 && o > bo) { bo = o; best = i; } }
      if (best !== null && !used.has(best)) { used.add(best); const f = active[best]; f.rows.push(r); f.b1 = b; f.a0 = r[0]; f.a1 = r[1]; next.push(f); }
      else next.push({ b0: b, b1: b, a0: r[0], a1: r[1], rows: [r] });
    }
    for (const [i, f] of active.entries()) if (!used.has(i)) done.push(f);
    active = next;
  }
  done.push(...active);
  const med = v => { const s = [...v].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  return done.filter(f => f.b1 - f.b0 + 1 >= minThick).map(f => ({ a0: med(f.rows.map(r => r[0])), a1: med(f.rows.map(r => r[1])), b0: f.b0, b1: f.b1 }))
    .map(f => horizontal ? { x0: f.a0, x1: f.a1, y0: f.b0, y1: f.b1 } : { x0: f.b0, x1: f.b1, y0: f.a0, y1: f.a1 });
}

// distancia de un punto al eje (línea central) de una franja
const distEje = (px, py, f) => {
  if (f.x1 - f.x0 >= f.y1 - f.y0) { const cy = (f.y0 + f.y1) / 2, dx = Math.max(f.x0 - px, 0, px - f.x1); return Math.hypot(dx, py - cy); }
  const cx = (f.x0 + f.x1) / 2, dy = Math.max(f.y0 - py, 0, py - f.y1); return Math.hypot(px - cx, dy);
};

if (cmd === 'comparar') {
  // Superpone las paredes del scene.json sobre las franjas del plano: ajusta escala y posición (px = tx + s·z, py = ty − s·x:
  // la fachada a la izquierda y x creciendo hacia arriba, como el plano del depto 6) y mide cuánto se aparta cada pared de la
  // franja más cercana. Con --aplicar escribe el scene corregido en <out>/scene.propuesta.json (no toca el original).
  const [depto] = args, out = flags.out ?? `capturas/plano-medido/${depto}`, path = flags.scene ?? `departamentos/${depto}/scene.json`;
  const scene = JSON.parse(readFileSync(path, 'utf8')), load = f => { try { const j = JSON.parse(readFileSync(f, 'utf8')); return [...j.horizontales, ...j.verticales]; } catch { return []; } };
  const cand = [...load(flags.muros ?? join(out, 'muros.json')), ...load(flags.fino ?? `${out}-fino/muros.json`)].filter(f => Math.max(f.x1 - f.x0, f.y1 - f.y0) >= 30);
  const walls = (scene.walls ?? []).map((w, i) => ({ i, w, len: Math.hypot(w.to[0] - w.from[0], w.to[1] - w.from[1]) })), DMAX = 12;
  const samples = [];   // puntos a lo largo de cada pared, sin los tramos de aberturas
  for (const { i, w, len } of walls) {
    const ux = (w.to[0] - w.from[0]) / len, uz = (w.to[1] - w.from[1]) / len;
    for (let d = 0.05; d < len; d += 0.05) {
      if ((w.openings ?? []).some(o => d >= o.at - 0.02 && d <= o.at + o.width + 0.02)) continue;
      samples.push({ i, x: w.from[0] + ux * d, z: w.from[1] + uz * d });
    }
  }
  const P = ([x, z], t) => [t.tx + t.s * z, t.ty - t.s * x];
  const cost = t => { let c = 0; for (const p of samples) { const [px, py] = P([p.x, p.z], t); let m = DMAX; for (const f of cand) { const d = distEje(px, py, f); if (d < m) m = d; } c += m; } return c / samples.length; };
  let t = { s: Number(flags.s ?? 50), tx: Number(flags.tx ?? 180), ty: Number(flags.ty ?? 382) }, best = cost(t);
  for (const [ds, dt] of [[2, 8], [1, 4], [0.5, 2], [0.25, 1], [0.1, 0.5], [0.05, 0.25]]) {
    for (let it = 0, imp = true; imp && it < 60; it++) { imp = false;
      for (const [k, st] of [['s', ds], ['tx', dt], ['ty', dt]]) for (const sg of [1, -1]) { const u = { ...t, [k]: t[k] + sg * st }, c = cost(u); if (c < best - 1e-6) { best = c; t = u; imp = true; } } }
  }
  console.log(`${depto}: ${walls.length} paredes del scene, ${cand.length} franjas candidatas del plano`);
  console.log(`ajuste: escala ${t.s.toFixed(2)} px/m, origen (${t.tx.toFixed(1)}, ${t.ty.toFixed(1)}) px; distancia media ${(best / t.s * 100).toFixed(1)} cm (tope ${(DMAX / t.s * 100).toFixed(0)} cm por punto)`);
  const rows = [];
  for (const { i, w, len } of walls) {
    const mine = samples.filter(p => p.i === i), ds = mine.map(p => { const [px, py] = P([p.x, p.z], t); let m = Infinity; for (const f of cand) m = Math.min(m, distEje(px, py, f)); return m / t.s * 100; }).sort((a, b) => a - b);
    const med = ds.length ? ds[Math.floor(ds.length / 2)] : NaN, cubierto = ds.filter(d => d < 6).length / Math.max(1, ds.length);
    rows.push({ pared: i, desde: w.from, hasta: w.to, largo: +len.toFixed(2), espesor: w.thickness, muestras: ds.length, medianaCm: +med.toFixed(1), cubierta: +cubierto.toFixed(2) });
  }
  console.log('\npared  desde → hasta                  largo  mediana(cm)  tramo que coincide (<6 cm)');
  for (const r of rows) console.log(`${String(r.pared).padStart(4)}   [${r.desde.map(v => v.toFixed(2))}] → [${r.hasta.map(v => v.toFixed(2))}]`.padEnd(46) + `${r.largo.toFixed(2).padStart(6)}  ${String(r.medianaCm).padStart(8)}      ${(r.cubierta * 100).toFixed(0)} %`);
  // Aberturas: tramos de cada pared donde el plano no tiene franja (vacíos de ≥ 40 cm) contra las aberturas del scene. En las
  // paredes gruesas solo cuentan las franjas oscuras (el vidrio de una ventana se dibuja con líneas finas); en los tabiques
  // (≤ 11 cm) también las finas.
  const thick = load(flags.muros ?? join(out, 'muros.json')).filter(f => Math.max(f.x1 - f.x0, f.y1 - f.y0) >= 18), thin = load(flags.fino ?? `${out}-fino/muros.json`).filter(f => Math.max(f.x1 - f.x0, f.y1 - f.y0) >= 30);
  const openRows = [];
  for (const { i, w, len } of walls) {
    const ux = (w.to[0] - w.from[0]) / len, uz = (w.to[1] - w.from[1]) / len, set = (w.thickness ?? 0.15) <= 0.11 ? [...thick, ...thin] : thick, TOL = 5;
    const cover = []; for (let d = 0; d <= len + 1e-9; d += 0.02) { const [px, py] = P([w.from[0] + ux * d, w.from[1] + uz * d], t); cover.push(set.some(f => distEje(px, py, f) < TOL)); }
    const gaps = []; for (let k = 0, s = null; k <= cover.length; k++) { const open = k < cover.length && !cover[k]; if (open && s === null) s = k; if (!open && s !== null) { if ((k - s) * 0.02 >= 0.4) gaps.push([s * 0.02, (k - 1) * 0.02]); s = null; } }
    // un vacío pegado al extremo de la pared es la esquina con otra pared, no una abertura
    const real = gaps.filter(([a, b]) => !(a < 0.12 && b < 0.4) && !(b > len - 0.12 && b - a < 0.4));
    const mine = (w.openings ?? []).map(o => [o.at, o.at + o.width, o.kind]);
    const used = new Set();
    for (const [a, b] of real) {
      let best = -1, bo = 0; mine.forEach(([c, e], j) => { const ov = Math.min(b, e) - Math.max(a, c); if (ov > bo) { bo = ov; best = j; } });
      if (best >= 0) { used.add(best); openRows.push({ pared: i, plano: [+a.toFixed(2), +b.toFixed(2)], modelo: [mine[best][0], +mine[best][1].toFixed(2)], tipo: mine[best][2], dIniCm: Math.round((mine[best][0] - a) * 100), dFinCm: Math.round((mine[best][1] - b) * 100) }); }
      else openRows.push({ pared: i, plano: [+a.toFixed(2), +b.toFixed(2)], modelo: null, tipo: 'vacío del plano sin abertura en el modelo' });
    }
    mine.forEach(([c, e, k], j) => { if (!used.has(j)) openRows.push({ pared: i, plano: null, modelo: [c, +e.toFixed(2)], tipo: `${k} del modelo sin vacío en el plano` }); });
  }
  console.log('\naberturas (metros desde el inicio de cada pared; d = modelo − plano, en cm):');
  for (const r of openRows) console.log(`  pared ${String(r.pared).padStart(2)}  plano ${r.plano ? `${r.plano[0].toFixed(2)}–${r.plano[1].toFixed(2)}` : '   —    '}  modelo ${r.modelo ? `${r.modelo[0].toFixed(2)}–${r.modelo[1].toFixed(2)}` : '   —    '}  ${r.tipo}${r.dIniCm !== undefined ? `  d inicio ${r.dIniCm} cm, d fin ${r.dFinCm} cm` : ''}`);
  const img = flags.imagen ?? 'DEPARTAMENTO_NUEVO/plano.jpg', mvg = ['fill none', 'stroke-width 1'];
  for (const f of cand) mvg.push('stroke "#e08080"', `rectangle ${f.x0},${f.y0} ${f.x1},${f.y1}`);
  for (const { i, w } of walls) { const [a, b] = [P([w.from[0], w.from[1]], t), P([w.to[0], w.to[1]], t)]; mvg.push('stroke "#10a030"', 'stroke-width 2', `line ${a[0].toFixed(1)},${a[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`, 'stroke none', 'fill "#006020"', 'font-size 10', `text ${((a[0] + b[0]) / 2 + 3).toFixed(1)},${((a[1] + b[1]) / 2 - 3).toFixed(1)} '${i}'`, 'fill none', 'stroke-width 1'); }
  mkdirSync(out, { recursive: true }); writeFileSync(join(out, 'superpuesto.mvg'), mvg.join('\n'));
  magick([img, '-draw', '@' + join(out, 'superpuesto.mvg').replace(/\\/g, '/'), '-resize', '200%', join(out, 'superpuesto.png')]);
  writeFileSync(join(out, 'comparacion.json'), JSON.stringify({ fecha: new Date().toISOString(), escala: t.s, origen: [t.tx, t.ty], distanciaMediaCm: +(best / t.s * 100).toFixed(1), paredes: rows, aberturas: openRows }, null, 1));
  console.log(`\nGuardado en ${out}/comparacion.json y superpuesto.png (verde = paredes del modelo, rosa = franjas del plano)`);
}

if (cmd === 'detectar') {
  const [img] = args, out = flags.out ?? 'capturas/plano-medido', thr = Number(flags.oscuro ?? 95), minLen = Number(flags.largo ?? 18), minThick = Number(flags.grosor ?? 4);
  const [w, h] = magick(['identify', '-format', '%w %h', img]).toString().trim().split(' ').map(Number);
  const gray = magick([img, '-colorspace', 'Gray', '-depth', '8', 'gray:-']);
  const H = franjas(gray, w, h, { thr, minLen, minThick, horizontal: true }).map((f, i) => ({ id: 'H' + (i + 1), ...f }));
  const V = franjas(gray, w, h, { thr, minLen, minThick, horizontal: false }).map((f, i) => ({ id: 'V' + (i + 1), ...f }));
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'muros.json'), JSON.stringify({ imagen: img, ancho: w, alto: h, oscuro: thr, largoMin: minLen, grosorMin: minThick, horizontales: H, verticales: V }, null, 1));
  const mvg = ['fill none', 'stroke-width 1', 'font-size 9'];
  for (const f of H) mvg.push('stroke "#e02020"', `rectangle ${f.x0},${f.y0} ${f.x1},${f.y1}`, 'stroke none', 'fill "#c00000"', `text ${f.x0 + 2},${f.y0 - 1} '${f.id}'`, 'fill none');
  for (const f of V) mvg.push('stroke "#1060e0"', `rectangle ${f.x0},${f.y0} ${f.x1},${f.y1}`, 'stroke none', 'fill "#0030c0"', `text ${f.x1 + 2},${f.y0 + 9} '${f.id}'`, 'fill none');
  writeFileSync(join(out, 'muros.mvg'), mvg.join('\n'));
  magick([img, '-draw', '@' + join(out, 'muros.mvg').replace(/\\/g, '/'), '-resize', '200%', join(out, 'muros.png')]);
  console.log(`${img}: ${w}x${h}; ${H.length} franjas horizontales (H) y ${V.length} verticales (V). Guardado en ${out}/muros.json y muros.png`);
}
