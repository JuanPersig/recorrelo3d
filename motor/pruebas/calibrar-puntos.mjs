// Simulación (prueba A, plan B del PLAN-PRECISION.md): ¿qué precisión da calcular la cámara directamente desde puntos
// conocidos de la estructura (esquinas de pared en el piso y el techo) marcados en la foto con un error de unos píxeles?
// No usa el motor ni las fotos: toma la cámara aprobada de cada vista del scene.json, proyecta las esquinas del modelo,
// les suma ruido (sigma en píxeles de una foto de 420 px de ancho), parte de una cámara corrida (18 cm, 4°, 2°, 3° de
// fov) y resuelve posición, giro, cabeceo y fov por mínimos cuadrados (Levenberg–Marquardt). Es el mejor caso: sin
// distorsión de lente, sin confundir esquinas y con el modelo igual a la realidad.
// Uso: node motor/pruebas/calibrar-puntos.mjs [depto5] [--fovconocido]
import { readFileSync } from 'node:fs';
const id = process.argv[2]?.startsWith('--') ? 'depto5' : process.argv[2] ?? 'depto5', FOVK = process.argv.includes('--fovconocido');
const scene = JSON.parse(readFileSync(new URL(`../../departamentos/${id}/scene.json`, import.meta.url), 'utf8'));
const H = scene.height ?? 2.6, D2R = Math.PI / 180, rnd = (a => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; })(12345);
const gauss = () => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
// esquinas del modelo: extremos de paredes y esquinas de ambientes, en el piso y el techo
const xz = new Map(), add = (x, z) => xz.set(`${x.toFixed(3)},${z.toFixed(3)}`, [x, z]);
for (const w of scene.walls ?? []) { add(...w.from); add(...w.to); }
for (const r of scene.rooms ?? []) { const [x0, x1] = r.rect.x, [z0, z1] = r.rect.z; add(x0, z0); add(x1, z0); add(x0, z1); add(x1, z1); }
const pts = [...xz.values()].flatMap(([x, z]) => [[x, 0, z], [x, H, z]]);
const W = 420;
function proj(P, x, A) {   // x = [px,py,pz,yaw,pitch,fov(°, vertical)]; devuelve píxeles o null si queda detrás
  const [px, py, pz, yaw, pitch, fov] = x, cp = Math.cos(pitch * D2R), f = [-Math.sin(yaw * D2R) * cp, Math.sin(pitch * D2R), -Math.cos(yaw * D2R) * cp], r = [Math.cos(yaw * D2R), 0, -Math.sin(yaw * D2R)];
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]], v = [P[0] - px, P[1] - py, P[2] - pz];
  const zc = v[0] * f[0] + v[1] * f[1] + v[2] * f[2]; if (zc < 0.1) return null;
  const xc = v[0] * r[0] + v[1] * r[1] + v[2] * r[2], yc = v[0] * u[0] + v[1] * u[1] + v[2] * u[2], Hh = W / A, k = (Hh / 2) / Math.tan(fov * D2R / 2);
  return [W / 2 + xc / zc * k, Hh / 2 - yc / zc * k];
}
const toParams = v => { const d = v.target.map((t, i) => t - v.pos[i]); return [...v.pos, Math.atan2(-d[0], -d[2]) / D2R, Math.atan2(d[1], Math.hypot(d[0], d[2])) / D2R, v.fov]; };
const dirOf = x => { const c = Math.cos(x[4] * D2R); return [-Math.sin(x[3] * D2R) * c, Math.sin(x[4] * D2R), -Math.cos(x[3] * D2R) * c]; };
function solve(A, b) {   // sistema lineal pequeño por eliminación gaussiana
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) { let p = i; for (let j = i + 1; j < n; j++) if (Math.abs(M[j][i]) > Math.abs(M[p][i])) p = j; [M[i], M[p]] = [M[p], M[i]]; if (Math.abs(M[i][i]) < 1e-12) return null;
    for (let j = i + 1; j < n; j++) { const f = M[j][i] / M[i][i]; for (let k = i; k <= n; k++) M[j][k] -= f * M[i][k]; } }
  const x = Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let k = i + 1; k < n; k++) s -= M[i][k] * x[k]; x[i] = s / M[i][i]; } return x;
}
function lm(obs, P, x0, A, fixFov) {
  const free = fixFov ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5], res = x => { const r = []; P.forEach((p, i) => { const q = proj(p, x, A); if (!q) r.push(1e3, 1e3); else r.push(q[0] - obs[i][0], q[1] - obs[i][1]); }); return r; };
  let x = [...x0], r = res(x), cost = r.reduce((s, v) => s + v * v, 0), lam = 1e-2;
  for (let it = 0; it < 80; it++) {
    const J = free.map(d => { const y = [...x], h = d < 3 ? 1e-4 : 1e-3; y[d] += h; const r2 = res(y); return r2.map((v, i) => (v - r[i]) / h); });
    const JTJ = free.map((_, a) => free.map((__, b) => J[a].reduce((s, v, i) => s + v * J[b][i], 0))), g = free.map((_, a) => -J[a].reduce((s, v, i) => s + v * r[i], 0));
    for (let a = 0; a < free.length; a++) JTJ[a][a] *= 1 + lam;
    const dx = solve(JTJ, g); if (!dx) break; const y = [...x]; free.forEach((d, a) => { y[d] += dx[a]; });
    const r2 = res(y), c2 = r2.reduce((s, v) => s + v * v, 0);
    if (c2 < cost) { x = y; r = r2; if (cost - c2 < 1e-9) { cost = c2; break; } cost = c2; lam = Math.max(1e-6, lam / 3); } else lam *= 4;
  }
  return x;
}
const med = a => { const s = [...a].sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const SIG = [0, 1, 2, 4, 8], TR = 60, rows = [];
for (const [k, v] of Object.entries(scene.views)) {
  if (!v.photo) continue;
  const A = v.photoAspect ?? scene.viewAspect ?? 0.75, xt = toParams(v), vis = pts.filter(p => { const q = proj(p, xt, A); return q && q[0] > 4 && q[0] < W - 4 && q[1] > 4 && q[1] < W / A - 4; });
  const row = { vista: k, puntos: vis.length };
  for (const sg of SIG) {
    const ep = [], ea = [], ef = [];
    if (vis.length >= (FOVK ? 3 : 4)) for (let t = 0; t < TR; t++) {
      const obs = vis.map(p => { const q = proj(p, xt, A); return [q[0] + sg * gauss(), q[1] + sg * gauss()]; });
      const d = [gauss(), gauss(), gauss()], dn = Math.hypot(...d), x0 = [xt[0] + 0.18 * d[0] / dn, xt[1] + 0.18 * d[1] / dn, xt[2] + 0.18 * d[2] / dn, xt[3] + 4 * (rnd() < 0.5 ? -1 : 1), xt[4] + 2 * (rnd() < 0.5 ? -1 : 1), xt[5] + 3 * (rnd() < 0.5 ? -1 : 1)];
      if (FOVK) x0[5] = xt[5];
      const x = lm(obs, vis, x0, A, FOVK), a = dirOf(x), b = dirOf(xt);
      ep.push(Math.hypot(x[0] - xt[0], x[1] - xt[1], x[2] - xt[2]) * 100); ea.push(Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])) / D2R); ef.push(Math.abs(x[5] - xt[5]));
    }
    row[`s${sg}`] = ep.length ? { cm: +med(ep).toFixed(1), grados: +med(ea).toFixed(2), fov: +med(ef).toFixed(2), bien: ep.filter((p, i) => p < 10 && ea[i] < 2).length / ep.length } : null;
  }
  rows.push(row);
}
console.log(`${id}: ${rows.length} vistas con foto; ${FOVK ? 'fov conocido' : 'fov desconocido'}; ${TR} intentos por vista y nivel de ruido\n`);
console.log('ruido (px de 420)       ' + SIG.map(s => String(s).padStart(14)).join(''));
const usable = rows.filter(r => r.puntos >= (FOVK ? 3 : 4));
console.log(`vistas con >= ${FOVK ? 3 : 4} esquinas a la vista: ${usable.length}/${rows.length} (mediana de esquinas ${med(rows.map(r => r.puntos))})`);
for (const [label, f] of [['error de posición (cm)', r => r.cm], ['error de dirección (°)', r => r.grados], ['error de fov (°)', r => r.fov], ['intentos bien (<10 cm y <2°)', r => r.bien]]) {
  console.log(label.padEnd(24) + SIG.map(s => { const vals = usable.map(r => r[`s${s}`]).filter(Boolean).map(f); return (label.startsWith('intentos') ? (med(vals) * 100).toFixed(0) + ' %' : med(vals).toFixed(1)).padStart(14); }).join(''));
}
console.log('\npor vista (esquinas visibles | mediana de cm con 2 px y 4 px de ruido):');
for (const r of rows) console.log(`  ${r.vista.padEnd(12)} ${String(r.puntos).padStart(2)} | ${r.s2 ? r.s2.cm + ' cm / ' + r.s2.grados + '°' : '—'} | ${r.s4 ? r.s4.cm + ' cm / ' + r.s4.grados + '°' : '—'}`);
