# Prompt para la próxima sesión: estética y rendimiento

Copiar desde la línea de abajo y pegarlo en una sesión nueva en esta carpeta (`C:\Users\juanp\Desktop\3D`).

---

Seguimos con la skill de departamentos en 3D (leé `SKILL.md`, `TICKETS.md` y la memoria antes de tocar nada).
Lo de entregar y publicar ya está resuelto (el sitio y los QR andan con datos móviles); ahora vamos a **estética y
rendimiento, puliendo solo el depto 5** (Departamento demo, `departamentos/depto5/`, fotos en `departamento5-png/`): que se
vea mejor, más parecido a sus fotos y que cargue y ande fluido, sobre todo en el celular. Los deptos 1, 2, 4 y San
Nicolás quedan de lado por ahora: no los pulas, pero los cambios de motor siguen siendo generales y se corre la
verificación de los cinco para no romperlos. Trabajá en tandas sin pararme en cada ticket.

## Dónde está todo

- Motor fijo: `motor/engine.js`, componentes `motor/components.js` (ficha `META` por componente), claves válidas en
  `motor/validate.js`. Cada depto es solo `departamentos/<id>/scene.json` (depto1, depto2, depto4, sannicolas, depto5).
- Servidor local: `preview_start` con `visor` de `.claude/launch.json` (suele quedar en el puerto **5181** porque el 5180
  está ocupado). Visor: `/motor/visor.html?scene=/departamentos/<id>/scene.json&dev`.
- Verificación obligatoria tras cualquier cambio de motor: `/motor/verificar.html?deptos=depto1,depto2,depto4,sannicolas,depto5`
  (compara contra `capturas/verificacion/base/`; `&base=1` solo si el cambio es bueno) y `node motor/catalogo.mjs`.
- Comparar con las fotos: `comparar.html?…&capturar=<id>` (hojas) y `&medir=<carpeta>` (puntaje ΔE, más bajo es mejor).
  Cerca de una pieza: `pruebas/cerca.html`.
- Publicado en internet: **https://recorrelo3d.pages.dev/<carpeta>/** (Cloudflare Pages del usuario). Carpetas fijas en
  `publicar.json` (los QR impresos apuntan ahí: no cambiarlas). `node motor/publicar.mjs` arma `sitio/` y el usuario lo
  sube entero con "Create new deployment". También hay artifacts privados viejos de cada depto (links en TICKETS).
- Entrega al cliente = solo recorrido 3D, videos (`motor/video.html`, `&formato=vertical`) y tarjeta con QR
  (`motor/kit.mjs <id>`). Carta de presentación del servicio: `presentacion/carta.html`.

## Reglas (del usuario, no negociables)

- Cambios de motor generales, nada de parches para un departamento; lo que es solo ambientación va con `"decor": true`.
- Piezas sin caras compartidas (el usuario ve el parpadeo de cerca), nada flotando, 60 cm de circulación,
  `warnings` vacío. Nada que se prenda, se apague o cambie de calidad a la vista mientras se camina.
- Luz: no cambiar los valores por defecto sin preguntar (T-28 figura "espera aprobación" en TICKETS aunque SKILL.md
  los da por aprobados: confirmalo con el usuario antes de tocar la luz).
- Nada de fotos reales en las ventanas (se quitó T-20/T-35 a propósito): las ventanas muestran el entorno generado.
- No editar con Get-Content/Set-Content de PowerShell (rompe los acentos): Edit/Write o scripts de node; scripts
  temporales en el scratchpad de la sesión.
- **Preguntar antes de publicar o republicar** (artifacts o el sitio), de descargar archivos y de instalar dependencias.
- Todo lo visible, en español. La dirección exacta de un depto no va en nada público: como mucho el barrio.
- El panel del navegador suele estar oculto: `innerWidth` da 0 y `requestAnimationFrame` no corre (T-33); capturar por
  data URL. La extensión de Chrome no estaba conectada: se usó el navegador integrado.

## Qué se ve flojo hoy (estética)

1. **Paredes más frías/grises que en las fotos**; depende de la luz (ver la regla de T-28).
2. **Encuadres** (T-34): las fotos son gran angular 0,5× y varias vistas quedan aproximadas (living1, living2, la mesa
   para dos). Puntaje de parecido actual 11,5 (`capturas/depto5/parecido.json`).
3. **Divisor de vidrio**: el travesaño bajo se ve punteado mirado muy en ángulo (posible ruido de la oclusión
   ambiental). Ojo: sacarle la sombra al vidrio lo dejaba durazno y opaco; ya se volvió atrás.
4. **Baño** (T-36): vanitory sin la bacha de loza apoyada y cortina sin volado.
5. **Vista por las ventanas** (T-38): calle angosta arbolada con edificios de 8–11 pisos enfrente (fachada al
   noroeste, rumbo 319°); hoy se ve genérica.
6. Texturas y estampados (T-23/T-24) que todavía no pasan.
Después de pulir: regenerar los videos (`video.html`, horizontal y vertical, y sus livianos), la portada y la tarjeta
(`exportar.html&portada=living1&url=https://recorrelo3d.pages.dev/departamento-prueba/`, `kit.mjs depto5`) y el sitio
(`publicar.mjs`; preguntar antes de que el usuario lo suba).

## Rendimiento (pendiente)

1. **T-11**: el rendimiento en celular nunca se probó en un teléfono real; medir carga y cuadros por segundo.
2. **Motor compartido en el sitio**: hoy cada depto publicado lleva su copia de engine/components/validate (≈280 KB y 3
   archivos). Una sola copia compartida en `sitio/` = menos peso, mejor caché y ~500 deptos por subida arrastrando
   (límite de 1.000 archivos) en vez de ~160. Contra: un error de motor llega a todos (verificar siempre antes).
3. **three.js desde jsDelivr**: llevarlo adentro del paquete (T-17) implica descargarlo: pedir permiso.
4. Peso y tiempo de carga del visor publicado (components.js ≈ 181 KB, engine.js ≈ 78 KB sin minificar).

## Decisiones que esperan al usuario

- Los deptos 1, 2, 4 y San Nicolás quedan de lado (decisión del 2026-11-04) pero siguen en recorrelo3d.pages.dev;
  falta decidir si se sacan del sitio (son anuncios ajenos; el título del depto 2 dice "Corrientes y Callao"). El
  depto 5 es la muestra de la carta (también es un anuncio ajeno: lo ideal es permiso del dueño o una demo propia).
- Republicar los artifacts privados viejos (siguen con fotos por la ventana y el depto 5 con el divisor durazno).
- Página 404 propia en el sitio y copia de seguridad del proyecto (no hay git; ofrecí `git init` local).
- Línea de contacto de la carta de presentación (está vacía) y si "Recorrelo 3D" es la marca (hoy el scene no tiene `brand`).

Al terminar cada tanda: verificación de los cinco deptos, notas en TICKETS (tickets nuevos al final) y un resumen
corto en español de qué cambió, cómo se ve antes y después (láminas en `capturas/`) y qué quedó pendiente.
