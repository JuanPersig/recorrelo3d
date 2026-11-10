// Biblioteca de componentes paramétricos del visor.
// Cada componente devuelve un THREE.Group en coordenadas locales: origen en el piso,
// en el centro de la huella, con el frente hacia +Z (los de pared: el fondo en z = 0). Medidas en metros.
// Regla: las piezas se tocan sin compartir caras. Dos caras en el mismo plano y con la misma orientación parpadean.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TEXTURAS } from './texturas/indice.js';

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
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
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
// luz cálida de lámpara (~2700 K), apagada de día; userData.night es la intensidad encendida. Las de techo son spots
// hacia abajo con penumbra amplia: iluminan su ambiente sin atravesar tanto las paredes hacia los vecinos
const WARM = 0xffcf9a;
function lampSpot(g, x, y, z, night, angle = 1.05, distance = 6) {
  const l = new THREE.SpotLight(WARM, 0, distance, angle, 1, 2);
  l.position.set(x, y, z); l.target.position.set(x, 0, z); g.add(l, l.target); l.userData.night = night;
  return l;
}
function lampPoint(g, x, y, z, night, distance = 4) {
  const l = new THREE.PointLight(WARM, 0, distance, 2);
  l.position.set(x, y, z); g.add(l); l.userData.night = night;
  return l;
}
function add(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m);
  return m;
}
// UV por proyección en cubo, en metros: la textura tiene la misma escala en todas las caras y no se estira.
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
  // materiales con "jitter" (madera, telas, piedra): cada pieza arranca en otro punto de la textura, así dos tablas o
  // dos puertas vecinas no tienen la misma veta. Las baldosas y los azulejos no lo llevan (las juntas tienen que seguir)
  if (!Array.isArray(mat) && mat?.userData?.jitter) { const k = ++uvSeed, uv = geo.attributes.uv, ou = hash(k, 17) * 7, ov = hash(k, 29) * 7; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + ou, uv.getY(i) + ov); }
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
// tirador de barra separado del frente por dos vástagos (sin ellos la barra flota delante de la puerta): a lo largo de
// "axis" ('x' horizontal, 'y' vertical) de a0 a a1, en c (la altura o la x), con el frente en zFace y la barra a "off"
function pull(g, mat, axis, a0, a1, c, zFace, off, r) {
  const zb = zFace + off, sr = Math.max(0.003, r * 0.6), e = Math.min(0.02, (a1 - a0) / 4);
  if (axis === 'x') bar(g, mat, 'x', a0, a1, c, zb, r); else cyl(g, mat, c, a0, a1, zb, r, 12);
  for (const a of [a0 + e, a1 - e]) axis === 'x' ? bar(g, mat, 'z', zFace - 0.001, zb, c, a, sr, 8) : bar(g, mat, 'z', zFace - 0.001, zb, a, c, sr, 8);
}
// cilindro acostado mirando a +Z (perillas, rosetas)
function disc(parent, mat, x, y, z, r, t, seg = 24) {
  const m = add(parent, new THREE.CylinderGeometry(r, r, t, seg), mat, x, y, z + t / 2);
  m.rotation.x = Math.PI / 2;
  return m;
}
// varilla recta de a a b ([x, y, z]), de radio r (r1 en b si se da): patas inclinadas y travesaños que entran en ellas
function strut(parent, mat, a, b, r, r1 = r, seg = 12) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const m = add(parent, new THREE.CylinderGeometry(r1, r, d.length(), seg), mat);
  m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}
// punto a la altura y sobre la recta de a a b (para que un travesaño termine en el eje de una pata inclinada)
const atY = (a, b, y) => { const k = (y - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * k, y, a[2] + (b[2] - a[2]) * k]; };
const v2 = pts => pts.map(([x, y]) => new THREE.Vector2(x, y));
function rrect(path, x, y, w, h, r) {
  path.moveTo(x + r, y); path.lineTo(x + w - r, y); path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r); path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h); path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r); path.quadraticCurveTo(x, y, x + r, y);
  return path;
}
// anillo extruido hacia +Y (bañera, mesada con bacha): rectángulo exterior con un hueco redondeado.
// La rotación espeja Y de la forma en -Z, por eso el hueco se define con y invertida.
function ringGeo(outer, hole, depth) {
  const sh = rrect(new THREE.Shape(), ...outer);
  sh.holes.push(rrect(new THREE.Path(), ...hole));
  const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 10 });
  geo.rotateX(-Math.PI / 2);
  return geo;
}
function flatGeo(rect) {
  const geo = new THREE.ShapeGeometry(rrect(new THREE.Shape(), ...rect), 10);
  geo.rotateX(-Math.PI / 2);
  return geo;
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
// Detalle de materiales (2026-11-08): relieve como mapa normal calculado de una altura (0–1) que se repite sin costura;
// "k" es la pendiente máxima (más alto = relieve más marcado). Los mapas normales y de brillo no llevan sRGB
function normalTex(px, height, k = 2) {
  const h = new Float32Array(px * px);
  for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) h[y * px + x] = height(x, y);
  const at = (x, y) => h[((y + px) % px) * px + ((x + px) % px)];
  return toTex(canvasFrom(px, (x, y) => {
    const dx = (at(x + 1, y) - at(x - 1, y)) * k, dy = (at(x, y + 1) - at(x, y - 1)) * k, l = Math.hypot(dx, dy, 1);
    return [(-dx / l * 0.5 + 0.5) * 255, (dy / l * 0.5 + 0.5) * 255, (1 / l * 0.5 + 0.5) * 255];
  }), false);
}
// Variación suave de tono en el espacio (manchas de 1–3 m): rompe la repetición de pisos y paredes en ambientes grandes.
// Se encadena con lo que el motor agrega después a cada material (reflejo del piso, luz rebotada)
function macroTone(m, amp = 0.05, scale = 0.45) {
  const prev = m.onBeforeCompile, key = prev.toString();
  m.onBeforeCompile = (sh, r) => {
    prev.call(m, sh, r);
    sh.uniforms.uMacro = { value: new THREE.Vector2(amp, scale) };
    sh.vertexShader = 'varying vec3 vMacroPos;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vMacroPos = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
    sh.fragmentShader = 'uniform vec2 uMacro;\nvarying vec3 vMacroPos;\nfloat mHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }\nfloat mNoise( vec2 p ) { vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f ); return mix( mix( mHash( i ), mHash( i + vec2( 1, 0 ) ), f.x ), mix( mHash( i + vec2( 0, 1 ) ), mHash( i + vec2( 1, 1 ) ), f.x ), f.y ); }\n'
      + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n  { vec2 q = ( vMacroPos.xz + vMacroPos.y * 0.37 ) * uMacro.y; diffuseColor.rgb *= 1.0 + uMacro.x * ( ( mNoise( q ) * 0.65 + mNoise( q * 2.7 + 13.0 ) * 0.35 ) * 2.0 - 1.0 ); }');
  };
  m.customProgramCacheKey = () => key + '|macro';
  return m;
}
// Cortinas a contraluz (2026-11-09, MEJORAS-MOTOR-RENDER #13): cuando el sol le pega a la tela desde atrás, parte de la
// luz la atraviesa y la cara de adentro brilla con su color (más mirando hacia el sol). No es luz que pasa de verdad:
// se suma a la luz directa de la cara que se ve, con la luz del sol (de noche no hay sol y no hace nada). El "atrás" lo
// decide la geometría: solo brillan las cortinas de las ventanas por donde entra el sol. CURTAIN_LIGHT.value es la
// fuerza, la misma para todas las cortinas (el motor la toma de "lighting.curtainLight"; 0 = como antes)
export const CURTAIN_LIGHT = { value: 0 };
function backlit(m) {
  const prev = m.onBeforeCompile, key = prev.toString();
  m.onBeforeCompile = (sh, r) => {
    prev.call(m, sh, r);
    sh.uniforms.uCurtainLight = CURTAIN_LIGHT;
    sh.fragmentShader = 'uniform float uCurtainLight;\n' + sh.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
  #if NUM_DIR_LIGHTS > 0
  {
    vec3 L = directionalLights[ 0 ].direction;
    float back = saturate( dot( -geometryNormal, L ) ), toward = pow( saturate( dot( geometryViewDir, -L ) ), 6.0 );
    reflectedLight.directDiffuse += directionalLights[ 0 ].color * diffuseColor.rgb * uCurtainLight * back * ( 0.6 + 0.8 * toward );
  }
  #endif`);
  };
  m.customProgramCacheKey = () => key + '|backlit';
  return m;
}
// Arrugas de la ropa de cama (2026-11-09, MEJORAS-MOTOR-RENDER #14): hundimientos suaves y algún pliegue largo, distintos
// en cada cama ("seed"). "amp" es la altura en metros (0,01 = 1 cm). Sale en 0 en los bordes, donde la tela dobla
// BEDDING.wrinkles: el valor de todas las camas que no dicen "wrinkles" (0 = lisas). 1,6 cm elegido por el usuario
// ("medio" de motor/pruebas/telas-luz.html, 2026-11-09)
export const BEDDING = { wrinkles: 0.016 };
export function rumple(x, z, seed, amp) {
  if (!amp) return 0;
  const s = seed * 7.31, soft = vnoise(x * 2.5 + s, z * 2.5 - s, 1024, 1024) - 0.5;
  // pliegues: crestas angostas de un ruido estirado, en dos direcciones que cambian con la cama
  const crease = (a, k, along) => { const cx = Math.cos(a), cz = Math.sin(a), r = 1 - Math.abs(2 * vnoise((x * cx + z * cz) * k + s, (z * cx - x * cz) * along - s, 1024, 1024) - 1); return r * r * r * r - 0.2; };
  return amp * (0.8 * soft + 0.7 * crease(0.6 + seed, 9, 1.6) + 0.45 * crease(2.1 + seed, 13, 2.2));
}
const T = {};
// Texturas pre-generadas (2026-11-08): calcularlas píxel por píxel al abrir el recorrido costaba entre 0,2 y 0,9 s cada
// una en la PC (varias veces más en un celular). motor/generar-texturas.html las calcula una vez y las guarda en
// motor/texturas/ (WebP); acá se cargan como imagen (el navegador las guarda en caché) y, si alguna falta, se calcula
// como antes. texturesReady() espera a que lleguen todas las pedidas (el motor la espera antes del primer cuadro).
// Las texturas escaneadas, cuando las haya, van en la misma carpeta y por el mismo camino
const GEN = {}, pending = [];
export const TEX_GENERATORS = GEN;
export const texturesReady = () => Promise.all(pending.splice(0));
function fileTex(k) {
  const info = TEXTURAS[k]; if (!info) return null;
  const t = new THREE.Texture(), img = new Image();
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (info.srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (info.mips === false) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  // onload y no decode(): con la página fuera de la vista, decode() puede no terminar nunca
  pending.push(new Promise(ok => {
    img.onload = () => { t.image = img; t.needsUpdate = true; ok(); };
    img.onerror = () => { console.warn('textura ' + k + ': no se pudo cargar, se calcula'); t.image = GEN[k]().image; t.needsUpdate = true; ok(); };
    img.src = new URL(k + '.webp', new URL('./texturas/', import.meta.url)).href;
  }));
  return t;
}
// Madera de muebles (T-65, elegida por el usuario el 2026-11-08 en motor/pruebas/maderas.html): roble con radios.
// 512 px = 0,5 m (1 px ≈ 1 mm), veta a lo largo de V: anillos rectos de ~8 mm con ondulación lenta y espaciado
// irregular, línea de leño tardío angosta, poros como rayitas de 1 mm a lo largo de la veta y radios claros cruzados
// (manchas de ~3 cm × 4 mm). Devuelve tono (1 = color del mueble), alto (relieve) y poro (0–1, más mate).
function oakAt(x, y) {
  const S = 512, frac = v => v - Math.floor(v);
  const w = 14 * (vnoise(x / 128, y / 256, 4, 2) - 0.5) + 3.5 * (vnoise(x / 32, y / 128, 16, 4) - 0.5);
  const u = x + w, ph = u * 64 / S + 2.2 * vnoise(u / 64, 0.5, 8, 1), f = frac(ph), k = 0.45 + 0.55 * hash(Math.floor(ph), 3);
  const late = smooth(0.55, 0.75, f) * (1 - smooth(0.81, 0.95, f)) * k;
  const pore = smooth(0.85, 0.9, vnoise(x, y / 51.2, S, 10));
  const ray = smooth(0.66, 0.74, vnoise(x / 32, y / 4, 16, 128)) * (0.5 + 0.5 * vnoise(x / 64, y / 64, 8, 8));
  return { tono: 1 - 0.13 * late - 0.06 * pore + 0.1 * ray, alto: 1 - 0.4 * late - 0.9 * pore + 0.15 * ray, poro: Math.max(0, pore - 0.6 * ray) };
}
const grassBlade = (x, y) => vnoise(x / 2 + 3 * vnoise(x / 8, y / 8, 64, 64), y / 4, 256, 128);
const lazy = (k, f) => { GEN[k] = f; return () => T[k] || (T[k] = fileTex(k) ?? f()); };
const TEX = {
  // madera de muebles (roble con radios, ver oakAt): relieve y brillo; el poro es más mate y los radios más lisos
  woodN: lazy('woodN', () => normalTex(512, (x, y) => oakAt(x, y).alto, 1.2)),
  woodPore: lazy('woodPore', () => toTex(canvasFrom(512, (x, y) => gray(255 * (0.72 + 0.28 * oakAt(x, y).poro))), false)),
  // poro fino genérico: brillo de los pisos de tablas y de espiga
  woodR: lazy('woodR', () => toTex(canvasFrom(512, (x, y) => gray(255 * (0.7 + 0.3 * vnoise(x / 2, y / 8, 256, 64)))), false)),
  // tela: la trama del tejido, de a pares de hilos
  fabricN: lazy('fabricN', () => normalTex(256, (x, y) => { const u = Math.sin(x / 256 * Math.PI * 2 * 64), v = Math.sin(y / 256 * Math.PI * 2 * 64); return 0.5 + 0.25 * (((x >> 2) + (y >> 2)) % 2 ? u : v) + 0.1 * vnoise(x / 8, y / 8, 32, 32); }, 1.2)),
  // revoque de pared: casi liso, un granulado fino y ondulaciones muy suaves de la llana
  plasterN: lazy('plasterN', () => normalTex(512, (x, y) => 0.6 * vnoise(x / 3, y / 3, 171, 171) + 0.3 * vnoise(x / 24, y / 24, 22, 22) + 0.1 * vnoise(x / 90, y / 90, 6, 6), 0.9)),
  // pisos de tablas y espiga: junta hundida con canto redondeado y la veta de cada tabla
  planksN: lazy('planksN', () => normalTex(1024, (x, y) => {
    const row = y >> 7, gy = y & 127, off = Math.floor(hash(row, 3) * 1024), lx = (x + off) % 1024, gx = lx & 511, e = Math.min(gy, 127 - gy, gx, 511 - gx);
    return Math.min(1, e / 4) * (1 - 0.08 * vnoise(x / 3, y / 2, 341, 512) - 0.06 * (0.5 + 0.5 * Math.sin(gy * 0.35 + 6 * vnoise(x / 64, y / 6, 16, 171))));
  }, 2.2)),
  herringboneN: lazy('herringboneN', () => normalTex(1024, (x, y) => { const b = herringboneAt(x, y, 1024); return Math.min(1, b.edge / 0.03) * (1 - 0.1 * vnoise(b.along * 60, b.across * 14, 512, 64)); }, 2.2)),
  // piedra y hormigón: poro y nublado
  stoneN: lazy('stoneN', () => normalTex(512, (x, y) => 0.7 * vnoise(x / 2, y / 2, 256, 256) + 0.3 * vnoise(x / 10, y / 10, 51, 51), 0.7)),
  concreteN: lazy('concreteN', () => normalTex(512, (x, y) => (hash(x, y) > 0.992 ? 0 : 1) * (0.8 + 0.2 * vnoise(x / 5, y / 5, 103, 103)), 1.2)),
  mirror: lazy('mirror', () => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 128, 128);
    gr.addColorStop(0, '#f6f8f8'); gr.addColorStop(0.55, '#e6eaec'); gr.addColorStop(1, '#d6dcdf'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }),
  fabric: lazy('fabric', () => toTex(canvasFrom(256, (x, y) => {
    const weave = (((x >> 1) & 1) ^ ((y >> 1) & 1)) ? 1 : 0.9;
    return gray(255 * weave * (0.94 + 0.06 * vnoise(x / 8, y / 8, 32, 32)));
  }), true)),
  // capitoné en rombos: 4 rombos por repetición
  quilt: lazy('quilt', () => toTex(canvasFrom(256, (x, y) => {
    const u = x / 256, v = y / 256, a = ((u + v) * 4) % 1, b = (((u - v) * 4) % 1 + 1) % 1;
    const line = Math.min(a, 1 - a, b, 1 - b);
    return gray(255 * (0.72 + 0.28 * smooth(0, 0.09, line)) * (0.95 + 0.05 * hash(x >> 1, y >> 1)));
  }), true)),
  // madera de muebles: roble con radios (oakAt), la veta a lo largo de V
  wood: lazy('wood', () => toTex(canvasFrom(512, (x, y) => gray(255 * Math.max(0, Math.min(1, oakAt(x, y).tono)))), true)),
  // 2 × 2 placas por repetición, con junta fina (2 px ≈ 2 mm en una placa de 60 cm) y un nublado suave de porcelanato
  tile: lazy('tile', () => toTex(canvasFrom(1024, (x, y) => {
    const gx = x % 512, gy = y % 512;
    if (gx < 1 || gx > 510 || gy < 1 || gy > 510) return gray(206);
    const id = (x >= 512 ? 1 : 0) + (y >= 512 ? 2 : 0);
    const cloud = 0.5 * vnoise(x / 64, y / 64, 16, 16) + 0.5 * vnoise(x / 16 + id * 9, y / 16, 64, 64);
    const v = (0.975 + 0.025 * hash(id, 7)) * (0.95 + 0.05 * cloud) * (hash(x, y) > 0.998 ? 0.92 : 1);
    return gray(255 * v);
  }), true)),
  tileBump: lazy('tileBump', () => toTex(canvasFrom(1024, (x, y) => {
    const gx = x % 512, gy = y % 512, d = Math.min(gx, 511 - gx, gy, 511 - gy);
    return gray(d < 1 ? 0 : d < 3 ? ((d - 1) / 2) * 255 : 255);
  }), false)),
  // machihembrado: 2 tablas por repetición con buña; "slats": 4 listones redondeados con sombra entre ellos
  boards: lazy('boards', () => toTex(canvasFrom(256, (x, y) => {
    const u = x % 128; return gray(255 * (u < 3 ? 0.62 : u < 6 ? 0.85 : 1) * (0.97 + 0.03 * vnoise(x / 32, y / 8, 8, 32)));
  }), true)),
  slats: lazy('slats', () => toTex(canvasFrom(256, (x, y) => {
    const u = (x % 64) / 64, v = u < 0.12 ? 0.45 : 0.82 + 0.18 * Math.sin(Math.PI * (u - 0.12) / 0.88);
    return gray(255 * v * (0.94 + 0.06 * vnoise(x / 4, y / 40, 64, 6)));
  }), true)),
  // granito negro: base oscura con motas grises y blancas de distintos tamaños
  granite: lazy('granite', () => toTex(canvasFrom(512, (x, y) => {
    const n = vnoise(x / 6, y / 6, 85, 85) * 0.6 + vnoise(x / 2, y / 2, 256, 256) * 0.4, h = hash(x, y);
    const v = n > 0.8 ? 0.5 + 0.25 * h : n > 0.7 ? 0.28 : h > 0.993 ? 0.75 : 0.11 + 0.06 * vnoise(x / 20, y / 20, 25, 25);
    return gray(255 * v);
  }), true)),
  tileRough: lazy('tileRough', () => toTex(canvasFrom(1024, (x, y) => {
    const gx = x % 512, gy = y % 512;
    if (gx < 1 || gx > 510 || gy < 1 || gy > 510) return gray(240);
    return gray(60 + 40 * vnoise(x / 64, y / 64, 16, 16));
  }), false)),
  // acolchado de cuadros cosidos: 2 × 2 cuadros inflados por repetición, costuras hundidas
  pillowQuilt: lazy('pillowQuilt', () => toTex(canvasFrom(512, (x, y) => {
    const u = (x % 256) / 256, v = (y % 256) / 256;
    const puff = Math.sqrt(Math.max(0, (1 - (2 * u - 1) ** 6) * (1 - (2 * v - 1) ** 6)));
    return gray(255 * (0.62 + 0.38 * puff) * (0.97 + 0.03 * vnoise(x / 8, y / 8, 64, 64)));
  }), true)),
  // tejido grueso tipo waffle (almohadones tejidos)
  knit: lazy('knit', () => toTex(canvasFrom(256, (x, y) => {
    const a = Math.sin((x / 256) * Math.PI * 2 * 16), b = Math.sin((y / 256) * Math.PI * 2 * 16 + (Math.floor(x / 16) % 2) * Math.PI);
    return gray(255 * (0.7 + 0.3 * Math.abs(a * b)) * (0.94 + 0.06 * hash(x >> 2, y >> 2)));
  }), true)),
  // pasto (patios, jardines; 512 px = 1 m): hojitas de 1–2 mm en todas direcciones sobre matas de ~10 cm más oscuras
  // y algún claro seco; el relieve sale de las mismas hojitas
  grass: lazy('grass', () => toTex(canvasFrom(512, (x, y) => {
    const blade = grassBlade(x, y), clump = vnoise(x / 64, y / 64, 8, 8);
    const dry = smooth(0.72, 0.9, 0.5 * vnoise(x / 128 + 7, y / 128, 4, 4) + 0.5 * vnoise(x / 32, y / 32, 16, 16));
    const v = (0.62 + 0.38 * blade) * (0.78 + 0.22 * clump);
    return [255 * Math.min(1, v * (1 + 0.35 * dry)), 255 * v * (1 + 0.12 * dry), 255 * v * (1 - 0.25 * dry)];
  }), true)),
  grassN: lazy('grassN', () => normalTex(512, (x, y) => 0.7 * grassBlade(x, y) + 0.3 * vnoise(x / 64, y / 64, 8, 8), 2.5)),
  // mimbre: varillas que pasan una por arriba y otra por abajo (canastos); 16 × 16 cruces por repetición
  wicker: lazy('wicker', () => toTex(canvasFrom(256, (x, y) => {
    const u = x / 16, v = y / 16, cu = Math.floor(u), cv = Math.floor(v), over = (cu + cv) % 2;
    const s = over ? Math.sin(Math.PI * (v - cv)) : Math.sin(Math.PI * (u - cu));
    return gray(255 * (0.5 + 0.5 * s) * (0.9 + 0.1 * hash(cu, cv)));
  }), true)),
  // piso flotante: 8 tablas de 15 cm por repetición (1,2 m), juntas desfasadas por hilera
  planks: lazy('planks', () => toTex(canvasFrom(1024, (x, y) => {
    const row = y >> 7, gy = y & 127, off = Math.floor(hash(row, 3) * 1024), lx = (x + off) % 1024, plank = lx >> 9, gx = lx & 511;
    if (gy < 2 || gx < 2) return gray(150);
    const tone = 0.9 + 0.12 * hash(row, plank + 11);
    const grain = 0.5 + 0.5 * Math.sin(gy * 0.35 + 6 * vnoise(x / 64, y / 6, 16, 171));
    return gray(255 * tone * (1 - 0.07 * grain - 0.05 * vnoise(x / 3, y / 2, 341, 512)));
  }), true)),
  planksBump: lazy('planksBump', () => toTex(canvasFrom(1024, (x, y) => {
    const row = y >> 7, gy = y & 127, off = Math.floor(hash(row, 3) * 1024), gx = ((x + off) % 1024) & 511;
    return gray(gy < 2 || gx < 2 ? 0 : 255);
  }), false)),
  // parquet en espiga (tablitas de 1 × 5, a 45° de las paredes, la espiga corre a lo largo de V): ver herringboneAt
  herringbone: lazy('herringbone', () => toTex(canvasFrom(1024, (x, y) => {
    const b = herringboneAt(x, y, 1024);
    if (b.edge < 0.012) return gray(120);
    const tone = 0.86 + 0.16 * hash(b.id, 5), grain = 0.5 + 0.5 * Math.sin(b.across * 40 + 5 * vnoise(b.along * 6 + b.id * 3, b.across * 3, 64, 8));
    return gray(255 * tone * (1 - 0.08 * grain - 0.05 * vnoise(b.along * 60, b.across * 14, 512, 64)));
  }), true)),
  herringboneBump: lazy('herringboneBump', () => toTex(canvasFrom(1024, (x, y) => gray(herringboneAt(x, y, 1024).edge < 0.012 ? 0 : 255)), false)),
  // granito (terrazo) claro: base blanca con lascas negras, grises y beige de distintos tamaños
  terrazzo: lazy('terrazzo', () => toTex(canvasFrom(512, (x, y) => {
    const chip = vnoise(x / 3, y / 3, 171, 171), big = vnoise(x / 7 + 40, y / 7, 73, 73), h = hash(x >> 1, y >> 1);
    const v = big > 0.82 ? 0.22 + 0.15 * h : chip > 0.8 ? 0.35 + 0.2 * h : chip < 0.12 ? 0.78 : 0.94 + 0.05 * vnoise(x / 30, y / 30, 17, 17);
    return gray(255 * v);
  }), true)),
  // hormigón a la vista (vigas y pilares): gris nublado en tres escalas, poros chicos y alguna marca suave del encofrado
  concrete: lazy('concrete', () => toTex(canvasFrom(512, (x, y) => {
    const n = vnoise(x / 96, y / 96, 6, 6) * 0.5 + vnoise(x / 24, y / 24, 22, 22) * 0.32 + vnoise(x / 5, y / 5, 103, 103) * 0.18;
    const pore = hash(x, y) > 0.992 ? 0.82 : 1, form = (y % 170) < 2 ? 0.95 : 1;
    return gray(255 * (0.8 + 0.2 * n) * pore * form);
  }), true)),
  // mármol blanco: nublado suave con vetas grises finas que serpentean
  marble: lazy('marble', () => toTex(canvasFrom(512, (x, y) => {
    const n = vnoise(x / 64, y / 64, 8, 8) * 2 + vnoise(x / 16, y / 16, 32, 32) * 0.6;
    const vein = Math.abs(Math.sin((x + y * 0.6) / 512 * Math.PI * 2 * 2 + n * 3));
    return gray(255 * (0.96 - 0.28 * Math.max(0, 1 - vein * 18) - 0.04 * vnoise(x / 8, y / 8, 64, 64)));
  }), true)),
};
// espiga: las tablitas (ancho w, largo 5w) forman una espiga en el plano (x, y) en unidades de w con períodos (1, 1) y
// (5, -5); girada 45° queda un cuadrado de 5·√2·w de lado. Devuelve el borde (distancia a la junta, en unidades de w),
// la posición dentro de la tabla (along 0..1 a lo largo, across 0..1 a lo ancho) y un id por tabla para el tono
function herringboneAt(px, py, N) {
  const n = 5, P = n * Math.SQRT2, X = (px + 0.5) / N * P, Y = (py + 0.5) / N * P;
  const x = (X + Y) / Math.SQRT2, y = (Y - X) / Math.SQRT2, s = Math.floor(y), xr = x - s, fy = y - s;
  const k = Math.floor(xr / (2 * n)), xx = xr - 2 * n * k;
  let along, across, cx, cy;
  if (xx < n) { along = xx / n; across = fy; cx = 2 * n * k + n / 2; cy = 0.5; }
  else { const c = Math.floor(xx - n); across = xx - n - c; along = (fy + n - 1 - c) / n; cx = 2 * n * k + n + c + 0.5; cy = c - n + 1 + n / 2; }
  const edge = Math.min(across, 1 - across, along * n, (1 - along) * n);
  // id estable entre copias: centro de la tabla en el plano original, reducido a los períodos del cuadrado
  const ox = cx + s, oy = cy + s, u = ((ox - oy) / 2 % n + n) % n, v = ((ox + oy) / 2 % n + n) % n;
  return { edge, along, across, id: Math.round(u * 4) * 31 + Math.round(v * 4) };
}
function rugTexture(colors, n) {
  return toTex(canvasFrom(512, (x, y) => {
    const c = new THREE.Color(colors[Math.floor(x / (512 / n)) % colors.length]);
    const k = (0.86 + 0.14 * hash(x, y)) * ((y % 3) ? 1 : 0.9);
    return [c.r * 255 * k, c.g * 255 * k, c.b * 255 * k];
  }), true);
}
// estampado de hojas largas (ropa de cama, almohadones): trazos curvos de colores sobre fondo claro
function leafTexture(colors, seed) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = colors[0]; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 170; i++) {
    const x = r() * 512, y = r() * 512, a = r() * Math.PI * 2, L = 40 + r() * 70, w = 4 + r() * 7;
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = colors[1 + Math.floor(r() * (colors.length - 1))]; g.globalAlpha = 0.75 + 0.25 * r();
    for (const dx of [0, 512, -512]) for (const dy of [0, 512, -512]) {
      g.save(); g.rotate(-a); g.translate(dx, dy); g.rotate(a);
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L / 2, -w, L, 0); g.quadraticCurveTo(L / 2, w, 0, 0); g.fill(); g.restore();
    }
    g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}
// estampado tropical (manteles de hule, almohadones): hojas de palmera (costilla curva con folíolos finos) y de costilla
// de Adán (acorazonadas, con cortes) sobre fondo claro; "colors" = [fondo, verdes…]. Se repite sin costura
function palmTexture(colors, seed) {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'), r = rng(seed), greens = colors.slice(1);
  g.fillStyle = colors[0]; g.fillRect(0, 0, 1024, 1024);
  const tiled = (x, y, a, fn) => { for (const dx of [-1024, 0, 1024]) for (const dy of [-1024, 0, 1024]) { g.save(); g.translate(x + dx, y + dy); g.rotate(a); fn(); g.restore(); } };
  for (let i = 0; i < 24; i++) {
    const x = r() * 1024, y = r() * 1024, a = r() * Math.PI * 2, L = 190 + r() * 150, col = greens[Math.floor(r() * greens.length)], col2 = greens[Math.floor(r() * greens.length)];
    if (i % 3 === 0) tiled(x, y, a, () => {   // costilla de Adán
      g.fillStyle = col; g.beginPath(); g.moveTo(0, 0);
      g.bezierCurveTo(L * 0.62, -L * 0.12, L * 0.72, -L * 0.78, 0, -L); g.bezierCurveTo(-L * 0.72, -L * 0.78, -L * 0.62, -L * 0.12, 0, 0); g.fill();
      g.strokeStyle = colors[0]; g.lineCap = 'round'; g.lineWidth = L * 0.03;
      for (let k = 1; k < 6; k++) { const t = k / 6, yy = -L * t; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * L * 0.16, yy - L * 0.03); g.lineTo(s * L * 0.6 * Math.sin(Math.PI * Math.min(0.95, t * 1.02)), yy - L * 0.13); g.stroke(); } }
      g.strokeStyle = shade(col, 0.1); g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -L * 0.94); g.stroke();
    });
    else tiled(x, y, a, () => {   // palmera: costilla curva y folíolos que apuntan hacia la punta
      g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.15, -L * 0.5, 0, -L); g.stroke();
      for (let k = 2; k < 26; k++) {
        const t = k / 26, px = 2 * (1 - t) * t * L * 0.15, py = -L * t, len = L * 0.36 * Math.sin(Math.PI * Math.min(1, t * 1.1)) + 8, th = 0.7 + 0.2 * t;
        for (const s of [-1, 1]) {
          g.fillStyle = k % 2 ? col : col2; g.save(); g.translate(px, py); g.rotate(s > 0 ? -th : -(Math.PI - th));
          g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -len * 0.07, len, 0); g.quadraticCurveTo(len * 0.5, len * 0.07, 0, 0); g.fill(); g.restore();
        }
      }
    });
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}
// tejido al crochet: anillos de colores ("rings", almohadones redondos tipo mandala) o cuadrado de abuela ("granny"),
// cada color en dos vueltas, con los puntos marcados a lo largo de cada vuelta. Ocupa una sola repetición (UV de 0 a 1)
function crochetTexture(colors, kind) {
  return toTex(canvasFrom(512, (x, y) => {
    const dx = (x - 255.5) / 256, dy = (y - 255.5) / 256, d = kind === 'granny' ? Math.max(Math.abs(dx), Math.abs(dy)) : Math.hypot(dx, dy);
    const rows = colors.length * 2, f = Math.min(rows - 0.001, d * rows), k = Math.floor(f), fr = f - k;
    const along = kind === 'granny' ? (Math.abs(dx) > Math.abs(dy) ? dy : dx) * 40 * (k + 1) / rows : Math.atan2(dy, dx) * (6 + k * 6);
    const st = 0.5 + 0.5 * Math.sin(along * Math.PI), v = (0.74 + 0.26 * Math.sin(Math.PI * fr)) * (0.86 + 0.14 * st) * (0.95 + 0.05 * hash(x >> 1, y >> 1));
    const c = new THREE.Color(colors[Math.floor(k / 2) % colors.length]);
    return [c.r * 255 * v, c.g * 255 * v, c.b * 255 * v];
  }), true);
}
function stripeTexture(colors, n) {
  return toTex(canvasFrom(256, (x, y) => {
    const c = new THREE.Color(colors[Math.floor(y / (256 / n)) % colors.length]), k = (0.9 + 0.1 * hash(x >> 1, y >> 1)) * ((x % 4) ? 1 : 0.93);
    return [c.r * 255 * k, c.g * 255 * k, c.b * 255 * k];
  }), true);
}
function artTexture(palette, seed, style) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), r = rng(seed);
  if (style === 'lake') {   // paisaje de lago y montañas (lo que muestran las teles en las fotos)
    c.width = 640; c.height = 360;
    const sky = g.createLinearGradient(0, 0, 0, 200); sky.addColorStop(0, '#3f7fc4'); sky.addColorStop(1, '#bcd6ea');
    g.fillStyle = sky; g.fillRect(0, 0, 640, 360);
    g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(r() * 640, 40 + r() * 80, 60 + r() * 60, 10 + r() * 8, 0, 0, 7); g.fill(); }
    g.fillStyle = '#6d6a55'; g.beginPath(); g.moveTo(0, 230); for (let x = 0; x <= 640; x += 16) g.lineTo(x, 230 - 110 * Math.max(0, Math.sin(x / 140 + 0.6)) * (0.7 + 0.3 * r())); g.lineTo(640, 230); g.fill();
    g.fillStyle = '#4c6a3c'; g.fillRect(0, 222, 640, 14);
    const w = g.createLinearGradient(0, 236, 0, 360); w.addColorStop(0, '#2f6f9e'); w.addColorStop(1, '#1d4e74'); g.fillStyle = w; g.fillRect(0, 236, 640, 124);
  } else if (style === 'snow') {
    c.width = 400; c.height = 520;
    const sky = g.createLinearGradient(0, 0, 0, 520); sky.addColorStop(0, palette[2] ?? '#9fb2c0'); sky.addColorStop(1, '#e9eef2');
    g.fillStyle = sky; g.fillRect(0, 0, 400, 520);
    for (let k = 0; k < 3; k++) {
      const base = 220 + k * 110; g.beginPath(); g.moveTo(0, 520);
      for (let x = 0; x <= 400; x += 20) g.lineTo(x, base - 120 * Math.abs(Math.sin(x / (70 + k * 30) + seed + k)) * (1 - k * 0.2) - r() * 25);
      g.lineTo(400, 520); g.closePath();
      g.fillStyle = k === 1 ? (palette[1] ?? '#4a5560') : '#f4f6f8'; g.fill();
      g.strokeStyle = palette[0] ?? '#2e3640'; g.lineWidth = 2; g.globalAlpha = 0.5;
      for (let i = 0; i < 26; i++) { const x = r() * 400; g.beginPath(); g.moveTo(x, base - 60 - r() * 60); g.lineTo(x + 18 * (r() - 0.5), base + 20); g.stroke(); }
      g.globalAlpha = 1;
    }
  } else if (style === 'skyline') {
    // foto panorámica en blanco y negro: ciudad junto al agua, con reflejo
    c.width = 1024; c.height = 376;
    const hz = 230, sky = g.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, '#5d5d5d'); sky.addColorStop(1, '#c9c9c9');
    g.fillStyle = sky; g.fillRect(0, 0, 1024, hz);
    const city = document.createElement('canvas'); city.width = 1024; city.height = hz;
    const cg = city.getContext('2d');
    for (let x = 0; x < 1024;) {
      const w = 14 + r() * 40, h = 20 + r() * (x > 380 && x < 620 ? 40 : 140), v = 30 + r() * 25 | 0;
      cg.fillStyle = `rgb(${v},${v},${v})`;
      cg.fillRect(x, hz - h, w, h);
      cg.fillStyle = 'rgba(235,235,235,.55)';
      for (let wy = hz - h + 6; wy < hz - 4; wy += 7) for (let wx = x + 3; wx < x + w - 3; wx += 6) if (r() > 0.55) cg.fillRect(wx, wy, 2, 3);
      x += w + r() * 6;
    }
    cg.strokeStyle = '#f2f2f2'; cg.lineWidth = 3;                       // puente atirantado
    cg.beginPath(); cg.moveTo(470, hz - 6); cg.lineTo(560, hz - 120); cg.stroke();
    cg.lineWidth = 1; for (let i = 0; i < 9; i++) { cg.beginPath(); cg.moveTo(560 - i * 9, hz - 120 + i * 12); cg.lineTo(470 + i * 22, hz - 4); cg.stroke(); }
    g.drawImage(city, 0, 0);
    g.fillStyle = '#2a2a2a'; g.fillRect(0, hz, 1024, 376 - hz);
    g.save(); g.globalAlpha = 0.45; g.translate(0, hz * 2); g.scale(1, -1); g.drawImage(city, 0, 0); g.restore();
    g.fillStyle = 'rgba(255,255,255,.08)';
    for (let i = 0; i < 60; i++) g.fillRect(r() * 1024, hz + r() * 140, 40 + r() * 120, 1);
  } else {
    c.width = 512; c.height = 360;
    g.fillStyle = palette[3] ?? '#efe9df'; g.fillRect(0, 0, 512, 360);
    g.fillStyle = palette[2]; g.beginPath(); g.arc(170, 360, 150, Math.PI, 0); g.fill();
    g.fillStyle = palette[0]; g.beginPath(); g.arc(330 + r() * 40, 140, 72, 0, Math.PI * 2); g.fill();
    g.fillStyle = palette[1]; g.fillRect(300, 230, 150, 130);
    g.strokeStyle = palette[1]; g.lineWidth = 6; g.beginPath(); g.moveTo(40, 80); g.bezierCurveTo(160, 20, 220, 160, 300, 70); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
// fachada de un edificio del entorno: 4 × 4 módulos de 3 m (12 m por repetición) con ventanas, persianas a medio
// bajar y losas. Devuelve también un mapa de ventanas encendidas para la noche.
function facadeTexture(style, base, seed) {
  const N = 512, px = N / 12, r = rng(seed);
  const c = document.createElement('canvas'); c.width = c.height = N;
  const lit = document.createElement('canvas'); lit.width = lit.height = N;
  const g = c.getContext('2d'), lg = lit.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, N, N); lg.fillStyle = '#000'; lg.fillRect(0, 0, N, N);
  if (style === 'brick') {
    g.fillStyle = shade(base, -0.06);
    for (let y = 0; y < N; y += 3) g.fillRect(0, y, N, 1);
    for (let y = 0; y < N; y += 3) for (let x = (y / 3) % 2 ? 0 : 5; x < N; x += 10) g.fillRect(x, y, 1, 3);
  }
  const slab = style === 'glass' ? '#9aa3aa' : shade(base, style === 'brick' ? 0.2 : 0.05);
  for (let f = 0; f < 4; f++) {
    const yb = N - f * 3 * px;
    for (let b = 0; b < 4; b++) {
      const wide = style === 'glass', x = wide ? b * 3 * px + 2 : (b * 3 + 0.6) * px, w = wide ? 3 * px - 4 : 1.8 * px;
      const y = yb - (wide ? 2.75 : 2.55) * px, h = (wide ? 2.4 : 1.65) * px;
      const gl = g.createLinearGradient(0, y, 0, y + h);
      gl.addColorStop(0, '#8fa6b8'); gl.addColorStop(1, '#3d4a57');
      g.fillStyle = gl; g.fillRect(x, y, w, h);
      const sh = wide ? 0 : r() * r() * 0.8;                      // persiana baja (fracción)
      g.fillStyle = '#eceae4'; g.fillRect(x, y, w, h * sh);
      g.strokeStyle = '#f2f2f0'; g.lineWidth = 2; g.strokeRect(x, y, w, h);
      if (!wide) { g.fillStyle = '#f2f2f0'; g.fillRect(x + w / 2 - 1, y + h * sh, 2, h * (1 - sh)); }
      if (r() < 0.3) {                                           // de noche, algunas ventanas encendidas
        const k = 0.55 + 0.45 * r();
        lg.fillStyle = `rgb(${255 * k | 0},${200 * k | 0},${130 * k | 0})`; lg.fillRect(x, y + h * sh, w, h * (1 - sh));
      }
    }
    g.fillStyle = slab; g.fillRect(0, yb - 0.28 * px, N, 0.28 * px);
    if (style !== 'glass' && f % 2 === 0) {                     // balcones corridos con baranda
      g.fillStyle = 'rgba(40,44,50,.55)';
      for (let x = 0; x < N; x += 5) g.fillRect(x, yb - 1.25 * px, 1, 0.95 * px);
      g.fillRect(0, yb - 1.3 * px, N, 2);
    }
  }
  const t = new THREE.CanvasTexture(c), tl = new THREE.CanvasTexture(lit);
  for (const x of [t, tl]) { x.colorSpace = THREE.SRGBColorSpace; x.wrapS = x.wrapT = THREE.RepeatWrapping; x.anisotropy = 4; }
  return { map: t, lit: tl };
}

/* ---------- materiales: dos estilos sobre los mismos componentes ---------- */
let uvSeed = 0;
const jitter = m => { m.userData.jitter = true; return m; };
export function makeMaterials(preset) {
  uvSeed = 0;   // cada departamento arma igual cada vez
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
  const fabricOpts = c => ({
    color: col(c), map: TEX.fabric(), normalMap: TEX.fabricN(), normalScale: new THREE.Vector2(0.55, 0.55), roughness: 0.95,
    sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color(c).lerp(new THREE.Color('#ffffff'), 0.5),
  });
  const lib = {
    clay,
    paint: c => once('paint' + c, () => clay ? matte(c, 1) : new THREE.MeshStandardMaterial({ color: col(c), roughness: 0.92 })),
    lacquer: c => once('lac' + c, () => clay ? matte(c, 0.85) : new THREE.MeshStandardMaterial({ color: col(c), roughness: 0.38 })),
    ceramic: c => once('cer' + c, () => clay ? matte(c, 0.85) : new THREE.MeshStandardMaterial({ color: col(c), roughness: 0.22 })),
    ceramicDS: c => once('cerds' + c, () => { const m = clay ? matte(c, 0.85) : new THREE.MeshStandardMaterial({ color: col(c), roughness: 0.22 }); m.side = THREE.DoubleSide; return m; }),
    // acero inoxidable cepillado (mesadas, heladeras): medio metálico, conserva el gris claro aunque refleje poco
    brushed: c => once('brushed' + c, () => clay ? matte(c, 0.7) : new THREE.MeshStandardMaterial({ color: col(c), roughness: 0.34, metalness: 0.32 })),
    metal: (c, r = 0.3) => once('met' + c + r, () => clay ? matte(c, 0.7) : new THREE.MeshStandardMaterial({ color: col(c), roughness: r, metalness: 1 })),
    screen: () => once('screen', () => new THREE.MeshStandardMaterial({ color: clay ? col('#3a3d42') : 0x0b0d10, roughness: 0.12, metalness: clay ? 0 : 0.3 })),
    mirror: () => once('mirror', () => {
      if (clay) return matte('#cfd8de', 0.4);
      // sin reflejo (2026-11-07, pedido del usuario: "se ve mal y no aporta"): un plateado claro con un degradé suave, como
      // un espejo que refleja la pared de enfrente; mate al entorno para que no muestre nada
      return new THREE.MeshStandardMaterial({ color: 0xffffff, map: TEX.mirror(), roughness: 0.55, metalness: 0, envMapIntensity: 0.3 });
    }),
    wood: c => once('wood' + c, () => clay ? matte(c, 0.9) : jitter(new THREE.MeshStandardMaterial({ color: col(c), map: TEX.wood(), normalMap: TEX.woodN(), normalScale: new THREE.Vector2(0.5, 0.5), roughnessMap: TEX.woodPore(), roughness: 0.62 }))),
    // pared: pintura sobre revoque fino, con la variación de tono a escala de habitación
    wall: c => once('wall' + c, () => clay ? matte(c, 1) : macroTone(new THREE.MeshStandardMaterial({ color: col(c), roughness: 0.92, normalMap: TEX.plasterN(), normalScale: new THREE.Vector2(0.18, 0.18) }), 0.025, 0.35)),
    fabric: c => once('fab' + c, () => clay ? matte(c, 1) : jitter(new THREE.MeshPhysicalMaterial(fabricOpts(c)))),
    cloth: c => once('cloth' + c, () => { const m = clay ? matte(c, 1) : new THREE.MeshPhysicalMaterial(fabricOpts(c)); m.side = THREE.DoubleSide; return m; }),
    // voile: tela fina traslúcida; brilla un poco con la luz de la ventana y no tapa la vista (no escribe profundidad)
    // "o": opacidad (0,58 voile; 0,85 tela liviana a contraluz, como una cortina de algodón que brilla con el sol)
    voile: (c, o = 0.58) => once('voile' + c + o, () => night(new THREE.MeshPhysicalMaterial({
      ...fabricOpts(c), transparent: true, opacity: clay ? Math.max(0.8, o) : o, depthWrite: false, side: THREE.DoubleSide,
      emissive: new THREE.Color(c), bumpScale: 0.1,
    }), 0.12, 0.02)),
    // las mismas telas para cortinas: además brillan a contraluz con el sol (ver backlit)
    curtainCloth: c => once('ccloth' + c, () => clay ? lib.cloth(c) : backlit(lib.cloth(c).clone())),
    curtainVoile: (c, o = 0.58) => once('cvoile' + c + o, () => { if (clay) return lib.voile(c, o); const v = lib.voile(c, o), m = backlit(v.clone()); m.userData.night = v.userData.night; return m; }),
    quilt: c => once('quilt' + c, () => clay ? matte(c, 1) : new THREE.MeshPhysicalMaterial({
      ...fabricOpts(c), map: TEX.quilt(), bumpMap: TEX.quilt(), bumpScale: 1.2,
    })),
    // "gloss" (0 a 1): porcelanato pulido. El motor le suma el reflejo espejado del ambiente (userData.gloss)
    floor: (c, kind = 'tile', gloss = 0) => once('floor' + kind + c + gloss, () => {
      if (clay) return matte(c, 0.8);
      // "herringbone": parquet en espiga (madera plastificada, semimate); "terrazzo": granito claro pulido
      const m = kind === 'planks'
        ? new THREE.MeshStandardMaterial({ color: col(c), map: TEX.planks(), roughness: 0.62 - 0.3 * gloss, roughnessMap: TEX.woodR(), normalMap: TEX.planksN(), normalScale: new THREE.Vector2(0.6, 0.6) })
        : kind === 'herringbone'
        ? new THREE.MeshStandardMaterial({ color: col(c), map: TEX.herringbone(), roughness: 0.58 - 0.3 * gloss, roughnessMap: TEX.woodR(), normalMap: TEX.herringboneN(), normalScale: new THREE.Vector2(0.55, 0.55) })
        : kind === 'terrazzo'
        ? new THREE.MeshStandardMaterial({ color: col(c), map: TEX.terrazzo(), roughness: 0.35 - 0.2 * gloss })
        : kind === 'grass'
        ? new THREE.MeshStandardMaterial({ color: col(c), map: TEX.grass(), normalMap: TEX.grassN(), normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.95 })
        : new THREE.MeshStandardMaterial({ color: col(c), map: TEX.tile(), roughnessMap: TEX.tileRough(), roughness: 1 - 0.7 * gloss, bumpMap: TEX.tileBump(), bumpScale: 0.6 });
      if (gloss > 0) { m.userData.gloss = gloss; m.envMapIntensity = 1 - 0.6 * gloss; }
      return macroTone(m, kind === 'tile' ? 0.025 : kind === 'grass' ? 0.14 : 0.05);
    }),
    granite: c => once('gran' + c, () => clay ? matte(c, 0.8) : jitter(new THREE.MeshStandardMaterial({ color: new THREE.Color(c).lerp(new THREE.Color('#ffffff'), 0.75), map: TEX.granite(), roughness: 0.18, normalMap: TEX.stoneN(), normalScale: new THREE.Vector2(0.12, 0.12) }))),
    marble: c => once('marb' + c, () => clay ? matte(c, 0.8) : jitter(new THREE.MeshStandardMaterial({ color: col(c), map: TEX.marble(), roughness: 0.15, normalMap: TEX.stoneN(), normalScale: new THREE.Vector2(0.08, 0.08) }))),
    concrete: c => once('conc' + c, () => clay ? matte(c, 1) : jitter(new THREE.MeshStandardMaterial({ color: col(c), map: TEX.concrete(), normalMap: TEX.concreteN(), normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.9 }))),
    // vidrio esmerilado: traslúcido y mate (mamparas, divisores interiores)
    frosted: (c, o = 0.62) => once('frost' + c + o, () => Object.assign(new THREE.MeshPhysicalMaterial({
      color: col(c), transparent: true, opacity: clay ? Math.max(o, 0.6) : o, roughness: 0.55, metalness: 0, depthWrite: false, side: THREE.DoubleSide,
    }), { userData: { frosted: true } })),   // no es 'glass': de noche no se oscurece como una ventana al exterior (es interior)
    velvet: c => once('vel' + c, () => clay ? matte(c, 1) : new THREE.MeshPhysicalMaterial({ ...fabricOpts(c), sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color(c).lerp(new THREE.Color('#ffffff'), 0.35) })),
    boards: (c, kind = 'boards') => once('brd' + kind + c, () => clay ? matte(c, 0.9) : new THREE.MeshStandardMaterial({
      color: col(c), map: TEX[kind](), bumpMap: TEX[kind](), bumpScale: kind === 'slats' ? 2 : 1, roughness: kind === 'slats' ? 0.6 : 0.85 })),
    print: (colors, seed = 3) => once('prt' + colors.join() + seed, () => clay ? matte(colors[0], 1) : new THREE.MeshPhysicalMaterial({
      map: leafTexture(colors, seed), bumpMap: TEX.fabric(), bumpScale: 0.25, roughness: 0.95, sheen: 0.5, sheenRoughness: 0.7, side: THREE.DoubleSide })),
    // acolchado de nylon de cuadros cosidos, con brillo de satén
    puffer: c => once('puffer' + c, () => clay ? matte(c, 1) : new THREE.MeshPhysicalMaterial({
      color: col(c), map: TEX.pillowQuilt(), bumpMap: TEX.pillowQuilt(), bumpScale: 2.2, roughness: 0.5,
      sheen: 0.8, sheenRoughness: 0.4, sheenColor: new THREE.Color(c).lerp(new THREE.Color('#ffffff'), 0.6), side: THREE.DoubleSide,
    })),
    knit: c => once('knit' + c, () => clay ? matte(c, 1) : new THREE.MeshPhysicalMaterial({
      ...fabricOpts(c), map: TEX.knit(), bumpMap: TEX.knit(), bumpScale: 2.5,
    })),
    facade: (style, c, seed) => once('fac' + style + c + seed, () => {
      const t = facadeTexture(style, c, seed);
      return night(new THREE.MeshStandardMaterial({ map: t.map, roughness: 0.85, emissive: 0xffffff, emissiveMap: t.lit }), 0, 1.4);
    }),
    // luz de tira LED o panel: blanca de día (apagada), cálida y encendida de noche
    led: () => once('led', () => night(new THREE.MeshStandardMaterial({ color: 0xfaf6ee, emissive: 0xffc98a, roughness: 0.5 }), 0, 4)),
    // vidrios: userData.glass le avisa al motor que de noche baje su color (con una lámpara encima, un vidrio iluminado
    // como si fuera opaco se veía lechoso)
    glass: () => once('glass', () => Object.assign(new THREE.MeshPhysicalMaterial({
      color: clay ? 0xcfe0ea : 0xe6f0f4, transparent: true, opacity: clay ? 0.35 : 0.12,
      roughness: 0.02, metalness: 0, depthWrite: false, side: THREE.DoubleSide,
    }), { userData: { glass: true } })),
    tintedGlass: (c, o = 0.3) => once('tglass' + c + o, () => Object.assign(new THREE.MeshPhysicalMaterial({
      color: col(c), transparent: true, opacity: clay ? Math.max(o, 0.4) : o, roughness: 0.05, metalness: 0, depthWrite: false, side: THREE.DoubleSide,
    }), { userData: { glass: true } })),
    glow: () => once('glow', () => night(new THREE.MeshStandardMaterial({ color: 0xfff4e0, emissive: 0xffd9a0, roughness: 0.4 }), 0.1, 3)),
    shadeGlow: c => once('shade' + c, () => night(new THREE.MeshStandardMaterial({
      color: col(c), emissive: new THREE.Color(c), roughness: 0.9, side: THREE.DoubleSide,
    }), 0, 0.9)),
    leaf: () => once('leaf', () => new THREE.MeshStandardMaterial({ color: col('#557a3f'), roughness: clay ? 0.9 : 0.55, side: THREE.DoubleSide })),
    // tela a rayas (mantas): las rayas corren a lo largo de U
    stripes: (colors, n) => once('str' + colors.join() + n, () => clay ? matte(colors[0], 1) : new THREE.MeshPhysicalMaterial({
      map: stripeTexture(colors, n), bumpMap: TEX.fabric(), bumpScale: 0.8, roughness: 0.95, sheen: 0.5, sheenRoughness: 0.7, side: THREE.DoubleSide })),
    // tejido al crochet: anillos ("rings") o cuadrado de abuela ("granny") de colores, con el relieve de los puntos
    crochet: (colors, kind = 'rings') => once('cro' + kind + colors.join(), () => clay ? matte(colors[0], 1) : new THREE.MeshPhysicalMaterial({
      map: crochetTexture(colors, kind), bumpMap: TEX.knit(), bumpScale: 1.4, roughness: 0.95, sheen: 0.5, sheenRoughness: 0.7 })),
    // estampado tropical sobre hule (manteles): apenas brillante, de las dos caras
    palm: colors => once('palm' + colors.join(), () => clay ? matte(colors[0], 1) : new THREE.MeshPhysicalMaterial({
      map: palmTexture(colors, 5), roughness: 0.45, clearcoat: 0.25, clearcoatRoughness: 0.45, side: THREE.DoubleSide })),
    // mimbre y fibras tejidas (canastos), de las dos caras
    wicker: c => once('wick' + c, () => clay ? matte(c, 1) : new THREE.MeshStandardMaterial({ color: col(c), map: TEX.wicker(), bumpMap: TEX.wicker(), bumpScale: 2, roughness: 0.85, side: THREE.DoubleSide })),
    // hojas de otro verde que "leaf" (potus, variegadas): de las dos caras
    foliage: c => once('fol' + c, () => new THREE.MeshStandardMaterial({ color: col(c), roughness: clay ? 0.9 : 0.5, side: THREE.DoubleSide })),
    rug: (colors, n) => once('rug' + colors.join() + n, () => clay ? matte(colors[0], 1) :
      new THREE.MeshPhysicalMaterial({ map: rugTexture(colors, n), bumpMap: TEX.fabric(), bumpScale: 1.5, roughness: 1, sheen: 0.4, sheenRoughness: 0.8 })),
    // imagen en una pantalla encendida (tele con un paisaje): brilla un poco de día y más de noche
    picture: palette => once('pic' + palette.join(), () => { const t = artTexture(palette, 9, 'lake'); return night(new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, roughness: 0.25 }), 0.35, 0.8); }),
    art: (palette, seed, style) => once('art' + style + palette.join(), () => new THREE.MeshStandardMaterial({
      map: artTexture(clay ? palette.map(p => '#' + col(p).getHexString()) : palette, seed, style), roughness: 0.8,
    })),
  };
  // cada material recuerda el color que se le pidió ("srcColor"): el mapa de identificación (T-21) y los colores medidos
  // en las fotos (T-22) lo usan para saber qué parámetro del scene corresponde a cada superficie
  for (const [k, f] of Object.entries(lib)) if (typeof f === 'function') lib[k] = (...a) => {
    const m = f(...a);
    if (typeof a[0] === 'string' && a[0].startsWith('#') && m.userData.srcColor === undefined) m.userData.srcColor = a[0];
    return m;
  };
  return lib;
}

/* ---------- geometrías orgánicas ---------- */
// almohadón: superelipse llena al centro y fina en el borde, con esquinas en punta, un labio de costura en el contorno
// y arrugas suaves; los vértices se sueldan antes de calcular normales para que no quede la costura de la esfera
export function pillowGeo(w, h, d, seed = 1, chop = 0) {
  let geo = new THREE.SphereGeometry(1, 44, 28);
  geo.deleteAttribute('uv'); geo.deleteAttribute('normal');
  geo = mergeVertices(geo);
  const p = geo.attributes.position, v = new THREE.Vector3(), ph = rng(seed)() * 6, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const sx = Math.sign(v.x) * Math.abs(v.x) ** 0.4, sz = Math.sign(v.z) * Math.abs(v.z) ** 0.4;
    const edge = Math.min(1, Math.max(Math.abs(sx), Math.abs(sz))), corner = (Math.abs(sx) * Math.abs(sz)) ** 2;
    const puff = (1 - 0.9 * edge ** 1.7) * (1 - chop * 0.45 * Math.exp(-((sx / 0.28) ** 2)) * smooth(0.4, 1, -sz));   // pellizco arriba al centro
    const wr = 0.09 * Math.sin(sx * 7 + sz * 5 + ph) * Math.sin(sz * 6 - sx * 3 + ph * 2) * edge * (1 - corner);
    const out = (1 + 0.07 * corner) * (edge > 0.93 && Math.abs(v.y) < 0.1 ? 1.012 : 1);
    p.setXYZ(i, sx * out * w / 2, v.y * (puff * h / 2 + wr * h), (sz + chop * 0.08 * Math.exp(-((sx / 0.3) ** 2)) * smooth(0.6, 1, -sz)) * out * d / 2);
    uv[2 * i] = sx * 0.5 + 0.5; uv[2 * i + 1] = sz * 0.5 + 0.5;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.computeVertexNormals(); geo.computeBoundingBox(); geo.computeBoundingSphere();
  return geo;
}

// Apoyo de un almohadón ("física" de contacto): se lo inclina, se lo baja hasta hundirse "sink" en cada apoyo (planos
// del grupo padre { n, d }: lo permitido es n·p ≥ d) y los vértices que quedan adentro vuelven al plano, apenas blandos.
// Así se aplasta contra el asiento, el respaldo o la cabecera en vez de flotar o atravesarlos.
export function restPillow(g, geo, mat, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, supports = [], sink = 0.03 }) {
  const m = add(g, geo, mat, x, y, z); m.rotation.set(rx, ry, rz);
  const p = geo.attributes.position, v = new THREE.Vector3(), planes = supports.map(s => ({ n: new THREE.Vector3(...s.n).normalize(), d: s.d }));
  for (const s of planes) {   // bajar o correr el almohadón hasta que toque cada apoyo
    m.updateMatrix(); let lo = Infinity;
    for (let i = 0; i < p.count; i++) lo = Math.min(lo, v.fromBufferAttribute(p, i).applyMatrix4(m.matrix).dot(s.n));
    m.position.addScaledVector(s.n, s.d - sink - lo);
  }
  m.updateMatrix(); const inv = m.matrix.clone().invert();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).applyMatrix4(m.matrix);
    for (const s of planes) { const k = v.dot(s.n) - s.d; if (k < 0) v.addScaledVector(s.n, -k * 0.92); }
    v.applyMatrix4(inv); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); geo.computeBoundingSphere(); geo.computeBoundingBox();   // las cajas viejas (de la esfera) quedarían mal
  return m;
}
// tela que cubre un rectángulo y cae por los lados abiertos, con un radio de doblez y pliegues suaves
// "height" (px, pz) → y reemplaza la superficie de arriba (una manta que sigue al acolchado de abajo); "waveDrop" fija la
// escala de los pliegues para que dos telas superpuestas ondulen igual y no se crucen
// "fine": malla más densa (×2,5) para que se lean las arrugas de "height"
export function drapeGeo({ x0, x1, z0, z1, top, drop, r, open, puff = 0, seed = 1, texM = 0.25, height = null, waveDrop = drop, fine = false }) {
  const arc = r * Math.PI / 2, ext = arc + Math.max(0, drop - r);
  const ex0 = open.xMin ? x0 - ext : x0, ex1 = open.xMax ? x1 + ext : x1;
  const ez0 = open.zMin ? z0 - ext : z0, ez1 = open.zMax ? z1 + ext : z1;
  const geo = new THREE.PlaneGeometry(1, 1, fine ? 160 : 64, fine ? 125 : 50);
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
      y = height ? height(px, pz) : top + puff * Math.sqrt(Math.max(0, bx * bz)) + 0.003 * Math.sin(px * 13 + pz * 7 + seed);
    } else {
      const k = Math.hypot(dx, dz), nx = dx / k, nz = dz / k;
      let out, down;
      if (d < arc) { const a = d / r; out = r * Math.sin(a); down = r * (1 - Math.cos(a)); }
      else { out = r; down = r + (d - arc); }
      const t = Math.min(1, down / Math.max(waveDrop, 1e-3));
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
// tela colgada con pliegues verticales (cortinas): de x = 0 a w, de y = 0 hacia abajo h
// "off" y "total": un tramo del paño que empieza "off" metros más abajo de un paño de "total" de alto (mismos pliegues)
function foldedClothGeo(w, h, period, amp, seed = 1, off = 0, total = h) {
  const geo = new THREE.PlaneGeometry(w, h, Math.max(12, Math.round(w / period * 12)), Math.max(2, Math.round(28 * h / total)));
  geo.translate(w / 2, -h / 2 - off, 0);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), t = -y / total;
    const a = amp * (0.75 + 0.35 * t) * (0.85 + 0.15 * Math.sin(x * 7 + seed));
    p.setZ(i, a * Math.sin((x / period) * Math.PI * 2 + 0.6 * t * Math.sin(seed + x * 3)));
    uv.setXY(i, x / 0.25, y / 0.25);
  }
  geo.translate(0, off, 0);
  geo.computeVertexNormals();
  return geo;
}
// caja doblada sobre un cilindro de radio R a lo largo de X, cóncava hacia +Z (respaldos de silla)
function bentBoxGeo(w, h, d, R) {
  const geo = new THREE.BoxGeometry(w, h, d, 24, 2, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const a = p.getX(i) / R, r = R - p.getZ(i);
    p.setXYZ(i, r * Math.sin(a), p.getY(i), R - r * Math.cos(a));
  }
  geo.computeVertexNormals();
  return geo;
}
// panel capitoné: botones en tresbolillo y la tela inflada entre ellos; bordes que bajan a cero
function tuftedGeo(w, h, depth, pitch) {
  const geo = new THREE.PlaneGeometry(w, h, Math.round(w / 0.015), Math.round(h / 0.015)), p = geo.attributes.position;
  const buttons = [], rowH = pitch * 0.5;
  for (let j = 0; (j + 1) * rowH < h; j++) for (let x = -w / 2 + pitch * (j % 2 ? 0.5 : 1); x < w / 2 - pitch * 0.3; x += pitch) buttons.push([x, -h / 2 + (j + 1) * rowH]);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    let d = Infinity;
    for (const [bx, by] of buttons) d = Math.min(d, Math.hypot(x - bx, (y - by) * 1.15));
    const edge = Math.min(x + w / 2, w / 2 - x, y + h / 2, h / 2 - y);
    p.setZ(i, depth * smooth(0.005, pitch * 0.55, d) * smooth(0, 0.045, edge));
  }
  geo.computeVertexNormals();
  uvScale(geo, w / 0.25, h / 0.25);
  return { geo, buttons };
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

/* ---------- dormitorio ---------- */
// cama con base, colchón, sábana, acolchado ("duvetStyle": "puffer"; "wrinkles": arrugas en metros, 0 = liso), manta ("throw"), respaldo opcional ("headboard") y almohadas/almohadones ("pillows"); la cabecera va en -Z.
// Con "headboard" el respaldo queda 10 cm detrás de la cabecera: contra una pared, la cama va a length / 2 + 0,1 de ella
function bed(p, { M }) {
  const g = new THREE.Group();
  const W = p.width ?? 1.6, L = p.length ?? 2.0, bh = p.baseHeight ?? 0.32, mh = p.mattressHeight ?? 0.23, top = bh + mh;
  // "duvetStyle": "puffer" = acolchado de nylon con cuadros cosidos; "duvetCover": 1 lo extiende hasta la cabecera (sin embozo)
  const sheet = M.fabric(p.sheetColor ?? '#f7f6f2'), duvet = p.duvetStyle === 'puffer' ? M.puffer(p.duvetColor ?? '#5b6470') : M.fabric(p.duvetColor ?? '#2c3850');
  blk(g, M.lacquer('#4a4c50'), [-W / 2 + 0.07, W / 2 - 0.07], [0, 0.06], [-L / 2 + 0.07, L / 2 - 0.07]);  // zócalo retirado
  blk(g, M.lacquer(p.frameColor ?? '#f3f1ec'), [-W / 2, W / 2], [0.06, bh], [-L / 2, L / 2], 0.02);       // base
  add(g, uvScale(new RoundedBoxGeometry(W - 0.02, mh, L - 0.02, 5, 0.07), 6), sheet, 0, bh + mh / 2, 0);  // colchón
  const cover = p.duvetCover ?? 0.62, full = cover >= 0.99;
  const z0 = full ? -L / 2 + 0.01 : L / 2 - L * cover, drop = Math.min(p.duvetDrop ?? 0.34, top - 0.08), puff = p.duvetPuff ?? 0.03;
  const dx0 = -W / 2 + 0.01, dx1 = W / 2 - 0.01, dz1 = L / 2 - 0.01, dTop = top + 0.03;
  // "wrinkles": arrugas del acolchado en metros (ver rumple); la manta las sigue. Se apagan en los bordes que doblan y
  // cerca de la cabecera (el embozo y las almohadas se apoyan ahí)
  const wr = p.wrinkles ?? BEDDING.wrinkles, wseed = (p.seed ?? 0) + Math.round(W * 10 + L * 3);
  const ramp = (d, w) => { const t = Math.min(1, Math.max(0, d / w)); return t * t * (3 - 2 * t); };
  const wrinkle = (px, pz) => wr ? rumple(px, pz, wseed, wr) * ramp(Math.min(px - dx0, dx1 - px, dz1 - pz), 0.12) * ramp(pz - z0 - (full ? 0 : 0.21), full ? 0.75 : 0.25) : 0;   // sin embozo: lejos de las almohadas; con embozo: recién pasando su borde (19 cm)
  const duvetY = (px, pz) => dTop + puff * Math.sqrt(Math.max(0, Math.sin(Math.PI * (px - dx0) / (dx1 - dx0)) * Math.sin(Math.PI * (pz - z0) / (dz1 - z0))))
    + 0.003 * Math.sin(px * 13 + pz * 7 + 3) + wrinkle(px, pz);
  add(g, drapeGeo({ x0: dx0, x1: dx1, z0, z1: dz1, top: dTop, drop, r: 0.07, height: duvetY, fine: !!wr,
    open: { xMin: true, xMax: true, zMax: true }, seed: 3, texM: p.duvetStyle === 'puffer' ? 0.5 : 0.25 }), duvet);
  // embozo: la sábana doblada sobre el borde del acolchado
  if (!full) add(g, drapeGeo({ x0: -W / 2 + 0.005, x1: W / 2 - 0.005, z0: z0 - 0.01, z1: z0 + 0.19, top: top + 0.045, drop: drop * 0.4, r: 0.075,
    open: { xMin: true, xMax: true }, puff: 0.004, seed: 7 }), sheet);
  // manta a los pies: sigue la superficie del acolchado 1,5 cm por encima y cae por los lados con los mismos pliegues
  if (p.throw) {
    const gap = 0.015, tz0 = dz1 - L * (p.throw.cover ?? 0.3);
    add(g, drapeGeo({ x0: dx0, x1: dx1, z0: tz0, z1: dz1, top: dTop + gap, drop: Math.min(p.throw.drop ?? 0.3, drop), r: 0.07 + gap,
      height: (px, pz) => duvetY(px, pz) + gap, waveDrop: drop, fine: !!wr, open: { xMin: true, xMax: true, zMax: true }, seed: 3, texM: p.throw.pattern ? 0.9 : 0.25 }),
      p.throw.pattern ? M.print(p.throw.pattern) : M.cloth(p.throw.color ?? '#2e2f33'));
  }
  const hb = p.headboard;
  if (hb) {   // respaldo contra la pared, detrás de la cabecera (-Z)
    // "material": "wood" = respaldo de madera (camas de dormitorio clásicas); si no, tapizado
    const hw = W / 2 + 0.06, hh = hb.height ?? 1.2, mat = hb.material === 'wood' ? M.wood(hb.color ?? '#4a2d1e') : M.fabric(hb.color ?? '#262b3a');
    if (hb.style !== 'panels') {   // respaldo de 6 cm, atornillado a la base con dos herrajes bajos (quedan ocultos)
      blk(g, mat, [-hw, hw], [0, hh], [-L / 2 - 0.1, -L / 2 - 0.04], 0.02, 0.25);
      for (const sx of [-1, 1]) blk(g, M.lacquer('#4a4c50'), [sx * (W / 2 - 0.12) - 0.04, sx * (W / 2 - 0.12) + 0.04], [0.12, 0.22], [-L / 2 - 0.041, -L / 2 + 0.001]);
    }
    if (hb.style === 'panels') {   // un panel acolchado de esquinas redondeadas por plaza, apoyado en la base
      const n = hb.panels ?? (W > 1.2 ? 2 : 1), pw = (2 * hw - 0.02 * (n - 1)) / n;
      for (let i = 0; i < n; i++) add(g, uvScale(new RoundedBoxGeometry(pw, hh - 0.3, 0.09, 4, 0.06), 3), mat, -hw + pw / 2 + i * (pw + 0.02), 0.3 + (hh - 0.3) / 2, -L / 2 - 0.035);
    } else if ((hb.style ?? 'tufted') === 'tufted') {
      const { geo, buttons } = tuftedGeo(hw * 2 - 0.03, hh - 0.32, 0.05, 0.19);
      add(g, geo, mat, 0, 0.3 + (hh - 0.32) / 2, -L / 2 - 0.038);
      const bgeo = new THREE.SphereGeometry(0.011, 10, 8), bmat = M.fabric(shade(hb.color ?? '#262b3a', -0.06));
      for (const [bx, by] of buttons) add(g, bgeo, bmat, bx, 0.3 + (hh - 0.32) / 2 + by, -L / 2 - 0.036).castShadow = false;
    }
  }
  const rows = [[], [], []];
  (p.pillows ?? []).forEach(q => rows[q.row ?? 0].push(q));
  const head = -L / 2 + (hb ? 0.02 : 0.004), bedTop = cover >= 0.99 ? dTop + 0.005 : top + 0.004;
  rows.forEach((row, ri) => row.forEach((q, i) => {
    const cushion = q.size === 'cushion', n = row.length, r = rng(17 + ri * 7 + i * 3);
    const lumbar = ri === 2, w = q.width ?? (lumbar ? 0.5 : cushion ? 0.48 : Math.min(0.7, W / n - 0.06)), h = lumbar ? 0.15 : cushion ? 0.21 : 0.17, d = q.depth ?? (lumbar ? 0.3 : cushion ? w : 0.48);
    const mat = q.colors ? M.crochet(q.colors, q.shape === 'round' ? 'rings' : 'granny') : q.pattern ? M.print(q.pattern, 5) : q.texture === 'knit' ? M.knit(q.color) : M.fabric(q.color);
    // "shape": "round" = almohadón redondo (de "width" de diámetro)
    const geo = q.shape === 'round' ? roundPillowGeo(w, 0.13, 31 + i) : uvScale(pillowGeo(w, h, d, 31 + ri * 11 + i, ri === 1 ? 1 : 0), q.texture === 'knit' ? 2 : 4), x = (-W / 2 + (i + 0.5) * W / n) * (ri ? 0.85 : 1);
    // fila 0: almohadas acostadas, apenas levantadas contra la cabecera; fila 1: almohadones casi parados, apoyados
    // en las almohadas o, si no hay, en la pared o el respaldo
    const back = head + (ri && rows[0].length ? 0.13 : 0) + (ri === 2 ? 0.2 : 0);
    restPillow(g, geo, mat, { x, rx: ri === 1 ? 1.2 + 0.12 * r() : ri ? 1.0 + 0.15 * r() : 0.28, ry: (r() - 0.5) * 0.16, rz: ri ? (i % 2 ? 1 : -1) * (0.04 + 0.06 * r()) : 0,
      supports: [{ n: [0, 1, 0], d: bedTop + (ri === 1 && rows[0].length ? 0.07 : 0) }, { n: [0, 0, 1], d: back }], sink: 0.025 });
  }));
  return g;
}

// toallas dobladas apiladas ("count"), para apoyar sobre la cama o un mueble
function foldedTowels(p, { M }) {
  const g = new THREE.Group(), r = rng(5), mat = M.fabric(p.color ?? '#e8dcc6');
  for (let i = 0; i < (p.count ?? 2); i++) {
    const m = blk(g, mat, [-0.17, 0.17], [i * 0.045, i * 0.045 + 0.045], [-0.13, 0.13], 0.02, 0.2);
    m.rotation.y = (r() - 0.5) * 0.12; m.position.x += (r() - 0.5) * 0.02;
  }
  return g;
}

// mesa de luz con cajón y patas (madera o "material": "lacquer")
function nightstand(p, { M }) {
  const g = new THREE.Group();
  const w = p.width ?? 0.4, d = p.depth ?? 0.38, h = p.height ?? 0.6, t = 0.018, lg = 0.09, dh = 0.17;
  const c = p.color ?? '#c49862', wood = p.material === 'lacquer' ? M.lacquer(c) : M.wood(c), dark = p.material === 'lacquer' ? M.lacquer(shade(c, -0.12)) : M.wood(shade(c, -0.25));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, dark, sx * (w / 2 - 0.03), 0, lg, sz * (d / 2 - 0.03), 0.011, 12, 0.016);
  blk(g, wood, [-w / 2, w / 2], [h - t, h], [-d / 2, d / 2], 0.004);                 // tapa
  blk(g, wood, [-w / 2, w / 2], [lg, lg + t], [-d / 2, d / 2], 0.003);               // piso
  blk(g, wood, [-w / 2, -w / 2 + t], [lg + t, h - t], [-d / 2, d / 2], 0.003);       // laterales
  blk(g, wood, [w / 2 - t, w / 2], [lg + t, h - t], [-d / 2, d / 2], 0.003);
  blk(g, dark, [-w / 2 + t, w / 2 - t], [lg + t, h - t], [-d / 2, -d / 2 + 0.008]);   // fondo
  blk(g, wood, [-w / 2 + t, w / 2 - t], [h - t - dh, h - t - dh + t], [-d / 2, d / 2 - 0.01]); // estante
  blk(g, wood, [-w / 2 + t + 0.003, w / 2 - t - 0.003], [h - t - dh + t, h - t - 0.004], [-d / 2 + 0.02, d / 2 - 0.002], 0.003); // cajón, apoyado en el estante
  add(g, new THREE.SphereGeometry(0.012, 16, 12), M.metal('#b08d57', 0.35), 0, h - t - dh / 2 + t / 2, d / 2 + 0.008);
  return g;
}

// velador de cerámica con pantalla de tela; de noche se prende
function tableLamp(p, { M }) {
  const g = new THREE.Group();
  add(g, new THREE.LatheGeometry(v2([[0.001, 0], [0.06, 0], [0.07, 0.03], [0.075, 0.12], [0.05, 0.2], [0.012, 0.24], [0.012, 0.3], [0.001, 0.3]]), 48), M.ceramic(p.base ?? '#e9e4dc'));
  add(g, new THREE.LatheGeometry(v2([[0.115, 0.27], [0.08, 0.45]]), 48), M.shadeGlow(p.shade ?? '#efe6d6')).castShadow = false;
  add(g, new THREE.SphereGeometry(0.025, 16, 12), M.glow(), 0, 0.36, 0).castShadow = false;
  lampPoint(g, 0, 0.36, 0, p.intensity ?? 3, 3.5);
  return g;
}

// placard de piso a techo con puertas corredizas ("style": "sliding") o de abrir, en laca o madera; el fondo en -Z
function wardrobe(p, { M }) {
  const g = new THREE.Group();
  const w = p.width ?? 1.9, h = p.height ?? 2.45, d = p.depth ?? 0.6;
  const body = p.material === 'wood' ? M.wood(p.color ?? '#cfae86') : M.lacquer(p.color ?? '#f3f1ec'), rail = M.metal('#c8ccd1', 0.3), dark = M.lacquer('#55585c');
  blk(g, dark, [-w / 2 + 0.01, w / 2 - 0.01], [0, 0.07], [-d / 2, d / 2 - 0.06]);           // zócalo
  blk(g, body, [-w / 2, w / 2], [0.07, h], [-d / 2, d / 2 - 0.05], 0.004);                  // cuerpo
  if ((p.style ?? 'sliding') === 'sliding') {
    blk(g, body, [-w / 2 + 0.01, 0.02], [0.08, h - 0.05], [d / 2 - 0.047, d / 2 - 0.027], 0.006); // hoja de atrás
    blk(g, body, [-0.02, w / 2 - 0.01], [0.08, h - 0.05], [d / 2 - 0.024, d / 2 - 0.004], 0.006); // hoja de adelante
    blk(g, rail, [0.006, 0.022], [0.082, h - 0.052], [d / 2 - 0.049, d / 2 - 0.025], 0.002);     // perfiles tirador
    blk(g, rail, [-0.022, -0.006], [0.082, h - 0.052], [d / 2 - 0.026, d / 2 + 0.001], 0.002);
    blk(g, rail, [-w / 2 + 0.002, w / 2 - 0.002], [h - 0.05, h - 0.002], [d / 2 - 0.06, d / 2 + 0.002], 0.003); // riel superior
    blk(g, rail, [-w / 2 + 0.002, w / 2 - 0.002], [0.072, 0.08], [d / 2 - 0.06, d / 2 + 0.002], 0.003);        // riel inferior
  } else {
    const n = p.doors ?? 2, gap = 0.004, dw = (w - gap * (n + 1)) / n, hy = Math.min(0.85, h * 0.45);
    for (let i = 0; i < n; i++) {
      const x0 = -w / 2 + gap + i * (dw + gap);
      blk(g, body, [x0, x0 + dw], [0.08, h - 0.01], [d / 2 - 0.05, d / 2 - 0.03], 0.004);
      pull(g, rail, 'y', hy, hy + Math.min(0.4, h * 0.3), i % 2 ? x0 + 0.05 : x0 + dw - 0.05, d / 2 - 0.03, 0.025, 0.007);
    }
  }
  g.userData.h = h;
  return g;
}

// alfombra rayada con flecos ("colors": lista de colores de las rayas)
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

// ventilador de techo con luz (cuelga del cielorraso): florón, barral, motor, aspas de madera inclinadas y, abajo, el
// kit de luz: "light": "globe" (globo opalino, por defecto), "dish" (plato chato) o "tulips" (tres tulipas). Brilla de noche
function ceilingFan(p, { M, H }) {
  const g = new THREE.Group(), R = (p.diameter ?? 1.07) / 2, n = p.blades ?? 4, drop = p.drop ?? 0.3, body = M.metal(p.color ?? '#3a3532', 0.45);
  const wood = M.wood(p.bladeColor ?? '#5a3a26'), y1 = H - drop, y0 = y1 - 0.12;
  cyl(g, body, 0, H - 0.07, H, 0, 0.07, 32);                                   // florón
  cyl(g, body, 0, y1, H - 0.07, 0, 0.012, 12);                                 // barral
  add(g, new THREE.LatheGeometry(v2([[0.001, y0], [0.07, y0], [0.105, y0 + 0.03], [0.11, y0 + 0.08], [0.06, y1], [0.001, y1]]), 40), body);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, arm = new THREE.Group(); arm.rotation.y = a; arm.position.y = y0 + 0.045; g.add(arm);
    blk(arm, body, [0.08, 0.2], [-0.008, 0.008], [-0.018, 0.018], 0.004);         // brazo
    const bl = new THREE.Group(); bl.rotation.x = 0.21; arm.add(bl);              // aspa con paso de ~12°
    blk(bl, wood, [0.17, R], [-0.006, 0.006], [-0.065, 0.065], 0.01, 0.6);
  }
  const ly = y0 - 0.02, kind = p.light ?? 'globe';
  cyl(g, body, 0, ly, y0, 0, 0.05, 24);
  if (kind === 'tulips') for (let i = 0; i < 3; i++) {
    const a = i * 2 * Math.PI / 3, x = Math.cos(a) * 0.09, z = Math.sin(a) * 0.09;
    add(g, new THREE.LatheGeometry(v2([[0.012, 0], [0.05, -0.03], [0.065, -0.1], [0.06, -0.12]]), 24), M.shadeGlow(p.glass ?? '#f6efe0'), x, ly, z).castShadow = false;
  } else if (kind === 'dish') add(g, new THREE.LatheGeometry(v2([[0.001, -0.04], [0.09, -0.035], [0.12, -0.01], [0.12, 0]]), 40), M.shadeGlow(p.glass ?? '#f4f2ec'), 0, ly, 0).castShadow = false;
  else { const s = add(g, new THREE.SphereGeometry(0.085, 32, 20), M.shadeGlow(p.glass ?? '#f4f2ec'), 0, ly - 0.075, 0); s.castShadow = false; }
  lampSpot(g, 0, ly - 0.18, 0, p.intensity ?? 16, 1.3, 7);
  return g;
}

// parrilla de ladrillo contra la pared (fondo en z = 0): dos pilares, fogón de hormigón con la reja, dintel y campana que
// se angosta hacia el conducto de chapa, que sale por el techo ("flue": cuánto sube por encima de la campana)
function grill(p, { M }) {
  const g = new THREE.Group(), W = p.width ?? 1.3, D = p.depth ?? 0.6, h = p.height ?? 1.45, top = p.hood ?? 2.3, pw = 0.14;
  const brick = grillBrick(p.color), conc = M.concrete(p.hearth ?? '#8f8a84'), iron = M.metal('#2b2b2b', 0.6), dark = M.lacquer('#1c1a19');
  for (const s of [-1, 1]) blk(g, brick, s < 0 ? [-W / 2, -W / 2 + pw] : [W / 2 - pw, W / 2], [0, h], [0, D], 0, 1);
  blk(g, brick, [-W / 2 + pw, W / 2 - pw], [0, 0.8], [0, 0.12], 0, 1);           // fondo bajo
  blk(g, conc, [-W / 2 + pw - 0.002, W / 2 - pw + 0.002], [0.8, 0.88], [0, D - 0.02]);       // fogón
  blk(g, dark, [-W / 2 + pw, W / 2 - pw], [0.88, h], [0, 0.02]);                    // fondo tiznado
  for (let x = -W / 2 + pw + 0.04; x < W / 2 - pw - 0.02; x += 0.035) blk(g, iron, [x - 0.004, x + 0.004], [1.02, 1.03], [0.06, D - 0.06]);
  blk(g, iron, [-W / 2 + pw, W / 2 - pw], [1.0, 1.02], [0.05, 0.07]); blk(g, iron, [-W / 2 + pw, W / 2 - pw], [1.0, 1.02], [D - 0.07, D - 0.05]);
  blk(g, brick, [-W / 2, W / 2], [h, h + 0.18], [0, D], 0, 1);                      // dintel
  // campana: tres tramos que se angostan en ancho y en fondo hasta el conducto
  const steps = 3, cw = 0.32, cd = 0.3;
  for (let i = 0; i < steps; i++) {
    const k = (i + 1) / (steps + 1), y0 = h + 0.18 + i * (top - h - 0.18) / steps, y1 = h + 0.18 + (i + 1) * (top - h - 0.18) / steps;
    const w = W - (W - cw) * k, d = D - (D - cd) * k;
    blk(g, brick, [-w / 2, w / 2], [y0 - 0.001, y1], [0, d], 0, 1);
  }
  cyl(g, M.metal('#a7a9aa', 0.5), 0, top, top + (p.flue ?? 1.0), cd / 2, 0.09, 24);   // conducto de chapa
  cyl(g, M.metal('#a7a9aa', 0.5), 0, top + (p.flue ?? 1.0), top + (p.flue ?? 1.0) + 0.04, cd / 2, 0.16, 24, 0.1);  // sombrerete
  return g;
}
let grillBrickMat = {};
const grillBrick = c => grillBrickMat[c ?? 'x'] ??= new THREE.MeshStandardMaterial({ color: c ?? '#ffffff', map: brickTex(), roughness: 0.92 });

// plafón de spots: en fila sobre una regleta, o 4 en cuadrado ("layout": "square") con una sola luz al centro
function ceilingLight(p, { M, H }) {
  const g = new THREE.Group(), b = p.bulbs ?? 2, black = M.lacquer(p.color ?? '#1f2123');
  if (p.layout === 'square') {
    blk(g, black, [-0.13, 0.13], [H - 0.04, H], [-0.13, 0.13], 0.008);
    for (const [x, z] of [[-0.07, -0.07], [0.07, -0.07], [-0.07, 0.07], [0.07, 0.07]]) {
      cyl(g, black, x, H - 0.2, H - 0.04, z, 0.035, 32);
      cyl(g, M.glow(), x, H - 0.206, H - 0.199, z, 0.028, 32).castShadow = false;
    }
    lampSpot(g, 0, H - 0.22, 0, p.intensity ?? 30, 1.15, 7);
    return g;
  }
  if (p.style === 'dome') {   // plafón: casquete de vidrio opalino ("glass" su color) sobre una base fina; brilla de noche
    const R = (p.diameter ?? 0.32) / 2, dh = R * 0.42, base = H - 0.018, pts = [];
    cyl(g, M.lacquer(p.color ?? '#f2f1ee'), 0, base, H, 0, R * 0.97, 40);
    for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; pts.push([Math.max(0.001, R * Math.cos(a)), base + 0.002 - dh * Math.sin(a)]); }
    add(g, new THREE.LatheGeometry(v2(pts), 48), M.shadeGlow(p.glass ?? '#f4f2ec')).castShadow = false;
    lampSpot(g, 0, base - dh - 0.02, 0, p.intensity ?? 16, 1.3, 7);
    return g;
  }
  if (p.style === 'box') {   // caja de superficie con los spots embutidos (aro negro y vidrio que brilla)
    const bw = 0.2 * b + 0.04, bh = 0.11;
    blk(g, black, [-bw / 2, bw / 2], [H - bh, H], [-0.11, 0.11], 0.006);
    for (let i = 0; i < b; i++) {
      const x = (i - (b - 1) / 2) * 0.2;
      cyl(g, M.lacquer('#3a3c3f'), x, H - bh - 0.004, H - bh + 0.01, 0, 0.062, 32).castShadow = false;
      cyl(g, M.glow(), x, H - bh - 0.006, H - bh - 0.002, 0, 0.042, 32).castShadow = false;
      lampSpot(g, x, H - bh - 0.03, 0, p.intensity ?? 13, 1.0, 6);
    }
    return g;
  }
  blk(g, black, [-0.21, 0.21], [H - 0.05, H], [-0.1, 0.1], 0.008);
  for (let i = 0; i < b; i++) {
    const x = (i - (b - 1) / 2) * 0.2;
    cyl(g, black, x, H - 0.17, H - 0.05, 0, 0.045, 32);
    cyl(g, M.glow(), x, H - 0.176, H - 0.169, 0, 0.038, 32).castShadow = false;
    lampSpot(g, x, H - 0.18, 0, p.intensity ?? 13, 1.0, 6);
  }
  return g;
}

// spot embutido en el cielorraso
function downlight(p, { M, H }) {
  const g = new THREE.Group();
  cyl(g, M.lacquer('#f4f4f2'), 0, H - 0.006, H, 0, 0.05, 32).castShadow = false;
  cyl(g, M.glow(), 0, H - 0.008, H - 0.006, 0, 0.036, 32).castShadow = false;
  // "day": encendido también de día (ambientes sin ventana, como un baño interno)
  const l = lampSpot(g, 0, H - 0.02, 0, p.intensity ?? 12, 1.15, 6);
  if (p.day) l.userData.day = p.dayIntensity ?? 6;
  return g;
}

// planta en maceta de cerámica; "style": "tree" (arbolito de interior: tronco y copa de hojas) o "succulent" (suculenta
// chica en maceta baja, para mesas y estantes)
function plant(p, { M }) {
  const g = new THREE.Group(), r = rng(p.seed ?? 11), hgt = p.height ?? (p.style === 'tree' ? 1.6 : p.style === 'succulent' ? 0.16 : 0.9);
  if (p.style === 'succulent') {
    add(g, new THREE.LatheGeometry(v2([[0.001, 0], [0.06, 0], [0.07, 0.07], [0.064, 0.07], [0.058, 0.06], [0.001, 0.06]]), 32), M.ceramic(p.pot ?? '#cfc6ba'));
    for (let i = 0; i < 14; i++) {   // roseta de hojas gruesas desde el centro
      const m = add(g, new THREE.SphereGeometry(1, 10, 6), M.leaf(), 0, 0.06, 0); const a = i * 2.4, k = 0.4 + 0.6 * (i / 14);
      m.scale.set(0.012, 0.012, 0.035 * k + 0.01); m.rotation.order = 'YXZ'; m.rotation.set(-0.5 - 0.6 * (1 - k), a, 0); m.position.add(new THREE.Vector3(Math.sin(a) * 0.02 * k, 0.01, Math.cos(a) * 0.02 * k));
    }
    return g;
  }
  // "pot": false = plantada en la tierra (jardines, patios): sin maceta, sale del piso
  const inPot = p.pot !== false;
  if (p.style === 'tree') {
    if (inPot) { add(g, new THREE.LatheGeometry(v2([[0.001, 0], [0.15, 0], [0.17, 0.36], [0.18, 0.37], [0.165, 0.37], [0.157, 0.33]]), 48), M.ceramic(p.pot ?? '#d9d4cc')); cyl(g, M.lacquer('#3b2e24'), 0, 0.31, 0.332, 0, 0.157, 32); }
    const trunk = M.wood('#7a5a3e'), top = hgt * 0.62;
    cyl(g, trunk, 0, inPot ? 0.31 : 0, top, 0, inPot ? 0.022 : 0.04, 10, inPot ? 0.014 : 0.025);
    for (let i = 0; i < 40; i++) {   // hojas que salen del tronco en la mitad de arriba
      const y = top - 0.05 + r() * (hgt - top - 0.1), m = add(g, leafGeo(0.18 + r() * 0.12, 0.05 + 0.025 * r(), 0.25 + 0.25 * r()), M.leaf(), 0, Math.min(y, top), 0);
      m.rotation.order = 'YXZ'; m.rotation.set(0.5 + 0.7 * r(), r() * Math.PI * 2, 0);
      if (y > top) m.position.y = top - 0.01, m.rotation.x = 0.2 + 0.5 * r();
    }
    g.userData.h = hgt;
    return g;
  }
  if (inPot) { add(g, new THREE.LatheGeometry(v2([[0.001, 0], [0.11, 0], [0.125, 0.015], [0.15, 0.3], [0.16, 0.31], [0.146, 0.31], [0.138, 0.27]]), 48), M.ceramic(p.pot ?? '#d9d4cc')); cyl(g, M.lacquer('#3b2e24'), 0, 0.25, 0.272, 0, 0.138, 32); }
  // "leaves": cantidad de hojas (16); "spread": cuánto se abre la mata desde el centro (matas de jardín)
  const nl = p.leaves ?? 16, y0 = inPot ? 0.26 : -0.004, sp = p.spread ?? 0.08;   // en la tierra, las hojas nacen 4 mm adentro del piso
  for (let i = 0; i < nl; i++) {
    const len = hgt * (0.45 + 0.5 * r()) - (inPot ? 0.27 : 0);
    const m = add(g, leafGeo(len, 0.05 + 0.03 * r(), 0.25 + 0.3 * r()), M.leaf(), (r() - 0.5) * sp, y0, (r() - 0.5) * sp);
    m.rotation.order = 'YXZ'; m.rotation.set(0.1 + 0.45 * r() + (inPot ? 0 : 0.25), (i / nl) * Math.PI * 2 + r() * 0.4, 0);
  }
  return g;
}

// cuadro: con marco negro y paspartú, o sin marco (lienzo montado en bastidor)
function wallArt(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.7, h = p.height ?? 0.5, style = p.style ?? 'abstract';
  const art = M.art(p.palette ?? ['#c9553a', '#2c3850', '#d8b98a', '#efe9df'], 4, style);
  // "texture": la imagen del cuadro recortada de la foto (el motor la carga, T-25); si no, un dibujo generado
  const pic = (geo, z) => { const m = add(g, geo, art, 0, h / 2, z); m.castShadow = false; if (p.texture) m.userData.imageTex = p.texture; return m; };
  if (p.frame === false) {
    blk(g, M.paint('#e9e9e7'), [-w / 2, w / 2], [0, h], [0, 0.03], 0.003);
    pic(new THREE.PlaneGeometry(w - 0.004, h - 0.004), 0.0305);
  } else {
    const fr = 0.025, mat = 0.05, black = p.frameColor ? M.wood(p.frameColor) : M.lacquer('#26282b');
    blk(g, black, [-w / 2, -w / 2 + fr], [0, h], [0, 0.03], 0.003);
    blk(g, black, [w / 2 - fr, w / 2], [0, h], [0, 0.03], 0.003);
    blk(g, black, [-w / 2 + fr, w / 2 - fr], [0, fr], [0, 0.03], 0.003);
    blk(g, black, [-w / 2 + fr, w / 2 - fr], [h - fr, h], [0, 0.03], 0.003);
    blk(g, M.paint('#f6f4ef'), [-w / 2 + fr, w / 2 - fr], [fr, h - fr], [0.005, 0.012]);
    pic(new THREE.PlaneGeometry(w - 2 * (fr + mat), h - 2 * (fr + mat)), 0.0125);
  }
  g.userData.h = h;
  return g;
}

/* ---------- living y comedor ---------- */
// sillón recto de tela con brazos, almohadones de asiento por plaza ("seats") y almohadones sueltos ("cushions"); el respaldo en -Z.
// "style": "futon" = futón: estructura de madera a la vista ("wood") y un colchón doblado en asiento y respaldo;
// "daybed" = diván de madera con cajón (ver daybed)
function sofa(p, { M }) {
  if (p.style === 'futon') return futon(p, { M });
  if (p.style === 'daybed') return daybed(p, { M });
  if (p.style === 'slipcover') return slipcoverSofa(p, { M });
  const g = new THREE.Group(), cush = p.cushions ?? [], L = p.length ?? 2.0, D = p.depth ?? 0.95, n = p.seats ?? 2, fab = M.fabric(p.color ?? '#6e6c69');
  const arm = 0.18, sh = 0.44, h = p.height ?? 0.92, cw = (L - 2 * arm) / n;
  blk(g, M.lacquer('#2a2a2a'), [-L / 2 + 0.06, L / 2 - 0.06], [0, 0.07], [-D / 2 + 0.06, D / 2 - 0.1]);             // zócalo
  blk(g, fab, [-L / 2 + arm, L / 2 - arm], [0.07, sh - 0.13], [-D / 2 + 0.15, D / 2 - 0.03], 0.03, 0.25);            // base del asiento
  blk(g, fab, [-L / 2 + arm, L / 2 - arm], [0.07, 0.62], [-D / 2, -D / 2 + 0.15], 0.05, 0.25);                       // estructura del respaldo
  for (const s of [-1, 1]) blk(g, fab, s < 0 ? [-L / 2, -L / 2 + arm] : [L / 2 - arm, L / 2], [0.05, 0.62], [-D / 2, D / 2], 0.07, 0.25); // brazos
  const backT = 0.2, sd = D - 0.15 - backT - 0.03, sz = -D / 2 + 0.15 + backT + sd / 2;
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + arm + (i + 0.5) * cw;
    add(g, uvScale(new RoundedBoxGeometry(cw - 0.012, 0.15, sd, 4, 0.06), 4), fab, x, sh - 0.065, sz);             // almohadón de asiento
    const bh = h - sh - 0.12;
    const b = add(g, uvScale(new RoundedBoxGeometry(cw - 0.02, bh, backT, 4, 0.08), 4), fab, x, sh + bh / 2 + 0.01, -D / 2 + 0.15 + backT / 2);
    b.rotation.x = -0.12;
    if (p.headrests && !cush.length) {
      const hr = add(g, uvScale(pillowGeo(cw - 0.08, 0.13, 0.24), 3), fab, x, h - 0.04, -D / 2 + 0.2);
      hr.rotation.x = Math.PI / 2 - 0.25;
    }
  }
  cush.forEach((c, i, all) => {   // almohadones apoyados en el asiento y contra el respaldo
    const span = L - 2 * arm - 0.45, x = all.length > 1 ? -span / 2 + (i * span) / (all.length - 1) : 0, r = rng(41 + i);
    const big = i % 2 === 0, sz = big ? 0.52 : 0.44;
    restPillow(g, uvScale(pillowGeo(sz, big ? 0.22 : 0.19, sz, 50 + i, 1), 4), c.pattern ? M.print(c.pattern, 7) : M.fabric(c.color ?? c),
      { x: x + (big ? -1 : 1) * 0.04 * Math.sign(x || 1), rx: 1.0 + 0.14 * r(), ry: (r() - 0.5) * 0.3, rz: (i % 2 ? 1 : -1) * (0.05 + 0.08 * r()),
        supports: [{ n: [0, 1, 0], d: sh + 0.012 }, { n: [0, 0, 1], d: -D / 2 + 0.15 + backT + 0.01 + (big ? 0 : 0.09) }], sink: 0.035 });
  });
  return g;
}
// sillón de funda ("style": "slipcover"): todo enfundado en lino hasta el piso, brazos bajos y redondeados, un solo
// almohadón de asiento y almohadones grandes sueltos contra el respaldo (sin almohadones de respaldo fijos)
function slipcoverSofa(p, { M }) {
  const g = new THREE.Group(), L = p.length ?? 1.8, D = p.depth ?? 0.9, h = p.height ?? 0.8, fab = M.fabric(p.color ?? '#ece7dd');
  const arm = 0.19, armH = 0.6, sh = 0.46, bd = 0.2, cush = p.cushions ?? [];
  blk(g, fab, [-L / 2 + arm - 0.03, L / 2 - arm + 0.03], [0, sh - 0.13], [-D / 2 + bd - 0.03, D / 2 - 0.015], 0.04, 0.25);   // base con faldón
  blk(g, fab, [-L / 2 + arm - 0.03, L / 2 - arm + 0.03], [0, h], [-D / 2, -D / 2 + bd], 0.08, 0.25);                          // respaldo
  for (const s of [-1, 1]) blk(g, fab, s < 0 ? [-L / 2, -L / 2 + arm] : [L / 2 - arm, L / 2], [0, armH], [-D / 2, D / 2], 0.09, 0.25);   // brazos
  const sw = L - 2 * arm - 0.01, sd = D - bd - 0.03;
  add(g, uvScale(new RoundedBoxGeometry(sw, 0.16, sd, 4, 0.07), 4), fab, 0, sh - 0.075, -D / 2 + bd + sd / 2);               // almohadón de asiento
  cush.forEach((c, i, all) => {
    const span = L - 2 * arm - 0.5, x = all.length > 1 ? -span / 2 + (i * span) / (all.length - 1) : 0, r = rng(61 + i), sz = 0.55;
    restPillow(g, uvScale(pillowGeo(sz, 0.22, sz, 70 + i, 1), 4), c.pattern ? M.print(c.pattern, 7) : M.fabric(c.color ?? c),
      { x, rx: 1.05 + 0.12 * r(), ry: (r() - 0.5) * 0.25, rz: (i % 2 ? 1 : -1) * (0.04 + 0.06 * r()),
        supports: [{ n: [0, 1, 0], d: sh + 0.005 }, { n: [0, 0, 1], d: -D / 2 + bd + 0.01 }], sink: 0.04 });
  });
  return g;
}
// futón: tarima de madera con laterales y travesaños, colchón de asiento y colchón de respaldo apoyado en el bastidor
// (se abre como cama: acá va armado como sillón). Las piezas de madera se tocan sin compartir caras
function futon(p, { M }) {
  const g = new THREE.Group(), cush = p.cushions ?? [], L = p.length ?? 1.9, D = p.depth ?? 0.9, fab = M.fabric(p.color ?? '#2c3440');
  const wood = M.wood(p.wood ?? '#c9925a'), side = 0.045, base = 0.28, mt = 0.15, sh = base + mt, top = p.height ?? 0.86;
  for (const s of [-1, 1]) {   // laterales: un tablero bajo a cada lado que hace de apoyabrazos
    const x = s < 0 ? [-L / 2, -L / 2 + side] : [L / 2 - side, L / 2];
    blk(g, wood, x, [0, sh + 0.08], [-D / 2 + 0.06, D / 2], 0.01);
    blk(g, wood, x, [0, top - 0.02], [-D / 2, -D / 2 + 0.06], 0.008);   // parante de atrás, más alto
  }
  const inner = [-L / 2 + side, L / 2 - side];
  blk(g, wood, inner, [0.12, base], [D / 2 - 0.035, D / 2], 0.006);          // travesaño de adelante
  blk(g, wood, inner, [0.12, base], [-D / 2 + 0.02, -D / 2 + 0.055], 0.006); // travesaño de atrás
  blk(g, wood, inner, [top - 0.08, top - 0.02], [-D / 2 + 0.005, -D / 2 + 0.04], 0.006);   // travesaño del respaldo
  // tarima de listones entre los travesaños (el colchón de asiento apoya ahí) y bastidor de listones del respaldo,
  // entre el travesaño de atrás y el de arriba (el colchón del respaldo se recuesta ahí)
  const slat = (L - 2 * side) / 7;
  for (let i = 0; i < 7; i++) {
    const x0 = -L / 2 + side + i * slat + 0.012, x1 = x0 + slat - 0.024;
    blk(g, wood, [x0, x1], [base - 0.025, base], [-D / 2 + 0.055, D / 2 - 0.035], 0.004);
    blk(g, wood, [x0, x1], [base, top - 0.08], [-D / 2 + 0.012, -D / 2 + 0.034], 0.004);
  }
  const seatD = D - 0.2;
  add(g, uvScale(new RoundedBoxGeometry(L - 2 * side - 0.01, mt, seatD, 4, 0.05), 4), fab, 0, base + mt / 2, D / 2 - 0.035 - seatD / 2);
  const bh = top - sh - 0.02, back = add(g, uvScale(new RoundedBoxGeometry(L - 2 * side - 0.01, bh, mt, 4, 0.05), 4), fab, 0, sh + bh / 2, -D / 2 + 0.05 + mt / 2);
  back.rotation.x = -0.14;
  cush.forEach((c, i, all) => {   // almohadones apoyados en el asiento y contra el respaldo
    const span = L - 0.7, x = all.length > 1 ? -span / 2 + (i * span) / (all.length - 1) : 0, r = rng(43 + i), sz = 0.46;
    restPillow(g, uvScale(pillowGeo(sz, 0.2, sz, 60 + i, 1), 4), c.pattern ? M.print(c.pattern, 7) : M.fabric(c.color ?? c),
      { x, rx: 1.0 + 0.14 * r(), ry: (r() - 0.5) * 0.3, rz: (i % 2 ? 1 : -1) * (0.05 + 0.08 * r()),
        supports: [{ n: [0, 1, 0], d: sh + 0.012 }, { n: [0, 0, 1], d: -D / 2 + 0.05 + mt + 0.04 }], sink: 0.035 });
  });
  return g;
}

// sofá curvo de bouclé: respaldo y brazos continuos hechos de gajos verticales (cápsulas que se solapan),
// base con gajos al frente y almohadón de asiento. Las piezas se cruzan en superficies curvas: no hay caras coplanares.
function bubbleSofa(p, { M }) {
  const g = new THREE.Group(), L = p.length ?? 1.75, D = p.depth ?? 0.92, fab = M.fabric(p.color ?? '#efebe3');
  const r = 0.11, a = L / 2 - r, zb = -D / 2 + r, zf = D / 2 - r - 0.04, rc = 0.3;
  // los gajos y el núcleo apoyan en el piso (antes arrancaban 4 cm arriba y el sillón flotaba)
  const sh = p.seatHeight ?? 0.42, hb = p.height ?? 0.8, ha = p.armHeight ?? 0.62, y0 = 0;
  const gajo = (x, z, rad, top) => {
    const len = Math.max(0.01, top - y0 - 2 * rad);
    return add(g, uvScale(new THREE.CapsuleGeometry(rad, len, 6, 18), 3), fab, x, y0 + rad + len / 2, z);
  };
  blk(g, fab, [-a, a], [y0, sh - 0.1], [zb, D / 2 - 0.12], 0.05, 0.25);                                    // núcleo de la base
  const nf = Math.round((2 * a) / 0.16);
  for (let i = 0; i <= nf; i++) gajo(-a + (i * 2 * a) / nf, D / 2 - 0.1, 0.09, sh + 0.02);                  // gajos del frente
  add(g, uvScale(new RoundedBoxGeometry(2 * a - 0.08, 0.14, D / 2 - 0.03 - zb, 4, 0.06), 3), fab, 0, sh - 0.07, (zb + D / 2 - 0.03) / 2); // asiento
  // respaldo + brazos: gajos a lo largo de una U con esquinas redondeadas; bajan hacia el frente de los brazos
  const path = new THREE.Path();
  path.moveTo(-a, zf); path.lineTo(-a, zb + rc); path.quadraticCurveTo(-a, zb, -a + rc, zb);
  path.lineTo(a - rc, zb); path.quadraticCurveTo(a, zb, a, zb + rc); path.lineTo(a, zf);
  const n = Math.round(path.getLength() / (r * 1.25));
  for (const pt of path.getSpacedPoints(n)) {
    const s = (zf - pt.y) / (zf - zb);
    gajo(pt.x, pt.y, r, ha + (hb - ha) * smooth(0.35, 1, s) - 0.06 * (1 - smooth(0, 0.25, s)));
  }
  if (p.throw) {   // manta a rayas sobre el asiento que cae por delante de los gajos del frente (radio mayor: no los toca)
    const tw = p.throw.width ?? 1.1, tx = p.throw.x ?? 0;
    add(g, drapeGeo({ x0: tx - tw / 2, x1: tx + tw / 2, z0: zb + r + 0.04, z1: D / 2 - 0.12, top: sh + 0.035, drop: p.throw.drop ?? 0.22, r: 0.12,
      open: { zMax: true }, puff: 0.012, seed: 5, texM: 0.6 }), M.stripes(p.throw.colors ?? ['#dedbd4', '#8e939a'], p.throw.stripes ?? 14));
  }
  (p.cushions ?? []).forEach((c, i, all) => {   // almohadones apoyados contra el respaldo
    const span = 2 * a - 0.5, x = all.length > 1 ? -span / 2 + (i * span) / (all.length - 1) : 0;
    const q = rng(61 + i);
    restPillow(g, uvScale(pillowGeo(0.44, 0.2, 0.44, 70 + i, 1), 4), M.fabric(c),
      { x, rx: 1.0 + 0.14 * q(), ry: (q() - 0.5) * 0.2, rz: (i % 2 ? 1 : -1) * (0.03 + 0.06 * q()),
        supports: [{ n: [0, 1, 0], d: sh }, { n: [0, 0, 1], d: zb + r }], sink: 0.035 });
  });
  return g;
}

// colgante de cinta ondulada (LED): una cinta negra que se retuerce, colgada de dos cables desde una florería
function ribbonPendant(p, { M, H }) {
  const g = new THREE.Group(), y = H - (p.drop ?? 0.55), black = M.lacquer(p.color ?? '#1e1f21'), wire = M.metal('#2a2a2a', 0.4);
  const pts = [[-0.44, 0.06, 0.06], [-0.22, -0.05, 0.17], [0.02, 0.06, -0.02], [0.24, -0.03, -0.17], [0.45, 0.09, -0.05]];
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, yy, z]) => new THREE.Vector3(x, y + yy, z)));
  const shape = new THREE.Shape(); shape.moveTo(-0.004, -0.022); shape.lineTo(0.004, -0.022); shape.lineTo(0.004, 0.022); shape.lineTo(-0.004, 0.022);
  add(g, new THREE.ExtrudeGeometry(shape, { steps: 160, extrudePath: curve, bevelEnabled: false }), black);
  // canto de LED: una tira más angosta que asoma 4 mm por un borde de la cinta (no comparte caras con ella)
  const led = new THREE.Shape(); led.moveTo(-0.003, -0.026); led.lineTo(0.003, -0.026); led.lineTo(0.003, -0.02); led.lineTo(-0.003, -0.02);
  add(g, new THREE.ExtrudeGeometry(led, { steps: 160, extrudePath: curve, bevelEnabled: false }), M.led()).castShadow = false;
  blk(g, black, [-0.05, 0.05], [H - 0.02, H], [-0.05, 0.05], 0.004);                                       // florería
  for (const t of [0.2, 0.8]) {                                                                           // cables en diagonal
    const a = curve.getPointAt(t), b = new THREE.Vector3(0, H - 0.02, 0), v = new THREE.Vector3().subVectors(b, a);
    const m = add(g, new THREE.CylinderGeometry(0.0015, 0.0015, v.length(), 6), wire);
    m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
    m.castShadow = false;
  }
  lampSpot(g, 0, y - 0.03, 0, p.intensity ?? 18, 1.2, 6);
  lampPoint(g, 0, y + 0.08, 0, 1.2, 3);                                                                     // reflejo hacia el techo
  return g;
}

// rejilla de ventilación de pared (fondo en z = 0): marco, fondo oscuro y lamas
function ventGrille(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.2, h = p.height ?? 0.24, f = 0.018, white = M.lacquer(p.color ?? '#f1f1ef');
  blk(g, M.lacquer('#3a3c40'), [-w / 2 + f, w / 2 - f], [f, h - f], [0, 0.004]);
  blk(g, white, [-w / 2, -w / 2 + f], [0, h], [0, 0.012], 0.002);
  blk(g, white, [w / 2 - f, w / 2], [0, h], [0, 0.012], 0.002);
  blk(g, white, [-w / 2 + f, w / 2 - f], [0, f], [0, 0.012], 0.002);
  blk(g, white, [-w / 2 + f, w / 2 - f], [h - f, h], [0, 0.012], 0.002);
  for (let y = f + 0.012; y < h - f - 0.008; y += 0.024) blk(g, white, [-w / 2 + f, w / 2 - f], [y, y + 0.008], [0.004, 0.01]);
  g.userData.h = h;
  return g;
}

// mesa de comedor: de vidrio rectangular (por defecto, patas negras o "legs": "chrome") u ovalada de madera ("shape": "oval"); "mats": individuales
function diningTable(p, { M }) {
  const g = new THREE.Group(), L = p.length ?? 1.4, W = p.width ?? 0.8, h = p.height ?? 0.75;
  if (p.shape === 'round') {   // redonda laqueada (diámetro "length") sobre pie tulipa: base ancha, caño fino y copa bajo la tapa
    const lac = M.lacquer(p.color ?? '#f3f2ef'), R = L / 2;
    add(g, new THREE.LatheGeometry(v2([[0.001, h - 0.026], [R - 0.008, h - 0.026], [R, h - 0.018], [R, h - 0.006], [R - 0.008, h], [0.001, h]]), 64), lac);
    const prof = [[0.001, 0], [0.24, 0], [0.245, 0.006], [0.2, 0.03], [0.1, 0.09], [0.045, 0.2], [0.032, 0.4], [0.034, 0.55], [0.07, 0.66], [0.13, h - 0.035], [0.14, h - 0.022], [0.001, h - 0.022]];
    add(g, new THREE.LatheGeometry(v2(prof), 48), lac);
    return g;
  }
  if (p.shape === 'oval') {   // tapa de madera ovalada (bordes semicirculares) con cuatro patas abiertas
    const wood = M.wood(p.color ?? '#d2a26a'), top = new THREE.ExtrudeGeometry(rrect(new THREE.Shape(), -L / 2, -W / 2, L, W, W / 2 - 0.001), { depth: 0.03, bevelEnabled: false, curveSegments: 24 });
    top.rotateX(-Math.PI / 2); add(g, uvScale(top, 1.5), wood, 0, h - 0.03, 0);
    blk(g, wood, [-L / 2 + 0.25, L / 2 - 0.25], [h - 0.1, h - 0.03], [-W / 2 + 0.12, W / 2 - 0.12], 0.01);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = cyl(g, wood, sx * (L / 2 - 0.3), 0, h - 0.06, sz * (W / 2 - 0.16), 0.02, 12, 0.026); l.rotation.set(-sz * 0.06, 0, sx * 0.06); }
    ovalTablecloth(g, M, p.tablecloth, L, W, h);
    return g;
  }
  if (p.shape === 'trestle') {   // tapa de madera sobre dos pies de patas curvas abiertas, unidos por un travesaño
    const wood = M.wood(p.base ?? p.color ?? '#b98a5a'), t = 0.03, yc = h - t - 0.05;
    blk(g, M.wood(p.color ?? '#b98a5a'), [-L / 2, L / 2], [h - t, h], [-W / 2, W / 2], 0.005, 1.2);
    for (const sx of [-1, 1]) {
      const x = sx * (L / 2 - 0.2);
      blk(g, wood, [x - 0.03, x + 0.03], [yc, h - t + 0.002], [-W / 2 + 0.07, W / 2 - 0.07], 0.005);              // listón bajo la tapa
      for (const sz of [-1, 1]) add(g, bentBoard([sz * 0.045, yc + 0.03], [sz * 0.06, 0.03], [sz * (W / 2 - 0.08), 0.0295], 0.055, 0.042), wood, x, 0, 0);
    }
    blk(g, wood, [-L / 2 + 0.17, L / 2 - 0.17], [yc - 0.07, yc + 0.004], [-0.022, 0.022], 0.004);                 // travesaño
    tablecloth(g, M, p.tablecloth, L, W, h);
    return g;
  }
  if (p.shape === 'plank') {   // tapa de madera maciza rectangular (5 cm, en "boards" tablas) sobre dos caballetes de hierro negro en A, o sobre
    // cuatro patas de madera con faldón ("legs": "wood", mesa de campo)
    const wood = M.wood(p.color ?? '#d2a26a'), iron = M.lacquer(p.base ?? '#1b1b1b'), t = 0.05, nb = p.boards ?? 1, bw = W / nb;
    for (let i = 0; i < nb; i++) blk(g, wood, [-L / 2, L / 2], [h - t, h], [-W / 2 + i * bw + (i ? 0.002 : 0), -W / 2 + (i + 1) * bw - (i < nb - 1 ? 0.002 : 0)], 0.006, 1.2);
    if (p.legs === 'wood') {
      const lw = 0.065, ix = L / 2 - 0.05, iz = W / 2 - 0.05;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) blk(g, wood, [sx * ix - lw / 2, sx * ix + lw / 2], [0, h - t + 0.002], [sz * iz - lw / 2, sz * iz + lw / 2], 0.004);
      for (const s of [-1, 1]) {
        blk(g, wood, [-ix + lw / 2 - 0.003, ix - lw / 2 + 0.003], [h - t - 0.1, h - t + 0.002], [s * iz - 0.012, s * iz + 0.012], 0.003);
        blk(g, wood, [s * ix - 0.012, s * ix + 0.012], [h - t - 0.1, h - t + 0.002], [-iz + lw / 2 - 0.003, iz - lw / 2 + 0.003], 0.003);
      }
      tablecloth(g, M, p.tablecloth, L, W, h);
      return g;
    }
    for (const sx of [-1, 1]) {
      const x = sx * (L / 2 - 0.2);
      // travesaño bajo la tapa (2 mm por debajo: no comparte cara con ella) y dos patas abiertas hacia los costados
      blk(g, iron, [x - 0.025, x + 0.025], [h - t - 0.05, h - t - 0.002], [-W / 2 + 0.05, W / 2 - 0.05], 0.004);
      for (const sz of [-1, 1]) {
        const leg = blk(g, iron, [-0.02, 0.02], [0, h - t - 0.05], [-0.02, 0.02], 0.004);
        leg.position.set(x, (h - t - 0.05) / 2, sz * (W / 2 - 0.13)); leg.rotation.x = -sz * 0.12;   // arriba hacia adentro
      }
    }
    return g;
  }
  blk(g, M.tintedGlass(p.glass ?? '#b5cdc6', 0.32), [-L / 2, L / 2], [h - 0.012, h], [-W / 2, W / 2], 0.004).castShadow = false;
  if (p.legs === 'chrome') {
    // cuatro patas de caño cromado con un bastidor de caños 6 mm por debajo del vidrio, que apoya en cuatro tacos
    const steel = M.metal(p.base ?? '#d4d7da', 0.18), ix = L / 2 - 0.08, iz = W / 2 - 0.08, ry = h - 0.03;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cyl(g, steel, sx * ix, 0, ry, sz * iz, 0.014, 16); cyl(g, M.lacquer('#d9dcd8'), sx * ix, ry + 0.011, h - 0.012, sz * iz, 0.012, 16).castShadow = false; }
    for (const s of [-1, 1]) { bar(g, steel, 'x', -ix, ix, ry, s * iz, 0.012); bar(g, steel, 'z', -iz, iz, ry, s * ix, 0.012); }
  } else {
    const base = M.lacquer(p.base ?? '#1b1b1b');
    // pie en X: dos placas cruzadas (una 2 mm más baja para no compartir la cara de arriba)
    blk(g, base, [-0.5, 0.5], [0, h - 0.012], [-0.012, 0.012], 0.004).rotation.y = 0.55;
    blk(g, base, [-0.5, 0.5], [0, h - 0.014], [-0.012, 0.012], 0.004).rotation.y = -0.55;
  }
  const mats = p.mats ?? 0, mm = M.quilt('#6d6d6b');
  for (let i = 0; i < mats; i++) {
    const sx = (i % 2 ? 1 : -1) * L / 4, sz = (i < 2 ? -1 : 1) * (W / 2 - 0.2);
    blk(g, mm, [sx - 0.21, sx + 0.21], [h, h + 0.003], [sz - 0.15, sz + 0.15], 0.001, 0.4).castShadow = false;
  }
  tablecloth(g, M, p.tablecloth, L, W, h);
  return g;
}
// mantel de una mesa rectangular ("tablecloth": { "color" } liso o { "pattern": "palm", "colors" } estampado tropical de
// hule; "drop" cuánto cae por los lados): cubre la tapa 5 mm por encima y cae por los cuatro lados con pliegues suaves.
// Lo que va sobre la mesa se apoya en "height" + 0,008
// mantel de una mesa ovalada (mismos "color", "pattern" y "drop"): sigue el contorno de la tapa y cae con ondas suaves
// que se abren un poco hacia el ruedo; la tapa del mantel queda 5 mm por encima de la de madera
function ovalTablecloth(g, M, tc, L, W, h) {
  if (!tc) return;
  const mat = tc.pattern === 'palm' ? M.palm(tc.colors ?? ['#f4f3ee', '#2f7d3a', '#5aa04a', '#1f5e33', '#8cc06a']) : M.cloth(tc.color ?? '#efe9de');
  const e = 0.006, sh = rrect(new THREE.Shape(), -L / 2 - e, -W / 2 - e, L + 2 * e, W + 2 * e, W / 2 + e - 0.001), y0 = h + 0.005, d = tc.drop ?? 0.22;
  const top = new THREE.ShapeGeometry(sh, 24); top.rotateX(-Math.PI / 2); uvScale(top, 1 / 0.75);
  add(g, top, mat, 0, y0, 0).castShadow = true;
  const pts = sh.getSpacedPoints(180), n = pts.length - 1, R = 7, per = sh.getLength(), pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1, nx = ty / l, ny = -tx / l;
    for (let r = 0; r <= R; r++) {
      const v = r / R, off = 0.002 + v * v * 0.025 + v * 0.012 * Math.sin((i / n) * Math.PI * 2 * 22 + 1.3 * Math.sin(i * 0.37));
      pos.push(pts[i].x + nx * off, y0 - v * d, -(pts[i].y + ny * off)); uv.push((i / n) * per / 0.75, (v * d) / 0.75);
    }
  }
  for (let i = 0; i < n; i++) for (let r = 0; r < R; r++) { const a = i * (R + 1) + r, b = a + R + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals(); add(g, geo, mat);
}
function tablecloth(g, M, tc, L, W, h) {
  if (!tc) return;
  const mat = tc.pattern === 'palm' ? M.palm(tc.colors ?? ['#f4f3ee', '#2f7d3a', '#5aa04a', '#1f5e33', '#8cc06a']) : M.cloth(tc.color ?? '#efe9de');
  add(g, drapeGeo({ x0: -L / 2 - 0.004, x1: L / 2 + 0.004, z0: -W / 2 - 0.004, z1: W / 2 + 0.004, top: h + 0.005, drop: tc.drop ?? 0.22, r: 0.015,
    open: { xMin: true, xMax: true, zMin: true, zMax: true }, seed: 5, texM: 0.75 }), mat);
}

// silla con casco tapizado en capitoné (o liso) y patas metálicas abiertas; "style": "wood" (madera y asiento de cuero) o "tube"
// (caño cromado, asiento redondo tapizado y respaldo de varillas)
// "panel": madera recta con respaldo de tabla ("panel" su color) y almohadón; "spindle": torneada con respaldo de husillos;
// "stool": banqueta baja sin respaldo, asiento redondo tejido ("color") en un aro de madera
function chair(p, { M }) {
  if (p.style === 'wishbone') return wishboneChair(p, { M });
  if (p.style === 'stool') {   // cuatro patas abiertas que entran en el asiento, con una cuenta torneada y un aro de travesaño
    const g = new THREE.Group(), wood = M.wood(p.wood ?? '#6b3d24'), sh = p.seatHeight ?? 0.48, R = 0.165, top = sh - 0.02;
    const ring = add(g, new THREE.TorusGeometry(R, 0.016, 10, 40), wood, 0, sh - 0.018, 0); ring.rotation.x = Math.PI / 2;
    add(g, uvScale(new THREE.CylinderGeometry(R - 0.004, R - 0.004, 0.03, 40), 3), M.knit(p.color ?? '#c8483f'), 0, sh - 0.015, 0);
    const at = (a, k) => [Math.cos(a) * R * (1.05 - 0.3 * k), k * top, Math.sin(a) * R * (1.05 - 0.3 * k)];
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      strut(g, wood, at(a, 0), at(a, 1), 0.017, 0.015);
      add(g, new THREE.SphereGeometry(0.022, 12, 8), wood, ...at(a, 0.62)).scale.y = 1.6;   // cuenta torneada
    }
    const k = 0.4, rr = R * (1.05 - 0.3 * k), st = add(g, new THREE.TorusGeometry(rr, 0.009, 8, 40), wood, 0, k * top, 0); st.rotation.x = Math.PI / 2;
    return g;
  }
  if (p.style === 'spindle') return spindleChair(p, { M });
  if (p.style === 'panel') {   // silla de madera recta: patas cuadradas, almohadón de asiento ("color") y respaldo de tabla
    const g = new THREE.Group(), wood = M.wood(p.wood ?? '#5c2a1c'), sh = p.seatHeight ?? 0.46, w = 0.42, d = 0.42, s = 0.034, top = p.height ?? 0.9;
    for (const sx of [-1, 1]) {
      const x = [sx * w / 2 - (sx > 0 ? s : 0), sx * w / 2 + (sx < 0 ? s : 0)];
      blk(g, wood, x, [0, sh - 0.025], [d / 2 - s, d / 2], 0.004);                                                   // pata de adelante
      blk(g, wood, x, [0, top], [-d / 2, -d / 2 + s], 0.004);                                                         // pata de atrás y parante
      blk(g, wood, [x[0] + 0.008, x[1] - 0.008], [0.14, 0.17], [-d / 2 + s - 0.004, d / 2 - s + 0.004], 0.003);     // travesaño bajo
    }
    blk(g, wood, [-w / 2 + 0.004, w / 2 - 0.004], [sh - 0.07, sh - 0.02], [-d / 2 + 0.004, d / 2 - 0.004], 0.004);   // bastidor del asiento
    add(g, uvScale(new RoundedBoxGeometry(w - 0.012, 0.035, d - 0.035, 3, 0.012), 3), M.fabric(p.color ?? '#202022'), 0, sh - 0.004, 0.012);
    blk(g, M.lacquer(p.panel ?? '#ece7dc'), [-w / 2 + s - 0.004, w / 2 - s + 0.004], [sh + 0.2, top - 0.07], [-d / 2 + 0.008, -d / 2 + 0.024], 0.004);
    for (const y of [[sh + 0.16, sh + 0.2], [top - 0.07, top - 0.025]]) blk(g, wood, [-w / 2 + s - 0.004, w / 2 - s + 0.004], y, [-d / 2 + 0.004, -d / 2 + s - 0.004], 0.003);
    return g;
  }
  if (p.style === 'wood') {
    const g = new THREE.Group(), wood = M.wood(p.wood ?? '#c8925e'), leather = M.lacquer(p.color ?? '#b8783f'), sh = p.seatHeight ?? 0.46;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = cyl(g, wood, sx * 0.19, 0, sh - 0.03, sz * 0.18, 0.016, 12, 0.02); l.rotation.set(-sz * 0.07, 0, sx * 0.05); }   // la punta entra en el asiento
    add(g, uvScale(new RoundedBoxGeometry(0.46, 0.05, 0.44, 4, 0.02), 2), leather, 0, sh - 0.01, 0.01);
    for (const sx of [-1, 1]) { const post = cyl(g, wood, sx * 0.2, sh, 0.76, -0.19, 0.014, 10); post.rotation.x = -0.12; }
    const back = add(g, bentBoxGeo(0.48, 0.13, 0.035, 0.4), wood, 0, 0.72, -0.235); back.rotation.x = -0.12;
    return g;
  }
  if (p.style === 'tube') {   // silla de caño cromado: asiento redondo tapizado y respaldo de tres varillas curvas
    // Todo el caño se toca: un aro bajo el asiento recibe las cuatro patas; las de atrás siguen hacia arriba como
    // parantes del respaldo (quebradas en el aro, inclinadas hacia atrás) y las varillas terminan justo en los parantes
    const g = new THREE.Group(), chrome = M.metal(p.legs ?? '#c3c6ca', 0.22), seat = M.fabric(p.color ?? '#d9d3c7'), sh = p.seatHeight ?? 0.46, r = 0.0105;
    const up = new THREE.Vector3(0, 1, 0), V = (x, y, z) => new THREE.Vector3(x, y, z);
    const tube = (a, b) => {   // caño recto de a a b, con una bocha en cada punta para que las uniones queden redondas
      const d = b.clone().sub(a), m = add(g, new THREE.CylinderGeometry(r, r, d.length(), 12), chrome);
      m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(up, d.normalize());
      for (const q of [a, b]) add(g, new THREE.SphereGeometry(r, 10, 8), chrome, q.x, q.y, q.z).castShadow = false;
    };
    const ry = sh - 0.016, R = 0.19;   // aro
    const ring = add(g, new THREE.TorusGeometry(R, r, 8, 48), chrome, 0, ry, 0); ring.rotation.x = Math.PI / 2;
    // asiento: almohadón redondo de bordes curvos apoyado sobre el aro
    const prof = [[0.001, 0], [0.19, 0], [0.205, 0.012], [0.21, 0.03], [0.2, 0.05], [0.17, 0.058], [0.001, 0.06]];
    add(g, uvScale(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 48), 2), seat, 0, ry + r, 0);
    const a = Math.PI / 4, top = 0.88;
    for (const sx of [-1, 1]) {
      const f = V(sx * R * Math.sin(a), ry, R * Math.cos(a)), b = V(sx * R * Math.sin(a), ry, -R * Math.cos(a));
      tube(V(f.x * 1.18, 0, f.z * 1.18), f);                              // pata de adelante, apenas abierta
      tube(V(b.x * 1.18, 0, b.z * 1.18), b);                              // pata de atrás
      tube(b, V(b.x * 0.92, top, b.z - 0.07));                            // parante del respaldo, hacia atrás
    }
    for (const y of [0.64, 0.73, 0.82]) {   // varillas: curvas hacia adelante, con las puntas en los parantes
      const k = (y - ry) / (top - ry), x = R * Math.sin(a) * (1 - 0.08 * k), z = -R * Math.cos(a) - 0.07 * k, R2 = 0.4;
      const w = 2 * x, sag = R2 - Math.sqrt(R2 * R2 - (w / 2) * (w / 2));
      add(g, bentBoxGeo(w, 0.018, 0.014, R2), chrome, 0, y, z - sag);
    }
    return g;
  }
  const g = new THREE.Group(), shell = p.quilted === false ? M.lacquer(p.color ?? '#2b2b2b') : M.quilt(p.color ?? '#9a9a9a');
  const legs = M.metal(p.legs ?? '#1d1d1d', 0.5), sh = p.seatHeight ?? 0.46;
  add(g, uvScale(new RoundedBoxGeometry(0.46, 0.07, 0.44, 4, 0.03), 2), shell, 0, sh, 0.01);
  // respaldo apenas envolvente, apoyado sobre el fondo del asiento (un radio chico lo hacía parecer un barril)
  const back = add(g, uvScale(bentBoxGeo(0.44, 0.44, 0.04, 0.62), 2), shell, 0, sh + 0.24, -0.185);
  back.rotation.x = -0.1;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const l = cyl(g, legs, sx * 0.18, 0, sh - 0.03, sz * 0.17, 0.009, 10, 0.012);
    l.rotation.set(-sz * 0.12, 0, sx * 0.1);
  }
  return g;
}

// silla de madera tipo "wishbone": asiento de cuerda tejida ("color") en un bastidor, patas de atrás que suben curvas
// hasta un respaldo de arco continuo (brazos y respaldo en una pieza) y una tabla en Y en el centro. El frente en +Z
function wishboneChair(p, { M }) {
  const g = new THREE.Group(), wood = M.wood(p.wood ?? '#c8925e'), cord = M.knit(p.color ?? '#c9a979'), sh = p.seatHeight ?? 0.44;
  const ry = 0.7, R = 0.235, zc = -0.05;
  blk(g, wood, [-0.235, 0.235], [sh - 0.04, sh - 0.012], [-0.2, 0.2], 0.01);                          // bastidor del asiento
  add(g, uvScale(new RoundedBoxGeometry(0.44, 0.034, 0.37, 3, 0.012), 6), cord, 0, sh - 0.012, 0.005); // cuerda tejida, apenas abombada
  for (const sx of [-1, 1]) {
    strut(g, wood, [sx * 0.205, 0, 0.19], [sx * 0.2, sh - 0.03, 0.17], 0.017, 0.019);                 // pata de adelante, entra en el bastidor
    // pata de atrás: del piso hacia atrás, atraviesa el bastidor y sube curvándose hasta la punta del arco
    const pts = [[sx * 0.2, 0, -0.215], [sx * 0.203, sh - 0.03, -0.17], [sx * 0.215, 0.6, -0.1], [sx * R, ry, zc]].map(q => new THREE.Vector3(...q));
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.017, 10), wood);
    add(g, new THREE.SphereGeometry(0.017, 10, 8), wood, sx * 0.2, 0.002, -0.215).scale.y = 0.2;    // pie de la pata (tapa el corte del caño)
  }
  // arco del respaldo: medio círculo hacia atrás, apenas aplastado; las puntas apoyan sobre las patas
  const arc = [];
  for (let i = 0; i <= 24; i++) { const a = Math.PI * i / 24; arc.push(new THREE.Vector3(R * Math.cos(a), ry + 0.012 * Math.sin(a), zc - R * Math.sin(a))); }
  const rail = add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc), 48, 0.02, 10), wood);
  rail.scale.set(1, 0.85, 1); rail.position.y = ry * 0.15;
  for (const sx of [-1, 1]) add(g, new THREE.SphereGeometry(0.02, 10, 8), wood, sx * R, ry, zc);
  // tabla en Y: del fondo del asiento al arco, inclinada hacia atrás
  // (las puntas de la Y terminan donde el arco todavía está atrás: x = ±0,075, z ≈ -0,275)
  const y0 = sh - 0.025, dy = ry - y0, dz = -0.276 - (-0.19), L = Math.hypot(dy, dz);
  const y = new THREE.Shape(v2([[-0.028, 0], [0.028, 0], [0.028, L * 0.45], [0.078, L], [0.045, L], [0, L * 0.62], [-0.045, L], [-0.078, L], [-0.028, L * 0.45]]));
  const yg = new THREE.ExtrudeGeometry(y, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1 });
  yg.translate(0, 0, -0.007);
  const splat = add(g, uvScale(yg, 2), wood, 0, y0, -0.19);
  splat.rotation.x = Math.atan2(dz, dy);
  return g;
}

// mesa auxiliar redonda: metálica o de madera con tapa de cerámica ("style": "wood")
function sideTable(p, { M }) {
  if (p.style === 'wood') {
    const g = new THREE.Group(), r = (p.diameter ?? 0.45) / 2, h = p.height ?? 0.5, wood = M.wood(p.wood ?? '#c8925e');
    cyl(g, M.ceramic(p.color ?? '#efece6'), 0, h - 0.025, h, 0, r, 40);
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3, l = cyl(g, wood, Math.cos(a) * r * 0.6, 0, h - 0.025, Math.sin(a) * r * 0.6, 0.014, 10, 0.018); l.rotation.set(Math.sin(a) * 0.1, 0, -Math.cos(a) * 0.1); }
    blk(g, wood, [-r * 0.55, r * 0.55], [0.2, 0.22], [-0.012, 0.012]);
    return g;
  }
  const g = new THREE.Group(), r = (p.diameter ?? 0.45) / 2, h = p.height ?? 0.5, mat = M.lacquer(p.color ?? '#2b2b2b');
  cyl(g, mat, 0, h - 0.02, h, 0, r, 40);
  cyl(g, mat, 0, 0.01, h - 0.02, 0, 0.02, 16);
  cyl(g, mat, 0, 0, 0.012, 0, r * 0.7, 32);
  return g;
}

// estante de cubos abiertos ("cols" × "rows")
function cubeShelf(p, { M }) {
  const g = new THREE.Group(), cols = p.cols ?? 2, rows = p.rows ?? 2, c = p.cell ?? 0.35, t = 0.02, d = p.depth ?? 0.35;
  const mat = M.lacquer(p.color ?? '#f4f4f2'), W = cols * c + (cols + 1) * t;
  for (let r = 0; r <= rows; r++) blk(g, mat, [-W / 2, W / 2], [r * (c + t), r * (c + t) + t], [-d / 2, d / 2], 0.002);
  for (let r = 0; r < rows; r++) for (let k = 0; k <= cols; k++) {
    const x0 = -W / 2 + k * (c + t);
    blk(g, mat, [x0, x0 + t], [r * (c + t) + t, (r + 1) * (c + t)], [-d / 2, d / 2]);
  }
  g.userData.h = rows * (c + t) + t;
  return g;
}

// tele o monitor (diagonal en pulgadas); en la pared con el fondo en z = 0, o con pie
function tv(p, { M }) {
  const g = new THREE.Group(), w = (p.size ?? 43) * 0.0254 * 0.8716, h = w * 9 / 16, black = M.lacquer('#151515');
  const y0 = p.stand ? 0.09 : 0, z0 = p.stand ? -0.015 : 0;
  if (p.stand) {
    blk(g, black, [-0.11, 0.11], [0, 0.012], [-0.08, 0.08], 0.004);
    blk(g, black, [-0.02, 0.02], [0.012, y0 + 0.05], [-0.035, -0.015], 0.004);
  }
  blk(g, black, [-w / 2, w / 2], [y0, y0 + h], [z0, z0 + 0.03], 0.004);
  blk(g, p.picture ? M.picture(p.picture) : M.screen(), [-w / 2 + 0.008, w / 2 - 0.008], [y0 + 0.008, y0 + h - 0.008], [z0 + 0.03, z0 + 0.032]).castShadow = false;
  g.userData.h = y0 + h;
  return g;
}

// equipo de aire acondicionado split de pared (fondo en z = 0)
function acSplit(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.8, h = 0.28, d = 0.2, white = M.lacquer('#f4f4f2');
  blk(g, white, [-w / 2, w / 2], [0, h], [0, d], 0.04);
  blk(g, M.lacquer('#4a4d52'), [-w / 2 + 0.05, w / 2 - 0.05], [0.012, 0.045], [d - 0.035, d - 0.008]);
  blk(g, white, [-w / 2 + 0.06, w / 2 - 0.06], [0.04, 0.056], [d - 0.012, d + 0.012], 0.004);
  blk(g, M.screen(), [w / 2 - 0.14, w / 2 - 0.08], [0.1, 0.12], [d, d + 0.002]).castShadow = false;
  return g;
}

// dos paños de cortina recogidos a los lados del ventanal, en un barral ("panelWidth" = width / 2: corridas, tapan la
// ventana). "rod": "wood" = barral de madera con remates de bola; "tabs": cuelgan de presillas; "hem": color del ruedo
function curtains(p, { M, H }) {
  const g = new THREE.Group(), W = p.width ?? 2.8, pw = p.panelWidth ?? 0.45, h = p.height ?? 2.45, wood = p.rod === 'wood', tabs = !!p.tabs;
  const rr = wood ? 0.016 : 0.011, ry = Math.min(H - 0.04, h + 0.05) + 0.011, top = tabs ? ry - 0.07 : ry - 0.011;
  // "sheer": voile traslúcido (deja pasar la luz y se ve la calle a través; un número es la opacidad: 0,85 = algodón
  // liviano que brilla a contraluz); si no, tela opaca
  const cloth = p.sheer ? M.curtainVoile(p.color ?? '#faf8f3', typeof p.sheer === 'number' ? p.sheer : 0.58) : M.curtainCloth(p.color ?? '#e7e2d8');
  // barral con dos soportes a la pared (z = 0); los paños cuelgan tocando el barral (o de presillas que lo abrazan)
  const rod = wood ? M.wood(p.rodColor ?? '#7a4a2a') : M.metal('#2b2b2b', 0.5);
  bar(g, rod, 'x', -W / 2 - 0.05, W / 2 + 0.05, ry, 0.08, rr, 16);
  for (const sx of [-1, 1]) {
    bar(g, rod, 'z', 0, 0.08, ry, sx * (W / 2 + 0.025), 0.006, 8); disc(g, rod, sx * (W / 2 + 0.025), ry, 0, 0.018, 0.006);
    if (wood) add(g, new THREE.SphereGeometry(0.03, 16, 12), rod, sx * (W / 2 + 0.075), ry, 0.08);
  }
  const hem = p.hem ? M.curtainCloth(p.hem) : null, hh = 0.07, ch = tabs ? h - 0.059 : h;   // con presillas el paño es más corto: el ruedo queda donde quedaría sin ellas
  for (const [x0, seed] of [[-W / 2, 2], [W / 2 - pw, 5]]) {
    if (hem) {   // ruedo: la misma tela plegada, con los mismos pliegues que el paño (se calcula con el alto total)
      add(g, foldedClothGeo(pw, ch - hh, 0.1, 0.035, seed, 0, ch), cloth, x0, top, 0.085);
      add(g, foldedClothGeo(pw, hh, 0.1, 0.035, seed, ch - hh, ch), hem, x0, top - (ch - hh), 0.085);
    } else add(g, foldedClothGeo(pw, ch, 0.1, 0.035, seed), cloth, x0, top, 0.085);
    if (tabs) for (let x = x0 + 0.03; x < x0 + pw - 0.01; x += 0.15) {   // presilla: dos tiras y medio tubo sobre el barral
      const tw = 0.045, tab = p.tabColor ? M.cloth(p.tabColor) : (hem ?? cloth);
      for (const dz of [-1, 1]) blk(g, tab, [x, x + tw], [top - 0.02, ry], [0.08 + dz * (rr + 0.003) - 0.0015, 0.08 + dz * (rr + 0.003) + 0.0015]).castShadow = false;
      const arc = add(g, new THREE.CylinderGeometry(rr + 0.0045, rr + 0.0045, tw, 12, 1, true, 0, Math.PI), tab, x + tw / 2, ry, 0.08);
      arc.rotation.z = Math.PI / 2; arc.castShadow = false;
    }
  }
  return g;
}

// espejo redondo de pared con aro metálico o de madera ("frame"); fondo en z = 0
function roundMirror(p, { M }) {
  const g = new THREE.Group(), r = (p.diameter ?? 0.6) / 2;
  // 'ring': color del aro de metal fino (por defecto negro); 'frame': aro de madera
  const ring = add(g, new THREE.TorusGeometry(r, p.frame ? 0.014 : p.ring ? 0.007 : 0.01, 12, 72), p.frame ? M.wood(p.frame) : M.metal(p.ring ?? '#1d1d1d', 0.35), 0, 0, 0.012);
  ring.castShadow = false;
  add(g, new THREE.CircleGeometry(r - 0.004, 72), M.mirror(), 0, 0, 0.013).castShadow = false;
  disc(g, M.lacquer('#2a2a2a'), 0, 0, 0, r * 0.92, 0.011, 48);   // fondo redondo: uno cuadrado asomaba por las esquinas
  return g;
}

// espejo de pie apoyado contra la pared (la base adelante, la parte de arriba hacia -Z)
function floorMirror(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.42, h = p.height ?? 1.55, f = 0.018, black = M.lacquer('#1d1d1d');
  const lean = new THREE.Group(); lean.rotation.x = -0.13; g.add(lean);
  blk(lean, black, [-w / 2, -w / 2 + f], [0, h], [-0.012, 0.012], 0.003);
  blk(lean, black, [w / 2 - f, w / 2], [0, h], [-0.012, 0.012], 0.003);
  blk(lean, black, [-w / 2 + f, w / 2 - f], [0, f], [-0.012, 0.012], 0.003);
  blk(lean, black, [-w / 2 + f, w / 2 - f], [h - f, h], [-0.012, 0.012], 0.003);
  add(lean, new THREE.PlaneGeometry(w - 2 * f, h - 2 * f), M.mirror(), 0, h / 2, 0.004).castShadow = false;
  blk(lean, black, [-w / 2 + f, w / 2 - f], [f, h - f], [-0.01, 0.002]);
  g.userData.h = h;
  return g;
}

/* ---------- cocina ---------- */
// heladera con freezer arriba, de acero
function fridge(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.6, h = p.height ?? 1.75, d = p.depth ?? 0.65;
  // 'finish': 'enamel' = chapa enlozada blanca (no acero); 'doors': 1 = una sola puerta con la manija corrida arriba (frigobar)
  const enamel = p.finish === 'enamel', steel = enamel ? M.lacquer(p.color ?? '#f4f3ef') : M.brushed(p.color ?? '#c4c7cb'), dark = M.lacquer('#2a2c2e'), split = 0.05 + (h - 0.05) * 0.68;
  if (p.doors === 1) {
    blk(g, dark, [-w / 2 + 0.02, w / 2 - 0.02], [0, 0.04], [-d / 2, d / 2 - 0.08]);
    blk(g, steel, [-w / 2, w / 2], [0.04, h], [-d / 2, d / 2 - 0.05], 0.01);
    blk(g, steel, [-w / 2 + 0.002, w / 2 - 0.002], [0.045, h - 0.07], [d / 2 - 0.05, d / 2], 0.012);
    blk(g, M.lacquer('#8f9296'), [-w / 2 + 0.002, w / 2 - 0.002], [h - 0.066, h - 0.004], [d / 2 - 0.05, d / 2 - 0.004], 0.01);   // manija corrida
    g.userData.h = h;
    return g;
  }
  blk(g, dark, [-w / 2 + 0.02, w / 2 - 0.02], [0, 0.05], [-d / 2, d / 2 - 0.08]);
  blk(g, steel, [-w / 2, w / 2], [0.05, h], [-d / 2, d / 2 - 0.05], 0.01);
  blk(g, steel, [-w / 2 + 0.002, w / 2 - 0.002], [0.055, split - 0.004], [d / 2 - 0.05, d / 2], 0.012);
  blk(g, steel, [-w / 2 + 0.002, w / 2 - 0.002], [split + 0.004, h - 0.004], [d / 2 - 0.05, d / 2], 0.012);
  for (const [y0, y1] of [[split - 0.55, split - 0.1], [split + 0.06, split + 0.32]]) blk(g, dark, [w / 2 - 0.055, w / 2 - 0.035], [y0, y1], [d / 2, d / 2 + 0.025], 0.008);
  add(g, new THREE.PlaneGeometry(0.09, 0.15), M.lacquer('#f1efe6'), w / 2 - 0.12, split - 0.32, d / 2 + 0.0015).castShadow = false;  // etiqueta de eficiencia
  g.userData.h = h;
  return g;
}

// electrodoméstico chico según "kind": microwave, toaster-oven, coffee-maker, kettle, cooktop o hood (campana)
function appliance(p, { M }) {
  const g = new THREE.Group(), k = p.kind, black = M.lacquer('#1c1c1d'), steel = M.metal('#c9ccd0', 0.3);
  if (k === 'microwave') {
    const w = 0.46, h = 0.27, d = 0.36;
    blk(g, black, [-w / 2, w / 2], [0, h], [-d / 2, d / 2], 0.01);
    blk(g, M.screen(), [-w / 2 + 0.02, w / 2 - 0.12], [0.03, h - 0.03], [d / 2, d / 2 + 0.004], 0.004);
    blk(g, steel, [w / 2 - 0.1, w / 2 - 0.02], [0.03, h - 0.03], [d / 2, d / 2 + 0.003], 0.003);
  } else if (k === 'toaster-oven') {
    const w = 0.5, h = 0.3, d = 0.37, red = M.lacquer('#b3261e');
    blk(g, p.color ? M.lacquer(p.color) : black, [-w / 2, w / 2], [0, h], [-d / 2, d / 2], 0.012);   // "color": gabinete (negro por defecto)
    blk(g, M.screen(), [-w / 2 + 0.03, w / 2 - 0.12], [0.04, h - 0.06], [d / 2, d / 2 + 0.004], 0.004);
    blk(g, red, [-w / 2 + 0.01, w / 2 - 0.01], [h - 0.04, h - 0.025], [d / 2, d / 2 + 0.004], 0.003);
    blk(g, steel, [-w / 2 + 0.05, w / 2 - 0.15], [h - 0.075, h - 0.065], [d / 2 + 0.01, d / 2 + 0.022], 0.004);
    for (const hx of [-w / 2 + 0.07, w / 2 - 0.17]) bar(g, steel, 'z', d / 2 + 0.003, d / 2 + 0.011, h - 0.07, hx, 0.004, 8);   // vástagos de la manija
    for (const y of [0.07, 0.15, 0.23]) disc(g, red, w / 2 - 0.06, y, d / 2, 0.018, 0.016);
  } else if (k === 'cooktop') {
    const w = 0.3, d = 0.38;
    blk(g, steel, [-w / 2, w / 2], [0, 0.05], [-d / 2, d / 2], 0.006);
    blk(g, M.screen(), [-w / 2 + 0.01, w / 2 - 0.01], [0.05, 0.056], [-d / 2 + 0.01, d / 2 - 0.01], 0.002);
  } else if (k === 'hood') {   // campana extraíble bajo la alacena
    blk(g, steel, [-0.29, 0.29], [0, 0.05], [-0.15, 0.15], 0.004);
    blk(g, M.lacquer('#3a3c40'), [-0.27, 0.27], [-0.004, 0.001], [-0.12, 0.12]);
  } else if (k === 'kettle') {
    cyl(g, black, 0, 0, 0.015, 0, 0.09, 32);
    add(g, new THREE.LatheGeometry(v2([[0.001, 0], [0.08, 0], [0.085, 0.02], [0.082, 0.16], [0.07, 0.2], [0.03, 0.215], [0.001, 0.215]]), 40), p.color ? M.lacquer(p.color) : steel, 0, 0.015, 0);   // "color": jarra pintada (acero por defecto)
    const hd = add(g, new THREE.TorusGeometry(0.07, 0.012, 8, 24, Math.PI), black, 0, 0.13, -0.075);
    hd.rotation.y = Math.PI / 2; hd.rotation.x = 0;
    const sp = cyl(g, steel, 0, 0.12, 0.2, 0.09, 0.012, 12, 0.008); sp.rotation.x = 0.7;
  } else if (k === 'coffee-maker') {
    const white = M.lacquer(p.color ?? '#f3f3f1');
    blk(g, white, [-0.1, 0.1], [0, 0.04], [-0.11, 0.11], 0.01);
    blk(g, white, [-0.1, 0.1], [0.04, 0.32], [-0.11, -0.04], 0.012);
    blk(g, white, [-0.1, 0.1], [0.25, 0.33], [-0.04, 0.1], 0.02);
    cyl(g, M.glass(), 0, 0.04, 0.2, 0.03, 0.065, 32).castShadow = false;   // jarra apoyada en la base
    cyl(g, black, 0, 0.2, 0.215, 0.03, 0.06, 32);
  }
  return g;
}

// cocina a gas de pie con horno: cuerpo enlozado, 4 hornallas con dos parrillas, tablero de perillas y puerta con visor
function range(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.55, d = p.depth ?? 0.58, h = p.height ?? 0.86;
  const enamel = M.lacquer(p.color ?? '#f3f3f1'), iron = M.lacquer('#1c1c1d'), steel = M.metal('#c9ccd0', 0.3), fz = d / 2 - 0.02;
  blk(g, M.lacquer('#2a2c2e'), [-w / 2 + 0.02, w / 2 - 0.02], [0, 0.05], [-d / 2, fz - 0.03]);              // zócalo
  blk(g, enamel, [-w / 2, w / 2], [0.05, h], [-d / 2, fz], 0.006);                                          // cuerpo
  blk(g, enamel, [-w / 2 + 0.004, w / 2 - 0.004], [0.07, h - 0.16], [fz, d / 2], 0.006);                    // puerta del horno
  blk(g, M.screen(), [-w / 2 + 0.07, w / 2 - 0.07], [0.2, h - 0.3], [d / 2, d / 2 + 0.003], 0.004).castShadow = false;
  for (const s of [-1, 1]) blk(g, steel, [s * (w / 2 - 0.07) - 0.008, s * (w / 2 - 0.07) + 0.008], [h - 0.215, h - 0.195], [d / 2, d / 2 + 0.035], 0.003);
  bar(g, steel, 'x', -w / 2 + 0.05, w / 2 - 0.05, h - 0.205, d / 2 + 0.035, 0.008);                         // manija
  for (let i = 0; i < 5; i++) disc(g, enamel, -w / 2 + 0.07 + i * (w - 0.14) / 4, h - 0.08, fz, 0.019, 0.026); // perillas
  const bx = w / 4, bzs = [-d / 2 + 0.15, d / 2 - 0.19];
  for (const sx of [-1, 1]) for (const bz of bzs) {                                                         // quemadores
    cyl(g, iron, sx * bx, h, h + 0.014, bz, 0.042, 24);
    cyl(g, iron, sx * bx, h + 0.014, h + 0.022, bz, 0.032, 24);
  }
  // parrillas: marco sobre patitas y dedos en cruz sobre cada quemador (uno 2 mm más bajo que el otro)
  const gt = 0.012, gy = h + 0.03, z0 = -d / 2 + 0.03, z1 = d / 2 - 0.05;
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -w / 2 + 0.015 : 0.003, x1 = sx < 0 ? -0.003 : w / 2 - 0.015;
    blk(g, iron, [x0, x1], [gy, gy + gt], [z0, z0 + gt]); blk(g, iron, [x0, x1], [gy, gy + gt], [z1 - gt, z1]);
    blk(g, iron, [x0, x0 + gt], [gy, gy + gt], [z0 + gt, z1 - gt]); blk(g, iron, [x1 - gt, x1], [gy, gy + gt], [z0 + gt, z1 - gt]);
    for (const [px, pz] of [[x0, z0], [x1 - gt, z0], [x0, z1 - gt], [x1 - gt, z1 - gt]]) blk(g, iron, [px, px + gt], [h, gy], [pz, pz + gt]);
    for (const bz of bzs) {
      blk(g, iron, [x0 + gt, x1 - gt], [gy - 0.004, gy + gt - 0.004], [bz - 0.005, bz + 0.005]);
      blk(g, iron, [sx * bx - 0.005, sx * bx + 0.005], [gy - 0.006, gy + gt - 0.006], [bz - 0.1, bz + 0.1]);
    }
  }
  return g;
}

// calefón a gas colgado (fondo en z = 0): gabinete, visor y perilla, conducto de humos hasta el techo y conexiones abajo
function waterHeater(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.36, h = p.height ?? 0.66, d = p.depth ?? 0.24, flue = p.flue ?? 0.5;
  const white = M.lacquer('#f4f4f2'), steel = M.metal('#c9ccd0', 0.3);
  blk(g, white, [-w / 2, w / 2], [0, h], [0, d], 0.02);
  blk(g, M.lacquer('#c4302b'), [-w / 2 + 0.03, -w / 2 + 0.042], [h - 0.22, h - 0.07], [d, d + 0.002]);       // marca
  blk(g, M.screen(), [-0.035, 0.035], [h * 0.4, h * 0.46], [d, d + 0.002]).castShadow = false;             // visor de llama
  blk(g, M.lacquer('#d6d6d3'), [0.05, 0.14], [0.08, 0.24], [d, d + 0.002]);                               // etiqueta
  disc(g, M.lacquer('#d9d9d6'), -0.06, 0.16, d, 0.028, 0.014);
  cyl(g, M.metal('#b5b8bb', 0.45), 0, h, h + flue, d / 2, 0.05, 24);                                     // conducto
  for (const x of [-0.09, 0, 0.09]) cyl(g, steel, x, -0.1, 0, 0.05, 0.009, 10);                           // caños
  g.userData.h = h + flue;
  return g;
}

// bajo mesada: zócalo, cuerpo, frentes por módulo, perfil gola, mesada con bacha y salpicadero
function kitchenBase(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 1.5, d = p.depth ?? 0.6, h = p.height ?? 0.9, tt = 0.03;
  // "material": "wood" = cuerpo y frentes de madera; "topStyle": "steel" = mesada de acero inoxidable (con "edge": canto
  // de otro color al frente); "handles": "knob" = perillas de madera; "sink": { x, w, d, "double", "faucet": "wall" }
  const back = -d / 2, face = d / 2 - 0.022, body = p.material === 'wood' ? M.wood(p.color ?? '#c8924f') : M.lacquer(p.color ?? '#f4f4f2');
  const top = p.topStyle === 'granite' ? M.granite(p.top ?? '#2b2c2e') : p.topStyle === 'steel' ? M.brushed(p.top ?? '#cdd0d3') : M.ceramic(p.top ?? '#f1efea');
  const knob = p.handles === 'knob', knobM = M.wood(shade(p.color ?? '#c8924f', -0.12)), knobAt = (x, y) => { add(g, new THREE.SphereGeometry(0.016, 14, 10), knobM, x, y, d / 2 + 0.01).scale.z = 0.75; };
  const alu = M.metal('#b9bcc0', 0.35), steel = M.metal('#c9ccd0', 0.28);
  const s = p.sink, sx0 = s ? s.x - s.w / 2 : 0, sx1 = s ? s.x + s.w / 2 : 0, scz = s?.z ?? 0, sz0 = scz - (s?.d ?? 0) / 2, sz1 = scz + (s?.d ?? 0) / 2;
  const sdep = 0.18, band = h - tt - 0.2, fh0 = 0.103, fh1 = h - tt - 0.035;
  const modules = p.modules ?? [{ w, kind: 'doors', count: 2 }];
  // tramos con mueble: un módulo "open" deja solo la mesada sobre un hueco (tacho, lavarropas)
  const runs = [];
  let x = -w / 2;
  for (const m of modules) {
    const last = runs[runs.length - 1];
    if (m.kind !== 'open') { if (last && Math.abs(last[1] - x) < 1e-6) last[1] = x + m.w; else runs.push([x, x + m.w]); }
    x += m.w;
  }
  for (const [r0, r1] of runs) {
    const sink = s && sx0 >= r0 && sx1 <= r1;
    blk(g, M.lacquer('#8d9096'), [r0 + 0.002, r1 - 0.002], [0, 0.1], [back, face - 0.04]);
    blk(g, body, [r0, r1], [0.1, sink ? band : h - tt], [back, face]);
    if (sink) {   // franja de arriba partida alrededor de la bacha
      blk(g, body, [r0, sx0], [band, h - tt], [back, face]);
      blk(g, body, [sx1, r1], [band, h - tt], [back, face]);
      blk(g, body, [sx0, sx1], [band, h - tt], [back, sz0]);
      blk(g, body, [sx0, sx1], [band, h - tt], [sz1, face]);
    }
    if (!knob) blk(g, alu, [r0, r1], [fh1 + 0.004, h - tt - 0.003], [face, face + 0.006]);   // perfil gola
    else blk(g, body, [r0 + 0.002, r1 - 0.002], [fh1 + 0.002, h - tt - 0.002], [face - 0.004, face + 0.012], 0.003);   // travesaño de arriba
  }
  x = -w / 2;
  for (const m of modules) {
    const x0 = x + 0.0015, x1 = x + m.w - 0.0015, n = m.count ?? (m.kind === 'drawers' ? 3 : 1);
    if (m.kind === 'open') { x += m.w; continue; }
    if (m.kind === 'drawers') {
      const hh = (fh1 - fh0) / n;
      for (let i = 0; i < n; i++) {
        blk(g, body, [x0, x1], [fh0 + i * hh + 0.0015, fh0 + (i + 1) * hh - 0.0015], [face, d / 2], 0.003);
        if (knob) knobAt((x0 + x1) / 2, fh0 + (i + 0.5) * hh);
        else if (p.handles) pull(g, alu, 'x', (x0 + x1) / 2 - 0.09, (x0 + x1) / 2 + 0.09, fh0 + (i + 1) * hh - 0.04, d / 2, 0.018, 0.006);
      }
    } else if (m.kind === 'oven') {   // horno bajo mesada: frente de vidrio oscuro con manija
      blk(g, M.metal('#c9ccd0', 0.3), [x0, x1], [fh0, fh1], [face, d / 2 - 0.004], 0.003);
      blk(g, M.screen(), [x0 + 0.03, x1 - 0.03], [fh0 + 0.08, fh1 - 0.12], [d / 2 - 0.004, d / 2], 0.003).castShadow = false;
      pull(g, alu, 'x', x0 + 0.05, x1 - 0.05, fh1 - 0.06, d / 2 - 0.004, 0.024, 0.007);
    } else {
      const ww = (x1 - x0) / n;
      for (let i = 0; i < n; i++) {
        blk(g, body, [x0 + i * ww + 0.0015, x0 + (i + 1) * ww - 0.0015], [fh0, fh1], [face, d / 2], 0.003);
        const hx = n > 1 ? x0 + (i + 0.5) * ww + (i % 2 ? -1 : 1) * (ww / 2 - 0.05) : x1 - 0.05;
        if (knob) knobAt(hx, fh1 - 0.07);
        else if (p.handles) pull(g, alu, 'y', fh1 - 0.2, fh1 - 0.04, hx, d / 2, 0.018, 0.006);
      }
    }
    x += m.w;
  }
  const ty = [h - tt, h], cz1 = d / 2 + 0.02;
  if (p.bar) {   // barra hacia el comedor: muro bajo revestido detrás de la mesada y tapa de madera más alta
    const b = p.bar, bh = b.height ?? 1.05, bd = b.depth ?? 0.3;
    const pan = blk(g, M.boards(b.panel ?? '#b9b6b0', 'boards'), [-w / 2, w / 2], [0, bh - 0.04], [back - 0.1, back], 0, 0.3);
    blk(g, M.wood(b.top ?? '#c8925e'), [-w / 2 - 0.02, w / 2 + 0.02], [bh - 0.04, bh], [back - bd, back + 0.04], 0.006);
  }
  if (!s) blk(g, top, [-w / 2, w / 2], ty, [back, cz1], 0.003);
  else {
    blk(g, top, [-w / 2, sx0], ty, [back, cz1]); blk(g, top, [sx1, w / 2], ty, [back, cz1]);
    blk(g, top, [sx0, sx1], ty, [back, sz0]); blk(g, top, [sx0, sx1], ty, [sz1, cz1]);
    const yb = h - tt - sdep, t = 0.008, bowls = s.double ? [[sx0, s.x - 0.012], [s.x + 0.012, sx1]] : [[sx0, sx1]];
    for (const [b0, b1] of bowls) {
      blk(g, steel, [b0, b1], [yb, yb + t], [sz0, sz1]);
      blk(g, steel, [b0, b0 + t], [yb + t, h - 0.002], [sz0, sz1]); blk(g, steel, [b1 - t, b1], [yb + t, h - 0.002], [sz0, sz1]);
      blk(g, steel, [b0 + t, b1 - t], [yb + t, h - 0.002], [sz0, sz0 + t]); blk(g, steel, [b0 + t, b1 - t], [yb + t, h - 0.002], [sz1 - t, sz1]);
      cyl(g, M.lacquer('#55585c'), (b0 + b1) / 2, yb + t, yb + t + 0.002, scz, 0.03, 20);
    }
    if (s.double) blk(g, top, [s.x - 0.012, s.x + 0.012], ty, [sz0, sz1]);   // puente entre las dos bachas
    if (s.faucet === 'wall') {   // canilla de pared: dos llaves de cruz y un pico largo sobre la bacha, a 30 cm de la mesada
      for (const dx of [-0.09, 0.09]) { const tp = crossTap(M); tp.position.set(s.x + dx, h + 0.3, back); g.add(tp); }
      disc(g, steel, s.x, h + 0.3, back, 0.024, 0.008, 20);
      add(g, spoutGeo(scz - back + 0.04, 0.09, 0.012), steel, s.x, h + 0.3, back);
    }
    const fz = sz0 - 0.05;                                               // grifería
    if (s.faucet !== 'wall') {
    cyl(g, steel, s.x, h, h + 0.03, fz, 0.022, 20);
    cyl(g, steel, s.x, h + 0.03, h + 0.26, fz, 0.013, 16);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(s.x, h + 0.255, fz), new THREE.Vector3(s.x, h + 0.33, fz + 0.07), new THREE.Vector3(s.x, h + 0.2, fz + 0.18));
    add(g, new THREE.TubeGeometry(curve, 24, 0.011, 10), steel);
    blk(g, steel, [s.x - 0.008, s.x + 0.008], [h + 0.1, h + 0.115], [fz - 0.05, fz], 0.004);
    }
  }
  if (p.edge) blk(g, M.lacquer(p.edge), [-w / 2 - 0.002, w / 2 + 0.002], [h - 0.034, h - 0.004], [cz1 - 0.004, cz1 + 0.003], 0.003);   // canto de la mesada
  if (p.backsplash) blk(g, M.paint(p.backsplash.color ?? '#cfcfcd'), [-w / 2, w / 2], [h, h + (p.backsplash.height ?? 0.6)], [back, back + 0.008]);
  return g;
}

// alacenas: módulos con puertas o un nicho abierto con estante (para el horno eléctrico). Ojo: el origen está en el centro
// de su profundidad ("depth"), no en el fondo: contra una pared van a depth / 2 de ella
function kitchenWall(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 1.5, d = p.depth ?? 0.33, y0 = p.y0 ?? 1.5, h = p.height ?? 0.75;
  const body = p.material === 'wood' ? M.wood(p.color ?? '#d6b48a') : M.lacquer(p.color ?? '#f4f4f2'), fz = d / 2 - 0.02;
  let x = -w / 2;
  for (const m of p.modules ?? [{ w, kind: 'doors', count: 2 }]) {
    const x0 = x, x1 = x + m.w;
    const ya = m.kind === 'open' ? y0 + h - (m.closedTop ?? 0.3) : y0;
    blk(g, body, [x0, x1], [ya, y0 + h], [-d / 2, fz]);
    const n = m.kind === 'open' ? 1 : (m.count ?? 1), ww = (x1 - x0) / n;
    for (let i = 0; i < n; i++) blk(g, body, [x0 + i * ww + 0.0015, x0 + (i + 1) * ww - 0.0015], [ya + 0.0015, y0 + h - 0.0015], [fz, d / 2], 0.003);
    // "handles": "knob" = perilla de madera abajo, del lado que abre cada puerta
    if (p.handles === 'knob' && m.kind !== 'open') for (let i = 0; i < n; i++) {
      const kx = n > 1 ? x0 + (i + 0.5) * ww + (i % 2 ? -1 : 1) * (ww / 2 - 0.04) : x1 - 0.04;
      add(g, new THREE.SphereGeometry(0.016, 14, 10), M.wood(shade(p.color ?? '#d6b48a', -0.12)), kx, y0 + 0.06, d / 2 + 0.01).scale.z = 0.75;
    }
    if (m.kind === 'open') blk(g, body, [x0, x1], [y0, y0 + 0.02], [-d / 2, d / 2], 0.002);
    // nicho abierto como caja ("box": true): costados, fondo y "shelves" estantes; "inside": color de madera del interior
    if (m.kind === 'open' && m.box) {
      const t = 0.016, inner = m.inside ? M.wood(m.inside) : body, yb = y0 + 0.02;
      for (const [a, b] of [[x0, x0 + t], [x1 - t, x1]]) blk(g, body, [a, b], [yb, ya], [-d / 2, d / 2 - 0.002]);
      blk(g, inner, [x0 + t, x1 - t], [yb, ya], [-d / 2, -d / 2 + 0.008]);
      const ns = m.shelves ?? 1;
      for (let i = 1; i <= ns; i++) { const ys = yb + (ya - yb) * i / (ns + 1); blk(g, inner, [x0 + t, x1 - t], [ys - t / 2, ys + t / 2], [-d / 2 + 0.008, d / 2 - 0.012]); }
    }
    x = x1;
  }
  return g;
}

// tira LED (fondo arriba, en y = 0): se pega bajo una alacena o un estante; de noche ilumina hacia abajo
function ledStrip(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 1.5;
  blk(g, M.led(), [-w / 2, w / 2], [-0.007, 0], [-0.006, 0.006]).castShadow = false;
  const l = new THREE.RectAreaLight(WARM, 0, w, 0.05);
  l.position.set(0, -0.009, 0); l.rotation.x = -Math.PI / 2; l.userData.night = p.intensity ?? 12; g.add(l);
  return g;
}

// plafón LED cuadrado de superficie (balcones, pasillos)
function panelLight(p, { M, H }) {
  const g = new THREE.Group(), s = p.size ?? 0.22, t = 0.035;
  blk(g, M.lacquer(p.color ?? '#f2f2f0'), [-s / 2, s / 2], [H - t, H], [-s / 2, s / 2], 0.004);
  blk(g, M.led(), [-s / 2 + 0.018, s / 2 - 0.018], [H - t - 0.004, H - t + 0.002], [-s / 2 + 0.018, s / 2 - 0.018]).castShadow = false;
  lampSpot(g, 0, H - t - 0.01, 0, p.intensity ?? 8, 1.25, 5);
  return g;
}

// lámpara de pie con pantalla de tela: de noche la pantalla brilla y da una luz cálida baja. "style": "arc" (arco que
// cuelga una campana hacia +Z) o "tripod" (tres patas de madera)
function floorLamp(p, { M }) {
  const g = new THREE.Group(), h = p.height ?? 1.55, metal = M.metal(p.color ?? '#1e1f21', 0.45);
  if (p.style === 'arc') {
    const reach = p.reach ?? 1.1, top = h + 0.35;
    blk(g, M.ceramic(p.base ?? '#e9e6e0'), [-0.14, 0.14], [0, 0.1], [-0.14, 0.14], 0.01);   // base pesada
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.09, 0), new THREE.Vector3(0, top + 0.25, reach * 0.25), new THREE.Vector3(0, h - 0.02, reach));
    add(g, new THREE.TubeGeometry(curve, 40, 0.012, 10), metal);
    add(g, new THREE.LatheGeometry(v2([[0.012, h + 0.005], [0.06, h - 0.01], [0.17, h - 0.15], [0.18, h - 0.19]]), 40), M.shadeGlow(p.shade ?? '#2a2b2d'), 0, -0.02, reach).castShadow = false;
    add(g, new THREE.SphereGeometry(0.03, 16, 12), M.glow(), 0, h - 0.13, reach).castShadow = false;
    lampSpot(g, 0, h - 0.12, reach, p.intensity ?? 6, 1.0, 5);
    g.userData.h = top;
    return g;
  }
  if (p.style === 'tripod') {
    const wood = M.wood(p.wood ?? '#b8875a'), jy = h - 0.45;
    for (let i = 0; i < 3; i++) {   // patas desde el piso hasta la unión, que es una esfera chica
      const a = i * Math.PI * 2 / 3, foot = new THREE.Vector3(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3), joint = new THREE.Vector3(0, jy, 0), d = joint.clone().sub(foot);
      const leg = add(g, new THREE.CylinderGeometry(0.012, 0.016, d.length(), 10), wood); leg.position.copy(foot).addScaledVector(d, 0.5); leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    }
    add(g, new THREE.SphereGeometry(0.03, 16, 12), metal, 0, jy, 0);
    cyl(g, metal, 0, jy, h - 0.12, 0, 0.01, 10);
  } else {
    cyl(g, metal, 0, 0, 0.02, 0, 0.14, 40);
    cyl(g, metal, 0, 0.02, h - 0.12, 0, 0.011, 12);
  }
  add(g, new THREE.CylinderGeometry(0.19, 0.21, 0.3, 48, 1, true), M.shadeGlow(p.shade ?? '#efe6d6'), 0, h - 0.15, 0).castShadow = false;
  add(g, new THREE.SphereGeometry(0.03, 16, 12), M.glow(), 0, h - 0.17, 0).castShadow = false;
  lampPoint(g, 0, h - 0.17, 0, p.intensity ?? 4.5, 5);
  g.userData.h = h;
  return g;
}

// mesa puesta para uno: individual redondo de yute, plato y copa (apoyado sobre la mesa con "y")
function tableSetting(p, { M }) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(p.matSize ?? 0.18, p.matSize ?? 0.18, 0.004, 48), M.knit(p.mat ?? '#b49a76'), 0, 0.002, 0).castShadow = false;
  if (p.plate === false) return g;   // solo el individual (mesa a la espera)
  add(g, new THREE.LatheGeometry(v2([[0.001, 0.004], [0.09, 0.004], [0.12, 0.016], [0.135, 0.024], [0.128, 0.026], [0.112, 0.02], [0.085, 0.012], [0.001, 0.012]]), 48), M.ceramic(p.plate ?? '#ece7df'));
  add(g, new THREE.LatheGeometry(v2([[0.001, 0], [0.035, 0], [0.036, 0.004], [0.005, 0.009], [0.003, 0.1], [0.022, 0.115], [0.04, 0.16], [0.038, 0.215], [0.036, 0.215],
    [0.037, 0.16], [0.02, 0.118], [0.001, 0.113]]), 32), M.glass(), -0.12, 0, 0.14).castShadow = false;   // copa arriba a la derecha de quien se sienta (mira hacia +Z)
  return g;
}

/* ---------- baño ---------- */
// bañera enlozada con grifería; "jets": hidromasaje, "apron": frente revestido
function bathtub(p, { M }) {
  const g = new THREE.Group(), L = p.length ?? 1.5, W = p.width ?? 0.7, h = p.height ?? 0.55, rim = 0.07, cer = M.ceramic('#f7f7f5');
  add(g, ringGeo([-L / 2, -W / 2, L, W, 0.02], [-L / 2 + rim, -W / 2 + rim, L - 2 * rim, W - 2 * rim, 0.14], h), cer);
  add(g, flatGeo([-L / 2 + rim, -W / 2 + rim, L - 2 * rim, W - 2 * rim, 0.14]), cer, 0, 0.14, 0).castShadow = false;
  cyl(g, M.metal('#c9ccd0', 0.25), -L / 2 + 0.2, 0.14, 0.143, 0, 0.025, 20);
  if (p.jets) for (const [x, y] of [[-0.35, 0.35], [0.05, 0.35], [0.45, 0.35], [-0.15, 0.25], [0.25, 0.25]]) { const j = cyl(g, M.metal('#c9ccd0', 0.2), x * L / 1.5, h * y / 0.55 * 0.5 + 0.1, h * y / 0.55 * 0.5 + 0.11, W / 2 - rim - 0.002, 0.018, 16); j.rotation.x = Math.PI / 2; }
  if (p.faucet) {   // grifería de pared en la punta -X (la del desagüe): tres llaves de cruz, pico y brazo con flor ("headHeight")
    const f = new THREE.Group(), chrome = M.metal('#cfd2d6', 0.2); f.position.set(-L / 2, 0, 0); f.rotation.y = Math.PI / 2; g.add(f);
    for (const x of [-0.15, 0, 0.15]) { const t = crossTap(M); t.position.set(x, h + 0.24, 0); f.add(t); }
    add(f, spoutGeo(0.13, 0.04, 0.013), chrome, 0, h + 0.09, 0);
    disc(f, chrome, 0, h + 0.09, 0, 0.026, 0.008, 20);
    const hh = p.headHeight ?? 1.95;
    add(f, new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, hh, 0.006), new THREE.Vector3(0, hh + 0.03, 0.15), new THREE.Vector3(0, hh - 0.02, 0.28)), 16, 0.011, 10), chrome);
    disc(f, chrome, 0, hh, 0, 0.026, 0.008, 20);
    const head = add(f, new THREE.LatheGeometry(v2([[0.001, -0.012], [0.05, -0.008], [0.055, 0.0], [0.02, 0.03], [0.001, 0.032]]), 32), chrome, 0, hh - 0.05, 0.28);
    head.rotation.x = 0.2;
  }
  if (p.apron) {   // faldón revestido con el mismo porcelanato de la pared, apenas más alto que el borde
    const tile = M.floor(p.apron, 'tile');
    blk(g, tile, [-L / 2 - 0.06, L / 2 + 0.06], [0, h + 0.03], [W / 2, W / 2 + 0.08], 0, 1.2);
  }
  return g;
}

// barral con cortina de baño, a lo largo de X local; la cortina cubre de "from" a "to" medidos desde -X
function showerCurtain(p, { M }) {
  const g = new THREE.Group(), L = p.length ?? 1.5, y = p.rodHeight ?? 2.0, c0 = p.from ?? 0, c1 = p.to ?? L, h = p.height ?? 1.8;
  const white = M.ceramic('#f4f4f2');
  bar(g, white, 'x', -L / 2, L / 2, y, 0, 0.013, 16);
  add(g, foldedClothGeo(c1 - c0, h, 0.11, 0.03, 3), M.cloth(p.color ?? '#e4e4e2'), -L / 2 + c0, y - 0.019, 0);   // cuelga de los aros
  const rg = new THREE.TorusGeometry(0.017, 0.003, 6, 16), rm = M.metal('#c9ccd0', 0.3);
  for (let x = c0 + 0.02; x < c1; x += 0.11) { const r = add(g, rg, rm, -L / 2 + x, y, 0); r.rotation.y = Math.PI / 2; r.castShadow = false; }
  // "return": barral en L, con un segundo tramo de esa largo que sale hacia +Z desde la punta +X (ducha en esquina)
  if (p.return) {
    const R = p.return, cg = new THREE.Group(); cg.position.set(L / 2, 0, 0); cg.rotation.y = -Math.PI / 2; g.add(cg);
    add(g, new THREE.SphereGeometry(0.016, 12, 8), white, L / 2, y, 0);   // codo
    bar(cg, white, 'x', 0, R, y, 0, 0.013, 16);
    add(cg, foldedClothGeo(R - 0.02, h, 0.11, 0.03, 9), M.cloth(p.color ?? '#e4e4e2'), 0.02, y - 0.019, 0);
    for (let x = 0.04; x < R; x += 0.11) { const r = add(cg, rg, rm, x, y, 0); r.rotation.y = Math.PI / 2; r.castShadow = false; }
  }
  return g;
}

// inodoro con mochila (fondo en -Z) y tapa cerrada
function toilet(p, { M }) {
  const g = new THREE.Group(), cer = M.ceramic('#f7f7f5');
  // el perfil arranca en el borde de abajo, sin la base cerrada: con ella, la normal de la esquina se promediaba con la
  // del fondo (hacia el piso) y los primeros 6 cm de loza se veían negros (2026-11-07)
  const bowl = add(g, new THREE.LatheGeometry(v2([[0.12, 0], [0.11, 0.06], [0.1, 0.2], [0.14, 0.33], [0.172, 0.385], [0.16, 0.395], [0.12, 0.34], [0.001, 0.3]]), 40), M.ceramicDS('#f7f7f5'), 0, 0, 0.06);
  bowl.scale.set(1, 1, 1.3);
  const seat = add(g, new THREE.TorusGeometry(0.148, 0.022, 10, 40), cer, 0, 0.408, 0.06);
  seat.rotation.x = Math.PI / 2; seat.scale.set(1, 1.3, 0.6);
  add(g, new THREE.SphereGeometry(1, 32, 10, 0, Math.PI * 2, 0, Math.PI / 2), cer, 0, 0.42, 0.06).scale.set(0.17, 0.032, 0.22);
  if (p.cistern === 'valve') {   // sin mochila: cuello de loza hasta la pared y válvula de descarga cromada en la pared, al costado ("valveSide")
    blk(g, cer, [-0.13, 0.13], [0.06, 0.4], [-0.27, -0.12], 0.03);
    const vx = (p.valveSide ?? 1) * 0.3, chrome = M.metal('#cfd2d6', 0.2);
    blk(g, chrome, [vx - 0.065, vx + 0.065], [0.72, 0.82], [-0.27, -0.252], 0.014);
    add(g, new THREE.CylinderGeometry(0.022, 0.024, 0.014, 24), chrome, vx, 0.77, -0.246).rotation.x = Math.PI / 2;
    return g;
  }
  if (p.cistern === 'wall') {   // mochila embutida: cuello de loza hasta la pared y tecla de descarga en la pared, a 1 m
    blk(g, cer, [-0.13, 0.13], [0.06, 0.4], [-0.27, -0.12], 0.03);
    blk(g, cer, [-0.12, 0.12], [0.92, 1.08], [-0.27, -0.255], 0.012);
    blk(g, M.metal('#c9ccd0', 0.25), [-0.035, 0.035], [0.985, 1.015], [-0.256, -0.248], 0.004);
    return g;
  }
  blk(g, cer, [-0.18, 0.18], [0.36, 0.74], [-0.27, -0.1], 0.03);
  cyl(g, M.metal('#c9ccd0', 0.25), 0, 0.74, 0.746, -0.185, 0.025, 20);
  return g;
}

// bidet de cerámica con grifería (fondo en -Z)
function bidet(p, { M }) {
  const g = new THREE.Group();
  const bowl = add(g, new THREE.LatheGeometry(v2([[0.12, 0], [0.11, 0.06], [0.1, 0.2], [0.14, 0.33], [0.165, 0.385], [0.155, 0.395], [0.115, 0.35], [0.06, 0.29], [0.001, 0.285]]), 40), M.ceramicDS('#f7f7f5'), 0, 0, 0.02);
  bowl.scale.set(1, 1, 1.25);
  const steel = M.metal('#c9ccd0', 0.25);
  cyl(g, steel, 0, 0.39, 0.43, -0.14, 0.018, 16);
  blk(g, steel, [-0.008, 0.008], [0.425, 0.44], [-0.14, -0.06], 0.005);
  return g;
}

// escritorio rebatible de pared, cerrado: tablero de madera colgado y un estante angosto arriba sobre ménsulas negras
// (fondo en z = 0; "y0" es la altura del borde de abajo del tablero)
function wallDesk(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.8, h = p.height ?? 0.5, y0 = p.y0 ?? 1.1, wood = M.wood(p.color ?? '#c9a06a'), dark = M.lacquer('#1f2023');
  blk(g, wood, [-w / 2, w / 2], [y0, y0 + h], [0, 0.035], 0.004);                                  // tablero plegado
  const ys = y0 + h + 0.07;
  blk(g, wood, [-w / 2 - 0.04, w / 2 + 0.04], [ys, ys + 0.025], [0, 0.17], 0.003);                 // estante
  for (const sx of [-1, 1]) blk(g, dark, [sx * (w / 2 - 0.1) - 0.012, sx * (w / 2 - 0.1) + 0.012], [ys - 0.06, ys], [0, 0.14], 0.002);   // ménsulas
  return g;
}

// vanitory colgado: mueble con puerta y mesada con bacha integrada; opcional, toallero de aro con toalla.
// "style": "basin" = solo la bacha de loza colgada de la pared, con su sifón a la vista (sin mueble); "pedestal" =
// lavatorio de pie (columna de loza hasta el piso). "taps": "cross" = dos llaves de cruz y pico corto (grifería clásica)
function vanity(p, { M }) {
  const ped = p.style === 'pedestal', basin = p.style === 'basin' || ped, g = new THREE.Group(), w = p.width ?? 0.5, d = p.depth ?? 0.42, y0 = p.y0 ?? (basin ? 0.72 : 0.45), ch = basin ? 0 : 0.3, bh = 0.12;
  const body = p.material === 'wood' ? M.wood(p.color ?? '#a8784c') : M.lacquer('#f3f3f1'), cer = M.ceramic('#f7f7f5'), steel = M.metal('#c9ccd0', 0.25);
  if (ped) {   // columna de loza: ancha abajo, angosta al medio y abierta arriba bajo la bacha
    const col = add(g, new THREE.LatheGeometry(v2([[0.001, 0], [0.1, 0], [0.105, 0.01], [0.085, 0.05], [0.066, 0.22], [0.062, y0 - 0.2], [0.075, y0 - 0.05], [0.1, y0 + 0.012], [0.001, y0 + 0.012]]), 40), cer, 0, 0, -d / 2 + 0.15);
    col.scale.z = 0.75;
  } else if (basin) {   // sifón: baja del centro de la bacha y entra en la pared
    cyl(g, steel, 0, y0 - 0.22, y0 + 0.01, -0.02, 0.018, 16);
    bar(g, steel, 'z', -d / 2, -0.02, y0 - 0.2, 0, 0.016);
  } else blk(g, body, [-w / 2, w / 2], [y0, y0 + ch], [-d / 2, d / 2 - 0.02], 0.004);
  if (p.drawers && !basin) for (let i = 0; i < p.drawers; i++) {   // cajones con tirador negro, en lugar de puertas
    const hh = (ch - 0.006) / p.drawers, yb = y0 + 0.003 + i * hh;
    blk(g, body, [-w / 2 + 0.002, w / 2 - 0.002], [yb + 0.002, yb + hh - 0.002], [d / 2 - 0.02, d / 2], 0.003);
    blk(g, M.lacquer('#1d1d1f'), [-0.08, 0.08], [yb + hh - 0.05, yb + hh - 0.035], [d / 2, d / 2 + 0.015], 0.003);
  }
  const nd = basin || p.drawers ? 0 : (p.doors ?? 1), dw = (w - 0.004) / Math.max(1, nd), alu = M.metal('#c9ccd0', 0.3);   // puertas con tirador corto arriba
  for (let i = 0; i < nd; i++) {
    const x0 = -w / 2 + 0.002 + i * dw;
    blk(g, body, [x0 + (i ? 0.0015 : 0), x0 + dw - (i < nd - 1 ? 0.0015 : 0)], [y0 + 0.003, y0 + ch - 0.003], [d / 2 - 0.02, d / 2], 0.003);
    if (p.handles) { const hx = nd > 1 ? x0 + dw / 2 + (i ? -1 : 1) * (dw / 2 - 0.05) : 0; blk(g, alu, [hx - 0.022, hx + 0.022], [y0 + ch - 0.05, y0 + ch - 0.035], [d / 2, d / 2 + 0.014], 0.003); }
  }
  const hole = [-w / 2 + 0.05, -d / 2 + 0.06, w - 0.1, d - 0.16, ped ? 0.09 : 0.05];   // y invertida: margen de atrás más ancho para la grifería
  add(g, ringGeo([-w / 2 - 0.01, -d / 2 - 0.01, w + 0.02, d + 0.01, ped ? 0.11 : 0.01], hole, bh), cer, 0, y0 + ch, 0);
  add(g, flatGeo(hole), cer, 0, y0 + ch + 0.035, 0).castShadow = false;
  const fz = -d / 2 + 0.05, ty = y0 + ch + bh;
  if (p.taps === 'cross') {   // dos llaves de cruz mirando hacia arriba y un pico corto al centro
    for (const sx of [-0.085, 0.085]) { const t = crossTap(M); t.position.set(sx, ty, fz); t.rotation.x = -Math.PI / 2; g.add(t); }
    cyl(g, steel, 0, ty, ty + 0.035, fz, 0.016, 16);
    add(g, spoutGeo(0.08, 0.025, 0.012), steel, 0, ty + 0.03, fz);
  } else {
    cyl(g, steel, 0, ty, ty + 0.1, fz, 0.016, 16);
    blk(g, steel, [-0.008, 0.008], [ty + 0.08, ty + 0.095], [fz, fz + 0.09], 0.004);
  }
  if (p.towel) {
    const tx = w / 2 - 0.12, ty2 = y0 - 0.081;   // el aro cuelga tocando el fondo del mueble
    add(g, new THREE.TorusGeometry(0.075, 0.006, 8, 40), steel, tx, ty2, d / 2 - 0.03).castShadow = false;
    blk(g, M.fabric(p.towelColor ?? '#c9b79c'), [tx - 0.12, tx + 0.12], [ty2 - 0.45, ty2 - 0.05], [d / 2 - 0.05, d / 2 - 0.012], 0.02, 0.2);
  }
  return g;
}

// dispensers de pared en acero ("count"), para jabón y shampoo de la ducha
function wallDispensers(p, { M }) {
  const g = new THREE.Group(), steel = M.metal('#c9ccd0', 0.3), n = p.count ?? 3;
  blk(g, steel, [-0.06 * n, 0.06 * n], [0.17, 0.19], [0, 0.02], 0.004);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.08;
    cyl(g, steel, x, 0.02, 0.18, 0.05, 0.032, 24);
    blk(g, M.lacquer('#2a2a2a'), [x - 0.012, x + 0.012], [0.03, 0.05], [0.08, 0.095], 0.004);
  }
  return g;
}

// revestimiento cerámico sobre una pared (fondo en z = 0): placas de "tile" [ancho, alto] con junta, empezando
// en la esquina de abajo a la izquierda. 14 mm de espesor para tapar el zócalo de 12 mm sin compartir su cara.
function wallTiles(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 1, h = p.height ?? 0.6, t = p.thickness ?? 0.014, [tw, th] = p.tile ?? [0.6, 0.3];
  const m = blk(g, M.floor(p.color ?? '#e3dccf', 'tile'), [-w / 2, w / 2], [0, h], [0, t], 0, 2 * tw);
  const uv = m.geometry.attributes.uv;   // la textura trae 2 × 2 placas por repetición
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + w / (4 * tw), (uv.getY(i) + h / (4 * tw)) * tw / th);
  // "texture": imagen del revestimiento tomada de las fotos (T-23), repetida cada "textureSize" metros desde la esquina de
  // abajo a la izquierda; el motor la carga y reemplaza la textura procedural
  if (p.texture) {
    const pos = m.geometry.attributes.position, S = p.textureSize ?? 2 * tw;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / S, (pos.getY(i) + h / 2) / S);
    m.userData.imageTex = p.texture;
  }
  g.userData.h = h;
  return g;
}

// receptáculo de ducha con grifería de pared (el fondo en -Z es la pared): 3 llaves con pico y flor de lluvia con brazo
function shower(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.8, d = p.depth ?? 0.8, hh = p.headHeight ?? 2.0, vx = p.valvesX ?? 0;
  // "tray": color del receptáculo; "cladding": receptáculo revestido con baldosas de ese color en lugar de cerámica
  const cer = M.ceramic(p.tray ?? '#f7f7f5'), steel = M.metal('#c9ccd0', 0.22), wall = -d / 2;
  add(g, ringGeo([-w / 2, -d / 2, w, d, 0.015], [-w / 2 + 0.05, -d / 2 + 0.05, w - 0.1, d - 0.1, 0.03], 0.07), p.cladding ? M.floor(p.cladding, 'tile') : cer);
  add(g, flatGeo([-w / 2 + 0.05, -d / 2 + 0.05, w - 0.1, d - 0.1, 0.03]), p.cladding ? M.floor(p.cladding, 'tile') : cer, 0, 0.035, 0).castShadow = false;
  cyl(g, steel, 0, 0.035, 0.037, 0, 0.035, 24).castShadow = false;                                         // desagüe
  for (const dx of [-0.11, 0, 0.11]) {                                                                    // llaves
    disc(g, steel, vx + dx, 1.05, wall, 0.03, 0.006);
    disc(g, steel, vx + dx, 1.05, wall + 0.006, 0.014, 0.04);
    blk(g, steel, [vx + dx - 0.007, vx + dx + 0.007], [1.035, 1.065], [wall + 0.036, wall + 0.05], 0.003);
  }
  disc(g, steel, vx, 0.86, wall, 0.026, 0.006);                                                            // pico
  bar(g, steel, 'z', wall + 0.006, wall + 0.13, 0.86, vx, 0.013);
  cyl(g, steel, vx, 0.82, 0.86, wall + 0.12, 0.011, 12);
  const top = new THREE.Group(); g.add(top);                                                              // flor y brazo
  disc(top, steel, 0, hh + 0.1, wall, 0.03, 0.006);
  bar(top, steel, 'z', wall + 0.006, wall + 0.36, hh + 0.1, 0, 0.01);
  cyl(top, steel, 0, hh + 0.012, hh + 0.1, wall + 0.35, 0.008, 12);
  cyl(top, steel, 0, hh, hh + 0.012, wall + 0.35, 0.1, 40);
  return g;
}

// espejo sin marco con forma de cápsula (puntas semicirculares arriba y abajo); fondo en z = 0, base en y = 0
function capsuleMirror(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.45, h = p.height ?? 0.8;
  const capsule = (cw, ch, dy) => {
    const r = cw / 2, s = new THREE.Shape();
    s.moveTo(-r, dy + r); s.absarc(0, dy + r, r, Math.PI, Math.PI * 2, false);
    s.lineTo(r, dy + ch - r); s.absarc(0, dy + ch - r, r, 0, Math.PI, false); s.lineTo(-r, dy + r);
    return s;
  };
  add(g, new THREE.ExtrudeGeometry(capsule(w - 0.04, h - 0.04, 0.02), { depth: 0.011, bevelEnabled: false, curveSegments: 24 }), M.lacquer('#2a2a2a'));
  add(g, new THREE.ExtrudeGeometry(capsule(w, h, 0), { depth: 0.005, bevelEnabled: false, curveSegments: 40 }), M.mirror(), 0, 0, 0.012).castShadow = false;
  g.userData.h = h;
  return g;
}

// toallero de barra con una toalla colgada; fondo en z = 0, la barra a la altura del item
function towelBar(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.4, steel = M.metal('#c9ccd0', 0.25), z = 0.055;
  for (const s of [-1, 1]) { disc(g, steel, s * w / 2, 0, 0, 0.016, 0.006); bar(g, steel, 'z', 0.006, z, 0, s * w / 2, 0.007); }
  bar(g, steel, 'x', -w / 2 - 0.008, w / 2 + 0.008, 0, z, 0.008);
  if (p.towel !== false) {
    const tw = Math.min(w - 0.06, 0.3);
    blk(g, M.fabric(p.towelColor ?? '#d8d2c8'), [-tw / 2, tw / 2], [-0.34, 0.022], [z - 0.024, z + 0.024], 0.014, 0.2);
  }
  g.userData.h = 0.03;
  return g;
}

// alfombra de baño de toalla
function bathMat(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.8, d = p.depth ?? 0.5;
  add(g, uvScale(new RoundedBoxGeometry(w, 0.014, d, 2, 0.006), 2), M.quilt(p.color ?? '#f2f1ee'), 0, 0.007, 0).castShadow = false;
  return g;
}

/* ---------- escaleras, barandas y revestimientos ---------- */
// escalera recta abierta: arranca en +Z (frente) y sube hacia -Z; peldaños de madera sin alzada y una zanca de chapa
// del lado libre ("open": -1 = lado -X, 1 = lado +X; el otro lado va contra la pared)
// "turn" (2026-11-09, depto 7): escalera en L con peldaños compensados al pie. "turn": -1 o 1 = de qué lado (X local)
// arranca el tramo de abajo; "before" peldaños de ese tramo (suben hacia el cuadrado del giro), "winders" peldaños en
// abanico que giran 90° en un cuadrado de "width" × "width" en el frente (+Z) y el resto sube recto hacia -Z. "run" es el
// largo total sobre Z (tramo recto + cuadrado); el tramo de abajo sobresale "before" × "beforeGo" hacia el lado del giro.
// "rail": baranda de planchuela del lado libre del tramo recto (color de la zanca)
function stair(p, { M }) {
  if (p.turn) return turnStair(p, { M });
  const g = new THREE.Group(), w = p.width ?? 0.85, rise = p.rise ?? 2.85, run = p.run ?? 3.6, n = (p.steps ?? 16) - 1;
  const rH = rise / (n + 1), go = run / n, wood = M.wood(p.tread ?? '#c9a172'), steel = M.lacquer(p.stringer ?? '#1f2023'), side = p.open ?? 1;
  const xs = side > 0 ? [-w / 2, w / 2 - 0.014] : [-w / 2 + 0.014, w / 2];
  for (let i = 0; i < n; i++) blk(g, wood, xs, [(i + 1) * rH - 0.04, (i + 1) * rH], [run / 2 - (i + 1) * go - 0.02, run / 2 - i * go], 0.004);
  const a = Math.atan2(rise, run), L = Math.hypot(rise, run), sh = 0.2;
  const s = add(g, new THREE.BoxGeometry(0.012, sh, L), steel, side * (w / 2 - 0.006), rise / 2 - sh / 2 / Math.cos(a) + 0.1, 0);
  s.rotation.x = a;
  g.userData.h = rise;
  return g;
}
function turnStair(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.85, rise = p.rise ?? 2.85, run = p.run ?? 3.6, N = p.steps ?? 16;
  const s = p.turn > 0 ? 1 : -1, b = p.before ?? 2, k = p.winders ?? 3, m = Math.max(1, N - 1 - b - k);
  const rH = rise / N, go = (run - w) / m, goB = p.beforeGo ?? 0.25, th = 0.04;
  const wood = M.wood(p.tread ?? '#c9a172'), steel = M.lacquer(p.stringer ?? '#1f2023'), open = p.open ?? -s;
  const zSq = run / 2 - w;                      // borde de atrás del cuadrado del giro (donde arranca el tramo recto)
  // tramo de abajo: del lado "s", sube hacia el cuadrado
  for (let i = 0; i < b; i++) {
    const x0 = s * (w / 2 + (b - i) * goB), x1 = s * (w / 2 + (b - i - 1) * goB - 0.02);
    blk(g, wood, [Math.min(x0, x1), Math.max(x0, x1)], [(i + 1) * rH - th, (i + 1) * rH], [zSq + 0.01, run / 2], 0.004);
  }
  // peldaños en abanico: cuñas desde la esquina de adentro (lado del arranque, atrás) que reparten los 90°
  // esquina de adentro P: donde se tocan el borde de entrada (x = s·w/2, del lado del tramo de abajo) y el de salida
  // (z = zSq, hacia el tramo recto). Ángulo 0 = rayo a lo largo del borde de entrada (+Z); 90° = a lo largo del de salida
  const P = { x: s * w / 2, z: zSq };
  const hit = ang => {   // dónde corta el borde del cuadrado un rayo desde la esquina
    const dx = -s * Math.sin(ang), dz = Math.cos(ang), t = Math.min(Math.abs(dx) > 1e-6 ? w / Math.abs(dx) : Infinity, Math.abs(dz) > 1e-6 ? w / Math.abs(dz) : Infinity);
    return [P.x + dx * t, P.z + dz * t];
  };
  for (let j = 0; j < k; j++) {   // el primero junto al tramo de abajo, el último junto al tramo recto
    const a0 = Math.PI / 2 * j / k, a1 = Math.PI / 2 * (j + 1) / k;
    const pts = [[P.x, P.z], hit(a0)];
    if (a0 < Math.PI / 4 - 1e-6 && a1 > Math.PI / 4 + 1e-6) pts.push([P.x - s * w, P.z + w]);   // la esquina de afuera
    pts.push(hit(a1));
    const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: th, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2); geo.translate(0, (b + j + 1) * rH - th, 0);
    add(g, geo, wood);
  }
  // tramo recto hacia -Z: los peldaños se meten 8 mm en la zanca (apoyan en ella, sin caras compartidas)
  const xs = open > 0 ? [-w / 2, w / 2 - 0.004] : [-w / 2 + 0.004, w / 2];
  for (let t = 0; t < m; t++) blk(g, wood, xs, [(b + k + t + 1) * rH - th, (b + k + t + 1) * rH], [zSq - (t + 1) * go - 0.02, zSq - t * go], 0.004);
  // zanca del lado libre del tramo recto, y otra bajo el frente del tramo de abajo y del giro
  const r0 = (b + k) * rH, L = Math.hypot(rise - r0, run - w), a = Math.atan2(rise - r0, run - w), sh = 0.2;
  const st = add(g, new THREE.BoxGeometry(0.012, sh, L), steel, open * (w / 2 - 0.006), r0 + (rise - r0) / 2 - sh / 2 / Math.cos(a) + 0.1, zSq - (run - w) / 2);
  st.rotation.x = a;
  // la zanca baja en vertical hasta el piso en la esquina del giro (así apoya el tramo recto)
  blk(g, steel, [open * (w / 2) - (open > 0 ? 0.012 : 0), open * (w / 2) + (open > 0 ? 0 : 0.012)], [0, r0 + 0.25], [zSq - 0.05, zSq + 0.01], 0.002);
  // "plate": chapa bajo el frente del tramo de abajo y del giro (apagada: lo común es que esos peldaños apoyen en la pared)
  if (p.plate) {
    const fx = [s * (w / 2 + b * goB), -s * w / 2].sort((u, v) => u - v);
    blk(g, steel, fx, [0, Math.max(rH, r0 - 0.06)], [run / 2 - 0.012, run / 2], 0.002);
  } else if (b > 0) {
    // zanca inclinada bajo el borde de atrás del tramo de abajo: del piso, antes del primer peldaño, a la esquina del
    // giro; su canto de arriba toca la punta de cada peldaño 3 mm adentro
    const yAt = d => rH * (d + 0.02) / goB - th + 0.003, d0 = -0.12, d1 = b * goB, sh = 0.16;
    const dx = -s * (d1 - d0), dy = yAt(d1) - yAt(d0), L = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const xm = s * (w / 2 + b * goB) - s * (d0 + d1) / 2, ym = (yAt(d0) + yAt(d1)) / 2;
    const zs = add(g, new THREE.BoxGeometry(L, sh, 0.012), steel, xm + Math.sin(a) * sh / 2, ym - Math.cos(a) * sh / 2, zSq + 0.01);
    zs.rotation.z = a;
  }
  if (p.rail) {   // baranda: parantes de planchuela sobre la zanca y pasamanos redondo a 0,9 m de los peldaños
    const x = open * (w / 2 - 0.006), z0 = zSq, z1 = zSq - (run - w), h0 = r0, posts = Math.max(2, Math.round((run - w) / 0.9) + 1);
    for (let i = 0; i < posts; i++) {
      const f = i / (posts - 1), z = z0 + (z1 - z0) * f, y = h0 + (rise - h0) * f;
      blk(g, steel, [x - 0.006, x + 0.006], [y - 0.05, y + 0.92], [z - 0.02, z + 0.02], 0.002);
    }
    const hr = add(g, new THREE.CylinderGeometry(0.02, 0.02, Math.hypot(rise - h0, run - w), 12), steel, x, (h0 + rise) / 2 + 0.9, (z0 + z1) / 2);
    hr.rotation.x = a - Math.PI / 2;   // el eje del cilindro (Y) apunta hacia arriba y hacia -Z, como la escalera
  }
  g.userData.h = rise;
  return g;
}

// baranda recta a lo largo de X local (fondo en z = 0): "bars" (parantes y caños negros) o "glass"
function railing(p, { M }) {
  const g = new THREE.Group(), L = p.length ?? 1.2, h = p.height ?? 0.95, steel = M.lacquer(p.color ?? '#1f2023');
  const n = Math.max(1, Math.round(L / 1.0));
  for (let i = 0; i <= n; i++) { const x = -L / 2 + 0.02 + i * (L - 0.04) / n; blk(g, steel, [x - 0.02, x + 0.02], [0, h - 0.04], [-0.02, 0.02], 0.003); }
  blk(g, steel, [-L / 2, L / 2], [h - 0.04, h], [-0.025, 0.025], 0.004);
  if (p.style === 'glass') {   // vidrio tomado por grapas a los parantes de las puntas
    blk(g, M.tintedGlass('#cfe0e6', 0.22), [-L / 2 + 0.05, L / 2 - 0.05], [0.08, h - 0.08], [-0.006, 0.006]).castShadow = false;
    for (const sx of [-1, 1]) for (const y of [0.18, h - 0.18]) blk(g, steel, sx < 0 ? [-L / 2 + 0.039, -L / 2 + 0.07] : [L / 2 - 0.07, L / 2 - 0.039], [y - 0.025, y + 0.025], [-0.011, 0.011], 0.002);
  }
  else for (let y = 0.15; y < h - 0.1; y += 0.12) bar(g, steel, 'x', -L / 2 + 0.04, L / 2 - 0.04, y, 0, 0.007);
  g.userData.h = h;
  return g;
}

// revestimiento de tablas verticales sobre una pared (fondo en z = 0): "boards" machihembrado pintado o "slats" listones
function paneling(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 1, h = p.height ?? 2.5, slats = p.style === 'slats', t = p.thickness ?? (slats ? 0.03 : 0.015);
  const mat = M.boards(p.color ?? (slats ? '#d8b68a' : '#b9b6b0'), slats ? 'slats' : 'boards');
  const m = blk(g, mat, [-w / 2, w / 2], [0, h], [0, t], 0, slats ? 0.12 : 0.3);
  if (p.cap) blk(g, M.wood(p.color ?? '#d8b68a'), [-w / 2, w / 2], [h, h + 0.025], [0, t + 0.012], 0.004);   // tapacanto arriba
  g.userData.h = h;
  return g;
}

/* ---------- living ---------- */
// sillón individual tapizado en pana, con estructura de madera a la vista
function armchair(p, { M }) {
  const g = new THREE.Group(), fab = M.velvet(p.color ?? '#d48a52'), wood = M.wood(p.wood ?? '#c58f5c'), sh = 0.42;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = cyl(g, wood, sx * 0.26, 0, sh - 0.05, sz * 0.25, 0.018, 12, 0.022); l.rotation.set(-sz * 0.08, 0, sx * 0.06); }
  for (const sx of [-1, 1]) {   // largueros y brazos-parante de madera que sostienen el respaldo
    blk(g, wood, [sx * 0.29 - 0.02, sx * 0.29 + 0.02], [sh - 0.08, sh - 0.04], [-0.26, 0.26], 0.008);
    const post = blk(g, wood, [sx * 0.3 - 0.02, sx * 0.3 + 0.02], [sh - 0.06, 0.78], [-0.24, -0.2], 0.008); post.rotation.x = -0.12;
  }
  add(g, uvScale(new RoundedBoxGeometry(0.58, 0.1, 0.54, 4, 0.04), 2), fab, 0, sh, 0.02);
  const back = add(g, uvScale(bentBoxGeo(0.62, 0.26, 0.07, 0.7), 2), fab, 0, 0.66, -0.25); back.rotation.x = -0.14;
  g.userData.h = 0.8;
  return g;
}

// puf cilíndrico tapizado en pana
function pouf(p, { M }) {
  const g = new THREE.Group(), r = (p.diameter ?? 0.48) / 2, h = p.height ?? 0.42;
  add(g, new THREE.LatheGeometry(v2([[0.001, 0], [r - 0.03, 0], [r, 0.03], [r, h - 0.04], [r - 0.03, h], [0.001, h]]), 48), M.velvet(p.color ?? '#c9774a'));
  g.userData.h = h;
  return g;
}

// mesa ratona de madera con tapa de esquinas redondeadas y patas abiertas; "runner": camino de tela encima
function coffeeTable(p, { M }) {
  if (p.style === 'oval') {   // de chapa laqueada: tapa y estante ovalados (puntas semicirculares) sobre cuatro caños rectos
    const g = new THREE.Group(), L = p.length ?? 0.9, W = p.width ?? 0.42, h = p.height ?? 0.45, lac = M.lacquer(p.color ?? '#7f8a86');
    const legs = M.metal(p.legs ?? '#b9bcbe', 0.3), plate = y => {
      const geo = new THREE.ExtrudeGeometry(rrect(new THREE.Shape(), -L / 2, -W / 2, L, W, W / 2 - 0.001), { depth: 0.018, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 24 });
      geo.rotateX(-Math.PI / 2); add(g, geo, lac, 0, y, 0);
    };
    plate(h - 0.02); plate(0.13);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, legs, sx * (L / 2 - W / 2 + 0.02), 0, h - 0.012, sz * (W / 2 - 0.05), 0.011, 12);
    g.userData.h = h;
    return g;
  }
  const g = new THREE.Group(), L = p.length ?? 1.1, W = p.width ?? 0.55, h = p.height ?? 0.42, wood = M.wood(p.color ?? '#c8925e');
  const top = new THREE.ExtrudeGeometry(rrect(new THREE.Shape(), -L / 2, -W / 2, L, W, Math.min(0.12, W / 2 - 0.01)), { depth: 0.035, bevelEnabled: false, curveSegments: 12 });
  top.rotateX(-Math.PI / 2); add(g, uvScale(top, 2), wood, 0, h - 0.035, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = cyl(g, wood, sx * (L / 2 - 0.1), 0, h - 0.035, sz * (W / 2 - 0.08), 0.016, 12, 0.022); l.rotation.set(-sz * 0.1, 0, sx * 0.1); }
  if (p.runner) blk(g, M.cloth(p.runner), [-L / 2 + 0.1, L / 2 - 0.1], [h, h + 0.004], [-0.17, 0.17]).castShadow = false;
  g.userData.h = h;
  return g;
}

// aparador de madera sobre patas, con puertas acanaladas
function sideboard(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 1.4, d = p.depth ?? 0.42, h = p.height ?? 0.72, legH = 0.14, wood = M.wood(p.color ?? '#d3a46d');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, wood, sx * (w / 2 - 0.05), 0, legH, sz * (d / 2 - 0.05), 0.015, 12, 0.02);
  blk(g, wood, [-w / 2, w / 2], [legH, h], [-d / 2, d / 2 - 0.02], 0.006);
  const n = p.doors ?? 3, dw = (w - 0.02) / n, door = M.boards(p.color ?? '#d3a46d', 'slats');
  for (let i = 0; i < n; i++) blk(g, door, [-w / 2 + 0.01 + i * dw + 0.002, -w / 2 + 0.01 + (i + 1) * dw - 0.002], [legH + 0.02, h - 0.02], [d / 2 - 0.02, d / 2], 0.003, 0.08);
  if (p.top) blk(g, M.ceramic(p.top), [-w / 2 - 0.005, w / 2 + 0.005], [h, h + 0.02], [-d / 2 - 0.005, d / 2 + 0.005], 0.004);
  g.userData.h = h + (p.top ? 0.02 : 0);
  return g;
}

// lámpara colgante: "dome" (plato blanco) o "lantern" (farol de papel con aro negro)
function pendant(p, { M, H }) {
  const g = new THREE.Group(), drop = p.drop ?? 0.8, y = H - drop, white = M.shadeGlow(p.color ?? '#f6f4ef');
  cyl(g, M.lacquer('#f2f2f0'), 0, H - 0.015, H, 0, 0.05, 24);
  cyl(g, M.lacquer('#222222'), 0, y + 0.1, H - 0.015, 0, 0.003, 6).castShadow = false;
  if (p.style === 'lantern') {
    const r = p.size ?? 0.22, geo = new THREE.SphereGeometry(r, 32, 16), q = geo.attributes.position;
    for (let i = 0; i < q.count; i++) { const yy = q.getY(i), k = 1 + 0.03 * Math.cos(yy / r * 14); q.setXYZ(i, q.getX(i) * k, yy * 0.85, q.getZ(i) * k); }
    geo.computeVertexNormals();
    add(g, geo, white, 0, y, 0).castShadow = false;
    const ring = add(g, new THREE.TorusGeometry(r * 0.55, 0.006, 8, 40), M.lacquer('#1d1d1d'), 0, y - r * 0.8, 0); ring.rotation.x = Math.PI / 2;
  } else {
    const r = (p.size ?? 0.5) / 2;
    add(g, new THREE.LatheGeometry(v2([[0.02, 0.1], [r * 0.5, 0.08], [r * 0.9, 0.03], [r, 0], [r * 0.98, -0.01], [0.001, -0.005]]), 64), white, 0, y, 0).castShadow = false;
  }
  lampSpot(g, 0, y - 0.03, 0, p.intensity ?? 14, 1.1, 6);
  return g;
}

// araña de caireles rectangular: placa cromada contra el techo y una cortina de cuentas de cristal que cuelgan en hileras,
// más largas al centro. Las cuentas son instancias (miles cuestan como una sola malla): cromadas, que reflejan el
// entorno, y una de cada tres que brilla de noche. "day": prendida también de día (con "dayIntensity")
function chandelier(p, { M, H }) {
  const g = new THREE.Group(), W = p.width ?? 0.9, D = p.depth ?? 0.55, drop = p.drop ?? 0.5, step = 0.045, bead = 0.03;
  blk(g, M.metal('#dfe1e3', 0.12), [-W / 2, W / 2], [H - 0.03, H], [-D / 2, D / 2], 0.006);
  const nx = Math.max(2, Math.round(W / step)), nz = Math.max(2, Math.round(D / step)), spots = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const u = (i + 0.5) / nx * 2 - 1, v = (j + 0.5) / nz * 2 - 1, edge = Math.max(Math.abs(u), Math.abs(v));
    const len = drop * (0.45 + 0.55 * (1 - edge * edge)) * (0.94 + 0.06 * Math.sin(i * 12.9898 + j * 78.233));
    const x = -W / 2 + (i + 0.5) * W / nx, z = -D / 2 + (j + 0.5) * D / nz;
    for (let y = H - 0.05; y > H - 0.03 - len; y -= bead) spots.push([x, y, z, (i + j * 2 + Math.round(y * 100)) % 3 === 0]);
  }
  const geo = new THREE.IcosahedronGeometry(0.0105, 1), m4 = new THREE.Matrix4();
  for (const [mat, list] of [[M.metal('#f3f5f7', 0.06), spots.filter(s => !s[3])], [M.glow(), spots.filter(s => s[3])]]) {
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(([x, y, z], k) => im.setMatrixAt(k, m4.makeTranslation(x, y, z)));
    // cuelgan de hilos que no se dibujan: el control de piezas sueltas no las mira (comparaba miles de cuentas de a pares)
    im.castShadow = false; im.receiveShadow = false; im.userData.noTouch = true; g.add(im);
  }
  const l = lampPoint(g, 0, H - drop * 0.6, 0, p.intensity ?? 9, 5);
  if (p.day) l.userData.day = p.dayIntensity ?? 4;
  return g;
}

// riel de spots a lo largo de X local, colgado del techo
function trackLight(p, { M, H }) {
  const g = new THREE.Group(), L = p.length ?? 1.5, n = p.spots ?? 3, black = M.lacquer(p.color ?? '#1d1d1f');
  blk(g, black, [-L / 2, L / 2], [H - 0.035, H], [-0.018, 0.018], 0.004);
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + (i + 0.5) * L / n, s = new THREE.Group(); s.position.set(x, H - 0.035, 0); s.rotation.x = p.tilt ?? 0.35; g.add(s);
    cyl(s, black, 0, -0.04, 0, 0, 0.006, 8);
    cyl(s, black, 0, -0.15, -0.04, 0, 0.032, 24);
    cyl(s, M.glow(), 0, -0.153, -0.149, 0, 0.024, 24).castShadow = false;
    lampSpot(g, x, H - 0.2, 0, p.intensity ?? 8, 0.8, 6);
  }
  return g;
}

// aplique de pared para lectura (fondo en z = 0)
function sconce(p, { M }) {
  const g = new THREE.Group(), black = M.lacquer(p.color ?? '#1d1d1f');
  blk(g, black, [-0.03, 0.03], [-0.05, 0.05], [0, 0.012], 0.004);
  bar(g, black, 'z', 0.012, 0.09, 0, 0, 0.006);
  cyl(g, black, 0, -0.07, 0.03, 0.1, 0.025, 20);
  cyl(g, M.glow(), 0, -0.073, -0.069, 0.1, 0.019, 20).castShadow = false;
  lampPoint(g, 0, -0.1, 0.12, p.intensity ?? 1.2, 2.5);
  g.userData.h = 0.1;
  return g;
}

// espejo rectangular de esquinas redondeadas con barra de luz arriba (baños); fondo en z = 0, base en y = 0
function bathMirror(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.6, h = p.height ?? 0.8, r = p.radius ?? 0.06;
  add(g, new THREE.ExtrudeGeometry(rrect(new THREE.Shape(), -w / 2, 0, w, h, r), { depth: 0.012, bevelEnabled: false, curveSegments: 10 }), M.lacquer('#1d1d1f'));
  add(g, new THREE.ExtrudeGeometry(rrect(new THREE.Shape(), -w / 2 + 0.012, 0.012, w - 0.024, h - 0.024, r - 0.01), { depth: 0.004, bevelEnabled: false, curveSegments: 10 }), M.mirror(), 0, 0, 0.012).castShadow = false;
  if (p.light !== false) {
    blk(g, M.lacquer('#1d1d1f'), [-w * 0.35, w * 0.35], [h + 0.03, h + 0.06], [0, 0.07], 0.01);
    blk(g, M.led(), [-w * 0.34, w * 0.34], [h + 0.025, h + 0.032], [0.01, 0.065]).castShadow = false;
    lampSpot(g, 0, h + 0.02, 0.1, 3, 1.1, 3);
  }
  g.userData.h = h;
  return g;
}

// mampara de vidrio templado a lo largo de X local (fondo en z = 0), con perfil inferior y tirador
function glassScreen(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.9, h = p.height ?? 2.0, steel = M.metal('#c9ccd0', 0.25);
  blk(g, M.tintedGlass('#e6eef0', 0.18), [-w / 2, w / 2], [0.02, h], [-0.004, 0.004]).castShadow = false;
  blk(g, steel, [-w / 2, w / 2], [0, 0.02], [-0.008, 0.008], 0.002);
  if (p.handle) { for (const y of [0.9, 1.2]) bar(g, steel, 'z', 0.004, 0.04, y, w / 2 - 0.08, 0.005); cyl(g, steel, w / 2 - 0.08, 0.85, 1.25, 0.045, 0.008, 10); }
  g.userData.h = h;
  return g;
}

// divisor de ambientes: vidrio esmerilado en un bastidor de perfiles ("cols" × "rows" paños), de pie, a lo largo de X
// local (el centro de la huella en el origen). Los paños entran en los perfiles; montantes y travesaños se cruzan
// metidos unos en otros, sin caras en el mismo plano
function roomDivider(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 1.2, h = p.height ?? 2.25, cols = p.cols ?? 2, rows = p.rows ?? 3;
  const fr = M.lacquer(p.frame ?? '#f1efe9'), f = 0.035, d = 0.03, m = 0.024, dm = 0.022;
  const glass = M.frosted(p.glass ?? '#e9ecea', p.opacity ?? 0.62);
  blk(g, glass, [-w / 2 + f / 2, w / 2 - f / 2], [f / 2, h - f / 2], [-0.003, 0.003]);   // recibe sombra: a pleno sol se veía opaco
  for (const s of [-1, 1]) blk(g, fr, s < 0 ? [-w / 2, -w / 2 + f] : [w / 2 - f, w / 2], [0, h], [-d / 2, d / 2], 0.003);      // montantes de borde
  for (const [y0, y1] of [[0, f], [h - f, h]]) blk(g, fr, [-w / 2 + f - 0.002, w / 2 - f + 0.002], [y0, y1], [-d / 2 + 0.001, d / 2 - 0.001], 0.003);
  for (let i = 1; i < cols; i++) { const x = -w / 2 + f + (w - 2 * f) * i / cols; blk(g, fr, [x - m / 2, x + m / 2], [f - 0.002, h - f + 0.002], [-dm / 2, dm / 2], 0.002); }
  for (let j = 1; j < rows; j++) { const y = f + (h - 2 * f) * j / rows; blk(g, fr, [-w / 2 + f - 0.002, w / 2 - f + 0.002], [y - m / 2, y + m / 2], [-dm / 2 + 0.0015, dm / 2 - 0.0015], 0.002); }
  g.userData.h = h;
  return g;
}

// banco rústico de madera maciza: tabla gruesa sobre cuatro patas abiertas en A en cada punta, con un travesaño entre
// ellas; a lo largo de X
function bench(p, { M }) {
  const g = new THREE.Group(), L = p.length ?? 1.2, D = p.depth ?? 0.28, h = p.height ?? 0.45, wood = M.wood(p.color ?? '#9a7e62'), t = 0.055;
  add(g, uvScale(new RoundedBoxGeometry(L, t, D, 3, 0.01), 2), wood, 0, h - t / 2, 0);
  for (const sx of [-1, 1]) {
    const x = sx * (L / 2 - 0.12), legs = [-1, 1].map(sz => [[x + sx * 0.03, 0, sz * (D / 2 + 0.02)], [x, h - 0.01, sz * (D / 2 - 0.07)]]);
    for (const [a, b] of legs) strut(g, wood, a, b, 0.022, 0.02, 8);
    strut(g, wood, atY(...legs[0], 0.16), atY(...legs[1], 0.16), 0.016, 0.016, 8);
  }
  g.userData.h = h;
  return g;
}

// consola de recibidor: bastidor de caño cuadrado laqueado, tapa de mármol ("top") y un estante abajo; el fondo en -Z
function consoleTable(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.8, d = p.depth ?? 0.3, h = p.height ?? 0.82, s = 0.016;
  const fr = M.lacquer(p.color ?? '#f2f1ed'), top = p.top ? M.marble(p.top) : M.lacquer(p.color ?? '#f2f1ed');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) blk(g, fr, [sx * w / 2 - s / 2 - sx * s / 2, sx * w / 2 - sx * s / 2 + s / 2], [0, h - 0.02], [sz * d / 2 - s / 2 - sz * s / 2, sz * d / 2 - sz * s / 2 + s / 2]);
  for (const y of [h - 0.02 - s, 0.02]) {   // marco de arriba (bajo la tapa) y de abajo, metidos 2 mm en las patas
    for (const sz of [-1, 1]) blk(g, fr, [-w / 2 + s - 0.002, w / 2 - s + 0.002], [y, y + s], [sz * (d / 2 - s / 2) - s / 2 + 0.001, sz * (d / 2 - s / 2) + s / 2 - 0.001]);
    for (const sx of [-1, 1]) blk(g, fr, [sx * (w / 2 - s / 2) - s / 2 + 0.001, sx * (w / 2 - s / 2) + s / 2 - 0.001], [y + 0.001, y + s - 0.001], [-d / 2 + s - 0.002, d / 2 - s + 0.002]);
  }
  blk(g, M.lacquer(p.color ?? '#f2f1ed'), [-w / 2 + s - 0.003, w / 2 - s + 0.003], [p.shelf ?? 0.26, (p.shelf ?? 0.26) + 0.012], [-d / 2 + s - 0.003, d / 2 - s + 0.003]);
  blk(g, top, [-w / 2 - 0.004, w / 2 + 0.004], [h - 0.02, h], [-d / 2 - 0.004, d / 2 + 0.004], 0.002);
  g.userData.h = h;
  return g;
}

// banqueta alta de barra: asiento de madera en forma de escudo (recto atrás, redondeado adelante, apenas ahuecado),
// cuatro patas abiertas y travesaños para apoyar los pies
function barStool(p, { M }) {
  const g = new THREE.Group(), sh = p.seatHeight ?? 0.66, wood = M.wood(p.color ?? '#d9b98c'), sw = 0.36, sd = 0.3, t = 0.04;
  const shp = new THREE.Shape();
  shp.moveTo(-sw / 2 + 0.04, -sd / 2); shp.lineTo(sw / 2 - 0.04, -sd / 2); shp.quadraticCurveTo(sw / 2, -sd / 2, sw / 2, -sd / 2 + 0.05);
  shp.bezierCurveTo(sw / 2, sd * 0.15, sw * 0.3, sd / 2, 0, sd / 2); shp.bezierCurveTo(-sw * 0.3, sd / 2, -sw / 2, sd * 0.15, -sw / 2, -sd / 2 + 0.05);
  shp.quadraticCurveTo(-sw / 2, -sd / 2, -sw / 2 + 0.04, -sd / 2);
  const geo = new THREE.ExtrudeGeometry(shp, { depth: t - 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.008, bevelSegments: 3, curveSegments: 20 });
  geo.rotateX(Math.PI / 2); geo.translate(0, sh - 0.006, 0);   // la forma pasa a XZ con el frente redondo en +Z; el espesor, hacia abajo
  add(g, uvScale(geo, 2), wood);
  const legs = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => [[sx * 0.19, 0, sz * 0.17], [sx * 0.12, sh - t + 0.01, sz * 0.09]]);
  for (const [a, b] of legs) strut(g, wood, a, b, 0.018, 0.016, 10);
  for (const [i, j, y] of [[0, 1, 0.24], [2, 3, 0.24], [0, 2, 0.32], [1, 3, 0.32]]) strut(g, wood, atY(...legs[i], y), atY(...legs[j], y), 0.012, 0.012, 8);
  g.userData.h = sh;
  return g;
}

// ventilador de pie: base redonda, caño, motor y aspas dentro de una jaula de alambre que mira hacia +Z
// "style": "tower" = ventilador de torre: columna ovalada sobre una base redonda, rejilla al frente y tablero arriba
function floorFan(p, { M }) {
  if (p.style === 'tower') {
    const g = new THREE.Group(), h = p.height ?? 0.95, body = M.lacquer(p.color ?? '#1d1e20'), grill = M.lacquer('#3a3c40');
    cyl(g, body, 0, 0, 0.03, 0, 0.15, 40);
    add(g, new RoundedBoxGeometry(0.17, h - 0.026, 0.14, 4, 0.06), body, 0, 0.026 + (h - 0.026) / 2, 0);
    for (let i = 0; i < 9; i++) blk(g, grill, [-0.045 + i * 0.0112 - 0.003, -0.045 + i * 0.0112 + 0.003], [0.16, h - 0.16], [0.066, 0.072], 0.002).castShadow = false;
    blk(g, M.screen(), [-0.03, 0.03], [h - 0.004, h + 0.002], [-0.03, 0.03], 0.003).castShadow = false;
    g.userData.h = h;
    return g;
  }
  const g = new THREE.Group(), h = p.height ?? 1.25, R = (p.diameter ?? 0.42) / 2, yc = h - 0.1;
  const body = M.lacquer(p.color ?? '#f2f2f0'), wire = M.metal(p.cage ?? '#d9dadb', 0.35), blade = M.lacquer(p.blades ?? '#e8eaec');
  cyl(g, body, 0, 0, 0.035, 0, 0.17, 40);                                                   // base
  cyl(g, body, 0, 0.035, yc - 0.04, 0, 0.013, 16);                                          // caño, entra en el motor
  disc(g, body, 0, yc, -0.12, 0.065, 0.12);                                                 // motor, con el frente en z = 0
  disc(g, body, 0, yc, 0, 0.035, 0.03);                                                     // cubo de las aspas
  for (let i = 0; i < 3; i++) {                                                             // aspas desde el cubo
    const a = i * Math.PI * 2 / 3, m = add(g, new THREE.SphereGeometry(1, 16, 8), blade, Math.cos(a) * 0.1, yc + Math.sin(a) * 0.1, 0.015);
    m.scale.set(R * 0.42, 0.055, 0.006); m.rotation.z = a; m.castShadow = false;
  }
  for (const z of [-0.004, 0.07]) {                                                         // aros de la jaula, atrás y adelante
    const ring = add(g, new THREE.TorusGeometry(R, 0.004, 6, 64), wire, 0, yc, z); ring.castShadow = false;
    for (let i = 0; i < 8; i++) {                                                           // rayos de cada aro hacia el centro
      const a = i * Math.PI / 4, r0 = z < 0 ? 0.062 : 0.036, r1 = R, m = add(g, new THREE.BoxGeometry(r1 - r0, 0.004, 0.004), wire, Math.cos(a) * (r0 + r1) / 2, yc + Math.sin(a) * (r0 + r1) / 2, z);
      m.rotation.z = a; m.castShadow = false;
    }
  }
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; bar(g, wire, 'z', -0.004, 0.07, yc + Math.sin(a) * R, Math.cos(a) * R, 0.003, 6).castShadow = false; }   // varillas entre aros
  disc(g, body, 0, yc, 0.066, 0.04, 0.008);                                                 // tapa del frente, en el centro de los rayos
  g.userData.h = h;
  return g;
}

// cucheta: dos camas de una plaza superpuestas con parantes, barandas arriba y escalera en el lado largo (+Z).
// El largo va en X; "ladder" (1 o -1) elige de qué punta va la escalera
function bunkBed(p, { M }) {
  const g = new THREE.Group(), L = (p.length ?? 1.9) + 0.1, W = (p.width ?? 0.9) + 0.1, H = p.height ?? 1.6, t = 0.05, ys = [0.3, H - 0.38];
  const wood = p.material === 'lacquer' ? M.lacquer(p.color ?? '#f2f0eb') : M.wood(p.color ?? '#d2ad7e'), sheet = M.fabric(p.sheetColor ?? '#f4f2ee'), duvet = M.fabric(p.duvetColor ?? '#5b6e86');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) blk(g, wood, [sx * L / 2 - (sx > 0 ? t : 0), sx * L / 2 + (sx < 0 ? t : 0)], [0, H], [sz * W / 2 - (sz > 0 ? t : 0), sz * W / 2 + (sz < 0 ? t : 0)], 0.004);
  for (const y of ys) {
    for (const sz of [-1, 1]) blk(g, wood, [-L / 2 + t, L / 2 - t], [y - 0.1, y + 0.03], sz < 0 ? [-W / 2, -W / 2 + 0.04] : [W / 2 - 0.04, W / 2], 0.003);   // largueros
    for (const sx of [-1, 1]) blk(g, wood, sx < 0 ? [-L / 2 + t, -L / 2 + t + 0.03] : [L / 2 - t - 0.03, L / 2 - t], [y - 0.1, y + 0.03], [-W / 2 + t, W / 2 - t], 0.003);   // cabeceras
    blk(g, wood, [-L / 2 + t + 0.03, L / 2 - t - 0.03], [y, y + 0.02], [-W / 2 + 0.04, W / 2 - 0.04]);                                // tarima
    add(g, uvScale(new RoundedBoxGeometry(L - 2 * t - 0.08, 0.16, W - 0.1, 4, 0.04), 4), sheet, 0, y + 0.1, 0);                     // colchón
    add(g, drapeGeo({ x0: -L / 2 + t + 0.06, x1: L / 2 - t - 0.35, z0: -W / 2 + 0.06, z1: W / 2 - 0.06, top: y + 0.19, drop: 0.12, r: 0.05,
      open: { zMin: true, zMax: true }, puff: 0.02, seed: 5 }), duvet);                                                              // acolchado sobre el colchón
    add(g, uvScale(new RoundedBoxGeometry(0.28, 0.1, 0.5, 4, 0.04), 3), sheet, L / 2 - t - 0.2, y + 0.23, 0);                       // almohada
  }
  const top = ys[1] + 0.32, side = p.ladder ?? 1, lx = side * (L / 2 - 0.3);
  blk(g, wood, [-L / 2 + t, L / 2 - t], [top - 0.05, top], [-W / 2, -W / 2 + 0.04], 0.003);                                         // baranda del fondo
  blk(g, wood, side > 0 ? [-L / 2 + t, lx - 0.2] : [lx + 0.2, L / 2 - t], [top - 0.05, top], [W / 2 - 0.04, W / 2], 0.003);         // baranda del frente, hasta la escalera
  for (const dx of [-0.2, 0.2]) blk(g, wood, [lx + dx - 0.02, lx + dx + 0.02], [0, top], [W / 2, W / 2 + 0.04], 0.003);              // escalera: parantes contra el larguero
  for (let y = 0.35; y < top - 0.1; y += 0.28) blk(g, wood, [lx - 0.18, lx + 0.18], [y, y + 0.03], [W / 2 + 0.005, W / 2 + 0.035], 0.003);
  g.userData.h = H;
  return g;
}

// escritorio de cuatro patas o de paneles laterales ("style": "panels"), con cajonera opcional ("drawers": 1 o -1, el lado)
function desk(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 1.2, d = p.depth ?? 0.6, h = p.height ?? 0.75, tt = 0.025;
  const top = p.material === 'lacquer' ? M.lacquer(p.color ?? '#f2f0eb') : M.wood(p.color ?? '#c9a172'), legs = p.style === 'panels' ? top : M.metal(p.legs ?? '#2a2b2d', 0.45);
  blk(g, top, [-w / 2, w / 2], [h - tt, h], [-d / 2, d / 2], 0.004);
  if (p.style === 'panels') {
    for (const sx of [-1, 1]) blk(g, top, sx < 0 ? [-w / 2 + 0.01, -w / 2 + 0.035] : [w / 2 - 0.035, w / 2 - 0.01], [0, h - tt], [-d / 2 + 0.02, d / 2 - 0.02], 0.003);
    blk(g, top, [-w / 2 + 0.035, w / 2 - 0.035], [h - tt - 0.3, h - tt], [-d / 2 + 0.02, -d / 2 + 0.04]);   // faldón de atrás, entre paneles
  } else {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, legs, sx * (w / 2 - 0.04), 0, h - tt, sz * (d / 2 - 0.04), 0.015, 12);
    for (const sx of [-1, 1]) bar(g, legs, 'z', -d / 2 + 0.04, d / 2 - 0.04, h - tt - 0.03, sx * (w / 2 - 0.04), 0.012);   // travesaños bajo la tapa, entre patas
  }
  if (p.drawers) {   // cajonera colgada de la tapa, de un lado
    const s = Math.sign(p.drawers), x0 = s > 0 ? w / 2 - 0.45 : -w / 2 + 0.07, x1 = x0 + 0.38;
    blk(g, top, [x0, x1], [h - tt - 0.16, h - tt], [-d / 2 + 0.05, d / 2 - 0.03]);
    blk(g, top, [x0 + 0.004, x1 - 0.004], [h - tt - 0.155, h - tt - 0.005], [d / 2 - 0.03, d / 2 - 0.012], 0.003);
    pull(g, M.metal('#b9bcc0', 0.35), 'x', (x0 + x1) / 2 - 0.06, (x0 + x1) / 2 + 0.06, h - tt - 0.08, d / 2 - 0.012, 0.015, 0.005);
  }
  g.userData.h = h;
  return g;
}

// biblioteca o estantería de pie: costados, estantes y fondo; "books" llena los estantes de libros apoyados ("some":
// uno sí y uno no). "cabinet": alto del mueble cerrado de abajo, con dos puertas de tablero y perillas; "crown": copete
// arqueado arriba (bibliotecas de pino). "style": "stepped" = escalonada (ver steppedShelf)
function bookshelf(p, { M }) {
  if (p.style === 'stepped') return steppedShelf(p, { M });
  const g = new THREE.Group(), w = p.width ?? 0.8, h = p.height ?? 1.8, d = p.depth ?? 0.3, n = p.shelves ?? 4, t = 0.02, r = rng(p.seed ?? 7);
  const c = p.color ?? (p.material === 'lacquer' ? '#f2f0eb' : '#c9a172'), wood = p.material === 'lacquer' ? M.lacquer(c) : M.wood(c), cab = p.cabinet ?? 0;
  for (const sx of [-1, 1]) blk(g, wood, sx < 0 ? [-w / 2, -w / 2 + t] : [w / 2 - t, w / 2], [0, h], [-d / 2, d / 2], 0.003);
  blk(g, wood, [-w / 2 + t, w / 2 - t], [h - t, h], [-d / 2, d / 2]);
  blk(g, M.lacquer(shade(c, -0.1)), [-w / 2 + t, w / 2 - t], [0.06, h - t], [-d / 2, -d / 2 + 0.008]);   // fondo
  const y0 = cab ? cab : 0.06, gap = (h - t - y0) / n, colors = p.bookColors ?? ['#7a3b2e', '#2f4a5f', '#c9b79c', '#3d5a40', '#b8743f', '#e6e1d8', '#5b4a6e'];
  for (let i = 0; i < n; i++) {
    const y = y0 + i * gap;
    blk(g, wood, [-w / 2 + t, w / 2 - t], [y - t, y], [-d / 2 + 0.008, d / 2]);                                            // estante
    if (p.books === false || (p.books === 'some' && i % 2)) continue;
    let x = -w / 2 + t + 0.01 + r() * 0.05;                                                                                   // libros parados, uno al lado del otro
    const end = w / 2 - t - 0.02 - (i % 2 ? 0.2 : 0.05);
    while (x < end) {
      const bw = 0.02 + r() * 0.03, bh = Math.min(gap - t - 0.03, 0.17 + r() * 0.09), bd = d - 0.06 - r() * 0.06;
      if (x + bw > end) break;
      // caja recta: un canto redondeado de 2 mm no se ve y multiplicaba por 25 los triángulos de cada libro
      blk(g, M.lacquer(colors[Math.floor(r() * colors.length)]), [x, x + bw], [y, y + bh], [-d / 2 + 0.03, -d / 2 + 0.03 + bd]).castShadow = i === 0;
      x += bw;
    }
  }
  blk(g, wood, [-w / 2 + t, w / 2 - t], [0, 0.06], [d / 2 - 0.03, d / 2 - 0.01]);                                             // zócalo
  if (cab) {   // puertas de tablero sobre el frente del mueble de abajo: marco, tablero en relieve y perilla
    const nd = p.doors ?? 2, dw = (w - 0.006) / nd, knob = M.wood(shade(c, -0.12));
    for (let i = 0; i < nd; i++) {
      const xa = -w / 2 + 0.003 + i * dw + 0.0015, xb = xa + dw - 0.003, ya = 0.065, yb = cab - t - 0.004;
      blk(g, wood, [xa, xb], [ya, yb], [d / 2, d / 2 + 0.018], 0.003);
      blk(g, wood, [xa + 0.055, xb - 0.055], [ya + 0.06, yb - 0.06], [d / 2 + 0.012, d / 2 + 0.026], 0.012);
      add(g, new THREE.SphereGeometry(0.014, 14, 10), knob, i % 2 ? xa + 0.035 : xb - 0.035, (ya + yb) / 2 + 0.05, d / 2 + 0.03).scale.z = 0.8;
    }
  }
  let top = h;
  if (p.crown) {   // cornisa que vuela 1,2 cm y copete arqueado al frente
    blk(g, wood, [-w / 2 - 0.012, w / 2 + 0.012], [h - 0.001, h + 0.018], [-d / 2, d / 2 + 0.012], 0.005);
    const ch = 0.11, sh = new THREE.Shape(v2([[-w / 2 - 0.006, 0], [w / 2 + 0.006, 0], [w / 2 + 0.006, 0.035]]));
    sh.quadraticCurveTo(w / 4, 0.04, 0, ch); sh.quadraticCurveTo(-w / 4, 0.04, -w / 2 - 0.006, 0.035); sh.lineTo(-w / 2 - 0.006, 0);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2 });
    add(g, uvScale(geo, 2), wood, 0, h + 0.017, d / 2 - 0.022);
    top = h + 0.018 + ch;
  }
  g.userData.h = top;
  return g;
}
// biblioteca escalonada: torres de estantes una al lado de la otra ("steps": sus alturas de -X a +X; "widths": sus
// anchos, o "width" repartido), con libros; comparten profundidad y color, y se tocan de costado
function steppedShelf(p, { M }) {
  const g = new THREE.Group(), hs = p.steps ?? [1.0, 1.4, 1.75], ws = p.widths ?? hs.map(() => (p.width ?? 0.9) / hs.length), W = ws.reduce((a, b) => a + b, 0);
  let x = -W / 2;
  hs.forEach((h, i) => {
    const t = bookshelf({ ...p, style: undefined, width: ws[i], height: h, shelves: Math.max(2, Math.round((h - 0.1) / 0.34)), seed: (p.seed ?? 7) + i * 5, crown: false, cabinet: 0 }, { M });
    t.position.x = x + ws[i] / 2; g.add(t); x += ws[i];
  });
  g.userData.h = Math.max(...hs);
  return g;
}

/* ---------- ramos y recipientes para los adornos (2026-11-07) ---------- */
// Generador de ramos, a partir del florero de la consola del depto 5 (el usuario: "se ve muy bien"; pidió llevarlo al
// motor para generar decoraciones así). Lo que lo hace creíble: tallos finos y curvos (no varillas rectas) que salen del
// fondo del recipiente, pasan por la boca y se abren en abanico; ramitas laterales; puntas variadas y hojitas; y todo lo
// chico unido en una malla por material (los adornos no pasan por la unión de piezas del motor: sin esto, cada bolita
// era un dibujo más). Un estilo de ramo dice cuántos tallos, cuán altos y abiertos, de qué color y qué va en las puntas.
// Puntas: "dome" (cúpula de florcitas, del color "flowers"), "buds" (pimpollos en pedicelos), "daisy" (flor de pétalos),
// "plume" (penacho de pampa), "coins" (hojas redondas a lo largo del tallo, eucalipto), "twig" (ramita seca sin nada).
const BOUQUETS = {
  dried: { stems: 8, height: [0.44, 0.64], spread: [0.07, 0.29], stem: '#6b6a46', leaf: '#7c8452', tips: ['dome', 'buds', 'buds'], side: 0.8, leaves: true },
  eucalyptus: { stems: 7, height: [0.4, 0.58], spread: [0.05, 0.22], stem: '#6f7a6c', leaf: '#8d9c8c', tips: ['coins'], side: 0.5, leaves: false },
  pampas: { stems: 6, height: [0.6, 0.85], spread: [0.04, 0.24], stem: '#c9b48c', tips: ['plume'], side: 0, leaves: false, radius: 0.0028 },
  wildflowers: { stems: 9, height: [0.32, 0.48], spread: [0.04, 0.2], stem: '#5f7a43', leaf: '#6f8f4a', tips: ['daisy', 'buds', 'daisy', 'dome'], side: 0.6, leaves: true },
  branches: { stems: 5, height: [0.36, 0.56], spread: [0.03, 0.14], stem: '#8a6b4a', tips: ['twig'], side: 0.7, leaves: false },
};
// malla por material: put(material, geometría); addTo(grupo) une todo lo de cada material en una sola malla
function meshBag() {
  const bag = new Map();
  return {
    put(mat, geo) { if (!bag.has(mat)) bag.set(mat, []); bag.get(mat).push(geo.index ? geo.toNonIndexed() : geo); },
    addTo(g) { for (const [mat, geos] of bag) add(g, mergeGeometries(geos, false), mat).castShadow = false; },
  };
}
// Recipiente centrado en x, apoyado en y = 0. Devuelve dónde arrancan los tallos ("base"), la altura de la boca y su radio.
// "glass" (vidrio cónico con un dedo de agua), "bottle" (botella de cuello angosto), "bud" (cerámica panzona de cuello
// corto), "tall" (cerámica alta y recta, para pampa), "jar" (frasco de vidrio ancho y bajo)
function vessel(g, M, kind, x, color) {
  const lathe = (pts, mat, seg = 40) => { const m = add(g, new THREE.LatheGeometry(v2(pts), seg), mat, x, 0, 0); m.castShadow = false; return m; };
  if (kind === 'glass') {
    const H = 0.26;
    lathe([[0.001, 0], [0.04, 0], [0.042, 0.006], [0.056, H], [0.052, H], [0.037, 0.014], [0.001, 0.012]], M.glass());
    lathe([[0.001, 0.013], [0.0368, 0.013], [0.0395, 0.075], [0.001, 0.075]], M.tintedGlass('#d4e2dc', 0.18), 32).renderOrder = 1;
    return { base: 0.02, mouth: H, r: 0.05 };
  }
  if (kind === 'jar') {
    const H = 0.16;
    lathe([[0.001, 0], [0.05, 0], [0.055, 0.008], [0.058, 0.13], [0.05, H], [0.046, H], [0.053, 0.13], [0.05, 0.012], [0.001, 0.01]], M.glass());
    lathe([[0.001, 0.011], [0.049, 0.011], [0.051, 0.06], [0.001, 0.06]], M.tintedGlass('#d4e2dc', 0.18), 32).renderOrder = 1;
    return { base: 0.015, mouth: H, r: 0.045 };
  }
  if (kind === 'bottle') {
    lathe([[0.001, 0], [0.04, 0], [0.042, 0.006], [0.042, 0.17], [0.03, 0.2], [0.016, 0.215], [0.016, 0.245], [0.019, 0.25], [0.014, 0.25], [0.012, 0.215], [0.001, 0.215]], M.glass(), 32);
    return { base: 0.1, mouth: 0.25, r: 0.012 };
  }
  if (kind === 'tall') {
    lathe([[0.001, 0], [0.05, 0], [0.058, 0.03], [0.062, 0.24], [0.05, 0.3], [0.045, 0.31], [0.04, 0.3], [0.001, 0.29]], M.ceramic(color ?? '#e3dccf'));
    return { base: 0.29, mouth: 0.31, r: 0.035 };
  }
  // "bud": la cerámica de cuello corto de siempre, un poco más grande
  lathe([[0.001, 0], [0.04, 0], [0.058, 0.06], [0.05, 0.16], [0.024, 0.2], [0.028, 0.215], [0.022, 0.215], [0.016, 0.2], [0.001, 0.2]], M.ceramic(color ?? '#d8cfc2'), 32);
  return { base: 0.19, mouth: 0.215, r: 0.016 };
}
// El ramo: los tallos van del fondo (o del cuello) a la boca, cerca del centro, y de ahí se abren hacia los costados
// (más que hacia adelante y atrás: los adornos suelen ir contra una pared). "o": { x, base, mouth, r, style, flowers,
// stems, scale }
function bouquet(g, M, r, o) {
  const S = { ...BOUQUETS[o.style ?? 'dried'], ...(o.stems ? { stems: o.stems } : {}) }, k = o.scale ?? 1, bag = meshBag();
  const V = (...a) => new THREE.Vector3(...a), up = V(0, 1, 0), x = o.x;
  const stem = M.paint(S.stem), lf = M.paint(S.leaf ?? S.stem), fc = o.flowers ?? '#5b2f3a';
  const heads = [M.paint(shade(fc, -0.06)), M.paint(fc), M.paint(shade(fc, 0.07))], buds = [M.paint('#ddd6a8'), M.paint('#c4c183')];
  const petals = M.paint(o.petals ?? '#f3efe6'), core = M.paint('#d9a93a'), plume = M.fabric('#e8dcc4');
  const tube = (pts, rad) => bag.put(stem, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, rad, 5, false));
  const ball = (mat, c, rad, sy = 1) => { const s = new THREE.SphereGeometry(rad, 7, 5); s.scale(1, sy, 1); s.translate(c.x, c.y, c.z); bag.put(mat, s); };
  const orient = (geo, at, dir) => { geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize())); geo.translate(at.x, at.y, at.z); return geo; };
  const leaf = (at, dir) => bag.put(lf, orient(leafGeo((0.035 + 0.02 * r()) * k, 0.011 * k, 0.25), at, dir));
  const TIPS = {
    dome(c) { for (let i = 0; i < 34; i++) { const th = Math.acos(1 - r() * 0.75), ph = r() * Math.PI * 2; ball(heads[Math.floor(r() * 3)], c.clone().addScaledVector(V(Math.sin(th) * Math.cos(ph), Math.cos(th) - 0.55, Math.sin(th) * Math.sin(ph)), 0.027 * k), (0.005 + 0.0028 * r()) * k); } },
    buds(c) {
      for (let i = 0, n = 3 + Math.floor(r() * 3); i < n; i++) {
        const e = c.clone().add(V((r() - 0.5) * 0.05 * k, (0.012 + r() * 0.025) * k, (r() - 0.5) * 0.04 * k));
        tube([c, c.clone().lerp(e, 0.5).add(V(0, 0.006 * k, 0)), e], 0.0011);
        ball(buds[Math.floor(r() * 2)], e, (0.0075 + 0.003 * r()) * k, 1.15);
      }
    },
    daisy(c, dir) {   // flor abierta mirando hacia afuera y arriba: pétalos alargados alrededor de un centro amarillo
      const n = dir.clone().setY(Math.max(dir.y, 0.4)).normalize(), q = new THREE.Quaternion().setFromUnitVectors(up, n);
      for (let i = 0; i < 11; i++) {
        const a = i / 11 * Math.PI * 2, s = new THREE.SphereGeometry(0.009 * k, 6, 4); s.scale(0.45, 0.12, 1.6); s.translate(0, 0, 0.014 * k); s.rotateY(a);
        s.applyQuaternion(q); s.translate(c.x, c.y, c.z); bag.put(petals, s);
      }
      const cc = new THREE.SphereGeometry(0.0065 * k, 8, 6); cc.scale(1, 0.55, 1); orient(cc, c, n); bag.put(core, cc);
    },
    plume(c, dir, curve) {   // penacho: muchas hebras finas a lo largo del último tercio del tallo, abiertas y caídas
      for (let i = 0; i < 70; i++) {
        const t = 0.68 + 0.32 * r(), a = curve.getPoint(t), tan = curve.getTangent(t), side = V(r() - 0.5, (r() - 0.6) * 0.6, r() - 0.5).normalize();
        const d = tan.clone().multiplyScalar(0.6).add(side).normalize(), s = new THREE.SphereGeometry(0.004 * k, 5, 3); s.scale(1, 5 + 4 * r(), 1);
        bag.put(plume, orient(s, a.clone().addScaledVector(d, 0.012 * k), d));
      }
    },
    coins(c, dir, curve) {   // eucalipto: hojas redondas chicas, de a una y alternadas, separadas, del medio a la punta
      let s = 1;
      for (let t = 0.4; t <= 1.001; t += 0.075 + 0.02 * r()) {
        const a = curve.getPoint(Math.min(t, 1)), tan = curve.getTangent(Math.min(t, 1)), sz = (0.011 + 0.007 * (1 - t)) * k;
        const out = V(tan.z, 0.25, -tan.x).multiplyScalar(s).normalize(), disk = new THREE.CircleGeometry(sz, 12);
        disk.rotateX(-Math.PI / 2); disk.translate(0, 0, sz * 1.05);
        bag.put(lf, orient(disk, a, out.clone().add(V(0, 0.5, 0)))); s = -s;
      }
    },
    twig() {},
  };
  for (let s = 0; s < S.stems; s++) {
    const side = s % 2 ? 1 : -1, spread = (S.spread[0] + (S.spread[1] - S.spread[0]) * r()) * k, hgt = o.mouth + (S.height[0] + (S.height[1] - S.height[0]) * r() - 0.26) * k;   // alturas del estilo medidas sobre el florero de vidrio (boca a 0,26)
    const zz = (-0.02 + 0.1 * r()) * k, j = Math.min(0.012, o.r * 0.4);
    const pts = [V(x + (r() - 0.5) * Math.min(0.03, o.r), o.base, (r() - 0.5) * Math.min(0.03, o.r)), V(x + side * j, o.mouth, (r() - 0.5) * j),
      V(x + side * spread * 0.45, o.mouth + (hgt - o.mouth) * 0.7, zz * 0.6), V(x + side * spread, hgt, zz)];
    const curve = new THREE.CatmullRomCurve3(pts), tipName = S.tips[s % S.tips.length];
    tube(pts, S.radius ?? 0.0021);
    TIPS[tipName](curve.getPoint(1), curve.getTangent(1), curve);
    for (const t of [0.6, 0.8]) {
      if (r() > S.side) continue;
      const a = curve.getPoint(t), d = V(side * (0.04 + 0.05 * r()) * k, (0.025 + 0.05 * r()) * k, (r() - 0.5) * 0.06 * k), e = a.clone().add(d);
      const sub = [a, a.clone().addScaledVector(d, 0.5).add(V(0, 0.01 * k, 0)), e];
      tube(sub, 0.0014);
      const sideTip = tipName === 'dome' || tipName === 'buds' ? (r() < 0.4 ? 'dome' : 'buds') : tipName;
      if (sideTip !== 'plume' && sideTip !== 'coins') TIPS[sideTip](e, d.clone().normalize(), new THREE.CatmullRomCurve3(sub));
      else if (sideTip === 'coins') TIPS.coins(e, d, new THREE.CatmullRomCurve3(sub));
      if (S.leaves) leaf(a, V(-side * 0.5, 0.7, (r() - 0.5) * 0.6));
    }
    if (S.leaves) leaf(curve.getPoint(0.7), V(side * 0.6, 0.6, (r() - 0.5) * 0.6));
  }
  bag.addTo(g);
}

// potus: guías que salen de la tierra (a la altura "y", maceta de radio "rim"), pasan por el borde y caen ("trail"),
// con hojas acorazonadas alternadas, más unas hojas paradas al centro. Las guías salen hacia adelante y a los costados
// (no hacia la pared, en -Z). Tallos y hojas unidos por material
function pothos(g, M, r, { x = 0, y, rim, trail = 0.5, vines = 7 }) {
  const bag = meshBag(), stem = M.foliage('#5d7a3a'), greens = [M.foliage('#3f6b2e'), M.foliage('#5a8a3a'), M.foliage('#7da24a')];
  const V = (a, b, c) => new THREE.Vector3(a, b, c), up = V(0, 1, 0);
  const leafAt = (at, dir, s) => { const geo = leafGeo(s * 1.5, s * 0.75, 0.15); geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir.normalize())); geo.translate(at.x, at.y, at.z); bag.put(greens[Math.floor(r() * 3)], geo); };
  for (let i = 0; i < vines; i++) {
    const a = -0.25 + (i + 0.5) / vines * (Math.PI + 0.5) + (r() - 0.5) * 0.3, o = V(Math.cos(a), 0, Math.sin(a)), len = trail * (0.35 + 0.65 * r());
    const P = (k, dy) => V(x + o.x * k, y + dy, o.z * k);
    const curve = new THREE.CatmullRomCurve3([P(rim * 0.3, -0.015), P(rim * 0.85, 0.04), P(rim + 0.03, 0.01), P(rim + 0.05 + 0.02 * r(), -len * 0.55), P(rim + 0.04 + 0.05 * r(), -len)]);
    bag.put(stem, new THREE.TubeGeometry(curve, 28, 0.0022, 5, false));
    let side = 1;
    for (let t = 0.15; t < 0.98; t += 0.08 + 0.04 * r()) {
      const at = curve.getPoint(t), dir = V(o.x * 0.8 - o.z * side * 0.6, -0.3 - 0.4 * t, o.z * 0.8 + o.x * side * 0.6);
      leafAt(at, dir, (0.03 + 0.018 * r()) * (1 - 0.35 * t)); side = -side;
    }
  }
  for (let i = 0; i < 5; i++) { const a = r() * Math.PI * 2; leafAt(V(x + Math.cos(a) * rim * 0.3, y - 0.01, Math.sin(a) * rim * 0.3), V(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5 + 0.2), 0.04 + 0.015 * r()); }
  bag.addTo(g);
}
// objetos de cocina y estantes de tabletop-decor (ver su comentario); devuelve true si dibujó el objeto
function decorExtra(g, M, r, kind, it, x, V) {
  const lathe = (pts, mat, seg = 32, y = 0) => add(g, new THREE.LatheGeometry(v2(pts), seg), mat, x, y, 0);
  if (kind === 'pot') {   // olla con tapa, dos asas y perilla
    const R = it.size ?? 0.1, H = R * 1.1, steel = it.color ? M.lacquer(it.color) : M.metal('#c9ccd0', 0.3), dark = M.lacquer('#1d1d1f');
    lathe([[0.001, 0], [R * 0.95, 0], [R, 0.01], [R, H], [R * 0.97, H], [R * 0.97, 0.012], [0.001, 0.012]], steel, 40);
    lathe([[R + 0.004, H - 0.004], [R * 0.86, H + R * 0.12], [R * 0.2, H + R * 0.2], [0.001, H + R * 0.2]], it.lid ? M.lacquer(it.lid) : steel, 40);
    cyl(g, dark, x, H + R * 0.19, H + R * 0.19 + 0.022, 0, 0.012, 12);
    for (const s of [-1, 1]) { const m = add(g, new THREE.TorusGeometry(0.02, 0.0045, 6, 14, Math.PI), dark, x + s * (R - 0.002), H * 0.78, 0); m.rotation.order = 'YXZ'; m.rotation.set(Math.PI / 2, s * Math.PI / 2, 0); }
    return true;
  }
  if (kind === 'pan') {   // cacerola baja con tapa, mango largo hacia +X y perilla ("knob": su color, y el del mango)
    const R = it.size ?? 0.13, H = 0.06, body = M.lacquer(it.color ?? '#232325'), kc = M.lacquer(it.knob ?? '#7bbf3e');
    lathe([[0.001, 0], [R * 0.92, 0], [R, 0.012], [R * 1.02, H], [R * 0.99, H], [R * 0.97, 0.014], [0.001, 0.014]], body, 40);
    lathe([[R * 1.04, H - 0.004], [R * 0.9, H + 0.03], [R * 0.25, H + 0.045], [0.001, H + 0.046]], body, 40);
    lathe([[0.001, 0], [0.018, 0], [0.022, 0.012], [0.016, 0.026], [0.001, 0.028]], kc, 16, H + 0.044);
    const hdl = add(g, new THREE.CapsuleGeometry(0.012, 0.15, 4, 10), kc, x + R + 0.09, H * 0.75, 0); hdl.rotation.z = Math.PI / 2 - 0.12;
    return true;
  }
  if (kind === 'dish-rack') {   // escurridor de alambre: tres marcos, cuatro parantes, varillas al fondo y platos parados
    const W = 0.4, D = 0.26, H = 0.28, wire = M.metal('#cfd2d6', 0.3), bag = meshBag();
    const rod = (a, b, rad = 0.0025) => { const A = V(...a), B = V(...b), d = B.clone().sub(A), c = new THREE.CylinderGeometry(rad, rad, d.length(), 5); c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize())); c.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2); bag.put(wire, c); };
    const xs = [x - W / 2, x + W / 2], zs = [-D / 2, D / 2];
    for (const y of [0.025, 0.12, H]) { for (const z of zs) rod([xs[0], y, z], [xs[1], y, z]); for (const xx of xs) rod([xx, y, zs[0]], [xx, y, zs[1]]); }
    for (const xx of xs) for (const z of zs) rod([xx, 0.008, z], [xx, H, z], 0.003);
    for (let xx = xs[0] + 0.03; xx < xs[1] - 0.01; xx += 0.03) { rod([xx, 0.025, zs[0]], [xx, 0.025, zs[1]], 0.0018); for (const z of [-0.07, 0.07]) rod([xx, 0.025, z], [xx, 0.1, z], 0.0018); }
    for (const xx of xs) for (const z of zs) cyl(g, M.lacquer('#2b2c2e'), xx, 0, 0.01, z, 0.006, 8);
    bag.addTo(g);
    for (let k = 0; k < (it.plates ?? 0); k++) { const m = cyl(g, M.ceramic(it.color ?? '#f3f1ec'), x - 0.1 + k * 0.06, 0.03, 0.04, 0, 0.1, 32); m.rotation.z = Math.PI / 2 - 0.12; m.position.y = 0.128; }
    return true;
  }
  if (kind === 'jars') {   // frascos de vidrio con especias de colores y tapa metálica, en fila sobre X
    const n = it.count ?? 4, fills = it.colors ?? ['#b5462e', '#d9a441', '#6b7a3a', '#8a5a3a', '#e3c79a'], lid = M.metal(it.lid ?? '#c9ccd0', 0.35);
    for (let k = 0; k < n; k++) {
      const jx = x + (k - (n - 1) / 2) * 0.062, hh = 0.07 + 0.03 * r();
      add(g, new THREE.LatheGeometry(v2([[0.001, 0], [0.026, 0], [0.028, 0.004], [0.028, hh], [0.022, hh + 0.006], [0.001, hh + 0.006]]), 24), M.glass(), jx, 0, 0).castShadow = false;
      cyl(g, M.lacquer(fills[(k + Math.floor(r() * fills.length)) % fills.length]), jx, 0.004, hh * (0.45 + 0.45 * r()), 0, 0.0245, 20);
      cyl(g, lid, jx, hh + 0.005, hh + 0.02, 0, 0.024, 20);
    }
    return true;
  }
  if (kind === 'basket') {   // canasto de mimbre: tronco de cono (o de pirámide, "shape": "square") con el borde enrollado
    const R = (it.size ?? 0.26) / 2, H = it.height ?? R * 0.9, sq = it.shape === 'square', seg = sq ? 4 : 32, m = M.wicker(it.color ?? '#c79a5e');
    const geo = uvScale(new THREE.LatheGeometry(v2([[0.001, 0.003], [R * 0.78, 0.003], [R * 0.8, 0], [R, H], [R * 0.985, H]]), seg), sq ? 3 : 7, 3);
    const b = add(g, geo, m, x, 0, 0); if (sq) b.rotation.y = Math.PI / 4;
    const rim = add(g, new THREE.TorusGeometry(R * (sq ? 1.0 : 0.995), 0.008, 6, seg === 4 ? 4 : 40), M.wicker(shade(it.color ?? '#c79a5e', -0.05)), x, H, 0);
    rim.rotation.x = Math.PI / 2; if (sq) rim.rotation.z = Math.PI / 4;
    return true;
  }
  if (kind === 'box') {   // caja con tapa: cuerpo apenas más chico que la tapa
    const [bw, bh, bd] = it.size ?? [0.28, 0.12, 0.2], c = it.color ?? '#e65a8a';
    blk(g, M.lacquer(c), [x - bw / 2 + 0.006, x + bw / 2 - 0.006], [0, bh - 0.02], [-bd / 2 + 0.006, bd / 2 - 0.006], 0.01);
    blk(g, M.lacquer(shade(c, 0.05)), [x - bw / 2, x + bw / 2], [bh - 0.026, bh], [-bd / 2, bd / 2], 0.008);
    return true;
  }
  if (kind === 'frame') {   // portarretratos parado, apenas inclinado hacia atrás sobre una pata
    const [fw, fh] = it.size ?? [0.15, 0.2], fr = it.color ? M.wood(it.color) : M.lacquer('#2a2a2b'), b = 0.018, tilt = 0.17, fg = new THREE.Group();
    fg.position.set(x, 0, 0); fg.rotation.x = -tilt; g.add(fg);
    blk(fg, fr, [-fw / 2, fw / 2], [0, b], [0, 0.016], 0.002); blk(fg, fr, [-fw / 2, fw / 2], [fh - b, fh], [0, 0.016], 0.002);
    blk(fg, fr, [-fw / 2, -fw / 2 + b], [b, fh - b], [0, 0.016], 0.002); blk(fg, fr, [fw / 2 - b, fw / 2], [b, fh - b], [0, 0.016], 0.002);
    blk(fg, M.lacquer('#3a3634'), [-fw / 2 + b - 0.002, fw / 2 - b + 0.002], [b - 0.002, fh - b + 0.002], [0.001, 0.005]);
    add(fg, new THREE.PlaneGeometry(fw - 2 * b, fh - 2 * b), M.art(it.palette ?? ['#c9b79c', '#5d6b7a', '#e9e2d4', '#8a6f55'], 4 + Math.floor(r() * 9), it.style ?? 'lake'), 0, fh / 2, 0.0065).castShadow = false;
    const top = fh * 0.55;
    strut(g, fr, [x, top * Math.cos(tilt) - 0.01, -top * Math.sin(tilt) - 0.002], [x, 0.004, -top * Math.sin(tilt) - 0.07], 0.004);
    return true;
  }
  if (kind === 'rack') {   // organizador escalonado de mesa: dos costados en escalera y tres estantes, cada uno más alto y
    // más atrás; lleva cosas en cada escalón ("fill": false lo deja vacío)
    const W = it.width ?? 0.36, D = it.depth ?? 0.27, t = 0.012, sd = D / 3, hs = [0.11, 0.22, 0.33], wood = M.wood(it.color ?? '#e0c9a0');
    const prof = new THREE.Shape(v2([[-D / 2, 0], [D / 2, 0], [D / 2, hs[0]], [D / 2 - sd, hs[0]], [D / 2 - sd, hs[1]], [D / 2 - 2 * sd, hs[1]], [D / 2 - 2 * sd, hs[2]], [-D / 2, hs[2]]]));
    for (const sx of [-W / 2 + t, W / 2]) { const geo = new THREE.ExtrudeGeometry(prof, { depth: t, bevelEnabled: false }); geo.rotateY(-Math.PI / 2); add(g, uvScale(geo, 2), wood, x + sx, 0, 0); }
    hs.forEach((h, i) => blk(g, wood, [x - W / 2 + t - 0.002, x + W / 2 - t + 0.002], [h - t, h], [D / 2 - (i + 1) * sd, D / 2 - i * sd]));
    blk(g, wood, [x - W / 2 + t - 0.002, x + W / 2 - t + 0.002], [0, t], [-D / 2, D / 2]);
    if (it.fill !== false) {
      const things = [['box', { color: '#e8609a', size: [0.2, 0.07, 0.07] }], ['basket', { color: '#c58f52', size: 0.08, height: 0.07 }], ['jars', { count: 3 }]];
      things.forEach(([kd, o], i) => { const sub = new THREE.Group(); sub.position.set(0, hs[i], D / 2 - (i + 0.5) * sd); g.add(sub); decorExtra(sub, M, r, kd, o, x + (kd === 'jars' ? 0 : (i - 1) * 0.06), V); });
    }
    return true;
  }
  if (kind === 'desk-lamp') {   // flexo: base redonda, dos brazos con una articulación y pantalla cónica hacia abajo y adelante;
    // de noche se prende ("intensity")
    const c = M.lacquer(it.color ?? '#f2f1ee'), j = M.metal('#c9ccd0', 0.3), up = V(0, 1, 0);
    lathe([[0.001, 0], [0.07, 0], [0.072, 0.012], [0.06, 0.03], [0.001, 0.03]], c, 32);
    const A = [x, 0.025, 0], B = [x, 0.3, -0.06], C = [x, 0.42, 0.1], dir = V(0, -0.75, 0.66).normalize();
    strut(g, c, A, B, 0.008); add(g, new THREE.SphereGeometry(0.014, 12, 8), j, ...B); strut(g, c, B, C, 0.007);
    const sh = add(g, new THREE.LatheGeometry(v2([[0.014, -0.012], [0.026, 0.02], [0.062, 0.1], [0.059, 0.1]]), 32), M.ceramicDS(it.color ?? '#f2f1ee'), ...C);
    sh.quaternion.setFromUnitVectors(up, dir);
    const bulb = V(...C).addScaledVector(dir, 0.06);
    add(g, new THREE.SphereGeometry(0.02, 12, 8), M.glow(), bulb.x, bulb.y, bulb.z).castShadow = false;
    lampSpot(g, bulb.x, bulb.y, bulb.z, it.intensity ?? 2, 0.9, 3);
    return true;
  }
  if (kind === 'pothos') {   // potus en maceta ("pot" su color), con guías que caen ("trail")
    const R = it.size ?? 0.07, H = R * 1.3;
    lathe([[0.001, 0], [R * 0.75, 0], [R, H], [R * 1.06, H + 0.006], [R * 0.96, H + 0.006], [R * 0.93, H - 0.01]], M.ceramic(it.pot ?? '#c8442e'), 32);
    cyl(g, M.lacquer('#3b2e24'), x, H - 0.04, H - 0.015, 0, R * 0.93, 24);
    pothos(g, M, r, { x, y: H - 0.015, rim: R, trail: it.trail ?? 0.5, vines: it.vines ?? 7 });
    return true;
  }
  return false;
}

// adorno → [recipiente, estilo de ramo, ajustes]
const RAMOS = { 'dried-flowers': ['glass', 'dried'], eucalyptus: ['glass', 'eucalyptus'], pampas: ['tall', 'pampas'], wildflowers: ['jar', 'wildflowers'],
  vase: ['bud', 'branches', { scale: 0.8 }], 'bottle-flowers': ['bottle', 'dried', { stems: 3, scale: 0.7 }] };

// objetos chicos para apoyar en una mesa, mesada o estante, en fila sobre X, cada uno apoyado en y = 0. "items":
// "books", "bowl", "candle", "plant", "diffuser", "bottle" (botella de vidrio, llena de "fill" si se da) y los de ramo
// (ver bouquet): "vase" (cerámica con ramas secas), "bottle-flowers" (botella con flores secas), "dried-flowers" (vidrio
// con flores secas, cabezuelas "flowers" y pimpollos), "eucalyptus" (vidrio con eucalipto), "pampas" (cerámica alta con
// pampa), "wildflowers" (frasco con flores de campo). "vase": color de la cerámica; "flowers": color de las cabezuelas
// Cocina y estantes (2026-11-08): "pot" (olla con tapa), "pan" (cacerola baja con mango largo; "knob" color de la perilla
// y el mango), "dish-rack" (escurridor de alambre; "plates" platos parados), "jars" (frascos de especias; "count",
// "colors"), "basket" (canasto de mimbre; "size", "height", "shape": "square"), "box" (caja con tapa; "size": [ancho, alto,
// fondo]), "frame" (portarretratos; "size": [ancho, alto]), "pothos" (potus en maceta con guías que caen, "trail"),
// "rack" (organizador escalonado de mesa con cosas en cada escalón) y "desk-lamp" (flexo que se prende de noche).
// Cada objeto puede ser el nombre o { "kind", "color", "x" (su lugar en la fila), … }
function tabletopDecor(p, { M }) {
  const g = new THREE.Group(), list = p.items ?? ['vase', 'books', 'bowl'], r = rng(p.seed ?? 3), step = p.spacing ?? 0.22, V = (a, b, c) => new THREE.Vector3(a, b, c);
  list.forEach((entry, i) => {
    const it = typeof entry === 'string' ? { kind: entry } : entry, kind = it.kind, x = it.x ?? (i - (list.length - 1) / 2) * step;
    if (decorExtra(g, M, r, kind, it, x, V)) return;
    if (kind === 'books') {   // pila de libros acostados
      let y = 0;
      for (let k = 0; k < 3; k++) { const bh = 0.025 + r() * 0.015; blk(g, M.lacquer(['#7a3b2e', '#c9b79c', '#2f4a5f'][k]), [x - 0.1 + k * 0.006, x + 0.1 - k * 0.01], [y, y + bh], [-0.07 + k * 0.005, 0.07 - k * 0.006], 0.002); y += bh; }
    } else if (kind === 'bowl') {
      add(g, new THREE.LatheGeometry(v2([[0.001, 0], [0.04, 0], [0.09, 0.05], [0.1, 0.07], [0.094, 0.07], [0.084, 0.052], [0.035, 0.008], [0.001, 0.008]]), 40), M.ceramic(p.bowl ?? '#e9e4dc'), x, 0, 0);
    } else if (kind === 'bottle') {   // botella de vidrio; adentro, semillas o piedras ("fill")
      vessel(g, M, 'bottle', x);
      if (p.fill) cyl(g, M.lacquer(p.fill), x, 0.004, 0.17, 0, 0.036, 24);
    } else if (RAMOS[kind]) {   // recipiente + ramo (ver bouquet)
      const [vk, style, o] = RAMOS[kind], v = vessel(g, M, vk, x, p.vase);
      bouquet(g, M, r, { x, ...v, style, flowers: p.flowers, ...o });
    } else if (kind === 'diffuser') {   // difusor de aromas: frasco de vidrio ámbar con varillas
      add(g, new THREE.LatheGeometry(v2([[0.001, 0], [0.03, 0], [0.032, 0.005], [0.032, 0.07], [0.012, 0.085], [0.012, 0.1], [0.001, 0.1]]), 24), M.tintedGlass('#7a5530', 0.7), x, 0, 0).castShadow = false;
      for (let k = 0; k < 6; k++) { const s = cyl(g, M.wood('#c79a6a'), x, 0.04, 0.3, 0, 0.0018, 4); s.rotation.set((r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5); s.castShadow = false; }
    } else if (kind === 'candle') {
      cyl(g, M.ceramic(p.candle ?? '#f1ece2'), x, 0, 0.1, 0, 0.035, 24);
    } else if (kind === 'plant') {   // plantita en maceta chica
      add(g, new THREE.LatheGeometry(v2([[0.001, 0], [0.05, 0], [0.06, 0.09], [0.054, 0.09], [0.05, 0.08], [0.001, 0.08]]), 32), M.ceramic(p.pot ?? '#cfc6ba'), x, 0, 0);
      for (let k = 0; k < 7; k++) { const m = add(g, leafGeo(0.1 + r() * 0.06, 0.025, 0.3), M.leaf(), x, 0.075, 0); m.rotation.order = 'YXZ'; m.rotation.set(0.3 + 0.5 * r(), k / 7 * Math.PI * 2, 0); }
    }
  });
  return g;
}

/* ---------- piezas para departamentos cargados (2026-11-08, depto grande) ---------- */
// Llave de paso de cruz (grifería clásica), armada mirando a +Z desde el origen: roseta y vástago cromados y una cruz de
// cuatro brazos de loza ("color"). Quien la usa la ubica y la gira (en la pared, o hacia arriba sobre una mesada)
function crossTap(M, color = '#f4f4f2') {
  const g = new THREE.Group(), chrome = M.metal('#cfd2d6', 0.2), head = M.ceramic(color);
  disc(g, chrome, 0, 0, 0, 0.026, 0.008, 24);
  disc(g, chrome, 0, 0, 0.006, 0.011, 0.032, 16);
  disc(g, head, 0, 0, 0.034, 0.013, 0.02, 16);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4, m = add(g, new THREE.CapsuleGeometry(0.0055, 0.022, 4, 8), head, Math.cos(a) * 0.016, Math.sin(a) * 0.016, 0.044);
    m.rotation.z = a - Math.PI / 2; m.castShadow = false;
  }
  return g;
}
// pico de canilla: caño curvo que sale de la pared (z = 0) hacia +Z y baja la punta; "reach" cuánto sale
function spoutGeo(reach, drop = 0.05, r = 0.011) {
  const c = new THREE.CubicBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, reach * 0.6), new THREE.Vector3(0, 0, reach), new THREE.Vector3(0, -drop, reach));
  return new THREE.TubeGeometry(c, 20, r, 10, false);
}
// almohadón redondo: disco inflado (alto al centro y fino en el borde), con UV plana desde arriba (para los tejidos
// en anillos)
function roundPillowGeo(D, h, seed = 1) {
  let geo = new THREE.SphereGeometry(1, 48, 24);
  geo.deleteAttribute('uv'); geo.deleteAttribute('normal'); geo = mergeVertices(geo);
  const p = geo.attributes.position, v = new THREE.Vector3(), uv = new Float32Array(p.count * 2), ph = rng(seed)() * 6;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const rr = Math.hypot(v.x, v.z), puff = 1 - 0.85 * rr ** 2.2, wob = 1 + 0.015 * Math.sin(Math.atan2(v.z, v.x) * 5 + ph);
    const k = (rr > 1e-6 ? Math.min(1, rr ** 0.55) / rr : 1) * wob;
    p.setXYZ(i, v.x * k * D / 2, v.y * puff * h / 2, v.z * k * D / 2);
    uv[2 * i] = v.x * k * 0.5 + 0.5; uv[2 * i + 1] = v.z * k * 0.5 + 0.5;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.computeVertexNormals(); geo.computeBoundingBox(); geo.computeBoundingSphere();
  return geo;
}
// capitoné de un almohadón (pillowGeo: la cara de arriba es +Y): hunde la tela alrededor de cols × rows botones y
// devuelve dónde van los botones, sobre la tela hundida (en coordenadas del almohadón)
function tuftGeo(geo, w, d, cols, rows, depth) {
  const p = geo.attributes.position, pts = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) pts.push([(-0.5 + (i + 0.5) / cols) * w * 0.8, (-0.5 + (j + 0.5) / rows) * d * 0.72]);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i); if (y <= 0) continue;
    const x = p.getX(i), z = p.getZ(i); let k = 0;
    for (const [bx, bz] of pts) k = Math.max(k, Math.exp(-((x - bx) ** 2 + (z - bz) ** 2) / (2 * 0.03 ** 2)));
    p.setY(i, y - depth * k * Math.min(1, y / (depth * 2)));
  }
  geo.computeVertexNormals();
  return pts.map(([bx, bz]) => {
    let best = 0, bd = Infinity;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y <= 0) continue; const dd = (p.getX(i) - bx) ** 2 + (p.getZ(i) - bz) ** 2; if (dd < bd) { bd = dd; best = y; } }
    return [bx, best, bz];
  });
}
// botones del capitoné, hijos del almohadón (se mueven con él cuando restPillow lo apoya)
function addButtons(mesh, pts, mat) {
  const geo = new THREE.SphereGeometry(0.011, 10, 6);
  for (const [x, y, z] of pts) { const b = new THREE.Mesh(geo, mat); b.position.set(x, y - 0.002, z); b.scale.y = 0.55; b.castShadow = false; b.receiveShadow = true; mesh.add(b); }
}
// almohadón suelto de un sillón: color liso ("#…" o { color }), { pattern } estampado de hojas, { colors } tejido al
// crochet (en anillos si "shape": "round", en cuadrados de abuela si no); "size" el lado o el diámetro
function cushionLook(M, c, seed, size = 0.46) {
  const s = c.size ?? (c.shape === 'round' ? 0.42 : size);
  if (c.shape === 'round') return { geo: roundPillowGeo(s, 0.13, seed), mat: c.colors ? M.crochet(c.colors, 'rings') : M.fabric(c.color ?? '#d8cfc2'), round: true };
  const geo = uvScale(pillowGeo(s, 0.2, s, seed, 1), c.colors ? 1 : 4);
  return { geo, mat: c.colors ? M.crochet(c.colors, 'granny') : c.pattern ? M.print(c.pattern, 7) : M.fabric(c.color ?? c) };
}
// tabla curva (patas de mesa): su eje va de "a" a "b" por la curva cuadrática con control "c", en el plano (z, y);
// "w" el ancho de la tabla en ese plano y "t" el espesor en X (centrado en x = 0)
function bentBoard(a, c, b, w, t) {
  const q = new THREE.QuadraticBezierCurve(new THREE.Vector2(...a), new THREE.Vector2(...c), new THREE.Vector2(...b)), L = [], R = [];
  for (let i = 0; i <= 20; i++) {
    const u = i / 20, p0 = q.getPoint(u), tg = q.getTangent(u), n = new THREE.Vector2(-tg.y, tg.x);
    L.push(p0.clone().addScaledVector(n, w / 2)); R.push(p0.clone().addScaledVector(n, -w / 2));
  }
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape([...L, ...R.reverse()]), { depth: t - 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2 });
  geo.translate(0, 0, -(t - 0.006) / 2); geo.rotateY(-Math.PI / 2);   // la x de la forma pasa a ser z; el espesor queda en x
  return uvScale(geo, 2);
}

// diván de madera (sofá cama con cajón): caja baja con un cajón al frente (cama nido), colchón de asiento, brazos de
// listones con pasamanos, almohadones de respaldo capitoné ("backs") contra la pared, rulos en las puntas ("bolsters")
// y almohadones sueltos ("cushions", ver cushionLook). No tiene respaldo de madera: el fondo en -Z va contra la pared
function daybed(p, { M }) {
  const g = new THREE.Group(), L = p.length ?? 2.0, D = p.depth ?? 0.88, wc = p.wood ?? '#7a3a22', wood = M.wood(wc), fab = M.fabric(p.color ?? '#262c40');
  const arm = 0.065, base = 0.34, mt = 0.13, sh = base + mt, ah = p.armHeight ?? 0.66, x0 = -L / 2 + arm, x1 = L / 2 - arm;
  for (const s of [-1, 1]) {   // brazos: dos parantes, pasamanos, travesaño bajo y listones que entran 5 mm en ambos
    const a = s < 0 ? -L / 2 : L / 2 - arm, b = a + arm, c = (a + b) / 2;
    for (const z of [-D / 2 + 0.035, D / 2 - 0.035]) blk(g, wood, [a, b], [0, ah - 0.03], [z - 0.035, z + 0.035], 0.006);
    blk(g, wood, [a - 0.01, b + 0.01], [ah - 0.035, ah], [-D / 2 - 0.008, D / 2 + 0.008], 0.008);
    blk(g, wood, [a + 0.008, b - 0.008], [sh, sh + 0.045], [-D / 2 + 0.065, D / 2 - 0.065], 0.004);
    const n = Math.max(3, Math.round((D - 0.14) / 0.085));
    for (let i = 0; i < n; i++) { const z = -D / 2 + 0.07 + (i + 0.5) * (D - 0.14) / n; blk(g, wood, [c - 0.013, c + 0.013], [sh + 0.04, ah - 0.03], [z - 0.02, z + 0.02], 0.004); }
  }
  const fz = D / 2 - 0.03;
  blk(g, wood, [x0 - 0.002, x1 + 0.002], [0.02, base], [-D / 2 + 0.07, fz - 0.02], 0.004);                     // caja
  if (p.drawer !== false) {   // cajón (cama nido) con dos perillas y un travesaño arriba
    blk(g, wood, [x0 + 0.01, x1 - 0.01], [0.05, base - 0.047], [fz - 0.021, fz], 0.005);
    for (const sx of [-0.28, 0.28]) add(g, new THREE.SphereGeometry(0.018, 14, 10), M.wood(shade(wc, -0.08)), sx * L, (base + 0.003) / 2, fz + 0.012).scale.z = 0.8;
  }
  blk(g, wood, [x0 - 0.002, x1 + 0.002], [base - 0.04, base - 0.001], [fz - 0.021, fz + 0.004], 0.005);
  add(g, uvScale(new RoundedBoxGeometry(x1 - x0 - 0.01, mt, D - 0.07, 4, 0.045), 4), fab, 0, base + mt / 2, 0.005);   // colchón
  const nb = p.backs ?? 2, bw = (x1 - x0 - 0.02) / nb, btn = M.fabric(shade(p.color ?? '#262c40', -0.06));
  for (let i = 0; i < nb; i++) {   // respaldo: almohadones grandes parados, capitoné de 3 × 2 botones
    const geo = uvScale(pillowGeo(bw - 0.015, 0.17, 0.5, 80 + i), 4), pts = tuftGeo(geo, bw - 0.015, 0.5, 3, 2, 0.026);
    const m = restPillow(g, geo, fab, { x: x0 + 0.01 + (i + 0.5) * bw, rx: Math.PI / 2 - 0.2, rz: (i % 2 ? 1 : -1) * 0.015,
      supports: [{ n: [0, 1, 0], d: sh - 0.01 }, { n: [0, 0, 1], d: -D / 2 + 0.01 }], sink: 0.03 });
    addButtons(m, pts, btn);
  }
  if (p.bolsters !== false) for (const s of [-1, 1]) {   // rulos apoyados contra cada brazo
    const r = 0.09, len = D - 0.3, m = add(g, uvScale(new THREE.CapsuleGeometry(r, len - 2 * r, 8, 20), 3), fab, s * (x1 - r - 0.012), sh + r * 0.9 - 0.015, -D / 2 + 0.22 + len / 2);
    m.rotation.x = Math.PI / 2; m.scale.z = 0.9;
  }
  (p.cushions ?? []).forEach((c, i, all) => {
    const span = L - 0.95, x = all.length > 1 ? -span / 2 + (i * span) / (all.length - 1) : 0, r = rng(43 + i), { geo, mat, round } = cushionLook(M, c, 60 + i);
    restPillow(g, geo, mat, { x: c.x ?? x, rx: (round ? 1.3 : 1.05) + 0.12 * r(), ry: (r() - 0.5) * 0.3, rz: (i % 2 ? 1 : -1) * (0.05 + 0.08 * r()),
      supports: [{ n: [0, 1, 0], d: sh + 0.01 }, { n: [0, 0, 1], d: -D / 2 + 0.25 }], sink: 0.03 });
  });
  g.userData.h = ah;
  return g;
}

// silla de madera torneada: patas y parantes torneados, asiento de tabla, respaldo de husillos bajo un travesaño curvo
function spindleChair(p, { M }) {
  const g = new THREE.Group(), wood = M.wood(p.wood ?? '#4a2a1a'), sh = p.seatHeight ?? 0.45, top = p.height ?? 0.86;
  const turned = (x, z, y0, y1, r, seg = 14) => {
    const H = y1 - y0, prof = [[0.001, 0], [r * 0.8, 0], [r, H * 0.06], [r * 0.7, H * 0.18], [r * 1.1, H * 0.32], [r * 0.72, H * 0.48], [r * 0.82, H * 0.86], [r * 1.05, H * 0.93], [r * 0.8, H], [0.001, H]];
    add(g, new THREE.LatheGeometry(v2(prof), seg), wood, x, y0, z);
  };
  for (const sx of [-1, 1]) { turned(sx * 0.19, 0.18, 0, sh - 0.025, 0.02); turned(sx * 0.19, -0.18, 0, top, 0.019); }
  add(g, uvScale(new RoundedBoxGeometry(0.45, 0.035, 0.43, 3, 0.01), 2), wood, 0, sh - 0.0175, 0.005);
  for (const s of [-1, 1]) { bar(g, wood, 'x', -0.19, 0.19, 0.16, s * 0.18, 0.011); bar(g, wood, 'z', -0.18, 0.18, 0.2, s * 0.19, 0.011); }
  const rail = add(g, bentBoxGeo(0.45, 0.075, 0.03, 0.55), wood, 0, top - 0.06, -0.2); rail.position.z -= 0.005;
  for (let i = 0; i < 5; i++) { const x = -0.12 + i * 0.06; turned(x, -0.205 + 0.55 - Math.sqrt(0.3025 - x * x), sh - 0.005, top - 0.075, 0.009, 10); }
  return g;
}

// estante escalera apoyado contra la pared: dos largueros inclinados (arriba contra la pared, abajo separados de ella)
// y "shelves" estantes, más profundos cuanto más abajo, de 0,25 m a "height" - 0,12 m; el fondo en -Z (la pared)
function ladderShelf(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.6, h = p.height ?? 1.6, d = p.depth ?? 0.42, n = p.shelves ?? 4, wood = M.wood(p.color ?? '#d9c3a0');
  const sw = 0.035, st = 0.05, zb = d / 2 - st / 2, zt = -d / 2 + st / 2 + 0.012, len = Math.hypot(h, zb - zt), a = -Math.atan2(zb - zt, h);
  const zAt = y => zb + (zt - zb) * y / h;
  for (const sx of [-1, 1]) {
    const m = blk(g, wood, [-sw / 2, sw / 2], [-len / 2, len / 2], [-st / 2, st / 2], 0.005);
    m.position.set(sx * (w / 2 - sw / 2), h / 2 - 0.004, (zb + zt) / 2); m.rotation.x = a;
  }
  for (let i = 0; i < n; i++) {
    const y = 0.25 + i * (h - 0.37) / Math.max(1, n - 1);
    blk(g, wood, [-w / 2 + sw - 0.004, w / 2 - sw + 0.004], [y - 0.018, y], [-d / 2 + 0.01, zAt(y) + st / 2 - 0.004], 0.003);
  }
  g.userData.h = h;
  return g;
}

// estante de alambre cromado: cuatro parantes de caño y "shelves" bandejas (marco de caño y varillas a lo largo de X
// cada 2,5 cm, apoyadas en el marco); la de abajo a 12 cm del piso. El frente en +Z
function wireShelf(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.45, d = p.depth ?? 0.35, h = p.height ?? 1.05, n = p.shelves ?? 3, chrome = M.metal(p.color ?? '#cfd2d6', 0.25);
  const r = 0.0095, ix = w / 2 - r, iz = d / 2 - r, bag = meshBag();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cyl(g, chrome, sx * ix, 0.012, h, sz * iz, r, 12); cyl(g, M.lacquer('#2b2c2e'), sx * ix, 0, 0.014, sz * iz, r * 1.15, 12); }
  for (let i = 0; i < n; i++) {
    const y = 0.12 + i * (h - 0.16) / Math.max(1, n - 1);
    for (const s of [-1, 1]) { bar(g, chrome, 'x', -ix, ix, y, s * iz, 0.005, 8); bar(g, chrome, 'z', -iz, iz, y + 0.006, s * ix, 0.005, 8); }
    for (let z = -iz + 0.025; z < iz - 0.012; z += 0.025) { const c = new THREE.CylinderGeometry(0.0018, 0.0018, 2 * ix, 5); c.rotateZ(Math.PI / 2); c.translate(0, y + 0.0105, z); bag.put(chrome, c); }
  }
  bag.addTo(g);
  g.userData.h = h;
  return g;
}

// carro de cocina: bastidor laqueado de cuatro patas, tapa de madera ("top"), fila de "drawers" cajones arriba con
// tiradores negros, estante al medio ("shelf", su altura) y estante abajo con canastos blancos ("bins"); fondo en -Z
function kitchenCart(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 1.0, d = p.depth ?? 0.42, h = p.height ?? 0.9, frame = M.lacquer(p.color ?? '#f1ede4'), wood = M.wood(p.top ?? '#b8693a');
  const s = 0.045, tt = 0.035, dh = 0.13, n = p.drawers ?? 3, mid = p.shelf ?? 0.45, ix = w / 2 - s, iz = d / 2 - s;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) blk(g, frame, [sx * w / 2 - (sx > 0 ? s : 0), sx * w / 2 + (sx < 0 ? s : 0)], [0, h - tt + 0.002], [sz * d / 2 - (sz > 0 ? s : 0), sz * d / 2 + (sz < 0 ? s : 0)], 0.004);
  blk(g, wood, [-w / 2 - 0.015, w / 2 + 0.015], [h - tt, h], [-d / 2 - 0.015, d / 2 + 0.015], 0.006, 1.2);
  const yd = h - tt - dh;
  blk(g, frame, [-ix - 0.003, ix + 0.003], [yd, h - tt + 0.002], [-d / 2 + 0.006, d / 2 - 0.012]);              // caja de los cajones
  const dw = (2 * ix) / n, dark = M.lacquer('#2a2a2b');
  for (let i = 0; i < n; i++) {
    const a = -ix + i * dw + 0.003, b = -ix + (i + 1) * dw - 0.003;
    blk(g, frame, [a, b], [yd + 0.008, h - tt - 0.008], [d / 2 - 0.013, d / 2 + 0.004], 0.004);
    pull(g, dark, 'x', (a + b) / 2 - 0.045, (a + b) / 2 + 0.045, yd + dh * 0.55, d / 2 + 0.004, 0.014, 0.005);
  }
  for (const y of [mid, 0.07]) blk(g, frame, [-ix - 0.003, ix + 0.003], [y - 0.018, y], [-iz - 0.003, iz + 0.003]);
  if (p.bins) {   // canastos abiertos en el estante de abajo: fondo y cuatro paredes finas
    const nb = Math.max(1, Math.floor((2 * ix) / 0.3)), bw = (2 * ix - 0.02) / nb, bh = Math.min(0.24, mid - 0.018 - 0.07 - 0.04), bm = M.lacquer('#f4f4f2');
    for (let i = 0; i < nb; i++) {
      const a = -ix + 0.01 + i * bw + 0.006, b = a + bw - 0.012, z0 = -iz + 0.02, z1 = iz + 0.01, y0 = 0.07, t = 0.006;
      blk(g, bm, [a, b], [y0, y0 + t], [z0, z1], 0.002);
      blk(g, bm, [a, b], [y0 + t - 0.001, y0 + bh], [z0, z0 + t], 0.002); blk(g, bm, [a, b], [y0 + t - 0.001, y0 + bh], [z1 - t, z1], 0.002);
      blk(g, bm, [a, a + t], [y0 + t - 0.001, y0 + bh - 0.002], [z0 + t - 0.001, z1 - t + 0.001], 0.002); blk(g, bm, [b - t, b], [y0 + t - 0.001, y0 + bh - 0.002], [z0 + t - 0.001, z1 - t + 0.001], 0.002);
    }
  }
  g.userData.h = h;
  return g;
}

// botiquín de baño: caja con dos puertas de espejo, un nicho abierto a un costado ("open": su ancho; 0 sin nicho) con
// estante de madera, y una repisa abierta abajo ("shelf": su alto). Fondo en z = 0, base en y = 0 (la altura va en "y")
function medicineCabinet(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.62, h = p.height ?? 0.46, d = p.depth ?? 0.13, body = M.lacquer(p.color ?? '#f3f2ee');
  const sh = p.shelf ?? 0.1, op = p.open ?? 0.16, t = 0.014, wood = M.wood(p.inside ?? '#c9a172');
  blk(g, body, [-w / 2, w / 2], [0, t], [0, d], 0.002);                                       // base de la repisa
  blk(g, body, [-w / 2, w / 2], [sh, sh + t], [0, d], 0.002);                                 // piso del botiquín
  blk(g, body, [-w / 2, w / 2], [h - t, h], [0, d], 0.002);                                   // techo
  for (const x of [-w / 2, w / 2 - t]) blk(g, body, [x, x + t], [t, h - t], [0, d], 0.002);   // costados
  blk(g, body, [-w / 2 + t, w / 2 - t], [t, h - t], [0, 0.006]);                               // fondo
  const xd = op ? w / 2 - op : w / 2 - t;
  if (op) {   // nicho abierto: divisor, fondo y estante de madera
    blk(g, body, [xd - t / 2, xd + t / 2], [sh + t, h - t], [0.006, d], 0.002);
    blk(g, wood, [xd + t / 2, w / 2 - t], [sh + t, h - t], [0.006, 0.012]);
    blk(g, wood, [xd + t / 2 - 0.002, w / 2 - t + 0.002], [(sh + h) / 2 - 0.008, (sh + h) / 2 + 0.008], [0.012, d - 0.012]);
  }
  const xa = -w / 2 + 0.003, dw = (xd - t / 2 - xa) / 2;
  for (let i = 0; i < 2; i++) blk(g, M.mirror(), [xa + i * dw + (i ? 0.0015 : 0), xa + (i + 1) * dw - (i ? 0 : 0.0015)], [sh + t + 0.003, h - 0.003], [d, d + 0.006], 0.002);
  g.userData.h = h;
  return g;
}

// repisa de pared (fondo en z = 0, base en y = 0; la altura va en "y" del item). "style": "cubby" (caja abierta con
// "cells" divisiones y la tapa de otro color, "top"), "spice" (dos estantes entre costados curvos, con una luz bajo el de
// abajo) o "box" (cubo abierto con el interior de madera, "inside")
function wallShelf(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.6, h = p.height ?? 0.3, d = p.depth ?? 0.22, t = p.thickness ?? 0.018, style = p.style ?? 'cubby';
  const mat = p.material === 'lacquer' ? M.lacquer(p.color ?? '#f2f1ed') : M.wood(p.color ?? '#c9a172');
  if (style === 'spice') {   // costados de perfil curvo (más hondos abajo), dos estantes y una luz bajo el de abajo
    const sh = new THREE.Shape(v2([[0, 0], [d, 0], [d, 0.03], [d * 0.45, h * 0.62], [0.05, h], [0, h]]));
    for (const x of [-w / 2, w / 2 - t]) { const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false }); geo.rotateY(-Math.PI / 2); add(g, uvScale(geo, 2), mat, x + t, 0, 0); }
    blk(g, mat, [-w / 2 + t - 0.003, w / 2 - t + 0.003], [0.03, 0.03 + t], [0.004, d - 0.004], 0.003);
    blk(g, mat, [-w / 2 + t - 0.003, w / 2 - t + 0.003], [h * 0.5, h * 0.5 + t], [0.004, d * 0.55], 0.003);
    blk(g, mat, [-w / 2 + t - 0.002, w / 2 - t + 0.002], [0.03 + t, h - 0.01], [0, 0.006]);
    if (p.light !== false) {
      blk(g, M.led(), [-w / 2 + t + 0.02, w / 2 - t - 0.02], [0.012, 0.03], [d - 0.05, d - 0.03], 0.006).castShadow = false;
      const l = new THREE.RectAreaLight(WARM, 0, w - 2 * t - 0.04, 0.03); l.position.set(0, 0.01, d - 0.04); l.rotation.x = -Math.PI / 2; l.userData.night = p.intensity ?? 6; g.add(l);
    }
    g.userData.h = h;
    return g;
  }
  const top = p.top ? M.lacquer(p.top) : mat, inside = p.inside ? M.wood(p.inside) : mat;
  blk(g, mat, [-w / 2, w / 2], [0, t], [0, d], 0.003);
  blk(g, top, [-w / 2, w / 2], [h - t, h], [0, d], 0.003);
  for (const x of [-w / 2, w / 2 - t]) blk(g, mat, [x, x + t], [t - 0.001, h - t + 0.001], [0, d], 0.002);
  blk(g, inside, [-w / 2 + t, w / 2 - t], [t, h - t], [0, 0.006]);
  const cells = style === 'box' ? 1 : (p.cells ?? 3);
  for (let c = 1; c < cells; c++) { const x = -w / 2 + c * w / cells; blk(g, mat, [x - t / 2, x + t / 2], [t - 0.001, h - t + 0.001], [0.006, d - 0.003], 0.002); }
  g.userData.h = h;
  return g;
}

// lavarropas de carga frontal: gabinete enlozado, tablero arriba con cajón del jabón, perilla y visor, y puerta redonda
// con aro cromado y vidrio oscuro; el fondo en -Z
function washer(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.6, d = p.depth ?? 0.55, h = p.height ?? 0.85, body = M.lacquer(p.color ?? '#f4f4f2'), chrome = M.metal('#cfd2d6', 0.22), fz = d / 2;
  blk(g, M.lacquer('#55585c'), [-w / 2 + 0.03, w / 2 - 0.03], [0, 0.03], [-d / 2 + 0.03, d / 2 - 0.04]);
  blk(g, body, [-w / 2, w / 2], [0.03, h], [-d / 2, fz], 0.012);
  blk(g, body, [-w / 2 + 0.03, -w / 2 + 0.2], [h - 0.11, h - 0.03], [fz - 0.002, fz + 0.012], 0.006);            // cajón del jabón
  blk(g, M.screen(), [0.0, 0.09], [h - 0.085, h - 0.055], [fz, fz + 0.003], 0.002).castShadow = false;           // visor
  disc(g, chrome, w / 2 - 0.09, h - 0.07, fz, 0.026, 0.02, 24);                                                  // perilla
  const yc = 0.4, ring = add(g, new THREE.TorusGeometry(0.17, 0.02, 12, 48), chrome, 0, yc, fz + 0.018); ring.castShadow = false;
  add(g, new THREE.LatheGeometry(v2([[0.001, 0.05], [0.15, 0.04], [0.16, 0.0]]), 40), M.tintedGlass('#2c3036', 0.75), 0, yc, fz + 0.012).rotation.x = Math.PI / 2;
  blk(g, chrome, [0.15, 0.17], [yc - 0.05, yc + 0.05], [fz + 0.02, fz + 0.04], 0.006);                         // manija
  g.userData.h = h;
  return g;
}

// pileta de lavar de pie: batea honda de cemento o fibra sobre cuatro patas, con dos llaves de cruz y pico en la pared
// (el fondo en -Z es la pared)
function laundrySink(p, { M }) {
  const g = new THREE.Group(), w = p.width ?? 0.6, d = p.depth ?? 0.5, h = p.height ?? 0.85, tub = M.ceramic(p.color ?? '#e7e4dd'), bh = 0.32, rim = 0.05;
  add(g, ringGeo([-w / 2, -d / 2, w, d, 0.03], [-w / 2 + rim, -d / 2 + rim, w - 2 * rim, d - 2 * rim, 0.04], bh), tub, 0, h - bh, 0);
  blk(g, tub, [-w / 2 + 0.01, w / 2 - 0.01], [h - bh, h - bh + 0.03], [-d / 2 + 0.01, d / 2 - 0.01], 0.008);   // fondo de la batea
  const leg = M.metal('#9ea2a6', 0.4);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, leg, sx * (w / 2 - 0.05), 0, h - bh + 0.005, sz * (d / 2 - 0.05), 0.016, 12);
  for (const sx of [-0.12, 0.12]) { const t = crossTap(M); t.position.set(sx, h + 0.22, -d / 2); g.add(t); }
  const sp = add(g, spoutGeo(0.16, 0.05), M.metal('#cfd2d6', 0.2), 0, h + 0.14, -d / 2);
  disc(g, M.metal('#cfd2d6', 0.2), 0, h + 0.14, -d / 2, 0.022, 0.008, 20);
  g.userData.h = h + 0.25;
  return g;
}

export const COMPONENTS = {
  'bed': bed, 'folded-towels': foldedTowels, 'nightstand': nightstand, 'table-lamp': tableLamp,
  'wardrobe': wardrobe, 'rug': rug, 'ceiling-light': ceilingLight, 'downlight': downlight, 'plant': plant, 'wall-art': wallArt,
  'sofa': sofa, 'dining-table': diningTable, 'chair': chair, 'side-table': sideTable, 'cube-shelf': cubeShelf, 'tv': tv,
  'ac-split': acSplit, 'curtains': curtains, 'round-mirror': roundMirror, 'floor-mirror': floorMirror,
  'fridge': fridge, 'appliance': appliance, 'kitchen-base': kitchenBase, 'kitchen-wall': kitchenWall,
  'bathtub': bathtub, 'shower-curtain': showerCurtain, 'toilet': toilet, 'bidet': bidet, 'vanity': vanity,
  'wall-dispensers': wallDispensers, 'bath-mat': bathMat,
  'bubble-sofa': bubbleSofa, 'ribbon-pendant': ribbonPendant, 'vent-grille': ventGrille, 'range': range, 'water-heater': waterHeater, 'ceiling-fan': ceilingFan, 'grill': grill,
  'wall-tiles': wallTiles, 'shower': shower, 'capsule-mirror': capsuleMirror, 'towel-bar': towelBar,
  'stair': stair, 'railing': railing, 'paneling': paneling, 'armchair': armchair, 'pouf': pouf, 'coffee-table': coffeeTable,
  'sideboard': sideboard, 'pendant': pendant, 'chandelier': chandelier, 'track-light': trackLight, 'sconce': sconce, 'bath-mirror': bathMirror, 'glass-screen': glassScreen,
  'panel-light': panelLight, 'led-strip': ledStrip, 'floor-lamp': floorLamp, 'table-setting': tableSetting, 'wall-desk': wallDesk,
  'floor-fan': floorFan, 'bunk-bed': bunkBed, 'desk': desk, 'bookshelf': bookshelf, 'tabletop-decor': tabletopDecor,
  'room-divider': roomDivider, 'bench': bench, 'console-table': consoleTable, 'bar-stool': barStool,
  'ladder-shelf': ladderShelf, 'wire-shelf': wireShelf, 'kitchen-cart': kitchenCart, 'medicine-cabinet': medicineCabinet, 'wall-shelf': wallShelf,
  'washer': washer, 'laundry-sink': laundrySink,
};

/* ---------- aberturas: X a lo largo de la pared desde el inicio del vano, Z hacia el interior ---------- */
// "frosted": vidrio esmerilado (ventanas a un patio o a un lavadero); "bars": travesaños horizontales en cada hoja.
// "fixed": paño fijo, un solo vidrio sin hojas ni manijas (ventanales que no abren). "fixedBelow": alto en metros de un
// paño fijo abajo, con travesaño, y las hojas corredizas arriba (vidrio repartido de las ventanas de aluminio)
function slidingWindow(o, { len, h, t, H, M, wallColor }) {
  const g = new THREE.Group(), alu = M.lacquer(o.frame ?? '#f2f2f2'), glass = o.frosted ? M.frosted('#e6ebec', 0.82) : M.glass(), dark = M.lacquer('#6d7177');
  const fw = 0.05, fd = 0.08;
  blk(g, alu, [fw, len - fw], [0, 0.04], [-fd / 2 + 0.002, fd / 2 - 0.002], 0.004);   // riel inferior
  blk(g, dark, [fw, len - fw], [0.036, 0.044], [-0.03, 0.03]);                         // ranuras del riel
  blk(g, alu, [fw, len - fw], [h - fw, h], [-fd / 2 + 0.002, fd / 2 - 0.002], 0.004);
  blk(g, alu, [0, fw], [0, h], [-fd / 2, fd / 2], 0.004);
  blk(g, alu, [len - fw, len], [0, h], [-fd / 2, fd / 2], 0.004);
  const fb = o.fixed ? 0 : Math.max(0, Math.min(h - 0.3, o.fixedBelow ?? 0));
  if (o.fixed) {   // paño fijo: el vidrio tomado directo por el marco
    blk(g, glass, [fw - 0.005, len - fw + 0.005], [0.035, h - fw + 0.005], [-0.003, 0.003]).castShadow = false;
  }
  if (fb) {   // paño fijo de abajo y travesaño sobre el que corren las hojas
    blk(g, alu, [fw, len - fw], [fb - 0.02, fb + 0.025], [-fd / 2 + 0.002, fd / 2 - 0.002], 0.004);
    blk(g, glass, [fw - 0.005, len - fw + 0.005], [0.035, fb - 0.015], [-0.003, 0.003]).castShadow = false;
  }
  const n = o.fixed ? 0 : o.panels ?? 2, pw = (len - 2 * fw) / Math.max(1, n);
  for (let i = 0; i < n; i++) {
    const x0 = fw + i * pw - (i ? 0.02 : 0), x1 = fw + (i + 1) * pw + (i < n - 1 ? 0.02 : 0), zz = i % 2 ? -0.017 : 0.017;
    const y0 = fb ? fb + 0.03 : 0.045, y1 = h - fw - 0.003, s = 0.04;
    blk(g, alu, [x0, x0 + s], [y0, y1], [zz - 0.013, zz + 0.013], 0.003);
    blk(g, alu, [x1 - s, x1], [y0, y1], [zz - 0.013, zz + 0.013], 0.003);
    blk(g, alu, [x0 + s, x1 - s], [y0, y0 + 0.07], [zz - 0.012, zz + 0.012], 0.003);
    blk(g, alu, [x0 + s, x1 - s], [y1 - s, y1], [zz - 0.012, zz + 0.012], 0.003);
    blk(g, glass, [x0 + s - 0.005, x1 - s + 0.005], [y0 + 0.065, y1 - s + 0.005], [zz - 0.003, zz + 0.003]).castShadow = false;
    for (let k = 1; k <= (o.bars ?? 0); k++) { const yb = y0 + 0.07 + k * (y1 - s - y0 - 0.07) / ((o.bars ?? 0) + 1); blk(g, alu, [x0 + s - 0.003, x1 - s + 0.003], [yb - 0.012, yb + 0.012], [zz - 0.011, zz + 0.011], 0.002); }
    const hx = i === 0 ? x1 - 0.02 : x0 + 0.02;
    const hy = fb ? Math.min(h - 0.2, (y0 + y1) / 2) : 1.05;
    blk(g, dark, [hx - 0.008, hx + 0.008], [hy - 0.1, hy + 0.1], [zz + (zz > 0 ? 0.013 : -0.023), zz + (zz > 0 ? 0.023 : -0.013)], 0.004);
  }
  blk(g, M.ceramic('#dcd6cc'), [-0.03, len + 0.03], [-0.02, 0.005], [-t / 2 - 0.04, -fd / 2]);  // umbral exterior
  // "grille": reja de seguridad por fuera, de barras en rombo (color o true = blanca). Las dos direcciones van en planos
  // distintos para que en los cruces no compartan caras
  if (o.grille) {   // en su propio grupo ("part": la reja), para que el motor la saque si la ventana usa la vista de la foto
    const g0 = g, gr = new THREE.Group(); gr.userData.part = 'grille'; g0.add(gr);
    const gm = M.lacquer(typeof o.grille === 'string' ? o.grille : '#f1f1ef'), cw = o.grilleCell ?? 0.32, ch = cw * 1.7, b = 0.014;
    const zf = -t / 2 - 0.02;
    blk(gr, gm, [0, len], [0, b * 2], [zf - b, zf + b]); blk(gr, gm, [0, len], [h - b * 2, h], [zf - b, zf + b]);
    blk(gr, gm, [0, b * 2], [b * 2, h - b * 2], [zf - b, zf + b]); blk(gr, gm, [len - b * 2, len], [b * 2, h - b * 2], [zf - b, zf + b]);
    for (const dir of [1, -1]) for (let c = -h / ch * cw; c < len + h / ch * cw; c += cw) {
      // recta x = c + dir * y * cw / ch, recortada al marco
      const pts = [];
      for (const y of [b * 2, h - b * 2]) pts.push([c + dir * y * cw / ch, y]);
      let [[xa, ya], [xb, yb]] = pts; const k = (yb - ya) / (xb - xa);
      const clip = (x, y, xl) => [xl, y + (xl - x) * k];
      if (xa < b * 2) [xa, ya] = clip(xa, ya, b * 2); if (xa > len - b * 2) [xa, ya] = clip(xa, ya, len - b * 2);
      if (xb < b * 2) [xb, yb] = clip(xb, yb, b * 2); if (xb > len - b * 2) [xb, yb] = clip(xb, yb, len - b * 2);
      const L = Math.hypot(xb - xa, yb - ya);
      if (L < 0.03 || Math.min(ya, yb) > h - b * 2 + 1e-6 || Math.max(ya, yb) < b * 2 - 1e-6) continue;
      const m = add(gr, new THREE.BoxGeometry(L, b, b), gm, (xa + xb) / 2, (ya + yb) / 2, zf + (dir > 0 ? b / 2 : -b / 2));
      m.rotation.z = Math.atan2(yb - ya, xb - xa); m.castShadow = true;
    }
  }
  // persiana de enrollar: el cajón queda dentro del muro (o de la viga de "structure"); se ve solo la persiana por
  // fuera del vidrio, en sus guías, bajada "shutter" metros (las primeras tablillas, con su fila de agujeritos)
  if (o.shutterBox || o.shutter) {
    const drop = Math.min(h - 0.1, o.shutter ?? 0.14), sz = [-fd / 2 - 0.026, -fd / 2 - 0.008], slat = M.lacquer(o.shutterColor ?? '#9da2a8');
    for (const x of [0.006, len - 0.03]) blk(g, alu, [x, x + 0.024], [0.04, h], [sz[0] - 0.006, sz[1] + 0.004], 0.002);   // guías
    const n = Math.max(1, Math.round(drop / 0.045)), sh = drop / n;
    for (let i = 0; i < n; i++) blk(g, slat, [0.018, len - 0.018], [h - (i + 1) * sh + 0.002, h - i * sh - (i ? 0 : 0.003)], sz, 0.004);
    blk(g, M.lacquer('#55595e'), [0.03, len - 0.03], [h - drop - 0.012, h - drop + 0.004], [sz[0] - 0.002, sz[1] + 0.002], 0.003); // tablilla final
  }
  return g;
}

function door(o, { len, h, t, M }) {
  const g = new THREE.Group(), jw = 0.035, cw = 0.065;
  const wood = o.material === 'lacquer' ? M.lacquer(o.color ?? '#f4f4f2') : M.wood(o.color ?? '#b36d2e');
  const hw = M.metal(o.handle ?? '#c8ccd1', 0.25);
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
  // "slide" (2026-11-09, depto 7): puerta corrediza colgada de un riel sobre la cara de la pared del lado del ambiente
  // (la que el motor elige o "side"); corre hacia el lado de "hinge" ("end" = hacia el final de la pared) y el número
  // es cuánto está corrida (0 = cerrada). Hoja lisa con tirador embutido
  // "pocket": corrediza embutida, la hoja corre por dentro de la pared (sin riel a la vista); abierta solo asoma el canto
  if (o.slide !== undefined && o.slide !== false && o.pocket) {
    const lw = len - 2 * jw, toEnd = o.hinge === 'end', off = Math.min(lw - 0.03, +o.slide || 0) * (toEnd ? 1 : -1);
    const panel = new THREE.Group(); panel.position.set(jw + off, 0, 0); g.add(panel);
    blk(panel, wood, [0, lw], [0.012, h - jw - 0.004], [-0.018, 0.018], 0.003);
    const px = toEnd ? 0.03 : lw - 0.03;   // cerradura de gancho en el canto que queda a la vista
    blk(panel, M.lacquer(o.handle ?? '#b89a4a'), [px - 0.012, px + 0.012], [0.95, 1.08], [-0.02, 0.02], 0.002);
    return g;
  }
  if (o.slide !== undefined && o.slide !== false) {
    const pw = len + 0.1, toEnd = o.hinge === 'end', off = Math.min(pw, +o.slide || 0) * (toEnd ? 1 : -1);
    const z0 = t / 2 + 0.03, panel = new THREE.Group(); panel.position.set(-0.05 + off, 0, z0); g.add(panel);
    blk(panel, wood, [0, pw], [0.012, h + 0.03], [0, 0.035], 0.004);
    const px = toEnd ? 0.07 : pw - 0.07;   // tirador del lado que tira para abrir
    blk(panel, M.lacquer(o.handle ?? '#a07a3c'), [px - 0.015, px + 0.015], [0.95, 1.1], [0.031, 0.037], 0.002);
    const r0 = Math.min(-0.05, -0.05 + off) - 0.02, r1 = Math.max(pw - 0.05, pw - 0.05 + off) + 0.02;
    blk(g, M.metal(o.rail ?? '#c8ccd1', 0.3), [r0, r1], [h + 0.035, h + 0.07], [t / 2 + 0.004, t / 2 + 0.05], 0.004);
    return g;
  }
  const atEnd = o.hinge === 'end', dir = atEnd ? -1 : 1, a = THREE.MathUtils.degToRad(o.open ?? 0), lw = len - 2 * jw;
  const leaf = new THREE.Group(); leaf.position.set(atEnd ? len - jw : jw, 0, t / 2); g.add(leaf);
  const xs = atEnd ? [-lw + 0.003, -0.003] : [0.003, lw - 0.003], yT = h - jw - 0.004;
  // "glass": "half" = media hoja de arriba vidriada en "rows" paños esmerilados (puertas de servicio); "slot" = mirilla
  // angosta de vidrio esmerilado arriba al centro. Los tramos de la hoja alrededor del vidrio van 2 mm más finos que
  // el marco para no compartir caras
  if (!o.glass) blk(leaf, wood, xs, [0.006, yT], [-0.04, 0], 0.004);
  else {
    const fr = M.frosted(o.glassColor ?? '#e3e8e8', 0.8), [a, b] = xs, zi = [-0.038, -0.002];
    if (o.glass === 'slot') {
      const xm = (a + b) / 2, sw = 0.09, y0 = 1.3, y1 = 1.85;
      blk(leaf, wood, [a, xm - sw / 2], [0.006, yT], [-0.04, 0], 0.004); blk(leaf, wood, [xm + sw / 2, b], [0.006, yT], [-0.04, 0], 0.004);
      blk(leaf, wood, [xm - sw / 2 - 0.002, xm + sw / 2 + 0.002], [0.006, y0], zi); blk(leaf, wood, [xm - sw / 2 - 0.002, xm + sw / 2 + 0.002], [y1, yT], zi);
      blk(leaf, fr, [xm - sw / 2 - 0.002, xm + sw / 2 + 0.002], [y0 - 0.002, y1 + 0.002], [-0.022, -0.018]).castShadow = false;
      for (const [mx, my] of [[[xm - sw / 2 - 0.012, xm + sw / 2 + 0.012], [y0 - 0.012, y0]], [[xm - sw / 2 - 0.012, xm + sw / 2 + 0.012], [y1, y1 + 0.012]], [[xm - sw / 2 - 0.012, xm - sw / 2], [y0, y1]], [[xm + sw / 2, xm + sw / 2 + 0.012], [y0, y1]]]) blk(leaf, wood, mx, my, [-0.044, 0.004], 0.003);   // moldura
    } else {
      const rows = o.rows ?? 4, y0 = o.from ?? 1.0, st = 0.06, pane = (yT - st - y0) / rows;
      blk(leaf, wood, xs, [0.006, y0], [-0.04, 0], 0.004);
      blk(leaf, wood, [a, a + st], [y0, yT], zi.map((z, k) => z + (k ? 0.002 : -0.002)), 0.003); blk(leaf, wood, [b - st, b], [y0, yT], zi.map((z, k) => z + (k ? 0.002 : -0.002)), 0.003);
      blk(leaf, wood, [a + st - 0.002, b - st + 0.002], [yT - st, yT], zi, 0.003);
      for (let i = 1; i < rows; i++) blk(leaf, wood, [a + st - 0.002, b - st + 0.002], [y0 + i * pane - 0.012, y0 + i * pane + 0.012], [-0.03, -0.01], 0.003);
      blk(leaf, fr, [a + st - 0.002, b - st + 0.002], [y0 - 0.002, yT - st + 0.002], [-0.022, -0.018]).castShadow = false;
    }
  }
  for (const y of [0.25, 1.0, 1.8]) cyl(leaf, M.metal('#c8ccd1', 0.25), 0, y - 0.05, y + 0.05, -0.02, 0.007, 12);   // bisagras
  const hx = dir * (lw - 0.07);
  for (const [zf, zl] of [[0.004, 0.024], [-0.044, -0.064]]) {                                     // picaporte de los dos lados
    const ro = add(leaf, new THREE.CylinderGeometry(0.025, 0.025, 0.008, 24), hw, hx, 1.0, zf + (zl > 0 ? 0 : -0.004));
    ro.rotation.x = Math.PI / 2;
    blk(leaf, hw, [Math.min(hx, hx - dir * 0.12), Math.max(hx, hx - dir * 0.12)], [0.99, 1.01], [Math.min(zf, zl), Math.max(zf, zl)], 0.006);
  }
  if (o.lock === 'smart') {                                                                         // cerradura electrónica
    const lx = dir * (lw - 0.07);
    blk(leaf, M.lacquer('#151515'), [lx - 0.032, lx + 0.032], [1.07, 1.35], [0.004, 0.022], 0.008);
    blk(leaf, M.lacquer('#151515'), [lx - 0.03, lx + 0.03], [1.07, 1.3], [-0.062, -0.044], 0.008);
  }
  leaf.rotation.y = atEnd ? a : -a;
  return g;
}

// vano sin carpintería (paso entre ambientes): solo el hueco en la pared
const passage = () => new THREE.Group();
// arco de medio punto: vano con el remate semicircular (radio = medio ancho, la clave a "sill" + "height"); el motor
// corta el rectángulo y acá se rellenan los dos tímpanos con la pintura de la pared. Con "sill" es un pase (cocina al
// living); "counter": { "front", "back", "thickness", "color" } agrega la barra sobre el antepecho, que sobresale "front"
// hacia +Z local (el lado de "side") y "back" hacia el otro. La barra envuelve el canto del antepecho (sin caras
// compartidas con la pared).
function arch(o, { len, h, t, M, wallColor }) {
  const g = new THREE.Group(), r = Math.min(len / 2, h), spring = h - r, wall = M.paint(wallColor);
  for (const s of [0, 1]) {   // tímpano izquierdo y derecho: rectángulo de la esquina menos el cuarto de círculo
    const sh = new THREE.Shape(), cx = len / 2;
    if (!s) { sh.moveTo(0, spring); sh.lineTo(0, h); sh.lineTo(cx, h); sh.absarc(cx, spring, r, Math.PI / 2, Math.PI, false); }
    else { sh.moveTo(len, spring); sh.absarc(cx, spring, r, 0, Math.PI / 2, false); sh.lineTo(len, h); sh.lineTo(len, spring); }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 24 });
    geo.translate(0, 0, -t / 2);
    add(g, uvScale(geo, 0.5), wall).castShadow = true;
  }
  const c = o.counter;
  if (c && (o.sill ?? 0) > 0.3) {
    const th = c.thickness ?? 0.03, f = c.front ?? 0.3, b = c.back ?? 0.05;
    blk(g, M.lacquer(c.color ?? '#f3f2ee'), [-0.01, len + 0.01], [-th / 2, th / 2], [-t / 2 - b, t / 2 + f], 0.004);
  }
  return g;
}

// Ficha de cada componente, la única fuente para el motor, el validador y el catálogo (node motor/catalogo.mjs):
// · mount: dónde va. "floor" apoyado en el piso; "wall" colgado (detrás tiene que haber pared o viga); "ceiling"
//   cuelga del techo (se saca en las vistas sin techo y no estorba al caminar); "on" encima de otro mueble;
//   "window" frente a una ventana.
// · solid: estorba al caminar y cuenta para la circulación (por defecto sí, salvo lo de techo).
// · use: se usa, así que tiene que haber dónde pararse al lado con 60 cm de paso.
// · nests: tipos con los que se superpone a propósito ("*" = cualquiera); vale en los dos sentidos.
// · fixed: lados de su caja que van amurados, además de su montaje: "back" (el fondo, en -Z, contra la pared: bachas
//   colgadas, grifería de ducha, mesadas) o "sides" (las dos puntas en X, de pared a pared: barrales). Lo usa el control
//   de piezas sueltas (validate.js, loosePieces): una pieza que toca un lado amurado no está suelta.
const FLAT = { solid: false };
export const META = Object.fromEntries(Object.entries({
  'bed': ['floor', { use: true }], 'folded-towels': ['on', { ...FLAT, nests: ['bed'] }], 'nightstand': ['floor'],
  'table-lamp': ['on', { nests: ['nightstand'] }], 'wardrobe': ['floor', { use: true }], 'rug': ['floor', { ...FLAT, nests: ['*'] }],
  'ceiling-light': ['ceiling'], 'ceiling-fan': ['ceiling'], 'grill': ['floor', { use: true, fixed: ['back'] }], 'downlight': ['ceiling', { nests: ['*'] }], 'plant': ['floor'], 'wall-art': ['wall', FLAT],
  'sofa': ['floor', { use: true }], 'dining-table': ['floor', { use: true }], 'chair': ['floor', { nests: ['dining-table', 'side-table'] }],
  'side-table': ['floor'], 'cube-shelf': ['floor', { nests: ['fridge'] }], 'tv': ['wall', { ...FLAT, nests: ['cube-shelf', 'bookshelf'] }], 'ac-split': ['wall'],
  'curtains': ['window', { ...FLAT, nests: ['*'] }], 'round-mirror': ['wall', FLAT], 'floor-mirror': ['floor'],
  'fridge': ['floor', { use: true, nests: ['kitchen-base'] }], 'appliance': ['on', { ...FLAT, nests: ['kitchen-base', 'fridge', 'kitchen-wall', 'kitchen-cart'] }],
  'kitchen-base': ['floor', { use: true, fixed: ['back'] }], 'kitchen-wall': ['wall', { ...FLAT, nests: ['kitchen-base', 'fridge'] }],
  'bathtub': ['floor', { use: true, fixed: ['sides'] }], 'shower-curtain': ['on', { nests: ['bathtub', 'shower'], fixed: ['sides'] }], 'toilet': ['floor', { use: true, fixed: ['back'] }],
  'bidet': ['floor', { use: true }], 'vanity': ['floor', { use: true, fixed: ['back'] }], 'wall-dispensers': ['wall'], 'bath-mat': ['floor', { ...FLAT, nests: ['*'] }],
  'bubble-sofa': ['floor', { use: true }], 'ribbon-pendant': ['ceiling'], 'vent-grille': ['wall', FLAT], 'range': ['floor', { use: true }],
  'water-heater': ['wall', FLAT], 'wall-tiles': ['wall', FLAT], 'shower': ['floor', { use: true, fixed: ['back'] }], 'capsule-mirror': ['wall', FLAT],
  'towel-bar': ['wall', FLAT],
  // la escalera estorba solo en su parte baja: el motor la agrega aparte al recorrido
  'stair': ['floor', { ...FLAT, nests: ['*'] }], 'railing': ['floor'], 'paneling': ['wall', FLAT],
  'armchair': ['floor', { use: true }], 'pouf': ['floor'], 'coffee-table': ['floor'], 'sideboard': ['floor', { use: true }],
  'pendant': ['ceiling'], 'chandelier': ['ceiling'], 'track-light': ['ceiling'], 'sconce': ['wall', FLAT], 'bath-mirror': ['wall', FLAT], 'glass-screen': ['floor', FLAT],
  'panel-light': ['ceiling'], 'led-strip': ['on', { ...FLAT, nests: ['kitchen-wall'] }], 'floor-lamp': ['floor'],
  'table-setting': ['on', { ...FLAT, nests: ['dining-table', 'chair'] }], 'wall-desk': ['wall', FLAT],
  'room-divider': ['floor'], 'bench': ['floor'], 'console-table': ['floor'], 'bar-stool': ['floor', { nests: ['kitchen-base'] }],
  'floor-fan': ['floor'], 'bunk-bed': ['floor', { use: true }], 'desk': ['floor', { use: true, nests: ['chair'] }], 'bookshelf': ['floor', { use: true }],
  'ladder-shelf': ['floor'], 'wire-shelf': ['floor'], 'kitchen-cart': ['floor', { use: true }], 'medicine-cabinet': ['wall', FLAT],
  'wall-shelf': ['wall', FLAT], 'washer': ['floor', { use: true }], 'laundry-sink': ['floor', { use: true, fixed: ['back'] }],
  // objetos sueltos a propósito: cada uno apoya por su cuenta
  'tabletop-decor': ['on', { ...FLAT, set: true, nests: ['*'] }],
}).map(([k, [mount, o = {}]]) => [k, { mount, solid: o.solid ?? mount !== 'ceiling', use: !!o.use, nests: o.nests ?? [], fixed: o.fixed ?? [], set: !!o.set }]));
// se pueden superponer a propósito (sillas bajo la mesa, toallas sobre la cama, alfombras bajo cualquier cosa)
export const nests = (a, b) => [[a, b], [b, a]].some(([p, q]) => META[p]?.nests.some(n => n === '*' || n === q));

export const OPENINGS = { 'sliding-window': slidingWindow, 'door': door, 'passage': passage, 'arch': arch };

/* ---------- exterior: balcón, edificio y entorno simple ---------- */
// "balcony" puede ser uno o una lista de balcones contiguos. Baranda: "bars" (caños horizontales, por defecto), "glass"
// o "parapet" (murete macizo con cubierta oscura y caños en los costados), "panels" (parantes de hierro, paños llenos
// pintados del color "wall" y pasamanos de madera "handrail"). "sides": [izquierdo, derecho]; false deja ese costado
// sin baranda, para que dos balcones contiguos se lean como uno solo. "net": red de protección en rombos del pasamanos
// al techo (o 1,2 m más arriba si no está cubierto). "ends": paredes en las dos puntas (balcón entre tabiques), con el
// color de la fachada; con ellas no hay baranda en los costados.
export function exterior(spec, { M, ext, H }) {
  const g = new THREE.Group(), facade = M.paint(spec.facade ?? '#e9e4da'), stone = M.paint('#dcc9a8');
  const balconies = [spec.balcony ?? []].flat(), ceiling = [];
  g.add(g.userData.sky = skyDome());
  for (const b of balconies) {
    const [x0, x1] = b.x, [z0, z1] = b.z, rl = b.railing ?? {}, rail = M.metal(rl.color ?? '#4a4e54', 0.45), rh = rl.height ?? 1.0;
    const ends = !!b.ends, [left, right] = ends ? [false, false] : rl.sides ?? [true, true];
    if (ends) for (const [a0, a1] of [[x0, x0 + 0.12], [x1 - 0.12, x1]]) blk(g, facade, [a0, a1], [-0.026, H + (b.covered ? 0.001 : -0.4)], [z0, z1 - 0.001]);
    const fl = new THREE.PlaneGeometry(x1 - x0, z1 - z0); fl.rotateX(-Math.PI / 2); uvScale(fl, (x1 - x0) / 0.9, (z1 - z0) / 0.9);
    add(g, fl, M.floor(b.floor ?? '#e6d8c0'), (x0 + x1) / 2, -0.02, (z0 + z1) / 2).castShadow = false;
    blk(g, facade, [x0, x1], [-0.2, -0.026], [z0, z1]);
    // "covered": la losa del balcón de arriba hace de techo (se saca, como el cielorraso, en las vistas sin techo)
    if (b.covered) ceiling.push(blk(g, M.paint(b.soffit ?? '#d7d4cd'), [x0, x1], [H, H + 0.2], [z0, z1]));
    const zr = z0 + 0.05, xr0 = left ? x0 + 0.05 : x0, xr1 = right ? x1 - 0.05 : x1, sideXs = [left && xr0, right && xr1].filter(v => v !== false);
    if (rl.kind === 'parapet') {
      const pt = 0.12, cap = M.lacquer(rl.color ?? '#3a3c40');
      blk(g, M.paint(rl.wall ?? '#d9cab0'), [x0, x1], [-0.026, rh - 0.03], [z0, z0 + pt]);
      blk(g, cap, [x0 - (left ? 0.012 : 0), x1 + (right ? 0.012 : 0)], [rh - 0.03, rh], [z0 - 0.012, z0 + pt + 0.012], 0.004);
      for (const [on, xr] of [[left, x0 + 0.05], [right, x1 - 0.05]]) {
        if (!on) continue;
        blk(g, rail, [xr - 0.02, xr + 0.02], [-0.02, rh], [z1 - 0.06, z1 - 0.02], 0.004);
        for (let y = 0.1; y <= rh - 0.04; y += 0.1) bar(g, rail, 'z', z0 + pt, z1 - 0.06, y, xr, 0.008);
        bar(g, rail, 'z', z0 + pt, z1 - 0.06, rh - 0.015, xr, 0.018, 16);
      }
    } else if (rl.kind === 'panels') {
      const ex0 = ends ? x0 + 0.12 : xr0, ex1 = ends ? x1 - 0.12 : xr1, n = Math.max(2, Math.round((ex1 - ex0) / 1.1)), wood = M.wood(rl.handrail ?? '#8a5a3a'), panel = M.paint(rl.wall ?? '#cbb894');
      blk(g, stone, ends ? [x0 + 0.11, x1 - 0.11] : [x0, x1], [-0.02, 0.06], [z0, z0 + 0.12], 0.004);   // cordón
      for (let i = 0; i <= n; i++) { const x = ex0 + 0.02 + i * (ex1 - ex0 - 0.04) / n; blk(g, rail, [x - 0.02, x + 0.02], [0.06, rh - 0.04], [zr - 0.02, zr + 0.02], 0.003); }
      for (let i = 0; i < n; i++) {
        const a = ex0 + 0.02 + i * (ex1 - ex0 - 0.04) / n + 0.017, c = ex0 + 0.02 + (i + 1) * (ex1 - ex0 - 0.04) / n - 0.017;
        blk(g, panel, [a, c], [0.1, rh - 0.13], [zr - 0.008, zr + 0.008], 0.004);
        blk(g, rail, [a, c], [rh - 0.13, rh - 0.11], [zr - 0.012, zr + 0.012], 0.003);                     // travesaño sobre el paño
      }
      blk(g, wood, [ex0 - 0.002, ex1 + 0.002], [rh - 0.045, rh], [zr - 0.055, zr + 0.055], 0.008);          // pasamanos
      for (const xr of sideXs) {
        blk(g, rail, [xr - 0.02, xr + 0.02], [0.06, rh - 0.04], [z1 - 0.06, z1 - 0.02], 0.003);
        blk(g, panel, [xr - 0.008, xr + 0.008], [0.1, rh - 0.13], [zr + 0.02, z1 - 0.06], 0.004);
        blk(g, wood, [xr - 0.055, xr + 0.055], [rh - 0.045, rh], [zr + 0.055, z1], 0.008);
      }
    } else if (rl.kind === 'glass') {
      blk(g, stone, [x0, x1], [-0.02, 0.1], [z0, z0 + 0.1], 0.004);                   // zócalo bajo la baranda
      const gl = M.tintedGlass('#cfe0e6', 0.22);
      blk(g, gl, [xr0 + 0.03, xr1 - 0.03], [0.12, rh - 0.04], [zr - 0.006, zr + 0.006]).castShadow = false;
      for (const xr of sideXs) blk(g, gl, [xr - 0.006, xr + 0.006], [0.12, rh - 0.04], [zr + 0.03, z1 - 0.02]).castShadow = false;
      blk(g, rail, [xr0 - 0.02, xr1 + 0.02], [rh - 0.04, rh], [zr - 0.025, zr + 0.025], 0.006);
      for (const xr of sideXs) {
        blk(g, rail, [xr - 0.025, xr + 0.025], [rh - 0.04, rh], [zr + 0.025, z1], 0.006);
        blk(g, rail, [xr - 0.02, xr + 0.02], [0.1, rh - 0.04], [zr - 0.02, zr + 0.02], 0.004);
      }
    } else {
      blk(g, stone, [x0, x1], [-0.02, 0.1], [z0, z0 + 0.1], 0.004);                   // zócalo bajo la baranda
      const nPosts = Math.max(2, Math.round((x1 - x0) / 0.8));
      for (let i = 0; i <= nPosts; i++) blk(g, rail, [xr0 + i * (xr1 - xr0) / nPosts - 0.02, xr0 + i * (xr1 - xr0) / nPosts + 0.02], [0.1, rh], [zr - 0.02, zr + 0.02], 0.004);
      // "balusters": barrotes verticales cada 11 cm entre un caño de abajo y el pasamanos (barandas porteñas de hierro)
      if (rl.kind === 'balusters') {
        const yb = 0.16, bars = (a0, a1, along, c) => { for (let a = a0 + 0.11; a < a1 - 0.05; a += 0.11) along === 'x' ? cyl(g, rail, a, yb, rh, c, 0.007, 8) : cyl(g, rail, c, yb, rh, a, 0.007, 8); };
        bar(g, rail, 'x', xr0, xr1, yb, zr, 0.01); bars(xr0, xr1, 'x', zr);
        for (const xr of sideXs) { bar(g, rail, 'z', zr, z1, yb, xr, 0.01); bars(zr, z1, 'z', xr); }
      } else for (let y = 0.18; y <= rh - 0.04; y += 0.1) {
        bar(g, rail, 'x', xr0, xr1, y, zr, 0.008);
        for (const xr of sideXs) bar(g, rail, 'z', zr, z1, y, xr, 0.008);
      }
      bar(g, rail, 'x', xr0 - 0.02, xr1 + 0.02, rh, zr, 0.022, 16);
      for (const xr of sideXs) bar(g, rail, 'z', zr, z1, rh, xr, 0.018, 16);
    }
    if (rl.net) {   // red de protección: rombos de hilo oscuro, con transparencia mezclada (no recortada: recortada, de lejos hacía
      // un muaré de rombos gigantes); de lejos se ve como un velo parejo, como en la realidad
      const top = b.covered ? H - 0.01 : rh + 1.2, hgt = top - rh, cell = 0.09;
      const net = new THREE.MeshStandardMaterial({ color: typeof rl.net === 'string' ? rl.net : '#2a2b2d', map: netTex(), transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, roughness: 0.8 });
      const fx0 = ends ? x0 + 0.12 : x0, fx1 = ends ? x1 - 0.12 : x1;
      const front = new THREE.PlaneGeometry(fx1 - fx0, hgt); uvScale(front, (fx1 - fx0) / cell, hgt / cell);
      add(g, front, net, (fx0 + fx1) / 2, rh + hgt / 2, zr + 0.06).castShadow = false;
      for (const xr of sideXs) { const sd = new THREE.PlaneGeometry(z1 - zr - 0.06, hgt); uvScale(sd, (z1 - zr - 0.06) / cell, hgt / cell); const m = add(g, sd, net, xr, rh + hgt / 2, (zr + 0.06 + z1) / 2); m.rotation.y = Math.PI / 2; m.castShadow = false; }
    }
    // balcones de abajo: losa y la misma baranda que el del departamento (antes, un antepecho macizo que no coincidía)
    const solidLow = rl.kind === 'parapet' || rl.kind === 'panels';
    const railLow = rl.kind === 'glass' ? M.tintedGlass('#cfe0e6', 0.22) : solidLow ? M.paint(rl.wall ?? '#d9cab0')
      : new THREE.MeshStandardMaterial({ color: rl.color ?? '#3d4045', map: railTex(), alphaTest: 0.5, alphaToCoverage: true, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.4 });
    if (railLow.map) railLow.map = railLow.map.clone(), railLow.map.repeat.set((x1 - x0) / 1, 1), railLow.map.needsUpdate = true;
    for (let k = 1; k <= (spec.floorsBelow ?? 3); k++) {
      const y = -2.9 * k;
      blk(g, facade, [x0, x1], [y - 0.18, y], [z0, z1]);
      if (solidLow) blk(g, railLow, [x0, x1], [y, y + rh - 0.03], [z0, z0 + 0.12]);
      if (ends) for (const [a0, a1] of [[x0, x0 + 0.12], [x1 - 0.12, x1]]) blk(g, facade, [a0, a1], [y, y + 2.7], [z0, z1 - 0.001]);
      else if (!solidLow) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 - 0.1, rh), railLow); p.position.set((x0 + x1) / 2, y + rh / 2, z0 + 0.05); p.userData.keep = true; g.add(p);
        blk(g, rail, [x0 + 0.05, x1 - 0.05], [y + rh - 0.02, y + rh + 0.02], [z0 + 0.03, z0 + 0.07]);
      }
    }
  }
  if (balconies.length) for (let k = 1; k <= (spec.floorsBelow ?? 3); k++) {          // ventanales de abajo
    const y = -2.9 * k, z1 = Math.max(...balconies.map(b => b.z[1]));
    // puertaventana: marco blanco y vidrio que refleja el cielo, como las de la cuadra de enfrente
    const xa = ext.x0 + 0.75, xb = ext.x1 - 0.75, zf = z1;
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(xb - xa - 0.1, 2.1), new THREE.MeshStandardMaterial({ map: glassTex(), roughness: 0.15, metalness: 0.1 }));
    gl.position.set((xa + xb) / 2, y + 1.1, zf - 0.03); gl.rotation.y = Math.PI; g.add(gl);
    const fr = M.lacquer('#efede7');
    blk(g, fr, [xa, xb], [y + 2.15, y + 2.22], [zf - 0.08, zf]); blk(g, fr, [xa, xa + 0.05], [y, y + 2.15], [zf - 0.08, zf]); blk(g, fr, [xb - 0.05, xb], [y, y + 2.15], [zf - 0.08, zf]);
    blk(g, fr, [(xa + xb) / 2 - 0.03, (xa + xb) / 2 + 0.03], [y, y + 2.15], [zf - 0.07, zf - 0.01]);
  }
  // "floorsBelow": 0 = planta baja (casas): el suelo y la vereda quedan apenas debajo del piso, sin edificio abajo
  const baseY = spec.floorsBelow === 0 ? -0.15 : -2.9 * ((spec.floorsBelow ?? 3) + 1);
  if (baseY < -0.25) blk(g, facade, [ext.x0, ext.x1], [baseY, -0.2], [ext.z0, ext.z1]);
  const front = Math.min(ext.z0, ...balconies.map(b => b.z[0]));
  g.add(spec.landscape === 'lake' ? natureAround(spec.nature ?? {}, { M, ext, baseY, front }) : cityAround(spec.city ?? {}, { M, ext, baseY, front }));
  g.userData.ceiling = ceiling;
  return g;
}

// cielo: degradé celeste con nubes suaves y el brillo del sol; de noche, azul profundo con el resplandor de la ciudad.
// "uWarm" (la calidez de la luz de día, 0–1) tiñe el horizonte de durazno, dora el brillo del sol y entibia las nubes
function skyDome() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uNight: { value: 0 }, uWarm: { value: 0 }, uSun: { value: new THREE.Vector3(0, 0.4, -1).normalize() } },
    vertexShader: `varying vec3 vDir;
      void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: `uniform float uNight, uWarm; uniform vec3 uSun; varying vec3 vDir;
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        vec3 d = normalize(vDir); float h = d.y, up = max(h, 0.0);
        vec3 day = mix(vec3(0.62, 0.77, 0.92), vec3(0.13, 0.36, 0.80), pow(up, 0.6));
        float sd = max(dot(d, normalize(uSun)), 0.0);
        day = mix(day, vec3(1.0, 0.8, 0.62), uWarm * 0.6 * pow(1.0 - up, 3.0));
        day += mix(vec3(1.0, 0.92, 0.8), vec3(1.0, 0.74, 0.48), uWarm) * (0.3 * pow(sd, 6.0) + 1.2 * pow(sd, 60.0) + 8.0 * pow(sd, 1500.0));
        vec2 q = d.xz / max(h, 0.08) * 0.8;
        float c = 0.55 * n2(q * 1.2) + 0.3 * n2(q * 2.9 + 7.0) + 0.15 * n2(q * 7.0 + 3.0);
        day = mix(day, mix(vec3(1.0, 1.0, 0.99), vec3(1.0, 0.9, 0.8), uWarm), 0.8 * smoothstep(0.56, 0.82, c) * smoothstep(0.03, 0.22, h));
        vec3 nite = mix(vec3(0.09, 0.12, 0.27), vec3(0.01, 0.025, 0.08), pow(up, 0.45)) + vec3(0.22, 0.12, 0.07) * pow(1.0 - up, 8.0);
        vec3 col = h < 0.0 ? mix(vec3(0.5, 0.55, 0.58), vec3(0.04, 0.05, 0.09), uNight) : mix(day * 1.25, nite, uNight);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(250, 48, 24), mat);
  m.renderOrder = -10; m.frustumCulled = false;
  return m;
}

// copa de árbol: esfera deformada con ruido (normales suaves aproximadas por la dirección radial)
// copa de árbol: esfera deformada con ruido; los vértices llevan un tono (más oscuro abajo y en los huecos, más claro
// arriba) para que la copa tenga volumen sin luz propia
function crownGeo(seed, detail = 2) {
  const geo = new THREE.IcosahedronGeometry(1, detail), p = geo.attributes.position, n = geo.attributes.normal, v = new THREE.Vector3();
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const nz = vnoise(v.x * 2.2 + 50 + seed, v.y * 2.2 + v.z * 1.7 + 50, 1000, 1000), k = 0.8 + 0.32 * nz;
    p.setXYZ(i, v.x * k, v.y * k * 0.82, v.z * k);
    n.setXYZ(i, v.x, v.y, v.z);
    const t = 0.62 + 0.3 * (v.y + 1) / 2 + 0.18 * (nz - 0.5);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = t;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}
// Copas instanciadas por color, en dos versiones: las de lejos (más de "far" metros de "c") con la cuarta parte de los
// triángulos, que a esa distancia no se nota. put() no consume números al azar, así los árboles no se mueven
function crownBank(mats, seedOf, max, c, far = 35) {
  mats = mats.map(m => { const c = m.clone(); c.vertexColors = true; return c; });   // el tono de cada vértice de la copa
  const sets = mats.map((m, i) => [2, 1].map(d => new THREE.InstancedMesh(crownGeo(seedOf(i), d), m, max))), used = mats.map(() => [0, 0]);
  return {
    put(i, o) { const k = Math.hypot(o.position.x - c.x, o.position.z - c.z) > far ? 1 : 0; sets[i][k].setMatrixAt(used[i][k]++, o.matrix); },
    addTo(g) { sets.forEach((s, i) => s.forEach((m, k) => { m.count = used[i][k]; if (m.count) g.add(m); else m.dispose(); })); },
  };
}

// Entorno urbano frente a los ventanales (lado -Z), rehecho el 2026-11-07: más chico y con más detalle. La cuadra de
// enfrente (lo que se ve por las ventanas) y los vecinos de la propia cuadra tienen relieve de verdad: marcos de
// ventana que sobresalen (la ventana parece hundida), carpinterías, persianas a distinta altura, balcones con baranda,
// cornisas y planta baja con locales. Más allá de ±36 m la cuadra sigue con cajas texturadas y, al fondo, la ciudad es
// una silueta en la bruma (antes había torres y manzanas enteras de cajas lisas que se veían baratas).
// "city": { "seed", "street": ancho de calzada, "trees": false para sacarlos, "floors": [mín, máx] pisos de enfrente }
// Lo repetido (ventanas, balcones, hojas) va instanciado: pocas llamadas de dibujo aunque haya cientos de ventanas.
const ENVTEX = {};
const envTex = (k, f) => (ENVTEX[k] ??= f());
function canvasTex(w, h, draw, srgb = true, mips = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (!mips) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
function noiseFill(g, w, h, f) {
  const im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, [r, gg, b, a = 255] = f(x, y); im.data[i] = r; im.data[i + 1] = gg; im.data[i + 2] = b; im.data[i + 3] = a; }
  g.putImageData(im, 0, 0);
}
// revoque: gris claro con manchas suaves (multiplica el color de cada edificio); 4 m por repetición
const stuccoTex = () => envTex('stucco', () => canvasTex(256, 256, (g, w, h) => noiseFill(g, w, h, (x, y) => {
  const n = 0.5 * vnoise(x / 32, y / 32, 8, 8) + 0.3 * vnoise(x / 8, y / 8, 32, 32) + 0.2 * hash(x, y), v = 236 + 19 * n;
  return [v, v, v];
})));
// ladrillo visto: 1 m por repetición, hiladas de 6,25 cm, juntas claras y cada ladrillo con su tono
const brickTex = () => envTex('brick', () => canvasTex(256, 256, (g, w) => {
  g.fillStyle = '#d9d2c8'; g.fillRect(0, 0, w, w);
  for (let row = 0; row < 16; row++) for (let k = -1; k < 5; k++) {
    const x = k * 64 + (row % 2 ? 32 : 0), t = hash(row * 7 + 3, k + 11), c = new THREE.Color('#a8664a').offsetHSL((t - 0.5) * 0.03, (t - 0.5) * 0.1, (hash(k, row) - 0.5) * 0.1);
    g.fillStyle = '#' + c.getHexString(); g.fillRect(x + 2, row * 16 + 2, 60, 13);
  }
}));
// azotea: baldosas cerámicas de 20 cm con juntas; 2 m por repetición
const roofTex = () => envTex('roof', () => canvasTex(256, 256, (g, w) => {
  noiseFill(g, w, w, (x, y) => { const t = hash(Math.floor(x / 25.6) + 3, Math.floor(y / 25.6)), n = vnoise(x / 20, y / 20, 12.8, 12.8); return [142 + 24 * t + 10 * n, 104 + 16 * t + 8 * n, 90 + 12 * t + 6 * n]; });
  g.fillStyle = 'rgba(205,195,182,.9)'; for (let k = 0; k <= 10; k++) { g.fillRect(k * 25.6 - 1, 0, 2, w); g.fillRect(0, k * 25.6 - 1, w, 2); }
}));
// vidrio de ventana: refleja el cielo arriba y deja ver un interior en penumbra abajo, con una cortina de un lado
const glassTex = () => envTex('glass', () => canvasTex(128, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#c3d0da'); gr.addColorStop(0.35, '#7d8d9a'); gr.addColorStop(0.6, '#3f4952'); gr.addColorStop(1, '#2a3036');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(236,230,218,.55)'; g.fillRect(0, 18, 26, h - 18);                       // cortina
  const rf = g.createLinearGradient(0, h * 0.2, w, h * 0.55);                                  // reflejo en diagonal
  rf.addColorStop(0.3, 'rgba(255,255,255,0)'); rf.addColorStop(0.5, 'rgba(255,255,255,.18)'); rf.addColorStop(0.7, 'rgba(255,255,255,0)');
  g.fillStyle = rf; g.fillRect(0, 0, w, h);
}));
// de noche, el interior encendido: más claro arriba (la lámpara del techo) y la cortina iluminada
const litTex = () => envTex('lit', () => canvasTex(128, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe2b8'); gr.addColorStop(0.5, '#e8a868'); gr.addColorStop(1, '#6e4a2c');
  g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,240,215,.7)'; g.fillRect(0, 18, 26, h - 18);
}));
// persiana de enrollar: tablillas horizontales de 4 cm
const slatTex = () => envTex('slat', () => canvasTex(16, 64, (g, w, h) => {
  for (let y = 0; y < h; y += 8) { const gr = g.createLinearGradient(0, y, 0, y + 8); gr.addColorStop(0, '#f4f2ec'); gr.addColorStop(0.8, '#d6d3cb'); gr.addColorStop(1, '#a9a69f'); g.fillStyle = gr; g.fillRect(0, y, w, 8); }
}));
// baranda de hierro: pasamanos, caño de abajo y barrotes cada 11 cm (transparente entre barrotes); 1 × 1 m
const railTex = () => envTex('rail', () => canvasTex(256, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, 10); g.fillRect(0, h - 40, w, 6);
  for (let x = 6; x < w; x += 28) g.fillRect(x, 0, 4, h - 34);
}, true, false));
// red de protección de balcón: hilos en rombo sobre fondo transparente (una celda por repetición)
const netTex = () => envTex('net', () => canvasTex(64, 64, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.lineWidth = 2.5;
  for (const [a, b, c, d] of [[0, 0, w, h], [w, 0, 0, h], [-w, 0, w, 2 * h], [0, -h, 2 * w, h]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
  for (const [a, b, c, d] of [[2 * w, 0, 0, 2 * h], [w, -h, -w, h]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
}, true, true));
// vereda de baldosas de 40 cm (2 m por repetición) y asfalto (4 m)
const walkTex = () => envTex('walk', () => canvasTex(512, 512, (g, w) => {
  noiseFill(g, w, w, (x, y) => { const t = hash(Math.floor(x / 102.4), Math.floor(y / 102.4)), v = 196 + 14 * t + 10 * vnoise(x / 6, y / 6, 86, 86); return [v, v - 2, v - 7]; });
  g.fillStyle = 'rgba(70,66,60,.45)';
  for (let k = 0; k <= 5; k++) { g.fillRect(k * 102.4 - 1, 0, 2, w); g.fillRect(0, k * 102.4 - 1, w, 2); }
  g.fillStyle = 'rgba(70,66,60,.16)';                                                           // las nueve vainillas de cada baldosa
  for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) for (let i = 1; i <= 3; i++) for (let j = 1; j <= 3; j++) g.fillRect(a * 102.4 + i * 25.6 - 7, b * 102.4 + j * 25.6 - 7, 14, 14);
}));
const asphaltTex = () => envTex('asphalt', () => canvasTex(512, 512, (g, w) => noiseFill(g, w, w, (x, y) => {
  const v = 70 + 18 * vnoise(x / 40, y / 40, 12.8, 12.8) + 22 * (hash(x, y) - 0.5) + (hash(x * 3, y * 7) > 0.985 ? 40 : 0);
  return [v, v + 2, v + 5];
})));
// hojas: unas 80 hojas en tonos de verde sobre fondo transparente, para las copas de "tarjetas" de hojas
const leavesTex = () => envTex('leaves', () => canvasTex(256, 256, (g, w) => {
  g.clearRect(0, 0, w, w); const r = rng(9);
  for (let i = 0; i < 80; i++) {
    const x = 20 + r() * (w - 40), y = 20 + r() * (w - 40), a = r() * Math.PI * 2, s = 10 + r() * 9;
    const c = new THREE.Color('#5d7f3c').offsetHSL((r() - 0.5) * 0.06, (r() - 0.5) * 0.2, (r() - 0.5) * 0.22);
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#' + c.getHexString();
    g.beginPath(); g.ellipse(0, 0, s, s * 0.62, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(30,45,20,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.stroke(); g.restore();
  }
}));
// sombra suave al pie de cada árbol y charco de luz de los faroles (degradé radial)
// (gris sobre negro: alphaMap lee el canal verde, no la transparencia; con transparencia quedaba un disco de borde duro)
const blobTex = () => envTex('blob', () => canvasTex(128, 128, (g, w) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, w);
  const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  for (let t = 0; t <= 1.0001; t += 0.1) { const v = Math.exp(-t * t * 3.5) * (1 - smooth(0.75, 1, t)) * 255 | 0; gr.addColorStop(Math.min(1, t), `rgb(${v},${v},${v})`); }
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
}, false));
// silueta de la ciudad a lo lejos: edificios recortados contra el cielo (transparente arriba) y, de noche, ventanas
const skylineTex = () => envTex('skyline', () => {
  const W = 2048, H = 256, c = document.createElement('canvas'), lc = document.createElement('canvas'); c.width = lc.width = W; c.height = lc.height = H;
  const g = c.getContext('2d'), lg = lc.getContext('2d'), r = rng(21);
  g.clearRect(0, 0, W, H); lg.fillStyle = '#000'; lg.fillRect(0, 0, W, H);
  for (const [k, col] of [[0, '#b7c0c8'], [1, '#a3adb6']]) for (let x = 0; x < W;) {
    const bw = 14 + r() * 46, bh = (k ? 40 : 70) + r() * (k ? 90 : 120); g.fillStyle = col; g.fillRect(x, H - bh, bw, bh);
    if (r() < 0.3) g.fillRect(x + bw * 0.3, H - bh - 8, bw * 0.3, 8);
    for (let yy = H - bh + 6; yy < H - 4; yy += 7) for (let xx = x + 3; xx < x + bw - 3; xx += 6) if (r() < 0.22) { lg.fillStyle = `rgba(255,${190 + r() * 40 | 0},120,1)`; lg.fillRect(xx, yy, 2, 3); }
    x += bw + (r() < 0.2 ? r() * 20 : 0);
  }
  const t = new THREE.CanvasTexture(c), tl = new THREE.CanvasTexture(lc);
  for (const x of [t, tl]) { x.colorSpace = THREE.SRGBColorSpace; x.wrapS = THREE.RepeatWrapping; }
  return { map: t, lit: tl };
});

// banco de instancias: una InstancedMesh por geometría y material; put() recibe la matriz de cada pieza
function instBank(geo, mat, opts = {}) {
  const list = [];
  return {
    put(m, color) { list.push([m.clone(), color]); },
    addTo(g) {
      if (!list.length) return;
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach(([m, c], i) => { im.setMatrixAt(i, m); if (c) im.setColorAt(i, c); });
      im.castShadow = im.receiveShadow = false; if (opts.order) im.renderOrder = opts.order; g.add(im);
    },
  };
}
const boxAt = (x0, x1, y0, y1, z0, z1) => new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
const mergeAll = list => { const m = mergeGeometries(list.map(g => g.toNonIndexed()), false); list.forEach(g => g.dispose()); return m; };

// Piezas de una ventana, con el origen al centro del borde de abajo del vano, sobre el plano de la fachada (z = 0), y el
// frente hacia +Z. El marco sobresale "d": así el vidrio queda 10 cm hundido sin tener que agujerear la pared.
// Las jambas no llegan a la altura del dintel ni se pisan con el antepecho: ninguna cara comparte plano con otra
function windowGeos(w, h, { s = 0.12, d = 0.1, sill = true, mullion = true } = {}) {
  const surround = [boxAt(-w / 2 - s, -w / 2, 0, h, 0, d), boxAt(w / 2, w / 2 + s, 0, h, 0, d), boxAt(-w / 2 - s, w / 2 + s, h, h + s, 0, d)];
  if (sill) surround.push(boxAt(-w / 2 - s - 0.04, w / 2 + s + 0.04, -0.07, -0.002, 0, d + 0.05));
  const f = 0.045, frame = [boxAt(-w / 2, -w / 2 + f, 0, h, 0.012, 0.05), boxAt(w / 2 - f, w / 2, 0, h, 0.012, 0.05), boxAt(-w / 2 + f, w / 2 - f, h - f, h, 0.012, 0.05), boxAt(-w / 2 + f, w / 2 - f, 0, f, 0.012, 0.05)];
  if (mullion) frame.push(boxAt(-0.025, 0.025, f, h - f, 0.014, 0.048));
  const glass = new THREE.PlaneGeometry(w - 2 * f, h - 2 * f).translate(0, h / 2, 0.02);
  return { surround: mergeAll(surround), frame: mergeAll(frame), glass };
}

function cityAround(spec, { M, ext, baseY, front }) {
  const g = new THREE.Group(), r = rng(spec.seed ?? 7), cx = (ext.x0 + ext.x1) / 2, cz = (ext.z0 + ext.z1) / 2;
  const walkW = 3.2, road = spec.street ?? 9, zw = front - walkW, zr = zw - road, zo = zr - walkW, NEAR = 36, FAR = 100;
  const GF = 3.4, FH = 2.9, fb = Math.round(-baseY / FH) - 1;                    // planta baja y pisos
  const std = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.92, ...o });

  /* suelo: calzada, cordones, veredas con baldosas y canteros de los árboles */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), M.paint('#8a8d86'));
  ground.rotation.x = -Math.PI / 2; ground.position.set(cx, baseY - 0.01, cz); g.add(ground);
  const strip = (mat, z0, z1, y, len = 2 * FAR, uvm = 1) => { const m = blk(g, mat, [cx - len / 2, cx + len / 2], [baseY, baseY + y], [z0, z1], 0, uvm); return m; };
  const walkMat = std({ map: walkTex() }), asphalt = std({ map: asphaltTex(), roughness: 0.97 }), curb = M.paint('#b9b5ad');
  // vereda propia (y debajo de los vecinos); en planta baja termina en la línea de frente: adentro está el terreno
  strip(walkMat, zw + 0.15, baseY > -0.25 ? front - 0.15 : ext.z1 + 30, 0.15, 2 * FAR, 2);
  strip(curb, zw, zw + 0.15, 0.16);
  strip(asphalt, zr, zw, 0.02, 2 * FAR, 4);
  strip(curb, zr - 0.15, zr, 0.16);
  strip(walkMat, zo - 30, zr - 0.15, 0.15, 2 * FAR, 2);                      // vereda de enfrente (y debajo de la cuadra)
  for (let x = cx - FAR; x < cx + FAR; x += 6) blk(g, M.paint('#e8e6de'), [x, x + 3], [baseY + 0.02, baseY + 0.024], [zr + road / 2 - 0.06, zr + road / 2 + 0.06]);

  /* edificios */
  const banks = new Map(), bank = (key, make) => { if (!banks.has(key)) banks.set(key, make()); return banks.get(key); };
  const mtx = new THREE.Matrix4(), q0 = new THREE.Quaternion(), qBack = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
  const at = (x, y, z, dir, sx = 1, sy = 1, sz = 1) => mtx.compose(new THREE.Vector3(x, y, z), dir > 0 ? q0 : qBack, new THREE.Vector3(sx, sy, sz));
  const white = new THREE.Color('#ffffff');
  const surroundMat = std({ map: stuccoTex() }), carp = { white: M.lacquer('#f1efe9'), dark: M.metal('#3b3f44', 0.45), wood: M.lacquer('#6a4a33') };
  const glassMat = new THREE.MeshStandardMaterial({ map: glassTex(), roughness: 0.15, metalness: 0.1 });
  const litMat = new THREE.MeshStandardMaterial({ map: glassTex(), roughness: 0.15, metalness: 0.1, emissive: 0xffffff, emissiveMap: litTex(), emissiveIntensity: 0 });
  litMat.userData.night = [0, 1.25];
  const slatMat = std({ map: slatTex(), roughness: 0.6 }), railMat = new THREE.MeshStandardMaterial({ color: '#2e3135', map: railTex(), alphaTest: 0.5, alphaToCoverage: true, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.4 });
  const shop = new THREE.MeshStandardMaterial({ color: 0x2b3238, emissive: 0xffd2a0, emissiveIntensity: 0, roughness: 0.2 }); shop.userData.night = [0, 0.8];
  const awnings = ['#8c3b32', '#2f5a4a', '#b07f3a', '#3d4d6b'].map(c => M.lacquer(c)), stone = M.paint('#b9b1a5');
  const matCache = new Map(), cached = (k, f) => { if (!matCache.has(k)) matCache.set(k, f()); return matCache.get(k); };
  const bodyMat = (style, c) => style === 'brick' ? cached('brick', () => std({ map: brickTex() })) : cached('body' + c, () => std({ color: c, map: stuccoTex() }));
  // tres tipos de fachada porteña: "classic" (revoque, puertaventanas con balconcito de hierro y persianas), "modern"
  // (balcones corridos con baranda de vidrio y ventanales de aluminio) y "brick" (ladrillo visto, ventanas con marco de hormigón)
  const STYLES = {
    classic: { w: 1.25, h: 2.2, bay: 2.9, sill: false, carp: 'white', shutter: true, balcony: 'iron', sy: 0 },
    modern: { w: 2.5, h: 2.3, bay: 3.3, sill: false, carp: 'dark', shutter: false, balcony: 'slab', sy: 0, s: 0.04, d: 0.06, mullion: true },
    brick: { w: 1.45, h: 1.45, bay: 2.8, sill: true, carp: 'white', shutter: true, balcony: null, sy: 0.85 },
  };
  for (const st of Object.values(STYLES)) st.geo = windowGeos(st.w, st.h, { s: st.s, d: st.d, sill: st.sill, mullion: st.mullion ?? true });
  const ironGeo = mergeAll([new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2).translate(-0.5, 0.5, -0.5), new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2).translate(0.5, 0.5, -0.5)]);
  const unitBox = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0.5);   // de 0 a 1 en Y y en Z, centrado en X
  // un edificio entre x0 y x1, con la fachada en zf mirando hacia "dir" (+1: hacia +Z, la cuadra de enfrente; -1: hacia
  // la calle desde la propia cuadra) y "depth" metros de fondo
  function building(x0, x1, zf, dir, depth, floors, style, color) {
    const S = STYLES[style], W = x1 - x0, h = GF + (floors - 1) * FH, zb = zf - dir * depth, z0 = Math.min(zf, zb), z1 = Math.max(zf, zb);
    const body = bodyMat(style, color), trim = style === 'brick' ? M.paint('#cfcac2') : cached('trim' + color, () => std({ color: shade(color, 0.04), map: stuccoTex() }));
    blk(g, body, [x0, x1], [baseY, baseY + h], [z0, z1], 0, style === 'brick' ? 1 : 4);
    const out = (a, b) => dir > 0 ? [zf + a, zf + b] : [zf - b, zf - a];    // de a a b metros hacia afuera de la fachada
    // planta baja: zócalo de piedra, locales o puerta de entrada
    blk(g, stone, [x0 + 0.02, x1 - 0.02], [baseY, baseY + 0.9], out(0, 0.03));
    const nb = Math.max(1, Math.floor(W / S.bay)), bay = W / nb;
    for (let b = 0; b < nb; b++) {
      const xc = x0 + (b + 0.5) * bay;
      if (r() < 0.6) {
        blk(g, shop, [xc - bay / 2 + 0.35, xc + bay / 2 - 0.35], [baseY + 0.3, baseY + 2.8], out(0.031, 0.06));
        blk(g, carp.dark, [xc - bay / 2 + 0.25, xc + bay / 2 - 0.25], [baseY + 2.8, baseY + 2.9], out(0, 0.09));
        if (r() < 0.5) blk(g, awnings[Math.floor(r() * awnings.length)], [xc - bay / 2 + 0.3, xc + bay / 2 - 0.3], [baseY + 2.95, baseY + 3.05], out(0.1, 1.1));
      } else blk(g, carp.wood, [xc - 0.55, xc + 0.55], [baseY + 0.02, baseY + 2.5], out(0.031, 0.08));
    }
    // pisos altos: ventanas, persianas, balcones y una moldura en cada losa
    const tint = new THREE.Color(style === 'brick' ? '#d8d3cb' : shade(color, 0.06));
    for (let f = 1; f < floors; f++) {
      const yf = baseY + GF + (f - 1) * FH;
      if (style === 'classic') blk(g, trim, [x0 + 0.02, x1 - 0.02], [yf - 0.18, yf - 0.02], out(0, 0.05), 0, 4);
      if (style === 'modern') {                                             // balcón corrido con baranda de vidrio
        blk(g, M.paint('#d9d7d2'), [x0 + 0.1, x1 - 0.1], [yf - 0.16, yf], out(0, 1.1), 0, 4);
        const gl = blk(g, M.tintedGlass('#bcd2da', 0.28), [x0 + 0.15, x1 - 0.15], [yf + 0.05, yf + 1.0], out(1.03, 1.05)); gl.renderOrder = 1;
        blk(g, carp.dark, [x0 + 0.12, x1 - 0.12], [yf + 1.0, yf + 1.05], out(1.0, 1.08));
      }
      for (let b = 0; b < nb; b++) {
        const xc = x0 + (b + 0.5) * bay, y = yf + S.sy, z = zf;
        bank('sur' + style, () => instBank(S.geo.surround, style === 'modern' ? carp.dark : surroundMat)).put(at(xc, y, z, dir), style === 'modern' ? null : tint);
        bank('car' + style, () => instBank(S.geo.frame, carp[S.carp])).put(at(xc, y, z, dir));
        const lit = r() < 0.3;
        bank((lit ? 'lit' : 'gla') + style, () => instBank(S.geo.glass, lit ? litMat : glassMat)).put(at(xc, y, z, dir), white.clone().multiplyScalar(0.8 + 0.25 * r()));
        if (S.shutter) {                                                     // persiana: baja una fracción al azar
          const k = r() < 0.25 ? 0.05 : r() * r() * 0.85;
          bank('sht', () => instBank(unitBox, slatMat)).put(at(xc, y + S.h * (1 - k) + 0.002, z, dir, S.w - 0.1, S.h * k - 0.004, 0.03));
        }
        if (S.balcony === 'iron' && (f % 2 === 1 || r() < 0.35)) {           // balconcito con baranda de hierro
          const bw = S.w + 0.5;
          bank('bal', () => instBank(unitBox, trim)).put(at(xc, yf - 0.14, z, dir, bw, 0.14, 0.7));
          bank('irn', () => instBank(ironGeo, railMat)).put(at(xc, yf, zf + dir * 0.67, dir, bw - 0.06, 1.0, 0.6));
        }
      }
    }
    // remate: cornisa, parapeto y, a veces, tanque de agua y sala de máquinas en la azotea
    blk(g, trim, [x0 - 0.02, x1 + 0.02], [baseY + h - 0.05, baseY + h + 0.25], out(-0.01, style === 'modern' ? 0.12 : 0.35), 0, 4);
    blk(g, body, [x0 + 0.05, x1 - 0.05], [baseY + h + 0.25, baseY + h + 1.0], out(-0.25, -0.02), 0, 4);
    blk(g, cached('roof', () => std({ map: roofTex() })), [x0 + 0.05, x1 - 0.05], [baseY + h, baseY + h + 0.02], [z0 + 0.05, z1 - 0.05], 0, 2);
    if (r() < 0.75) {
      const tx = x0 + 1 + r() * Math.max(0.5, W - 4), zt = zf - dir * (3 + r() * 5);
      blk(g, body, [tx, tx + 2.6], [baseY + h, baseY + h + 2.3], [zt - 1.1, zt + 1.1], 0, 4);
      cyl(g, M.paint('#8d8f8c'), tx + 1.3, baseY + h + 2.3, baseY + h + 3.5, zt, 0.75, 20);
    }
  }
  const pal = ['#ece6da', '#ddd3c2', '#f0eee8', '#d6cdbf', '#e6dccb', '#cfd2cf'];
  const pick = () => { const t = r(); return t < 0.45 ? 'classic' : t < 0.75 ? 'modern' : 'brick'; };
  const fl = spec.floors ?? [4, 10], nFloors = () => fl[0] + Math.floor(r() * (fl[1] - fl[0] + 1));
  // la cuadra de enfrente, de -NEAR a +NEAR
  for (let x = cx - NEAR; x < cx + NEAR;) { const w = 8 + r() * 7; building(x, x + w - 0.04, zo, 1, 15, nFloors(), pick(), pal[Math.floor(r() * pal.length)]); x += w; }
  // vecinos de la propia cuadra: cerca del departamento, más bajos que su piso (no tapan ventanas de costado)
  for (const side of [-1, 1]) {
    let x = side < 0 ? ext.x0 - 0.03 : ext.x1 + 0.03;
    while (Math.abs(x - cx) < NEAR) {
      const w = 8 + r() * 6, xa = side < 0 ? x - w : x, xb = side < 0 ? x : x + w;
      const near = Math.min(Math.abs(xa - cx), Math.abs(xb - cx)) < (ext.x1 - ext.x0) / 2 + 12;
      const floors = near ? Math.max(2, Math.min(fb - 2, 2 + Math.floor(r() * fb))) : nFloors();   // al menos dos pisos por debajo: ni el tanque llega al departamento
      building(xa + 0.02, xb - 0.02, ext.z0, -1, ext.z1 - ext.z0 + 8, floors, pick(), pal[Math.floor(r() * pal.length)]);
      x += side * w;
    }
  }
  // más allá de ±NEAR, la cuadra sigue con cajas de fachada pintada (lejos, entre la bruma, no se nota la diferencia)
  const roof = M.paint('#a9a7a2');
  const flatBuilding = (x0, x1, z0, z1, h, style, color) => {
    const W = x1 - x0, D = z1 - z0, geo = new THREE.BoxGeometry(W, h, D), p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (Math.abs(n.getX(i)) > 0.5 ? p.getZ(i) + z0 + D / 2 : p.getX(i) + x0 + W / 2) / 12, (p.getY(i) + h / 2) / 12);
    const fac = M.facade(style, color, 1 + Math.floor(r() * 4));
    const m = new THREE.Mesh(geo, [fac, fac, roof, roof, fac, fac]); m.position.set((x0 + x1) / 2, baseY + h / 2, (z0 + z1) / 2); g.add(m);
  };
  for (const side of [-1, 1]) for (const [zf, dir] of [[zo, 1], [ext.z0, -1]]) {
    for (let x = cx + side * NEAR; Math.abs(x - cx) < FAR;) {
      const w = 9 + r() * 8, xa = side < 0 ? x - w : x, xb = side < 0 ? x : x + w, st = r() < 0.2 ? 'brick' : 'plaster';
      flatBuilding(xa + 0.02, xb - 0.02, Math.min(zf, zf - dir * 15), Math.max(zf, zf - dir * 15), (nFloors() - 1) * FH + GF, st, st === 'brick' ? '#a96f53' : pal[Math.floor(r() * pal.length)]);
      x += side * w;
    }
  }
  // contrafrentes: el fondo de la manzana detrás del departamento (se ve en las vistas desde arriba)
  for (let x = cx - NEAR; x < cx + NEAR;) { const w = 9 + r() * 7; flatBuilding(x, x + w - 0.04, ext.z1 + 16, ext.z1 + 30, (Math.min(fb, 3 + Math.floor(r() * fb)) - 1) * FH + GF, 'plaster', pal[Math.floor(r() * pal.length)]); x += w; }
  // la ciudad a lo lejos: una franja cilíndrica con la silueta, que la bruma funde con el cielo
  {
    const t = skylineTex(), mat = new THREE.MeshStandardMaterial({ map: t.map, alphaTest: 0.5, emissive: 0xffffff, emissiveMap: t.lit, emissiveIntensity: 0, roughness: 1, side: THREE.BackSide });
    mat.userData.night = [0, 1.2]; t.map.repeat.x = t.lit.repeat.x = 3;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(160, 160, 70, 64, 1, true), mat);
    band.position.set(cx, baseY + 33, cz); g.add(band);
  }

  /* árboles de vereda: tronco con ramas y copa de "tarjetas" de hojas (alpha), en tres variantes, instanciados */
  if (spec.trees !== false) {
    // mate (Lambert, sin brillo): con el material estándar las hojas vistas de canto reflejaban el entorno y se veían
    // celestes, como manchas sobre la fachada de atrás (2026-11-07). Además es más liviano
    const leafMat = new THREE.MeshLambertMaterial({ map: leavesTex(), alphaTest: 0.45, alphaToCoverage: true, side: THREE.DoubleSide, vertexColors: true });
    const bark = M.paint('#6c6359');
    const crownVariant = seed => {                                         // copa para un árbol de 1 m (se escala con la altura)
      const rr = rng(seed), quads = [], c = new THREE.Vector3(0, 0.7, 0);
      for (let i = 0; i < 170; i++) {
        let v; do { v = new THREE.Vector3(rr() * 2 - 1, rr() * 2 - 1, rr() * 2 - 1); } while (v.lengthSq() > 1);
        const p = new THREE.Vector3(v.x * 0.3, v.y * 0.2, v.z * 0.3).add(c), q = new THREE.PlaneGeometry(0.11, 0.11);
        q.rotateX(rr() * 3); q.rotateY(rr() * 3); q.translate(p.x, p.y, p.z);
        const nrm = q.attributes.normal, col = new Float32Array(12);
        for (let k = 0; k < 4; k++) {
          const d = new THREE.Vector3(q.attributes.position.getX(k), q.attributes.position.getY(k), q.attributes.position.getZ(k)).sub(c);
          const out = d.clone().normalize(); nrm.setXYZ(k, out.x, out.y * 0.8 + 0.2, out.z);
          const t = 0.55 + 0.45 * Math.min(1, d.length() / 0.28) * (0.75 + 0.25 * (d.y / 0.2 + 1) / 2); col[k * 3] = col[k * 3 + 1] = col[k * 3 + 2] = t;
        }
        q.setAttribute('color', new THREE.BufferAttribute(col, 3)); quads.push(q);
      }
      return mergeGeometries(quads, false);
    };
    const trunkGeo = (() => {
      const parts = [new THREE.CylinderGeometry(0.009, 0.016, 0.5, 8).translate(0, 0.25, 0)];
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + 0.4, b = new THREE.CylinderGeometry(0.004, 0.008, 0.3, 6).translate(0, 0.15, 0);
        b.rotateZ(0.6); b.rotateY(a); b.translate(0, 0.45, 0); parts.push(b);
      }
      return mergeAll(parts);
    })();
    const crowns = [11, 23, 37].map(s => instBank(crownVariant(s), leafMat)), trunks = instBank(trunkGeo, bark);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: blobTex(), transparent: true, opacity: 0.35, depthWrite: false, fog: false });
    const shadows = instBank(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), shadowMat, { order: 1 });
    const greens = ['#ffffff', '#e8f0dc', '#f4f0d8'].map(c => new THREE.Color(c));
    // Árboles de vereda (2026-11-07). Una copa redonda de radio ~0,3 h se metía en los balcones y las paredes (las hojas
    // detrás de las barandas de vidrio se veían como manchas celestes); achatarla del lado de la fachada los dejaba como
    // paredes ("muy chatos", el usuario). Ahora: árboles de 7 a 9,5 m, la copa corrida LEAN metros hacia la calle (donde
    // sobra lugar) con el tronco apenas inclinado hacia ese lado, como los árboles que buscan la luz, y solo si hace
    // falta, un poco más angosta hacia la fachada. REACH: lo que la copa puede crecer hacia la fachada desde su centro
    // (la vereda mide 3,2 m, los balcones salen hasta 1,1 m y las tarjetas de hojas suman ~25 cm). Ninguno pegado a un farol
    const LEAN = 0.8, REACH = 1.15 + LEAN, yAxis = new THREE.Vector3(0, 1, 0), xAxis = new THREE.Vector3(1, 0, 0);
    const lampsAt = side => { const l = []; for (let x = cx - NEAR + (side ? 9 : 0); x <= cx + NEAR; x += 18) l.push(x); return l; };
    for (const [z, y0, toStreet, side] of [[zw + 0.6, baseY + 0.15, -1, 0], [zr - 0.6, baseY + 0.15, 1, 1]]) for (let x = cx - NEAR - 6; x < cx + NEAR + 6; x += 6 + r() * 2.5) {
      const h = 7 + r() * 2.5, spin = r() < 0.5 ? 0 : Math.PI, k = Math.min(1, REACH / (0.3 * h));
      let xx = x + r();
      for (const lx of lampsAt(side)) if (Math.abs(xx - lx) < 2.2) xx = lx + (xx < lx ? -2.2 : 2.2);
      const tilt = Math.atan(LEAN / (0.7 * h)) * toStreet;   // el tronco se inclina hacia la calle
      const qt = new THREE.Quaternion().setFromAxisAngle(xAxis, tilt).multiply(new THREE.Quaternion().setFromAxisAngle(yAxis, spin));
      mtx.compose(new THREE.Vector3(xx, y0, z), qt, new THREE.Vector3(h, h, h)); trunks.put(mtx);
      const qc = new THREE.Quaternion().setFromAxisAngle(yAxis, spin);
      mtx.compose(new THREE.Vector3(xx, y0, z + toStreet * LEAN), qc, new THREE.Vector3(h * 1.1, h, h * k)); crowns[Math.floor(r() * 3)].put(mtx, greens[Math.floor(r() * 3)]);
      mtx.compose(new THREE.Vector3(xx, y0 + 0.025, z + toStreet * LEAN * 0.7), q0, new THREE.Vector3(h * 0.65, 1, h * 0.6 * k)); shadows.put(mtx);
      blk(g, M.paint('#5b4a3b'), [xx - 0.5, xx + 0.5], [baseY + 0.15, baseY + 0.16], [z - 0.5, z + 0.5]);   // cantero
    }
    crowns.forEach(b => b.addTo(g)); trunks.addTo(g); shadows.addTo(g);
  }
  // Faroles de calle con su charco de luz de noche (2026-11-07, pedido del usuario: "muy bruta y potente"). El charco cae
  // como una luz real: más fuerte bajo el farol y apagándose de a poco, sin borde (curva gaussiana), y tenue. Va pegado a
  // cada superficie que toca (vereda, cordón, calzada) en vez de un disco que flotaba a la altura de la vereda, y los
  // faroles de una y otra vereda van alternados para que los charcos no se pisen
  const poolTex = envTex('pool', () => canvasTex(128, 128, (g, w) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, w);
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    for (let t = 0; t <= 1.0001; t += 0.1) { const v = Math.exp(-t * t * 5) * (1 - smooth(0.8, 1, t)) * 255 | 0; gr.addColorStop(Math.min(1, t), `rgb(${v},${v},${v})`); }
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  }));
  const pool = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffbf86, emissiveMap: poolTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, emissiveIntensity: 0, fog: false });
  pool.userData.night = [0, 0.28];
  // superficies del suelo: [z0, z1, altura de arriba]
  const surfaces = [[zw + 0.15, front + 0.5, 0.15], [zw, zw + 0.15, 0.16], [zr, zw, 0.02], [zr - 0.15, zr, 0.16], [zo - 30, zr - 0.15, 0.15]];
  const poolGeos = [];
  const lightPool = (xc, zc, R) => {
    for (const [s0, s1, top] of surfaces) {
      const z0 = Math.max(s0, zc - R), z1 = Math.min(s1, zc + R);
      if (z1 <= z0) continue;
      const x0 = xc - R, x1 = xc + R, y = baseY + top + 0.004, u = x => (x - x0) / (2 * R), v = z => 1 - (z - (zc - R)) / (2 * R);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z0], 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute([u(x0), v(z1), u(x1), v(z1), u(x1), v(z0), u(x0), v(z0)], 2));
      geo.setIndex([0, 1, 2, 0, 2, 3]); poolGeos.push(geo);
    }
  };
  for (const [z, dz, shift] of [[zw + 0.4, -1, 0], [zr - 0.4, 1, 9]]) for (let x = cx - NEAR + shift; x <= cx + NEAR; x += 18) {
    cyl(g, M.metal('#34373b', 0.5), x, baseY + 0.15, baseY + 6.8, z, 0.07, 10, 0.05);
    bar(g, M.metal('#34373b', 0.5), 'z', Math.min(z, z + dz * 1.2), Math.max(z, z + dz * 1.2), baseY + 6.75, x, 0.03, 8);
    blk(g, M.metal('#2e3135', 0.5), [x - 0.18, x + 0.18], [baseY + 6.55, baseY + 6.72], [z + dz * 1.2 - 0.3, z + dz * 1.2 + 0.3]);
    add(g, new THREE.BoxGeometry(0.3, 0.02, 0.5), M.glow(), x, baseY + 6.54, z + dz * 1.2);
    lightPool(x, z + dz * 1.2, 5);
  }
  if (poolGeos.length) { const m = new THREE.Mesh(mergeGeometries(poolGeos, false), pool); m.renderOrder = 2; m.userData.keep = true; g.add(m); }
  for (const b of banks.values()) b.addTo(g);
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return g;
}

// Paisaje de lago y bosque frente a los ventanales (lado -Z): la ladera baja con coníferas hasta el agua y del otro lado
// hay cordones de montañas que se pierden en la bruma. "nature": { "seed", "lake": distancia al agua, "drop": desnivel }
function natureAround(spec, { M, ext, baseY, front }) {
  const g = new THREE.Group(), r = rng(spec.seed ?? 5), cx = (ext.x0 + ext.x1) / 2;
  const lakeZ = front - (spec.lake ?? 70), drop = spec.drop ?? 18, lakeY = baseY - drop;
  const groundY = z => z > ext.z1 + 4 ? baseY + (4 + Math.min(30, (z - ext.z1) * 0.35)) * smooth(0, 1, (z - ext.z1 - 4) / 10) : z > front - 4 ? baseY
    : z < lakeZ ? lakeY : baseY - drop * smooth(0, 1, (front - 4 - z) / (front - 4 - lakeZ));
  // ladera: una malla que sigue groundY, con algo de relieve
  const geo = new THREE.PlaneGeometry(500, 260, 100, 70); geo.rotateX(-Math.PI / 2);
  const q = geo.attributes.position;
  for (let i = 0; i < q.count; i++) { const x = q.getX(i) + cx, z = q.getZ(i) + front - 20; q.setXYZ(i, x, groundY(z) + 1.2 * vnoise(x / 9 + 50, z / 9 + 50, 1000, 1000) - 0.8, z); }
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, M.paint('#5f7046')));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 900), new THREE.MeshStandardMaterial({ color: '#2c6f9c', roughness: 0.12, metalness: 0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.set(cx, lakeY + 0.3, lakeZ - 440); g.add(water);
  // cordones de montañas del otro lado del lago
  for (const [dist, hmax, col] of [[340, 32, '#6d8199'], [430, 58, '#8a9db1']]) {
    const m = new THREE.PlaneGeometry(1400, 1, 200, 1), p = m.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), top = p.getY(i) > 0, n = 0.6 * vnoise(x / 60 + dist, 3, 1000, 1000) + 0.4 * vnoise(x / 17 + dist, 7, 1000, 1000);
      p.setY(i, top ? lakeY + hmax * (0.25 + 0.75 * n) : lakeY - 2);
    }
    m.computeVertexNormals();
    const mesh = new THREE.Mesh(m, M.paint(col)); mesh.position.set(cx, 0, lakeZ - dist); g.add(mesh);
  }
  // pinos: copa cónica en racimos desde un cuarto de la altura, anchos abajo y finos arriba, con el tronco a la vista
  // solo abajo (instanciados). Con la copa solo arriba, un pino cortado por el borde de una vista aérea se veía como
  // un palo suelto. La ladera hacia el lago queda salpicada de pinos que dejan ver el agua, y detrás y a los costados
  // del edificio hay bosque más cerrado
  const trees = [], half = (ext.x1 - ext.x0) / 2;
  for (let i = 0; i < 170; i++) {
    const x = cx + (r() - 0.5) * 200, z = front - 9 - r() * (front - 9 - lakeZ + 5);
    if (Math.abs(x - cx) < half + 2 && z > front - 14) continue;   // claro justo frente a los ventanales
    trees.push([x, groundY(z), z, 12 + r() * 12]);
  }
  for (let i = 0; i < 160; i++) {                                   // bosque detrás y a los costados
    const back = r() < 0.6, x = back ? cx + (r() - 0.5) * 120 : cx + (r() < 0.5 ? -1 : 1) * (half + 5 + r() * 50);
    const z = back ? ext.z1 + 6 + r() * 60 : front + 4 - r() * 50;
    trees.push([x, groundY(z), z, 11 + r() * 12]);
  }
  const greens = ['#2d4529', '#38532f', '#466237'].map(c => M.paint(c));
  const crowns = crownBank(greens, i => i * 7 + 2, trees.length * 5, { x: cx, z: (ext.z0 + ext.z1) / 2 });
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.22, 1, 7), M.paint('#5a4232'), trees.length);
  const o = new THREE.Object3D();
  trees.forEach(([x, y, z, h], i) => {
    o.position.set(x, y + h * 0.4, z); o.rotation.set(0, 0, 0); o.scale.set(1, h * 0.8, 1); o.updateMatrix(); trunks.setMatrixAt(i, o.matrix);
    for (let k = 0; k < 5; k++) {
      const c = Math.floor(r() * 3), t = 0.3 + k * 0.15 + 0.03 * r(), s = h * (0.15 - k * 0.025) * (0.85 + 0.3 * r()), j = h * 0.05 * (1 - k / 5);
      o.position.set(x + (r() - 0.5) * j, y + h * t, z + (r() - 0.5) * j); o.rotation.set(0, r() * 3, (r() - 0.5) * 0.2);
      o.scale.set(s * 1.2, s * 1.1, s * 1.2); o.updateMatrix(); crowns.put(c, o);
    }
  });
  crowns.addTo(g);
  g.add(trunks);
  // loma boscosa detrás del edificio (la que se ve por la ventana de la cocina)
  const hill = new THREE.PlaneGeometry(500, 1, 120, 1), hp = hill.attributes.position;
  for (let i = 0; i < hp.count; i++) { const x = hp.getX(i); hp.setY(i, hp.getY(i) > 0 ? baseY + 40 + 35 * vnoise(x / 45 + 9, 2, 1000, 1000) : baseY - 2); }
  hill.computeVertexNormals();
  const hm = new THREE.Mesh(hill, M.paint('#3e5a35')); hm.position.set(cx, 0, ext.z1 + 110); hm.rotation.y = Math.PI; g.add(hm);
  g.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
  return g;
}
