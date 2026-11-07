// Prueba de piezas sueltas (T-26), para pruebas/piezas.html y verificar.html.
// Arma cada componente con sus valores por defecto, con cada valor de texto que compara ("p.style === 'tube'") y con
// cada combinación de parámetros que usan los departamentos, y devuelve las variantes con piezas sueltas. Además rompe
// a propósito una silla (una pata 5 cm más arriba) para comprobar que el control avisa.
import { COMPONENTS, META, makeMaterials } from '../components.js';
import { loosePieces } from '../validate.js';

export async function revisarPiezas({ tipo = null } = {}) {
  const src = await (await fetch('/motor/components.js')).text();
  const M = makeMaterials('premium'), H = 2.6, variants = new Map();
  const addV = (t, label, params) => {
    const l = variants.get(t) ?? [];
    if (!l.some(v => JSON.stringify(v.params) === JSON.stringify(params))) l.push({ label, params });
    variants.set(t, l);
  };
  for (const [t, fn] of Object.entries(COMPONENTS)) {
    if (tipo && tipo !== t) continue;
    addV(t, 'por defecto', {});
    const i = src.indexOf(`function ${fn.name}(`), j = src.indexOf('\nfunction ', i + 10), body = src.slice(i, j < 0 ? undefined : j);
    for (const [, k, v] of body.matchAll(/p\.(\w+)(?: \?\? '[\w-]+'\))? === '([\w-]+)'/g)) addV(t, `${k}: ${v}`, { [k]: v });
  }
  // parámetros que no son de texto y cambian la forma (no los encuentra la búsqueda de arriba)
  const extra = { 'shower-curtain': [{ return: 0.8 }], 'shower': [{ cladding: '#9d9893' }], 'desk': [{ drawers: 1 }, { style: 'panels', drawers: -1 }],
    'bookshelf': [{ books: 'some' }, { books: false }], 'bunk-bed': [{ ladder: -1 }], 'tabletop-decor': [{ items: ['vase', 'books', 'bowl', 'candle', 'plant'] }],
    'floor-lamp': [{ style: 'arc', reach: 1.4 }] };
  for (const [t, list] of Object.entries(extra)) if (!tipo || tipo === t) list.forEach(v => addV(t, JSON.stringify(v), v));
  for (const id of await (await fetch('/api/deptos')).json()) {
    const s = await fetch(`/departamentos/${id}/scene.json`).then(r => r.json());
    for (const Lv of [s, ...(s.levels ?? [])]) for (const it of Lv.items ?? []) {
      if (!COMPONENTS[it.type] || (tipo && tipo !== it.type)) continue;
      addV(it.type, `${id} [${it.at.join(', ')}]`, it.params ?? {});
    }
  }
  const filas = []; let total = 0;
  for (const [t, list] of variants) for (const v of list) {
    total++;
    let sueltas;
    try { sueltas = loosePieces(COMPONENTS[t](v.params, { M, H }), META[t], H); } catch (e) { sueltas = [{ error: e.message }]; }
    if (sueltas.length) filas.push({ tipo: t, variante: v.label, params: v.params, sueltas });
  }
  // control del control: una silla con una pata corrida tiene que dar aviso
  const rota = COMPONENTS.chair({}, { M, H }), pata = rota.children.find(o => o.isMesh && o.geometry.type === 'CylinderGeometry');
  pata.position.x += 0.1 * Math.sign(pata.position.x);   // la pata queda parada en el piso, fuera del asiento
  const detectaRota = loosePieces(rota, META.chair, H).length > 0;
  return { total, componentes: variants.size, filas, detectaRota };
}
