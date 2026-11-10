# Plan de precisión: medir en vez de estimar

Escrito el 2026-11-10. Origen: los últimos departamentos (depto 6 y el dúplex) no salieron fieles aunque se tenía el
plano. Este documento junta el diagnóstico, la propuesta, cómo se prueba y cómo se decide. **El motor (`engine.js`,
`components.js`) no se toca para nada de esto hasta que la prueba A diga que vale la pena.**

## 1. Diagnóstico (con evidencia del repositorio)

- De los 8 errores de SKILL.md ("Errores que no se repiten"), **5 son de geometría**: plano espejado (1), pared que no
  existe (3), esquina comida (6), puerta corrida respecto del plano (7), paredes de fotos ambiguas contra el plano (8).
  Dos son muebles inventados (2, 4) y uno es un error de herramienta (5).
- El dúplex (depto 7) tuvo cinco commits seguidos corrigiendo la estructura después del primero, y se borró.
- Hoy el modelo **lee la imagen y escribe coordenadas a ojo**, y después juzga a ojo comparando hojas. Esa es su parte
  más débil. El depto demo quedó bien por iteraciones con el usuario, no porque el proceso sea sólido.
- El plano de los anuncios es difícil: hojas con varias unidades, sin nombres de ambiente, hojas de puertas sin dibujar,
  placards como líneas finas, pilares con cruces. Las ventanas y los muebles salen solo de fotos gran angular (0,5×).
- Falta una verdad medida contra la cual probar las herramientas.

## 2. Principio

**El modelo lee y entiende; el código mide.** Cada número de geometría (cota, posición, ángulo, distancia) lo calcula
una herramienta y lo verifica una medición. Las reglas en prosa de SKILL.md pasan a ser controles automáticos.

## 3. Las cuatro piezas

1. **Plano medido.** Página `motor/plano-medido.html` (JavaScript, sin dependencias): calibra la escala con dos cotas o
   más en ejes distintos y muestra el desvío; trabaja con las caras interiores de cada ambiente y deriva los ejes de los
   muros (así los dibuja `scene.json`: eje desplazado medio espesor); marca pilares y ambientes en L; las cotas sueltas
   se suman contra el total del plano y, si no cierran, frena. Exporta `rooms` y `walls`; las `openings` salen como
   borrador a confirmar con las fotos (regla del LEEME: las aberturas se ubican por lo que las rodea). Compuerta 1 igual
   que hoy: plano 2D dibujado y OK del usuario.
2. **Cámaras calibradas contra las líneas de la foto.** Ver sección 5 (prueba A) y sección 6 (resultados).
3. **Ubicar muebles y aberturas proyectando desde una cámara calibrada.** Un píxel apoyado en el piso cae en un `(x, z)`
   exacto (rayo contra el plano del piso); en una pared, contra el plano de esa pared. Mis marcas en la foto se hacen
   sobre recortes ampliados con grilla y se verifican dibujando la reproyección sobre la foto. Depende de la pieza 2.
4. **Controles automáticos.** Cada error de SKILL.md pasa a `validate.js` o `verificar.html`: cada rectángulo con cruz del
   plano existe como `structure`; ningún tramo de pared del plano falta; residual de bordes por vista; muebles contra la
   pared con `against` (ambiente + lado + distancia a la esquina, sin inventar ids de muro; aditivo, los scenes actuales
   no cambian).

Orden: 1, 2, 4, 3. La 3 solo sirve si la 2 funciona.

## 4. Lo que ya existe y hay que tener en cuenta

- **T-27 (`motor/encuadre.html`) ya compara bordes**, no colores: Sobel de la foto contra los bordes del mapa de
  identificación del modelo, con los de estructura al doble. Fue probado el 2026-11-03 en 31 vistas con la cámara
  corrida a propósito y **no volvía a la cámara buena** (quedaba a 7–44 cm y 1,4–8,6°; el fov casi nunca volvía:
  alejarse y abrir el campo de visión se compensan). Su "próximo paso" propuesto (puntaje solo con líneas de estructura,
  dos escalas, fov fijo con EXIF) **nunca se hizo**. La prueba A es ese próximo paso, medido.
- T-34 (fotos 0,5×) sigue pendiente: la distorsión del lente no se modela.
- `parecido.js` (mapa de identificación, puntaje por objeto) y `comparar.html` (hojas) sirven de base.
- Para pegar muebles a la pared, `api.plan()` ya devuelve ambientes y huellas de muebles.

## 5. Prueba A: ¿se recupera la cámara con los bordes de la estructura? (solo JavaScript)

Herramienta: `motor/calibrar.html` (laboratorio; no modifica nada). Corre sobre el depto 5, cuyas cámaras fueron
aprobadas contra las fotos.

- **Procedimiento:** parte de la cámara aprobada de cada vista con foto (20 vistas), la corre a propósito (A: 15 cm, 10 cm,
  4°, 2°, 3° de fov; B: la contraria; C: 30 cm hacia atrás con el mismo fov) y deja que la búsqueda la devuelva.
- **Puntajes comparados:** `base` (el de T-27), `sm`/`ss` (solo bordes de estructura, media o suma), `cm`/`cs`
  (distancia a los bordes fuertes de la foto, media o suma). Variante de oráculo con el fov fijo (`&fov=fijo`) para saber
  si el problema es el fov.
- **Lámina de control** (`&lamina=1`): la foto con los bordes de estructura del modelo con la cámara aprobada, la de
  partida y la recuperada.
- **Medidas:** error de posición (cm), de dirección (°) y de fov (°); "recuperada" = menos de 10 cm, 2° y 3° de fov; y si
  la cámara aprobada puntúa mejor que la de partida y que la final (si no, el que falla es el puntaje, no la búsqueda).
- **Criterio para seguir con las piezas 3 y 4:** en la mayoría de las vistas del depto 5, error menor a 10 cm y 2°.
  Si no se cumple, no se avanza con esas piezas sobre esta base.
- **Salvedad de la prueba:** la "verdad" son cámaras ajustadas a mano por el usuario, buenas pero no perfectas al píxel.
  Un error de pocos centímetros o de 1–2° puede venir de ahí.

## 6. Resultados de la prueba A (2026-11-10)

**Veredicto: el criterio NO se cumple. Afinar la cámara desde un encuadre aproximado con los bordes de la foto no
funciona de forma confiable, ni con la estructura sola, ni con otros puntajes, ni con mejores búsquedas.** No se avanza
con la pieza 3 sobre esa base. Todo se corrió sobre el depto 5 (20 vistas con foto), a 320 px, en CPU, sin instalar nada.
Las salidas están en `capturas/calibrar/` (`*.json` y láminas `lam-*.jpg`).

| Experimento | Resultado |
|---|---|
| **Fotos reales**, 5 puntajes × 3 perturbaciones (300 corridas) | **0 recuperadas.** Error final mediano 25–44 cm y 2,6–6,3° (la cámara de partida estaba a 18–30 cm y ~4–5°: queda **más lejos** que al empezar). La cámara aprobada puntúa mejor que la de partida solo en 7–12 de 20 vistas. |
| **Oráculo: fov fijo** (se le da el fov correcto) | **0 de 80.** 27–37 cm y 4–5°. El fov **no** es la causa principal (contradice la hipótesis de T-27). |
| **Barrido de sensibilidad** (mover un solo parámetro de la cámara aprobada) | La cámara aprobada es el pico sobre un eje en 0–3 de 20 vistas; el mejor punto suele estar a 2–4° de giro o 4–8° de fov. El puntaje además prefiere campos de visión más abiertos (ve más bordes). |
| **Control con foto sintética** (la "foto" es el render del propio modelo desde la cámara aprobada: ahí la verdad es exacta) | La cámara correcta puntúa mejor que la de partida en **20 de 20**, pero la búsqueda solo la recupera en 0–3 de 20 con tres búsquedas distintas (local, de grueso a fino, evolutiva con movimientos combinados). |
| Simulación: **resolver la cámara desde esquinas conocidas** (PnP) | Con fov conocido y marcas de 1 / 2 / 4 px (en 420 px): error mediano 5,8 / 10,2 / 21,9 cm, 95 % / 45 % / 13 % de los intentos "bien" (< 10 cm y 2°). Con fov desconocido: 33 % / 8 % / 2 %. Solo 16–17 de 20 vistas tienen 4 o más esquinas a la vista; cocina, entrada y consola dan 2–6 cm, los living 7–50 cm. |
| Simulación: **rectificar una pared con sus 4 esquinas** (homografía, sin cámara ni fov) | Solo 8 de 20 vistas tienen una pared con las 4 esquinas dentro de la foto. Error al ubicar un punto: mediana 2,7 / 5,5 / 11 cm con marcas de 1 / 2 / 4 px. |

**Qué dice esto (en orden de peso):**
1. El **pico del puntaje es angosto**: incluso con bordes perfectos (foto sintética), desde 18–30 cm de error no hay
   pendiente que guíe hacia la cámara buena. Un detector de líneas mejor (opción B, OpenCV) **no cambia eso**, porque en
   el caso sintético los bordes ya eran perfectos. **B no es el siguiente paso.**
2. Con fotos reales hay además una **diferencia entre foto y modelo** (la cámara aprobada ni siquiera puntúa más que
   la de partida en la mitad de las vistas): cámaras aprobadas a ojo, medidas del modelo y distorsión del 0,5×.
3. Calcular la cámara **directamente** desde esquinas conocidas sí es mucho mejor que buscarla, pero exige fov conocido,
   8 o más esquinas bien repartidas y marcas de 1–2 px (0,25–0,5 % del ancho de la foto). Hoy esa precisión de marca no está
   probada (ni mía ni del usuario): es lo que falta medir.
4. Rectificar una pared da una medida métrica directa de dónde está una abertura, justo lo que falló en los errores
   n.º 3 y 7 de SKILL.md, pero sirve solo en las fotos donde una pared se ve entera.

**Salvedades:** una sola escena (depto 5); la "verdad" son cámaras ajustadas a mano; 320 px de resolución; las
simulaciones suponen cámara ideal (sin distorsión de lente), esquinas bien identificadas y modelo igual a la realidad (el
mejor caso); la precisión de marcas hechas por mí sobre recortes ampliados no está medida.

**Cambios al plan a partir de esto:**
- Se **abandona** el camino de T-27 (afinar la cámara automáticamente por bordes). Queda documentado en TICKETS.md.
- **Siguen** las piezas 1 (plano medido) y 4 (controles automáticos): no dependen de la cámara.
- Pieza 2 **replanteada**: de "recuperar la cámara" a "calcularla desde marcas" (esquinas) y "rectificar paredes" para
  ubicar aberturas; con fov conocido por EXIF o por una foto de calibración. Antes de construirla, **medir la precisión
  real de las marcas** sobre 3–4 fotos del depto 5 (error en píxeles contra la reproyección de la cámara aprobada). Si
  es de 2 px o menos en 420 px, sigue; si no, se descarta y la ubicación fina de aberturas queda con las fotos y la regla
  de preguntar al usuario.
- Herramientas de esta prueba: `motor/calibrar.html` (laboratorio: variantes de puntaje, perturbaciones, barrido,
  `&fov=fijo`, `&sintetica=1`, `&opt=es`, `&lamina=1`), `motor/pruebas/calibrar-puntos.mjs` y
  `motor/pruebas/calibrar-pared.mjs` (simulaciones, `node` solo).

## 7. Si A no alcanza: B (OpenCV) y otras salidas

**Actualización (2026-11-10): A no alcanzó, pero B no es el paso siguiente** (ver sección 6, punto 1: el límite no es el
detector de líneas). Esta sección queda como referencia. La opción B no reemplaza a A: reemplaza solo el detector de líneas (script de Python con `opencv-python-headless` y
`numpy`, ~100 MB, sin PyTorch ni GPU, en una carpeta con su propio entorno; guarda `lineas.json` y la página lo lee).
Aporta mejor detección (LSD), corrección de la distorsión del lente y puntos de fuga robustos. **No se instala nada sin
el OK del usuario**, con la lista exacta y los tamaños.

| Si A falla por… | Qué hacer |
|---|---|
| líneas ruidosas o poco precisas | B |
| distorsión del lente | B con corrección |
| la foto casi no muestra estructura (primer plano de cocina o baño) | marcar a mano 4–6 puntos conocidos (PnP) |
| la estructura del modelo está mal | no es de la herramienta: es lo que debe señalar |

## 8. Lo que no se hace

- No se usa reconstrucción 3D (VGGT, COLMAP) para esto: con pocas fotos y en CPU (la PC tiene una AMD RX 5600 XT, sin
  CUDA) da menos de lo que da la pieza 2. Queda como opción futura, y antes habría que revisar licencias.
- No se toca la luz, las texturas ni el render: están bien.
- No se baja la regla "sin medidas, no se modela".

## 9. Fuera del motor (para el servicio)

Toma guiada de fotos para anfitriones (cada ambiente desde dos esquinas opuestas, cámara a 1,2 m nivelada, en 1×, una
cota a la vista) y, si el anfitrión tiene un iPhone con LiDAR, un plano medido con Polycam o Magicplan en lugar del de la
inmobiliaria. No aplica a anuncios ajenos como el del depto 6.
