// Arma la carpeta publicable de un departamento: node motor/empaquetar.mjs depto2
// Resultado en dist/<depto>/: index.html (el visor con el nombre del departamento), engine.js, components.js,
// validate.js y scene.json
// El scene.json publicado va sin lo interno (nota de producción, lista de estimados, orientación, ids de las fotos):
// lo puede leer cualquiera que abra el link.
import { readFile, writeFile, mkdir, copyFile, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const id = process.argv[2];
if (!id) { console.error('Uso: node motor/empaquetar.mjs <depto>'); process.exit(1); }
const root = new URL('..', import.meta.url), motor = new URL('./', import.meta.url);
const src = new URL(`departamentos/${id}/scene.json`, root), out = new URL(`dist/${id}/`, root);

const scene = JSON.parse(await readFile(src, 'utf8'));
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const page = (await readFile(new URL('visor.html', motor), 'utf8')).replace(/<title>.*?<\/title>/, `<title>${esc(scene.name ?? 'Departamento en 3D')}</title>`);

await mkdir(out, { recursive: true });
await writeFile(new URL('index.html', out), page);
for (const f of ['engine.js', 'components.js', 'validate.js']) await copyFile(new URL(f, motor), new URL(f, out));
const pub = { ...scene };
for (const k of ['note', 'estimated', 'orientation', 'photos']) delete pub[k];
// el motor solo necesita saber que la vista tiene foto (para el campo de visión), no cuál es
pub.views = Object.fromEntries(Object.entries(scene.views).map(([k, v]) => [k, v.photo ? { ...v, photo: true } : v]));
if (!pub.about) console.warn(`Aviso: ${id} no tiene "about"; el visor publicado no va a mostrar descripción.`);
await writeFile(new URL('scene.json', out), JSON.stringify(pub, null, 2) + '\n');
// texturas de imagen (T-23, T-24): las que nombra el scene, desde departamentos/<id>/
const vdir = new URL(`departamentos/${id}/`, root);
const texs = new Set();
for (const L of [scene, ...(scene.levels ?? [])]) {
  for (const r of L.rooms ?? []) if (r.floor?.texture) texs.add(r.floor.texture);
  for (const it of L.items ?? []) { if (it.params?.texture) texs.add(it.params.texture); for (const t of Object.values(it.params?.textures ?? {})) texs.add(t.src ?? t); }
}
for (const t of texs) { await mkdir(new URL('.', new URL(t, out)), { recursive: true }); await copyFile(new URL(t, vdir), new URL(t, out)); }
if (texs.size) console.log(`Texturas: ${texs.size}`);
console.log('Listo:', fileURLToPath(out));
