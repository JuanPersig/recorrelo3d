---
name: departamento-3d
description: Convierte las fotos de un departamento (anuncio de Airbnb o de inmobiliaria) en un modelo 3D navegable para publicar. Usar para modelar un departamento nuevo, corregir la distribución o las vistas de uno existente, o publicarlo.
---

# Departamento en 3D a partir de fotos

Se escribe **solo** `departamentos/<id>/scene.json`: qué hay y dónde. El motor fijo (`motor/engine.js`) y la biblioteca de
componentes (`motor/components.js`) lo dibujan. Si algo no se puede expresar con el catálogo, se agrega o generaliza un
componente que sirva para cualquier departamento; nunca un parche para uno solo.

El público son anfitriones e inmobiliarias: el modelo es **fiel** a las fotos y a la vez **luce** el lugar (luz, calidez,
detalles que suman), sin inventar ambientes, ventanas ni metros. Todo lo visible para el usuario, en español.

## Pasos

Cada paso termina cuando se cumple su criterio; no pasar al siguiente antes.

1. **Inventario de fotos.** Fotos en una carpeta local (`<Carpeta>/`). Si son `.avif`, convertirlas a PNG en
   `<Carpeta>-png/` con ffmpeg (`ffmpeg -i foto.avif foto.png`; nombres sin ñ ni espacios, porque son los ids de las
   vistas) o con `motor/convertir-avif.mjs` si no hay ffmpeg. Anotar por
   foto: ambiente, qué muebles y aberturas se ven, desde dónde y hacia dónde mira la cámara. Las fotos de amenities del
   edificio se descartan sin listarlas.
   *Hecho cuando* cada foto está asignada a un ambiente o descartada, y cada ambiente tiene sus fotos.
2. **Medidas.** Del texto del anuncio sale lo que se pueda (m², camas, ambientes, equipamiento). En Airbnb la página
   carga el texto tarde: en el navegador, buscar en los `<script>` los `"htmlText"` (descripción) y los `"title"`
   (resumen y servicios); los muebles conocidos son la regla
   (cama queen 1,60 × 2,00 m, doble 1,40 × 1,90, puerta 0,80 × 2,05). No subestimar: un monoambiente porteño ronda
   30–32 m². Lo que no se ve en ninguna foto se modela simple y va en `estimated`.
   *Hecho cuando* cada ambiente tiene ancho y largo con su fuente (anuncio, mueble de referencia o estimado).
3. **Plano.** Ambientes como rectángulos en metros (`rooms[].rect`), paredes en X o en Z (`walls`), aberturas con
   `at` medido desde el `from` de la pared. Orientar el plano contra la cámara de **una foto concreta** y escribirlo en
   `orientation`: así no se espeja (pasó en el depto 2). Si la fachada con los ventanales no mira a −Z, `"exterior": { "facing": "+x" }`. Un ambiente en L o en U
   lleva `"rects"` (varios rectángulos) en lugar de `"rect"`. Las paredes, por ahora, en X o en Z.
   *Hecho cuando* recorriendo cada foto, lo que está a la izquierda y a la derecha de la cámara coincide con el plano.
   Plano para el dueño: `motor/plano.html?depto=<id>` deja `capturas/<id>/plano.png` y la lista de dudas (lo que va en
   `estimated`); si hay un dueño, mandárselo y corregir antes de seguir. Es una herramienta de trabajo: no va en la
   entrega.
4. **scene.json.** Muebles del [catálogo](motor/CATALOGO.md); lo que es solo ambientación lleva `"decor": true`. Texto
   para el huésped en `about` (solo lo que muestran las fotos, sin metros); lo interno en `note`. Una vista por foto con
   `photo` (id del archivo sin extensión) y `photoAspect` si las fotos no tienen todas la misma proporción
   (`viewAspect` es la del departamento); vistas generales con `"cut": true`. Ver la referencia más abajo.
   *Hecho cuando* el visor lo abre sin errores en la consola:
   `http://localhost:5180/motor/visor.html?scene=/departamentos/<id>/scene.json&dev` (servidor `visor` de launch.json).
5. **Validar.** `http://localhost:5180/motor/verificar.html?deptos=<id>` y `node motor/catalogo.mjs`.
   El mapa de circulación de `verificar.html` (verde se llega, amarillo no) muestra dónde está el problema; lo más
   común es un paso de 50–55 cm por la caída del acolchado o por la hoja de una puerta abierta.
   *Hecho cuando* `warnings` está vacío (sin superposiciones, nada dentro de paredes, 60 cm de circulación, puertas que
   abren, nada fuera de su ambiente) y el catálogo dice "parámetros bien". Un aviso que pide cambiar la distribución se
   consulta con el usuario en lugar de taparlo.
6. **Comparar con las fotos.** `motor/comparar.html?scene=/departamentos/<id>/scene.json&fotos=/<Carpeta-png>/&capturar=<id>`
   guarda una hoja por vista (día | foto | noche) en `capturas/<id>/`; leer las hojas. Corregir encuadre (`pos`,
   `target`, `fov`), distribución, materiales y objetos hasta que cada vista se reconozca como su foto. Comparar a
   tamaño real: las miniaturas recortadas engañan. Las fotos de celular son gran angular: `fov` entre 62 y 72, la
   cámara a 1,1–1,6 m y casi siempre más atrás de lo que parece (contra una pared o en la puerta del ambiente).
   Vista por las ventanas: siempre el entorno generado (`exterior.city` o `landscape`), ajustado a lo que muestran las
   fotos y Street View (altura de los edificios de enfrente, calle, árboles). Las fotos no se pegan en las ventanas.
   Colores: `motor/colores.html?depto=<id>` mide en las fotos el color de cada mueble y superficie y lo propone;
   revisar la lista y aplicar con `node motor/colores.mjs <id> --aplicar` (solo las confiables). El puntaje de parecido
   (`comparar.html?…&medir=<carpeta>`, ΔE medio, más bajo es mejor) tiene que bajar.
   *Hecho cuando* en cada hoja coinciden muebles, aberturas, colores y encuadre; lo que no se pudo igualar queda anotado.
7. **Entrega.** La entrega es el recorrido 3D y la tarjeta con el QR que lleva al recorrido; nada más (las
   imágenes sueltas no suman frente al modelo). `motor/exportar.html?scene=…&id=<id>&portada=<vista>&url=<link>`
   (portada de la tarjeta, links y QR; `&imagenes=1` agrega imágenes por vista solo para trabajo interno) guarda en
   `entregas/<id>/`. No se hacen videos (decisión del usuario, 2026-11-07).
   Kit para el dueño: `node motor/kit.mjs <id>` (index.html con el recorrido, y tarjeta.html con el QR).
   Las fotos de celular suelen ser gran angular (0,5×): fov 85–100 si la cámara queda lejos.
8. **Empaquetar y publicar.** `node motor/empaquetar.mjs <id>` arma `dist/<id>/` sin lo interno (`note`, `estimated`,
   ids de fotos). Para el cliente: `node motor/publicar.mjs <id>` arma `sitio/` con **todos** los deptos en un solo
   sitio estático, cada uno en su carpeta fija de `publicar.json` (`https://<sitio>/<carpeta>/`, una sola dirección
   gratuita para todos, sin dominio propio). Se sube la carpeta `sitio/` a Cloudflare Pages (proyecto único; arrastrar
   la carpeta en el panel o `npx wrangler pages deploy sitio`); con la dirección en `"sitio"` de `publicar.json`,
   regenerar el QR (`exportar.html&url=`) y el kit. La carpeta de un depto no se cambia después de imprimir su QR.
   Para mostrar algo en privado, en cambio: Artifact con `dist/<id>/index.html` y `engine.js`, `components.js`,
   `validate.js` y `scene.json` en `files`; si ya existe, sobre su URL y después de leer lo publicado.
   **Preguntar antes de publicar o republicar, en cualquiera de los dos.**
   *Hecho cuando* el link abre, en celular (375 × 812) las barras entran y el texto visible no tiene ids ni términos
   técnicos.

## Si se cambia el motor o un componente

- Correr `motor/verificar.html` (todos los departamentos) antes de darlo por hecho: compara una captura de día por
  vista con `capturas/verificacion/base/`. Mirar los pares que marca; recién si el cambio es bueno, `&base=1`.
- Antes de ubicar algo de pared, leer en el catálogo dónde está su origen (las alacenas van centradas en su
  profundidad; la cama con respaldo, 10 cm más adelante).
- Componente nuevo: comentario de una línea antes de su función (qué es, hacia dónde mira), su ficha en `META`
  (`mount`, `solid`, `use`, `nests`) y `node motor/catalogo.mjs` para regenerar el catálogo.
- Piezas que se tocan sin compartir caras: dos caras en el mismo plano parpadean y el usuario lo ve de cerca.
- Nada que se prenda, se apague o cambie de calidad a la vista mientras se camina.
- Editar archivos con Edit/Write o con node; PowerShell `Get-Content`/`Set-Content` rompe los acentos.

## Referencia del scene.json

- Coordenadas en metros: X y Z en planta, Y hacia arriba; `height` es la altura del piso al techo.
- Muebles: `{ "type", "at": [x, z], "y"?, "rotation"? (grados), "params"?, "decor"? }`. El origen de cada componente
  es el centro de su huella con el frente hacia +Z; los de pared tienen el fondo en z = 0.
- Niveles (dúplex, altillo): `levels: [{ "y", "height", "rooms", "walls", "items", "voids", "roof" }]`; las vistas
  llevan `"level"`.
- Luz: los valores por defecto ya son los acogedores aprobados (T-28: `warmth` 0,58, `ambient` 0,82, de noche
  `nightAmbient` 0,5 y `nightExposure` 1,35); cambiarlos solo si las fotos lo piden. `lighting.lamps` (rendimiento de
  las lámparas de noche, 0,8), `sunFrom` (de dónde viene el sol; elegirlo para que entre como en las fotos).
- Entorno: `exterior.balcony`, `exterior.city` (calle y edificios) o `exterior.landscape: "lake"` con `nature`.
- Claves válidas y opciones cerradas: `KEYS` y `ONE_OF` en `motor/validate.js` (el validador sugiere la más parecida
  ante una clave mal escrita).
- Ejemplos completos: `departamentos/depto1` (dos ambientes, piso brillante), `depto2` (monoambiente, fotos de
  proporciones distintas) y `depto4` (dúplex con techo a dos aguas y lago).
