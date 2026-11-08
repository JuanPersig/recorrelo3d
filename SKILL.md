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
