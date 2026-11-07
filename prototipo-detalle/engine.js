// PROTOTIPO desechable: motor del visor. Lee scene.json y arma la escena con la biblioteca de componentes.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { makeMaterials, COMPONENTS, OPENINGS, exterior, blk, uvScale } from './components.js';

const CUT_H = 1.15;

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

export async function start(container, { scene: spec, state, preset = 'premium' }) {
  const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 500;
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;   // PCF admite shadow.radius: penumbra difusa como la del sol por una ventana
  renderer.toneMapping = THREE.NeutralToneMapping;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 300);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 0.2; controls.maxDistance = 40; controls.maxPolarAngle = Math.PI * 0.49;

  const M = makeMaterials(preset);
  const H = spec.height ?? 2.6, rooms = spec.rooms, wallColor = rooms[0]?.walls ?? '#f2f0eb';
  const ext = extentsOf(spec.walls);
  const cutables = [], decor = [], windows = [];
  const inRoom = (x, z) => rooms.some(r => x > r.rect.x[0] && x < r.rect.x[1] && z > r.rect.z[0] && z < r.rect.z[1]);

  /* ---------- pisos, losa y cielorraso ---------- */
  for (const r of rooms) {
    const [x0, x1] = r.rect.x, [z0, z1] = r.rect.z, tile = r.floor?.tile ?? 0.6;
    const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0); geo.rotateX(-Math.PI / 2);
    uvScale(geo, (x1 - x0) / (2 * tile), (z1 - z0) / (2 * tile));
    const m = new THREE.Mesh(geo, M.floor(r.floor?.color ?? '#cbc7c1'));
    m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); m.receiveShadow = true; scene.add(m);
  }
  blk(scene, M.paint('#d9d5cd'), [ext.x0, ext.x1], [-0.2, -0.002], [ext.z0, ext.z1]);
  cutables.push({ obj: blk(scene, M.paint(rooms[0]?.ceiling ?? '#f7f6f3'), [ext.x0, ext.x1], [H, H + 0.12], [ext.z0, ext.z1]), mode: 'hide' });

  /* ---------- paredes (se rearman al cortar) ---------- */
  const wallGroup = new THREE.Group(); scene.add(wallGroup);
  const wallMat = M.paint(wallColor), capMat = M.lacquer('#4a505a');
  function buildWalls(h) {
    for (const c of [...wallGroup.children]) { wallGroup.remove(c); c.geometry.dispose(); }
    for (const w of spec.walls) {
      const L = wallLine(w);
      const seg = (s0, s1, y0, y1) => {
        const top = Math.min(y1, h);
        if (top - y0 < 0.005 || s1 - s0 < 0.005) return;
        const across = [L.c - L.t / 2, L.c + L.t / 2];
        const xs = L.alongX ? [s0, s1] : across, zs = L.alongX ? across : [s0, s1];
        blk(wallGroup, wallMat, xs, [y0, top], zs);
        if (h < H && top === h) blk(wallGroup, capMat, xs, [h, h + 0.006], zs);
      };
      const ops = (w.openings ?? []).map(o => { const s = L.start(o); return [s, s + o.width, o.sill ?? 0, (o.sill ?? 0) + o.height]; })
        .sort((p, q) => p[0] - q[0]);
      // en las esquinas, la pared en Z se corta contra la pared en X para que no compartan volumen ni caras
      let a0 = L.a0, a1 = L.a1;
      if (!L.alongX) for (const o of spec.walls) {
        const X = wallLine(o);
        if (!X.alongX || L.c < X.a0 - 1e-6 || L.c > X.a1 + 1e-6) continue;
        const lo = X.c - X.t / 2, hi = X.c + X.t / 2;
        if (a0 >= lo - 1e-6 && a0 < hi) a0 = hi;
        if (a1 <= hi + 1e-6 && a1 > lo) a1 = lo;
      }
      let cur = a0;
      for (const o of ops) { seg(cur, o[0], 0, H); seg(o[0], o[1], 0, o[2]); seg(o[0], o[1], o[3], H); cur = o[1]; }
      seg(cur, a1, 0, H);
    }
  }

  /* ---------- aberturas: X local a lo largo de la pared, Z local hacia el ambiente ---------- */
  for (const w of spec.walls) for (const o of w.openings ?? []) {
    const make = OPENINGS[o.kind];
    if (!make) { console.warn('Abertura desconocida:', o.kind); continue; }
    const L = wallLine(w), s0 = L.start(o), s1 = s0 + o.width, mid = (s0 + s1) / 2, off = L.t / 2 + 0.3;
    const nSign = (L.alongX ? inRoom(mid, L.c + off) : inRoom(L.c + off, mid)) ? 1 : -1;
    const rh = L.alongX ? nSign === 1 : nSign === -1;      // si no, se invierte el eje para no reflejar la geometría
    const ax = L.alongX ? [rh ? 1 : -1, 0] : [0, rh ? 1 : -1];
    const g = new THREE.Group(), a = rh ? s0 : s1;
    g.rotation.y = Math.atan2(-ax[1], ax[0]);
    g.position.set(L.alongX ? a : L.c, 0, L.alongX ? L.c : a);
    const hinge = rh ? o.hinge : (o.hinge === 'end' ? 'start' : 'end');
    const inner = make({ ...o, hinge }, { len: o.width, h: o.height, t: L.t, H, M, wallColor });
    inner.position.y = o.sill ?? 0; g.add(inner); scene.add(g);
    cutables.push({ obj: g, mode: 'scale', h: (o.sill ?? 0) + o.height });
    if (o.kind === 'sliding-window') windows.push({ g, len: o.width, h: o.height, sill: o.sill ?? 0, t: L.t });
  }

  /* ---------- zócalos: siguen cada borde de ambiente apoyado en una pared, salvo vanos a ras del piso ---------- */
  const skirt = M.lacquer(spec.baseboard ?? '#ece9e3');
  for (const r of rooms) {
    const [x0, x1] = r.rect.x, [z0, z1] = r.rect.z;
    const edges = [
      { alongX: true, c: z0, n: 1, a: [x0, x1] }, { alongX: true, c: z1, n: -1, a: [x0, x1] },
      { alongX: false, c: x0, n: 1, a: [z0, z1] }, { alongX: false, c: x1, n: -1, a: [z0, z1] },
    ];
    for (const e of edges) for (const w of spec.walls) {
      const L = wallLine(w);
      if (L.alongX !== e.alongX || Math.abs(L.c + e.n * L.t / 2 - e.c) > 0.02) continue;
      const lo = Math.max(e.a[0], L.a0), hi = Math.min(e.a[1], L.a1);
      if (hi - lo < 0.05) continue;
      const cuts = (w.openings ?? []).filter(o => (o.sill ?? 0) < 0.05).map(o => { const s = L.start(o); return [s, s + o.width]; }).sort((p, q) => p[0] - q[0]);
      const pieces = []; let cur = lo;
      for (const [s, f] of cuts) { if (f <= cur || s >= hi) continue; if (s > cur) pieces.push([cur, s]); cur = Math.max(cur, f); }
      if (hi > cur) pieces.push([cur, hi]);
      const cs = [e.c, e.c + e.n * 0.012].sort((p, q) => p - q);
      for (const [p0, p1] of pieces) L.alongX ? blk(scene, skirt, [p0, p1], [0, 0.07], cs, 0.002) : blk(scene, skirt, cs, [0, 0.07], [p0, p1], 0.002);
    }
  }

  /* ---------- muebles y objetos ---------- */
  for (const it of spec.items) {
    const make = COMPONENTS[it.type];
    if (!make) { console.warn('Componente desconocido:', it.type); continue; }
    const g = make(it.params ?? {}, { M, H });
    g.position.set(it.at[0], it.y ?? 0, it.at[1]);
    g.rotation.y = THREE.MathUtils.degToRad(it.rotation ?? 0);
    scene.add(g);
    if (make.cut) cutables.push({ obj: g, mode: make.cut, h: g.userData.h ?? H });
    if (it.decor) decor.push(g);
  }
  scene.add(exterior(spec.exterior ?? {}, { M, ext }));

  /* ---------- luz: entorno, sol con sombra, luz de ventana y lámparas de noche ---------- */
  RectAreaLightUniformsLib.init();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  // sol de tarde: luz directa cálida, cielo y rebote del piso también cálidos, entorno neutro bajo para no lavar el color
  const lit = spec.lighting ?? {};
  const DAY = { sun: lit.sunIntensity ?? 4.5, hemi: 0.6, env: 0.2, rect: 2.2 };
  const hemi = new THREE.HemisphereLight(lit.sky ?? '#ffe2c2', '#d0a57c', DAY.hemi); scene.add(hemi);
  renderer.toneMappingExposure = 1.08;
  const center = new THREE.Vector3((ext.x0 + ext.x1) / 2, 0, (ext.z0 + ext.z1) / 2);
  const sun = new THREE.DirectionalLight(lit.sunColor ?? '#ffc58a', DAY.sun);
  sun.position.copy(center).add(new THREE.Vector3(...(lit.sunFrom ?? [9, 6, -11])));
  sun.target.position.copy(center); scene.add(sun, sun.target);
  // el encuadre de la sombra se ajusta al departamento (más resolución), con desenfoque para suavizar el borde
  const reach = Math.hypot(ext.x1 - ext.x0, ext.z1 - ext.z0) / 2 + 0.6;
  sun.castShadow = true; sun.shadow.mapSize.setScalar(mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 40 });
  sun.shadow.radius = mobile ? 3 : 5;
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.05;
  scene.updateMatrixWorld(true);
  const rects = windows.map(w => {
    const l = new THREE.RectAreaLight(lit.sky ?? '#ffe9d2', DAY.rect, w.len * 0.9, w.h * 0.9);
    l.position.copy(w.g.localToWorld(new THREE.Vector3(w.len / 2, w.sill + w.h / 2, w.t / 2 + 0.02)));
    l.lookAt(w.g.localToWorld(new THREE.Vector3(w.len / 2, w.sill + w.h / 2, 3)));
    scene.add(l); return l;
  });
  const lamps = [], glowMats = new Set();
  scene.traverse(o => {
    if (o.isLight && o.userData.night) lamps.push(o);
    if (o.isMesh && o.material.userData?.night) glowMats.add(o.material);
  });

  /* ---------- posproceso: oclusión ambiental (se omite en celulares) ---------- */
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null;
  if (!mobile) {
    gtao = new GTAOPass(scene, camera, 1, 1);
    gtao.blendIntensity = 0.9;
    gtao.updateGtaoMaterial({ radius: 0.3, distanceExponent: 1.4, thickness: 1, scale: 1.1, samples: 24, distanceFallOff: 1 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 8, rings: 3, samples: 24 });
    composer.addPass(gtao);
  }
  composer.addPass(new OutputPass());
  // la AO se calcula sin antialiasing; SMAA al final alisa los bordes que deja dentados
  const smaa = new SMAAPass(1, 1);
  composer.addPass(smaa);

  /* ---------- estado ---------- */
  function setCut(v) {
    buildWalls(v ? CUT_H : H);
    for (const c of cutables) {
      if (c.mode === 'hide') c.obj.visible = !v;
      else if (c.mode === 'scale') c.obj.scale.y = v ? Math.min(1, CUT_H / c.h) : 1;
    }
    scene.traverse(o => { if (o.userData.cut === 'hide') o.visible = !v; });
  }
  function setNight(v) {
    sun.intensity = v ? 0 : DAY.sun; hemi.intensity = v ? 0.03 : DAY.hemi; scene.environmentIntensity = v ? 0.06 : DAY.env;
    rects.forEach(l => { l.intensity = v ? 0 : DAY.rect; });
    lamps.forEach(l => { l.intensity = v ? l.userData.night : 0; });
    glowMats.forEach(m => { m.emissiveIntensity = m.userData.night[v ? 1 : 0]; });
    scene.background = new THREE.Color(v ? '#0f141c' : (lit.background ?? '#eadccb'));
  }
  const setDecor = v => decor.forEach(g => { g.visible = v; });

  /* ---------- cámara ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let fly = null;
  function setPose(p) { camera.position.fromArray(p.p); controls.target.fromArray(p.t); camera.fov = p.f; camera.updateProjectionMatrix(); controls.update(); fly = null; }
  function go(name, instant) {
    const v = spec.views[name], to = { p: v.pos, t: v.target, f: v.fov };
    if (instant || reduce) return setPose(to);
    fly = { from: { p: camera.position.clone(), t: controls.target.clone(), f: camera.fov }, to: { p: new THREE.Vector3(...to.p), t: new THREE.Vector3(...to.t), f: to.f }, start: performance.now(), dur: 1100 };
  }
  controls.addEventListener('start', () => { fly = null; });

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  let raf = 0, frames = 0, fps = 0, last = performance.now();
  function loop(now) {
    if (fly) {
      const k = Math.min(1, (now - fly.start) / fly.dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.lerpVectors(fly.from.p, fly.to.p, e); controls.target.lerpVectors(fly.from.t, fly.to.t, e);
      camera.fov = fly.from.f + (fly.to.f - fly.from.f) * e; camera.updateProjectionMatrix();
      if (k === 1) fly = null;
    }
    controls.update(); composer.render();
    frames++; if (now - last > 500) { fps = Math.round(frames * 1000 / (now - last)); frames = 0; last = now; }
    raf = requestAnimationFrame(loop);
  }

  setCut(state.cut); setNight(state.night); setDecor(state.decor);
  if (state.pose) setPose(state.pose); else go(state.view, true);
  raf = requestAnimationFrame(loop);

  return {
    go, setCut, setNight, setDecor, setPose, _debug: { gtao, scene, camera, THREE },
    getPose: () => ({ p: camera.position.toArray(), t: controls.target.toArray(), f: camera.fov }),
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
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      const mats = new Set();
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) mats.add(o.material); });
      mats.forEach(m => m.dispose());
      composer.dispose?.(); rt.dispose(); envTex.dispose(); pmrem.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
