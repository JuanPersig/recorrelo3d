# Prompt: departamento nuevo, de punta a punta y en el menor tiempo

Copiar desde la línea de abajo y pegarlo en una sesión nueva en `C:\Users\juanp\Desktop\3D`, completando lo que está
entre `< >`. Reemplaza a `prompt-depto-grande.md` (que sigue sirviendo como referencia de calidad para un depto cargado).
Se armó el 2026-11-10 a partir de la auditoría del depto 6, el plano medido y los arreglos de superficies.

---

Vamos a modelar un **departamento nuevo**. El objetivo es doble: que este depto salga fiel a las fotos y al plano **con la
menor cantidad de vueltas**, y que todo lo que haga falta mejorar se resuelva **en el motor, de forma general**, para que
el siguiente salga igual de bien. El depto 5 ("Departamento demo") es la referencia que no se puede romper. Trabajá en
tandas largas, sin frenar en cada paso: solo pará en las tres compuertas y en lo que está marcado como «preguntar».

**Datos del depto nuevo**
- id: `<deptoN>` · nombre visible: `<nombre, sin barrio ni dirección>`
- fotos: `<carpeta>` (originales a `fotos/<id>/original/`, PNG a `fotos/<id>/`)
- plano: `<archivo>` (obligatorio: sin plano o medidas reales **no se arranca**, ver abajo) · texto del anuncio con medidas
  o ambientes: `<link o texto>`
- ¿cliente con permiso o anuncio ajeno?: `<permiso / ajeno>` (ajeno: solo renders, nunca sus fotos en algo público)

## 0. Antes de tocar nada (lectura obligatoria, ~5 min)
1. `LEEME.md` (estado y reglas), `SKILL.md` completo: las **tres compuertas**, «Errores que no se repiten» (1 a 8),
   «Fidelidad de superficies» y «Tapizado de sillas». Después `INFORME-NOCTURNO-2026-11-10.md` y
   `AUDITORIA-DEPTO6-2026-11-10.md` (por qué el error está en las superficies, no en las paredes) y `motor/CATALOGO.md`.
2. Levantá el servidor `visor` (`.claude/launch.json`, puerto 5180). **Mantené el panel del navegador visible** cuando midas
   tiempos o comparés: en segundo plano todo sale 7 a 50 veces más lento y las medidas engañan.
3. **Hacé en un solo mensaje todas las preguntas que necesites** (fotos que faltan, aclaraciones del plano, qué ambientes
   no tienen fotos) y seguí con lo que no dependa de la respuesta. No pidas permiso por cada duda chica.

## 1. Inventario (paso 1 de SKILL.md), con lo que cuesta caro después
- Por foto: ambiente, desde dónde mira, qué se ve. Además de los muebles, **anotá ya los colores y materiales de las
  superficies grandes de cada ambiente**: piso (color y si es lustrado), paredes (¿distinto color por ambiente?), zócalo,
  cortinas, mesada y su material (¿acero?), revestimientos (tamaño de azulejo, color), puertas y marcos, **color del asiento
  y del respaldo de sillas y sillones** (en el depto 6 se modelaron negros y eran blancos).
- **Pedí las fotos que faltan ahora**, antes de la compuerta 1 (un rincón visto en una sola foto engaña).
- Un ambiente sin ninguna foto queda como espacio vacío y va en `estimated`.

## 2. Compuerta 1 · Estructura (con las herramientas nuevas)
1. **Plano medido, no a ojo.** Medí el plano con código:
   - `node motor/plano-medido.mjs detectar <plano.jpg> --out=capturas/plano-medido/<id> --oscuro=125 --grosor=3` y, para
     los tabiques finos, otra vez con `--out=capturas/plano-medido/<id>-fino --oscuro=185 --grosor=2 --largo=30`.
     Mirá `muros.png` (franjas numeradas sobre el plano). Si las paredes del plano son de otro gris, ajustá `--oscuro`.
   - Escala: con **dos cotas en ejes distintos** y comprobá que las cotas sueltas suman el total. Si no cierran, es una
     duda, no un ajuste. Trabajá con las **caras interiores** de cada ambiente (`rooms`) y derivá los ejes de los muros
     (el eje queda medio espesor afuera). Cada rectángulo con cruz o rayado es un pilar o pleno (`structure`).
   - Armá `rooms`, `walls` y `structure`; las aberturas ubicalas con las fotos (por lo que las rodea), no solo con el plano.
   - **Contrastá con el plano:** `node motor/plano-medido.mjs comparar <id> --muros=… --fino=… [--imagen=<plano>]` (hoy
     supone la fachada a la izquierda y x creciendo hacia arriba; si tu plano está girado, pasá `--s --tx --ty` o
     ajustá el código, que es general). Objetivo: distancia media < 5 cm; mirá `superpuesto.png`. Las ventanas se miden
     mal (el plano las dibuja con líneas finas): usá las fotos.
2. Los controles automáticos de `validate.js` tienen que dar **cero avisos** de geometría: aberturas que se pisan,
   ambientes superpuestos, lados hacia afuera sin pared ni columna, y los de siempre (aberturas que se salen, muebles fuera de
   ambiente, circulación de 60 cm).
3. Secuencia de cada pared por foto (SKILL.md) y hojas (`comparar.html`) mirando **solo** estructura.
   **No intentes calzar cámaras automáticamente**: ya se probó de siete formas y no funciona (T-70). Las cámaras se ajustan
   a mano con la foto superpuesta; hasta que calcen, no juzgues la estructura por la imagen: ubicá la cámara como en la foto.
4. **Mostrame el plano 2D (`motor/plano.html?depto=<id>`) con la lista de dudas y esperá mi OK.**

## 3. Compuerta 2 · Muebles contundentes
Solo los que se ven, en su lugar, tamaño y orientación. Antes, compará el inventario con `CATALOGO.md` y listá las piezas o
variantes que faltan: se agregan al motor en **una tanda aparte** (componentes generales y paramétricos, con ficha en `META`,
piezas que se tocan sin caras compartidas, probadas de cerca con `motor/pruebas/cerca.html`), nunca a mitad del depto.
Para sillas y sillones, color del asiento y del respaldo **según las fotos**; tapizado de sillas con `M.tweed` (opciones
`fabric` y `backCushion`).

## 4. Compuerta 3 · Superficies, detalle, luz y verificación
1. **Primer pase de superficies con los parámetros que la auditoría del depto 6 mostró que fallan** (el 55 % del error estaba
   en 12 problemas repetidos): piso de madera lustrado (`gloss` ≈ 0,75, color por medición, no por las manchas de sol); piso
   claro de cocina o baño con el albedo que propone `colores.html` (los pisos claros se aclaran de más); cortinas
   (`lighting.curtainLight` más bajo si en las fotos no son cálidas); mesada de acero (`topStyle: "steel"`); lavatorio con
   pie (`style: "pedestal"`); **color de pared y de zócalo por ambiente** (`rooms[].wallColor` y `rooms[].baseboard`); color
   de puertas y marcos; tamaño y color de los azulejos.
2. **Medir, no opinar:** `comparar.html?scene=…&medir=<id>` y `node motor/pruebas/resumen-parecido.mjs <id> floor wall
   room:<ambiente> item:<tipo> door --base=<medición anterior>`. Probá variantes en copias temporales
   `departamentos/<id>/scene.<nombre>.json` (**borralas al terminar**) y aceptá un cambio solo si baja el puntaje **y** se ve
   mejor en la hoja. Si la medición y el ojo discrepan, decidí con las dos y anotá por qué. El puntaje no es una medida
   absoluta mientras las cámaras no calcen: sirve para comparar variantes.
3. Detalles (adornos, textiles, objetos chicos), después **hornear la luz una sola vez** (`motor/hornear.html?id=<id>`,
   `"lighting": { "bake": "gi.json" }`) y **`verificar.html?deptos=depto5,<id>` una sola vez** (demo «sin cambios»; `&base=1`
   solo con el cambio bueno).
4. **Auditoría final** (como la del depto 6, `AUDITORIA-DEPTO6-2026-11-10.md`): hoja por hoja, cada diferencia con tipo
   y gravedad (3 se nota a primera vista, 2 comparando, 1 detalle). **Estructura y aberturas tienen que dar 0 diferencias de
   gravedad 3.** Agrupá lo que se repite: un defecto repetido es un parámetro o una pieza del motor, no varios errores.

## 5. Mejoras de motor (si aparecen)
Generales, con un valor por defecto que no cambie nada de lo aprobado y verificadas con el demo. **Si cambian el aspecto**
(texturas, materiales, brillo): primero una página de muestras en `motor/pruebas/` (ver `maderas.html` y `telas-sillas.html`)
y **yo elijo**; después se pasa al motor, se pre-generan las texturas (`generar-texturas.html`) y se anota en `SKILL.md`
(síntoma → causa → arreglo → qué mirar en el próximo). Pendientes conocidos del motor, **sin bloquear el depto**: puertas y
marcos de acero, azulejos con relieve y motivos, ventana con malla y exterior apagado.

## 6. Eficiencia (lo que ahorra tiempo)
- Objetivo: estructura ~10 min, muebles ~10, superficies y verificación ~15. Comparar solo las vistas que cambiaron
  (`comparar.html?…&view=a,b`, ~8 s por vista); hornear y verificar **una vez**, al final.
- Si algo del catálogo falta, anotarlo y seguir con una pieza aproximada marcada, en vez de frenar; las piezas nuevas van en una
  tanda aparte.
- Rendimiento: anotar armado (ms), mallas y triángulos (con el panel visible). Si pasa de ~900 dibujos por cuadro o ~6 s de
  armado en la PC, optimizar en el motor antes de seguir.

## 7. Cierre de cada tanda
Anotar en `TICKETS.md` (qué, cómo se verificó, qué falta), actualizar `LEEME.md`, commitear en `master` (o en una rama si hay
cambios de motor grandes, y pasarla a `master` cuando el demo da «sin cambios»). **El `git push` lo hago yo.** Mostrame láminas
de antes y después y la tabla de la auditoría final.

## Vara de calidad
- Fiel a las fotos y al plano, sin inventar lo que no existe; lo fino (teléfonos, cables, almohadones) no justifica retrasar
  paredes ni muebles contundentes.
- Sin caras superpuestas ni piezas flotando; 60 cm de circulación; `warnings` vacío (salvo los ya justificados).
- Nada que se prenda, apague o cambie de calidad a la vista mientras se camina. Espejos sin reflejo. Sin fotos reales por
  las ventanas: entorno generado. Luz de día cálida suave y noche cálida y legible.
- Entrega = recorrido 3D + tarjeta con QR. Sin videos, sin imágenes sueltas ni plano.

## Reglas
- **Preguntar antes de** publicar o republicar, descargar archivos o instalar dependencias (Python, OpenCV, etc.: no hace
  falta nada de eso para este flujo). Las texturas escaneadas siguen esperando mi aprobación de la lista exacta.
- Todo lo visible, en español rioplatense. No editar con `Get-Content`/`Set-Content` de PowerShell (rompe los acentos);
  scripts temporales en el scratchpad. Sintaxis con `node --input-type=module --check < archivo`.
- Cambios de motor generales; lo puntual de un depto va en su `scene.json`. Cada error nuevo que yo marque se agrega a
  «Errores que no se repiten» de `SKILL.md`.
