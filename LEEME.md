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
| `motor/pruebas/` | páginas de prueba: `materiales.html` (laboratorio de materiales), `entorno.html`, `rebote.html`, `cerca.html` |
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

## Estado del motor (2026-11-08)

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

## Depto grande en curso (2026-11-08)

**depto6 "Dos dormitorios con balcón"** (anuncio ajeno de Rosario: solo renders, nunca sus fotos en algo público).
Tandas hechas (T-60 a T-63): 7 componentes nuevos y muchas variantes, unión de lo decorativo y por
color (el depto 5 bajó de 400–660 a 220–480 dibujos por vista con la misma imagen), luz horneada. Depto 6: armado
3,9 s, 390–715 dibujos por vista. Hojas en `capturas/depto6/`. Publicado para probar en https://recorrelo3d.pages.dev/departamento-dos-dormitorios/ (el usuario sube `sitio/`).
Pendiente (T-61): decidir el aviso del baño (1,50 m
de ancho real: no entran 60 cm entre inodoro y lavatorio), colores con `colores.html`, puntaje de parecido, paredes por
ambiente, mimbre pre-generado. El prompt original está en [prompt-depto-grande.md](prompt-depto-grande.md).

## Próximos pasos (2026-11-08)

**Primero: cerrar la compuerta 1 del depto 6 con las respuestas del usuario** (T-64). La cocina ya está corregida
(2026-11-08, segunda sesión): ventana desde la esquina, puerta del lavadero pegada y cerrada, pilar con el calefón de
frente, carro junto al pilar, puerta de entrada a la cocina en el hueco del plano y lavadero vacío. Detalle en
TICKETS.md (T-64, "Hecho" y "Dudas"). El plano 2D con el pilar está en `capturas/depto6/plano.png`.
1. **Dudas abiertas:** lado del lavadero al patio; pleno C22 (quedó plano por la foto `cocina`); aviso de 60 cm del baño. Decididas por el usuario (2026-11-08): el
   segundo dormitorio y los placards quedan como están; el mueble de la cocina arranca en el marco de la puerta y
   no llega al pilar (la puerta, donde marca el plano).
2. Con eso: compuerta 2 (muebles contundentes, solo lo que se ve) y compuerta 3: hornear la luz (gi.json quedó viejo
   para la cocina), `verificar.html?deptos=depto5,depto6&base=1` y repasar "Errores que no se repiten" (ahora 7) en
   todas las hojas. Las cámaras de living, baño y balcón no calzan del todo con sus fotos: `encuadre.html` en la
   compuerta 3.

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
