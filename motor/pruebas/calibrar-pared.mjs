// Simulación (prueba A, alternativa del PLAN-PRECISION.md): ¿con cuánta precisión se ubica una abertura sobre una pared
// "rectificándola" con sus cuatro esquinas (homografía), sin conocer la cámara ni el fov?
// Para cada vista con foto del scene.json y cada cara interior de ambiente (rectángulo del plano) cuyas cuatro esquinas
// (piso y techo de sus extremos) caen dentro de la foto: proyecta las esquinas y seis puntos de prueba de la pared con la
// cámara aprobada, les suma ruido (sigma px, foto de 420 px de ancho), calcula la homografía con las esquinas ruidosas y
// mide el error, en cm sobre la pared, de ubicar los puntos de prueba. Mejor caso: sin distorsión de lente ni confundir
// esquinas. Uso: node motor/pruebas/calibrar-pared.mjs [depto5]
import { readFileSync } from 'node:fs';
const id = process.argv[2] ?? 'depto5', D2R = Math.PI / 180, W = 420;
const scene = JSON.parse(readFileSync(new URL(`../../departamentos/${id}/scene.json`, import.meta.url), 'utf8')), H = scene.height ?? 2.6;
const rnd = (a => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; })(777);
const gauss = () => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
function proj(P, x, A) {
  const [px, py, pz, yaw, pitch, fov] = x, cp = Math.cos(pitch * D2R), f = [-Math.sin(yaw * D2R) * cp, Math.sin(pitch * D2R), -Math.cos(yaw * D2R) * cp], r = [Math.cos(yaw * D2R), 0, -Math.sin(yaw * D2R)];
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]], v = [P[0] - px, P[1] - py, P[2] - pz], zc = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
  if (zc < 0.1) return null;
  const xc = v[0] * r[0] + v[1] * r[1] + v[2] * r[2], yc = v[0] * u[0] + v[1] * u[1] + v[2] * u[2], Hh = W / A, k = (Hh / 2) / Math.tan(fov * D2R / 2);
  return [W / 2 + xc / zc * k, Hh / 2 - yc / zc * k];
}
const toParams = v => { const d = v.target.map((t, i) => t - v.pos[i]); return [...v.pos, Math.atan2(-d[0], -d[2]) / D2R, Math.atan2(d[1], Math.hypot(d[0], d[2])) / D2R, v.fov]; };
function solve(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) { let p = i; for (let j = i + 1; j < n; j++) if (Math.abs(M[j][i]) > Math.abs(M[p][i])) p = j; [M[i], M[p]] = [M[p], M[i]]; if (Math.abs(M[i][i]) < 1e-12) return null;
    for (let j = i + 1; j < n; j++) { const f = M[j][i] / M[i][i]; for (let k = i; k <= n; k++) M[j][k] -= f * M[i][k]; } }
  const x = Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let k = i + 1; k < n; k++) s -= M[i][k] * x[k]; x[i] = s / M[i][i]; } return x;
}
// homografía de la imagen (px) a la pared (metros) con 4 correspondencias (h33 = 1)
function homography(img, wall) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) { const [x, y] = img[i], [X, Y] = wall[i]; A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]); b.push(X); A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]); b.push(Y); }
  const h = solve(A, b); return h && [...h, 1];
}
const apply = (h, [x, y]) => { const w = h[6] * x + h[7] * y + h[8]; return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]; };
const med = a => { const s = [...a].sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : NaN; }, pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : NaN; };
// caras interiores de los ambientes: segmentos [(x,z) inicio, (x,z) fin]
const faces = [];
for (const r of scene.rooms ?? []) { const [x0, x1] = r.rect.x, [z0, z1] = r.rect.z; faces.push([[x0, z0], [x1, z0], r.id + ' (z=' + z0 + ')'], [[x1, z0], [x1, z1], r.id + ' (x=' + x1 + ')'], [[x1, z1], [x0, z1], r.id + ' (z=' + z1 + ')'], [[x0, z1], [x0, z0], r.id + ' (x=' + x0 + ')']); }
const SIG = [1, 2, 4], TR = 200, inFrame = (q, A) => q && q[0] > 4 && q[0] < W - 4 && q[1] > 4 && q[1] < W / A - 4;
const stats = Object.fromEntries(SIG.map(s => [s, []])), perView = [];
for (const [k, v] of Object.entries(scene.views)) {
  if (!v.photo) continue;
  const A = v.photoAspect ?? scene.viewAspect ?? 0.75, xt = toParams(v); let walls = 0;
  for (const [a, b, name] of faces) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), at = (s, y) => [a[0] + (b[0] - a[0]) * s, y, a[1] + (b[1] - a[1]) * s];
    const corners = [[0, 0], [1, 0], [1, H], [0, H]], cp = corners.map(([s, y]) => proj(at(s, y), xt, A));
    if (!cp.every(q => inFrame(q, A)) || L < 1) continue;
    walls++;
    const wallXY = corners.map(([s, y]) => [s * L, y]), probes = [[0.25, 0.6], [0.5, 0.6], [0.75, 0.6], [0.25, 1.5], [0.5, 1.5], [0.75, 1.5]].map(([s, y]) => [s * L, y]);
    const pp = probes.map(([d, y]) => proj(at(d / L, y), xt, A));
    if (!pp.every(q => inFrame(q, A) || q)) continue;
    for (const sg of SIG) {
      const e = [];
      for (let t = 0; t < TR; t++) {
        const h = homography(cp.map(q => [q[0] + sg * gauss(), q[1] + sg * gauss()]), wallXY); if (!h) continue;
        probes.forEach((pr, i) => { const q = pp[i], m = apply(h, [q[0] + sg * gauss(), q[1] + sg * gauss()]); e.push(Math.hypot(m[0] - pr[0], m[1] - pr[1]) * 100); });
      }
      stats[sg].push(...e);
    }
  }
  perView.push([k, walls]);
}
console.log(`${id}: ${perView.length} vistas con foto; paredes con las 4 esquinas dentro de la foto (cara interior del ambiente, piso a techo)`);
console.log('vistas con al menos 1 pared así: ' + perView.filter(p => p[1] > 0).length + '/' + perView.length + '  → ' + perView.map(([k, n]) => `${k}:${n}`).join(' '));
console.log('\nerror al ubicar un punto de la pared (cm), ruido en esquinas y en el punto marcado:');
for (const sg of SIG) console.log(`  ${sg} px  mediana ${med(stats[sg]).toFixed(1)} cm   90 % de los casos por debajo de ${pct(stats[sg], 0.9).toFixed(1)} cm   (n = ${stats[sg].length})`);
console.log('\nreferencia: una puerta de 85 cm o una ventana de 1,25 m se mide con +-5 cm si el error mediano es < 3 cm.');
