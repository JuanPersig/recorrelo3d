// Kit de entrega para el dueño (T-19): node motor/kit.mjs <id>
// La presentación es el recorrido 3D y la tarjeta con QR; nada más (las imágenes sueltas no suman frente al modelo).
// Lee departamentos/<id>/scene.json y lo que ya dejó exportar.html (links.json, qr.png, portada.jpg) en entregas/<id>/,
// y escribe:
//   index.html   página de la entrega: abrir el recorrido 3D y el QR
//   tarjeta.html tarjeta de bienvenida con el QR que lleva al recorrido, para imprimir
// Sin marca, la entrega sale neutra; con "brand" en el scene ({ name, url, color }) lleva el nombre y el color.
import fs from 'fs';
import path from 'path';

const id = process.argv[2];
if (!id) { console.error('Uso: node motor/kit.mjs <id>'); process.exit(1); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const dir = path.join(root, 'entregas', id), scene = JSON.parse(fs.readFileSync(path.join(root, 'departamentos', id, 'scene.json'), 'utf8'));
const links = fs.existsSync(path.join(dir, 'links.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'links.json'), 'utf8')) : {};
const files = fs.readdirSync(dir);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const has = f => files.includes(f);

const brand = scene.brand ?? null, accent = brand?.color ?? '#2f5d50', title = scene.name ?? 'Departamento';
const test = !links.link || /ejemplo/.test(links.link);
// el botón abre el recorrido publicado; mientras el link sea de prueba, el paquete local de dist/
const tour = test ? `/dist/${id}/index.html` : links.link;
const cardText = 'Escaneá el código y recorré el departamento en 3D: dónde está cada cosa, de día y de noche.';

const css = `
:root{ --bg:#f6f4ef; --card:#ffffff; --ink:#1f2328; --muted:#5f6670; --line:#e4e0d8; --accent:${accent}; --soft:#ece8df }
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){ --bg:#17191c; --card:#202327; --ink:#eceae6; --muted:#a3a8ae; --line:#33373c; --soft:#2a2d31 } }
*{ box-sizing:border-box } html{ -webkit-text-size-adjust:100% }
body{ margin:0; background:var(--bg); color:var(--ink); font:16px/1.5 system-ui,"Segoe UI",Roboto,sans-serif }
a{ color:var(--accent) } img{ max-width:100%; display:block }
.wrap{ max-width:1080px; margin:0 auto; padding:0 16px }
h1,h2,h3{ line-height:1.2; margin:0 0 .4em } h2{ font-size:1.35rem; margin-top:0 } .muted{ color:var(--muted) }
section{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:20px; margin:16px 0 }
.btn{ display:inline-flex; align-items:center; gap:.4em; background:var(--accent); color:#fff; text-decoration:none; border:0; border-radius:10px; padding:.65em 1em; font:600 .95rem system-ui,sans-serif; cursor:pointer }
.btn.alt{ background:var(--soft); color:var(--ink) } .row{ display:flex; flex-wrap:wrap; gap:8px; align-items:center }
.tag{ display:inline-block; font-size:.78rem; background:var(--soft); color:var(--muted); border-radius:999px; padding:.15em .6em }
`;
const head = (t, extra = '') => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t)}</title><style>${css}${extra}</style></head><body>`;

// página de la entrega
const index = head(`${title} · recorrido 3D`, `
header.hero{ background:linear-gradient(160deg,var(--accent),#1d2a27); color:#fff; padding:36px 0 30px }
header.hero .wrap{ display:flex; flex-direction:column; gap:10px } header.hero .tag{ align-self:flex-start } header.hero p{ margin:0; opacity:.9; max-width:62ch }
header.hero .btn{ background:#fff; color:#1d2a27 } header.hero .btn.alt{ background:rgba(255,255,255,.16); color:#fff }
.share{ display:grid; gap:16px; grid-template-columns:1fr 200px; align-items:center }
.qr{ background:#fff; padding:12px; border-radius:12px; border:1px solid var(--line); text-align:center; color:#1f2328 } .qr img{ width:170px; margin:0 auto }
.note{ background:var(--soft); border-radius:12px; padding:10px 12px; font-size:.92rem }
@media (max-width:720px){ .share{ grid-template-columns:1fr } .qr{ justify-self:center } section{ padding:16px } header.hero{ padding:28px 0 22px } }
`) + `
<header class="hero"><div class="wrap">
  <span class="tag" style="background:rgba(255,255,255,.18);color:#fff">${brand?.name ? `Presentado por ${esc(brand.name)}` : 'Recorrido 3D'}</span>
  <h1>${esc(title)}</h1>
  <p>${esc(scene.about ?? '')}</p>
  <div class="row"><a class="btn" href="${esc(tour)}">Abrir el recorrido 3D</a>${has('qr.png') ? '<a class="btn alt" href="tarjeta.html">Tarjeta con QR</a>' : ''}</div>
</div></header>
<main class="wrap">
${has('qr.png') ? `<section><h2>Tarjeta de bienvenida</h2><div class="share"><div>
  <p class="muted">Imprimila y dejala en la mesa o la heladera: el huésped escanea el QR y recorre el departamento en 3D desde el celular.</p>
  <div class="row"><a class="btn" href="tarjeta.html">Abrir la tarjeta para imprimir</a><a class="btn alt" href="qr.png" download>Bajar el QR</a></div>
  ${test ? '<p class="note" style="margin-top:12px">El QR es <b>de prueba</b> hasta publicar el recorrido: cuando esté en línea se regenera con el link definitivo.</p>' : ''}
</div><div class="qr"><img src="qr.png" alt="Código QR del recorrido"><div style="font-size:.85rem;margin-top:6px">Recorrido 3D${test ? ' · link de prueba' : ''}</div></div></div></section>` : ''}
<p class="muted" style="text-align:center;font-size:.85rem;margin:24px 0">El recorrido es una representación aproximada hecha a partir de las fotos del departamento.</p>
</main></body></html>`;
fs.writeFileSync(path.join(dir, 'index.html'), index);

// tarjeta de bienvenida (A6 apaisada), con la portada del recorrido si exportar.html la dejó
const tarjeta = head(`${title} · tarjeta de bienvenida`, `
@page{ size:148mm 105mm; margin:0 } body{ background:#e9e6df; display:grid; place-items:center; min-height:100vh; padding:16px }
.card{ width:min(100%,560px); aspect-ratio:148/105; background:#fff; color:#1f2328; border-radius:14px; overflow:hidden; display:grid; grid-template-columns:${has('portada.jpg') ? '1.1fr 1fr' : '1fr'}; box-shadow:0 10px 30px rgba(0,0,0,.12) }
.card .ph{ background:#ddd center/cover no-repeat } .card .tx{ padding:18px; display:flex; flex-direction:column; justify-content:space-between }
.card h1{ font-size:1.05rem; margin:0 } .card p{ font-size:.82rem; margin:.4em 0; color:#4b525a } .card img{ width:44%; max-width:130px }
.noprint{ position:fixed; top:10px; left:12px; font-size:.9rem } @media print{ body{ background:#fff; padding:0 } .card{ box-shadow:none; border-radius:0; width:148mm } .noprint{ display:none } }
@media (max-width:420px){ .card{ grid-template-columns:1fr; aspect-ratio:auto } .card .ph{ min-height:160px } }
`) + `<p class="noprint"><a href="index.html">← Volver</a> · <a href="#" onclick="print();return false">Imprimir</a></p>
<div class="card">${has('portada.jpg') ? `<div class="ph" style="background-image:url('portada.jpg')"></div>` : ''}<div class="tx">
<div><h1>¡Bienvenido!</h1><p>${esc(cardText)}</p></div>
${has('qr.png') ? '<img src="qr.png" alt="Código QR del recorrido">' : ''}
<p style="font-size:.72rem">${esc(title)}${brand?.name ? ` · ${esc(brand.name)}` : ''}</p></div></div></body></html>`;
fs.writeFileSync(path.join(dir, 'tarjeta.html'), tarjeta);
console.log(`Kit listo en entregas/${id}/: index.html y tarjeta.html (${has('qr.png') ? 'QR' : 'sin QR'}${has('portada.jpg') ? ', portada' : ''})`);
