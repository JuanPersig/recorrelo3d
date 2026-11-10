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

## Precisión primero: tres compuertas (obligatorio desde el 2026-11-08)

El usuario: "la precisión debería traer 100 % los detalles principales de los departamentos; hay cuestiones finas como
la existencia de un teléfono que no importan, pero paredes y muebles contundentes es importante". Y el tiempo: el depto
6 llevó cerca de una hora y salió con errores de paredes. Por eso el trabajo va en tres compuertas; no se pasa a la
siguiente sin cerrar la anterior, y lo de una compuerta posterior nunca justifica volver a mover paredes.

**Qué es "principal" (tiene que estar al 100 %):** paredes, esquinas, pilares y plenos, puertas, ventanas y pasos (su
lugar, su ancho y hacia dónde abren), y los muebles contundentes: camas, sillones, mesas, placards, bibliotecas,
mesadas y alacenas, heladera, cocina, artefactos del baño, tele, aire, calefón. **Fino (suma, pero no es requisito):**
adornos, libros, frascos, teléfonos, cables, almohadones.

**Compuerta 1 · Estructura** (antes de un solo mueble):
- Por cada foto, escribir la **secuencia de cada pared visible**, de esquina a esquina: "esquina N → ventana (~0,5 m,
  sobre la mesada) → puerta (~0,8 m) → pilar (~0,55 × 0,3) → esquina S". Medir los anchos contra algo conocido (puerta
  0,80, mesada 0,60, heladera 0,60, cama 1,40/1,60).
- Cruzar cada secuencia con el plano y con las otras fotos de la misma pared: tienen que coincidir. Si no coinciden o
  una pared no se ve en ninguna foto, es una duda.
- Del plano: cada rectángulo rayado o con cruz es un pilar o pleno (`structure`), cada hueco es una abertura.
- Armar solo paredes, aberturas y estructura y comparar todas las hojas (`comparar.html`) mirando **solo** eso: cada
  tramo de pared, cada esquina, dónde empieza y termina cada abertura.
- **Mostrarle al usuario el plano 2D** (`motor/plano.html?depto=<id>`) con la lista de dudas y esperar su OK. Es un
  minuto suyo y evita la hora de rehacer (los errores de la cocina del depto 6 se habrían visto ahí).

**Compuerta 2 · Muebles contundentes:** solo los que se ven en alguna foto, en su lugar y de su tamaño, mirando hacia
donde miran. Un ambiente sin fotos queda vacío (salvo que el usuario prefiera amueblarlo: va igual en `estimated`; pasó con
el segundo dormitorio del depto 6). Comparar todas las hojas mirando solo los muebles contundentes.

**Compuerta 3 · Detalle, luz y verificación:** adornos y textiles, colores (`colores.html`), hornear la luz una sola vez
al final, `verificar.html` una vez, láminas.

**Sin plano ni medidas no se arranca** (2026-11-08): con fotos solas, sin ninguna medida real de los ambientes, las
proporciones salen mal aunque cada mueble esté bien elegido. Antes de la compuerta 1 tiene que haber un plano (de la
escritura, de la inmobiliaria) o un croquis con el largo y el ancho de cada ambiente, o unas medidas con cinta. Si el
anuncio no lo trae, pedírselo al usuario o al dueño; para probar el motor, elegir anuncios con plano.

**Tiempo:** el objetivo es un depto completo en ~30 minutos cuando el catálogo ya tiene las piezas (estructura ~10,
muebles ~10, detalle y verificación ~10). Para lograrlo: piezas nuevas del motor en una tanda aparte (no en medio del
depto); comparar solo las vistas que cambiaron (`comparar.html?…&view=<vista>`); hornear y verificar una sola vez, al
final de la compuerta 3; pedir al usuario las fotos que faltan en la compuerta 1, no al final.

## Pasos

Cada paso termina cuando se cumple su criterio; no pasar al siguiente antes.

1. **Inventario de fotos.** Las originales van en `fotos/<id>/original/` y las PNG que usan las vistas en
   `fotos/<id>/`. Si son `.avif`, convertirlas con ffmpeg (`ffmpeg -i foto.avif foto.png`; nombres sin ñ ni espacios, porque son los ids de las
   vistas) o con `motor/convertir-avif.mjs` si no hay ffmpeg. Anotar por
   foto: ambiente, qué muebles y aberturas se ven, desde dónde y hacia dónde mira la cámara. Las fotos de amenities del
   edificio se descartan sin listarlas.
   *Hecho cuando* cada foto está asignada a un ambiente o descartada, y cada ambiente tiene sus fotos.
2. **Medidas.** Del texto del anuncio sale lo que se pueda (m², camas, ambientes, equipamiento). En Airbnb la página
   carga el texto tarde: en el navegador, buscar en los `<script>` los `"htmlText"` (descripción) y los `"title"`
   (resumen y servicios); los muebles conocidos son la regla
   (cama queen 1,60 × 2,00 m, doble 1,40 × 1,90, puerta 0,80 × 2,05). No subestimar: un monoambiente porteño ronda
   30–32 m². Lo que no se ve en ninguna foto: solo el espacio del plano, sin muebles, y va en `estimated`.
   *Hecho cuando* cada ambiente tiene ancho y largo con su fuente (anuncio, mueble de referencia o estimado).
3. **Plano.** Ambientes como rectángulos en metros (`rooms[].rect`), paredes en X o en Z (`walls`), aberturas con
   `at` medido desde el `from` de la pared. Orientar el plano contra la cámara de **una foto concreta** y escribirlo en
   `orientation`: así no se espeja (pasó en el depto 2). Si la fachada con los ventanales no mira a −Z, `"exterior": { "facing": "+x" }`. Un ambiente en L o en U
   lleva `"rects"` (varios rectángulos) en lugar de `"rect"`. Las paredes, por ahora, en X o en Z.
   *Hecho cuando* recorriendo cada foto, lo que está a la izquierda y a la derecha de la cámara coincide con el plano, la
   secuencia de cada pared (compuerta 1) coincide con todas las fotos y el usuario aprobó el plano 2D.
   Plano para el dueño: `motor/plano.html?depto=<id>` deja `capturas/<id>/plano.png` y la lista de dudas (lo que va en
   `estimated`); si hay un dueño, mandárselo y corregir antes de seguir. Es una herramienta de trabajo: no va en la
   entrega.
4. **scene.json.** Muebles del [catálogo](motor/CATALOGO.md); lo que es solo ambientación lleva `"decor": true`. Texto
   para el huésped en `about` (solo lo que muestran las fotos, sin metros); lo interno en `note`. Una vista por foto con
   `photo` (id del archivo sin extensión) y `photoAspect` si las fotos no tienen todas la misma proporción
   (`viewAspect` es la del departamento); vistas generales con `"cut": true`. Ver la referencia más abajo.
   Floreros y ramos: `tabletop-decor` con "dried-flowers", "eucalyptus", "pampas", "wildflowers", "vase" o
   "bottle-flowers" (generador de ramos en components.js: estilos en `BOUQUETS`, recipientes en `vessel`); elegir el
   que más se parezca a la foto y dar `flowers` con el color de las flores.
   Luz rebotada: con la distribución y los muebles cerrados, `motor/hornear.html?id=<id>` (unos segundos) y
   `"lighting": { "bake": "gi.json" }` en el scene; volver a hornear si algo cambia.
   *Hecho cuando* el visor lo abre sin errores en la consola:
   `http://localhost:5180/motor/visor.html?scene=/departamentos/<id>/scene.json&dev` (servidor `visor` de launch.json).
5. **Validar.** `http://localhost:5180/motor/verificar.html?deptos=<id>` y `node motor/catalogo.mjs`.
   El mapa de circulación de `verificar.html` (verde se llega, amarillo no) muestra dónde está el problema; lo más
   común es un paso de 50–55 cm por la caída del acolchado o por la hoja de una puerta abierta.
   *Hecho cuando* `warnings` está vacío (sin superposiciones, nada dentro de paredes, 60 cm de circulación, puertas que
   abren, nada fuera de su ambiente) y el catálogo dice "parámetros bien". Un aviso que pide cambiar la distribución se
   consulta con el usuario en lugar de taparlo.
6. **Comparar con las fotos.** `motor/comparar.html?scene=/departamentos/<id>/scene.json&fotos=/fotos/<id>/&capturar=<id>`
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

- Correr `motor/verificar.html?deptos=depto5,<depto en curso>` antes de darlo por hecho (no todos: el demo es la
  referencia que no se puede romper): compara una captura de día por vista con `capturas/verificacion/base/`. Mirar los
  pares que marca; recién si el cambio es bueno, `&base=1`. Anotar armado, mallas y dibujos por vista.
- Pieza nueva: probarla de cerca con `motor/pruebas/cerca.html?items=[…]&capturar=<id>/cerca-<nombre>` (un mueble por
  hoja: con varios, el encuadre queda lejos) y leer la hoja.
- Antes de ubicar algo de pared, leer en el catálogo dónde está su origen (las alacenas van centradas en su
  profundidad; la cama con respaldo, 10 cm más adelante).
- Componente nuevo: comentario de una línea antes de su función (qué es, hacia dónde mira), su ficha en `META`
  (`mount`, `solid`, `use`, `nests`, `fixed`) y `node motor/catalogo.mjs` para regenerar el catálogo. El catálogo lee
  los parámetros de `p.algo` dentro de la función (y de las que reciben `p`): si un ayudante recibe otra cosa, pasarle
  `p.algo` explícito para que el parámetro figure.
- Calidad de las piezas: curvas reales (torno, tubos, tablas curvas con `bentBoard`), lo chico unido por material con
  `meshBag()`, botones de capitoné con `tuftGeo`/`addButtons`, almohadones apoyados con `restPillow`, y ninguna pieza
  flotando: lo que entra en otra pieza entra 2–5 mm.
- Piezas que se tocan sin compartir caras: dos caras en el mismo plano parpadean y el usuario lo ve de cerca.
- Nada que se prenda, se apague o cambie de calidad a la vista mientras se camina.
- Editar archivos con Edit/Write o con node; PowerShell `Get-Content`/`Set-Content` rompe los acentos.
- Textura nueva en components.js: pre-generarla (`motor/generar-texturas.html`) antes de medir el armado; calculada
  al abrir, una sola textura de 512 px llevó un armado de 4 a 28 s. Sus ruidos con períodos enteros (512 / período),
  o aparece una costura cada repetición.
- Cambios de aspecto (texturas, materiales, estilos): página de muestras y que el usuario elija; procedimiento en
  "Fidelidad y materiales: cómo trabajar" → "Cambiar el aspecto del motor".

## Referencia del scene.json

- Coordenadas en metros: X y Z en planta, Y hacia arriba; `height` es la altura del piso al techo.
- Muebles: `{ "type", "at": [x, z], "y"?, "rotation"? (grados), "params"?, "decor"? }`. El origen de cada componente
  es el centro de su huella con el frente hacia +Z; los de pared tienen el fondo en z = 0.
- Niveles (dúplex, altillo): `levels: [{ "y", "height", "rooms", "walls", "items", "voids", "roof" }]`; las vistas
  llevan `"level"`.
- Luz: los valores por defecto ya son los acogedores aprobados (T-28: `warmth` 0,58, `ambient` 0,82, de noche
  `nightAmbient` 0,5 y `nightExposure` 1,35); cambiarlos solo si las fotos lo piden. `lighting.lamps` (rendimiento de
  las lámparas de noche, 0,8), `sunFrom` (de dónde viene el sol; elegirlo para que entre como en las fotos).
- Aspecto de cámara y telas (2026-11-09, ya con los valores que eligió el usuario; no hace falta tocarlos):
  `lighting.lens` { grain, vignette, aberration, bloom, nightBloom, threshold, radius }, `lighting.curtainLight`
  (cortinas a contraluz, 0,6), `lighting.sunDisc` (penumbra del sol al quedarse quieta, 0,012) y `"wrinkles"` de
  cada cama (arrugas del acolchado en metros, 0,016; 0 = liso).
- Entorno: `exterior.balcony`, `exterior.city` (calle y edificios) o `exterior.landscape: "lake"` con `nature`.
  Casa en planta baja: "exterior": { "floorsBelow": 0 } (el suelo al nivel de la casa, sin edificio debajo).
- Techo de cada ambiente ("ceiling"): "open" (patio a cielo abierto), { "kind": "boards", "color", "height" }
  (machimbre) o { "kind": "sheet", "color", "beams", "spacing", "height", "over" } (chapa con tirantes; "over" son los
  rectángulos que techa, para el alero). Postes y vigas de madera: `structure` con "color".
- Exterior verde: piso { "kind": "grass" }; plantas plantadas en la tierra con "pot": false ("leaves", "spread").
- Claves válidas y opciones cerradas: `KEYS` y `ONE_OF` en `motor/validate.js` (el validador sugiere la más parecida
  ante una clave mal escrita).
- Ejemplos completos: `departamentos/depto1` (dos ambientes, piso brillante), `depto2` (monoambiente, fotos de
  proporciones distintas) y `depto4` (dúplex con techo a dos aguas y lago).

## Errores que no se repiten (lista de control antes de entregar)

Cada error que marcó el usuario en un modelo entra acá con cómo evitarlo. Antes de dar un depto por bueno, recorrer la
lista entera contra las hojas de comparación a tamaño real. Los modelos tienen que salir cada vez mejor que los
anteriores: un error de esta lista que vuelve a aparecer es lo peor que puede pasar.

1. **Plano espejado** (depto 2): orientar el plano contra la cámara de una foto concreta y escribirlo en `orientation`.
2. **Mueble inventado desde una sola foto** (depto 6, 2026-11-08): un organizador sobre una mesita se modeló como un
   estante escalera de piso y la mesita como una mesa rústica en el medio. Si un objeto grande se ve solo en un borde o
   en una sola foto, buscarlo en todas o pedir otra foto antes de modelarlo.
3. **Pared que no existe** (depto 6, cocina, 2026-11-08): la ventana y la puerta del lavadero se repartieron por la
   pared según el plano y quedaron 0,65 m de pared entre la mesada y la puerta; en la foto la ventana arranca en la
   esquina sobre la mesada y la puerta está pegada. Agrandaba el ambiente y mentía. Control: en cada foto, recorrer cada
   pared de punta a punta y comparar con el render: dónde empieza y termina cada abertura respecto de la esquina, de la
   mesada o del mueble más cercano, y si entre dos aberturas hay pared o no. El plano da las medidas generales; las
   posiciones finas de puertas y ventanas salen de las fotos.
4. **Artefactos en un ambiente sin fotos** (depto 6, lavadero, 2026-11-08): se agregaron lavarropas, pileta y ventana
   sin que ninguna foto los mostrara. Un ambiente que no aparece en ninguna foto es solo el espacio del plano (paredes,
   piso, puertas que se ven desde otro ambiente), vacío, y va en `estimated`. Nada de muebles "probables".
5. **Comillas invertidas en `node -e "…"`** (2026-11-08): bash las ejecuta. Escribir el texto en un archivo aparte.
6. **Esquina comida y artefacto mal orientado** (depto 6, cocina, 2026-11-08): en la foto la pared da un quiebre (un
   pilar o pleno junto a la puerta del lavadero) y el calefón cuelga de la cara del pilar que mira a la cocina; en el
   modelo no estaba el pilar y el calefón colgaba de costado en la pared de al lado. El plano lo marcaba (rectángulo con
   cruz = pleno o columna). Control: (a) en el plano, cada rectángulo rayado o con cruz es un pilar o un pleno que hace
   esquinas: va como `structure` aunque ninguna foto lo muestre de frente; (b) en cada foto, seguir el zócalo y el
   encuentro pared–techo: cada quiebre de esas líneas es una esquina que el modelo tiene que tener; (c) cada objeto de
   pared (calefón, aire, cuadro, repisa, tele) mira hacia donde mira en la foto: si se lo ve de frente con la cámara
   mirando a lo largo del ambiente, está en una pared perpendicular a esa dirección, no en una de costado.
7. **Puerta corrida respecto del hueco del plano** (depto 6, entrada a la cocina, encontrado el 2026-11-08): estaba
   pegada a la pared de la heladera y el plano la pone a 0,74 m. Nadie lo marcó porque ninguna foto la muestra de
   frente, pero corría el carro y la cámara de `cocina2`. Control: medir en píxeles cada hueco del plano (escala de una
   cota conocida) y anotar su distancia a la esquina más cercana antes de escribir el `at`; si una foto no lo
   contradice, manda el plano. Si la foto marca otra cosa (en `cocina2` el carro llega al marco), es una duda para el
   usuario, no un ajuste a ojo. Y si dos lecturas de una foto se contradicen (el calefón "encima" del carro), buscar otra
   foto del mismo rincón antes de mover muebles: en `cocina`, mirando al revés, no hay carro junto a la puerta.
   Las líneas del plano se leen rápido con `magick plano.jpg -crop Wx1+X+Y -threshold 55% txt:-`.
8. **Paredes y puertas leídas de fotos ambiguas en contra del plano** (depto 7, 2026-11-09): inventé un pozo de luz
   que el plano no tiene, una pared que cerraba el antebaño y una puerta corrediza; el plano mostraba exactamente las
   paredes del baño (pared oeste hasta el baño, tramo sur corto y el vano entre los dos). Regla: **las paredes salen
   del plano**; las fotos ubican aberturas y muebles sobre esas paredes. Si una foto parece pedir una pared que el
   plano no tiene, primero sospechar de la cámara (gran angular, encuadre en diagonal) y de la ambientación virtual,
   no agregar la pared. Las fotos reales (vacías o con muebles viejos) mandan sobre las decoradas. Cada puerta, como
   dibuja el plano (lado de las bisagras y hacia dónde abre); corrediza solo si una foto real lo muestra sin duda.
   Comparar con cámaras ubicadas como en la foto antes de juzgar la estructura: con la cámara mal puesta, una
   distribución bien hecha parece mal y una mal hecha parece bien.
Control mínimo por hoja (`comparar.html … &capturar=<id>`):
- ¿Cada tramo de pared del render se ve en la foto (o en el plano, si la foto no lo muestra)?
- ¿Cada abertura empieza y termina donde en la foto, respecto de la esquina y de los muebles?
- ¿Cada mueble del render está en la foto, en su lugar, con su tamaño y su color?
- ¿Hay algo en la foto que falte en el render?
- Anotar en el ticket lo que no se pudo igualar; no dar por buena una hoja con una diferencia de paredes o aberturas.

## Lecciones de un depto cargado (depto 6, 2026-11-08)

Todo lo que costó resolver al modelar el primer depto grande. Leerlo antes de arrancar el próximo.

### Fotos y plano
- **Pedir o buscar todas las fotos antes de amueblar.** Un rincón visto en una sola foto engaña: un organizador
  escalonado arriba de una mesita se leyó como un estante escalera de piso, y la mesa como una mesa rústica suelta en el
  medio. La foto que faltaba (la otra punta del living) mostró que la mesa iba contra la pared. Si un objeto grande se
  ve solo de costado o en el borde de una foto, preguntar al usuario si hay otra foto de ese rincón antes de inventarlo.
- Un mismo mueble cambia mucho de color entre fotos (la tapa de la mesita: oscura en una, naranja en otra): buscarlo en
  todas antes de decidir que son dos muebles distintos.
- **Plano del anuncio** (si viene): ampliarlo con `magick plano.jpg -crop …  -resize 200%` y medir en píxeles. Escala:
  una cota total conocida (el frente, 10,06 m) entre dos ejes de columna. Las cotas sueltas suman el frente (4,56 +
  0,60 + 1,50 + 0,60 + 2,80 = 10,06). Convenciones de planos de obra: "S.C." = semicubierto (balcón); "AIRE Y LUZ" =
  patio (ventanas que dan ahí: dormitorio 2, cocina, lavadero); una caja con una línea fina de un lado = placard con sus
  puertas del lado de la línea; huecos en las paredes = puertas o pasos (el plano no dibuja las hojas); los rectángulos
  rayados = plenos o columnas. Los dormitorios suelen tener un nicho de placard y un "hall" chico de entrada: van como
  ambiente en L con `rects`.
- Superficie de control: cubierta ≈ suma de ambientes + paredes; descubierta ≈ el balcón (7 m² = 1,10 × 6,1).

### Coordenadas
- Conviene la fachada de los ventanales en z = 0 con el balcón en -z (el entorno se arma mirando a -Z). Mirando hacia -z,
  la derecha de la cámara es +x: elegir x para que lo que está a la derecha en la foto quede en +x.
- Rotación de los muebles (frente local +Z): `90` → el frente mira a +X; `-90` → a -X (el fondo queda en +X, contra una
  pared en x alta); `180` → a -Z. Los de pared tienen el fondo en z = 0: con `90` el fondo queda hacia -X.
- La cama con la cabecera contra una pared en +X: `rotation: -90`, centro a largo/2 de la pared.
- Paredes en Z se cortan contra las paredes en X solo en sus puntas; un cruce en T o en + en el medio está bien (los
  volúmenes se tapan entre sí). Una pared en Z puede ir de centro a centro.

### Baños y revestimientos
- `wall-tiles` tiene 14 mm: todo lo que va contra una pared revestida se corre 0,014 (lavatorio, botiquín, toallero,
  inodoro: fondo en la cara del azulejo). Alrededor de una puerta, el revestimiento va en tramos: a los costados y un
  tramo arriba con `"y": 2.05`. Los tramos de paredes vecinas no se tocan en la esquina (uno corto 14 mm).
- Un baño de 1,50 m de ancho con inodoro y bidé de un lado y lavatorio del otro deja ~50 cm: el control de 60 cm
  avisa. Con artefactos de tamaño real no se arregla: consultar al usuario (pendiente en T-61).
- La puerta del baño abre hacia adentro y su hoja barre el lado donde va la bisagra: ponerla del lado que no choca (la
  foto lo dice: el picaporte está del otro lado). `hinge: "start"` es la punta del lado del `from` de la pared.

### Muebles y adornos
- Lo que va sobre un estante o una mesa es `tabletop-decor` con `"y"` = la altura de la tapa; ahora acepta objetos
  `{ "kind", "color", "x", … }`. Sobre una mesa con mantel, la tapa queda en `height` + 0,008.
- Electrodomésticos sobre un carro: `appliance` encastra con `kitchen-cart`.
- Lámpara de techo bajo un cielorraso bajo (viga de `structure`): `"y": -0,2` (lo que baja el cielorraso).
- Cortinas con presillas (`tabs`): el barral queda a `height` + 0,06; el aire acondicionado va arriba del barral.
  Cortina corrida que tapa la ventana: `panelWidth` = `width` / 2. Algodón que brilla a contraluz: `"sheer": 0,86`.
- Llaves de cruz (`crossTap`) y picos (`spoutGeo`) para cualquier grifería clásica; un caño que sale de una pared
  arranca en z = 0 o adentro: si asoma detrás del plano de la pared, el control de piezas sueltas no lo ve amurado.
- Para que una pieza amurada no cuente como suelta, el componente necesita `fixed` en su ficha (`back` o `sides`) y la
  pieza tiene que tocar justo el borde de la caja del componente (nada más puede sobresalir de ese lado).
- Torres de una biblioteca escalonada: se tocan de costado (una separación de 2 mm las hace "piezas sueltas").

### Circulación
- El mapa `capturas/verificacion/actual/<id>/circulacion-0.png`: x horizontal, z vertical (z = 0 arriba), punto rojo =
  la puerta de entrada, verde = se llega, amarillo = libre pero sin llegada. Lo más común en un living cargado: el paso
  entre la punta de una mesa y una biblioteca (dejar ≥ 0,65 m, la persona es un círculo de 60 cm).
- "No queda lugar para pararse junto a…" en todo un ambiente casi siempre es que el ambiente entero no se alcanza:
  arreglar primero la llegada.

### Encuadre y comparación
- Fotos de celular apaisadas (1184 × 864): `viewAspect` 1,37. Cámaras a 1,3–1,5 m, fov 70–74. Si en el render se ve
  más hondo que en la foto, la cámara está demasiado atrás; si un mueble aparece encima de la cámara, la cámara está
  dentro de él.
- Comparar a tamaño real cada hoja y corregir en tandas: encuadre, después materiales, después adornos.

### Luz
- Hornear (`hornear.html?id=<id>`, 40–80 s) cada vez que se mueven muebles; las herramientas de horneado, plano y
  texturas ya entienden `rects`.
- Metal puro (`M.metal`) refleja el ambiente y en una cocina sale casi negro: para acero inoxidable de mesadas y
  heladeras usar `M.brushed`.

### Rendimiento (medido)
- El motor une lo decorativo por material y los materiales iguales salvo el color en uno con color por vértice: no hace
  falta ahorrar colores en el scene. Lo que sí multiplica triángulos: bordes redondeados (`blk` con radio) en cientos de
  piezas chicas (libros): usar cajas rectas.
- Referencia: depto 5 = 220–480 dibujos por vista; depto 6 (cargado) = 390–715, ~520 k triángulos de escena, armado
  ~1,5 s y precarga completa ~4–5 s en la PC.

### Herramientas (desde Claude Code)
- Con el panel del navegador oculto no corre `requestAnimationFrame`: no se puede probar arrastrar ni la rueda. Para
  ver una pose: `__viewer.setPose({ p, t, f, mode: 'orbit' })`, `__viewer.capture()` y POST a `/capturas/<id>/x.jpg`.
- `javascript_tool` corta a los 45 s: esperar de a 40 s. `verificar.html` con dos deptos tarda ~80 s, `comparar.html`
  ~75 s, `hornear.html` 40–80 s. Con `&base=1`, esperar a que termine antes de commitear.
- Cambios grandes de código o de texto: escribir el script o el texto en el scratchpad y correrlo con node. **Nunca
  comillas invertidas dentro de un `node -e "…"` con comillas dobles:** bash las ejecuta como comandos (el 2026-11-08 un
  texto con nombres de comandos entre comillas invertidas llegó a lanzar `node motor/kit.mjs`).
- Publicar: carpeta fija en `publicar.json`, `node motor/publicar.mjs`; revisar que `sitio/<carpeta>/` no tenga
  `/fotos/` (empaquetar saca fotos, nota, estimados y orientación). Anuncio ajeno: solo renders.

## Fidelidad y materiales: cómo trabajar (segunda pasada del depto 6, 2026-11-08)

Lo que permitió corregir la cocina del depto 6 y cambiar la madera sin romper nada. Vale para cualquier depto.

### Medir antes de escribir un número
- **Plano en píxeles.** Escala: dos caras conocidas (el largo de un ambiente que ya se sabe, o una cota). Para leer una
  línea del plano: `magick plano.jpg -crop 230x1+420+330 -colorspace gray -threshold 55% txt:-` y contar `#` y `.`
  (pared y hueco). Así salió el hueco de la puerta de la cocina (0,74 a 1,65 m de la pared de la heladera) y el pilar.
  Cada hueco: anotar su distancia a la esquina más cercana antes de escribir el `at`.
- **Fotos de frente como regla.** En una foto que mira de frente una pared, todo lo que está en esa pared tiene la misma
  escala: medir en píxeles contra algo conocido (la altura piso–techo del scene, una puerta, una mesada de 0,90). La
  ventana del lavadero salió 0,96 × el ancho de la puerta, con el antepecho a 1,26 m y las dos hasta 2,20.
- **Lo que está más cerca de la cámara no se mide contra la pared del fondo** (un pilar, un mueble): la perspectiva lo
  agranda. Para profundidades, la regla es otra foto del mismo rincón.

### Fotos que engañan
- Una sola foto no da profundidad: en `cocina2` el calefón parecía "encima" del mueble y el mueble estaba a 30 cm del
  pilar. La foto opuesta (`cocina`, mirando al revés) y el plano lo resolvieron, y el usuario lo confirmó con un dibujo.
- Una franja oscura en el borde de una foto suele ser el marco o la hoja de una puerta junto a la cámara: ubica la
  cámara (está al lado de esa puerta) y sirve para encuadrar.
- Si después de cruzar fotos y plano sigue la duda, preguntarle al usuario **con la foto y lo que se ve**, en una línea
  ("el mueble blanco con tapa de madera, a la derecha en cocina2"). No usar el nombre del componente (`kitchen-cart`) en
  la pregunta: el usuario no lo conoce. Contesta rápido y a veces con un dibujo sobre la foto.

### Pilares, puertas y piezas que se tocan
- Pilar o pleno: `structure` `column` metido 4–5 cm en las paredes que toca (sin caras compartidas), y el ambiente en
  `rects` en L alrededor (así el zócalo y el validador lo respetan). El zócalo del pilar lo pone el motor.
- El contramarco de una puerta asoma 3 cm afuera del vano: dejar ≥ 1 cm entre una puerta y una ventana o un pilar
  vecinos. Una puerta y una ventana del mismo juego de carpintería van a 1 cm (se ven pegadas).
- Objeto de pared en la cara de un pilar que mira a −z: `rotation` 180 y `at` con z en esa cara.
- Puerta que en las fotos está cerrada: `open` 0. Puerta abierta que no se ve en ninguna foto: que abra hacia donde no
  tapa nada (`side`, `hinge`, `open` 170 la deja contra la pared).

### Cámaras de las vistas
- `encuadre.html?depto=<id>&vistas=a,b` afina bien si la pose de partida está cerca (≤ 30 cm, pocos grados); si no, se
  queda en un óptimo local. Primero una pose a mano: probar 3 poses con `__viewer.setPose({ p, t, f, fit: 1.37, mode:
  'walk' })`, `capture()` y una tira con la foto (`magick a.jpg b.jpg c.jpg foto.png -resize 592x432! +append`), y
  después `encuadre`. Después de cambiar muebles, volver a encuadrar las vistas de ese ambiente (el puntaje lo dice).
- Fotos de inmobiliaria en cocinas chicas: cámara baja (1,2 m) apenas inclinada hacia arriba y gran angular (fov 70–75).
- `__viewer.go(vista)` desde código deja el corte de techo de la vista general: para mirar el recorrido como el
  usuario, recargar y usar los botones.

### Cambiar el aspecto del motor (texturas, materiales)
- Nunca directo: página de muestras en `motor/pruebas/` (ver `maderas.html`) con la actual en la fila 1 y las
  alternativas sobre las mismas piezas, lejos / media / cerca de día y cerca de noche. El usuario elige.
- La página reemplaza en vivo las texturas de los materiales del motor (buscando los que usan la textura actual), así
  la muestra se ve exactamente como se verá en un depto. Después de pasar la elegida al motor, correr la página con
  `?solo=<elegida>`: la fila 1 (motor) y la fila 2 (muestra) tienen que ser iguales.
- Antes de cambiar una textura, buscar quién más la usa (`grep "TEX.woodR"`): el brillo de la madera también lo usaban
  los pisos; la madera de muebles pasó a tener el suyo para no cambiar los pisos.
- Texturas que se repiten: el período de cada ruido tiene que dividir justo la textura (512 / período entero); si no,
  aparece una costura cada repetición.
- Detalle chico (poros) como rayitas a lo largo de la veta, no como puntos (de cerca parecen lluvia); anillos de menos
  de ~5 px forman muaré de lejos.
- Después: `motor/generar-texturas.html` (regenera todas; en git deben cambiar solo las tocadas) y
  `verificar.html?deptos=depto5,<en curso>`; `&base=1` solo con el cambio aprobado.

- Si el cambio es un efecto (lente, contraluz, arrugas), la página prueba valores sobre deptos reales: `lente.html` y
  `telas-luz.html` (filas = alternativas, columnas = `depto:vista:dia|noche`). El grano se ve solo a tamaño real.
- Lo que cambia entre la cámara en movimiento y quieta: `motor/pruebas/quieto-movil.html?vistas=a,b` (con `&antes=1`
  sin lente/contraluz/arrugas). Nada debe aparecer ni desaparecer al frenar: solo se alisan bordes.

### Tiempos medidos (PC, panel oculto)
`comparar` ~8 s por vista con `&view=`; `encuadre` ~15 s por vista; `hornear` ~40 s; `verificar` con dos deptos
~80 s; `maderas.html` con seis vetas ~30 s; `generar-texturas` ~20 s; `lente.html` ~2 min; `telas-luz.html` ~3 min.
