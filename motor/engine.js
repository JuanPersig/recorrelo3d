// Motor del visor: lee un scene.json y arma la escena con la biblioteca de componentes.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeMaterials, COMPONENTS, OPENINGS, META, nests, exterior, blk, uvScale } from './components.js';
import { checkSpec, checkScene, loosePieces, looseText } from './validate.js';

// recta de una pared alineada a X o a Z; "at" de cada abertura se mide desde el extremo "from"
function wallLine(w) {
  const alongX = Math.abs(w.from[1] - w.to[1]) < 1e-6;
  const fa = alongX ? w.from[0] : w.from[1], ta = alongX ? w.to[0] : w.to[1];
  return {
    alongX, t: w.thickness ?? 0.15, c: alongX ? w.from[1] : w.from[0],
    a0: Math.min(fa, ta), a1: Math.max(fa, ta),
    start: o => (fa <= ta ? fa + o.at : fa - o.at - o.width),
  };
}
function extentsOf(walls) {
  const e = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
  for (const w of walls) {
    const L = wallLine(w), lo = [L.a0, L.c - L.t / 2], hi = [L.a1, L.c + L.t / 2];
    const [xs, zs] = L.alongX ? [[lo[0], hi[0]], [lo[1], hi[1]]] : [[lo[1], hi[1]], [lo[0], hi[0]]];
    e.x0 = Math.min(e.x0, xs[0]); e.x1 = Math.max(e.x1, xs[1]); e.z0 = Math.min(e.z0, zs[0]); e.z1 = Math.max(e.z1, zs[1]);
  }
  return e;
}
// un piso rectangular; la textura se repite cada "size" metros
function floorPlane(parent, mat, [x0, x1], [z0, z1], size, y = 0) {
  const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0); geo.rotateX(-Math.PI / 2);
  uvScale(geo, (x1 - x0) / size, (z1 - z0) / size);
  // las UV arrancan en la esquina del rectángulo: se corren para que las juntas sigan la grilla del departamento
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + x0 / size, uv.getY(i) - z1 / size);
  const m = new THREE.Mesh(geo, mat);
  m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true; parent.add(m);
  return m;
}

// rectángulo [x0, x1] × [z0, z1] menos una lista de huecos { x, z }: devuelve tiras [[x0, x1], [z0, z1]] que no se pisan
function subtractRects([x0, x1], [z0, z1], holes) {
  const hs = holes.map(h => ({ x: [Math.max(x0, h.x[0]), Math.min(x1, h.x[1])], z: [Math.max(z0, h.z[0]), Math.min(z1, h.z[1])] }))
    .filter(h => h.x[1] > h.x[0] && h.z[1] > h.z[0]);
  const xs = [...new Set([x0, x1, ...hs.flatMap(h => h.x)])].sort((a, b) => a - b), out = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1], cuts = hs.filter(h => h.x[0] <= a + 1e-9 && h.x[1] >= b - 1e-9).map(h => h.z).sort((p, q) => p[0] - q[0]);
    let cur = z0;
    for (const [c0, c1] of cuts) { if (c0 > cur + 1e-9) out.push([[a, b], [cur, c0]]); cur = Math.max(cur, c1); }
    if (z1 > cur + 1e-9) out.push([[a, b], [cur, z1]]);
  }
  return out;
}

// Techo a dos aguas con la cumbrera a lo largo de Z: dos faldones (cielorraso de machimbre adentro, chapa afuera),
// cabios a la vista, viga de cumbrera y claraboyas. Devuelve los planos que recortan las paredes del nivel.
// "skylights": [{ "side": -1 (faldón de x0) | 1, "z": [z0, z1], "u": [u0, u1] }] con "u" medido sobre la pendiente desde el alero.
function gableRoof(R, { M, y0, ceilMat }) {
  const group = new THREE.Group(), [x0, x1] = R.x, [z0, z1] = R.z, E = R.eave ?? 1.2, Rg = R.ridge ?? 3.2;
  const half = (x1 - x0) / 2, rise = Rg - E, a = Math.atan2(rise, half), len = Math.hypot(half, rise);
  const T = R.thickness ?? 0.18, ov = R.overhang ?? 0.3, ovU = ov / Math.cos(a), uMax = len + T * Math.tan(a);
  const xm = (x0 + x1) / 2, zc = (z0 + z1) / 2, inner = R.ceiling ? M.boards(R.ceiling, 'boards') : ceilMat;
  const outer = M.lacquer(R.color ?? '#3a3d42'), beam = M.paint(R.beams ?? '#f2f1ec'), frame = M.wood(R.skylightFrame ?? '#c8a77c');
  const skylights = [];
  for (const side of [-1, 1]) {
    // el faldón derecho es el izquierdo girado 180° alrededor de la cumbrera
    const pivot = new THREE.Group(); pivot.position.set(xm, 0, zc); if (side > 0) pivot.rotation.y = Math.PI; group.add(pivot);
    const S = new THREE.Group(); S.position.set(-half, E, 0); S.rotation.z = a; pivot.add(S);
    const holes = (R.skylights ?? []).filter(s => (s.side ?? -1) === side)
      .map(s => ({ x: s.u, z: side > 0 ? [zc - s.z[1], zc - s.z[0]] : [s.z[0] - zc, s.z[1] - zc] }));
    for (const [us, vs] of subtractRects([-ovU, uMax], [z0 - zc - ov, z1 - zc + ov], holes)) {
      blk(S, inner, us, [0, T], vs, 0, 0.3);
      blk(S, outer, us, [T, T + 0.02], vs);
    }
    const sp = R.beamSpacing ?? 1.2;   // cabios a la vista, salteando las claraboyas
    for (let v = z0 - zc + sp / 2; v < z1 - zc; v += sp) {
      if (holes.some(h => v > h.z[0] - 0.06 && v < h.z[1] + 0.06)) continue;
      blk(S, beam, [0, len - 0.1], [-0.1, 0], [v - 0.035, v + 0.035]);
    }
    for (const h of holes) {
      const [u0, u1] = h.x, [v0, v1] = h.z, f = 0.05;
      blk(S, frame, [u0, u0 + f], [-0.06, T + 0.07], [v0, v1]); blk(S, frame, [u1 - f, u1], [-0.06, T + 0.07], [v0, v1]);
      blk(S, frame, [u0 + f, u1 - f], [-0.06, T + 0.07], [v0, v0 + f]); blk(S, frame, [u0 + f, u1 - f], [-0.06, T + 0.07], [v1 - f, v1]);
      blk(S, M.glass(), [u0 + f, u1 - f], [T * 0.5, T * 0.5 + 0.008], [v0 + f, v1 - f]).castShadow = false;
      skylights.push({ g: S, c: new THREE.Vector3((u0 + u1) / 2, -0.07, (v0 + v1) / 2), w: u1 - u0 - 2 * f, h: v1 - v0 - 2 * f });
    }
  }
  blk(group, beam, [xm - 0.07, xm + 0.07], [Rg - 0.2, Rg], [z0, z1]);   // viga de cumbrera
  // planos de recorte (coordenadas de mundo): se conserva lo que queda por debajo de cada faldón
  const n1 = new THREE.Vector3(rise, -half, 0).normalize(), n2 = new THREE.Vector3(-rise, -half, 0).normalize();
  const clip = [new THREE.Plane(n1, -n1.dot(new THREE.Vector3(x0, y0 + E, 0))), new THREE.Plane(n2, -n2.dot(new THREE.Vector3(x1, y0 + E, 0)))];
  return { group, clip, skylights };
}

// Recorrido en primera persona para las vistas interiores: arrastrar mira alrededor (se "agarra" la escena, como en
// Street View), la rueda o el pellizco abren o cierran el campo de visión, WASD o las flechas caminan y doble clic (o un toque) en el piso lleva
// hasta ahí. Mirada y pasos van suavizados; el cuerpo, un círculo de 22 cm, choca con paredes y muebles y se desliza.
class WalkControls {
  constructor(camera, dom, scene, bounds) {
    Object.assign(this, { camera, dom, scene, bounds, enabled: false, obstacles: [], yaw: 0, pitch: 0, tYaw: 0, tPitch: 0,
      vel: new THREE.Vector2(), keys: new Set(), goal: null, ptrs: new Map(), pinch: 0, spin: null, onStart: null, onZoom: null });
    camera.rotation.order = 'YXZ';
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const pick = (x, y) => {   // doble clic: piso → caminar hasta ahí; pared o mueble → girar hacia ese punto
      const r = dom.getBoundingClientRect(); ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(scene.children, true).find(h => h.object.visible && h.face && !h.object.material?.transparent);
      if (!hit) return;
      const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      if (n.y > 0.6 && hit.point.y < camera.position.y - 0.4) this.goal = new THREE.Vector2(hit.point.x, hit.point.z);
      else { const a = Math.atan2(-(hit.point.x - camera.position.x), -(hit.point.z - camera.position.z)); this.tYaw = this.yaw + Math.atan2(Math.sin(a - this.yaw), Math.cos(a - this.yaw)); }
      this.onStart?.();
    };
    const L = [];
    const on = (el, t, f, o) => { el.addEventListener(t, f, o); L.push(() => el.removeEventListener(t, f, o)); };
    // Con el dedo la escena se "agarra": arrastrar de un borde al otro de la pantalla gira lo que muestra (antes giraba
    // unas tres veces más y se sentía brusco). Al soltar con envión sigue girando y frena solo. Un toque en el piso
    // camina hasta ahí (un toque es apoyar y levantar sin arrastrar).
    let tap = null, flick = { yaw: 0, pitch: 0, t: 0 };
    on(dom, 'pointerdown', e => {
      if (!this.enabled) return;
      this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); dom.setPointerCapture?.(e.pointerId); this.goal = null; this.spin = null;
      tap = this.ptrs.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
      flick = { yaw: 0, pitch: 0, t: performance.now() };
      if (this.ptrs.size === 2) { const [a, b] = [...this.ptrs.values()]; this.pinch = Math.hypot(a.x - b.x, a.y - b.y); }
      dom.style.cursor = 'grabbing'; this.onStart?.();
    });
    on(dom, 'pointermove', e => {
      const p = this.ptrs.get(e.pointerId); if (!this.enabled || !p) return;
      if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 10) tap = null;
      if (this.ptrs.size === 1) {
        const s = e.pointerType === 'touch' ? 1.15 * THREE.MathUtils.degToRad(this.camera.fov) / Math.max(200, dom.clientHeight) : 0.0042 * this.camera.fov / 60;
        const dy = (e.clientX - p.x) * s, dp = (e.clientY - p.y) * s;
        this.tYaw += dy; this.tPitch = THREE.MathUtils.clamp(this.tPitch + dp, -1.2, 1.2);
        // velocidad del dedo (rad/s), suavizada, para el envión al soltar
        const now = performance.now(), dt = Math.max(1, now - flick.t) / 1000, a = Math.min(1, dt * 20);
        flick = { yaw: flick.yaw + (dy / dt - flick.yaw) * a, pitch: flick.pitch + (dp / dt - flick.pitch) * a, t: now };
      }
      p.x = e.clientX; p.y = e.clientY;
      if (this.ptrs.size === 2) {   // pellizco: abrir los dedos acerca (cierra el campo de visión), cerrarlos aleja
        const [a, b] = [...this.ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pinch > 0 && d > 0) this.onZoom?.(this.pinch / d); this.pinch = d;
      }
    });
    const up = e => {
      const one = this.ptrs.size === 1;
      if (!this.ptrs.delete(e.pointerId)) return;
      dom.style.cursor = this.enabled ? 'grab' : '';
      if (e.pointerType !== 'touch' || !one) return;
      if (tap && performance.now() - tap.t < 350) pick(e.clientX, e.clientY);
      // envión: solo si el dedo seguía moviéndose al levantarlo
      else if (e.type === 'pointerup' && performance.now() - flick.t < 60 && Math.hypot(flick.yaw, flick.pitch) > 0.4) this.spin = { yaw: flick.yaw, pitch: flick.pitch };
      tap = null;
    };
    on(dom, 'pointerup', up); on(dom, 'pointercancel', up);
    on(dom, 'wheel', e => { if (!this.enabled) return; e.preventDefault(); this.onZoom?.(Math.exp(THREE.MathUtils.clamp(e.deltaY, -120, 120) * 0.0015)); this.onStart?.(); }, { passive: false });
    on(dom, 'dblclick', e => { if (this.enabled) pick(e.clientX, e.clientY); });
    const keyOf = e => ({ KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' }[e.code]);
    on(window, 'keydown', e => { const k = keyOf(e); if (!this.enabled || !k || /INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return; e.preventDefault(); this.keys.add(k); this.goal = null; this.onStart?.(); });
    on(window, 'keyup', e => { const k = keyOf(e); if (k) this.keys.delete(k); });
    on(window, 'blur', () => this.keys.clear());
    this.dispose = () => L.forEach(f => f());
  }
  setEnabled(v) {
    this.enabled = v; this.dom.style.cursor = v ? 'grab' : '';
    if (v) { this.sync(); const p = this.camera.position; this.eye = this.floorAt ? p.y - this.floorAt(p.x, p.z, p.y - 1.5) : null; }
    else { this.vel.set(0, 0); this.goal = null; this.spin = null; this.keys.clear(); }
  }
  // toma la orientación actual de la cámara (después de un vuelo o de setPose)
  sync() {
    const d = new THREE.Vector3(); this.camera.getWorldDirection(d);
    this.yaw = this.tYaw = Math.atan2(-d.x, -d.z); this.pitch = this.tPitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
  }
  fwd() { return new THREE.Vector2(-Math.sin(this.yaw), -Math.cos(this.yaw)); }
  clampVel(m) { const l = this.vel.length(); if (l > m) this.vel.multiplyScalar(m / l); }
  target(out, dist = 2) {
    return out.set(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch)).multiplyScalar(dist).add(this.camera.position);
  }
  update(dt) {
    if (!this.enabled) return;
    dt = Math.min(dt, 0.05);
    if (this.spin) {   // envión del dedo: sigue girando y frena en medio segundo (un envión rápido suma unos 20°)
      const S = this.spin, m = Math.min(1, 4 / Math.hypot(S.yaw, S.pitch)), d = Math.exp(-dt * 6);
      this.tYaw += S.yaw * m * dt; this.tPitch = THREE.MathUtils.clamp(this.tPitch + S.pitch * m * dt, -1.2, 1.2);
      S.yaw *= d; S.pitch *= d; if (Math.hypot(S.yaw, S.pitch) < 0.05) this.spin = null;
    }
    const k = 1 - Math.exp(-dt * 14);
    this.yaw += (this.tYaw - this.yaw) * k; this.pitch += (this.tPitch - this.pitch) * k;
    // el suavizado se acerca para siempre sin llegar: a menos de una milésima se clava, así la cámara queda quieta
    if (Math.abs(this.tYaw - this.yaw) < 1e-3) this.yaw = this.tYaw;
    if (Math.abs(this.tPitch - this.pitch) < 1e-3) this.pitch = this.tPitch;
    const f = this.fwd(), rgt = new THREE.Vector2(-f.y, f.x);
    const fk = (this.keys.has('f') ? 1 : 0) - (this.keys.has('b') ? 1 : 0), sk = (this.keys.has('r') ? 1 : 0) - (this.keys.has('l') ? 1 : 0);
    if (fk || sk) { this.vel.x += (f.x * fk + rgt.x * sk) * 7 * dt; this.vel.y += (f.y * fk + rgt.y * sk) * 7 * dt; this.clampVel(1.5); }
    else if (this.goal) {   // camino hasta el punto elegido, frenando al llegar
      const p = this.camera.position, dx = this.goal.x - p.x, dz = this.goal.y - p.z, d = Math.hypot(dx, dz);
      if (d < 0.06) this.goal = null;
      else { const sp = Math.min(1.6, d * 2.2); this.vel.lerp(new THREE.Vector2(dx / d * sp, dz / d * sp), 1 - Math.exp(-dt * 8)); }
    } else this.vel.multiplyScalar(Math.exp(-dt * 6));
    if (this.vel.lengthSq() < 1e-6) { this.vel.set(0, 0); }
    else this.move(this.vel.x * dt, this.vel.y * dt);
    // escaleras y pisos de arriba (T-13): los ojos siguen el piso que hay debajo ("floorAt": el más alto al que se llega
    // con un paso de 45 cm), suavizado para que subir un peldaño no sea un salto
    if (this.floorAt && this.eye != null) {
      const p = this.camera.position, ty = this.floorAt(p.x, p.z, p.y - this.eye) + this.eye;
      if (Math.abs(ty - p.y) > 1e-4) p.y += (ty - p.y) * Math.min(1, dt * 12); else p.y = ty;
    }
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
  // paso con choque: el círculo del cuerpo se desliza sobre las cajas que cruzan la altura del cuerpo
  move(dx, dz) {
    const p = this.camera.position, R = 0.22, lo = p.y - 1.45, hi = p.y - 0.25;
    let x = p.x + dx, z = p.z + dz;
    for (let it = 0; it < 3; it++) for (const b of this.obstacles) {
      if (b.max.y < lo || b.min.y > hi) continue;
      if (p.x > b.min.x - 0.05 && p.x < b.max.x + 0.05 && p.z > b.min.z - 0.05 && p.z < b.max.z + 0.05) continue;   // si ya se está adentro, se puede salir
      const cx = Math.max(b.min.x, Math.min(x, b.max.x)), cz = Math.max(b.min.z, Math.min(z, b.max.z)), ex = x - cx, ez = z - cz, d = Math.hypot(ex, ez);
      if (d >= R) continue;
      if (d > 1e-6) { x = cx + ex / d * R; z = cz + ez / d * R; }
    }
    const B = this.bounds;
    p.x = Math.max(B.x0 + R, Math.min(B.x1 - R, x)); p.z = Math.max(B.z0 + R, Math.min(B.z1 - R, z));
  }
}

// Mapa de identificación (T-21): cada malla recibe un atributo "oid" con el id de su objeto (mueble, piso de un
// ambiente, pared, abertura, techo, exterior; lo marca "userData.oinfo" del grupo) y de su material, así un mueble con
// tapizado y patas da dos ids. Devuelve la tabla id → { kind, type, at, room, wall, …, color, glass }.
function assignIds(scene) {
  const table = [null], byKey = new Map(), geoId = new Map();
  const walk = (o, info, part) => {
    info = o.userData.oinfo ?? info; part = o.userData.part ?? part;   // "part": una parte con nombre (la reja de una ventana)
    if (o.isMesh && info && o.geometry?.attributes?.position) {
      const m = [o.material].flat()[0], glass = !!m?.userData?.glass;
      const key = JSON.stringify(info) + '|' + (m?.uuid ?? '') + '|' + (part ?? '');
      let id = byKey.get(key);
      if (!id) {
        id = table.length; byKey.set(key, id);
        table.push({ id, ...info, ...(part ? { part } : {}), color: m?.userData?.srcColor ?? (m?.color ? '#' + m.color.getHexString() : null), material: m?.type, glass,
          metal: (m?.metalness ?? 0) >= 0.5, glow: !!m?.userData?.night, printed: !m?.color || (m.map && !m.userData?.srcColor) });
      }
      // una geometría compartida por objetos distintos se copia para que cada uno lleve su id
      if (geoId.has(o.geometry) && geoId.get(o.geometry) !== id) o.geometry = o.geometry.clone();
      geoId.set(o.geometry, id);
      o.geometry.setAttribute('oid', new THREE.BufferAttribute(new Float32Array(o.geometry.attributes.position.count).fill(id), 1));
    }
    for (const c of o.children) walk(c, info, part);
  };
  walk(scene, null, null);
  return table;
}
// carga las imágenes de textura que pide el scene (pisos y componentes); las que faltan se ignoran (queda la procedural)
async function loadImages(levels, base) {
  const srcs = new Set();
  for (const L of levels) {
    for (const r of L.rooms ?? []) if (r.floor?.texture) srcs.add(r.floor.texture);
    for (const it of L.items ?? []) { if (it.params?.texture) srcs.add(it.params.texture); for (const t of Object.values(it.params?.textures ?? {})) srcs.add(t.src ?? t); }
  }
  const out = new Map(), loader = new THREE.TextureLoader();
  if (!base) return out;
  await Promise.all([...srcs].map(async s => {
    const t = await loader.loadAsync(base + s).catch(() => null);
    if (!t) return;
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; out.set(s, t);
  }));
  return out;
}

// material plano que pinta el id en RGB (sin luz, sin tono): se lee con readPixels; con "depth", la distancia a la
// cámara en milímetros
function idMaterial(depth = false) {
  if (depth) return new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vW; void main() { vec4 p = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
        #endif
        vec4 w = modelMatrix * p; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `varying vec3 vW; void main() { float d = min(16777215.0, floor(distance(vW, cameraPosition) * 1000.0));
        gl_FragColor = vec4(mod(d, 256.0), mod(floor(d / 256.0), 256.0), floor(d / 65536.0), 255.0) / 255.0; }`,
    toneMapped: false, side: THREE.DoubleSide,
  });
  return new THREE.ShaderMaterial({
    vertexShader: `attribute float oid; varying float vId;
      void main() { vId = oid; vec4 p = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * p; }`,
    fragmentShader: `varying float vId;
      void main() { float i = floor(vId + 0.5); gl_FragColor = vec4(mod(i, 256.0), mod(floor(i / 256.0), 256.0), floor(i / 65536.0), 255.0) / 255.0; }`,
    toneMapped: false, side: THREE.DoubleSide,
  });
}

// Une en una sola malla por material las piezas fijas de un grupo (paredes, muebles, aberturas): de más de mil
// objetos quedan unos cientos de dibujos por cuadro. Lo que se prende, se apaga o se oculta queda aparte ("keep").
function mergeStatic(root, keep) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map(), m = new THREE.Matrix4();
  const walk = o => {
    if (keep.has(o)) return;
    for (const c of [...o.children]) walk(c);
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o.userData.keep || !o.visible) return;
    const key = `${o.material.uuid}|${o.castShadow}|${o.receiveShadow}|${o.renderOrder}`;
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, list: [] });
    buckets.get(key).list.push(o);
  };
  walk(root);
  for (const b of buckets.values()) {
    if (b.list.length < 2) continue;
    const geos = b.list.map(o => {
      let g = o.geometry.clone();
      for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'oid'].includes(a)) g.deleteAttribute(a);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.attributes.oid) g.setAttribute('oid', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count), 1));
      if (!g.index) g.setIndex([...Array(g.attributes.position.count).keys()]);
      g.morphAttributes = {}; g.clearGroups();
      m.multiplyMatrices(inv, o.matrixWorld); g.applyMatrix4(m);
      if (m.determinant() < 0) { const ix = g.index; for (let i = 0; i < ix.count; i += 3) { const t = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, t); } }
      return g;
    });
    const merged = mergeGeometries(geos, false);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, b.mat); mesh.castShadow = b.cast; mesh.receiveShadow = b.recv;
    root.add(mesh);
    for (const o of b.list) o.parent.remove(o);
    geos.forEach(g => g.dispose());
  }
}

// Control de distribución: muebles que se superponen entre sí o se meten en una pared.
// Usa las cajas envolventes reales; ignora lo que se apoya encima de otra cosa (menos de 2 cm de cruce en altura)
// y los pares que van encastrados a propósito ("nests" en la ficha de cada componente, META en components.js).
function checkLayout(placed, wallGroups) {
  const out = [], tol = 0.02, boxes = placed.map(({ it, g }) => ({ it, b: new THREE.Box3().setFromObject(g, true) }));   // cajas precisas: con piezas inclinadas las aproximadas se agrandan
  const cross = (a, b) => ['x', 'y', 'z'].map(k => Math.min(a.max[k], b.max[k]) - Math.max(a.min[k], b.min[k]));
  const name = it => `${it.type} en [${it.at.join(', ')}]`;
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const A = boxes[i], B = boxes[j];
    if (nests(A.it.type, B.it.type)) continue;
    const [cx, cy, cz] = cross(A.b, B.b);
    if (cx > tol && cy > tol && cz > tol) out.push(`· se superponen ${name(A.it)} y ${name(B.it)} (${(Math.min(cx, cz) * 100).toFixed(0)} cm)`);
  }
  const walls = wallGroups.flatMap(wg => { wg.updateMatrixWorld(true); return wg.children.map(m => new THREE.Box3().setFromObject(m)); });
  for (const A of boxes) {
    if (nests(A.it.type, '*')) continue;
    for (const w of walls) {
      const [cx, cy, cz] = cross(A.b, w);
      if (cx > tol && cy > tol && cz > tol) { out.push(`· ${name(A.it)} se mete ${(Math.min(cx, cz) * 100).toFixed(0)} cm en una pared`); break; }
    }
  }
  return out;
}

// Luz acogedora por defecto (T-28): los valores que el usuario aprobó en San Nicolás pasan a ser los de todos los
// departamentos. De día, calidez 0,58 (un atardecer suave: con 0,6 o más y poco relleno las paredes en sombra se ven
// beige) y relleno 0,82; de noche, relleno cálido 0,5 y exposición 1,35 (noche dorada con el techo legible).
// Cada departamento puede cambiarlos en "lighting" (warmth, ambient, nightAmbient, nightExposure).
const WARMTH = 0.58, AMBIENT = 0.82, NIGHT_AMBIENT = 0.5, NIGHT_EXPOSURE = 1.35;

// "device": 'auto' (el visor), 'desktop' o 'mobile'. Las herramientas (verificar, comparar, exportar) piden
// 'desktop': con el panel del navegador oculto la ventana mide 0 de ancho y el motor se creía en un celular
// "base": la carpeta del scene.json (con / al final), para los archivos que lo acompañan (imágenes de textura)
// "wideViews": true (el visor) hace que las vistas de adentro arranquen con el zoom más abierto que permite la rueda o el
// pellizco (FOV_MAX), para que se vea lo más posible; las herramientas lo dejan apagado: ahí cada vista tiene el fov de su
// foto. "mobileAO": false vuelve al celular sin oclusión ambiental, dibujando directo (para comparar en motor/pruebas/movil-pc.html)
export async function start(container, { scene: spec, state, preset = 'premium', device = 'auto', base = null, mobileAO = true, wideViews = false, refine = true, gi = true }) {
  const mobile = device === 'auto' ? matchMedia('(pointer: coarse)').matches || innerWidth < 500 : device === 'mobile';
  const direct = mobile && !mobileAO;
  // el antialiasing lo hace el posproceso (SMAA en escritorio, muestreo múltiple en celular); dibujando directo, el lienzo
  const renderer = new THREE.WebGLRenderer({ antialias: direct, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  // PCF suave: borde de sombra liso. El PCF común con "radius" grande dejaba la penumbra en escalones cuadrados
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 900);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 0.2; controls.maxDistance = 40; controls.maxPolarAngle = Math.PI * 0.49;

  const M = makeMaterials(preset);
  const H = spec.height ?? 2.6;
  // Planta baja = el propio scene.json; "levels" agrega pisos de arriba (dúplex, altillo). Cada nivel tiene sus "rooms",
  // "walls", "items", "structure", su altura "y" del piso y "height"; "voids" son huecos de escalera en la losa de abajo
  // y "roof" un techo a dos aguas que recorta las paredes de ese nivel.
  // ambientes en L o en U: "rects" (varios rectángulos con el mismo nombre) se reparte en un ambiente por rectángulo,
  // que es como el motor y el validador ya trataban dos rectángulos con el mismo nombre
  const expand = rooms => rooms?.flatMap(r => (r.rects ? r.rects.map(rect => ({ ...r, rect, rects: undefined })) : [r]));
  const levels = [spec, ...(spec.levels ?? [])].map(L => (L.rooms?.some(r => r.rects) ? { ...L, rooms: expand(L.rooms) } : L));
  const ext = extentsOf(levels.flatMap(l => l.walls));
  const ext0 = extentsOf(spec.walls);
  const ceilingParts = [], decor = [], windows = [], skyLights = [], floors = [], placed = [], wallGroups = [], buildFns = [], doors = [];
  const looseWarn = [], looseSeen = new Map();   // piezas sueltas por componente (T-26), una vez por tipo y parámetros
  const levelInfo = [];   // por nivel: su grupo y lo que se saca en la vista sin techo
  const capMat = M.lacquer('#4a505a');
  renderer.localClippingEnabled = true;
  // qué es cada cosa, para el mapa de identificación (T-21): se marca el grupo o la malla y lo heredan sus piezas
  const tagO = (o, info) => { o.userData.oinfo = info; return o; };
  // texturas de imagen (T-23): pisos con "texture" y componentes con "params.texture", relativas a la carpeta del scene
  const images = await loadImages([spec, ...(spec.levels ?? [])], base), imageMats = new Map();
  // el material del componente con la imagen como textura (el color sigue tiñendo); sin relieve ni brillo procedural:
  // juntas y vetas ya vienen en la foto
  const imageMat = (m, src, { print = false, scale = 1 } = {}) => {
    const k = m.uuid + '|' + src + '|' + print + scale;
    if (!imageMats.has(k)) {
      const c = m.clone(); c.map = images.get(src); c.bumpMap = null; c.roughnessMap = null;
      if (scale !== 1) { c.map = c.map.clone(); c.map.repeat.setScalar(scale); c.map.needsUpdate = true; }
      if (print) { c.color.set('#ffffff'); if (c.sheenColor) c.sheenColor.set('#ffffff').multiplyScalar(0.5); }   // el estampado trae sus colores
      c.userData = { ...m.userData, image: src }; c.needsUpdate = true; imageMats.set(k, c);
    }
    return imageMats.get(k);
  };

  levels.forEach((Lv, li) => {
    const y0 = li ? (Lv.y ?? H + 0.25) : 0, Hl = Lv.height ?? (li ? 2.5 : H), rooms = Lv.rooms ?? [];
    const wallColor = Lv.wallColor ?? spec.wallColor ?? rooms[0]?.walls ?? '#f2f0eb';
    const root = new THREE.Group(); root.position.y = y0; scene.add(root);
    const info = { root, ceiling: [], top: y0 + Hl }; levelInfo.push(info);
    const roomAt = (x, z) => rooms.find(r => x > r.rect.x[0] && x < r.rect.x[1] && z > r.rect.z[0] && z < r.rect.z[1]);
    const floorOf = r => {
      const f = r?.floor ?? {}, kind = f.kind ?? 'tile', mat = M.floor(f.color ?? '#cbc7c1', kind, li ? 0 : (f.gloss ?? 0));
      // "texture": imagen del piso tomada de las fotos (T-23), que se repite cada "textureSize" metros
      if (f.texture && images.has(f.texture)) return { mat: imageMat(mat, f.texture), size: f.textureSize ?? 1.2 };
      // espiga: "tile" es el ancho de la tablita (largo = 5 anchos); la textura repite cada 5·√2 anchos
      const size = kind === 'planks' ? (f.size ?? 1.2) : kind === 'herringbone' ? 5 * Math.SQRT2 * (f.tile ?? 0.07)
        : kind === 'terrazzo' ? (f.size ?? 0.9) : 2 * (f.tile ?? 0.6);
      return { mat, size };
    };

    /* ---------- pisos; losa con los huecos del nivel de arriba; cielorraso o techo inclinado ---------- */
    for (const r of rooms) { const f = floorOf(r); floors.push(tagO(floorPlane(root, f.mat, r.rect.x, r.rect.z, f.size), { kind: 'floor', room: r.name, level: li })); }
    const e = extentsOf(Lv.walls);
    if (!li) tagO(blk(root, M.paint('#d9d5cd'), [e.x0, e.x1], [-0.2, -0.002], [e.z0, e.z1]), { kind: 'slab', level: li });
    const up = levels[li + 1], top = up ? (up.y ?? H + 0.25) - y0 - 0.003 : Hl + 0.12;
    const ceilMat = M.paint(Lv.ceiling ?? rooms[0]?.ceiling ?? '#f7f6f3');
    if (!Lv.roof) for (const [xs, zs] of subtractRects([e.x0, e.x1], [e.z0, e.z1], up?.voids ?? [])) {
      const m = tagO(blk(root, ceilMat, xs, [Hl, top], zs), { kind: 'ceiling', level: li });
      info.ceiling.push(m);
    }
    let clip = null;
    if (Lv.roof) { const roof = gableRoof(Lv.roof, { M, y0, ceilMat }); root.add(tagO(roof.group, { kind: 'ceiling', level: li })); info.ceiling.push(roof.group); clip = roof.clip; skyLights.push(...roof.skylights); }

    /* ---------- paredes, siempre a altura completa; sin techo se ve su canto oscuro arriba ---------- */
    const wallGroup = new THREE.Group(), wallCaps = new THREE.Group(); root.add(wallGroup, wallCaps);
    info.caps = wallCaps; wallGroups.push(wallGroup);
    let wallMat = M.paint(wallColor);
    if (clip) { wallMat = wallMat.clone(); wallMat.clippingPlanes = clip; wallMat.clipShadows = true; }   // paredes del altillo cortadas por el techo
    buildFns.push(() => {
      for (const [wi, w] of Lv.walls.entries()) {
        const L = wallLine(w);
        const seg = (s0, s1, a, b) => {
          if (b - a < 0.005 || s1 - s0 < 0.005) return;
          const across = [L.c - L.t / 2, L.c + L.t / 2];
          const xs = L.alongX ? [s0, s1] : across, zs = L.alongX ? across : [s0, s1];
          tagO(blk(wallGroup, wallMat, xs, [a, b], zs), { kind: 'wall', level: li, wall: wi });
          if (b === Hl && !clip) blk(wallCaps, capMat, xs, [Hl, Hl + 0.006], zs);   // se muestra solo sin techo (con techo quedaría adentro de la losa)
        };
        const ops = (w.openings ?? []).map(o => { const s = L.start(o); return [s, s + o.width, o.sill ?? 0, (o.sill ?? 0) + o.height]; })
          .sort((p, q) => p[0] - q[0]);
        // en las esquinas, la pared en Z se corta contra la pared en X para que no compartan volumen ni caras
        let a0 = L.a0, a1 = L.a1;
        if (!L.alongX) for (const o of Lv.walls) {
          const X = wallLine(o);
          if (!X.alongX || L.c < X.a0 - 1e-6 || L.c > X.a1 + 1e-6) continue;
          const lo = X.c - X.t / 2, hi = X.c + X.t / 2;
          if (a0 >= lo - 1e-6 && a0 < hi) a0 = hi;
          if (a1 <= hi + 1e-6 && a1 > lo) a1 = lo;
        }
        let cur = a0;
        for (const o of ops) { seg(cur, o[0], 0, Hl); seg(o[0], o[1], 0, o[2]); seg(o[0], o[1], o[3], Hl); cur = o[1]; }
        seg(cur, a1, 0, Hl);
      }
    });

    /* ---------- aberturas: X local a lo largo de la pared, Z local hacia el ambiente ---------- */
    for (const [wi, w] of Lv.walls.entries()) for (const [oi, o] of (w.openings ?? []).entries()) {
      const make = OPENINGS[o.kind];
      if (!make) { console.warn('Abertura desconocida:', o.kind); continue; }
      const L = wallLine(w), s0 = L.start(o), s1 = s0 + o.width, mid = (s0 + s1) / 2, off = L.t / 2 + 0.3;
      const probe = sg => (L.alongX ? roomAt(mid, L.c + sg * off) : roomAt(L.c + sg * off, mid));
      // "side" (1 o -1) fuerza hacia qué lado de la pared abre la puerta; si no, abre hacia +normal cuando ahí hay un ambiente
      const nSign = o.side ?? (probe(1) ? 1 : -1);
      const rh = L.alongX ? nSign === 1 : nSign === -1;      // si no, se invierte el eje para no reflejar la geometría
      const ax = L.alongX ? [rh ? 1 : -1, 0] : [0, rh ? 1 : -1];
      const g = tagO(new THREE.Group(), { kind: o.kind, level: li, wall: wi, opening: oi }), a = rh ? s0 : s1;
      g.rotation.y = Math.atan2(-ax[1], ax[0]);
      g.position.set(L.alongX ? a : L.c, 0, L.alongX ? L.c : a);
      const hinge = rh ? o.hinge : (o.hinge === 'end' ? 'start' : 'end');
      const inner = make({ ...o, hinge }, { len: o.width, h: o.height, t: L.t, H: Hl, M, wallColor });
      inner.position.y = o.sill ?? 0; g.add(inner); root.add(g);
      // para las validaciones: hacia qué ambientes da y si es la de entrada (del otro lado no hay ambiente)
      if (o.kind === 'door') doors.push({ inner, o, li, hinge, len: o.width, t: L.t, room: probe(nSign)?.name, other: probe(-nSign)?.name ?? 'afuera', outside: !probe(-nSign) });
      if (o.kind === 'sliding-window') windows.push({ g, len: o.width, h: o.height, sill: o.sill ?? 0, t: L.t, li, wi, oi });
      else if ((o.sill ?? 0) < 0.01) {   // umbral: el piso del ambiente continúa por debajo del vano
        const f = floorOf(probe(nSign) ?? probe(-nSign)), across = [L.c - L.t / 2, L.c + L.t / 2];
        floors.push(tagO(floorPlane(root, f.mat, L.alongX ? [s0, s1] : across, L.alongX ? across : [s0, s1], f.size), { kind: 'floor', room: (probe(nSign) ?? probe(-nSign))?.name, level: li }));
      }
    }

    /* ---------- estructura a la vista: vigas y pilares del color de las paredes ---------- */
    // "structure": [{ "kind": "beam" | "column", "x": [x0, x1], "z": [z0, z1], "y": [y0, y1] }]. Una viga va por defecto
    // de "y0" al techo; un pilar, del piso al techo (o hasta la viga, para no compartir caras con ella).
    const structure = new THREE.Group(); root.add(structure); wallGroups.push(structure);
    // "color" les da otro color que el de las paredes; "finish": "concrete", hormigón a la vista (textura de 1,2 m)
    for (const s of Lv.structure ?? []) {
      const y = s.y ?? (s.kind === 'beam' ? [Hl - 0.35, Hl] : [0, Hl]);
      const mat = s.finish === 'concrete' ? M.concrete(s.color ?? '#9b9994') : s.color ? M.paint(s.color) : wallMat;
      tagO(blk(structure, mat, s.x, y, s.z, 0, s.finish === 'concrete' ? 1.2 : 0.5), { kind: 'structure', level: li });
      if (y[1] >= Hl - 1e-6) blk(wallCaps, capMat, s.x, [Hl, Hl + 0.006], s.z);
    }

    /* ---------- zócalos: siguen cada borde de ambiente apoyado en una pared, salvo vanos a ras del piso ---------- */
    const skirt = M.lacquer(Lv.baseboard ?? spec.baseboard ?? '#ece9e3');
    for (const r of rooms) {
      const [x0, x1] = r.rect.x, [z0, z1] = r.rect.z;
      const edges = [
        { alongX: true, c: z0, n: 1, a: [x0, x1] }, { alongX: true, c: z1, n: -1, a: [x0, x1] },
        { alongX: false, c: x0, n: 1, a: [z0, z1] }, { alongX: false, c: x1, n: -1, a: [z0, z1] },
      ];
      for (const ed of edges) for (const w of Lv.walls) {
        const L = wallLine(w);
        if (L.alongX !== ed.alongX || Math.abs(L.c + ed.n * L.t / 2 - ed.c) > 0.02) continue;
        const lo = Math.max(ed.a[0], L.a0), hi = Math.min(ed.a[1], L.a1);
        if (hi - lo < 0.05) continue;
        const cuts = (w.openings ?? []).filter(o => (o.sill ?? 0) < 0.05).map(o => { const s = L.start(o); return [s, s + o.width]; }).sort((p, q) => p[0] - q[0]);
        const pieces = []; let cur = lo;
        for (const [s, f] of cuts) { if (f <= cur || s >= hi) continue; if (s > cur) pieces.push([cur, s]); cur = Math.max(cur, f); }
        if (hi > cur) pieces.push([cur, hi]);
        const cs = [ed.c, ed.c + ed.n * 0.012].sort((p, q) => p - q);
        for (const [p0, p1] of pieces) tagO(L.alongX ? blk(root, skirt, [p0, p1], [0, 0.07], cs, 0.002) : blk(root, skirt, cs, [0, 0.07], [p0, p1], 0.002), { kind: 'baseboard', level: li });
      }
    }

    /* ---------- muebles y objetos ---------- */
    for (const [ii, it] of (Lv.items ?? []).entries()) {
      const make = COMPONENTS[it.type];
      if (!make) { console.warn('Componente desconocido:', it.type); continue; }
      const g = make(it.params ?? {}, { M, H: Hl });
      g.traverse(o => { if (o.isMesh && o.userData.imageTex && images.has(o.userData.imageTex)) o.material = imageMat(o.material, o.userData.imageTex); });
      // "textures": { "<color>": "tex/<archivo>.jpg" | { "src", "scale" } } en cualquier mueble: la pieza de ese color
      // lleva la imagen con sus propios colores (estampados de telas tomados de las fotos, T-24), sobre las coordenadas de
      // textura del componente; "scale" agranda (< 1) o achica (> 1) el dibujo
      const tx = it.params?.textures;
      if (tx) g.traverse(o => {
        const e = o.isMesh && tx[[o.material].flat()[0]?.userData?.srcColor], src = typeof e === 'string' ? e : e?.src;
        if (src && images.has(src)) o.material = imageMat(o.material, src, { print: true, scale: e.scale ?? 1 });
      });
      const lk = `${it.type}|${JSON.stringify(it.params ?? {})}|${Hl - (it.y ?? 0)}`;
      if (!looseSeen.has(lk)) looseSeen.set(lk, loosePieces(g, META[it.type], Hl - (it.y ?? 0)));
      if (looseSeen.get(lk).length) looseWarn.push(looseText(`${it.type} en [${it.at.join(', ')}]`, looseSeen.get(lk)));
      tagO(g, { kind: 'item', type: it.type, at: it.at, level: li, item: ii });
      g.position.set(it.at[0], it.y ?? 0, it.at[1]);
      g.rotation.y = THREE.MathUtils.degToRad(it.rotation ?? 0);
      root.add(g);
      placed.push({ it, g, li });
      if (META[it.type]?.mount === 'ceiling') info.ceiling.push(g);   // lámparas colgadas del techo
      if (it.decor) decor.push(g);
    }
  });
  // "facing": hacia dónde mira la fachada con los ventanales y el balcón ('-z' por defecto, '+x', '+z' o '-x'). El
  // entorno (balcones, edificio, calle o paisaje) se arma mirando a -Z con los balcones pasados a ese marco y después se
  // gira alrededor del centro del departamento
  const facing = { '-z': 0, '+x': -Math.PI / 2, '+z': Math.PI, '-x': Math.PI / 2 }[spec.exterior?.facing ?? '-z'] ?? 0;
  const cx0 = (ext0.x0 + ext0.x1) / 2, cz0 = (ext0.z0 + ext0.z1) / 2;
  const toLocal = ([x0, x1], [z0, z1]) => {   // rectángulo del mundo al marco del entorno (giro de -facing)
    const c = Math.round(Math.cos(-facing)), s = Math.round(Math.sin(-facing)), pts = [[x0, z0], [x1, z1]].map(([x, z]) => [cx0 + (x - cx0) * c + (z - cz0) * s, cz0 - (x - cx0) * s + (z - cz0) * c]);
    return { x: [Math.min(pts[0][0], pts[1][0]), Math.max(pts[0][0], pts[1][0])], z: [Math.min(pts[0][1], pts[1][1]), Math.max(pts[0][1], pts[1][1])] };
  };
  const exSpec = facing ? { ...spec.exterior, balcony: [spec.exterior?.balcony ?? []].flat().map(b => ({ ...b, ...toLocal(b.x, b.z) })) } : (spec.exterior ?? {});
  const e0 = toLocal([ext0.x0, ext0.x1], [ext0.z0, ext0.z1]), extL = facing ? { x0: e0.x[0], x1: e0.x[1], z0: e0.z[0], z1: e0.z[1] } : ext0;
  let outside = exterior(exSpec, { M, ext: extL, H });
  if (facing) {
    const pivot = new THREE.Group(); pivot.position.set(cx0, 0, cz0); pivot.rotation.y = facing; outside.position.set(-cx0, 0, -cz0); pivot.add(outside);
    pivot.userData = outside.userData; outside = pivot;
  }
  tagO(outside, { kind: 'exterior' });
  const sky = outside.userData.sky;
  scene.add(outside);
  levelInfo[0].ceiling.push(...outside.userData.ceiling);
  ceilingParts.push(...levelInfo.flatMap(l => l.ceiling));
  buildFns.forEach(f => f());
  scene.updateMatrixWorld(true);
  const warnings = [...checkSpec(spec, { COMPONENTS, OPENINGS }), ...checkLayout(placed, wallGroups), ...looseWarn];

  /* ---------- luz: entorno, sol con sombra, luz de ventana y lámparas de noche ---------- */
  RectAreaLightUniformsLib.init();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  // De día, luz de atardecer suave: "warmth" (0 = neutra y blanca, 1 = atardecer pleno) calienta sobre todo el sol, la
  // luz de las ventanas y el horizonte; el relleno (cielo y rebote del piso) apenas, para que las paredes en sombra
  // sigan blancas. De noche, las lámparas cálidas más un relleno tenue del mismo tono para que se lea todo.
  const lit = spec.lighting ?? {};
  const warm = THREE.MathUtils.clamp(lit.warmth ?? WARMTH, 0, 1);
  const tint = (base, sunset, k = 1) => new THREE.Color(base).lerp(new THREE.Color(sunset), warm * k);
  const DAY = { sun: lit.sunIntensity ?? 4.5, hemi: lit.ambient ?? AMBIENT, env: lit.environment ?? 0.4, rect: lit.windowLight ?? 1.5, exposure: lit.exposure ?? 0.95,
    sky: tint(lit.sky ?? '#eef3fb', '#ffd2a3', 0.45), ground: tint(lit.ground ?? '#d9d6d0', '#d6ae86', 0.45),
    win: tint('#eef4ff', '#ffc98f'), fog: tint('#d3e2f0', '#efc9a4'), sunColor: tint(lit.sunColor ?? '#fff0dc', '#ff9440') };
  // "lamps": cuánto rinden las lámparas de noche sobre la intensidad de cada componente. 0,8 por defecto: al 100 % el
  // living del depto 1 se veía encandilado alrededor de las lámparas (pedido del usuario, 2026-11-03)
  const LAMPS = lit.lamps ?? 0.8;
  // De noche las lámparas de techo apuntan hacia abajo: techos y alacenas quedaban casi negros. El relleno imita el
  // rebote cálido de la luz en el piso y los muebles: viene sobre todo desde abajo ("ground") y llega a lo que mira
  // hacia abajo o de costado
  const NIGHT = { hemi: lit.nightAmbient ?? NIGHT_AMBIENT, env: 0.05, rect: 0.35, exposure: lit.nightExposure ?? NIGHT_EXPOSURE,
    sky: new THREE.Color('#ffe2c4'), ground: new THREE.Color('#d2ab85'), win: new THREE.Color('#5d76b5'), fog: new THREE.Color('#141c33') };
  const hemi = new THREE.HemisphereLight(DAY.sky, DAY.ground, DAY.hemi); scene.add(hemi);
  const center = new THREE.Vector3((ext.x0 + ext.x1) / 2, 0, (ext.z0 + ext.z1) / 2);
  const sun = new THREE.DirectionalLight(DAY.sunColor, DAY.sun);
  sky.material.uniforms.uWarm.value = warm;
  sun.position.copy(center).add(new THREE.Vector3(...(lit.sunFrom ?? [9, 6, -11])));
  sun.target.position.copy(center); scene.add(sun, sun.target);
  sky.material.uniforms.uSun.value.subVectors(sun.position, center).normalize();
  scene.fog = new THREE.Fog(DAY.fog.clone(), ...(spec.exterior?.fog ?? [30, 190]));   // bruma de distancia: solo alcanza al entorno, no al interior
  // el encuadre de la sombra se ajusta al departamento; con un mapa grande el borde queda nítido cerca de los objetos
  // (patas, toallas) y el filtro suave lo alisa. Se recalcula solo cuando cambia algo, así que el tamaño casi no cuesta
  const reach = Math.hypot(ext.x1 - ext.x0, ext.z1 - ext.z0) / 2 + 0.6;
  sun.castShadow = true; sun.shadow.mapSize.setScalar(Math.min(mobile ? 2048 : 4096, renderer.capabilities.maxTextureSize));
  Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 40 });
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.05;
  // la escena es estática: las sombras se recalculan solo cuando cambia algo (noche, decoración, techo)
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  scene.updateMatrixWorld(true);
  // las claraboyas iluminan como una ventana más, hacia abajo. En celular cada ventana es un spot ancho desde el vano
  // en lugar de una luz de área: la de área cuesta por píxel lo que diez spots (en el depto 4, la mitad del cuadro) y
  // el spot, con la intensidad por la superficie del vano y 1,5 de ajuste, ilumina casi igual (capturas/t11/rect-vs-spot.jpg)
  const winLight = (w, h, pos, look) => {
    const l = mobile ? new THREE.SpotLight(DAY.win, 0, 0, 1.2, 1, 2) : new THREE.RectAreaLight(DAY.win, 0, w, h);
    l.position.copy(pos);
    if (mobile) { l.target.position.copy(look); scene.add(l.target); l.userData.k = w * h * 1.5; } else l.lookAt(look);
    scene.add(l); return l;
  };
  const rects = skyLights.map(s => winLight(s.w, s.h, s.g.localToWorld(s.c.clone()), s.g.localToWorld(s.c.clone().setY(-1))))
    .concat(windows.map(w => winLight(w.len * 0.9, w.h * 0.9,
      w.g.localToWorld(new THREE.Vector3(w.len / 2, w.sill + w.h / 2, w.t / 2 + 0.02)), w.g.localToWorld(new THREE.Vector3(w.len / 2, w.sill + w.h / 2, 3)))));
  const lamps = [], glowMats = new Set(), shiny = new Set(), areaLamps = [], glassMats = new Set();
  scene.traverse(o => {
    if (o.isLight && o.userData.night) (mobile && o.isRectAreaLight ? areaLamps : lamps).push(o);
    if (!o.isMesh) return;
    for (const m of [o.material].flat()) {
      if (m.userData?.night) glowMats.add(m);
      if (m.userData?.glass) { glassMats.add(m); m.userData.base = m.color.clone(); }
      if (m.metalness >= 0.5) shiny.add(m);
    }
  });
  // en celular las lámparas de área (tiras LED) también pasan a spot, como las ventanas
  for (const a of areaLamps) {
    const s = new THREE.SpotLight(a.color, 0, 0, 1.2, 1, 2);
    s.position.copy(a.position); s.target.position.set(0, 0, -1).applyQuaternion(a.quaternion).add(a.position);
    s.userData.night = a.userData.night * a.width * a.height * 1.5;
    a.parent.add(s, s.target); a.parent.remove(a); s.updateMatrixWorld(); lamps.push(s);
  }
  // Celular: las lámparas muy juntas (rieles, colgantes de varias luces, dos spots de un mismo plafón) se unen en una
  // sola luz con la suma de sus intensidades. Es fijo: elegir las lámparas cercanas al caminar hacía que se prendieran
  // y apagaran de a una y se notaba. Solo se unen las que se ocultan juntas (mismo nivel, techo y decoración)
  if (mobile) {
    const owner = l => { const k = []; for (let o = l.parent; o; o = o.parent) { if (decor.includes(o)) k.push('d'); if (ceilingParts.includes(o)) k.push('c'); const li = levelInfo.findIndex(L => L.root === o); if (li >= 0) k.push(li); } return k.join(); };
    const groups = [];
    for (const l of lamps) {
      const p = l.getWorldPosition(new THREE.Vector3()), key = `${l.type}|${owner(l)}`;
      const g = groups.find(g => g.key === key && g.list.every(m => m.p.distanceTo(p) < 1.0));
      if (g) g.list.push({ l, p }); else groups.push({ key, list: [{ l, p }] });
    }
    lamps.length = 0;
    for (const { list } of groups) {
      const [{ l: first }] = list;
      if (list.length === 1) { lamps.push(first); continue; }
      const c = list.reduce((s, m) => s.add(m.p), new THREE.Vector3()).divideScalar(list.length), spread = Math.max(...list.map(m => m.p.distanceTo(c)));
      const parent = first.parent, one = first.clone(); one.userData = { night: 0, day: 0 };
      // los spots apuntan hacia donde apuntaban en promedio (se mide antes de sacarlos de la escena)
      const d = first.isSpotLight ? list.reduce((s, m) => s.add(m.l.target.getWorldPosition(new THREE.Vector3()).sub(m.p).normalize()), new THREE.Vector3()).normalize() : null;
      for (const { l } of list) { one.userData.night += l.userData.night; one.userData.day += l.userData.day ?? 0; l.parent.remove(l); l.target?.parent?.remove(l.target); }
      if (!one.userData.day) delete one.userData.day;
      one.distance = first.distance ? first.distance + spread : 0;
      parent.add(one); one.position.copy(parent.worldToLocal(c.clone()));
      if (d) { one.target = new THREE.Object3D(); parent.add(one.target); one.target.position.copy(parent.worldToLocal(c.clone().add(d))); }
      lamps.push(one);
    }
  }
  // los metales y espejos reflejan el entorno con su propia intensidad: con la del ambiente (baja) se ven negros
  shiny.forEach(m => { m.envMap = envTex; m.userData.envBase = m.userData.envBoost ?? 0.55; });
  // Reflejos reales (2026-11-07): cada metal o espejo de adentro refleja su propio ambiente en lugar del estudio genérico.
  // Al cargar se le da a cada pieza metálica una copia del material por ambiente (antes de unir las piezas) y, en la
  // precarga, se fotografía cada ambiente desde su centro a 1,4 m, de día y de noche (ver "ready")
  const roomList = levels.flatMap((L, li) => (L.rooms ?? []).map(r => ({ r: r.rect, c: new THREE.Vector3((r.rect.x[0] + r.rect.x[1]) / 2, levelInfo[li].root.position.y + 1.4, (r.rect.z[0] + r.rect.z[1]) / 2), y0: levelInfo[li].root.position.y })));
  const roomOf = p => {
    let best = -1, bd = Infinity;
    roomList.forEach((R, i) => { const dx = Math.max(R.r.x[0] - p.x, 0, p.x - R.r.x[1]), dz = Math.max(R.r.z[0] - p.z, 0, p.z - R.r.z[1]), d = Math.hypot(dx, dz) + Math.abs(p.y - R.c.y) * 0.1; if (d < bd) { bd = d; best = i; } });
    return best;
  };
  const perRoom = new Map();
  levelInfo.forEach(L => L.root.traverse(o => {
    if (!o.isMesh || Array.isArray(o.material) || !shiny.has(o.material)) return;
    const ri = roomOf(new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3())), key = o.material.uuid + '|' + ri;
    if (!perRoom.has(key)) { const m = o.material.clone(); m.userData.room = ri; m.envMap = envTex; perRoom.set(key, m); }
    o.material = perRoom.get(key);
  }));
  perRoom.forEach(m => shiny.add(m));
  let roomEnvs = null;
  const refl = floorReflection(floors.filter(m => m.material.userData.gloss > 0), mobile);
  // luz rebotada horneada (motor/hornear.html → "lighting.bake"): sin ella, el visor sigue como siempre
  let GI = null;
  if (gi && lit.bake && base) {
    try { GI = bounceLight(scene, await (await fetch(new URL(lit.bake, new URL(base, location.href)))).json(), lit.bounce ?? BOUNCE); }
    catch (e) { console.warn('luz rebotada: no se pudo leer ' + lit.bake, e); }
  }

  /* ---------- posproceso: oclusión ambiental ---------- */
  // Celular (T-41, 2026-11-04): sin oclusión se veía lavado y plano al lado de la PC (rincones, uniones de pared y
  // techo y el pie de los muebles sin sombra suave; la diferencia media bajaba de 6,4 a 2,4 sacándosela a la PC). Va una
  // versión liviana y siempre prendida: usa la profundidad del cuadro (no vuelve a dibujar la escena para las
  // normales), 8 muestras en vez de 24 y el antialiasing es el muestreo múltiple del cuadro. A media resolución
  // dejaba bordes escalonados en los cantos; completa cuesta ~25 % más que dibujar directo (en la PC, 1080 × 1920:
  // 12,6 → 15,7 ms) y si el equipo no da abasto el visor baja la resolución al moverse (STEPS)
  let composer = null, rt = null, gtao = null;
  if (!direct) {
    rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, rt);
    // la profundidad del cuadro: la comparten los dos destinos del compositor (la escena se dibuja en el que toque)
    const depthTexture = mobile ? new THREE.DepthTexture(1, 1) : undefined;
    if (mobile) composer.renderTarget1.depthTexture = composer.renderTarget2.depthTexture = depthTexture;
    composer.addPass(new RenderPass(scene, camera));
    gtao = new GTAOPass(scene, camera, 1, 1);
    // sin textura de normales las reconstruye desde la profundidad; su destino de normales queda sin usar
    if (mobile) { gtao.setGBuffer(depthTexture); gtao.gtaoMaterial.needsUpdate = gtao.pdMaterial.needsUpdate = true; }
    gtao.blendIntensity = 0.85;
    gtao.updateGtaoMaterial({ radius: 0.3, distanceExponent: 1.4, thickness: 1, scale: 1.1, samples: mobile ? 8 : 24, distanceFallOff: 1 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: mobile ? 5 : 8, rings: mobile ? 2 : 3, samples: mobile ? 8 : 24 });
    // La pasada de normales de la oclusión dibuja todo con un material propio que ignora la transparencia: las piezas
    // recortadas por alphaTest (tarjetas de hojas de los árboles, barandas de barrotes, silueta lejana) contaban como
    // cuadrados enteros y dejaban manchas cuadradas oscuras (2026-11-07, el usuario las vio en las copas). Se ocultan
    // solo en esa pasada; en el cuadro se ven igual
    const hideCutouts = gtao.overrideVisibility.bind(gtao);
    let cutouts = null;
    gtao.overrideVisibility = () => {
      hideCutouts();
      cutouts ??= (() => { const l = []; scene.traverse(o => { if (o.isMesh && [o.material].flat().some(m => m.alphaTest > 0)) l.push(o); }); return l; })();
      for (const o of cutouts) o.visible = false;
    };
    composer.addPass(gtao);
    composer.addPass(new OutputPass());
    // la AO se calcula sin antialiasing; SMAA al final alisa los bordes que deja dentados
    if (!mobile) composer.addPass(new SMAAPass(1, 1));
  }
  // Pulido con la cámara quieta (2026-11-07): el visor dibuja solo cuando algo cambia, así que quieto le sobra tiempo.
  // Al detenerse suma REFINE cuadros más, cada uno con la cámara corrida una fracción de píxel (bordes sin dientes y el
  // ruido de la oclusión promediado) y el sol corrido apenas dentro de su disco (sombras con penumbra de verdad). El
  // promedio se ve al cabo de unos 0,3 s y se descarta apenas la cámara se mueve. Mientras se camina no cambia nada.
  const REFINE = !refine ? 0 : mobile ? 12 : 24, SUN_R = 0.012;   // SUN_R: radio del disco del sol (en radianes, ~0,7°)
  let acc = null, accN = 0;
  if (composer) {
    composer.renderToScreen = false;
    const vs = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    acc = {
      rts: [0, 1].map(() => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType })),
      blend: new THREE.ShaderMaterial({ uniforms: { tNew: { value: null }, tAcc: { value: null }, w: { value: 1 } }, vertexShader: vs, depthTest: false, depthWrite: false,
        fragmentShader: 'uniform sampler2D tNew, tAcc; uniform float w; varying vec2 vUv; void main() { gl_FragColor = mix(texture2D(tAcc, vUv), texture2D(tNew, vUv), w); }' }),
      copy: new THREE.ShaderMaterial({ uniforms: { t: { value: null } }, vertexShader: vs, depthTest: false, depthWrite: false,
        fragmentShader: 'uniform sampler2D t; varying vec2 vUv; void main() { gl_FragColor = texture2D(t, vUv); }' }),
      quad: new FullScreenQuad(),
    };
  }
  const halton = (i, b) => { let f = 1, r = 0; for (; i > 0; i = Math.floor(i / b)) { f /= b; r += f * (i % b); } return r; };
  const sunBase = new THREE.Vector3(), sunOff = new THREE.Vector3(), sunU = new THREE.Vector3(), sunV = new THREE.Vector3();
  let sunMoved = false;
  function placeSun(k) {   // k = número de cuadro del pulido; 0 = el sol en su lugar
    if (!sunMoved) sunBase.copy(sun.position);
    if (!k) { if (sunMoved) { sun.position.copy(sunBase); sunMoved = false; renderer.shadowMap.needsUpdate = true; } return; }
    const d = sunBase.clone().sub(sun.target.position), len = d.length();
    sunU.set(0, 1, 0).cross(d).normalize(); sunV.copy(d).cross(sunU).normalize();
    const a = halton(k, 2) * Math.PI * 2, rr = Math.sqrt(halton(k, 3)) * SUN_R * len;
    sunOff.copy(sunU).multiplyScalar(Math.cos(a) * rr).addScaledVector(sunV, Math.sin(a) * rr);
    sun.position.copy(sunBase).add(sunOff); sunMoved = true; renderer.shadowMap.needsUpdate = true;
  }
  function present(keep) {
    const src = composer.readBuffer, [a, b] = acc.rts;
    if (a.width !== src.width || a.height !== src.height) { acc.rts.forEach(t => t.setSize(src.width, src.height)); keep = false; }
    if (!keep) accN = 0;
    Object.assign(acc.blend.uniforms, { tNew: { value: src.texture }, tAcc: { value: a.texture }, w: { value: 1 / (accN + 1) } });
    renderer.setRenderTarget(b); acc.quad.material = acc.blend; acc.quad.render(renderer);
    acc.rts.reverse(); accN++;
    acc.copy.uniforms.t.value = acc.rts[0].texture; renderer.setRenderTarget(null); acc.quad.material = acc.copy; acc.quad.render(renderer);
  }
  // un cuadro normal (descarta el pulido) o, con refine, uno más del pulido
  const draw = (refine = false) => {
    if (!refine) placeSun(0);
    if (refine && acc) {
      placeSun(accN);
      const src = composer.readBuffer, jx = halton(accN + 1, 2) - 0.5, jy = halton(accN + 1, 3) - 0.5;
      camera.setViewOffset(src.width, src.height, jx, jy, src.width, src.height);
    }
    GI?.U.giViewInv.value.copy(camera.matrixWorld);
    refl?.render(renderer, scene, camera);
    if (composer) { composer.render(); present(refine); } else renderer.render(scene, camera);
    if (refine && acc) camera.clearViewOffset();
  };
  const refining = () => acc && accN < REFINE;

  /* ---------- piezas fijas unidas por material (menos dibujos por cuadro) ---------- */
  // lo que se oculta o se prende por separado queda aparte: techo y lámparas, decoración, cantos, pisos con reflejo
  const keep = new Set([...ceilingParts, ...decor, ...levelInfo.map(l => l.caps), ...floors, sky]);
  // obstáculos del recorrido: paredes, vigas y los muebles que estorban ("solid" en su ficha)
  const solid = it => META[it.type]?.solid ?? true;
  const obstacles = wallGroups.flatMap(wg => wg.children.map(m => new THREE.Box3().setFromObject(m)))
    .concat(placed.filter(({ it }) => solid(it)).map(({ g }) => new THREE.Box3().setFromObject(g)))
    // la escalera ya no estorba al frente (se sube caminando: ver walk.floorAt); estorba de costado, en la parte baja,
    // para no meterse por debajo: se deja una caja fina a lo largo de cada lado
    .concat(placed.filter(({ it }) => it.type === 'stair').flatMap(({ it, g }) => {
      const b = new THREE.Box3().setFromObject(g), q = it.params ?? {}, f = Math.min(1, 2 / (q.rise ?? 2.85));
      const d = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(it.rotation ?? 0));
      const ax = Math.abs(d.x) > Math.abs(d.z) ? 'x' : 'z', sgn = Math.sign(d[ax]), len = b.max[ax] - b.min[ax];
      if (sgn > 0) { b.min[ax] = b.max[ax] - len * f; b.max[ax] -= 0.5; } else { b.max[ax] = b.min[ax] + len * f; b.min[ax] += 0.5; }
      const o = ax === 'x' ? 'z' : 'x', sides = [b.clone(), b.clone()];
      sides[0].max[o] = b.min[o] + 0.04; sides[1].min[o] = b.max[o] - 0.04;
      return sides;
    }));
  // ubicación, puertas y circulación: con las cajas reales, antes de unir las piezas (después ya no se separan)
  const checked = checkScene({
    spec, levels, levelY: levelInfo.map(l => ({ y0: l.root.position.y, top: l.top })),
    placed: placed.map(({ it, g, li }) => ({ it, li, box: new THREE.Box3().setFromObject(g, true), solid: solid(it) })),
    wallBoxes: wallGroups.flatMap(wg => wg.children.map(m => new THREE.Box3().setFromObject(m))),
    obstacles, doors, balconies: [spec.exterior?.balcony ?? []].flat(),
  });
  warnings.push(...checked); warnings.maps = checked.maps;   // mapas de circulación: ver motor/verificar.html
  if (warnings.length) console.warn(`scene.json: ${warnings.length} problemas\n` + warnings.join('\n'));
  placed.forEach(p => { if (p.it.type === 'stair') p.box0 = new THREE.Box3().setFromObject(p.g); });   // antes de unir las piezas
  // huella de cada mueble para el plano 2D (T-09): la caja sin girar y después las cuatro esquinas giradas
  const footprints = placed.map(({ it, g, li }) => {
    const rot = g.rotation.y; g.rotation.y = 0; g.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(g, true); g.rotation.y = rot; g.updateMatrixWorld(true);
    const c = Math.cos(rot), s = Math.sin(rot), [ax, az] = it.at;
    const poly = [[b.min.x, b.min.z], [b.max.x, b.min.z], [b.max.x, b.max.z], [b.min.x, b.max.z]].map(([x, z]) => { const dx = x - ax, dz = z - az; return [+(ax + dx * c + dz * s).toFixed(3), +(az - dx * s + dz * c).toFixed(3)]; });
    return { type: it.type, level: li, decor: !!it.decor, mount: META[it.type]?.mount, poly, height: +(b.max.y - b.min.y).toFixed(2) };
  });
  const idTable = assignIds(scene);   // antes de unir las piezas: cada vértice lleva el id de su objeto y material
  levelInfo.forEach(l => mergeStatic(l.root, keep));
  mergeStatic(outside, keep);
  renderer.shadowMap.needsUpdate = true;

  /* ---------- estado ---------- */
  let dirty = true;   // se vuelve a dibujar solo si se movió la cámara o cambió algo
  const touch = () => { dirty = true; renderer.shadowMap.needsUpdate = true; };
  // "cut" (vistas desde arriba): saca el techo y lo que cuelga de él; paredes, aberturas y muebles quedan enteros
  // sin techo, el piso pulido reflejaría el cielo: el reflejo se apaga en esas vistas
  // con varios pisos, una vista sin techo muestra hasta su "level": los de arriba se ocultan y se ve el canto de sus paredes
  let viewLevel = 0, cutOn = false;
  function setCut(v) {
    cutOn = v;
    levelInfo.forEach((L, i) => {
      L.root.visible = !v || i <= viewLevel;
      L.ceiling.forEach(o => { o.visible = !v || i < viewLevel; });
      L.caps.visible = v && i === viewLevel;
    });
    if (refl) refl.enabled = !v;
    touch();
  }
  let nightOn = false;
  function setNight(v) {
    nightOn = v;
    const S = v ? NIGHT : DAY;
    sun.intensity = v ? 0 : DAY.sun;
    hemi.intensity = S.hemi * (GI ? GI_HEMI : 1); hemi.color.copy(S.sky); hemi.groundColor.copy(S.ground);
    scene.environmentIntensity = S.env;
    // en celular, de noche, las ventanas no iluminan: su luz es tenue y el spot que la reemplaza deja un punto azul
    // en los pisos brillantes
    rects.forEach(l => { l.intensity = S.rect * (l.userData.k ?? 1); l.color.copy(S.win); l.visible = !(mobile && v); });
    // una luz apagada igual se calcula en cada píxel: el sol (y su sombra) no existe de noche y las lámparas solo
    // mientras están prendidas (de día, solo las que llevan "day"). Al cambiar de día a noche los materiales se
    // recompilan una vez
    sun.visible = !v;
    lamps.forEach(l => { l.intensity = v ? l.userData.night * LAMPS : (l.userData.day ?? 0); l.visible = l.intensity > 0; });
    shiny.forEach(m => { m.envMapIntensity = m.userData.envBase * (v ? 0.25 : 1); });
    // con el ambiente fotografiado, de noche refleja lo que hay (las lámparas prendidas): no hace falta bajarlo tanto
    if (roomEnvs) shiny.forEach(m => { if (m.userData.room >= 0) { m.envMap = roomEnvs[m.userData.room][v ? 1 : 0]; m.envMapIntensity = m.userData.envBase * (v ? 0.8 : 1); } });
    glowMats.forEach(m => { m.emissiveIntensity = m.userData.night[v ? 1 : 0]; });
    glassMats.forEach(m => { m.color.copy(m.userData.base).multiplyScalar(v ? 0.3 : 1); });
    GI?.setNight(v);
    sky.material.uniforms.uNight.value = v ? 1 : 0;
    scene.fog.color.copy(S.fog); scene.background = S.fog;
    renderer.toneMappingExposure = S.exposure;
    touch();
  }
  const setDecor = v => { decor.forEach(g => { g.visible = v; }); touch(); };

  /* ---------- cámara: girar alrededor en las vistas desde arriba, caminar en las de adentro ---------- */
  // "viewAspect" (p. ej. 0,75 = foto vertical de celular): el fov de cada vista con "photo" es el de su foto. En otra
  // proporción de pantalla se conserva la diagonal del encuadre, así entra lo mismo sin deformar en horizontal.
  // Si las fotos de un departamento tienen proporciones distintas, cada vista puede llevar la suya en "photoAspect".
  // "fit" guarda la proporción de la foto de la vista actual (o null: el fov se usa tal cual).
  const refAspect = spec.viewAspect ?? null;
  const FOV_MIN = 25, FOV_MAX = 100;   // lo que permite acercar y alejar adentro (antes del ajuste a la proporción de la foto)
  let baseFov = 50, fit = null;
  const fitted = (f, a) => {
    if (!a) return f;
    const tv = Math.tan(THREE.MathUtils.degToRad(f) / 2);
    return THREE.MathUtils.radToDeg(2 * Math.atan(Math.hypot(tv, tv * a) / Math.hypot(1, camera.aspect)));
  };
  function applyFov() { camera.fov = fitted(baseFov, fit); camera.updateProjectionMatrix(); }
  const balconies = [spec.exterior?.balcony ?? []].flat();
  // Vistas desde arriba en pantallas verticales (celular): si el encuadre corta el departamento, la cámara se aleja
  // por la misma línea hasta que entra entero, balcones incluidos. En pantallas apaisadas queda tal como se definió.
  const probe = new THREE.PerspectiveCamera(), corner = new THREE.Vector3();
  // Antes de alejarla se centra el departamento de costado (cámara y punto de mira se corren juntos por el eje horizontal
  // de la pantalla): la vista general del depto 5 lo dejaba corrido y un borde mandaba sobre todo el encuadre. Margen:
  // 3 % a los costados (el ancho es lo que manda en un celular) y 10 % arriba y abajo. Pedido del usuario: que la vista
  // general del celular arranque más cerca; en el depto 5 pasó de 30 a 26,5 m
  function fitAerial(p, t, fov, level) {
    if (camera.aspect >= 1) return { p, t };
    // las esquinas reales del departamento y de cada balcón (2026-11-05). Antes era una sola caja que abarcaba los dos, y
    // la esquina donde no hay balcón (está vacía) alejaba la cámara de más: en el depto 5, 30 m en vez de ~22
    const W = 0.2, rects = [[ext.x0 - W, ext.x1 + W, ext.z0 - W, ext.z1 + W], ...balconies.map(b => [b.x[0], b.x[1], b.z[0], b.z[1]])], ys = [0, levelInfo[level]?.top ?? H];
    const corners = rects.flatMap(([x0, x1, z0, z1]) => [x0, x1].flatMap(x => [z0, z1].flatMap(z => ys.map(y => [x, y, z]))));
    const T = new THREE.Vector3(...t), d = new THREE.Vector3(...p).sub(T);
    Object.assign(probe, { fov, aspect: camera.aspect }); probe.updateProjectionMatrix();
    const place = s => { probe.position.copy(T).addScaledVector(d, s); probe.lookAt(T); probe.updateMatrixWorld(); };
    const right = new THREE.Vector3();
    place(1);
    for (let i = 0; i < 4; i++) {
      let lo = Infinity, hi = -Infinity;
      for (const c of corners) { corner.set(...c).project(probe); lo = Math.min(lo, corner.x); hi = Math.max(hi, corner.x); }
      const mid = (lo + hi) / 2;
      if (Math.abs(mid) < 0.01) break;
      const halfW = probe.position.distanceTo(T) * Math.tan(THREE.MathUtils.degToRad(fov) / 2) * camera.aspect;
      T.addScaledVector(right.setFromMatrixColumn(probe.matrixWorld, 0), mid * halfW); place(1);
    }
    for (let s = 1; s < 3; s += 0.05) {
      place(s);
      const inside = corners.every(([x, y, z]) => { corner.set(x, y, z).project(probe); return Math.abs(corner.x) <= 0.97 && Math.abs(corner.y) <= 0.9; });
      if (inside) break;
    }
    return { p: probe.position.toArray(), t: T.toArray() };
  }
  // límites del recorrido: el departamento y sus balcones, del lado que estén
  const walk = new WalkControls(camera, renderer.domElement, scene,
    { x0: Math.min(ext.x0, ...balconies.map(b => b.x[0] + 0.15)), x1: Math.max(ext.x1, ...balconies.map(b => b.x[1] - 0.15)),
      z0: Math.min(ext.z0, ...balconies.map(b => b.z[0] + 0.15)), z1: Math.max(ext.z1, ...balconies.map(b => b.z[1] - 0.15)) });
  walk.obstacles = obstacles;
  // Pisos para caminar (T-13): los ambientes de cada nivel, los balcones y las escaleras como rampa (de su arranque, en +Z
  // local, hasta "rise" arriba). Así se puede subir la escalera caminando hasta el piso de arriba
  const Yax = new THREE.Vector3(0, 1, 0);
  const ramps = placed.filter(({ it }) => it.type === 'stair').map(({ it, box0, li }) => {
    const b = box0, d = new THREE.Vector3(0, 0, 1).applyAxisAngle(Yax, THREE.MathUtils.degToRad(it.rotation ?? 0));
    const ax = Math.abs(d.x) > Math.abs(d.z) ? 'x' : 'z';
    return { b, ax, sgn: Math.sign(d[ax]), y0: levelInfo[li].root.position.y + (it.y ?? 0), rise: it.params?.rise ?? 2.85 };
  });
  const inR = (r, x, z) => x >= r.x[0] && x <= r.x[1] && z >= r.z[0] && z <= r.z[1];
  walk.floorAt = (x, z, foot) => {
    let best = -Infinity;
    const consider = h => { if (h <= foot + 0.45 && h > best) best = h; };
    levels.forEach((L, li) => { if ((L.rooms ?? []).some(r => inR(r.rect, x, z))) consider(levelInfo[li].root.position.y); });
    if (balconies.some(b => inR(b, x, z))) consider(0);
    for (const s of ramps) if (x >= s.b.min.x && x <= s.b.max.x && z >= s.b.min.z && z <= s.b.max.z) {
      const len = s.b.max[s.ax] - s.b.min[s.ax], pos = s.ax === 'x' ? x : z, t = s.sgn > 0 ? (s.b.max[s.ax] - pos) / len : (pos - s.b.min[s.ax]) / len;
      consider(s.y0 + s.rise * Math.min(1, Math.max(0, t)));
    }
    return best === -Infinity ? foot : best;
  };
  let mode = 'orbit';
  function setMode(m) { mode = m; controls.enabled = m === 'orbit'; walk.setEnabled(m === 'walk'); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let fly = null;
  function setPose(p, m = p.mode ?? mode) {
    camera.position.fromArray(p.p); controls.target.fromArray(p.t); baseFov = p.f; fit = typeof p.fit === 'number' ? p.fit : (p.fit ? refAspect : null); applyFov();
    camera.lookAt(controls.target); fly = null; fovEase = null; setMode(m); if (m === 'orbit') controls.update();
  }
  function go(name, instant) {
    const v = spec.views[name], to = { p: v.pos, t: v.target, f: v.fov, fit: v.photo ? (v.photoAspect ?? refAspect) : null, mode: v.cut ? 'orbit' : 'walk' };
    if (to.mode === 'orbit' && !to.fit) Object.assign(to, fitAerial(v.pos, v.target, v.fov, v.level ?? 0));
    // lo más abierto posible (pedido del usuario, 2026-11-04). Sin foto se ajusta igual que una vertical de celular: con
    // 100° de alto tal cual, en una pantalla apaisada se vería un ojo de pez
    if (wideViews && to.mode === 'walk') { to.f = FOV_MAX; to.fit ??= refAspect ?? 0.75; }
    if ((v.level ?? 0) !== viewLevel) { viewLevel = v.level ?? 0; setCut(cutOn); }
    if (instant || reduce) return setPose(to, to.mode);
    if (mode === 'walk') walk.target(controls.target);
    setMode('none');
    // el vuelo interpola el fov efectivo; al llegar queda el de la vista (con o sin ajuste a la foto)
    fly = { from: { p: camera.position.clone(), t: controls.target.clone(), f: camera.fov }, to: { p: new THREE.Vector3(...to.p), t: new THREE.Vector3(...to.t), f: fitted(to.f, to.fit), base: to.f, fit: to.fit, mode: to.mode }, start: performance.now(), dur: 1100 };
  }
  // Tocar la pantalla durante el vuelo lo corta donde esté. Hacia una vista desde arriba el fov igual termina en el de
  // la vista (en una vista de afuera no se puede cambiar el fov a mano, así que se quedaba abierto, a mitad de camino
  // desde una vista de adentro con el zoom más abierto); hacia una de adentro queda el que había
  let fovEase = null;
  const stopFly = () => {
    if (fly) {
      if (fly.to.mode === 'orbit') { baseFov = fly.to.base; fit = fly.to.fit; fovEase = { from: camera.fov, start: performance.now() }; }
      else { baseFov = camera.fov; fit = null; }
      setMode(fly.to.mode);
    }
    fly = null;
  };
  controls.addEventListener('start', stopFly);
  walk.onStart = stopFly;
  // rueda adentro: abre o cierra el campo de visión, sin mover la cámara (WASD camina)
  walk.onZoom = k => { baseFov = THREE.MathUtils.clamp(baseFov * k, FOV_MIN, FOV_MAX); applyFov(); };

  // Calidad adaptativa por escalones, que se recuerdan de un movimiento al siguiente: 0 = igual que quieta, 1 = 80 % de
  // resolución, 2 = además sin oclusión ambiental, 3 = 60 % de resolución. Mientras la cámara se mueve se baja un escalón
  // si los cuadros tardan y se sube si sobra tiempo; quieta vuelve a la calidad completa. Así, en un equipo que da
  // abasto, moverse o cambiar el zoom no hace aparecer ni desaparecer sombras; y si la oclusión estaba apagada,
  // vuelve de a poco en lugar de golpe. El reflejo del piso no entra en los escalones: apagarlo al moverse se notaba
  // en el celular (aparecía y desaparecía al caminar).
  // En celular la oclusión no se apaga nunca (es liviana y que apareciera al detenerse se notaba): solo baja la resolución
  const STEPS = mobile ? [{ s: 1, ao: true }, { s: 0.8, ao: true }, { s: 0.6, ao: true }]
    : [{ s: 1, ao: true }, { s: 0.8, ao: true }, { s: 0.8, ao: false }, { s: 0.6, ao: false }], AO = 0.85;
  const basePR = renderer.getPixelRatio();
  let moving = false, settleAt = 0, step = 0, scale = 1, slow = 0, quick = 0, aoFrom = null;
  function setAO(on, now) {
    if (!gtao || on === gtao.enabled) return;
    gtao.enabled = on; aoFrom = on ? now : null;
    if (on) gtao.blendIntensity = 0;
  }
  const applyStep = (st, now) => { setScale(st.s); setAO(st.ao, now); };
  function setScale(s) {
    if (s === scale) return; scale = s;
    renderer.setPixelRatio(basePR * s); composer?.setPixelRatio(basePR * s);
    refl?.setSize(container.clientWidth * basePR * s, container.clientHeight * basePR * s);
  }
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); composer?.setSize(w, h);
    const pr = renderer.getPixelRatio(); refl?.setSize(w * pr, h * pr);
    camera.aspect = w / h; applyFov(); dirty = true;
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  let raf = 0, frames = 0, fps = 0, last = performance.now(), prev = last;
  const lastView = new THREE.Matrix4(), lastProj = new THREE.Matrix4();
  const same = (a, b) => a.elements.every((x, i) => Math.abs(x - b.elements[i]) < 1e-5);
  function loop(now) {
    const dt = (now - prev) / 1000; prev = now;
    if (fly) {
      const k = Math.min(1, (now - fly.start) / fly.dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.lerpVectors(fly.from.p, fly.to.p, e); controls.target.lerpVectors(fly.from.t, fly.to.t, e);
      camera.fov = fly.from.f + (fly.to.f - fly.from.f) * e; camera.updateProjectionMatrix(); camera.lookAt(controls.target);
      if (k === 1) { baseFov = fly.to.base; fit = fly.to.fit; applyFov(); setMode(fly.to.mode); fly = null; }
    } else if (mode === 'orbit') controls.update();
    else if (mode === 'walk') walk.update(dt);
    if (fovEase && !fly) {
      const k = Math.min(1, (now - fovEase.start) / 350), to = fitted(baseFov, fit);
      camera.fov = fovEase.from + (to - fovEase.from) * k * k * (3 - 2 * k); camera.updateProjectionMatrix();
      if (k === 1) fovEase = null;
    }
    camera.updateMatrixWorld();
    // con tolerancia: los suavizados (caminar, girar con inercia) dejan restos ínfimos que no se ven y demoraban la
    // vuelta a la calidad completa unos segundos
    const changed = !same(lastView, camera.matrixWorld) || !same(lastProj, camera.projectionMatrix);
    if (changed) {
      if (!moving) { moving = true; applyStep(STEPS[step], now); }
      // más de 28 ms por cuadro (menos de ~35 fps) varias veces seguidas baja un escalón; un segundo y medio a 50 fps o
      // más lo sube (con pantallas de 60 Hz el cuadro nunca baja de 16,7 ms)
      if (dt > 0.028) { quick = 0; if (++slow > 6 && step < STEPS.length - 1) { applyStep(STEPS[++step], now); slow = 0; } }
      else if (dt < 0.02) { slow = 0; if (++quick > 90 && step > 0) { applyStep(STEPS[--step], now); quick = 0; } }
      settleAt = now + 200;
    }
    const settle = moving && !changed && now > settleAt;
    if (settle) { moving = false; applyStep(STEPS[0], now); }
    let fading = false;   // la oclusión que vuelve se funde en un tercio de segundo
    if (aoFrom !== null) {
      const k = Math.min(1, (now - aoFrom) / 350);
      gtao.blendIntensity = AO * k * k * (3 - 2 * k); fading = k < 1; if (!fading) aoFrom = null;
    }
    if (dirty || changed || settle || fading) {
      lastView.copy(camera.matrixWorld); lastProj.copy(camera.projectionMatrix); dirty = false;
      draw();
      frames++;   // cuadros dibujados de verdad (quieta, el visor no dibuja y marca 0)
    } else if (!moving && refining()) draw(true);
    if (now - last > 500) { fps = Math.round(frames * 1000 / (now - last)); frames = 0; last = now; }
    raf = requestAnimationFrame(loop);
  }

  setCut(state.cut); setNight(state.night); setDecor(state.decor);
  if (state.pose) setPose(state.pose); else go(state.view, true);
  raf = requestAnimationFrame(loop);

  // Precarga (pedido del usuario, 2026-11-04): pasar de día a noche, o de la vista general a una de adentro, cambia
  // cuántas luces hay y todos los materiales se recompilan; al tocar "De noche" se esperaba un rato (en la PC ~0,3 s,
  // en un celular varios segundos). Apenas se ve el primer cuadro, en segundo plano, se compilan todas las
  // combinaciones (día/noche × con/sin techo × nivel de cada vista) y después se dibuja cada una una vez sin mostrarla
  // (en la misma tarea se vuelve a dibujar el estado actual), para que el driver termine el trabajo.
  let destroyed = false;
  const ready = (async () => {
    await new Promise(r => setTimeout(r, 300));
    if (destroyed) return;
    const combos = new Map();
    for (const v of Object.values(spec.views)) combos.set(`${!!v.cut}|${v.level ?? 0}`, [!!v.cut, v.level ?? 0]);
    const list = [false, true].flatMap(n => [...combos.values()].map(([c, lv]) => [n, c, lv]));
    const apply = ([n, c, lv]) => { viewLevel = lv; setCut(c); setNight(n); };
    const dummy = !composer && refl ? new THREE.WebGLRenderTarget(1, 1) : null;
    const targets = composer ? [rt] : dummy ? [null, dummy] : [null];
    const cur = [nightOn, cutOn, viewLevel];
    for (const k of list) {
      apply(k);
      for (const t of targets) { renderer.setRenderTarget(t); renderer.compile(scene, camera); }
    }
    renderer.setRenderTarget(null); apply(cur); dummy?.dispose();
    // reflejos de cada ambiente (ver roomList): con techo y todos los niveles a la vista, de día y de noche. Del mismo
    // tamaño que el entorno genérico (256), así cambiar de uno a otro no recompila los materiales
    if (roomList.length && perRoom.size) {
      const crt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType }), cc = new THREE.CubeCamera(0.05, 80, crt);
      const envs = roomList.map(() => [null, null]), was = [nightOn, cutOn, viewLevel];
      for (const n of [false, true]) {
        apply([n, false, 0]);
        for (let i = 0; i < roomList.length; i++) {
          cc.position.copy(roomList[i].c); cc.updateMatrixWorld(); cc.update(renderer, scene);
          envs[i][n ? 1 : 0] = pmrem.fromCubemap(crt.texture).texture;
          await new Promise(r => setTimeout(r, 0));
          if (destroyed) return;
        }
      }
      crt.dispose(); roomEnvs = envs; apply(was);
    }
    // se espera a que terminen (con compilación en paralelo no traba la página). No se usa compileAsync: si un material
    // se descarta mientras espera (varios visores seguidos, como en verificar.html), su sondeo se cae y no termina nunca
    const t0 = performance.now();
    while (!renderer.info.programs.every(p => p.isReady()) && performance.now() - t0 < 8000) {
      await new Promise(r => setTimeout(r, 30));
      if (destroyed) return;
    }
    // las texturas se suben a la placa la primera vez que algo con ellas entra en cuadro: la primera vista de adentro
    // tardaba ~0,25 s. Se suben acá, de a pocas
    const texs = new Set();
    scene.traverse(o => { if (o.material) for (const m of [o.material].flat()) for (const k in m) if (m[k]?.isTexture) texs.add(m[k]); });
    const pending = [...texs];
    while (pending.length) {
      await new Promise(r => setTimeout(r, 16));
      if (destroyed) return;
      pending.splice(0, 6).forEach(t => renderer.initTexture(t));
    }
    for (const k of list) {
      await new Promise(r => setTimeout(r, 30));
      if (destroyed) return;
      const now = [nightOn, cutOn, viewLevel];
      if (k.every((x, i) => x === now[i])) continue;
      apply(k); draw(); apply(now); draw();
    }
  })();

  return {
    // resize: para quien cambia el tamaño del contenedor y necesita el cuadro ya (con el panel oculto el aviso de
    // cambio de tamaño del navegador puede no llegar)
    go, setCut, setNight, setDecor, setPose, resize, hasDecor: decor.length > 0, warnings, ready,
    _debug: { gtao, scene, camera, THREE, refl, renderer, walk, redraw: touch },
    // dibuja ya y devuelve la imagen del lienzo (para hojas de comparación)
    capture(type = 'image/jpeg') { return this.frame().toDataURL(type, 0.9); },
    // dibuja ya a calidad completa, con el pulido ("drawn" queda con la cantidad de cuadros que sumó), y devuelve el lienzo: hay que copiarlo enseguida (las herramientas lo copian a su lienzo)
    frame() {
      if (gtao) { gtao.enabled = true; gtao.blendIntensity = AO; aoFrom = null; }
      setScale(1); camera.updateMatrixWorld(); draw(); this.drawn = 1; while (refining()) { draw(true); this.drawn++; } return renderer.domElement;
    },
    // mapa de identificación desde la cámara actual, al tamaño del lienzo: { width, height, ids (fila 0 = arriba), table,
    // viewProj }. Con { depth: true } también la distancia a la cámara de cada píxel (metros, 0 = cielo); con
    // { hideGlass: true } los vidrios no se dibujan (se ve lo que hay detrás).
    idMap({ depth = false, hideGlass = false } = {}) {
      const w = renderer.domElement.width, h = renderer.domElement.height, rt = new THREE.WebGLRenderTarget(w, h);
      const hidden = [];
      if (hideGlass) scene.traverse(o => { if (o.isMesh && o.visible && [o.material].flat()[0]?.userData?.glass) hidden.push(o); });
      hidden.forEach(o => { o.userData.wasVisible = o.visible; o.visible = false; });
      const prev = { o: scene.overrideMaterial, b: scene.background, f: scene.fog, t: renderer.getRenderTarget() };
      scene.background = new THREE.Color(0); scene.fog = null; camera.updateMatrixWorld();
      const pass = mat => {
        scene.overrideMaterial = mat; renderer.setRenderTarget(rt); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
        const px = new Uint8Array(w * h * 4); renderer.readRenderTargetPixels(rt, 0, 0, w, h, px); mat.dispose();
        const out = new Uint32Array(w * h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((h - 1 - y) * w + x) * 4; out[y * w + x] = px[i] | (px[i + 1] << 8) | (px[i + 2] << 16); }
        return out;
      };
      const ids = pass(idMaterial()), dist = depth ? Float32Array.from(pass(idMaterial(true)), v => v / 1000) : null;
      renderer.setRenderTarget(prev.t); scene.overrideMaterial = prev.o; scene.background = prev.b; scene.fog = prev.f;
      hidden.forEach(o => { o.visible = o.userData.wasVisible; });
      rt.dispose(); dirty = true;
      const viewProj = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).toArray();
      return { width: w, height: h, ids, depth: dist, table: idTable, viewProj };
    },
    // datos para el plano 2D (motor/plano.html): niveles con ambientes (ya repartidos), paredes con aberturas, huecos y
    // la huella de cada mueble; balcones y hacia dónde mira la fachada
    plan: () => ({ levels: levels.map((L, li) => ({ name: L.name, y: levelInfo[li].root.position.y, rooms: L.rooms ?? [], walls: L.walls ?? [], voids: li ? L.voids ?? [] : [], items: footprints.filter(f => f.level === li) })),
      balconies, facing: spec.exterior?.facing ?? '-z' }),
    getPose: () => ({ p: camera.position.toArray(), t: (mode === 'walk' ? walk.target(new THREE.Vector3()) : controls.target).toArray(), f: baseFov, fit, mode }),
    stats() {
      let tris = 0, meshes = 0;
      scene.traverse(o => {
        if (!o.isMesh) return;
        meshes++;
        const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3;
        tris += n * (o.isInstancedMesh ? o.count : 1);
      });
      return { tris, meshes, fps, quality: mobile ? 'adaptada a celular' : 'alta' };
    },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); walk.dispose();
      const mats = new Set();
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [o.material].flat().forEach(m => mats.add(m)); });
      mats.forEach(m => m.dispose());
      composer?.dispose?.(); rt?.dispose(); refl?.dispose(); envTex.dispose(); pmrem.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}

// Reflejo de los pisos pulidos: se dibuja el ambiente con una cámara espejada bajo el plano y = 0 (a media resolución,
// con mipmaps para desenfocarlo según el brillo) y cada piso con "gloss" lo suma con Fresnel. Las juntas no reflejan.
// Luz rebotada (2026-11-07): motor/hornear.html mide, en una grilla de puntos cada ~50 cm dentro del departamento, la
// luz que llega de todos lados (con el sol, las ventanas y las lámparas ya prendidas) y la guarda como armónicos
// esféricos de orden 1 (4 números por color), de día y de noche. Acá se cargan en tres texturas 3D (una por color) y cada
// material la suma a su luz indirecta según la posición y la normal del píxel: la pared junto al piso de madera se
// entibia, los rincones lejos de la ventana quedan más oscuros, el techo toma el color del piso. Fuera de la grilla no
// suma nada (el entorno comparte materiales con el interior). Cuesta tres lecturas de textura por píxel.
// la luz rebotada reemplaza parte del relleno parejo (la luz hemisférica): sumada encima, todo quedaba lavado
const BOUNCE = 0.6, GI_HEMI = 0.5;
function bounceLight(scene, data, strength) {
  const [nx, ny, nz] = data.n, b64 = s => new Uint16Array(Uint8Array.from(atob(s), c => c.charCodeAt(0)).buffer);
  const tex = set => ['r', 'g', 'b'].map(k => {
    const t = new THREE.Data3DTexture(b64(set[k]), nx, ny, nz);
    Object.assign(t, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, unpackAlignment: 1, needsUpdate: true });
    return t;
  });
  const day = tex(data.day), night = tex(data.night);
  const size = new THREE.Vector3(...data.step).multiply(new THREE.Vector3(nx - 1, ny - 1, nz - 1));
  const U = { giR: { value: day[0] }, giG: { value: day[1] }, giB: { value: day[2] }, giMin: { value: new THREE.Vector3(...data.min) }, giSize: { value: size },
    giN: { value: new THREE.Vector3(nx, ny, nz) }, giK: { value: strength }, giViewInv: { value: new THREE.Matrix4() } };
  const head = ['uniform highp sampler3D giR, giG, giB;', 'uniform vec3 giMin, giSize, giN;', 'uniform float giK;', 'uniform mat4 giViewInv;', ''].join(String.fromCharCode(10));
  const body = `
  {
    vec3 gN = normalize( ( giViewInv * vec4( normal, 0.0 ) ).xyz );
    vec3 gP = ( giViewInv * vec4( - vViewPosition, 1.0 ) ).xyz + gN * 0.15;
    vec3 uvw = ( gP - giMin ) / giSize;
    vec3 out3 = max( - uvw, uvw - 1.0 );
    float gMask = 1.0 - smoothstep( 0.0, 0.06, max( out3.x, max( out3.y, out3.z ) ) );
    vec3 tc = ( clamp( uvw, 0.0, 1.0 ) * ( giN - 1.0 ) + 0.5 ) / giN;
    vec4 gB = vec4( 0.886227, 1.023328 * gN.y, 1.023328 * gN.z, 1.023328 * gN.x );
    irradiance += max( vec3( dot( texture( giR, tc ), gB ), dot( texture( giG, tc ), gB ), dot( texture( giB, tc ), gB ) ), 0.0 ) * giK * gMask;
  }`;
  const done = new Set();
  scene.traverse(o => {
    for (const m of o.material ? [o.material].flat() : []) {
      if (done.has(m) || m.isShaderMaterial || !(m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial)) continue;
      done.add(m);
      const prev = m.onBeforeCompile, key = prev.toString();
      m.onBeforeCompile = (sh, r) => {
        prev.call(m, sh, r);
        if (!sh.fragmentShader.includes('#include <lights_fragment_maps>')) return;
        Object.assign(sh.uniforms, U);
        sh.fragmentShader = head + sh.fragmentShader.replace('#include <lights_fragment_maps>', '#include <lights_fragment_maps>' + body);
      };
      m.customProgramCacheKey = () => key + '|gi';
      m.needsUpdate = true;
    }
  });
  return { U, setNight(v) { const s = v ? night : day; U.giR.value = s[0]; U.giG.value = s[1]; U.giB.value = s[2]; } };
}

function floorReflection(meshes, mobile) {
  if (!meshes.length) return null;
  const scale = mobile ? 0.35 : 0.5;
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  const U = { tReflect: { value: rt.texture }, uReflMatrix: { value: new THREE.Matrix4() }, uReflF0: { value: 0.14 }, uReflBoost: { value: 1.4 } };
  for (const mat of new Set(meshes.map(m => m.material))) {
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U, { uGloss: { value: mat.userData.gloss } });
      sh.vertexShader = 'uniform mat4 uReflMatrix;\nvarying vec4 vReflUv;\n' + sh.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n  vReflUv = uReflMatrix * modelMatrix * vec4( transformed, 1.0 );');
      sh.fragmentShader = 'uniform sampler2D tReflect;\nuniform float uGloss, uReflF0, uReflBoost;\nvarying vec4 vReflUv;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `{
        float mask = 1.0;
        #ifdef USE_ROUGHNESSMAP
          mask = 1.0 - smoothstep( 0.55, 0.85, texelRoughness.g );
        #endif
        float ndv = clamp( dot( normal, normalize( vViewPosition ) ), 0.0, 1.0 );
        float f = uGloss * mask * ( uReflF0 + ( 1.0 - uReflF0 ) * pow( 1.0 - ndv, 4.0 ) );
        vec3 rc = textureLod( tReflect, vReflUv.xy / vReflUv.w, 1.0 + 2.5 * ( 1.0 - uGloss ) ).rgb;
        outgoingLight = outgoingLight * ( 1.0 - f ) + rc * f * uReflBoost;
      }
      #include <opaque_fragment>`);
    };
    mat.customProgramCacheKey = () => 'floor-reflect';
  }
  const cam = new THREE.PerspectiveCamera(), n = new THREE.Vector3(0, 1, 0), plane = new THREE.Plane();
  const boost = U.uReflBoost.value, pos = new THREE.Vector3(), look = new THREE.Vector3(), rot = new THREE.Matrix4(), clip = new THREE.Vector4(), q = new THREE.Vector4();
  return {
    setSize: (w, h) => rt.setSize(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale))),
    target: rt, uniforms: U, dispose: () => rt.dispose(),
    enabled: true,
    render(renderer, scene, camera) {
      U.uReflBoost.value = this.enabled ? boost : 0;
      if (!this.enabled) return;
      pos.setFromMatrixPosition(camera.matrixWorld);
      if (pos.y <= 0.01) return;
      rot.extractRotation(camera.matrixWorld);
      look.set(0, 0, -1).applyMatrix4(rot).add(pos);
      cam.position.set(pos.x, -pos.y, pos.z);
      cam.up.set(0, 1, 0).applyMatrix4(rot).reflect(n);
      cam.lookAt(look.x, -look.y, look.z);
      cam.near = camera.near; cam.far = camera.far;
      cam.updateMatrixWorld(); cam.projectionMatrix.copy(camera.projectionMatrix);
      U.uReflMatrix.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
      // plano de corte oblicuo: lo que queda bajo el piso no entra en el reflejo
      plane.setFromNormalAndCoplanarPoint(n, new THREE.Vector3()).applyMatrix4(cam.matrixWorldInverse);
      clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
      const e = cam.projectionMatrix.elements;
      q.set((Math.sign(clip.x) + e[8]) / e[0], (Math.sign(clip.y) + e[9]) / e[5], -1, (1 + e[10]) / e[14]);
      clip.multiplyScalar(2 / clip.dot(q));
      e[2] = clip.x; e[6] = clip.y; e[10] = clip.z + 1 - 0.003; e[14] = clip.w;
      cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
      meshes.forEach(m => { m.visible = false; });
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, cam); renderer.setRenderTarget(prev);
      meshes.forEach(m => { m.visible = true; });
    },
  };
}
