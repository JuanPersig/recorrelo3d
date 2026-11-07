// PROTOTIPO desechable: biblioteca de componentes paramétricos del visor.
// Cada componente devuelve un THREE.Group en coordenadas locales: origen en el piso,
// en el centro de la huella, con el frente hacia +Z. Medidas en metros.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ---------- utilidades ---------- */
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
function hash(x, y) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// ruido de valor periódico (px, py = período en celdas) para que las texturas se repitan sin costuras
function vnoise(x, y, px, py) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const m = (a, p) => ((a % p) + p) % p;
  const a = hash(m(xi, px), m(yi, py)), b = hash(m(xi + 1, px), m(yi, py));
  const c = hash(m(xi, px), m(yi + 1, py)), d = hash(m(xi + 1, px), m(yi + 1, py));
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function shade(hex, k) {
  const c = new THREE.Color(hex), hsl = {};
  c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + k)));
  return '#' + c.getHexString();
}
export function uvScale(geo, su, sv = su) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
  return geo;
}
function add(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m);
  return m;
}
// UV por proyección en cubo, en metros: la textura tiene la misma escala en todas las caras y no se estira
// El eje sale del grupo de la cara (±X, ±Y, ±Z, en ese orden en BoxGeometry) y no de la normal de cada vértice:
// en los biseles redondeados la normal cambia de eje dentro de un mismo triángulo y la textura se comprime en puntos.
function boxUV(geo, m) {
  const p = geo.attributes.position, uv = geo.attributes.uv, idx = geo.index;
  for (const grp of geo.groups) {
    const axis = grp.materialIndex >> 1;
    for (let k = grp.start; k < grp.start + grp.count; k++) {
      const i = idx ? idx.getX(k) : k, x = p.getX(i) / m, y = p.getY(i) / m, z = p.getZ(i) / m;
      if (axis === 0) uv.setXY(i, z, y); else if (axis === 1) uv.setXY(i, x, z); else uv.setXY(i, x, y);
    }
  }
  uv.needsUpdate = true;
  return geo;
}
// caja entre dos esquinas, con bordes redondeados opcionales; uvm = metros por repetición de textura
export function blk(parent, mat, [x0, x1], [y0, y1], [z0, z1], r = 0, uvm = 0.5) {
  const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
  const rr = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const geo = rr > 0.0005 ? new RoundedBoxGeometry(w, h, d, 3, rr) : new THREE.BoxGeometry(w, h, d);
  boxUV(geo, uvm);
  return add(parent, geo, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}
export function cyl(parent, mat, x, y0, y1, z, r, seg = 24, rTop = r) {
  return add(parent, new THREE.CylinderGeometry(rTop, r, y1 - y0, seg), mat, x, (y0 + y1) / 2, z);
}
// barra horizontal a lo largo de X o de Z
export function bar(parent, mat, axis, a0, a1, y, c, r, seg = 12) {
  const m = add(parent, new THREE.CylinderGeometry(r, r, a1 - a0, seg), mat);
  if (axis === 'x') { m.rotation.z = Math.PI / 2; m.position.set((a0 + a1) / 2, y, c); }
  else { m.rotation.x = Math.PI / 2; m.position.set(c, y, (a0 + a1) / 2); }
  return m;
}

/* ---------- texturas procedurales (en gris: se multiplican por el color del material) ---------- */
function canvasFrom(px, fn) {
  const c = document.createElement('canvas'); c.width = c.height = px;
  const g = c.getContext('2d'), img = g.createImageData(px, px), d = img.data;
  for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) {
    const v = fn(x, y), i = (y * px + x) * 4;
    d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
function toTex(c, srgb) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const gray = v => [v, v, v];
const T = {};
const lazy = (k, f) => () => T[k] || (T[k] = f());
const TEX = {
  fabric: lazy('fabric', () => toTex(canvasFrom(256, (x, y) => {
    const weave = (((x >> 1) & 1) ^ ((y >> 1) & 1)) ? 1 : 0.9;
    return gray(255 * weave * (0.94 + 0.06 * vnoise(x / 8, y / 8, 32, 32)));
  }), true)),
  // veta vertical (a lo largo de V), estirada como un enchapado
  wood: lazy('wood', () => toTex(canvasFrom(512, (x, y) => {
    const n = vnoise(x / 16, y / 64, 32, 8);
    const ring = 0.5 + 0.5 * Math.sin((x / 512) * Math.PI * 2 * 12 + n * 4);
    const fine = vnoise(x / 2, y / 8, 256, 64);
    return gray(255 * (1 - 0.14 * ring ** 2 - 0.06 * fine));
  }), true)),
  tile: lazy('tile', () => toTex(canvasFrom(1024, (x, y) => {
    const gx = x % 512, gy = y % 512;
    if (gx < 3 || gx > 508 || gy < 3 || gy > 508) return gray(170);
    const id = (x >= 512 ? 1 : 0) + (y >= 512 ? 2 : 0);
    const v = (0.96 + 0.04 * hash(id, 7)) * (0.94 + 0.06 * vnoise(x / 32, y / 32, 32, 32)) * (hash(x, y) > 0.997 ? 0.86 : 1);
    return gray(255 * v);
  }), true)),
  tileBump: lazy('tileBump', () => toTex(canvasFrom(1024, (x, y) => {
    const gx = x % 512, gy = y % 512, d = Math.min(gx, 511 - gx, gy, 511 - gy);
    return gray(d < 3 ? 0 : d < 7 ? ((d - 3) / 4) * 255 : 255);
  }), false)),
  tileRough: lazy('tileRough', () => toTex(canvasFrom(1024, (x, y) => {
    const gx = x % 512, gy = y % 512;
    if (gx < 3 || gx > 508 || gy < 3 || gy > 508) return gray(235);
    return gray(55 + 45 * vnoise(x / 64, y / 64, 16, 16));
  }), false)),
};
function rugTexture(colors, n) {
  return toTex(canvasFrom(512, (x, y) => {
    const c = new THREE.Color(colors[Math.floor(x / (512 / n)) % colors.length]);
    const k = (0.86 + 0.14 * hash(x, y)) * ((y % 3) ? 1 : 0.9);
    return [c.r * 255 * k, c.g * 255 * k, c.b * 255 * k];
  }), true);
}
function artTexture(palette, seed) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 360;
  const g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = palette[3] ?? '#efe9df'; g.fillRect(0, 0, 512, 360);
  g.fillStyle = palette[2]; g.beginPath(); g.arc(170, 360, 150, Math.PI, 0); g.fill();
  g.fillStyle = palette[0]; g.beginPath(); g.arc(330 + r() * 40, 140, 72, 0, Math.PI * 2); g.fill();
  g.fillStyle = palette[1]; g.fillRect(300, 230, 150, 130);
  g.strokeStyle = palette[1]; g.lineWidth = 6; g.beginPath(); g.moveTo(40, 80); g.bezierCurveTo(160, 20, 220, 160, 300, 70); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/* ---------- materiales: dos presets sobre los mismos componentes ---------- */
export function makeMaterials(preset) {
  const clay = preset === 'clay';
  const cache = new Map();
  const once = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
  // en "maqueta" los colores se aclaran y desaturan hacia un tono de cartón pintado
  const col = c => {
    const k = new THREE.Color(c);
    if (clay) { const hsl = {}; k.getHSL(hsl); k.setHSL(hsl.h, hsl.s * 0.45, 0.55 + hsl.l * 0.42); }
    return k;
  };
  const matte = (c, r = 0.9) => new THREE.MeshStandardMaterial({ color: col(c), roughness: r });
  const night = (m, day, nightV) => { m.userData.night = [day, nightV]; m.emissiveIntensity = day; return m; };
  return {
    clay,
    paint: c => once('paint' + c, () => clay ? matte(c, 1) :
      new THREE.MeshStandardMaterial({ color: col(c), roughness: 0.92 })),
    lacquer: c => once('lac' + c, () => clay ? matte(c, 0.85) :
      new THREE.MeshStandardMaterial({ color: col(c), roughness: 0.38 })),
    ceramic: c => once('cer' + c, () => clay ? matte(c, 0.85) :
      new THREE.MeshStandardMaterial({ color: col(c), roughness: 0.22 })),
    metal: (c, r = 0.3) => once('met' + c + r, () => clay ? matte(c, 0.7) :
      new THREE.MeshStandardMaterial({ color: col(c), roughness: r, metalness: 1 })),
    wood: c => once('wood' + c, () => clay ? matte(c, 0.9) :
      new THREE.MeshStandardMaterial({ color: col(c), map: TEX.wood(), roughness: 0.5 })),
    fabric: c => once('fab' + c, () => clay ? matte(c, 1) :
      new THREE.MeshPhysicalMaterial({
        color: col(c), map: TEX.fabric(), bumpMap: TEX.fabric(), bumpScale: 0.25, roughness: 0.95,
        sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color(c).lerp(new THREE.Color('#ffffff'), 0.5),
      })),
    floor: c => once('floor' + c, () => clay ? matte(c, 0.8) :
      new THREE.MeshStandardMaterial({ color: col(c), map: TEX.tile(), roughnessMap: TEX.tileRough(), roughness: 1, bumpMap: TEX.tileBump(), bumpScale: 1.2 })),
    glass: () => once('glass', () => new THREE.MeshPhysicalMaterial({
      color: clay ? 0xcfe0ea : 0xe6f0f4, transparent: true, opacity: clay ? 0.35 : 0.12,
      roughness: 0.02, metalness: 0, depthWrite: false, side: THREE.DoubleSide,
    })),
    glow: () => once('glow', () => night(new THREE.MeshStandardMaterial({ color: 0xfff4e0, emissive: 0xffd9a0, roughness: 0.4 }), 0.1, 3)),
    shadeGlow: c => once('shade' + c, () => night(new THREE.MeshStandardMaterial({
      color: col(c), emissive: new THREE.Color(c), roughness: 0.9, side: THREE.DoubleSide,
    }), 0, 0.9)),
    leaf: () => once('leaf', () => new THREE.MeshStandardMaterial({ color: col('#557a3f'), roughness: clay ? 0.9 : 0.55, side: THREE.DoubleSide })),
    rug: (colors, n) => once('rug' + colors.join() + n, () => clay ? matte(colors[0], 1) :
      new THREE.MeshPhysicalMaterial({ map: rugTexture(colors, n), bumpMap: TEX.fabric(), bumpScale: 1.5, roughness: 1, sheen: 0.4, sheenRoughness: 0.8 })),
    art: (palette, seed) => once('art' + palette.join(), () => new THREE.MeshStandardMaterial({
      map: artTexture(clay ? palette.map(p => '#' + col(p).getHexString()) : palette, seed), roughness: 0.8,
    })),
  };
}

/* ---------- geometrías orgánicas ---------- */
// almohada: esfera deformada a superelipse, con el borde pellizcado como una costura
export function pillowGeo(w, h, d) {
  const geo = new THREE.SphereGeometry(1, 40, 24), p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const sx = Math.sign(v.x) * Math.abs(v.x) ** 0.45, sz = Math.sign(v.z) * Math.abs(v.z) ** 0.45;
    const edge = Math.max(Math.abs(sx), Math.abs(sz));
    p.setXYZ(i, sx * w / 2, v.y * (1 - 0.75 * edge ** 3) * h / 2, sz * d / 2);
  }
  geo.computeVertexNormals();
  return geo;
}
// tela que cubre un rectángulo y cae por los lados abiertos, con un radio de doblez y pliegues suaves
export function drapeGeo({ x0, x1, z0, z1, top, drop, r, open, puff = 0, seed = 1, texM = 0.25 }) {
  const arc = r * Math.PI / 2, ext = arc + Math.max(0, drop - r);
  const ex0 = open.xMin ? x0 - ext : x0, ex1 = open.xMax ? x1 + ext : x1;
  const ez0 = open.zMin ? z0 - ext : z0, ez1 = open.zMax ? z1 + ext : z1;
  const geo = new THREE.PlaneGeometry(1, 1, 90, 70);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) + 0.5, w = p.getZ(i) + 0.5;
    const px = ex0 + u * (ex1 - ex0), pz = ez0 + w * (ez1 - ez0);
    const cx = Math.min(x1, Math.max(x0, px)), cz = Math.min(z1, Math.max(z0, pz));
    const dx = px - cx, dz = pz - cz, d = Math.min(Math.hypot(dx, dz), ext);
    let x = px, y, z = pz;
    if (d < 1e-6) {
      const bx = Math.sin(Math.PI * (px - x0) / (x1 - x0)), bz = Math.sin(Math.PI * (pz - z0) / (z1 - z0));
      y = top + puff * Math.sqrt(Math.max(0, bx * bz)) + 0.003 * Math.sin(px * 13 + pz * 7 + seed);
    } else {
      const k = Math.hypot(dx, dz), nx = dx / k, nz = dz / k;
      let out, down;
      if (d < arc) { const a = d / r; out = r * Math.sin(a); down = r * (1 - Math.cos(a)); }
      else { out = r; down = r + (d - arc); }
      const t = Math.min(1, down / Math.max(drop, 1e-3));
      const along = Math.abs(dx) > Math.abs(dz) ? pz : px;
      const wave = t * (0.012 * Math.sin(along * 22 + seed) + 0.006 * Math.sin(along * 51 + seed * 2));
      x = cx + nx * (out + wave); z = cz + nz * (out + wave); y = top - down;
    }
    p.setXYZ(i, x, y, z);
    uv.setXY(i, u * (ex1 - ex0) / texM, w * (ez1 - ez0) / texM);
  }
  geo.computeVertexNormals();
  return geo;
}
function leafGeo(len, wmax, curve) {
  const geo = new THREE.PlaneGeometry(1, 1, 4, 14); geo.translate(0, 0.5, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), t = p.getY(i);
    const wdt = wmax * Math.sin(Math.PI * Math.min(1, t * 1.02)) ** 0.8 * (1 - 0.25 * t);
    p.setXYZ(i, x * wdt, t * len, curve * len * t * t + Math.abs(x) * wdt * 0.5);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ---------- muebles ---------- */
function bed(p, { M }) {
  const g = new THREE.Group();
  const W = p.width ?? 1.6, L = p.length ?? 2.0, bh = p.baseHeight ?? 0.32, mh = p.mattressHeight ?? 0.23, top = bh + mh;
  const sheet = M.fabric(p.sheetColor ?? '#f7f6f2'), duvet = M.fabric(p.duvetColor ?? '#2c3850');
  blk(g, M.lacquer('#4a4c50'), [-W / 2 + 0.07, W / 2 - 0.07], [0, 0.06], [-L / 2 + 0.07, L / 2 - 0.07]);  // zócalo retirado
  blk(g, M.lacquer(p.frameColor ?? '#f3f1ec'), [-W / 2, W / 2], [0.06, bh], [-L / 2, L / 2], 0.02);       // base
  add(g, uvScale(new RoundedBoxGeometry(W - 0.02, mh, L - 0.02, 5, 0.07), 6), sheet, 0, bh + mh / 2, 0);  // colchón
  const z0 = L / 2 - L * (p.duvetCover ?? 0.62), drop = Math.min(p.duvetDrop ?? 0.34, top - 0.08);
  add(g, drapeGeo({ x0: -W / 2 + 0.01, x1: W / 2 - 0.01, z0, z1: L / 2 - 0.01, top: top + 0.03, drop, r: 0.07,
    open: { xMin: true, xMax: true, zMax: true }, puff: 0.03, seed: 3 }), duvet);
  // embozo: la sábana doblada sobre el borde del acolchado
  add(g, drapeGeo({ x0: -W / 2 + 0.005, x1: W / 2 - 0.005, z0: z0 - 0.01, z1: z0 + 0.19, top: top + 0.045, drop: drop * 0.4, r: 0.075,
    open: { xMin: true, xMax: true }, puff: 0.004, seed: 7 }), sheet);
  const rows = [[], []];
  (p.pillows ?? []).forEach(q => rows[q.row ?? 0].push(q));
  rows.forEach((row, ri) => row.forEach((q, i) => {
    const cushion = q.size === 'cushion', n = row.length;
    const w = cushion ? 0.45 : Math.min(0.7, W / n - 0.06), h = cushion ? 0.16 : 0.15, d = 0.45;
    const m = add(g, uvScale(pillowGeo(w, h, d), 4), M.fabric(q.color), -W / 2 + (i + 0.5) * W / n, 0, 0);
    if (ri === 0) { m.position.set(m.position.x, top + 0.1, -L / 2 + 0.27); m.rotation.x = 0.35; }
    else { m.position.set(m.position.x * 0.8, top + 0.21, -L / 2 + 0.5); m.rotation.set(1.05, 0, (i % 2 ? 1 : -1) * 0.07); }
  }));
  return g;
}

function foldedTowels(p, { M }) {
  const g = new THREE.Group(), r = rng(5), mat = M.fabric(p.color ?? '#e8dcc6');
  for (let i = 0; i < (p.count ?? 2); i++) {
    const m = blk(g, mat, [-0.17, 0.17], [i * 0.045, i * 0.045 + 0.045], [-0.13, 0.13], 0.02, 0.2);
    m.rotation.y = (r() - 0.5) * 0.12; m.position.x += (r() - 0.5) * 0.02;
  }
  return g;
}

function nightstand(p, { M }) {
  const g = new THREE.Group();
  const w = p.width ?? 0.4, d = p.depth ?? 0.38, h = p.height ?? 0.6, t = 0.018, lg = 0.09, dh = 0.17;
  const c = p.color ?? '#c49862', wood = M.wood(c), dark = M.wood(shade(c, -0.25));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, dark, sx * (w / 2 - 0.03), 0, lg, sz * (d / 2 - 0.03), 0.011, 12, 0.016);
  blk(g, wood, [-w / 2, w / 2], [h - t, h], [-d / 2, d / 2], 0.004);                 // tapa
  blk(g, wood, [-w / 2, w / 2], [lg, lg + t], [-d / 2, d / 2], 0.003);               // piso
  blk(g, wood, [-w / 2, -w / 2 + t], [lg + t, h - t], [-d / 2, d / 2], 0.003);       // laterales
  blk(g, wood, [w / 2 - t, w / 2], [lg + t, h - t], [-d / 2, d / 2], 0.003);
  blk(g, dark, [-w / 2 + t, w / 2 - t], [lg + t, h - t], [-d / 2, -d / 2 + 0.008]);   // fondo
  blk(g, wood, [-w / 2 + t, w / 2 - t], [h - t - dh, h - t - dh + t], [-d / 2, d / 2 - 0.01]); // estante
  blk(g, wood, [-w / 2 + t + 0.003, w / 2 - t - 0.003], [h - t - dh + t + 0.004, h - t - 0.004], [-d / 2 + 0.02, d / 2 - 0.002], 0.003); // cajón
  add(g, new THREE.SphereGeometry(0.012, 16, 12), M.metal('#b08d57', 0.35), 0, h - t - dh / 2 + t / 2, d / 2 + 0.008);
  return g;
}

function tableLamp(p, { M }) {
  const g = new THREE.Group();
  const prof = [[0.001, 0], [0.06, 0], [0.07, 0.03], [0.075, 0.12], [0.05, 0.2], [0.012, 0.24], [0.012, 0.3], [0.001, 0.3]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  add(g, new THREE.LatheGeometry(prof, 48), M.ceramic(p.base ?? '#e9e4dc'));
  const sh = add(g, new THREE.LatheGeometry([new THREE.Vector2(0.115, 0.27), new THREE.Vector2(0.08, 0.45)], 48), M.shadeGlow(p.shade ?? '#efe6d6'));
  sh.castShadow = false;
  add(g, new THREE.SphereGeometry(0.025, 16, 12), M.glow(), 0, 0.36, 0).castShadow = false;
  const l = new THREE.PointLight(0xffd6a0, 0, 4, 2); l.position.set(0, 0.36, 0); l.userData.night = 3; g.add(l);
  return g;
}

function wardrobe(p, { M }) {
  const g = new THREE.Group();
  const w = p.width ?? 1.9, h = p.height ?? 2.45, d = p.depth ?? 0.6;
  const body = M.lacquer(p.color ?? '#f3f1ec'), rail = M.metal('#c8ccd1', 0.3), dark = M.lacquer('#55585c');
  blk(g, dark, [-w / 2 + 0.01, w / 2 - 0.01], [0, 0.07], [-d / 2, d / 2 - 0.06]);           // zócalo
  blk(g, body, [-w / 2, w / 2], [0.07, h], [-d / 2, d / 2 - 0.05], 0.004);                  // cuerpo
  if ((p.style ?? 'sliding') === 'sliding') {
    blk(g, body, [-w / 2 + 0.01, 0.02], [0.08, h - 0.05], [d / 2 - 0.047, d / 2 - 0.027], 0.006); // hoja de atrás
    blk(g, body, [-0.02, w / 2 - 0.01], [0.08, h - 0.05], [d / 2 - 0.024, d / 2 - 0.004], 0.006); // hoja de adelante
    blk(g, rail, [0.006, 0.022], [0.082, h - 0.052], [d / 2 - 0.049, d / 2 - 0.025], 0.002); // perfiles tirador
    blk(g, rail, [-0.022, -0.006], [0.082, h - 0.052], [d / 2 - 0.026, d / 2 + 0.001], 0.002);
    blk(g, rail, [-w / 2 + 0.002, w / 2 - 0.002], [h - 0.05, h - 0.002], [d / 2 - 0.06, d / 2 + 0.002], 0.003); // riel superior
    blk(g, rail, [-w / 2 + 0.002, w / 2 - 0.002], [0.072, 0.08], [d / 2 - 0.06, d / 2 + 0.002], 0.003);        // riel inferior
  } else {
    const n = p.doors ?? 2, gap = 0.004, dw = (w - gap * (n + 1)) / n;
    for (let i = 0; i < n; i++) {
      const x0 = -w / 2 + gap + i * (dw + gap);
      blk(g, body, [x0, x0 + dw], [0.08, h - 0.01], [d / 2 - 0.05, d / 2 - 0.03], 0.004);
      const hx = i % 2 ? x0 + 0.05 : x0 + dw - 0.05;
      cyl(g, rail, hx, 0.85, 1.25, d / 2 - 0.005, 0.007, 12);
    }
  }
  g.userData.h = h;
  return g;
}
wardrobe.cut = 'scale';

function rug(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.8, d = p.depth ?? 1.4, colors = p.colors ?? ['#c9553a'];
  add(g, new RoundedBoxGeometry(w, 0.012, d, 2, 0.004), M.rug(colors, p.stripes ?? 24), 0, 0.006, 0);
  const n = Math.floor(w / 0.01), fr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.05, 4), M.fabric('#efe3cf'), n * 2);
  const o = new THREE.Object3D(), r = rng(9);
  for (let i = 0; i < n * 2; i++) {
    const s = i < n ? -1 : 1;
    o.position.set(-w / 2 + ((i % n) + 0.5) * (w / n), 0.004, s * (d / 2 + 0.022));
    o.rotation.set(Math.PI / 2 + (r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.4);
    o.updateMatrix(); fr.setMatrixAt(i, o.matrix);
  }
  fr.receiveShadow = true; g.add(fr);
  return g;
}

function ceilingLight(p, { M, H }) {
  const g = new THREE.Group(), b = p.bulbs ?? 2, black = M.lacquer(p.color ?? '#1f2123');
  blk(g, black, [-0.21, 0.21], [H - 0.05, H], [-0.1, 0.1], 0.008);
  for (let i = 0; i < b; i++) {
    const x = (i - (b - 1) / 2) * 0.2;
    cyl(g, black, x, H - 0.17, H - 0.05, 0, 0.045, 32);
    cyl(g, M.glow(), x, H - 0.176, H - 0.169, 0, 0.038, 32).castShadow = false;
    const l = new THREE.PointLight(0xffd8a8, 0, 7, 2); l.position.set(x, H - 0.25, 0); l.userData.night = 5; g.add(l);
  }
  return g;
}
ceilingLight.cut = 'hide';

function plant(p, { M }) {
  const g = new THREE.Group(), r = rng(p.seed ?? 11), hgt = p.height ?? 0.9;
  const prof = [[0.001, 0], [0.11, 0], [0.125, 0.015], [0.15, 0.3], [0.16, 0.31], [0.146, 0.31], [0.138, 0.27]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  add(g, new THREE.LatheGeometry(prof, 48), M.ceramic(p.pot ?? '#d9d4cc'));
  cyl(g, M.lacquer('#3b2e24'), 0, 0.25, 0.272, 0, 0.138, 32);
  for (let i = 0; i < 16; i++) {
    const len = hgt * (0.45 + 0.5 * r()) - 0.27;
    const m = add(g, leafGeo(len, 0.05 + 0.03 * r(), 0.25 + 0.3 * r()), M.leaf(), (r() - 0.5) * 0.08, 0.26, (r() - 0.5) * 0.08);
    m.rotation.order = 'YXZ'; m.rotation.set(0.1 + 0.45 * r(), (i / 16) * Math.PI * 2 + r() * 0.4, 0);
  }
  return g;
}

function wallArt(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.7, h = p.height ?? 0.5, fr = 0.025, mat = 0.05;
  const black = M.lacquer('#26282b');
  blk(g, black, [-w / 2, -w / 2 + fr], [0, h], [0, 0.03], 0.003);
  blk(g, black, [w / 2 - fr, w / 2], [0, h], [0, 0.03], 0.003);
  blk(g, black, [-w / 2 + fr, w / 2 - fr], [0, fr], [0, 0.03], 0.003);
  blk(g, black, [-w / 2 + fr, w / 2 - fr], [h - fr, h], [0, 0.03], 0.003);
  blk(g, M.paint('#f6f4ef'), [-w / 2 + fr, w / 2 - fr], [fr, h - fr], [0.005, 0.012]);
  const print = add(g, new THREE.PlaneGeometry(w - 2 * (fr + mat), h - 2 * (fr + mat)), M.art(p.palette ?? ['#c9553a', '#2c3850', '#d8b98a', '#efe9df'], 4), 0, h / 2, 0.0125);
  print.castShadow = false;
  g.userData.h = h;
  return g;
}
wallArt.cut = 'hide';

export const COMPONENTS = {
  'bed': bed, 'folded-towels': foldedTowels, 'nightstand': nightstand, 'table-lamp': tableLamp,
  'wardrobe': wardrobe, 'rug': rug, 'ceiling-light': ceilingLight, 'plant': plant, 'wall-art': wallArt,
};

/* ---------- aberturas: X a lo largo de la pared desde el inicio del vano, Z hacia el interior ---------- */
function slidingWindow(o, { len, h, t, H, M, wallColor }) {
  const g = new THREE.Group(), alu = M.lacquer(o.frame ?? '#f2f2f2'), glass = M.glass(), dark = M.lacquer('#6d7177');
  const fw = 0.05, fd = 0.08;
  blk(g, alu, [fw, len - fw], [0, 0.04], [-fd / 2 + 0.002, fd / 2 - 0.002], 0.004);   // riel inferior
  blk(g, dark, [fw, len - fw], [0.036, 0.044], [-0.03, 0.03]);                         // ranuras del riel
  blk(g, alu, [fw, len - fw], [h - fw, h], [-fd / 2 + 0.002, fd / 2 - 0.002], 0.004);
  blk(g, alu, [0, fw], [0, h], [-fd / 2, fd / 2], 0.004);
  blk(g, alu, [len - fw, len], [0, h], [-fd / 2, fd / 2], 0.004);
  const n = o.panels ?? 2, pw = (len - 2 * fw) / n;
  for (let i = 0; i < n; i++) {
    const x0 = fw + i * pw - (i ? 0.02 : 0), x1 = fw + (i + 1) * pw + (i < n - 1 ? 0.02 : 0), zz = i % 2 ? -0.017 : 0.017;
    const y0 = 0.045, y1 = h - fw - 0.003, s = 0.04;
    blk(g, alu, [x0, x0 + s], [y0, y1], [zz - 0.013, zz + 0.013], 0.003);
    blk(g, alu, [x1 - s, x1], [y0, y1], [zz - 0.013, zz + 0.013], 0.003);
    blk(g, alu, [x0 + s, x1 - s], [y0, y0 + 0.07], [zz - 0.012, zz + 0.012], 0.003);
    blk(g, alu, [x0 + s, x1 - s], [y1 - s, y1], [zz - 0.012, zz + 0.012], 0.003);
    blk(g, glass, [x0 + s - 0.005, x1 - s + 0.005], [y0 + 0.065, y1 - s + 0.005], [zz - 0.003, zz + 0.003]).castShadow = false;
    const hx = i === 0 ? x1 - 0.02 : x0 + 0.02;
    blk(g, dark, [hx - 0.008, hx + 0.008], [0.95, 1.15], [zz + (zz > 0 ? 0.013 : -0.023), zz + (zz > 0 ? 0.023 : -0.013)], 0.004);
  }
  blk(g, M.ceramic('#dcd6cc'), [-0.03, len + 0.03], [-0.02, 0.005], [-t / 2 - 0.04, -fd / 2]);  // umbral exterior
  if (o.shutterBox) {
    const box = blk(g, M.paint(wallColor), [-0.08, len + 0.08], [Math.max(h + 0.04, H - 0.32), H], [t / 2, t / 2 + 0.2], 0.004);
    box.userData.cut = 'hide';
  }
  return g;
}

function door(o, { len, h, t, M }) {
  const g = new THREE.Group(), wood = M.wood(o.color ?? '#b36d2e'), steel = M.metal('#c8ccd1', 0.25), jw = 0.035, cw = 0.065;
  // El marco va DENTRO del vano: si queda afuera, su cara coincide con la cabeza de la pared (mismo plano y misma
  // orientación) y las dos parpadean (z-fighting). Ninguna pieza comparte una cara con otra.
  blk(g, wood, [0, jw], [0, h], [-t / 2 - 0.01, t / 2 + 0.01], 0.002);                 // marco: jambas
  blk(g, wood, [len - jw, len], [0, h], [-t / 2 - 0.01, t / 2 + 0.01], 0.002);
  blk(g, wood, [jw, len - jw], [h - jw, h], [-t / 2 - 0.008, t / 2 + 0.008], 0.002);  // dintel
  for (const s of [-1, 1]) {                                                          // contramarcos
    const zs = [s * (t / 2 + 0.0105), s * (t / 2 + 0.022)].sort((a, b) => a - b);
    blk(g, wood, [jw - cw, jw], [0, h - jw + cw], zs, 0.004);
    blk(g, wood, [len - jw, len - jw + cw], [0, h - jw + cw], zs, 0.004);
    blk(g, wood, [jw, len - jw], [h - jw, h - jw + cw], zs.map(z => z - s * 0.002), 0.004);
  }
  const atEnd = o.hinge === 'end', dir = atEnd ? -1 : 1, a = THREE.MathUtils.degToRad(o.open ?? 0), lw = len - 2 * jw;
  const leaf = new THREE.Group(); leaf.position.set(atEnd ? len - jw : jw, 0, t / 2); g.add(leaf);
  const xs = atEnd ? [-lw + 0.003, -0.003] : [0.003, lw - 0.003];
  blk(leaf, wood, xs, [0.006, h - jw - 0.004], [-0.04, 0], 0.004);
  for (const y of [0.25, 1.0, 1.8]) cyl(leaf, steel, 0, y - 0.05, y + 0.05, -0.02, 0.007, 12);   // bisagras
  const hx = dir * (lw - 0.07);
  for (const [zf, zl] of [[0.004, 0.024], [-0.044, -0.064]]) {                                     // picaporte de los dos lados
    const ro = add(leaf, new THREE.CylinderGeometry(0.025, 0.025, 0.008, 24), steel, hx, 1.0, zf + (zl > 0 ? 0 : -0.004));
    ro.rotation.x = Math.PI / 2;
    blk(leaf, steel, [Math.min(hx, hx - dir * 0.12), Math.max(hx, hx - dir * 0.12)], [0.99, 1.01], [Math.min(zf, zl), Math.max(zf, zl)], 0.006);
  }
  leaf.rotation.y = atEnd ? a : -a;
  return g;
}

export const OPENINGS = { 'sliding-window': slidingWindow, 'door': door };

/* ---------- exterior: balcón, edificio y entorno simple ---------- */
export function exterior(spec, { M, ext }) {
  const g = new THREE.Group(), b = spec.balcony, facade = M.paint('#e9e4da'), stone = M.paint('#dcc9a8');
  if (b) {
    const [x0, x1] = b.x, [z0, z1] = b.z, rail = M.metal(b.railing?.color ?? '#4a4e54', 0.45), rh = b.railing?.height ?? 1.0;
    const fl = new THREE.PlaneGeometry(x1 - x0, z1 - z0); fl.rotateX(-Math.PI / 2); uvScale(fl, (x1 - x0) / 0.9, (z1 - z0) / 0.9);
    add(g, fl, M.floor(b.floor ?? '#e6d8c0'), (x0 + x1) / 2, -0.02, (z0 + z1) / 2).castShadow = false;
    blk(g, facade, [x0, x1], [-0.2, -0.026], [z0, z1]);
    blk(g, stone, [x0, x1], [-0.02, 0.1], [z0, z0 + 0.1], 0.004);                     // zócalo bajo la baranda
    const zr = z0 + 0.05, xr0 = x0 + 0.05, xr1 = x1 - 0.05;
    const nPosts = Math.max(2, Math.round((x1 - x0) / 0.8));
    for (let i = 0; i <= nPosts; i++) blk(g, rail, [xr0 + i * (xr1 - xr0) / nPosts - 0.02, xr0 + i * (xr1 - xr0) / nPosts + 0.02], [0.1, rh], [zr - 0.02, zr + 0.02], 0.004);
    for (let y = 0.18; y <= rh - 0.04; y += 0.1) {
      bar(g, rail, 'x', xr0, xr1, y, zr, 0.008);
      bar(g, rail, 'z', zr, z1, y, xr0, 0.008); bar(g, rail, 'z', zr, z1, y, xr1, 0.008);
    }
    bar(g, rail, 'x', xr0 - 0.02, xr1 + 0.02, rh, zr, 0.022, 16);
    bar(g, rail, 'z', zr, z1, rh, xr0, 0.018, 16); bar(g, rail, 'z', zr, z1, rh, xr1, 0.018, 16);
    for (let k = 1; k <= (spec.floorsBelow ?? 3); k++) {                               // balcones de abajo
      const y = -2.9 * k;
      blk(g, facade, [x0, x1], [y - 0.18, y], [z0, z1]);
      blk(g, stone, [x0, x1], [y, y + 1.0], [z0, z0 + 0.1]);
      blk(g, M.metal('#5f7586', 0.15), [ext.x0 + 0.75, ext.x0 + 2.55], [y, y + 2.2], [z1 - 0.02, z1]);
    }
  }
  const baseY = -2.9 * ((spec.floorsBelow ?? 3) + 1);
  blk(g, facade, [ext.x0, ext.x1], [baseY, -0.2], [ext.z0, ext.z1]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), M.paint('#a7aba2'));
  ground.rotation.x = -Math.PI / 2; ground.position.y = baseY; ground.receiveShadow = true; g.add(ground);
  blk(g, M.paint('#4b4e52'), [-150, 150], [baseY, baseY + 0.02], [-22, -8]).castShadow = false;
  const leaf = M.leaf(), trunk = M.wood('#6b5a48');
  for (let x = -10; x <= 18; x += 4.5) {
    cyl(g, trunk, x, baseY, baseY + 2.2, -6.6, 0.12, 10);
    add(g, new THREE.IcosahedronGeometry(1.3, 1), leaf, x, baseY + 3.0, -6.6).scale.set(1, 0.85, 1);
  }
  blk(g, M.paint('#bfc3c7'), [-12, 22], [baseY, baseY + 5.1], [-48, -26]);              // terminal de ómnibus
  const r = rng(7), pal = ['#dcd6cb', '#cfd3d6', '#e3ddd2', '#c7c2b8', '#d6dadc'];
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, dd = 30 + r() * 50, x = 3 + Math.cos(a) * dd, z = 3 + Math.sin(a) * dd;
    const w = 6 + r() * 10, dp = 6 + r() * 10, hh = baseY + 5 + r() * 22;
    if (z < -20 && z > -52 && x > -16 && x < 26) continue;
    blk(g, M.paint(pal[i % pal.length]), [x - w / 2, x + w / 2], [baseY, hh], [z - dp / 2, z + dp / 2]);
  }
  return g;
}
