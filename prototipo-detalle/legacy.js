// PROTOTIPO: variante A. El dormitorio tal como está hecho hoy (Three.js r128, cajas con coordenadas a mano),
// copiado del artifact original y recortado a este ambiente para comparar con las mismas cámaras.
(function () {
window.LegacyViewer = { start: start };

function start(container, opts) {
  const THREE = window.THREE, state = opts.state, VIEWS = opts.scene.views;
  const FULL_H = 2.6, CUT_H = 1.15;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 300);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 0.2; controls.maxDistance = 45; controls.maxPolarAngle = Math.PI * 0.49;

  const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85, metalness: 0 }, o || {}));
  const mat = {
    wall: M(0xf4f3f0, { roughness: 0.95 }), cap: M(0x4a505a, { roughness: 0.9 }),
    white: M(0xf3f1ec, { roughness: 0.45 }), steel: M(0xc8ccd1, { roughness: 0.25, metalness: 0.8 }),
    steelDark: M(0x7e848b, { roughness: 0.3, metalness: 0.7 }), black: M(0x1f2123, { roughness: 0.55 }),
    cushDark: M(0x2a2826, { roughness: 1 }), wood: M(0xb36d2e, { roughness: 0.5 }), woodLight: M(0xc49862, { roughness: 0.6 }),
    navy: M(0x2c3850, { roughness: 0.8 }), linen: M(0xfbfbf9, { roughness: 0.9 }), towel: M(0xe8dcc6, { roughness: 1 }),
    stone: M(0xdcc9a8, { roughness: 0.95 }), rail: M(0x4a4e54, { roughness: 0.45, metalness: 0.6 }),
    alu: M(0xf2f2f2, { roughness: 0.35, metalness: 0.15 }), darkGlass: M(0x5f7586, { roughness: 0.15, metalness: 0.3 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xcfe3ef, transparent: true, opacity: 0.2, roughness: 0.05, depthWrite: false }),
    facade: M(0xe9e4da, { roughness: 0.95 }), ground: M(0xa7aba2, { roughness: 1 }), asphalt: M(0x4b4e52, { roughness: 1 }),
    leaf: M(0x6f8b55, { roughness: 1 }), trunk: M(0x6b5a48, { roughness: 1 }),
    glow: new THREE.MeshStandardMaterial({ color: 0xfff2d6, emissive: 0xffd9a0, emissiveIntensity: 0.15, roughness: 0.4 }),
    shadowOnly: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
  };
  function tileTex(base, line, lineW) {
    const px = 256, c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, px, px);
    for (let i = 0; i < 1400; i++) { g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.035).toFixed(3) + ')'; g.fillRect(Math.random() * px, Math.random() * px, 2, 2); }
    g.fillStyle = line; g.fillRect(0, 0, px, lineW || 3); g.fillRect(0, 0, lineW || 3, px);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
  }
  function stripeTex(cols, n, vertical) {
    const px = 256, c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d');
    const s = px / n; for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; vertical ? g.fillRect(i * s, 0, s, px) : g.fillRect(0, i * s, px, s); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  const TX = { floor: tileTex('#c8c9cb', '#aeb0b3'), balcony: tileTex('#e6d8c0', '#cdbda0', 3), rug: stripeTex(['#c9553a', '#d9744f', '#b8442d', '#e08a5c'], 12, true) };
  function texMat(tex, rx, ry, rough) { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ map: t, roughness: rough == null ? 0.6 : rough }); }

  const SPH = new THREE.SphereGeometry(1, 28, 18);
  function box(x0, x1, y0, y1, z0, z1, m, parent) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), m);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); (parent || scene).add(mesh); return mesh;
  }
  function ell(x, y, z, rx, ry, rz, m, parent) { const s = new THREE.Mesh(SPH, m); s.scale.set(rx, ry, rz); s.position.set(x, y, z); (parent || scene).add(s); return s; }
  function cyl(x, y0, y1, z, r, m, parent, seg) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, y1 - y0, seg || 20), m); c.position.set(x, (y0 + y1) / 2, z); (parent || scene).add(c); return c; }
  function barX(x0, x1, y, z, r, m) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, x1 - x0, 10), m); c.rotation.z = Math.PI / 2; c.position.set((x0 + x1) / 2, y, z); scene.add(c); return c; }
  function barZ(z0, z1, y, x, r, m) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, z1 - z0, 10), m); c.rotation.x = Math.PI / 2; c.position.set(x, y, (z0 + z1) / 2); scene.add(c); return c; }
  const cutables = [];
  function grp(kind, h) { const g = new THREE.Group(); g.userData = { kind: kind, h: h || FULL_H }; scene.add(g); if (kind) cutables.push(g); return g; }

  /* paredes del dormitorio */
  const wallGroup = new THREE.Group(); scene.add(wallGroup);
  const wallDefs = [
    { x0: -0.15, x1: 3.2, z0: -0.15, z1: 0, op: [[0.6, 2.4, 0, 2.2]] },
    { x0: -0.15, x1: 0, z0: -0.15, z1: 3.7, op: [] },
    { x0: 3.1, x1: 3.2, z0: -0.15, z1: 3.7, op: [[2.7, 3.5, 0, 2.05]] },
    { x0: -0.15, x1: 3.2, z0: 3.6, z1: 3.7, op: [] },
  ];
  function buildWalls(H) {
    while (wallGroup.children.length) { const c = wallGroup.children.pop(); c.geometry.dispose(); }
    for (const w of wallDefs) {
      const alongX = (w.x1 - w.x0) >= (w.z1 - w.z0), a0 = alongX ? w.x0 : w.z0, a1 = alongX ? w.x1 : w.z1;
      const seg = (s0, s1, y0, y1) => {
        const top = Math.min(y1, H); if (top - y0 < 0.005 || s1 - s0 < 0.005) return;
        const m = alongX ? box(s0, s1, y0, top, w.z0, w.z1, mat.wall, wallGroup) : box(w.x0, w.x1, y0, top, s0, s1, mat.wall, wallGroup);
        m.castShadow = m.receiveShadow = true;
        if (H < FULL_H && top === H) { alongX ? box(s0, s1, H, H + 0.006, w.z0, w.z1, mat.cap, wallGroup) : box(w.x0, w.x1, H, H + 0.006, s0, s1, mat.cap, wallGroup); }
      };
      let cur = a0;
      for (const o of w.op.slice().sort((p, q) => p[0] - q[0])) { seg(cur, o[0], 0, FULL_H); seg(o[0], o[1], 0, o[2]); seg(o[0], o[1], o[3], FULL_H); cur = o[1]; }
      seg(cur, a1, 0, FULL_H);
    }
  }
  const ceil = box(-0.15, 3.2, 2.6, 2.75, -0.15, 3.7, mat.shadowOnly); ceil.castShadow = true; ceil.userData.noShadowFix = true;
  { const cg = grp('hide'); const cv = box(0, 3.1, 2.6, 2.61, 0, 3.6, M(0xf7f6f3, { roughness: 1 }), cg); cv.userData.noCast = true; }

  /* piso, edificio y balcón */
  box(0, 3.1, -0.06, 0, 0, 3.6, texMat(TX.floor, 3.1 / 0.8, 3.6 / 0.8, 0.22));
  box(-0.15, 3.2, -11.6, -0.06, -0.15, 3.7, mat.facade);
  for (let k = 1; k <= 3; k++) {
    const y = -2.9 * k;
    box(-0.15, 3.2, y - 0.15, y, -1.4, -0.15, mat.stone); box(-0.15, 3.2, y, y + 1.0, -1.4, -1.3, mat.stone);
    box(0.6, 2.4, y, y + 2.2, -0.17, -0.15, mat.darkGlass);
  }
  box(-0.15, 3.2, -0.18, -0.02, -1.4, -0.15, texMat(TX.balcony, 3.35 / 0.45, 1.25 / 0.45, 0.8));
  box(-0.15, 3.2, -0.02, 0.1, -1.4, -1.3, mat.stone);
  for (let x = -0.1; x <= 3.2; x += 0.775) box(x - 0.02, x + 0.02, 0.1, 1.0, -1.37, -1.33, mat.rail);
  for (let y = 0.18; y <= 0.95; y += 0.1) { barX(-0.15, 3.2, y, -1.35, 0.008, mat.rail); barZ(-1.4, -0.15, y, -0.1, 0.008, mat.rail); barZ(-1.4, -0.15, y, 3.15, 0.008, mat.rail); }
  barX(-0.15, 3.2, 1.0, -1.35, 0.022, mat.rail);

  /* ventanal */
  (function slider(a0, a1, h, n) {
    const g = grp('scale', h), zc = -0.075, d = 0.07;
    box(a0, a1, 0, 0.05, zc - d / 2, zc + d / 2, mat.alu, g); box(a0, a1, h - 0.06, h, zc - d / 2, zc + d / 2, mat.alu, g);
    box(a0, a0 + 0.05, 0, h, zc - d / 2, zc + d / 2, mat.alu, g); box(a1 - 0.05, a1, 0, h, zc - d / 2, zc + d / 2, mat.alu, g);
    const pw = (a1 - a0 - 0.1) / n;
    for (let i = 0; i < n; i++) {
      const p0 = a0 + 0.05 + i * pw, p1 = p0 + pw, zz = zc + (i % 2 ? 0.016 : -0.016);
      const gl = box(p0 + 0.03, p1 - 0.03, 0.08, h - 0.09, zz - 0.004, zz + 0.004, mat.glass, g); gl.userData.noCast = true;
      box(p0, p0 + 0.035, 0.05, h - 0.06, zz - 0.012, zz + 0.012, mat.alu, g); box(p1 - 0.035, p1, 0.05, h - 0.06, zz - 0.012, zz + 0.012, mat.alu, g);
      box(p0, p1, 0.05, 0.09, zz - 0.012, zz + 0.012, mat.alu, g); box(p0, p1, h - 0.1, h - 0.06, zz - 0.012, zz + 0.012, mat.alu, g);
    }
    const top = grp('hide'); box(a0 - 0.08, a1 + 0.08, 2.28, 2.6, 0, 0.22, mat.wall, top);
  })(0.6, 2.4, 2.2, 2);

  /* puerta */
  { const g = grp('scale', 2.05); box(2.32, 3.1, 0, 2.03, 3.455, 3.495, mat.wood, g); cyl(2.42, 0.98, 1.02, 3.43, 0.012, mat.steel, g); }

  /* dormitorio */
  {
    const g = grp();
    box(0, 2.0, 0, 0.32, 0.95, 2.55, mat.white, g);
    box(0.02, 1.98, 0.32, 0.55, 0.97, 2.53, mat.linen, g);
    box(0.75, 2.05, 0.24, 0.6, 0.92, 2.58, mat.navy, g);
    ell(0.25, 0.64, 1.36, 0.15, 0.09, 0.3, mat.linen, g); ell(0.25, 0.64, 2.14, 0.15, 0.09, 0.3, mat.linen, g);
    ell(0.45, 0.68, 1.5, 0.06, 0.12, 0.17, mat.cushDark, g); ell(0.45, 0.68, 2.0, 0.06, 0.12, 0.17, mat.cushDark, g);
    box(1.5, 1.78, 0.6, 0.73, 1.62, 1.98, mat.towel, g);
    box(0, 0.4, 0.45, 0.6, 2.62, 2.95, mat.woodLight, g); box(0.4, 0.405, 0.47, 0.58, 2.64, 2.93, mat.white, g);
    box(2.15, 2.95, 0, 0.012, 0.4, 1.8, texMat(TX.rug, 3, 1, 1), g);
    const w = grp('scale', 2.45);
    box(0, 1.9, 0, 2.45, 3.0, 3.6, mat.white, w);
    box(0.945, 0.955, 0.03, 2.42, 2.994, 3.0, mat.steelDark, w); box(0, 1.9, 2.42, 2.45, 2.99, 3.0, mat.steel, w);
    const h = grp('hide');
    box(1.3, 1.7, 2.52, 2.6, 1.7, 1.9, mat.black, h); cyl(1.4, 2.515, 2.525, 1.8, 0.05, mat.glow, h); cyl(1.6, 2.515, 2.525, 1.8, 0.05, mat.glow, h);
  }

  /* entorno */
  box(-150, 150, -11.65, -11.6, -150, 150, mat.ground);
  box(-150, 150, -11.59, -11.57, -22, -8, mat.asphalt);
  for (let x = -10; x <= 18; x += 4.5) { cyl(x, -11.6, -9.4, -6.6, 0.12, mat.trunk); ell(x, -8.6, -6.6, 1.4, 1.2, 1.4, mat.leaf); }
  box(-12, 22, -11.6, -6.5, -48, -26, M(0xbfc3c7));
  let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const pal = [0xdcd6cb, 0xcfd3d6, 0xe3ddd2, 0xc7c2b8, 0xd6dadc];
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, d = 30 + r() * 50, x = 3 + Math.cos(a) * d, z = 3 + Math.sin(a) * d;
    if (z < -20 && z > -52 && x > -16 && x < 26) continue;
    const w = 6 + r() * 10, dp = 6 + r() * 10, hh = -6 + r() * 22;
    box(x - w / 2, x + w / 2, -11.6, hh, z - dp / 2, z + dp / 2, M(pal[i % pal.length]));
  }

  /* luces (mismos valores que el original) */
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb9b3a8, 0.5); scene.add(hemi);
  const amb = new THREE.AmbientLight(0xffffff, 0.24); scene.add(amb);
  const sun = new THREE.DirectionalLight(0xfff1dc, 0.9);
  sun.position.set(1.55 + 9.4, 10, 1.8 - 11); sun.target.position.set(1.55, 0, 1.8); scene.add(sun); scene.add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 45 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  const lamp = new THREE.PointLight(0xffd8a8, 0, 7, 2); lamp.position.set(1.5, 2.3, 1.8); scene.add(lamp);
  scene.traverse(o => { if (o.isMesh && !o.userData.noShadowFix) { o.receiveShadow = true; o.castShadow = !(o.material.transparent || o.userData.noCast); } });

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  let night = false;
  function applyBg() { const c = new THREE.Color(night ? '#0f141c' : (cssVar('--sky') || '#dfe7ee')); scene.background = c; scene.fog = new THREE.Fog(c, 45, 130); }
  function setCut(v) {
    buildWalls(v ? CUT_H : FULL_H);
    for (const g of cutables) {
      if (g.userData.kind === 'hide') g.visible = !v;
      else if (g.userData.kind === 'scale') g.scale.y = v ? Math.min(1, CUT_H / g.userData.h) : 1;
    }
  }
  function setNight(v) {
    night = v; hemi.intensity = v ? 0.08 : 0.5; amb.intensity = v ? 0.06 : 0.24; sun.intensity = v ? 0 : 0.9;
    lamp.intensity = v ? 1.25 : 0; mat.glow.emissiveIntensity = v ? 1.2 : 0.15; applyBg();
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let fly = null;
  function setPose(p) { camera.position.fromArray(p.p); controls.target.fromArray(p.t); camera.fov = p.f; camera.updateProjectionMatrix(); controls.update(); fly = null; }
  function go(name, instant) {
    const v = VIEWS[name], to = { p: v.pos, t: v.target, f: v.fov };
    if (instant || reduce) return setPose(to);
    fly = { from: { p: camera.position.clone(), t: controls.target.clone(), f: camera.fov }, to: { p: new THREE.Vector3().fromArray(to.p), t: new THREE.Vector3().fromArray(to.t), f: to.f }, start: performance.now(), dur: 1100 };
  }
  controls.addEventListener('start', () => { fly = null; });

  function resize() { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  let raf = 0, frames = 0, fps = 0, last = performance.now();
  function loop(now) {
    if (fly) {
      const k = Math.min(1, (now - fly.start) / fly.dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.lerpVectors(fly.from.p, fly.to.p, e); controls.target.lerpVectors(fly.from.t, fly.to.t, e);
      camera.fov = fly.from.f + (fly.to.f - fly.from.f) * e; camera.updateProjectionMatrix(); if (k === 1) fly = null;
    }
    controls.update(); renderer.render(scene, camera);
    frames++; if (now - last > 500) { fps = Math.round(frames * 1000 / (now - last)); frames = 0; last = now; }
    raf = requestAnimationFrame(loop);
  }

  setCut(state.cut); setNight(state.night);
  if (state.pose) setPose(state.pose); else go(state.view, true);
  raf = requestAnimationFrame(loop);

  return {
    go: go, setCut: setCut, setNight: setNight, setDecor: function () {}, setPose: setPose,
    getPose: () => ({ p: camera.position.toArray(), t: controls.target.toArray(), f: camera.fov }),
    stats() {
      let tris = 0, meshes = 0;
      scene.traverse(o => { if (!o.isMesh) return; meshes++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; });
      return { tris: tris, meshes: meshes, fps: fps, quality: 'única' };
    },
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
})();
