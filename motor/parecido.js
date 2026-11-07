// Medida de parecido entre el render y la foto de una vista, objeto por objeto (T-21). La usan comparar.html (&medir=)
// y las herramientas de colores (T-22) y encuadre (T-27). Trabaja con el mapa de identificación del motor (api.idMap()):
// cada píxel dice qué objeto y material se ve ahí; así se sabe qué píxeles de la foto le corresponden a cada mueble o
// superficie. Los bordes (2 px) se ignoran para tolerar un encuadre apenas corrido.

const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const LIN = Float32Array.from({ length: 256 }, (_, i) => lin(i));
export const toSRGB = v => { v = Math.max(0, Math.min(1, v)); return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)); };
export const hex = ([r, g, b]) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
// color lineal → Lab (D65)
export function lab([r, g, b]) {
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
export const deltaE = (a, b) => { const A = lab(a), B = lab(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };

// píxeles interiores: los que tienen el mismo id en un cuadrado de (2r+1) de lado
export function interior({ width: w, height: h, ids }, r = 2) {
  const edge = new Uint8Array(w * h), ok = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, v = ids[i];
    if ((x > 0 && ids[i - 1] !== v) || (x < w - 1 && ids[i + 1] !== v) || (y > 0 && ids[i - w] !== v) || (y < h - 1 && ids[i + w] !== v)) edge[i] = 1;
  }
  // distancia a un borde por dos pasadas (Chebyshev), recortada en r
  const d = new Uint8Array(w * h).fill(255);
  for (let i = 0; i < w * h; i++) if (edge[i]) d[i] = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; let m = d[i];
    if (x > 0) m = Math.min(m, d[i - 1] + 1); if (y > 0) m = Math.min(m, d[i - w] + 1, x > 0 ? d[i - w - 1] + 1 : 255, x < w - 1 ? d[i - w + 1] + 1 : 255);
    d[i] = m;
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x; let m = d[i];
    if (x < w - 1) m = Math.min(m, d[i + 1] + 1); if (y < h - 1) m = Math.min(m, d[i + w] + 1, x < w - 1 ? d[i + w + 1] + 1 : 255, x > 0 ? d[i + w - 1] + 1 : 255);
    d[i] = m; ok[i] = m > r ? 1 : 0;
  }
  return ok;
}

// render y foto: ImageData del mismo tamaño que el mapa. Devuelve por objeto los píxeles útiles, el color medio del
// render y de la foto (sRGB), la mediana de la foto y la diferencia (ΔE); y un puntaje de la vista: el ΔE medio pesado
// por superficie (más bajo = más parecido), sin contar el exterior ni los vidrios.
export function medir(map, render, photo, { minPx = 150 } = {}) {
  const ok = interior(map), acc = new Map(), R = render.data, P = photo.data;
  for (let i = 0; i < map.ids.length; i++) {
    if (!ok[i]) continue;
    const id = map.ids[i]; if (!id) continue;
    let a = acc.get(id);
    if (!a) acc.set(id, a = { n: 0, burnt: 0, r: [0, 0, 0], p: [0, 0, 0], hist: [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)] });
    const k = i * 4, pr = P[k], pg = P[k + 1], pb = P[k + 2];
    // la foto quemada (blanco puro) o casi negra no dice nada del color
    if (Math.max(pr, pg, pb) >= 250 || pr + pg + pb < 24) { a.burnt++; continue; }
    a.n++;
    a.r[0] += LIN[R[k]]; a.r[1] += LIN[R[k + 1]]; a.r[2] += LIN[R[k + 2]];
    a.p[0] += LIN[pr]; a.p[1] += LIN[pg]; a.p[2] += LIN[pb];
    a.hist[0][pr]++; a.hist[1][pg]++; a.hist[2][pb]++;
  }
  const median = (hst, n) => { let s = 0; for (let v = 0; v < 256; v++) { s += hst[v]; if (s >= n / 2) return v; } return 255; };
  const objetos = [];
  for (const [id, a] of acc) {
    const info = map.table[id]; if (!info || a.n < minPx) continue;
    const rl = a.r.map(v => v / a.n), pl = a.p.map(v => v / a.n);
    objetos.push({ id, ...info, px: a.n, quemado: a.burnt, renderLin: rl, fotoLin: pl,
      render: hex(rl.map(toSRGB)), foto: hex(pl.map(toSRGB)), mediana: hex(a.hist.map(h => median(h, a.n))), dE: +deltaE(rl, pl).toFixed(1) });
  }
  // Puntaje: ΔE medio pesado por superficie, después de igualar la exposición y el balance de blancos de la foto con los
  // del render (la mediana de foto / render por canal): así mide si los colores están bien entre sí y no cuánta luz
  // tenía la foto. "puntajeCrudo" es sin igualar.
  const cuenta = objetos.filter(o => o.kind !== 'exterior' && !o.glass), area = cuenta.reduce((s, o) => s + o.px, 0);
  const wmed = list => { const s = [...list].sort((a, b) => a.r - b.r); let h = s.reduce((t, x) => t + x.w, 0) / 2; for (const x of s) { h -= x.w; if (h <= 0) return x.r; } return 1; };
  const k = [0, 1, 2].map(c => wmed(cuenta.map(o => ({ r: o.fotoLin[c] / Math.max(0.003, o.renderLin[c]), w: o.px }))) || 1);
  for (const o of objetos) o.dEn = +deltaE(o.renderLin, o.fotoLin.map((v, c) => v / k[c])).toFixed(1);
  objetos.sort((x, y) => y.px * y.dEn - x.px * x.dEn);
  const avg = f => (area ? +(cuenta.reduce((s, o) => s + f(o) * o.px, 0) / area).toFixed(1) : null);
  return { objetos, puntaje: avg(o => o.dEn), puntajeCrudo: avg(o => o.dE), exposicion: k.map(x => +x.toFixed(3)), cubierto: +(area / map.ids.length * 100).toFixed(1) };
}

// color estable para dibujar cada id
export function idColor(id) {
  let h = Math.imul(id + 1, 2654435761) >>> 0;
  return [80 + (h & 127), 80 + ((h >> 8) & 127), 80 + ((h >> 16) & 127)];
}
// lámina de control: la foto con los bordes del mapa encima (para ver si el encuadre calza) y el mapa coloreado
export function mapaSobreFoto(map, photo) {
  const { width: w, height: h, ids } = map, c = Object.assign(document.createElement('canvas'), { width: w * 2 + 6, height: h }), g = c.getContext('2d');
  g.fillStyle = '#eceef0'; g.fillRect(0, 0, c.width, c.height);
  const a = new ImageData(new Uint8ClampedArray(photo.data), w, h), b = new ImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, v = ids[i], k = i * 4, col = v ? idColor(v) : [20, 20, 24];
    b.data[k] = col[0]; b.data[k + 1] = col[1]; b.data[k + 2] = col[2]; b.data[k + 3] = 255;
    const edge = (x < w - 1 && ids[i + 1] !== v) || (y < h - 1 && ids[i + w] !== v);
    if (edge) { a.data[k] = 255; a.data[k + 1] = 40; a.data[k + 2] = 200; }
  }
  g.putImageData(a, 0, 0); g.putImageData(b, w + 6, 0);
  return c;
}

// píxeles de una imagen recortada como "cover" a w × h
export function pixels(img, w, h) {
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h }), g = c.getContext('2d', { willReadFrequently: true });
  const s = Math.max(w / img.width, h / img.height); g.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
  return g.getImageData(0, 0, w, h);
}
const loadImg = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
const bytes = c => { const u = c.toDataURL('image/jpeg', 0.88); return Uint8Array.from(atob(u.split(',')[1]), ch => ch.charCodeAt(0)); };
// Mide todas las vistas con foto de un departamento ya armado (api = start(...)). "box" es el elemento que contiene el
// lienzo: toma el tamaño de la medida (con el panel del navegador oculto la página mide 0). Con "guardar" escribe una
// lámina mapa-<vista>.jpg (foto con los bordes del mapa | mapa) en /capturas/<guardar>/.
export async function medirVistas(api, scene, { dir = scene.photos ?? '', box, keys, guardar = null, lado = 480 } = {}) {
  keys ??= Object.keys(scene.views).filter(k => scene.views[k].photo);
  const out = { fecha: new Date().toISOString(), vistas: {} }, keep = { w: box.style.width, h: box.style.height };
  for (const k of keys) {
    const v = scene.views[k], A = v.photoAspect ?? scene.viewAspect ?? 0.75, W = A >= 1 ? Math.round(lado * 4 / 3) : lado, H = Math.round(W / A);
    Object.assign(box.style, { width: `${W}px`, height: `${H}px` }); api.resize(); api.setCut(!!v.cut); api.go(k, true);
    const map = api.idMap();
    const render = pixels(await loadImg(api.capture('image/png')), map.width, map.height);
    const photo = pixels(await loadImg(`${dir}${v.photo}.png`), map.width, map.height);
    const r = medir(map, render, photo);
    out.vistas[k] = { nombre: v.name, foto: v.photo, puntaje: r.puntaje, puntajeCrudo: r.puntajeCrudo, exposicion: r.exposicion, cubierto: r.cubierto,
      objetos: r.objetos.map(({ renderLin, fotoLin, ...o }) => ({ ...o, renderLin: renderLin.map(x => +x.toFixed(4)), fotoLin: fotoLin.map(x => +x.toFixed(4)) })) };
    if (guardar) await fetch(`/capturas/${guardar}/mapa-${k}.jpg`, { method: 'POST', body: bytes(mapaSobreFoto(map, photo)) });
  }
  Object.assign(box.style, { width: keep.w, height: keep.h }); api.resize();
  const ps = Object.values(out.vistas).map(v => v.puntaje).filter(x => x != null);
  out.puntaje = ps.length ? +(ps.reduce((s, x) => s + x, 0) / ps.length).toFixed(1) : null;
  return out;
}
