# Informe de la noche del 2026-11-10

Pedido: hacer todas las calibraciones, pruebas y modificaciones necesarias para que los modelos sean más fieles a los
departamentos. Todo se hizo sobre el depto 5 (verdad conocida) y el depto 6 (que es el de `DEPARTAMENTO_NUEVO`).
No se instaló nada, no se publicó nada y no se hizo `git push`.

## 1. Lo más importante

1. **En el depto 6 las paredes no son el problema.** Superpuse automáticamente las paredes del modelo sobre el plano
   real (`DEPARTAMENTO_NUEVO/plano.jpg`): coinciden a **3,7 cm de promedio**. Las paredes largas, el tabique central, el
   baño y el pasaje están a 0–5 cm. Así que lo que se ve distinto entre el render y las fotos viene de **otro lado**:
   las cámaras de las vistas, los materiales y los objetos.
2. **Las cámaras son el cuello de botella, y no encontré cómo calzarlas automáticamente.** Probé cinco puntajes de bordes,
   tres búsquedas, el fov fijo, un control con foto sintética y un puntaje por color de región: ninguno recupera la
   cámara (detalle en la sección 3). Sin cámaras buenas, ni la comparación visual ni la medición de colores son confiables
   (el puntaje de parecido del depto 6 es ΔE 13,2 y lo domina la cámara).
3. **Encontré y arreglé dos defectos de las hojas de comparación** (no del motor): salían borrosas con una ventana
   angosta y la hoja de "día" se capturaba con luz de noche si la página recién abría.
4. **Agregué tres controles de geometría** a `validate.js`; funcionan sin falsos positivos en los dos deptos.

## 2. Qué cambió (todo en `master`, listo para revisar con `git log`)

| Qué | Archivo | Riesgo |
|---|---|---|
| Plano medido: detecta los muros del plano y los compara con un `scene.json` | `motor/plano-medido.mjs` (nuevo; usa ImageMagick, que ya está) | ninguno: solo lee y mide |
| Controles: aberturas que se pisan, ambientes superpuestos, lado hacia afuera sin pared ni columna | `motor/validate.js` | bajo: depto 5 sigue con 0 avisos y depto 6 con los 3 de baño de siempre |
| Hojas de comparación a tamaño fijo y esperando la precarga | `motor/comparar.html` | ninguno en el visor |
| Laboratorio de cámaras (variantes, barridos, simulaciones) | `motor/calibrar.html`, `motor/pruebas/calibrar-puntos.mjs`, `motor/pruebas/calibrar-pared.mjs` | ninguno: archivos nuevos |
| Datos y láminas | `capturas/calibrar/`, `capturas/plano-medido/`, `capturas/depto6/` (hojas nuevas) | ninguno |
| Plan, ticket T-70, LEEME, este informe | `PLAN-PRECISION.md`, `TICKETS.md`, `LEEME.md` | ninguno |

**No toqué** `engine.js`, `components.js`, ningún `scene.json` ni el aspecto de ningún departamento. Verificación oficial
(`verificar.html?deptos=depto5,depto6`): depto 5 «sin cambios» (0,1–0,2 %, que es el grano del lente) y depto 6 con sus
tres avisos del baño de siempre, sin diferencias contra la línea base.

Para deshacer todo: `git reset --hard 06e4205` (ese es el último commit anterior a esta noche).

## 3. Resultados con datos

### 3.1 Plano medido, depto 6 (`capturas/plano-medido/depto6/`)

Escala ajustada: 51,3 px/m. Distancia media entre las paredes del modelo y las del plano: **3,7 cm**.

| Pared del modelo | Mediana de desvío | Tramo que coincide (< 6 cm) |
|---|---|---|
| Medianera larga (x = −0,07) | 0,3 cm | 100 % |
| Medianera larga (x = 6,29) | 0,1 cm | 100 % |
| Tabique central entre las dos franjas | 3,5 cm | 100 % |
| Baño (x = 4,29..6,29, z = 3,72) | 0,2 cm | 100 % |
| Lados del lavadero | 0,3 y 4,4 cm | 100 % y 96 % |
| Cocina, baño, pasillo (resto) | 2–5 cm | 56–73 % (el resto son aberturas) |
| **Pared de entrada (z = 8,83)** | **≈ 10–12 cm** | las ventanas del plano son líneas finas |
| **Fondo del lavadero (z = 10,13)** | **≈ 15 cm** | 7 % |

Dos paredes quedan sistemáticamente 10–15 cm más lejos en el modelo que en el plano (≈ 1,4 % del largo). Puede ser
la escala del plano en ese eje (el plano da 10,06 m en total y no se sabe exactamente entre qué ejes) o un error real
del modelo. **No lo corregí**: son 10–15 cm que el plano no permite asegurar y el lavadero ya tiene una decisión
pendiente tuya (el lado hacia el patio).

Aberturas: las puertas coinciden a ±6 cm (entrada 14 y −2 cm; pasaje 4,43–5,32 contra 4,48–5,16: el modelo es ≈ 16 cm
más ancho). La comparación automática de ventanas **no es confiable** (el plano las dibuja con líneas finas y las
paredes salen fragmentadas), así que no la tomo como medida.

### 3.2 Prueba A: afinar la cámara por bordes (depto 5, 20 vistas, `capturas/calibrar/`)

| Experimento | Resultado |
|---|---|
| 5 puntajes × 3 desplazamientos, fotos reales (300 corridas) | **0 recuperadas** (< 10 cm y 2°); error final mediano 25–44 cm y 2,6–6,3° |
| Fov fijo (oráculo, 80 corridas) | 0 recuperadas |
| Foto sintética (render del propio modelo), 3 búsquedas | 0–3 de 20; la cámara correcta puntúa mejor que la de partida en 20/20 pero desde 18–30 cm no hay pendiente |
| Barrido de sensibilidad | la cámara aprobada es el pico sobre un eje en 0–3 de 20 vistas |
| **Puntaje por color de región (nuevo esta noche)** | barrido casi plano y su mejor punto está en el extremo (4–8° de giro o fov), no en la cámara aprobada: **descartado** |
| Simulación: cámara desde ≥ 8 esquinas, fov conocido | 5,8 / 10,2 / 21,9 cm con marcas de 1 / 2 / 4 px (en 420 px) |
| Simulación: pared rectificada con 4 esquinas | 2,7 / 5,5 / 11 cm; solo 8 de 20 vistas tienen una pared entera |

Conclusión: el cálculo directo desde esquinas marcadas es lo único prometedor, pero exige marcas de 1–2 px (0,25–0,5 % del
ancho de la foto), fov conocido y 8 o más esquinas repartidas. No medí cuán precisas son las marcas que yo pueda hacer.

### 3.3 Parecido de color del depto 6 (`capturas/depto6/parecido.json`)

ΔE medio 13,2 (menor es mejor). Por vista: balcón 3,7 · baño 2 7,1 · cocina 10,1 · living 2 10,5 · baño 11,5 · comedor
13,4 · completo 13,6 · comedor 2 13,8 · living 14,6 · dormitorio 15,5 · cocina 3 19,7 · **cocina 2 25,1**. Los
mayores errores son puertas que miden 31–41 porque la cámara apunta a otro lado que la foto: es el efecto de las cámaras
que no calzan, no de los colores.

### 3.4 Diferencias visibles del depto 6 contra sus fotos (hojas nuevas en `capturas/depto6/`)

Vistas por ojo, sin medir; todas dependen de las cámaras:
- Encuadre: en la cocina, la heladera cae ≈ 14 % más a la derecha que en la foto; en el living y el comedor la foto es
  más abierta (se ve más pared a los lados). En el baño la cámara es muy distinta.
- Cortina del dormitorio más amarilla que la foto (más pálida, casi crema).
- Revestimiento de la cocina sin los dibujitos del azulejo (ya estaba anotado como pendiente).
- Todo lo estructural (distribución, aberturas, ubicación de muebles contundentes) se reconoce igual que en las fotos.

## 4. Lo que no hice y por qué

- **No modifiqué ningún departamento.** El plano ya coincide con el modelo; cambiar paredes 10–15 cm sin que el plano lo
  asegure habría sido inventar. Las cámaras no se tocan a ojo (es lo que ya salió mal).
- **No toqué el render** (luz, texturas, materiales): ya estaban bien y no apareció ningún defecto del motor.
- **No instalé nada** (no hizo falta: ni OpenCV ni Python). **No publiqué nada** y **no hice push** (el commit de
  respaldo y los de esta noche están solo en tu repositorio local).

## 5. Qué sigue (decisiones tuyas)

1. **Cámaras.** Es lo que más pesa. La única vía que no está descartada es calcular la cámara desde esquinas marcadas, y
   falta medir qué tan precisas son mis marcas sobre 3–4 fotos del depto 5. Si no alcanzan, la alternativa realista es
   dejar las cámaras como están y no usar la comparación como criterio fino (solo estructura y objetos).
2. **Plano medido para un departamento nuevo.** La herramienta ya sirve para controlar un modelo contra su plano
   (`node motor/plano-medido.mjs comparar <depto> …`). Para generar `rooms` y `walls` desde cero falta ubicar a mano qué
   franja es cada pared; es la parte que sigue.
3. **Los 10–15 cm del lavadero y la pared de entrada:** ¿confirmás una medida real o lo dejo como está?
4. **Toma guiada de fotos** para anfitriones (ver `PLAN-PRECISION.md`, sección 9): es lo que más baja el error de raíz.

## 6. Salvedades

Todo el trabajo de cámaras está medido sobre un solo departamento (depto 5), con cámaras aprobadas a ojo como "verdad",
a 320 px. La comparación plano–modelo del depto 6 ajusta la escala a las medidas del propio modelo, así que mide
coincidencia relativa, no medidas absolutas. Las simulaciones suponen cámara ideal, sin distorsión de lente.
