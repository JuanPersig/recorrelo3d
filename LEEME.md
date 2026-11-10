# Recorrelo 3D · leer al empezar una sesión

Fotos de un departamento → `scene.json` → recorrido 3D en el navegador (Three.js). Público: anfitriones e
inmobiliarias. Cómo modelar un depto nuevo: `SKILL.md`. Historial de cambios: `TICKETS.md`. Todo lo visible, en español
rioplatense. Git con copia en GitHub privado (https://github.com/JuanPersig/recorrelo3d): commitear al cerrar cada
tanda; `git push` lo corre el usuario (el permiso automático frena la subida desde Claude).

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `motor/` | `engine.js` (escena, luz, posproceso, cámara), `components.js` (catálogo de piezas y materiales), `validate.js`, `visor.html` y herramientas (`verificar`, `hornear`, `generar-texturas`, `comparar`, `exportar`, `plano`, `colores`, `encuadre`, `telas`, `texturas`) |
| `motor/texturas/` | texturas del motor pre-generadas (WebP + `indice.js`); se rehacen con `motor/generar-texturas.html` |
| `motor/pruebas/` | páginas de prueba: `materiales.html` (laboratorio de materiales), `entorno.html`, `rebote.html`, `cerca.html`, muestras para elegir (`maderas.html`, `lente.html`, `telas-luz.html`) |
| `departamentos/<id>/scene.json` | lo único que cambia por depto: `depto5` (demo) y `depto6` (depto grande, en curso; los otros cuatro se borraron el 2026-11-08: están en el historial de git) |
| `fotos/<id>/` | PNG que usan las vistas; `fotos/<id>/original/` las originales |
| `muestras/` | escenas de la rueda de la landing (fotos de Pexels), fuera de la verificación |
| `capturas/` | hojas de comparación por depto, línea base de `verificar.html`, `entorno/` (pruebas del entorno), imágenes de la landing |
| `entregas/depto5/` | kit del dueño: `index.html` + `tarjeta.html` con QR (`node motor/kit.mjs depto5`) |
| `dist/`, `sitio/` | se regeneran (`empaquetar.mjs`, `publicar.mjs`); no van a git |
| `presentacion/carta.html` | carta del servicio con QR al recorrido de muestra |
| `comercial/` | planillas de administradoras de temporarios |

- **Landing** (React + Vite): `C:\Users\juanp\Desktop\LANDING_PAGE_RECORRELO3D`, `npm run build` ahí;
  `node motor/publicar.mjs` copia su `dist/` a la raíz de `sitio/`.
- **Sitio público:** https://recorrelo3d.pages.dev (Cloudflare Pages). El usuario sube `sitio/` entera. Carpetas fijas en
  `publicar.json`; `palermo-chico-q7q3` redirige a `departamento-prueba` por un QR impreso: no tocar.
- **Artifact privado del depto 5:** https://claude.ai/artifact/GvmujzWsuucQ8GepG3rekX (desde `dist/depto5/`).

## Estado del motor (2026-11-09)

Hecho y aprobado en las tandas del 7 y 8 de noviembre (detalle en TICKETS.md, T-52 a T-59):
- **Limpieza** (T-52, T-58): sin videos; solo queda el depto demo; fotos en `fotos/<id>/`; git + GitHub.
- **Entorno urbano** (T-53): cuadra de enfrente y vecinos con relieve (ventanas, balcones, persianas, cornisas), árboles
  de vereda con hojas (copa corrida hacia la calle, sin meterse en balcones), faroles con luz suave, silueta lejana.
- **Pulido con la cámara quieta** (T-54): al frenar suma 24 cuadros (12 en celular): bordes lisos, sombras suaves.
- **Luz rebotada horneada** (T-55): `motor/hornear.html?id=<id>` → `departamentos/<id>/gi.json` y
  `"lighting": { "bake": "gi.json" }`; volver a hornear si cambian muebles o luz. Metales reflejan su ambiente.
- **Detalles** (T-56): espejos sin reflejo (pedido del usuario), inodoro/bidet sin franja oscura.
- **Generador de ramos** (T-57): `tabletop-decor` con dried-flowers, eucalyptus, pampas, wildflowers, vase, bottle-flowers.
- **Pantalla de carga** del visor como la de la landing (cuadrado verde que se transforma).
- **Materiales** (T-59): relieve real por familia (madera, pisos, telas, revoque de paredes, piedra), brillo variable,
  piezas distintas (`jitter`), variación de tono a escala de habitación, y texturas pre-generadas en `motor/texturas/`
  (el armado no se hizo más lento). Probado en iPhone: anda bien, solo tarda un poco en cargar.

Hecho en la tanda del depto grande (2026-11-08, T-60 a T-63; las lecciones de proceso están en SKILL.md, "Lecciones de
un depto cargado"):
- **Piezas nuevas:** `ladder-shelf`, `wire-shelf`, `kitchen-cart`, `medicine-cabinet`, `wall-shelf` (cubby, spice con
  luz, box), `washer`, `laundry-sink`. **Variantes:** `sofa` daybed (capitoné con botones, rulos, cajón), `chair`
  panel / spindle / stool, `dining-table` trestle, plank con patas de madera y `boards`, `tablecloth` (liso o tropical),
  `bookshelf` con `cabinet`, `crown` y stepped, `vanity` pedestal con `taps: "cross"`, `toilet` con válvula, `bathtub`
  con `faucet`, `kitchen-base` de madera con perillas, acero, doble bacha y canilla de pared, `kitchen-wall` con perillas,
  `curtains` con barral de madera, presillas, ruedo y `sheer` numérico, `ceiling-light` dome, `floor-fan` tower, cama
  con almohadones redondos y al crochet. **Objetos:** olla, cacerola, escurridor, frascos, canasto, caja, portarretratos,
  potus, organizador escalonado y flexo. **Aberturas:** puerta con media hoja vidriada o mirilla, ventana esmerilada con
  travesaños; balcón con baranda de paños, red y tabiques. **Materiales:** crochet, tropical, mimbre, hojas, acero cepillado.
- **Rendimiento:** lo decorativo se une por material en un grupo por nivel, y los materiales iguales salvo el color se
  unen con color por vértice. Depto 5: de 400–660 a 220–480 dibujos por vista con la misma imagen.
- **Vista general:** la bruma se mide desde el departamento (de lejos teñía el piso y los edificios en franjas) y no se
  puede alejar más que el encuadre de la vista × 1,15 (`ZOOM_OUT`).
- **Carga:** el motor no dibuja durante la precarga y el visor tapa todo hasta `api.ready`; la animación de carga es
  solo transform/opacity (no se traba).

Hecho en la tanda de fidelidad y madera (2026-11-08 por la tarde, T-64 y T-65; procedimientos en SKILL.md, "Fidelidad
y materiales: cómo trabajar"):
- **Pilares y plenos:** `structure` `column` lleva zócalo en cada cara que da a un ambiente; `api.plan()` pasa la
  estructura y `plano.html` la dibuja maciza como las paredes.
- **Comparar solo lo que cambió:** `comparar.html?…&view=a,b` saca solo esas hojas (~8 s por vista en vez de ~75 s
  todas).
- **Madera de muebles: roble con radios** (elegido por el usuario entre seis vetas): `oakAt(x, y)` en components.js
  genera color, relieve y brillo (`TEX.wood`, `woodN`, `woodPore`); `woodR` queda solo para los pisos. Página
  de muestras para comparar vetas o materiales nuevos: `motor/pruebas/maderas.html` (la fila 1 es la del motor).
- **Mimbre pre-generado** (`motor/texturas/wicker.webp`).
- Línea base de `verificar.html` actualizada con la cocina del depto 6 y la madera nueva.

Hecho en la tanda de casas (2026-11-08 a la noche; sirve para cualquier casa o departamento, referencia en SKILL.md):
- **Techo por ambiente** ("ceiling" de cada ambiente): "open" = a cielo abierto (patios, patios de luz: entra el sol);
  { "kind": "boards" } = machimbre; { "kind": "sheet", "beams" } = chapa con tirantes de madera (galerías, quinchos).
  Aceptan "height" (más bajo que el nivel) y "over" (rectángulos que techa: el alero). Lo abierto y la chapa salen de
  la losa del nivel, así desde afuera no queda una losa flotando.
- **Planta baja:** "exterior": { "floorsBelow": 0 } apoya la casa en el suelo (sin edificio debajo) y la vereda termina
  en la línea de frente.
- **Piso de pasto** ("floor": { "kind": "grass" }) pre-generado, y **plantas en la tierra** ("pot": false, con "leaves"
  y "spread" para matas); el control de distribución deja que la vegetación en tierra se toque y se apoye en paredes.
- **Piezas nuevas:** `ceiling-fan` (ventilador de techo con luz: globo, plato o tulipas; brilla de noche) y `grill`
  (parrilla de ladrillo con fogón, reja, campana escalonada y conducto de chapa).
- **Variantes:** mantel en la mesa ovalada ("tablecloth" en "shape": "oval"); respaldo de madera en la cama
  ("headboard": { "material": "wood" }); la tele encastra en una biblioteca (mueble de tele).
- **Rendimiento:** una textura nueva calculada al abrir (el pasto) llevó un armado de 4 a 28 s; pre-generada, volvió a 4.

Hecho en la tanda de render (2026-11-09, T-67 a T-69; a partir de un documento externo, `MEJORAS-MOTOR-RENDER.md`,
con el cruce completo de sus 18 puntos en T-67; todo general para cualquier depto):
- **Lente** (elegido "sutil" por el usuario): grano fino, esquinas 10 % más oscuras, medio píxel de aberración de color
  y resplandor de las luces solo de noche (de día vela la imagen). Va en la copia final, después del pulido; el grano
  depende de la pose de la cámara (la misma vista da siempre la misma imagen). `LENS` en engine.js,
  `"lighting": { "lens": {…} }` por depto, `visor.html?…&lente=no|brillo|sutil|marcado` para comparar.
- **Cortinas a contraluz** (elegido "medio"): con el sol detrás, la tela brilla con su color (`CURTAIN_LIGHT_DEFAULT`
  0,6; `lighting.curtainLight` por depto). De noche no cambia nada.
- **Arrugas del acolchado** (elegido "medio"): hundimientos y pliegues de 1,6 cm distintos por cama, la manta los sigue
  (`BEDDING.wrinkles`; `"wrinkles"` por cama, 0 = liso).
- **Sombras estables al moverse** (T-69): en la PC la oclusión ambiental ya no se apaga al caminar o hacer zoom; si no
  da abasto baja la resolución (100/80/65/50 %). `lighting.sunDisc`: disco del sol del pulido (0,012).
- **Ya estaban** (no hubo que hacer nada): tone mapping, PBR, relieve, luz horneada, GTAO, caída real de la luz,
  antialiasing, tono por tabla y piso con reflejo espejado en vivo. **No van:** cielo con fotos reales (HDRI) y
  desenfoque. **Del depto, no del motor:** sanitarios fieles, decoración y colores contra la foto.
- **Páginas de muestras** para elegir aspecto: `motor/pruebas/lente.html`, `telas-luz.html`; y
  `quieto-movil.html` (qué cambia entre la cámara en movimiento y quieta).

Hecho en el intento del dúplex (2026-11-09; el depto se borró a pedido del usuario, quedan solo sus fotos en
`departamento_dos_plantas/`; piezas generales del motor):
- **Escalera en L** con peldaños compensados al pie (`stair` con `turn`, `before`, `winders`, `beforeGo`, `rail`); el
  plano 2D la dibuja en L.
- **Puerta corrediza** colgada de riel (`"slide"` en una puerta; el plano la dibuja sobre la cara de la pared).
- **Ventanas:** `"fixed"` (paño fijo sin hojas) y `"fixedBelow"` (paño fijo abajo con hojas corredizas arriba).
- **Plano 2D:** marca "Calle" solo si se sabe dónde está (fachada indicada, balcón o paisaje).
- Lección en SKILL.md, "Errores que no se repiten" n.º 8: las paredes salen del plano; las fotos ubican aberturas y
  muebles; antes de juzgar la estructura, ubicar la cámara como en la foto.

## Servidores (`.claude/launch.json`)

`visor` :5180 (raíz del proyecto) · `sitio` :5183 (`sitio/` como Cloudflare) · `landing` :5184 (`npm run dev`).
Con el panel del navegador oculto no corre `requestAnimationFrame`: las herramientas usan temporizadores.

## Reglas del usuario

- El **depto 5 ("Departamento demo"**, sin barrio en nada público) es la referencia que no se puede romper. Los cambios
  de motor son generales y se verifican con el demo y el depto en curso: `motor/verificar.html?deptos=depto5,depto6`
  (`&base=1` solo si el cambio es bueno).
- La vista general no se aleja mucho más que su encuadre de arranque; la pantalla de carga tapa toda la precarga.
- Si un rincón se ve en una sola foto y el objeto es ambiguo, pedir otra foto antes de inventar el mueble.
- **El render es una abstracción precisa:** cada tramo de pared, cada abertura y cada mueble tiene que salir de una foto
  o del plano. Las aberturas se ubican por lo que las rodea en la foto (esquinas, mesada, otra abertura), no solo por el
  plano. Lo que no aparece en ninguna foto: solo el espacio del plano, vacío, y anotado en `estimated`.
- **Cada modelo mejora sobre el anterior:** antes de entregar, repasar "Errores que no se repiten" en SKILL.md; cada error
  nuevo que marque el usuario se agrega ahí.
- Entrega = recorrido 3D + tarjeta con QR. **Sin videos** (se quitaron el 2026-11-07), sin imágenes sueltas ni plano,
  sin fotos reales en las ventanas.
- Piezas sin caras compartidas ni flotando; 60 cm de circulación; `warnings` vacío. Nada que se prenda, apague o
  cambie de calidad a la vista mientras se camina.
- Preguntar antes de publicar/republicar, descargar o instalar dependencias.
- No editar con Get-Content/Set-Content de PowerShell (rompe acentos); scripts temporales en el scratchpad.
- Trabajar en tandas, sin frenar en cada ticket.
- Pensar todo como mejora general del motor para cualquier depto; el demo es solo la prueba.
- Comprobar sintaxis con `node --input-type=module --check < archivo` (`node --check` no detecta todo).

## Depto 6: banco de pruebas del motor (no se publica)

**depto6 "Dos dormitorios con balcón"** (anuncio ajeno de Rosario: solo renders, nunca sus fotos en algo público).
**Decisión del usuario (2026-11-08): no hace falta que esté publicado**; sirve para hacer renders y mejorar el motor.
La copia vieja en https://recorrelo3d.pages.dev/departamento-dos-dormitorios/ queda como está hasta que el usuario
diga otra cosa (no republicar). Hojas en `capturas/depto6/`, plano 2D en `capturas/depto6/plano.png`.
Estado: cocina fiel a las fotos y al plano (T-64), lavadero vacío, segundo dormitorio y placards amueblados por
decisión del usuario, luz horneada al día. Quedan sin decidir el aviso de 60 cm del baño (1,50 m real) y el lado del
lavadero al patio (hoy pared lisa); las cámaras de living, baño y balcón no calzan del todo (`encuadre.html`).
Sigue en `verificar.html?deptos=depto5,depto6` como el depto cargado de referencia.

## Próximos pasos (2026-11-08)

**Primero: el departamento nuevo** (pedido del usuario, 2026-11-08). Seguir SKILL.md al pie de la letra: inventario de
fotos, **compuerta 1** (secuencia de cada pared por foto, huecos y pilares medidos en el plano en píxeles, plano 2D con
la lista de dudas y OK del usuario), **compuerta 2** (muebles contundentes, solo lo que se ve), **compuerta 3**
(detalle, colores, luz horneada una vez, `verificar.html?deptos=depto5,<nuevo>` una vez) y repasar los 7 "Errores
que no se repiten" en cada hoja. Objetivo: ~30 min con el catálogo actual; piezas nuevas del motor en una tanda aparte.

**Después:** la landing, con el prompt de [prompt-landing.md](prompt-landing.md): en PC el scroll se traba al
cargar (sospecha: el iframe del recorrido en vivo carga el motor en el mismo hilo) y en celular las tarjetas de "Las
fotos ya no alcanzan" parpadean (sospecha: `transition-all` de Tailwind peleando con framer-motion).

**El usuario:** `git push` cuando haya commits locales y subir `sitio/` a Cloudflare cuando haya cambios.

### Motor
1. **Depto 6 (T-61):** decidir el aviso de 60 cm del baño (medidas reales o artefactos más chicos); colores con
   `colores.html` y puntaje de parecido (`comparar.html?…&medir=`); fotos del segundo dormitorio y del lavadero si
   el anuncio las tiene.
2. **Paredes de color por ambiente:** hoy hay un solo `wallColor` (el dormitorio del depto 6 es más rosado que el
   living). Hacerlo general: cada cara de pared toma el color del ambiente al que mira.
3. **Textura de madera** (T-65, hecho): roble con radios, elegido por el usuario entre las muestras de
   `motor/pruebas/maderas.html` (sirve para comparar vetas nuevas).
4. **Texturas escaneadas** (ambientCG / Poly Haven, CC0): armar la lista exacta (nombre, origen, tamaño) para que el
   usuario apruebe la descarga; entran por `motor/texturas/` como detalle en gris sobre el color medido.
5. ~~Pre-generar el mimbre~~ (hecho con T-65: `motor/texturas/wicker.webp`).
6. **Medir el depto 6 en el iPhone** (tiempo hasta la primera vista con la carga nueva, fluidez en el living y la
   cocina, de noche). Niveles de calidad por equipo solo si hace falta.
7. **"▶ Recorrer"** (recorrido automático) y vista general más fácil de manejar (feedback de una administradora:
   "difícil de maniobrar para +40"); el límite de alejamiento ya está (T-62).
8. Detalles que faltan del depto 6: perchero con abrigos en el pasillo, azulejos decorados de la cocina, potus colgante
   junto a la biblioteca, plantas del balcón (hoy el balcón no admite muebles: hacerlo general).
9. Paso de orientación en SKILL.md: `sunFrom` y `bearing` según la orientación del anuncio y el plano (la dirección
   importa, el ángulo no tanto).

### Marca
1. Unificar el nombre: la landing dice "recorrelo3D" y la carta "Recorrelo 3D".
2. `og:image` (vista previa al compartir) para cada recorrido publicado y para la landing.
3. Dominio propio (`recorrelo3d.com.ar`) y mail de contacto propio; completar la línea de contacto de
   `presentacion/carta.html`.
4. Landing: imagen de la sección "Cómo es el proceso".

### Producto
1. Respaldo de la landing (no tiene git) antes de tocarla, y borrar `LANDING_PAGE_RECORRELO3D/informacionDelProyecto/`
   (340 MB, copia vieja) con el OK del usuario.
2. three.js dentro del paquete publicado (hoy viene de un CDN; descargarlo: pedir permiso).
3. Depto 6: si se consigue el permiso del dueño, kit de entrega (tarjeta con QR: `exportar.html` y después
   `node motor/kit.mjs depto6`); si no, sigue como prueba interna de rendimiento.
4. Comercial: seguir la planilla de administradoras (`comercial/`) y definir cómo se pide un recorrido (formulario o
   WhatsApp, precio, plazo).
