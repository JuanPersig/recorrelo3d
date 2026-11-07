// JSON con posiciones, para editar un scene.json en su lugar sin reformatearlo (lo usan colores.mjs y texturas.mjs)
// JSON con posiciones: cada valor guarda dónde empieza y termina en el texto
export function parse(s) {
  let i = 0;
  const ws = () => { while (/\s/.test(s[i])) i++; };
  const val = () => {
    ws(); const start = i, c = s[i];
    if (c === '{') {
      i++; const props = []; ws();
      if (s[i] === '}') { i++; return { t: 'obj', props, start, end: i }; }
      for (;;) { ws(); const k = val(); ws(); i++; const v = val(); props.push({ key: k.v, v }); ws(); if (s[i] === ',') { i++; continue; } i++; return { t: 'obj', props, start, end: i }; }
    }
    if (c === '[') {
      i++; const items = []; ws();
      if (s[i] === ']') { i++; return { t: 'arr', items, start, end: i }; }
      for (;;) { items.push(val()); ws(); if (s[i] === ',') { i++; continue; } i++; return { t: 'arr', items, start, end: i }; }
    }
    if (c === '"') { i++; let v = ''; while (s[i] !== '"') { if (s[i] === '\\') { v += s[i + 1]; i += 2; } else v += s[i++]; } i++; return { t: 'str', v, start, end: i }; }
    const m = /^(-?\d+(\.\d+)?([eE][+-]?\d+)?|true|false|null)/.exec(s.slice(i)); i += m[0].length;
    return { t: 'lit', v: JSON.parse(m[0]), start, end: i };
  };
  return val();
}
export const get = (o, k) => o?.t === 'obj' ? o.props.find(p => p.key === k)?.v : undefined;
// todos los strings dentro de un nodo cuyo valor es "color" (sin importar mayúsculas)
export const findColor = (node, color, out = []) => {
  if (!node) return out;
  if (node.t === 'str' && node.v.toLowerCase() === color.toLowerCase()) out.push(node);
  for (const p of node.props ?? []) findColor(p.v, color, out);
  for (const it of node.items ?? []) findColor(it, color, out);
  return out;
};
