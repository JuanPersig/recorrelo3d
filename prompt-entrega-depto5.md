Respondeme en español (rioplatense). Antes de empezar, leé tu memoria (MEMORY.md y sus archivos), `TICKETS.md` (sobre todo
T-19, T-20 a T-28 y la "Tanda del 2026-11-03"), `SKILL.md` y `motor/CATALOGO.md`.

## Qué quiero

Una entrega completa del departamento 5 como si fuera para un cliente que paga: el modelo 3D, el plano, imágenes, videos
y todo lo que pide T-19 (kit de entrega para el dueño). El resultado tiene que ser profesional, favorecer al dueño dentro
de lo que muestran las fotos (luz, calidez, detalles que suman, sin inventar ambientes ni metros) y tener la calidad
necesaria para que el dueño quiera comprarlo. Mirá todo con ojo de cliente exigente: lo que se vea flotando, cortado,
borroso, estirado o "de catálogo" es un defecto a corregir antes de darlo por terminado.

## Datos

- Fotos: carpeta `departamento5/` (29 AVIF). Hay archivos con ñ (`baño1.avif`…): al convertirlos a PNG en
  `departamento5-png/` con ffmpeg, renombrar sin ñ ni espacios (son los ids de las vistas). `afuera*` y `adicional*`
  pueden ser vista, balcón, edificio o amenities: mirarlas; lo que sea del edificio se descarta sin listar.
- Anuncio de Airbnb: https://www.airbnb.com.ar/rooms/1597929013724539655 (el texto se saca de los `<script>` de la
  página, ver SKILL.md paso 2: medidas, camas, ambientes, servicios y la descripción).
- Ubicación (Google Maps / Street View, Buenos Aires, coordenadas -34.5824, -58.4133):
  https://www.google.com/maps/@-34.5824029,-58.4133363,13a,75y,139.04h,93.64t/data=!3m8!1e1!3m6!1sFNy2R4ry1SpkGZ002OwCIg!2e0!5s20240801T000000!6shttps:%2F%2Fstreetviewpixels-pa.clients6.google.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-3.637667141901943%26panoid%3DFNy2R4ry1SpkGZ002OwCIg%26yaw%3D139.0403261328333!7i16384!8i8192
  Usala solo como referencia, mirándola en el navegador (no descargar imágenes de Google ni pegarlas en el modelo), para:
  hacia dónde mira la fachada (y con eso `sunFrom` y `exterior.facing`), ancho de la calle, altura y estilo de los
  edificios de enfrente, árboles de vereda o plazas cerca (entorno generado de las ventanas sin foto), barrio y lugares
  cercanos para el texto del huésped, y el norte para el plano. La dirección exacta no va en nada público: solo el barrio.
- Marca blanca: no tengo una todavía; dejá la entrega sin marca pero lista para agregarla (`brand` en el scene).

## Cómo

1. Seguí SKILL.md paso a paso (inventario → medidas → plano → scene.json → validar → comparar → entrega), en
   `departamentos/depto5/` con `"photos": "/departamento5-png/"`. Usá todo lo que hay en el motor: colores medidos
   (`colores.html` + `colores.mjs`, solo las confiables y mirando la lámina), vista real por las ventanas
   (`exterior.fromPhotos` + `ventanas.html`, revisando de costado que no queden fantasmas ni bordes estirados),
   estampados (`telas.html`, elegidos a ojo), componentes nuevos del catálogo, plano (`plano.html`).
2. Si falta una pieza o un estilo para que se parezca a las fotos, agregalo al catálogo de forma general (ficha,
   comentario, `pruebas/piezas.html` sin piezas sueltas y captura de cerca con `pruebas/cerca.html`).
3. Comparar con las fotos a tamaño real (`comparar.html?…&capturar=depto5` y `&medir=depto5`), corregir encuadre,
   distribución y materiales hasta que cada vista se reconozca como su foto. El encuadre automático (`encuadre.html`) no
   es confiable todavía (T-27): usalo solo como propuesta y miralo.
4. Entregables en `entregas/depto5/` (T-19):
   - imágenes de día y de noche de cada vista (`exportar.html`), 6–10 elegidas como las mejores para el anuncio;
   - video horizontal (`video.html`) y **video vertical 9:16** para Reels y estados (agregar `&formato=vertical` a
     `video.html` con encuadres propios; revisar los cuadros con ffmpeg);
   - plano en PNG y SVG (`plano.html`) con la lista de dudas para el dueño;
   - link por vista y QR (el QR con un link de prueba hasta publicar);
   - un texto corto sugerido para presentar el recorrido y una guía de una página "dónde usar cada cosa" (Airbnb,
     mensajes a huéspedes, Instagram, tarjeta de bienvenida);
   - una página índice `entregas/depto5/index.html` con todo, linda y en español, para revisarla como si fuera el dueño
     (también en 375 × 812).
5. Antes de darlo por terminado: `motor/verificar.html` (los cinco deptos; los otros cuatro sin cambios no buscados),
   `warnings` vacío en depto5, `node motor/catalogo.mjs` con parámetros bien, 60 cm de circulación, nada flotando ni
   con caras compartidas (revisar de cerca), nada que se prenda o cambie de calidad al caminar.
6. Anotá en TICKETS.md: el avance de T-19 (qué tiene el kit y qué falta), un informe del depto 5 como el de San
   Nicolás (vueltas por paso, cambios de motor que hicieron falta, qué no se pudo igualar) y los tickets nuevos que
   aparezcan. Si te acercás al límite de uso o se llena el contexto, dejá anotado el paso en curso y el próximo.

## Reglas de siempre

- Cambios de motor generales, nada de parches para un departamento. Lo que es solo ambientación va con `"decor": true`.
- Luz: los valores por defecto actuales (T-28 todavía espera mi aprobación; no los cambies para este depto salvo que
  las fotos lo pidan).
- No edites con Get-Content/Set-Content de PowerShell. Para regex en archivos usá Write o `String.fromCharCode(92)`.
- Preguntame antes de publicar, de descargar archivos o de instalar dependencias.
- Todo lo visible para mí y para el cliente, en español.

## Datos prácticos

- Servidor `visor` de .claude/launch.json (puerto 5180) con `preview_start`. Si cambiás `motor/serve.mjs`, reinicialo.
- Con el panel del navegador oculto no corre `requestAnimationFrame` y la ventana mide 0: las herramientas ya piden
  `device: 'desktop'`; capturá con `comparar.html`/`lamina.html` o `__viewer.capture()` y subí las imágenes como
  bytes (data URL → POST a `/capturas/...`), porque `toBlob` y `<video>` pueden colgarse. ffmpeg está instalado.
- Los scripts temporales van en el scratchpad de la sesión, no en el proyecto.

Al final, un resumen: qué tiene la entrega, dónde mirarla, qué quedó flojo y qué haría falta para venderla.
