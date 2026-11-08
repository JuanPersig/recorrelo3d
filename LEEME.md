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

## Pendientes

1. **El usuario:** `git push` (hay commits locales sin subir) y subir `sitio/` a Cloudflare (ya armado: al subirlo
   salen de la web los cuatro deptos borrados).
2. **Texturas escaneadas** (ambientCG / Poly Haven, CC0): armar la lista exacta (nombre, origen, tamaño) para que el
   usuario apruebe la descarga; entran por `motor/texturas/` como detalle en gris sobre el color medido de las fotos.
   Hoy el dibujo de la veta y de las telas sigue siendo sintético.
3. **"▶ Recorrer"** y **vista general con límites** (feedback de una administradora: "difícil de maniobrar para +40").
4. `og:image` para `/departamento-prueba/`; three.js dentro del paquete (descarga: pedir permiso); dominio propio
   (`recorrelo3d.com.ar`).
5. Niveles de calidad por equipo (medidos en la precarga): solo si aparecen celulares lentos (el iPhone anda bien).
6. Depto 6: terminar lo pendiente de T-61.
7. Respaldo de la landing (no tiene git) y borrar `LANDING_PAGE_RECORRELO3D/informacionDelProyecto/` (340 MB, copia vieja).
8. Landing: imagen de la sección "Cómo es el proceso". Comercial: seguir la planilla; mail de contacto propio.
