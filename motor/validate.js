// Validaciones del scene.json, para que los errores aparezcan en window.__viewer.warnings en lugar de pasar en silencio:
// claves y valores que el motor no entiende, paredes fuera de los ejes, muebles fuera de todo ambiente o colgados donde
// no hay pared, puertas que chocan al abrirse y circulación de al menos 60 cm (desde la entrada a cada ambiente y junto
// a cada mueble que se usa).
import * as THREE from 'three';
import { META } from './components.js';

/* ---------- claves que lee el motor, por nivel del scene.json ---------- */
const S = (...k) => new Set(k);
const KEYS = {
  root: S('version', 'name', 'photos', 'note', 'about', 'disclaimer', 'brand', 'estimated', 'orientation', 'units', 'height', 'viewAspect',
    'wallColor', 'baseboard', 'ceiling', 'rooms', 'walls', 'structure', 'items', 'levels', 'exterior', 'lighting', 'views'),
  level: S('name', 'y', 'height', 'rooms', 'walls', 'structure', 'items', 'voids', 'roof', 'wallColor', 'baseboard', 'ceiling'),
  room: S('id', 'name', 'rect', 'rects', 'floor', 'walls', 'ceiling', 'closed'),   // "closed": espacio sin acceso a propósito; "rects": ambiente en L o en U
  rect: S('x', 'z'),
  floor: S('kind', 'color', 'tile', 'size', 'gloss', 'texture', 'textureSize'),
  wall: S('from', 'to', 'thickness', 'openings'),
  opening: S('kind', 'at', 'width', 'height', 'sill', 'side', 'hinge', 'open', 'color', 'material', 'handle', 'lock',
    'frame', 'panels', 'shutter', 'shutterBox', 'shutterColor', 'grille', 'grilleCell', 'counter',
    'glass', 'glassColor', 'rows', 'from', 'frosted', 'bars'),   // glass: puerta vidriada ("half", "slot"); frosted y bars: ventana esmerilada con travesaños   // counter: barra en el antepecho de un arco o pase
  item: S('type', 'at', 'y', 'rotation', 'params', 'decor'),
  structure: S('kind', 'x', 'y', 'z', 'color', 'finish'),   // finish: 'concrete' (hormigón a la vista)
  void: S('x', 'z'),
  view: S('name', 'pos', 'target', 'fov', 'cut', 'photo', 'photoAspect', 'level'),
  lighting: S('sunFrom', 'sunColor', 'sunIntensity', 'ambient', 'environment', 'windowLight', 'exposure', 'sky', 'ground',
    'nightAmbient', 'nightExposure', 'warmth', 'lamps', 'bake', 'bounce'),   // bake: archivo de luz rebotada (motor/hornear.html); bounce: cuánto suma
  exterior: S('balcony', 'floorsBelow', 'facade', 'landscape', 'nature', 'city', 'fog', 'facing', 'bearing'),   // bearing: rumbo de la fachada en grados (0 = mira al norte), para el norte del plano
  balcony: S('x', 'z', 'floor', 'covered', 'soffit', 'railing', 'ends'),
  railing: S('kind', 'height', 'color', 'sides', 'wall', 'handrail', 'net'),
  roof: S('kind', 'x', 'z', 'eave', 'ridge', 'thickness', 'overhang', 'ceiling', 'color', 'beams', 'skylightFrame', 'beamSpacing', 'skylights'),
  skylight: S('side', 'z', 'u'),
  nature: S('seed', 'lake', 'drop'),
  city: S('seed', 'street', 'trees', 'floors'),
  brand: S('name', 'url', 'color'),   // marca blanca: quién presenta el departamento
};
// valores con opciones cerradas
const ONE_OF = {
  'floor.kind': ['tile', 'planks', 'herringbone', 'terrazzo', 'grass'], 'structure.kind': ['beam', 'column'], 'exterior.landscape': ['lake', 'city'],
  'railing.kind': ['bars', 'glass', 'parapet', 'balusters', 'panels'], 'exterior.facing': ['-z', '+z', '-x', '+x'], 'roof.kind': ['gable'], 'opening.hinge': ['start', 'end'], 'opening.material': ['wood', 'lacquer'],
};

function dist(a, b) {   // distancia de edición, para sugerir la clave más parecida
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1));
  return d[a.length][b.length];
}
const suggest = (k, options) => {
  const best = [...options].map(o => [o, dist(k, o)]).sort((p, q) => p[1] - q[1])[0];
  return best && best[1] <= Math.max(2, Math.floor(k.length / 3)) ? ` (¿"${best[0]}"?)` : '';
};
const isNum = v => typeof v === 'number' && Number.isFinite(v);
const isPair = v => Array.isArray(v) && v.length === 2 && v.every(isNum);
const isTriple = v => Array.isArray(v) && v.length === 3 && v.every(isNum);
const itemName = it => `${it.type ?? 'mueble sin tipo'} en [${(it.at ?? []).join(', ')}]`;

/* ---------- claves, valores y paredes ---------- */
export function checkSpec(spec, { COMPONENTS, OPENINGS }) {
  const out = [];
  const keys = (obj, kind, where) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const k of Object.keys(obj)) if (!KEYS[kind].has(k)) out.push(`· clave desconocida "${k}" en ${where}${suggest(k, KEYS[kind])}: el motor la ignora`);
  };
  const oneOf = (v, key, where) => {
    if (v !== undefined && !ONE_OF[key].includes(v)) out.push(`· ${where}: "${v}" no es un valor posible (${ONE_OF[key].join(', ')})`);
  };
  keys(spec, 'root', 'la raíz del scene.json');
  keys(spec.brand, 'brand', '"brand"');
  if (spec.brand?.color !== undefined && !/^#[0-9a-f]{6}$/i.test(spec.brand.color)) out.push('· "brand.color" va como "#rrggbb"');
  const levels = [spec, ...(spec.levels ?? [])];
  levels.forEach((Lv, li) => {
    const at = li ? `el nivel ${li}` : 'la planta baja';
    if (li) keys(Lv, 'level', at);
    if (!Array.isArray(Lv.walls) || !Lv.walls.length) out.push(`· ${at} no tiene paredes ("walls")`);
    for (const r of Lv.rooms ?? []) {
      const where = `el ambiente "${r.name ?? r.id ?? '?'}"`;
      keys(r, 'room', where); keys(r.floor, 'floor', where);
      for (const rc of r.rects ?? [r.rect]) {
        keys(rc, 'rect', where);
        if (!isPair(rc?.x) || !isPair(rc?.z) || rc.x[0] >= rc.x[1] || rc.z[0] >= rc.z[1]) out.push(`· ${where}: "rect" necesita x y z como [desde, hasta] con desde < hasta`);
      }
      oneOf(r.floor?.kind, 'floor.kind', `${where}, piso`);
    }
    for (const w of Lv.walls ?? []) {
      const where = `la pared de [${w.from}] a [${w.to}]`;
      keys(w, 'wall', where);
      if (!isPair(w.from) || !isPair(w.to)) { out.push(`· ${where}: "from" y "to" tienen que ser [x, z]`); continue; }
      const alongX = Math.abs(w.from[1] - w.to[1]) < 1e-6, alongZ = Math.abs(w.from[0] - w.to[0]) < 1e-6;
      if (!alongX && !alongZ) out.push(`· ${where} no va en X ni en Z: el motor solo dibuja paredes rectas en esos dos ejes`);
      const len = Math.hypot(w.to[0] - w.from[0], w.to[1] - w.from[1]);
      for (const o of w.openings ?? []) {
        const ow = `${where}, abertura "${o.kind}" en ${o.at}`;
        keys(o, 'opening', ow);
        if (!OPENINGS[o.kind]) out.push(`· ${ow}: tipo de abertura desconocido${suggest(String(o.kind), Object.keys(OPENINGS))}`);
        if (!isNum(o.at) || !isNum(o.width) || !isNum(o.height)) out.push(`· ${ow}: faltan "at", "width" o "height"`);
        else if (o.at < 0 || o.at + o.width > len + 1e-6) out.push(`· ${ow}: se sale de la pared (${o.at} + ${o.width} > ${len.toFixed(2)} m)`);
        oneOf(o.hinge, 'opening.hinge', ow); oneOf(o.material, 'opening.material', ow);
      }
    }
    for (const s of Lv.structure ?? []) { keys(s, 'structure', `la estructura de ${at}`); oneOf(s.kind, 'structure.kind', `la estructura de ${at}`); }
    for (const v of Lv.voids ?? []) keys(v, 'void', `un hueco de ${at}`);
    if (Lv.roof) {
      keys(Lv.roof, 'roof', `el techo de ${at}`); oneOf(Lv.roof.kind, 'roof.kind', `el techo de ${at}`);
      for (const s of Lv.roof.skylights ?? []) keys(s, 'skylight', `una claraboya de ${at}`);
    }
    for (const it of Lv.items ?? []) {
      const where = itemName(it);
      keys(it, 'item', where);
      if (!COMPONENTS[it.type]) out.push(`· ${where}: tipo de mueble desconocido${suggest(String(it.type), Object.keys(COMPONENTS))}`);
      if (!isPair(it.at)) out.push(`· ${where}: "at" tiene que ser [x, z]`);
    }
  });
  const lit = spec.lighting; keys(lit, 'lighting', '"lighting"');
  if (lit?.warmth !== undefined && !(isNum(lit.warmth) && lit.warmth >= 0 && lit.warmth <= 1)) out.push('· "lighting.warmth" va de 0 (neutra) a 1 (atardecer)');
  const ex = spec.exterior ?? {};
  keys(ex, 'exterior', '"exterior"'); oneOf(ex.landscape, 'exterior.landscape', '"exterior.landscape"'); oneOf(ex.facing, 'exterior.facing', '"exterior.facing"'); keys(ex.nature, 'nature', '"exterior.nature"'); keys(ex.city, 'city', '"exterior.city"');
  for (const b of [ex.balcony ?? []].flat()) { keys(b, 'balcony', 'un balcón'); keys(b.railing, 'railing', 'la baranda de un balcón'); oneOf(b.railing?.kind, 'railing.kind', 'la baranda de un balcón'); }
  const views = Object.entries(spec.views ?? {});
  if (!views.length) out.push('· no hay vistas ("views")');
  for (const [k, v] of views) {
    const where = `la vista "${k}"`;
    keys(v, 'view', where);
    if (!isTriple(v.pos) || !isTriple(v.target) || !isNum(v.fov)) out.push(`· ${where}: "pos" y "target" son [x, y, z] y "fov" un número`);
    if ((v.level ?? 0) >= levels.length) out.push(`· ${where}: el nivel ${v.level} no existe`);
    if (v.photoAspect !== undefined && !v.photo) out.push(`· ${where}: tiene "photoAspect" pero no "photo"`);
  }
  return out;
}

/* ---------- ubicación, puertas y circulación (con la escena ya armada) ---------- */
// según la ficha de cada componente (META): lo que va colgado ("wall") tiene que tener pared (o viga/pilar) detrás, y
// lo que se usa ("use") necesita dónde pararse al lado, con 60 cm de paso
const onWall = t => META[t]?.mount === 'wall', used = t => !!META[t]?.use;
const PASS = 0.6, CELL = 0.05;

export function checkScene({ spec, levels, levelY, placed, wallBoxes, obstacles, doors, balconies }) {
  const out = [], v = new THREE.Vector3();
  out.maps = [];   // mapa de circulación por nivel (libre / alcanzable), para dibujarlo al revisar una advertencia
  const inRect = (r, x, z, m = 0) => x > r.x[0] - m && x < r.x[1] + m && z > r.z[0] - m && z < r.z[1] + m;
  const levelOf = y => levelY.reduce((best, l, i) => (y >= l.y0 - 0.05 ? i : best), 0);

  /* muebles fuera de todo ambiente (o de un balcón) y cosas de pared sin pared detrás */
  for (const { it, box, li } of placed) {
    if (box.isEmpty()) continue;
    const rooms = levels[li].rooms ?? [], [x, z] = it.at, a = THREE.MathUtils.degToRad(it.rotation ?? 0);
    const fx = Math.sin(a), fz = Math.cos(a);   // frente del mueble (+Z local)
    const inside = (px, pz) => rooms.some(r => inRect(r.rect, px, pz)) || (!li && balconies.some(b => inRect(b, px, pz)));
    if (!inside(x, z) && !inside(x + fx * 0.15, z + fz * 0.15)) out.push(`· ${itemName(it)} queda fuera de todo ambiente`);
    if (!onWall(it.type) || (it.type === 'tv' && it.params?.stand)) continue;
    const axis = Math.abs(fx) > 0.99 ? 'x' : Math.abs(fz) > 0.99 ? 'z' : null;
    if (!axis) continue;   // girado en diagonal: no se controla
    // un punto 3 cm por detrás de la cara trasera del objeto, a media altura
    const back = -(axis === 'x' ? fx : fz), c = box.getCenter(new THREE.Vector3());
    v.copy(c); v[axis] = back > 0 ? box.max[axis] + 0.03 : box.min[axis] - 0.03;
    if (!wallBoxes.some(b => b.containsPoint(v))) out.push(`· ${itemName(it)} va colgado pero no tiene pared detrás`);
  }

  /* puertas que chocan con un mueble al abrirse: se recorre el arco que barre la hoja */
  const furniture = placed.filter(p => p.solid && !p.box.isEmpty());
  for (const d of doors) {
    const a = THREE.MathUtils.degToRad(d.o.open ?? 0); if (a <= 0) continue;
    const jw = 0.035, atEnd = d.hinge === 'end', dir = atEnd ? -1 : 1, lw = d.len - 2 * jw, px = atEnd ? d.len - jw : jw;
    const hit = new Set();
    for (let k = 0; k <= 12; k++) for (let r = 0.15; r <= lw; r += 0.1) {
      const th = a * k / 12;
      v.set(px + dir * r * Math.cos(th), 1.0, d.t / 2 + r * Math.sin(th)); d.inner.localToWorld(v);
      for (const f of furniture) if (f.li === d.li && f.box.containsPoint(v)) hit.add(f);
    }
    for (const f of hit) out.push(`· la puerta entre "${d.room ?? '?'}" y "${d.other ?? '?'}" choca con ${itemName(f.it)} al abrirse`);
  }

  /* circulación: con un cuerpo de 60 cm de ancho, desde la entrada a cada ambiente y junto a cada mueble que se usa */
  levels.forEach((Lv, li) => {
    const rooms = Lv.rooms ?? []; if (!rooms.length) return;
    const { y0, top } = levelY[li];
    const x0 = Math.min(...rooms.map(r => r.rect.x[0])), x1 = Math.max(...rooms.map(r => r.rect.x[1]));
    const z0 = Math.min(...rooms.map(r => r.rect.z[0])), z1 = Math.max(...rooms.map(r => r.rect.z[1]));
    const nx = Math.ceil((x1 - x0) / CELL), nz = Math.ceil((z1 - z0) / CELL), free = new Uint8Array(nx * nz);
    const cx = i => x0 + (i + 0.5) * CELL, cz = j => z0 + (j + 0.5) * CELL;
    const R = PASS / 2 - 0.01;   // radio del cuerpo (1 cm de tolerancia: un paso de 60 justos alcanza)
    const band = obstacles.filter(b => b.max.y > y0 + 0.1 && b.min.y < Math.min(top, y0 + 1.6));
    const holes = li ? (Lv.voids ?? []) : [];   // huecos de escalera en el piso de este nivel: no se pisan
    // distancia real a cada caja (no la caja agrandada): entre dos esquinas en diagonal pasa quien pasa en la realidad
    const blocked = (x, z) => band.some(b => Math.hypot(Math.max(b.min.x - x, 0, x - b.max.x), Math.max(b.min.z - z, 0, z - b.max.z)) < R)
      || holes.some(h => inRect(h, x, z));
    // pisable: dentro de un ambiente o en el espesor de una pared entre ambientes (los vanos de puertas y pasos; la
    // pared en sí ya es obstáculo)
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = cx(i), z = cz(j);
      if (rooms.some(r => inRect(r.rect, x, z, 0.2)) && !blocked(x, z)) free[j * nx + i] = 1;
    }
    const cellOf = (x, z) => [Math.floor((x - x0) / CELL), Math.floor((z - z0) / CELL)];
    // punto de partida: delante de la puerta de entrada (abajo) o junto al hueco de la escalera (arriba); si no hay
    // puerta hacia afuera, el ambiente más grande
    let start = null;
    const entry = doors.find(d => d.li === li && d.outside);
    if (entry) { v.set(entry.len / 2, 1, 0.5); entry.inner.localToWorld(v); start = [v.x, v.z]; }
    else if (holes.length) { const h = holes[0]; start = [(h.x[0] + h.x[1]) / 2, (h.z[0] + h.z[1]) / 2]; }
    else { const r = [...rooms].sort((p, q) => (q.rect.x[1] - q.rect.x[0]) * (q.rect.z[1] - q.rect.z[0]) - (p.rect.x[1] - p.rect.x[0]) * (p.rect.z[1] - p.rect.z[0]))[0]; start = [(r.rect.x[0] + r.rect.x[1]) / 2, (r.rect.z[0] + r.rect.z[1]) / 2]; }
    // la celda libre más cercana al punto de partida
    let s = -1, best = Infinity;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (free[j * nx + i]) { const d2 = (cx(i) - start[0]) ** 2 + (cz(j) - start[1]) ** 2; if (d2 < best) { best = d2; s = j * nx + i; } }
    const seen = new Uint8Array(nx * nz);
    if (s >= 0) {
      const q = [s]; seen[s] = 1;
      while (q.length) {
        const c = q.pop(), i = c % nx, j = (c - i) / nx;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
          const n = b * nx + a; if (free[n] && !seen[n]) { seen[n] = 1; q.push(n); }
        }
      }
    }
    out.maps[li] = { x0, z0, nx, nz, cell: CELL, free, seen, start };
    const where = li ? ` (nivel ${li})` : '';
    // cada ambiente (por nombre: un ambiente en L son varios rectángulos) tiene que tener alguna celda alcanzable.
    // Los marcados "closed" (depósitos, ductos) no tienen acceso a propósito; un nicho que los muebles ocupan entero
    // (la cocina de un monoambiente) se usa desde afuera: alcanza con pararse a menos de 45 cm.
    const byName = new Map(); for (const r of rooms) if (!r.closed) byName.set(r.name ?? r.id, [...(byName.get(r.name ?? r.id) ?? []), r]);
    for (const [name, rs] of byName) {
      let ok = false, any = false;
      for (let j = 0; j < nz && !ok; j++) for (let i = 0; i < nx && !ok; i++) {
        const c = j * nx + i, isIn = rs.some(r => inRect(r.rect, cx(i), cz(j)));
        if (isIn && free[c]) any = true;
        if (seen[c] && isIn) ok = true;
      }
      if (!ok && !any) for (let j = 0; j < nz && !ok; j++) for (let i = 0; i < nx && !ok; i++) if (seen[j * nx + i] && rs.some(r => inRect(r.rect, cx(i), cz(j), R + 0.15))) ok = true;
      if (!ok) { out.push(`· con ${PASS * 100} cm de paso no se llega a "${name}"${where} desde ${entry ? 'la entrada' : 'el punto de partida'}`); continue; }
      // se llega, pero los muebles pueden dejar encerrado un sector (p. ej. al pie de una cama pegada a una pared)
      let lost = 0;
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (free[j * nx + i] && !seen[j * nx + i] && rs.some(r => inRect(r.rect, cx(i), cz(j)))) lost++;
      const m2 = lost * CELL * CELL;
      if (m2 >= 0.5) out.push(`· en "${name}"${where} queda un sector de ${m2.toFixed(1)} m² al que no se llega con ${PASS * 100} cm de paso`);
    }
    // junto a cada mueble que se usa: una celda alcanzable a menos de 45 cm de su borde
    for (const p of placed) {
      if (p.li !== li || !used(p.it.type) || p.box.isEmpty()) continue;
      const b = p.box, [i0, j0] = cellOf(b.min.x - 0.75, b.min.z - 0.75), [i1, j1] = cellOf(b.max.x + 0.75, b.max.z + 0.75);
      let ok = false;
      for (let j = Math.max(0, j0); j <= Math.min(nz - 1, j1) && !ok; j++) for (let i = Math.max(0, i0); i <= Math.min(nx - 1, i1) && !ok; i++) {
        if (!seen[j * nx + i]) continue;
        const dx = Math.max(b.min.x - cx(i), 0, cx(i) - b.max.x), dz = Math.max(b.min.z - cz(j), 0, cz(j) - b.max.z);
        if (Math.hypot(dx, dz) <= R + 0.15) ok = true;
      }
      if (!ok) out.push(`· no queda lugar para pararse junto a ${itemName(p.it)}${where} con ${PASS * 100} cm de paso`);
    }
  });
  return out;
}

/* ---------- piezas sueltas o flotando dentro de un componente (T-26) ---------- */
// Cada pieza (malla) de un componente tiene que tocar otra pieza del mismo componente o su apoyo: el piso (todos), la
// pared (los de pared y los de ventana, fondo en z = 0) o el techo (los de techo y de ventana). Se mide con la caja
// propia de cada pieza girada con ella (sirve para patas y caños inclinados) y una tolerancia de 2 mm. Devuelve una
// lista de { center, size, gap }: las piezas de cada grupo suelto, con la distancia a la pieza más cercana.
const TOL = 0.002;
function obbOf(box, m) {
  const c = box.getCenter(new THREE.Vector3()).applyMatrix4(m), h = box.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  const e = m.elements, u = [0, 1, 2].map(i => new THREE.Vector3(e[i * 4], e[i * 4 + 1], e[i * 4 + 2]));
  const half = u.map((v, i) => { const l = v.length(); v.divideScalar(l || 1); return h.getComponent(i) * l; });
  const aabb = new THREE.Box3().copy(box).applyMatrix4(m);
  return { c, u, half, aabb };
}
// separación entre dos cajas orientadas por el teorema del eje separador (0 si se tocan o se cruzan)
function obbGap(A, B) {
  const d = new THREE.Vector3().subVectors(B.c, A.c), axes = [...A.u, ...B.u], L = new THREE.Vector3();
  for (const a of A.u) for (const b of B.u) { L.crossVectors(a, b); if (L.lengthSq() > 1e-8) axes.push(L.clone().normalize()); }
  let gap = 0;
  for (const ax of axes) {
    const r = (O) => O.half.reduce((s, h, i) => s + h * Math.abs(O.u[i].dot(ax)), 0);
    gap = Math.max(gap, Math.abs(d.dot(ax)) - r(A) - r(B));
  }
  return gap;
}
export function loosePieces(g, meta = {}, H) {
  const mount = meta.mount, fixed = meta.fixed ?? [];
  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), parts = [], m = new THREE.Matrix4(), mi = new THREE.Matrix4();
  g.traverse(o => {
    if (!o.isMesh || !o.geometry?.attributes?.position || o.userData.noTouch) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    m.multiplyMatrices(inv, o.matrixWorld);
    if (o.isInstancedMesh) for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, mi); parts.push(obbOf(o.geometry.boundingBox, m.clone().multiply(mi))); }
    else parts.push(obbOf(o.geometry.boundingBox, m));
  });
  // el nodo n es "la obra" (pared, techo y lados amurados): lo que se atornilla ahí queda unido aunque las piezas no se
  // toquen entre sí (la grifería y el receptáculo de una ducha). El piso no une: solo sostiene
  const n = parts.length, up = [...Array(n + 1).keys()], find = i => (up[i] === i ? i : (up[i] = find(up[i])));
  const pairs = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const A = parts[i].aabb, B = parts[j].aabb;
    const sep = Math.max(A.min.x - B.max.x, B.min.x - A.max.x, A.min.y - B.max.y, B.min.y - A.max.y, A.min.z - B.max.z, B.min.z - A.max.z);
    if (sep > 0.3) continue;
    const gp = sep > TOL ? sep : obbGap(parts[i], parts[j]);
    pairs.push([i, j, gp]);
    if (gp <= TOL) up[find(i)] = find(j);
  }
  // apoyos: el piso para todos; la pared para lo de pared y de ventana; el techo para lo de techo y de ventana; y los
  // lados amurados de la ficha ("fixed")
  const anchored = new Set(), all = new THREE.Box3();
  parts.forEach(p => all.union(p.aabb));
  parts.forEach((p, i) => {
    const b = p.aabb, fx = (fixed.includes('back') && b.min.z <= all.min.z + TOL) || (fixed.includes('sides') && (b.min.x <= all.min.x + TOL || b.max.x >= all.max.x - TOL)), onFloor = b.min.y <= TOL, onWall = (mount === 'wall' || mount === 'window') && b.min.z <= TOL,
      onCeil = (mount === 'ceiling' && b.max.y >= all.max.y - TOL) || (mount === 'window' && b.max.y >= H - TOL);   // bajo un techo inclinado el techo no está en H: cuenta lo más alto
    if (onWall || onCeil || fx) up[find(i)] = find(n);
    p.floor = onFloor;
  });
  parts.forEach((p, i) => { if (p.floor) anchored.add(find(i)); });
  anchored.add(find(n));
  // además, todo tiene que ser una sola pieza unida: una pata que se separó del asiento y quedó parada en el piso
  // también es un error. Salvo los juegos de objetos sueltos a propósito ("set" en la ficha: vajilla, dispensers)
  const groups = new Map();
  parts.forEach((p, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(i); });
  const main = [...groups.entries()].filter(([r]) => anchored.has(r)).sort((a, b) => b[1].length - a[1].length)[0]?.[0];
  const loose = [...groups.entries()].filter(([r]) => !anchored.has(r) || (!meta.set && r !== main));
  return loose.map(([r, list]) => {
    const inside = new Set(list), gaps = pairs.filter(([i, j]) => inside.has(i) !== inside.has(j)).map(q => q[2]);
    const box = new THREE.Box3(); list.forEach(i => box.union(parts[i].aabb));
    return { pieces: list.length, center: box.getCenter(new THREE.Vector3()).toArray().map(v => +v.toFixed(3)),
      size: box.getSize(new THREE.Vector3()).toArray().map(v => +v.toFixed(3)), gap: gaps.length ? +Math.min(...gaps).toFixed(3) : null, apart: anchored.has(r) };
  });
}
// texto de aviso para un componente con piezas sueltas
export function looseText(name, loose) {
  return `· ${name}: ${loose.length === 1 ? 'un grupo de piezas suelto' : `${loose.length} grupos de piezas sueltos`} (`
    + loose.slice(0, 3).map(l => `${l.pieces} pieza${l.pieces > 1 ? 's' : ''}${l.apart ? ' apoyada' + (l.pieces > 1 ? 's' : '') + ' pero separada' + (l.pieces > 1 ? 's' : '') + ' del resto' : ' flotando'} en [${l.center.map(v => v.toFixed(2)).join(', ')}]${l.gap != null ? ` a ${(l.gap * 1000).toFixed(0)} mm` : ''}`).join('; ')
    + (loose.length > 3 ? '; …' : '') + ')';
}
