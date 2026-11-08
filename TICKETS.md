# Tickets del proyecto

Tablero de trabajo de la skill de departamentos en 3D. Cada ticket dice qué gana el dueño o el negocio, cuándo está
hecho y cómo se verifica. Al tomar uno se marca **en curso**; al terminarlo, **hecho** con la fecha y lo que quedó
pendiente en "Notas". Lo que aparezca en el camino se agrega como ticket nuevo al final.

Reglas para todos: los cambios de motor o componentes sirven para cualquier departamento (nada de parches de uno);
`window.__viewer.warnings` vacío; piezas sin caras compartidas; al menos 60 cm de circulación; lo que es solo
ambientación va con `"decor": true`; no editar archivos con Get-Content/Set-Content de PowerShell; todo lo visible,
en español. Antes de dar por hecho un cambio de motor, correr la verificación (T-01) y revisar lo que marque.

## Resumen

| Id | Ticket | Prioridad | Esfuerzo | Estado |
|---|---|---|---|---|
| T-01 | Verificación automática de los departamentos (regresiones) | Alta | Chico | Hecho (2026-11-03) |
| T-02 | Visor en celular: viewport, barras y vistas aéreas que entren | Alta | Chico | Hecho (2026-11-03), falta celular real |
| T-03 | Versión para el cliente: sin scene.json ni datos técnicos, texto para el huésped | Alta | Chico | Hecho y publicado (2026-11-03) |
| T-04 | Bugs visibles: troncos flotando, edificio que tapa el depto 2, depto 2 con fotos vinculadas | Media | Chico | Hecho y publicado (2026-11-03) |
| T-05 | Validaciones del scene.json: claves desconocidas, circulación, puertas, muebles fuera de su ambiente | Alta | Medio | Hecho (2026-11-03), quedan 2 avisos del depto 4 |
| T-06 | Luz de día que luce: sol por los ventanales, exposición, color real del piso | Alta | Medio | Hecho (2026-11-03), sin publicar; el sol por vista sigue en T-14 |
| T-07 | Noche legible: techos y alacenas no negros, vidrio de noche | Media | Chico | Hecho (2026-11-03), sin publicar |
| T-08 | SKILL.md y catálogo de componentes generado desde metadatos | Muy alta | Medio | Hecho (2026-11-03), probado con un depto nuevo (San Nicolás) |
| T-09 | Paso de plano 2D para que el dueño confirme la distribución | Muy alta | Medio | Hecho (2026-11-03): generador; falta usarlo con un dueño |
| T-10 | Entorno creíble: la vista real por la ventana, árboles livianos | Alta | Grande | Hecho (2026-11-03): la vista real es T-20; acá, el entorno generado |
| T-11 | Rendimiento en celular: luces de lámparas y paisaje (el usuario lo ve mal y tosco) | Alta | Medio | En curso: hecho en el motor, falta probar en el celular |
| T-12 | Entregables: imágenes y video, marca blanca, link por vista, QR, hosting propio | Muy alta | Medio | En parte (2026-11-03): imágenes, video, links, QR y marca; falta hosting propio |
| T-13 | Generalidad del motor: paredes en ángulo, ambientes en L, fachada a cualquier lado, escalera caminable | Media | Grande | En parte (2026-11-03): falta paredes en ángulo |
| T-14 | Fidelidad puntual de los deptos 1 y 4 (piso, cuadros, altillo, comedor) | Media | Medio | Descartado (2026-11-04, decisión del usuario) |
| T-15 | Sombras estables: que no cambien al moverse ni al cambiar el zoom, y sin defectos | Alta | Medio | Hecho (2026-11-03), confirmado por el usuario |
| T-16 | Luz de día algo más cálida, como un atardecer suave, sin exagerar | Alta | Chico | Hecho (2026-11-03), aprobado y publicado |
| T-17 | Hosting propio: dominio, three.js en el paquete y publicar con un comando | Muy alta | Medio | En parte (2026-11-04): en línea en recorrelo3d.pages.dev con motor/publicar.mjs, probado con datos móviles; falta three.js adentro |
| T-18 | Estudio de producción: una página que valida, compara y arma toda la entrega | Alta | Medio | Pendiente |
| T-19 | Kit de entrega para el dueño: recorrido 3D, videos y tarjeta con QR | Muy alta | Medio | En parte (2026-11-04): kit del depto 5 con motor/kit.mjs, recortado a recorrido, videos y tarjeta; falta un segundo depto y probarlo desde un celular real |
| T-20 | Vista real por la ventana tomada de las fotos (proyección desde la cámara) | Muy alta | Medio | Quitado (2026-11-04): no era realizable con fotos de anuncio |
| T-21 | Mapa de identificación por foto y medida automática de parecido | Alta | Medio | Hecho (2026-11-03) |
| T-22 | Colores de muebles y superficies medidos en las fotos | Alta | Chico | Hecho (2026-11-03), aplicado en los 4 deptos |
| T-23 | Texturas de imagen: piso, azulejos, mesada y madera rectificados desde las fotos | Alta | Grande | En parte (2026-11-03): motor y herramienta; ninguna textura pasa todavía (espera T-27) |
| T-24 | Estampados de telas tomados de las fotos | Media | Medio | Hecho en parte (2026-11-03): motor y herramienta; se elige a ojo |
| T-25 | Catálogo: piezas que faltan y más variedad por componente | Media | Medio | Hecho (2026-11-03), falta recortar cuadros de la foto con una herramienta |
| T-26 | Validador de piezas sueltas o flotando dentro de un componente | Alta | Chico | Hecho (2026-11-03) |
| T-27 | Encuadre automático: ajustar la cámara de cada vista a su foto | Media | Grande | En parte (2026-11-03): herramienta hecha, todavía no vuelve sola a la cámara buena |
| T-28 | Luz acogedora como estándar del motor | Alta | Chico | Hecho (2026-11-03), espera aprobación del usuario |
| T-29 | Registro de tiempo y vueltas por departamento | Media | Chico | Pendiente |
| T-30 | Vitrina pública y recepción de pedidos | Alta | Medio | Pendiente |
| T-31 | Validación comercial: charlas con anfitriones e inmobiliarias y precio | Muy alta | Chico | Pendiente |
| T-32 | Mantener los publicados al día con el motor actual | Media | Chico | Pendiente |
| T-33 | Herramientas que miden 0 con el panel oculto (comparar.html ya arreglado) | Media | Chico | En parte (2026-11-04) |
| T-34 | Fotos de gran angular (0,5×): campo de visión y distorsión en el encuadre | Alta | Medio | Pendiente |
| T-35 | Vista por la ventana cuando ninguna foto calza: recorte manual o foto del balcón | Media | Medio | Descartado (2026-11-04), junto con T-20 |
| T-36 | Vanitory con bacha de loza encima y cortina de baño con volado | Baja | Chico | Pendiente |
| T-37 | Motor compartido en el sitio publicado (una copia para todos los deptos) | Media | Chico | Pendiente |
| T-38 | Entorno generado que luzca: árboles, lago y edificios de enfrente (ahora es lo único que se ve por las ventanas) | Alta | Medio | Pendiente |
| T-39 | Página 404 propia en el sitio y copia de seguridad del proyecto (git local) | Media | Chico | Pendiente |
| T-40 | Visor más simple: sin botones de techo, maqueta ni decoración; ficha plegada; vistas en una píldora; noche precargada | Alta | Chico | Hecho (2026-11-04) |
| T-41 | Celular igual de cálido que la PC: oclusión ambiental liviana en el camino de celular | Alta | Chico | Hecho (2026-11-04), falta probar en el teléfono |
| T-42 | Que se entienda cómo usar el visor: guía de la primera visita y ayuda "?" | Alta | Chico | Hecho (2026-11-04), a probar por el usuario |
| T-43 | Vistas de adentro con el zoom más abierto en el visor | Media | Chico | Hecho (2026-11-04) |
| T-44 | Dirección más simple para el depto 5 (/departamento-prueba/) con redirección de la vieja | Media | Chico | Hecho (2026-11-04), falta subir |
| T-45 | Dos modos en el visor: Vista general y Recorrido (sin la lista de 22 vistas) | Alta | Chico | Hecho (2026-11-05), falta subir |
| T-46 | Vista general del celular más cerca y centrada | Media | Chico | Hecho (2026-11-05) |
| T-47 | Landing del usuario como portada del sitio | Alta | Chico | Hecho (2026-11-05), falta subir |
| T-48 | Landing adaptada al celular y corregida | Alta | Chico | Hecho (2026-11-05), falta subir |
| T-49 | Nombre del depto 5: "Departamento demo" | Media | Chico | Hecho en parte (2026-11-05): faltan los videos |
| T-50 | Pantalla de carga de la landing (MorphingSquare) hasta que todo esté listo | Media | Chico | Hecho (2026-11-05), falta subir |
| T-51 | Rueda de la portada con escenas de Pexels; motor: hormigón, mesa de tablón y araña | Media | Medio | Hecho (2026-11-05), falta subir |

**Próxima etapa (2026-11-04): estética y rendimiento, solo con el depto 5** (los demás quedan de lado por decisión
del usuario; los cambios de motor siguen siendo generales y se verifican en los cinco para no romperlos). Prompt listo en `prompt-estetica-rendimiento.md`. Carta de
presentación del servicio con QR al recorrido de muestra en `presentacion/carta.html`.

**Publicado (2026-11-03):** los tres links tienen T-02, T-03, T-04, T-15 y T-16 (motor de 50 kB, componentes de 123 kB, scene
limpio): [depto 1](https://claude.ai/artifact/Bn4bhHWN2WRZZLqPHx6N3p) · [depto 2](https://claude.ai/artifact/JS9nntozhhdEj29qxyM2rR) ·
[depto 4](https://claude.ai/artifact/B2j9ZZaQXsxKKQXfQTG6x2). Siguen privados: para mostrarlos a alguien hay que
compartirlos desde el menú Compartir de cada página.

**Publicado (2026-11-04):** [depto 5, Departamento demo](https://claude.ai/artifact/GvmujzWsuucQ8GepG3rekX) (versión 1, desde
`dist/depto5/`). Privado como los otros; el QR y los links del kit siguen con el link de prueba hasta T-17.

Orden sugerido (T-09, plano 2D, va al final por decisión del usuario): T-01 → T-02 → T-03 → T-15 → T-04 → T-05 → T-06 → T-07 → T-08 → T-09 → T-12 → T-10 → T-11 → T-14 → T-13.

**Hoja de ruta desde el 2026-11-03** (pedido del usuario: mejoras pensadas para cualquier departamento y para vender sin
depender de servidores; se encaran cuando haya margen de uso). Tres frentes, en este orden:
1. **Poder entregar y vender:** T-17 (hosting propio) → T-28 (luz acogedora estándar) → T-26 (piezas sueltas) → T-32
   (publicados al día).
2. **Fidelidad que se nota:** T-20 (ventana real) → T-21 (mapa de identificación) → T-22 (colores medidos) → T-23
   (texturas) → T-24 (estampados) → T-25 (catálogo).
3. **Producto y proceso:** T-09 (plano, también como entregable) → T-19 (kit) → T-18 (estudio de producción) → T-30
   (vitrina) → T-31 (validación comercial, en cuanto haya 3 demos buenas) → T-29 (tiempos) → T-27 (encuadre
   automático) → T-10, T-13, T-14.
Pendientes viejos que siguen: T-11 (probar en un celular real).

**Tanda del 2026-11-03 (tickets de motor, en el orden pedido):** hechos T-26, T-21, T-20, T-22, T-25, T-10 y T-09;
**T-28 espera la aprobación del usuario** (láminas `capturas/t28/antes-despues-<depto>.jpg`); en parte T-23, T-24, T-27 y
T-13. Lo que más destraba ahora es T-27: con las cámaras calzando de verdad se pueden volver a correr las texturas
(T-23), los estampados (T-24) y la vista por las ventanas (T-20). Nada republicado; `dist/` rearmado con todo.

---

## T-01 · Verificación automática de los departamentos

**Por qué:** cada arreglo del motor puede romper un departamento ya entregado sin que nadie lo note (pasó con la vista
general del depto 2).
**Hecho cuando:** una página arma todos los departamentos con el motor actual, junta advertencias y números de dibujo,
saca una captura de día por vista y la compara con una línea base guardada; marca lo que cambió.
**Cómo se usa:** con el servidor `visor` (puerto 5180), abrir
`http://localhost:5180/motor/verificar.html`. `?deptos=depto1,depto4` elige departamentos; `&base=1` guarda el
estado actual como línea base (solo después de revisar que esté bien). Resultados en `capturas/verificacion/`.
**Estado:** hecho (2026-11-03).
**Qué se hizo:** `motor/verificar.html` (nuevo); `motor/serve.mjs` lista los departamentos en `/api/deptos` y acepta
guardar `.json` dentro de `capturas/`.
**Notas:**
- Sin cambios en el motor, dos corridas seguidas difieren como máximo 0,3 %; el umbral para avisar es 2 %. También
  avisa si los triángulos varían más de 15 %, si falta una vista o si el motor avisa por consola.
- La comparación no distingue una mejora de un error: hay que mirar el par de capturas que muestra la página y, si
  el cambio es bueno, volver a correr con `&base=1`.
- Cada departamento se dibuja en la proporción de sus fotos (`viewAspect`; 4:3 si no tiene).
- Línea base actual: motor del 2026-11-03 con T-02 incluido.
- Pendiente para más adelante: que corra también de noche y con "Decoración extra" apagada.

## T-02 · Visor en celular

**Por qué:** el huésped abre el link en el teléfono. Sin `<meta viewport>` la versión propia (`dist/`) se dibujaba a
981 px de ancho (7 veces más píxeles); la barra de ajustes no entraba y las vistas aéreas cortaban el modelo.
**Hecho cuando:** en 375×812 el ancho es 375, ninguna barra desborda sin indicarlo, la vista elegida queda a la vista
en la tira y las vistas aéreas muestran el departamento entero.
**Estado:** hecho (2026-11-03). Falta probarlo en un celular real (queda en T-11).
**Qué se hizo:**
- `visor.html`: `<meta charset>` y `<meta viewport>`; en pantallas de menos de 560 px los ajustes usan etiquetas
  cortas (Techo, Noche, Maqueta, Decoración); las barras que se desplazan se desvanecen del lado donde hay más
  botones; al elegir una vista, la tira la lleva al centro (animado a mano: el "smooth" del navegador no corría en
  el panel).
- `engine.js` (`fitAerial`): en pantallas verticales, las vistas sin techo y sin foto se alejan por la misma línea
  hasta que entra todo el departamento con sus balcones. En pantallas apaisadas no cambia nada.
**Verificado:** en 375×812 el ancho es 375 (antes 981) y el lienzo 562×1218 (antes 1470×3183); la barra de ajustes
entra (310 px en 312); la vista general del depto 4 y la del depto 1 entran enteras; en escritorio las etiquetas
siguen largas; T-01: solo cambiaron las dos vistas aéreas del depto 1 (que se verifican en vertical) y para mejor.
**Notas:** al girar el teléfono con una vista aérea abierta, el encuadre se ajusta recién al elegir otra vista. Los
artifacts publicados todavía tienen el visor anterior (el host ya agregaba el viewport): se actualizan al
republicar.

## T-03 · Versión para el cliente

**Por qué:** hoy el cliente ve "Ver scene.json", estadísticas técnicas y notas de producción ("se tomó la ropa de cama
de la foto 1951a4d6").
**Hecho cuando:** scene.json y estadísticas solo con `?dev`; el scene lleva un texto para el huésped (`"about"`)
separado de la nota interna (`"note"`); "Estimado sin foto" se reescribe en lenguaje de huésped ("Medidas
aproximadas").
**Verificación:** revisar el publicado: sin ids de fotos ni términos técnicos.
**Estado:** hecho (2026-11-03). Los links publicados todavía muestran la versión anterior: falta republicar (con
permiso).
**Qué se hizo:**
- `visor.html`: el huésped ve el nombre, la descripción (`"about"`) y un desplegable "Modelo aproximado" con el aviso
  (se puede cambiar por scene con `"disclaimer"`). En celular la descripción va dentro del desplegable, que se llama
  "Más información". Con `&dev` (o `?dev`) vuelven la nota interna, "Estimado sin foto", las estadísticas y
  "Ver scene.json".
- `"about"` nuevo en los tres scene.json, escrito solo con lo que muestran las fotos (sin metros, que son estimados).
- `empaquetar.mjs`: el scene.json de `dist/` sale sin `note`, `estimated` ni `orientation`, y las vistas con
  `"photo": true` en lugar del id de la foto (el motor solo necesita saber que tiene foto). Avisa si falta `"about"`.
**Verificado:** en `dist/` no queda ninguna mención a fotos ni notas internas; el texto visible del visor publicado
no dice "scene.json" ni "mallas"; en 375×812 el desplegable muestra descripción y aviso; con `&dev` aparece todo
como antes; T-01 sin cambios.
**Notas:** el texto "about" conviene que lo revise el dueño (es lo primero que lee el huésped). Las vistas siguen
llamándose como las nombró Claude ("Hacia el lago", "Dos camas"); revisar nombres en T-12.

## T-04 · Bugs visibles

**Por qué:** una vista rota en la demo le quita confianza al producto.
**Hecho cuando:** sin troncos de pino flotando en las aéreas del depto 4; los edificios del entorno nunca tapan las
vistas definidas; el depto 2 tiene `photo` en sus vistas y `viewAspect`, y se republica con el motor nuevo (pedir
permiso antes de publicar).
**Verificación:** T-01 sin "revisar" inesperados; hojas aéreas de los 3 departamentos.
**Estado:** hecho (2026-11-03), salvo republicar el depto 2 (espera permiso).
**Qué se hizo:**
- Troncos "flotantes" del depto 4: no flotaban; eran pinos del bosque de atrás con la copa solo en la mitad de
  arriba, que en la vista aérea quedaba fuera de cuadro. `natureAround` (components.js) arma ahora la copa cónica
  desde un cuarto de la altura, ancha abajo y fina arriba, con el tronco a la vista solo abajo. Mismos triángulos.
- "Edificio que tapa la vista general del depto 2": **no se reproduce**. Fue un error del análisis: la hoja recortaba
  el centro de una captura apaisada y lo que parecía un edificio pegado era el propio edificio del depto (5 pisos
  hacia abajo). No se tocó el entorno.
- Depto 2 con fotos: `fotos/depto2/` (conversor nuevo `convertir-depto2` en launch.json, puerto 5182);
  las cuatro vistas interiores llevan `photo` y su proporción; poses nuevas elegidas comparando candidatos contra
  cada foto (hojas en `capturas/analisis-depto2-fotos/` y `capturas/t04/`).
- Motor: `"photoAspect"` por vista, para departamentos con fotos de proporciones distintas (el depto 2 tiene 16:9,
  4:3 y 9:16). `fit` guarda la proporción en lugar de un sí/no. `comparar.html` usa la proporción de cada vista y el
  motor expone `resize()` (con el panel oculto el aviso de cambio de tamaño puede no llegar).
**Verificado:** T-01: depto 1 sin cambios; depto 4 hasta 1,7 % (los pinos que se ven por las ventanas); depto 2 solo
las cuatro vistas reencuadradas. Línea base actualizada. `dist/` rearmado.
**Notas:**
- El baño del depto 2 queda algo más cerca que la foto y la cocina un poco más cerrada: más parecido pide
  revisar medidas del modelo (T-14).
- Lección: para elegir encuadres, comparar capturas a tamaño real; una hoja de miniaturas con recorte engañó dos
  veces en este ticket.
- `lighting.background` del depto 2 sigue sin usarse (queda como caso de prueba de T-05).

## T-05 · Validaciones del scene.json

**Por qué:** hoy las claves mal escritas y los componentes desconocidos se ignoran en silencio y no se controla la
circulación.
**Hecho cuando:** van a `warnings`: claves desconocidas (con la sugerencia más parecida), componentes y aberturas
desconocidos, pasos de menos de 60 cm entre muebles o entre mueble y pared, barrido de puertas tapado, muebles fuera
de todo ambiente o colgados donde no hay pared, paredes que no van en X ni en Z.
**Verificación:** un scene de prueba con un error de cada tipo da la advertencia esperada; los 3 departamentos en cero
(o corregidos).
**Estado:** hecho (2026-11-03), salvo dos advertencias del depto 4 que piden decidir la distribución (ver Notas).
**Qué se hizo:**
- `motor/validate.js` (nuevo, se publica con el visor):
  - `checkSpec`: claves desconocidas en cada nivel del scene (raíz, niveles, ambientes, pisos, paredes, aberturas,
    estructura, huecos, techo, claraboyas, muebles, vistas, luz, exterior, balcones) con la sugerencia más parecida;
    valores con opciones cerradas; tipos de mueble y abertura desconocidos; paredes fuera de los ejes; aberturas que
    se salen de la pared; `warmth` fuera de 0–1; vistas con un nivel que no existe.
  - `checkScene`: muebles fuera de todo ambiente o balcón; cosas de pared sin pared detrás (mira 3 cm detrás de
    la caja real); puertas que chocan con un mueble al abrirse (recorre el arco de la hoja); circulación con un
    cuerpo de 60 cm sobre una grilla de 5 cm: se llega desde la entrada a cada ambiente, no quedan sectores de
    0,5 m² o más encerrados y hay dónde pararse junto a cada mueble que se usa (cama, sillón, inodoro, mesada…).
  - Los parámetros de cada mueble (`params`) no se revisan todavía: necesita el catálogo con metadatos de T-08.
- Ambientes con `"closed": true`: sin acceso a propósito (depósitos, ductos). Un ambiente que los muebles ocupan
  entero (el nicho de cocina del depto 2) cuenta como alcanzado si hay dónde pararse a menos de 45 cm.
- `verificar.html`: dibuja el mapa de circulación de cada nivel (verde se llega, amarillo libre sin llegada, gris
  ocupado) y prueba el validador con `motor/pruebas/validaciones.json` (un error de cada tipo; avisa los 13).
- Correcciones: depto 1, puerta del baño 20 cm más allá (el vanitory dejaba 52 cm de paso); depto 2, sin
  `lighting.background`; depto 4, "Depósito" del altillo `closed`, placard del dormitorio principal de 1,20 a
  1,00 m (chocaba la puerta), camas de "Dos camas" 10 cm hacia la ventana (con su respaldo, lámpara y cuadros) y
  vanitory del baño de planta baja a la pared de enfrente (encerraba el inodoro).
**Verificado:** escena de prueba: aparecen los 13 avisos esperados. Deptos 1 y 2 sin advertencias. T-01: solo
cambian el baño del depto 1 y "Dos camas" del depto 4; línea base actualizada. `dist/` rearmado (con validate.js).
**Notas:** quedan dos advertencias en el depto 4, las dos de la misma zona estimada (sin foto del baño):
1. "en Dormitorio principal queda un sector de 1,7 m² al que no se llega": al pie de la cama, entre la cama y la
   pared del baño en suite quedan 20 cm. Es justo donde está la cámara de la foto 11.
2. "no queda lugar para pararse junto al inodoro del baño en suite": el baño (1,5 × 1,6 m) no da para bañera,
   inodoro y vanitory con 60 cm de paso.
Arreglarlas pide rehacer esa parte del plano estimado (mover el baño en suite o el pasillo); conviene decidirlo con
el plano 2D (T-09) o con lo que diga el dueño. Decisión del usuario (2026-11-03): todo lo del plano 2D se ve al final, así que estos dos avisos esperan a T-09.

## T-06 · Luz de día que luce

**Por qué:** las fotos tienen sol y contraste; los renders salen grises y planos, y el porcelanato gris del depto 1
sale blanco.
**Hecho cuando:** entra sol por los ventanales cuando la foto lo tiene (mancha en piso y pared), paredes blancas se ven
blancas, el piso conserva su color.
**Verificación:** hojas día|foto; brillo medio de pared y piso dentro de ±10 % de la foto en las vistas del depto 1.
**Estado:** hecho (2026-11-03), sin publicar.
**Qué se hizo (`engine.js`):** relleno de día más alto (cielo 0,55 → 0,75 y entorno 0,3 → 0,4) para que las paredes en
sombra se vean blancas como en las fotos de celular, y reflejo de los pisos brillantes más suave (`uReflBoost` 2,2 →
1,4): el porcelanato gris del depto 1 salía casi blanco por el reflejo. Se regula por departamento con
`lighting.ambient` y `lighting.environment`.
**Verificado:** brillo por franjas (arriba, medio, piso) contra cada foto del depto 1 (`capturas/t06/prueba1/`). El
±10 % no es alcanzable con una sola exposición: las fotos tienen exposiciones distintas (la del sillón está expuesta al
sol y sale oscura) y en "Cama" el render tiene otro acolchado. Se juzgó con las hojas: living con paredes blancas y
piso gris con reflejos, como la foto. T-01: todas las vistas de los tres deptos cambian 4–8 % (más claras), sin avisos
nuevos; revisado el par del depto 4 (más claro, mismo contraste, sin beige) y línea base actualizada.
**Notas:** el sol que entra "como en la foto" depende de `sunFrom` de cada departamento (en "Cama y placard" la foto
tiene el sol sobre la pared del fondo y el render en la lateral): eso es fidelidad puntual, queda en T-14.

## T-07 · Noche legible

**Por qué:** de noche techos y alacenas quedan casi negros; la mesa de vidrio parece blanca.
**Hecho cuando:** un relleno cálido hacia el techo deja leer todo el ambiente; los vidrios se ven vidrio.
**Verificación:** hojas de noche de los deptos 1 y 4.
**Estado:** hecho (2026-11-03), sin publicar.
**Qué se hizo:**
- `engine.js`: relleno de noche más fuerte y desde abajo, como el rebote de las lámparas en piso y muebles (cielo
  0,16 → 0,26, color de abajo `#a08670` → `#d2ab85`). Techos y alacenas ya no quedan negros.
- Vidrios (`components.js`: `userData.glass` en `glass` y `tintedGlass`): de noche su color baja al 30 %. Con una
  lámpara encima, el vidrio se iluminaba como si fuera opaco y la mesa del depto 1 se veía lechosa.
- Junto con T-11: lámparas al 80 % y sin sol de noche.
**Verificado:** hojas `capturas/t07/antes-depto1/` y `despues-depto1/` (comedor: la mesa de vidrio deja ver las patas
de las sillas; cocina: alacenas legibles) y `despues-depto4/` (cocina y altillo con techo visible). T-01 no cambia
(es de día).
**Notas:** la esquina del techo de la cocina del depto 1 sigue en penumbra, como en la realidad con un spot hacia
abajo. Si se quiere más luz de noche en un departamento: `lighting.nightAmbient`.

## T-08 · SKILL.md y catálogo

**Por qué:** sin skill escrita, cada departamento depende de iterar a mano en la conversación.
**Hecho cuando:** existe `SKILL.md` con el proceso completo (inventario de fotos → plano → scene.json → validar →
comparar → empaquetar) y un catálogo generado desde metadatos de cada componente (parámetros, valores por defecto,
dónde se monta, si es obstáculo, con qué encastra) que reemplaza las listas fijas del motor (`NESTED`, `flat`).
**Verificación:** armar el depto 3 solo con la skill; contar iteraciones y cambios de motor necesarios.
**Estado:** hecho (2026-11-03), salvo la prueba de armar el depto 3 solo con la skill.
**Qué se hizo:**
- `SKILL.md` (raíz): el proceso en 7 pasos con su criterio de terminado (inventario de fotos → medidas → plano →
  scene.json → validar → comparar → empaquetar y publicar), qué hacer al cambiar el motor y una referencia corta del
  scene.json.
- `components.js`: `META`, la ficha de cada componente (`mount`: floor, wall, ceiling, on, window; `solid`; `use`;
  `nests`) y `nests()`. Reemplaza las listas fijas `NESTED` y `flat` del motor, `ON_WALL` y `USED` del validador y
  las marcas `.ceiling = true`. Comentario de una línea en los 21 componentes que no lo tenían.
- `motor/catalogo.mjs` (nuevo): genera `motor/CATALOGO.md` (por montaje: qué es, parámetros con su valor por defecto
  leídos del código, incluidos subparámetros como `throw.cover`, si estorba, si se usa, con qué encastra) y
  `motor/catalogo.json`. Además revisa los `params` de todos los departamentos contra lo que cada componente lee y
  sugiere el nombre parecido (lo que T-05 había dejado pendiente).
**Verificado:** las 56 fichas cubren los 56 componentes; los tres departamentos dan "parámetros bien"; T-01 sin
cambios de distribución ni avisos nuevos (los cambios de imagen de esta tanda son de T-06).
**Notas:** el control de parámetros corre con node, no en el visor.

**Prueba de la skill (2026-11-03): departamento nuevo en San Nicolás** (pedido del usuario, en lugar del depto 3).
Fotos `departamentosannicolas/` (11 AVIF) → `fotos/sannicolas/`; anuncio de Airbnb 1567028994240400628 ("Dpto.
Lavalle", 1 dormitorio con cama queen, futón en el living, 1 baño, sin m²). Resultado: `departamentos/sannicolas/`
(4 ambientes, ~33 m², 12 vistas, 10 con foto), `dist/sannicolas/`, `entregas/sannicolas/` (24 imágenes, links y un
video de 73 s) y hojas en `capturas/sannicolas/v1…v4`.
- Vueltas por paso: inventario 1 (conversión con ffmpeg); medidas 1 (texto del anuncio leído de los `<script>` de
  Airbnb); plano 1 + 2 retoques pedidos por la validación (dormitorio 10 cm más ancho, pasillo de 0,90 a 1,05 m);
  scene.json 1; validar 5 (6 → 3 → 1 → 0 avisos, y otra vez 3 → 0 al mover la puerta del baño); comparar 4 hojas
  completas + 1 vista suelta.
- Cambios de motor y componentes que hicieron falta (todos generales): sillón `style: "futon"`; silla
  `style: "tube"`; `wall-desk` (escritorio rebatible de pared, componente nuevo); reja romboidal en ventanas
  (`grille`, `grilleCell`); vanitory `style: "basin"` (bacha colgada sin mueble); `color` en la pava y el horno
  eléctrico; fichas: la heladera encastra bajo la mesada (frigobar) y la cortina sobre un receptáculo de ducha;
  `catalogo.mjs` sigue las funciones a las que un componente le pasa `p` y lista los defectos de cada estilo.
- Lo que faltaba o confundía en SKILL.md (ya agregado): convertir con ffmpeg y nombres sin ñ; cómo sacar el texto del
  anuncio de Airbnb; usar el mapa de circulación; el origen de las alacenas (centradas en su profundidad) y de la cama
  con respaldo (10 cm más adelante); los encuadres de fotos de celular (fov 62–72, cámara más atrás de lo que parece);
  el paso de entrega (imágenes y video). SKILL.md pasó a 8 pasos.
- Pendiente de este depto: no hay ventilador de pie en el catálogo (se ve en la foto del dormitorio); la cortina de
  ducha es lisa y en barral recto (en la foto, estampada y en L); el receptáculo es blanco (en la foto, revestido);
  la vista por las ventanas es la ciudad genérica (en la foto se ve el Obelisco: T-10). Publicado (2026-11-03):
  [San Nicolás](https://claude.ai/artifact/F8wL4Sy7WZQefChmwcJNaN).
- Reporte del usuario sobre lo publicado: sillas y futón con partes sueltas o "semi flotando", y la luz tiene que ser
  más acogedora. Se hizo:
  - Silla `tube` rehecha: un aro de caño bajo el asiento recibe las cuatro patas; las de atrás siguen como parantes
    inclinados hacia atrás y las varillas del respaldo terminan justo en ellos (antes, patas y parantes caían fuera
    del asiento redondo y las varillas sobresalían); asiento con bordes redondeados en lugar de un cilindro macizo.
  - Futón: tarima de listones bajo el colchón y bastidor de listones detrás del respaldo (antes el colchón no tenía
    dónde apoyarse).
  - Luz de este depto: paredes blanco cálido como en las fotos (`#efe8dc`), `warmth` 0,56, de noche
    `nightAmbient` 0,4 y `nightExposure` 1,3, colgantes más fuertes (30 en el living, 18 en el dormitorio).
  - Verificado: capturas de cerca `capturas/sannicolas/cerca2.jpg`; luz `luz-antes.jpg`, `luz-despues.jpg` y
    `noche-antes-despues.jpg`. T-01: deptos 1, 2 y 4 sin cambios; San Nicolás cambia por las sillas y el tono
    (línea base actualizada).
  - Segundo ajuste pedido por el usuario ("ajustá la luz y republicá"): `warmth` 0,58, `ambient` 0,82, de noche
    `nightAmbient` 0,5 y `nightExposure` 1,35, colgante del living en 36. Antes y después en
    `capturas/sannicolas/luz3-antes-despues.jpg`. Republicado (versión 2).
- T-01: deptos 1, 2 y 4 sin cambios con los componentes nuevos; línea base actualizada con San Nicolás incluido.

## T-09 · Plano 2D de confirmación

**Por qué:** la distribución sin plano es donde más se falla (depto 2 espejado, comedor del depto 4).
**Hecho cuando:** antes del 3D se genera una planta acotada con los ambientes, puertas y ventanas, y una lista corta de
dudas para que el dueño confirme o corrija.
**Verificación:** repasar el depto 4: el plano tendría que haber marcado la escalera del comedor.
**Ampliación (2026-11-03):** el plano también es un entregable que vende (casi nadie tiene plano de su departamento y
se puede subir como una foto más del anuncio). Generarlo desde el scene.json para cualquier departamento: planta
limpia con nombres de ambientes, medidas aproximadas, muebles en silueta, norte o calle, en PNG y SVG, con la marca.
Lo usan T-19 (kit de entrega) y el paso 3 de SKILL.md (confirmar la distribución).
**Estado:** hecho (2026-11-03): el generador. Falta la parte humana (mandárselo a un dueño y corregir con lo que diga;
los dos avisos del depto 4 que esperaban este ticket siguen ahí hasta que alguien confirme esa zona).
**Qué se hizo:**
- `engine.js`: `api.plan()` devuelve por nivel los ambientes (con `rects` ya repartidos), las paredes con sus
  aberturas, los huecos de escalera y la **huella real** de cada mueble (la caja del componente sin girar, girada a su
  lugar; se toma antes de unir las piezas), más los balcones y hacia dónde mira la fachada.
- `motor/plano.html?depto=<id>[&escala=70][&muebles=0]` (nuevo): planta de cada nivel lado a lado (el altillo al lado
  de la planta baja): paredes macizas con los vanos y esquinas llenas, puertas con la hoja y el barrido del lado del
  ambiente, ventanas con doble línea, balcones punteados, escalera con peldaños y hueco, muebles en silueta (alfombras
  punteadas; sin lo colgado de techo o pared ni los objetos de mesa), nombre y medidas de cada ambiente (en los de
  varios rectángulos, la superficie aproximada), "Calle", "Vista al lago" o "Balcón" del lado de la fachada, escala
  de 1 m y la marca si el scene tiene `brand`. Guarda `entregas/<id>/plano.svg`, `plano.png` (al doble de resolución) y
  `plano.json` con la lista de dudas (lo estimado sin foto, `estimated`) para confirmar con el dueño. `serve.mjs`
  acepta SVG.
- SKILL.md, paso 3: generar el plano y mandar las dudas antes de seguir.
**Verificado:** planos de los cuatro departamentos en `capturas/t09/plano-<depto>.png` (y en `entregas/`). En el depto 4
  se ven las dos plantas, la escalera con sus peldaños al costado del living y el hueco en el altillo, y la lista de
  dudas trae las 7 zonas estimadas (incluido "Hueco de la escalera y baranda"). Depto 2: monoambiente con el balcón y
  las sillas del balcón. Sin avisos nuevos en la verificación.
**Pendiente:** cotas sobre las paredes (hoy solo ancho × largo de cada ambiente), norte geográfico (no está en el
  scene) y rótulos de muebles; probarlo con un dueño de verdad.

## T-10 · Entorno creíble

**Por qué:** en el depto 4 el lago es lo que vende y por las ventanas se ven árboles de caricatura.
**Hecho cuando:** la vista exterior de cada ventana se parece a la de la foto (fondo tomado de la foto o panorámica) y
los árboles son livianos de lejos.
**Verificación:** hojas de las vistas con ventana contra su foto.
**Nota (2026-11-03):** la vista real por la ventana tomada de las fotos pasó a su propio ticket (T-20). Acá queda el
entorno generado para las ventanas sin foto: árboles con más forma, edificios con más variedad y de noche con vida.
**Estado:** hecho (2026-11-03) para el entorno generado.
**Qué se hizo (`components.js`):**
- Copas de árbol con tono por vértice (más oscuras abajo y en los huecos, más claras arriba): tienen volumen aunque
  estén en sombra. Vale para la ciudad y para el bosque del lago (mismo `crownBank`), sin triángulos de más.
- Ciudad: la cuadra de enfrente mezcla casas bajas con edificios de 5 a 9 pisos (algunos vidriados); planta baja con
  locales (vidriera que de noche se enciende cálida y toldos de colores) y, en las azoteas, salas de máquinas y
  tanques de agua.
- `engine.js`: los fondos de foto de las ventanas (T-20) se ocultan en las vistas sin techo (desde arriba se veían
  flotando: lo mostró la lámina de este ticket).
**Verificado:** láminas `capturas/t10/antes-despues-<depto>.jpg` (San Nicolás, depto 1 y depto 4; día y noche): por
  las ventanas sin foto se ven edificios de alturas distintas, un local con toldo y, de noche, vidrieras y ventanas
  encendidas; árboles con volumen. T-01: cambian las vistas por las que se ve la ciudad (el sorteo de la cuadra
  cambió) y las aéreas.
**Pendiente:** el sorteo de la ciudad cambió con esto (otra disposición de edificios que antes); si alguna vista
  necesita un edificio en un lugar, hoy no se puede fijar.

## T-11 · Rendimiento en celular

**Reporte del usuario (2026-11-03):** en el celular se ve mal y moverse es tosco, no va fluido. Revisar a la vez la calidad de imagen en celular y la suavidad de los controles táctiles (mirar, caminar, pellizcar), probando en un celular real.

**Por qué:** el depto 4 tiene 37 luces que cada píxel calcula, también de día, y 300 mil triángulos de pinos.
**Hecho cuando:** las luces de lámparas existen solo de noche (o con un tope por ambiente) y el paisaje se simplifica
con la distancia.
**Verificación:** celular real de gama media, 30 fps o más caminando en el depto 4; T-01 sin cambios visuales.
**Estado:** en curso (2026-11-03). Cambios hechos y verificados en la PC (emulando 375×812); falta que el usuario lo
pruebe en su celular y diga si va fluido. Por decisión del usuario se republicó solo el depto 1 como ejemplo
([link](https://claude.ai/artifact/Bn4bhHWN2WRZZLqPHx6N3p), versión 8, con T-05 y T-11); los deptos 2 y 4 siguen con
el motor anterior hasta que se confirme en el celular.
**Qué se encontró (depto 4, medido en la PC forzando 4× de resolución para que pese el dibujo por píxel):**
- Lo más caro no eran las lámparas sino las 10 luces de ventana y claraboya (`RectAreaLight`): sacarlas bajaba el
  cuadro de 15,3 a 7,3 ms. Cada una cuesta por píxel lo que unos diez spots.
- Las 27 lámparas apagadas de día igual se calculaban en cada píxel (intensidad 0 no las saca del sombreado).
- Las copas de los pinos sumaban unos 300 mil triángulos.
- En celular el cuadro pasaba por posproceso sin oclusión: buffer intermedio con MSAA, pase de salida y SMAA (tres
  pases más), y el reflejo del piso se redibujaba en cada cuadro de movimiento.
- Al arrastrar con el dedo la mirada giraba unas tres veces lo que se movía el dedo (200 px = 64°): brusco. Para ir a
  un lugar había que tocar dos veces.
**Qué se hizo:**
- `engine.js`:
  - Luces de ventana: en celular cada una es un spot ancho desde el vano (intensidad × superficie × 1,5), que ilumina
    casi igual (`capturas/t11/rect-vs-spot.jpg`: brillo medio a ±1 %). En escritorio siguen las de área.
  - Lámparas: existen solo mientras están prendidas (`visible` según la intensidad); de día, solo las que llevan
    `"day"`. Al pasar a la noche los materiales se recompilan una vez (una pausa corta al tocar "Noche").
  - Celular: se dibuja directo al lienzo con el antialiasing del navegador, sin compositor ni SMAA.
  - Escalones de calidad: el escalón 2 ahora apaga "efectos" (oclusión y también el reflejo del piso) y vuelven
    fundiéndose en 0,35 s, igual que la oclusión en T-15.
  - Recorrido táctil: arrastrar "agarra" la escena (girar ≈ lo que se movió el dedo, 200 px = 23°); al soltar con
    envión sigue girando y frena solo (un envión rápido suma unos 20°); un toque en el piso camina hasta ahí (un
    toque en pared o mueble gira hacia ese punto). Con mouse no cambia nada.
- `components.js`: `crownBank` — las copas a más de 35 m del edificio usan la versión de 80 triángulos en vez de
  180, sin mover ningún árbol (ciudad y lago).
- `visor.html`: la ayuda en celular dice "tocá el piso para ir ahí".
**Verificado:** en la PC emulando 375×812 (depto 4, vista de día): luces que se calculan de 37 a 14 (12 spots, sol y
cielo); dibujo 15,3 → 10,8 ms con 4× de resolución (y ahora con MSAA incluido); triángulos 866 k → 718 k. Gestos
probados con eventos táctiles simulados (arrastre, envión, toque en el piso). Depto 1 en celular con reflejo del
piso bien. T-01: todas las vistas ≤ 0,3 % (ruido), depto 4 marcado solo por la baja de triángulos; línea base
actualizada. `dist/` rearmado de los tres.
**Notas:**
- Probar en el celular: con el servidor `visor` prendido, desde el teléfono en la misma red abrir
  `http://192.168.0.106:5180/motor/visor.html?scene=/departamentos/depto4/scene.json` (la red de la PC figura como
  "Pública": puede que el firewall de Windows lo bloquee y haya que permitir Node, cosa que hace el usuario). Si no,
  republicar y probar el link.
- Reporte del usuario con el depto 1 publicado (2026-11-03): de noche bajan un poco los fps y las luces se ven muy
  brillantes. Se hizo:
  - De noche el sol no existe (`sun.visible = false`): antes, apagado, igual se calculaba con su sombra en cada píxel.
  - Celular de noche: tope de 8 lámparas, las más cercanas a la cámara (al centro de giro en las vistas desde
    arriba), con cantidad fija por tipo de luz para no recompilar; se vuelven a elegir al moverse medio metro. Las
    tiras LED pasan a spot como las ventanas, y las ventanas no iluminan de noche (su spot dejaba un punto azul en los
    pisos brillantes).
  - `lighting.lamps` (nuevo, también en validate.js): rendimiento de las lámparas de noche, 0,8 por defecto (vale
    para escritorio y celular).
  - Verificado en 375×812: depto 1 de noche 12,9 → 10,8 ms (4× de resolución), luces de 17 a 9; capturas
    `capturas/t11/noche-antes-*.jpg` y `noche-despues-*.jpg` (sin puntos azules, algo menos encandilado); depto 4 de
    noche 8 lámparas en lugar de 27 y el living se lee bien. T-01 sin cambios (es de día). `dist/` rearmado.
  - Al prender "Noche" en celular hay una pausa corta (se recompilan los materiales).
  - Republicado el depto 1 (versión 9) para que el usuario lo pruebe; los deptos 2 y 4 siguen esperando.
- Segundo reporte del usuario (versión 9): las luces de noche "se renderizan de a poco" al caminar y el reflejo del
  piso se ve medio mal. Causas: el tope de 8 lámparas cercanas las prendía y apagaba al moverse, y el reflejo se
  apagaba en el escalón 2 de calidad al moverse y volvía al frenar. Se hizo:
  - Fuera el tope. En su lugar, en celular las lámparas del mismo tipo a menos de 1 m entre sí y que se ocultan
    juntas (mismo nivel, techo, decoración) se unen en una sola luz fija con la suma de intensidades y la dirección
    promedio. Nada se prende ni se apaga al caminar.
  - El reflejo del piso salió de los escalones de calidad: queda siempre prendido (como antes de T-11). Los escalones
    vuelven a ser solo resolución y oclusión.
  - Quedan: sol invisible de noche, tiras LED como spot y ventanas sin luz de noche en celular, lámparas al 80 %.
  - Medido en 375×812 (4× de resolución): depto 1 de noche 9,8 ms contra 9,2 de día (la versión 8 daba 12,9 de
    noche), 12 lámparas. Depto 4 de noche 17,9 ms con 25 lámparas (unir de a 1 m casi no lo reduce: tiene las
    lámparas repartidas); si en el celular va lento, la opción es unir por ambiente, que cambia un poco cómo se ven.
  - T-01 sin cambios. `dist/` rearmado. Depto 1 republicado (versión 10); los deptos 2 y 4 siguen esperando.
- No se pudo medir en un celular real desde acá: los números de la PC sirven para comparar, no son los del teléfono.

## T-12 · Entregables y producto

**Por qué:** para cobrar hace falta algo concreto que entregar; Airbnb limita los enlaces externos, así que para el
anuncio sirven imágenes y video.
**Hecho cuando:** se exportan imágenes (día y noche por vista) y un video de recorrido; marca blanca (logo y colores);
link directo a cada vista; QR; paquete para hosting propio con three.js y fuentes incluidos.
**Verificación:** un paquete de entrega completo de un departamento.
**Estado:** en parte (2026-11-03). Hecho: imágenes, video del recorrido, links por vista, QR y marca blanca. Falta: hosting propio.
**Qué se hizo:**
- `motor/exportar.html?scene=…&id=<depto>[&lado=1600][&url=<link publicado>]` (nuevo): guarda en `entregas/<depto>/`
  una imagen de día y otra de noche por vista, en la proporción de su foto (las generales en 4:3), `links.json` con el
  link directo a cada vista y `qr.png` del link publicado (qrcodejs desde cdnjs). `serve.mjs` acepta guardar en
  `/entregas` además de `/capturas`.
- `visor.html`: `?vista=<clave>` (o `#<clave>`) abre en esa vista y `&noche` de noche; al cambiar de vista se
  actualiza el `#`. Marca blanca con `"brand": { "name", "url", "color" }` en el scene: "Presentado por …" en la ficha
  y su color en los botones elegidos (texto claro u oscuro según el color). `validate.js` conoce `brand`.
**Verificado:** entrega del depto 1 en `entregas/depto1/`: 18 imágenes (1200×1600 las de foto, 1600×1200 las
generales), `links.json` y `qr.png`. El visor con `?vista=cocina&noche` abre en la cocina de noche, sin avisos.
**Notas:**
- No está probado que claude.ai pase `?vista=` o `#` a la página publicada; en un hosting propio funciona seguro.
- La marca blanca no se probó con un departamento real (ninguno tiene `brand` todavía).
- Hosting propio: bajar three.js y sus módulos al paquete; queda para decidir con el usuario (implica descargar
  archivos).
- Video (pedido del usuario: "cinematográfico y que recorra todo el modelo"): `motor/video.html?scene=…&id=<depto>`
  [`&ancho=1920`][`&fps=30`] arma `entregas/<depto>/recorrido.mp4` (H.264, 1920×1080, 30 fps, ~6 Mbps). Cada cuadro
  se dibuja a calidad completa con `api.frame()` (nuevo en el motor) y se codifica con su tiempo exacto (WebCodecs +
  mp4-muxer 5.1.3 desde jsdelivr): sale fluido aunque la PC tarde en dibujar. Guion automático desde las vistas, sirve
  para cualquier depto: apertura desde negro con el nombre sobre la vista general girando (sin techo) → cada vista de
  adentro con travelling corto hacia adelante y paneo leve, fundidos encadenados y el nombre del ambiente → la primera
  vista de adentro pasa de día a noche → título (y marca, si hay `brand`) y fundido a negro. Viñeteado leve.
  `serve.mjs` acepta y sirve `.mp4`. Depto 1: 56,5 s, 43 MB; cuadros revisados con ffmpeg
  (`capturas/t12/video-cuadros.jpg`). Con el panel del navegador oculto, un `<video>` en la página muestra negro:
  revisar los videos con ffmpeg (está instalado vía winget). Generarlo tarda 2–5 min.

## T-13 · Generalidad del motor

**Por qué:** hoy los ventanales tienen que mirar a −Z, las paredes ir en X o Z y los ambientes ser rectángulos; en el
dúplex no se puede subir la escalera caminando y el piso brillante solo funciona en planta baja.
**Hecho cuando:** cada caso funciona con una escena de prueba propia.
**Estado:** en parte (2026-11-03). Hecho: ambientes en L, fachada hacia cualquier lado y escalera caminable. Falta:
paredes en ángulo (y el piso brillante en pisos de arriba).
**Qué se hizo (`engine.js`, `validate.js`):**
- Ambientes en L o en U: `"rects": [{ x, z }, …]` en lugar de `"rect"`; el motor lo reparte en un ambiente por
  rectángulo con el mismo nombre (pisos, zócalos, circulación y validaciones ya lo entendían así).
- Fachada hacia cualquier lado: `"exterior": { "facing": "+x" }` ('-z' por defecto, '+x', '+z', '-x'). El entorno
  (balcones, edificio, pisos de abajo, calle o lago) se arma en el marco de siempre con los balcones pasados a ese marco
  y se gira alrededor del centro del departamento; los balcones se escriben en coordenadas del mundo como siempre. Los
  límites del recorrido y el encuadre de las vistas aéreas en celular toman los balcones de cualquier lado.
- Escalera caminable: el recorrido sigue el piso que hay debajo (`walk.floorAt`: ambientes de cada nivel, balcones y
  cada escalera como rampa desde su arranque), con un paso máximo de 45 cm y la altura suavizada. La escalera ya no es
  un obstáculo de frente; quedan dos cajas finas a los costados de su parte baja para no meterse por debajo.
- `motor/pruebas/generalidad.json` (nuevo): fachada a +X con balcón y ventanal, living en L, dormitorio y puertas.
**Verificado:** la escena de prueba se arma sin avisos; vista aérea, living hacia el balcón (que está al este) y el
  brazo de la L en `capturas/t13/generalidad.jpg`. Depto 4: caminando con un destino al pie de la escalera, la cámara
  sube de 1,51 a 4,25 m (piso del altillo 2,75 + 1,5) y queda arriba; la rampa da 1,59 m a mitad de camino. Los dos
  avisos conocidos del depto 4 siguen iguales; T-01 sin cambios en las vistas.
**Pendiente:** paredes en ángulo. Plan: en `wallLine`, paredes con dirección cualquiera armadas en un grupo girado
  (tramos, vanos y aberturas en el eje local); esquinas sin compartir volumen; zócalos a lo largo; y para el recorrido
  y la circulación, cajas chicas cada 20 cm a lo largo de la pared (la caja alineada de una pared en diagonal tapa todo).
  El validador hoy avisa "no va en X ni en Z". Piso brillante arriba: el reflejo usa el plano y = 0.

## T-14 · Fidelidad puntual de los deptos 1 y 4

**Estado:** descartado (2026-11-04): el usuario decidió no seguirlo; las mejoras de fidelidad van por las herramientas
generales (T-21 a T-27).

**Por qué:** detalles que se notan al comparar con las fotos.
**Hecho cuando:** depto 1: encuadre de "Cama y placard", persianas como en la foto. Depto 4: piso de madera más oscuro,
cuadros de montaña, puerta y cuadro del altillo, revestimiento completo del baño con hidromasaje, estampado en los
almohadones del principal, comedor con la escalera (después de T-09).

## T-15 · Sombras estables

**Por qué:** el usuario ve sombras "medio buggeadas" y que al moverse o cambiar el zoom se vuelven a dibujar: el
visor apaga la oclusión ambiental (sombras de contacto) y baja la resolución mientras la cámara se mueve, y al
quedarse quieta las prende de golpe.
**Hecho cuando:** moverse o cambiar el zoom no hace aparecer ni desaparecer sombras; de cerca no hay manchas,
rayas ni halos raros en las sombras.
**Verificación:** cuadro en movimiento contra cuadro quieto en la misma pose (diferencia chica y sin sombras que
aparecen); zoom de cerca de las sombras del sol y de contacto; fps al caminar; T-01.
**Estado:** hecho (2026-11-03). Durante la sesión el movimiento se probó con un reloj simulado; después el usuario lo
probó caminando y haciendo zoom y confirmó que funciona bien.
**Causas encontradas:**
1. Al moverse o cambiar el zoom se apagaban la oclusión ambiental (sombras de contacto en esquinas y bajo los
   muebles) y el antialiasing, y se bajaba la resolución; al quedarse quieta volvían de golpe.
2. Esa vuelta llegaba unos 3 s tarde: el suavizado de la mirada y la inercia dejaban la cámara moviéndose cantidades
   ínfimas y el visor comparaba la cámara sin tolerancia.
3. La sombra del sol (PCF con radio 5 y mapa de 2048) hacía la penumbra en escalones cuadrados (se veía en la sombra
   de las toallas sobre la cama, `capturas/t15/antes-despues-toallas.jpg`).
**Qué se hizo (`engine.js`):**
- Sombra del sol con PCF suave y mapa de 4096 (2048 en celular, o el máximo del equipo). Se recalcula solo cuando
  cambia algo, así que el tamaño casi no cuesta. Se probaron también PCF radio 2 (bordes dentados) y VSM (oscurece
  toda la escena).
- Calidad en movimiento por escalones que se recuerdan: completa → 80 % de resolución → sin oclusión → 60 %. Se baja
  si los cuadros tardan más de 28 ms varias veces seguidas y se sube tras 1,5 s a 50 fps o más. El antialiasing
  queda siempre prendido. Si la oclusión estaba apagada, vuelve fundiéndose en 0,35 s.
- La cámara se considera quieta con tolerancia (1e-5) y la mirada al caminar se clava en su destino a menos de una
  milésima.
- El contador de fps del modo `dev` cuenta cuadros dibujados (quieta marca 0, porque el visor no dibuja).
**Verificado:** simulación a 60 fps: la oclusión no se apagó nunca y la resolución quedó completa. Simulación a
22 fps: bajó a sin oclusión y 60 %, y al soltar volvió a calidad completa en 0,75 s con la oclusión fundiéndose
(antes, unos 3 s y de golpe). Sombra de las toallas sin escalones; sin manchas ni rayas en las vistas de los deptos 1
y 4. T-01 sin cambios (máximo 0,5 %); línea base actualizada.
**Notas:** el umbral de 2 % de T-01 no detecta cambios chicos y localizados como este (bordes de sombra); para eso
sirven las capturas de cerca. En celular no hay oclusión ambiental, así que ahí solo cambia la resolución.

## T-16 · Luz de día cálida (atardecer suave)

**Por qué:** pedido del usuario (2026-11-03): la luz de día un poco más cálida, más parecida a un atardecer, sin
exagerar. Reemplaza el criterio anterior de "luz de día neutra y blanca". Ojo: antes un dormitorio beige y cálido
de más no le había gustado.
**Hecho cuando:** el sol directo y la luz de las ventanas tienen un tono dorado suave y el cielo un horizonte
apenas durazno; las paredes en sombra siguen viéndose blancas. Se regula con `lighting.warmth` (0 = neutra,
1 = atardecer) y vale para cualquier departamento.
**Verificación:** antes y después de las mismas vistas de los tres departamentos; elegir el valor con el usuario.
**Estado:** hecho (2026-11-03). El usuario vio el antes y después y lo aprobó ("me gustó"). Publicado en los tres links el mismo día.
**Qué se hizo:**
- `engine.js`: `lighting.warmth` (0 = neutra, 1 = atardecer), por defecto 0,5 (`WARMTH`). Calienta del todo el sol
  (hacia `#ff9440`), la luz de las ventanas y la bruma; el relleno (cielo y rebote del piso) solo al 45 %, para que
  las paredes en sombra sigan casi blancas. La noche no cambia.
- `components.js` (cielo): el horizonte se tiñe de durazno, el brillo del sol se dora y las nubes se entibian según
  la calidez.
- Depto 2: se sacaron el sol y el cielo cálidos fijados a mano en la época del motor viejo, para que los tres
  departamentos usen la misma calidez.
**Verificado:** pruebas con 0 / 0,4 / 0,6 / 0,8 (`capturas/t16/calidez2.jpg`): desde 0,6 las paredes en sombra ya se
ven beige, así que el valor por defecto quedó en 0,5 con el relleno atenuado. Antes y después en
`capturas/t16/antes-despues.jpg`. T-01: cambios de 0,6 a 4,2 % en todas las vistas (el tono), sin advertencias ni
errores; línea base actualizada. `dist/` rearmado.
**Notas:** para un departamento puntual se puede subir o bajar con `"lighting": { "warmth": 0.3 }`. T-06 (sol que
entra, exposición y color real del piso) sigue pendiente y se apoya en esto.

---

# Hoja de ruta para vender (desde el 2026-11-03)

Pedido del usuario: "no sé si la gente lo compraría en el estado en el que está"; las mejoras tienen que servir para
cualquier departamento y mejorar los resultados futuros del motor, y tiene que ser fácil para el dueño mostrarlo y
fácil venderlo, sin depender de servidores. Regla para todos estos tickets: nada específico de un departamento; lo
que se prueba en uno (San Nicolás es el caso de prueba más reciente) se generaliza y se verifica en todos con T-01.

## T-17 · Hosting propio y publicar con un comando

**Por qué:** los links de Claude son privados, llevan la marca de claude.ai y hay que compartirlos uno por uno: no se
le pueden entregar a un cliente. El producto ya es un sitio estático (HTML, dos JS y el scene.json): no necesita
servidor ni para el dueño ni para el huésped.
**Hecho cuando:** `node motor/publicar.mjs <depto>` deja el departamento en `https://<dominio>/<depto>/`, público, con
la marca propia; el paquete lleva three.js y sus módulos adentro (sin CDN) y funciona igual abierto sin internet
salvo el primer acceso; hay una página índice privada con todos los publicados.
**Cómo:** hosting estático gratuito (Cloudflare Pages, Netlify o GitHub Pages; elegir con el usuario, que crea la
cuenta y el dominio). `empaquetar.mjs` copia three.js en `dist/<depto>/vendor/` y cambia el importmap. Descargar
three.js una vez al proyecto (pedir permiso: implica bajar archivos). El comando de publicar usa la herramienta de
línea de comandos del hosting.
**Verificación:** abrir el link desde un celular con datos móviles (otra red), sin sesión de Claude; peso total y
tiempo de carga; el visor no pide nada a un dominio externo (red del navegador).
**Avance (2026-11-04):** `motor/publicar.mjs [depto …]` arma `sitio/` con todos los deptos en **un solo sitio**, cada
uno en una carpeta fija guardada en `publicar.json` (id o barrio + 4 letras al azar, sin calles): una sola dirección
gratuita para todos, sin comprar dominios; si algún día hay dominio propio, se apunta al mismo sitio. La portada no
lista los deptos, `robots.txt` y `_headers` piden no indexar, y el visor publicado tiene el `scene.json` fijo (sin
`?scene=`, que dejaba mostrar cualquier otro scene con nuestra dirección). Probado en local: los cinco abren,
`?vista=` funciona, San Nicolás carga su textura. Hosting elegido: **Cloudflare Pages** (gratis, sin tope de tráfico
según su documentación, 20.000 archivos y 25 MiB por archivo; el sitio hoy son 29 archivos y 1,6 MB). GitHub Pages
pide repositorio público y Netlify pasó a créditos que pausan el sitio al agotarse.
**En línea (2026-11-04):** proyecto de Cloudflare Pages `recorrelo3d` (cuenta del usuario, flujo "Pages" con subida
directa, no Workers: así la dirección no lleva el nombre de la cuenta) → **https://recorrelo3d.pages.dev**. El nombre
del proyecto no se puede cambiar. Primera subida arrastrando `sitio/` (29 archivos). Probado en línea: los cinco deptos
responden 200 con su título, `?vista=` abre el ambiente, `?scene=` se ignora, la textura de San Nicolás carga, todo con
`X-Robots-Tag: noindex`; una dirección que no existe muestra la portada neutra (no hay 404.html). QR y tarjeta del
depto 5 regenerados con `https://recorrelo3d.pages.dev/palermo-chico-q7q3/`.
Para actualizar: `node motor/publicar.mjs` y en el proyecto "Create new deployment" con la carpeta `sitio/` entera
(cada subida reemplaza todo el sitio).
**Probado por el usuario (2026-11-04):** escaneó el QR de la tarjeta del depto 5 y el de la carta de presentación
desde el celular con datos móviles: funcionan.
**Decisión del usuario (2026-11-04):** por ahora se dejan de lado los deptos 1, 2, 4 y San Nicolás; se pule solo el
depto 5. (Siguen en el sitio hasta que se decida sacarlos: hace falta rearmar `sitio/` y que el usuario lo suba.)
**Falta:** three.js dentro del paquete (pide permiso para descargar). three.js sigue desde
jsDelivr (llevarlo adentro implica bajarlo: pedir permiso). Los videos no van al sitio (el de alta pesa más de 25 MiB).

## T-18 · Estudio de producción en una página

**Por qué:** hoy producir un departamento son varias páginas y comandos sueltos (verificar, comparar, exportar, video,
empaquetar, catálogo). Cuanto menos pasos, menos tiempo por departamento y menos errores.
**Hecho cuando:** `motor/estudio.html` muestra la lista de departamentos y, para el elegido: avisos y mapa de
circulación, hojas de comparación, y botones para generar imágenes, video horizontal y vertical, plano, QR y el
paquete; todo queda en `entregas/<depto>/` con una página índice para revisar.
**Cómo:** reusar el código de verificar, comparar, exportar y video como módulos; cola de tareas con progreso;
`serve.mjs` sigue siendo solo una herramienta de producción local.
**Verificación:** producir de cero la entrega de un departamento existente desde la página, sin abrir otra.

## T-19 · Kit de entrega para el dueño

**Por qué:** el dueño tiene que poder usarlo sin saber nada técnico, y en Airbnb no se pueden poner links externos.
**Hecho cuando:** cada entrega trae: link y QR (tarjeta de bienvenida, mensajes a huéspedes, Instagram); el plano
(T-09) en imagen; video vertical 9:16 (Reels, estados) además del horizontal; 6–10 imágenes de día y de noche; un
texto corto sugerido para presentar el recorrido; una guía de una página "dónde usar cada cosa"; todo en una página
de descarga con la marca.
**Cómo:** `video.html` con `&formato=vertical` (encuadres 9:16 propios: las vistas con foto vertical ya sirven);
guía y texto generados desde el scene (`about`, nombres de ambientes).
**Verificación:** un kit completo de dos departamentos distintos; revisarlo como si fuera el dueño, desde el celular.
**Estado:** en parte (2026-11-04). Kit completo del depto 5 (Departamento demo) en `entregas/depto5/`; falta el segundo
departamento y abrirlo en un celular de verdad.
**Qué tiene el kit (depto 5):**
- `index.html`: página para el dueño (escritorio y 375 × 812 revisados, sin desborde): qué incluye, 10 imágenes para el
  anuncio (`anuncio/`, 8 de día y 2 de noche, con botón de bajar), las 44 imágenes de día y de noche, los dos videos con
  portada y versión liviana, plano PNG y SVG con las dudas para el dueño, links por ambiente y QR, textos para copiar.
- Videos: `recorrido.mp4` (1920 × 1080, 67,5 s, 9 ambientes, termina de noche) y `recorrido-vertical.mp4` (1080 × 1920,
  38,2 s, 7 ambientes), más `recorrido-liviano.mp4` (5,2 MB) y `recorrido-vertical-liviano.mp4` (3,2 MB) para mensajes.
- `plano.png` / `plano.svg` con el norte (del rumbo de la fachada) y `plano.json` con 5 dudas.
- `links.json` y `qr.png` con un **link de prueba** (`https://recorridos.ejemplo.com/departamento-demo/`) hasta publicar.
- `textos.txt`: presentación corta, texto para Airbnb (sin link), mensaje a huéspedes, Instagram y tarjeta.
- `guia.html` (una página, "dónde usar cada cosa", imprimible) y `tarjeta.html` (tarjeta de bienvenida A6 con QR).
**Herramientas nuevas (sirven para cualquier depto):** `motor/kit.mjs <id> --elegidas=… [--noche=…]` arma todo lo
anterior a partir del scene y de lo exportado (con `brand` lleva el nombre y el color); `video.html&formato=vertical`
(9:16, tomas más cortas, conserva el ancho de la foto en lugar de recortar) y `&vistas=` (qué ambientes y en qué orden);
`plano.html` dibuja el norte con `exterior.bearing` y los arcos como pase.
**Falta:** segundo depto; abrirlo en un celular real; el link definitivo (T-17) para regenerar QR y links; una portada
con la marca cuando exista.
**Cambio de alcance (2026-11-04), a pedido del usuario:** las imágenes sueltas no suman frente al modelo; la entrega
queda en **recorrido 3D, videos (horizontal y vertical, con sus livianos) y tarjeta de bienvenida con el QR** que lleva
al recorrido. Fuera: imágenes del anuncio, las de día y de noche por vista, plano, textos y guía. `kit.mjs <id>` (sin
`--elegidas`) escribe solo `index.html` y `tarjeta.html`; `exportar.html` deja `portada.jpg` (la vista `&portada=`, para
la tarjeta), `links.json` y `qr.png`, y las imágenes por vista solo con `&imagenes=1`; `plano.html` guarda en
`capturas/<id>/` (sigue sirviendo para confirmar la distribución con el dueño). Lo que salía antes del depto 5 quedó en
`capturas/depto5/imagenes/` y el plano en `capturas/depto5/`.

## T-20 · Vista real por la ventana tomada de las fotos

**Quitado (2026-11-04):** a pedido del usuario se sacó del motor, porque con fotos de anuncio no es realizable de
forma confiable (encuadres de gran angular que no calzan, fantasmas de cortinas y muebles, marcos y barandas en la
foto). Ahora todas las ventanas muestran el entorno generado. Se sacaron `windowBackdrops`, `windowDistance` y
`windowInfo` de `engine.js`, la clave `exterior.fromPhotos` de `validate.js`, la copia de recortes de
`empaquetar.mjs`, el permiso de escritura de `serve.mjs` y `motor/ventanas.html`; los deptos 1, 2, 4 y San Nicolás
quedaron sin `fromPhotos`. Copia de todo lo quitado (código, recortes y scenes anteriores) en
`capturas/quitado-ventanas-fotos/`. Los artifacts publicados de esos cuatro deptos siguen con la versión anterior
hasta que se republiquen. Lo que sigue es el historial del ticket.

**Por qué:** lo que se ve por la ventana vende (el Obelisco en San Nicolás, el lago en el depto 4) y el entorno
generado no lo puede igualar. Ya tenemos cada foto "calibrada": cada vista con foto conoce posición, dirección y campo
de visión de la cámara.
**Hecho cuando:** para cualquier departamento, cada ventana que aparece en alguna foto muestra afuera el pedazo de esa
foto; desde la vista de la foto coincide exacto y al moverse se ve natural (está lejos); las ventanas sin foto siguen
con el entorno generado; de noche se oscurece con buen gusto; se activa con `"exterior": { "fromPhotos": true }`.
**Cómo:** proyectar las esquinas de cada vano en la cámara de cada vista con foto para saber qué ventanas se ven y
dónde; recortar ese pedazo de la foto al empaquetar (solo los recortes, no las fotos enteras: 50–150 KB cada uno);
un panel grande unos 30 m afuera del vano con un material que toma el color "proyectando desde la cámara" de la foto.
Rejas y marcos ya aparecen en la foto: no dibujar la reja 3D en ventanas con fondo de foto (o borrarla del recorte).
Elegir la mejor foto cuando una ventana sale en varias (la más de frente y más grande).
**Verificación:** hojas día | foto de todas las vistas con ventana de los cuatro departamentos; recorrer cerca de la
ventana buscando costuras o deformaciones; peso del paquete.
**Estado:** hecho (2026-11-03). Activado en los cuatro departamentos.
**Qué se hizo:**
- `motor/ventanas.html?depto=<id>` (nuevo): por cada ventana corrediza que sale en alguna foto elige la vista donde
  se ve más grande, **solo entre las fotos bien encuadradas** (puntaje de parecido de T-21 ≤ 16: en San Nicolás
  "Ventana del dormitorio" no calza y traía pared y cama). Dibuja el mapa de identificación con vidrios (qué píxeles son
  ese vidrio) y sin vidrios con distancia (qué hay detrás); recorta de la foto el rectángulo del vidrio y borra lo que
  en el modelo está adentro o a menos de 1,5 m detrás (marcos, cortinas, baranda, balcón), rellenándolo con lo de
  alrededor. La reja se deja: es la real. Guarda `departamentos/<id>/ventanas/*.jpg` y `ventanas.json` (recorte en
  coordenadas de la foto y la matriz de su cámara). `serve.mjs` acepta guardar ahí.
- `engine.js` (`"exterior": { "fromPhotos": true }`, opción `base` de `start()` con la carpeta del scene): a 6 m afuera
  de cada ventana con recorte, un panel que toma el color proyectando desde la cámara de la foto: desde esa vista
  coincide y al moverse se ve lejano; fuera del recorte no dibuja y queda el entorno generado (borde fundido). De noche
  se oscurece hacia un azul. Si la ventana tiene fondo de foto se saca la reja 3D (la de la foto tiene el dibujo real).
  `idMap({ depth, hideGlass })` y `viewProj` para la herramienta. Visor y herramientas pasan `base`.
- `components.js`: la reja va en su propio grupo (`part: 'grille'`); la tabla de ids conoce las partes.
- `empaquetar.mjs` copia solo los recortes y `ventanas.json` (sin datos internos).
**Verificado:** láminas `capturas/t20/antes-despues-<depto>.jpg` (día, noche y foto): San Nicolás muestra el Obelisco y
  los edificios reales en "Mesa y vista" y la ciudad en el baño; depto 4, los pinos reales por el ventanal de la
  escalera y el lago en el dormitorio principal; depto 1 y 2, su vista. Ventanas con recorte: depto 1: 2, depto 2: 1,
  depto 4: 5, San Nicolás: 2. Peso: 12–64 KB por departamento. `dist/sannicolas` probado: carga los recortes, sin
  avisos.
**Arreglo tras el reporte del usuario (2026-11-03):** "sigue siendo poco profesional": desde otra vista solo medio
  vidrio mostraba la foto (el resto, la ciudad generada, con un corte), el borde se estiraba en franjas, se veían
  "fantasmas" de las flores y sillas de la foto, y la ventana de la cocina del depto 4 se veía blanca. Se hizo: el panel
  va pegado al vidrio (12 cm) o justo detrás del balcón (`windowDistance`, también en `api.windowInfo()` para la
  herramienta), es opaco y estira el borde en lugar de cortarse; `ventanas.html` borra de la foto solo lo que el 3D
  dibuja delante del panel (el balcón), borra lo de adentro con un margen grande y descarta recortes de menos de
  150 px (quedan con el entorno generado: depto 4 pasa de 5 a 2 ventanas con foto). Las botellas de la mesa de San
  Nicolás se modelaron (`tabletop-decor` con `bottle` y `bottle-flowers`, nuevo en el catálogo) para que la foto no las
  muestre pegadas al vidrio. Capturas: `capturas/t20/arreglo2.jpg` (de costado, desde el otro lado y desde la foto).
  **Queda:** de costado todavía se ve algo de las flores de la foto corridas respecto de las 3D, y el relleno de lo
  borrado es borroso; con la cámara de la foto calzando de verdad (T-27) se puede borrar exacto.
**Pendiente:** las ventanas que solo salen en fotos mal encuadradas siguen con el entorno generado (mejora con T-27:
  volver a correr `ventanas.html` después de encuadrar). No se recorrió caminando cerca de la ventana en un equipo con
  el panel visible (con el panel oculto no corre la animación); desde otras vistas el recorte se ve como algo lejano y
  la reja de la foto, a 6 m, se corre un poco respecto del marco.

## T-21 · Mapa de identificación por foto y medida de parecido

**Por qué:** es la base de T-22, T-23, T-24 y T-27, y permite medir la fidelidad con un número en lugar de a ojo.
**Hecho cuando:** para cada vista con foto se puede dibujar el modelo desde la cámara de la foto pintando cada mueble
y superficie con un color de identificación; con eso, por cada objeto, se sabe qué píxeles de la foto le
corresponden; `comparar.html` informa por objeto la diferencia de color entre render y foto, y un puntaje por vista.
**Cómo:** segunda pasada de dibujo con un material plano por objeto (`userData` con el id del mueble o superficie),
al tamaño de la foto; leer los píxeles; ignorar bordes (1–2 píxeles) para tolerar el desalineado.
**Verificación:** superponer el mapa a la foto en dos departamentos; los puntajes tienen que bajar cuando se mejora un
color a mano.
**Estado:** hecho (2026-11-03).
**Qué se hizo:**
- `engine.js`: cada grupo se marca con qué es (`userData.oinfo`: mueble con tipo, posición e índice; piso de un
  ambiente; pared con su índice; abertura; techo; zócalo; estructura; exterior) y `assignIds` le pone a cada malla un
  atributo `oid` con el id de su objeto **y material** antes de unir las piezas (un sillón con tapizado y patas da dos
  ids). `api.idMap()` dibuja la vista con un material plano que pinta el id y devuelve `{ width, height, ids, table }`;
  la tabla dice de cada id qué es y su color pedido. `mergeStatic` conserva el atributo.
- `components.js`: cada material recuerda el color que se le pidió (`userData.srcColor`).
- `motor/parecido.js` (nuevo): píxeles interiores de cada objeto (2 px de borde afuera), color medio del render y de
  la foto en espacio lineal, mediana de la foto, ΔE (Lab) por objeto; descarta foto quemada o casi negra. Puntaje de
  la vista: ΔE medio pesado por superficie después de igualar exposición y balance de blancos (así mide si los colores
  están bien entre sí, no cuánta luz tenía la foto); `puntajeCrudo` sin igualar. `medirVistas()` mide todas las vistas
  con foto y arma la lámina de control (foto con los bordes del mapa | mapa).
- `comparar.html?scene=…&medir=<carpeta>`: guarda `parecido.json` y `mapa-<vista>.jpg`. Ya no hace falta `&fotos=`:
  cada scene lleva `"photos"` (carpeta de sus fotos; `empaquetar.mjs` lo saca del publicado y `validate.js` lo conoce).
  Las capturas pasan por data URL en lugar de `toBlob`.
**Verificado:** láminas `capturas/t21/sannicolas/mapa-*.jpg` y `capturas/t21/depto1/mapa-*.jpg`: el mapa calza sobre la
  foto en las vistas bien encuadradas (en "Living" del depto 1 se ve que la mesa del modelo no está donde la foto:
  fidelidad de T-14/T-27). Con los colores de T-22 el puntaje baja en los cuatro (ver T-22).
**Notas:** las aberturas se miden como un solo objeto por material (marco, hoja); el vidrio lleva `glass`. Para
  encuadre (T-27) sirve comparar bordes del mapa con los de la foto.

## T-22 · Colores medidos en las fotos

**Por qué:** el aspecto "de catálogo" viene sobre todo de colores aproximados elegidos a ojo.
**Hecho cuando:** una herramienta propone para cada mueble y superficie visible el color medido en sus fotos
(mediana, corrigiendo la luz con la relación entre render y foto en esa zona) y escribe una lista de sugerencias que
se revisa y se aplica al scene.json con un comando; usado en el paso 4 de SKILL.md.
**Cómo:** sobre T-21; trabajar en espacio lineal; descartar zonas quemadas o muy oscuras; si un objeto sale en varias
fotos, combinar.
**Verificación:** puntaje de parecido de T-21 antes y después en los cuatro departamentos; hojas de comparación.
**Estado:** hecho (2026-11-03). Colores aplicados en los cuatro departamentos (los scene de antes quedaron en
`capturas/t22/scenes-antes/` por si hay que volver).
**Qué se hizo:**
- `motor/colores.html?depto=<id>` (nuevo): mide todas las vistas con foto y propone por objeto el color que haría
  coincidir render y foto: color actual × (foto / render) por canal en espacio lineal, descontando exposición y balance
  de blancos de cada foto con las paredes y el techo como referencia (con la mediana de todos los objetos, la madera y
  las telas corrían el tono: un revestimiento gris salía rosado). Corrección limitada a ×3 o ÷3; el tono se corre con
  tope de 10 en a*b*; la claridad, a medias y con tope de 20 (la luz de cada rincón de la foto no es la del render);
  lo blanco y neutro no se oscurece más de 4. Muebles iguales (mismo tipo y color) se miden juntos. Se descartan
  exterior, vidrios, metales, lo que brilla, lo estampado y los marcos de ventana. Marca cada propuesta como confiable
  (varias fotos que coinciden, o una sola con mucha superficie). Guarda `capturas/<id>/colores.json`.
- `node motor/colores.mjs <id> [--aplicar] [--todas] [--solo=1,4]` (nuevo): busca qué parámetro tiene ese color (del
  mueble, también anidado; piso del ambiente; `wallColor`, `ceiling`, `baseboard`; abertura) y lo cambia en el texto
  sin reformatear el archivo. Si el mueble usa el color por defecto, agrega el parámetro (del catálogo), en todos los
  muebles iguales del mismo estilo aunque no salgan en ninguna foto. Por defecto aplica solo las confiables.
- Paso 4 de SKILL.md: medir y aplicar colores.
**Verificado:** puntaje (ΔE medio con exposición igualada, más bajo es mejor) antes → después: depto 1 13,0 → 12,1;
  depto 2 12,1 → 11,3; depto 4 13,6 → 11,9; San Nicolás 15,3 → 14,7. Láminas `capturas/t22/antes-despues-<depto>.jpg`
  (antes, después y la foto). Cambios moderados: azulejos y acolchados más parecidos, pisos de madera del depto 4 algo
  más fríos, telas y maderas apenas corridas. Catálogo: parámetros bien. T-01 sin avisos nuevos.
**Notas:** el color medido es tan bueno como el encuadre: en vistas que no calzan (T-27) se mide otra cosa. Las
  diferencias de luz local (sol cálido en el render, cielo frío en la foto) todavía corren algo el tono de las telas
  naranjas hacia el amarillo; por eso los topes. El color de paredes no se puede medir contra sí mismo (es la
  referencia del balance): queda como lo eligió el modelado.

## T-23 · Texturas de imagen rectificadas desde las fotos

**Por qué:** piso, azulejos, mesada, madera y tapizados grandes son lo que más se ve; con textura real el modelo se
parece de verdad al lugar.
**Hecho cuando:** el motor carga texturas de imagen además de las procedurales (piso, paredes, azulejos, mesada,
madera y telas; `"texture": "tex/<nombre>.jpg"`); una herramienta "endereza" el pedazo de foto de cada superficie
plana (el piso visto en perspectiva pasa a verse desde arriba), lo vuelve repetible y le quita las manchas de luz de
la foto; `empaquetar.mjs` copia `departamentos/<id>/tex/`.
**Cómo:** con T-21 se sabe qué píxeles son de cada superficie y se conoce su plano: homografía al plano, recorte de
la zona mejor iluminada, compensar la luz dividiendo por un desenfoque grande, bordes en espejo con fundido; tamaño
real de la baldosa o tabla medido en la foto.
**Verificación:** hojas de comparación de cerca (piso y baño) en los cuatro departamentos; costuras al repetir; peso.
**Límite:** en superficies chicas o en sombra queda el color medido (T-22) y la textura procedural.
**Estado:** en parte (2026-11-03). Hecho: el motor dibuja texturas de imagen y la herramienta las endereza y las
controla. Pendiente: que pasen el control, para lo que hace falta que la cámara de cada vista calce con su foto (T-27).
**Qué se hizo:**
- `engine.js`: pisos con `"floor": { "texture": "tex/<archivo>.jpg", "textureSize": <m> }` y componentes con
  `params.texture` (por ahora `wall-tiles`, con `textureSize`). `loadImages` carga lo que pide el scene desde la
  carpeta del scene (`base`); el material conserva el color (tiñe) y pierde el relieve y el brillo procedurales.
  `validate.js` conoce las claves; `empaquetar.mjs` copia solo las texturas que nombra el scene.
- `motor/texturas.html?depto=<id>` (nuevo): para el piso de cada ambiente y cada revestimiento busca en las fotos bien
  encuadradas el cuadrado más grande y más cerca de la cámara que se vea entero (mapa de T-21), con lado múltiplo de la
  baldosa (al menos dos por lado) o 0,6 m en tablas; lo endereza proyectando cada texel del plano con la cámara de la
  foto, le saca la luz (divide por un desenfoque grande), lo deja neutro (el color es el de T-22) y funde los bordes con
  lo que sigue para que repita sin costura. **Control de calidad**: las juntas tienen que coincidir corriendo una
  baldosa, sin brillos fuertes ni colores ajenos. Guarda `departamentos/<id>/tex/` y `capturas/<id>/texturas.json`.
- `node motor/texturas.mjs <id> [--aplicar] [--todas]` (nuevo): escribe `texture` y `textureSize` en el piso (y en los
  ambientes con el mismo piso) o en el revestimiento, sin reformatear; por defecto solo las que pasaron el control.
  `motor/jsonpos.mjs` (nuevo) es el lector con posiciones que comparten este comando y `colores.mjs`.
**Verificado:** el motor dibuja una textura de imagen en piso y revestimiento con la escala y orientación pedidas
  (`capturas/t23/prueba-motor.jpg`, escena en memoria). La herramienta corrió en los cuatro: 7 recortes posibles; el
  control rechazó 5 (juntas giradas o corridas: la cámara de la vista no calza al centímetro; brillos del porcelanato;
  una alfombra en el piso de madera del depto 4). Los 2 que pasaron (tablas del depto 2 y del altillo del depto 4) se
  miraron y tampoco sirven (uno lavado, otro con la cama): **no se aplicó ninguna** y el control tiene que endurecerse.
**Próximo paso:** después de T-27 (encuadre automático), volver a correr `texturas.html` en los cuatro; sumar al control
  una comparación contra el color medido (T-22) y que el recorte no tenga bordes fuertes que no sean juntas.

## T-24 · Estampados de telas desde las fotos

**Por qué:** almohadones, acolchados, mantas, cortinas y alfombras con su estampado real se reconocen al instante.
**Hecho cuando:** los componentes de tela aceptan una textura de imagen (`"texture"`) y una herramienta recorta el
estampado de la foto para cada uno, con escala aproximada.
**Cómo:** sobre T-21 y T-23 (mismo cargador de texturas); para telas arrugadas, recorte simple de la zona más plana.
**Verificación:** hojas de comparación de los ambientes con telas estampadas.
**Estado:** hecho en parte (2026-11-03). El motor y la herramienta funcionan; la elección de qué recorte es un estampado
de verdad queda a ojo (el control automático no distingue bien un estampado de un pliegue o de otro mueble).
**Qué se hizo:**
- `engine.js`: cualquier mueble acepta `"textures": { "<color>": "tex/<archivo>.jpg" | { "src", "scale" } }`: la pieza
  de ese color lleva la imagen con sus propios colores (deja de teñirse) sobre las coordenadas de textura del
  componente; `scale` agranda (< 1) o achica el dibujo. `catalogo.mjs` lo acepta en cualquier mueble y lo documenta.
- `motor/telas.html?depto=<id>` (nuevo): por cada tela (material de tela de un mueble, sin las ya estampadas) busca
  en las fotos bien encuadradas el cuadrado más grande que sea solo esa tela (mapa de T-21, 4 px adentro), le saca la
  luz conservando sus colores, la lleva a la claridad del color medido (T-22) y la hace repetible (bordes fundidos en
  espejo). Descarta las lisas. Muebles iguales comparten estampado. Guarda `tex/tela-*.jpg` y `capturas/<id>/telas.json`.
- `node motor/telas.mjs <id> --solo=<n> --aplicar` (nuevo): escribe `textures` en los muebles de ese tipo con esa tela.
  Nada se aplica solo: hay que mirar los candidatos.
**Verificado:** candidatos de los cuatro departamentos en `capturas/t24/candidatos.jpg` (una fila por depto): el único
  estampado real y bien recortado es el de rombos de los almohadones de San Nicolás; el resto son pliegues, pedazos de
  otro mueble o lisos. Aplicado ese (`scale` 0,25 para que el rombo tenga el tamaño de la foto): de cerca
  `capturas/t24/almohadones-cerca.jpg` (antes de ajustar: repetido 4 veces y apagado por el color) y
  `almohadones-cerca-2.jpg` (como la foto); vista y foto en `capturas/t24/despues-sannicolas.jpg`.
**Arreglo tras el reporte del usuario (2026-11-03):** los almohadones tenían manchas blancas en los bordes (el
  recorte traía el fondo de la foto): ahora se toma solo el 70 % del centro del cuadrado (`capturas/t20/arreglo-cerca.jpg`,
  a la derecha).
**Pendiente (viejo):** el recorte de los almohadones traía en las esquinas un poco del fondo (arreglado arriba); la escala la elige quien revisa
  (la herramienta podría medirla con la distancia del mapa). Con mejor encuadre (T-27) volver a correrlo: varios
  recortes eran de otro objeto. Cortina de baño estampada y en L: va con T-25.

## T-25 · Catálogo: piezas que faltan y más variedad

**Por qué:** cada departamento nuevo trae piezas que no existen (en San Nicolás hicieron falta seis) y lo que falta se
nota en la foto.
**Hecho cuando:** existen o se generalizan, con su ficha y comentario: ventilador de pie, cortina de ducha en L y con
estampado, receptáculo de ducha revestido, cuadros con la imagen tomada de la foto, plantas variadas, objetos chicos
de mesa y mesada, lámpara de pie de varios estilos, cama de una plaza y cucheta, escritorio con silla, biblioteca.
Cada pieza nueva se revisa de cerca (T-26) antes de usarse.
**Verificación:** catálogo regenerado; cada pieza en una escena de prueba (`motor/pruebas/`) con captura de cerca.
**Estado:** hecho (2026-11-03), salvo la herramienta que recorta el cuadro de la foto (el componente ya acepta la imagen).
**Qué se hizo (`components.js`, con ficha y comentario):**
- Nuevos: `floor-fan` (ventilador de pie con jaula, aspas y motor), `bunk-bed` (cucheta con tarimas, colchones,
  acolchados, barandas arriba y escalera, `ladder` elige la punta), `desk` (escritorio de patas o de paneles, cajonera
  opcional con tirador), `bookshelf` (biblioteca con estantes y libros parados que se apoyan; `books`: false o 'some'),
  `tabletop-decor` (objetos chicos: florero con ramas, pila de libros, bowl, vela, plantita; `set` en la ficha porque
  van sueltos a propósito).
- Variantes: `floor-lamp` con `style: 'arc'` (arco con campana y luz hacia abajo) y `'tripod'` (tres patas de
  madera); `plant` con `style: 'tree'` (arbolito de interior) y `'succulent'` (para mesas y estantes); `wall-art` con
  `texture` (la imagen del cuadro tomada de la foto); `shower-curtain` con `return` (barral en L para duchas en
  esquina; el estampado va con `textures` de T-24); `shower` con `tray` (color) y `cladding` (receptáculo revestido).
- Cama de una plaza: ya existía (`bed` con `width` 0,9). Silla para el escritorio: los estilos de `chair`.
- `pruebas/piezas.js`: variantes extra para los parámetros que cambian la forma y no son de texto.
**Verificado:** 266 variantes de 62 componentes sin piezas sueltas (T-26); capturas de cerca en
  `capturas/t25/cerca-todo.jpg` (cuatro escenas de prueba, tres vistas cada una; los avisos de "se mete en una pared"
  son de la escena de prueba, que no tiene en cuenta el espesor de la pared). Catálogo: 62 componentes, parámetros bien.
**Pendiente:** herramienta que recorte el cuadro de la foto (como `telas.html`, con el mapa de T-21) y lo deje en
  `tex/`; mientras tanto se puede recortar a mano y poner `"texture"`. Más estilos de plantas y lámparas a medida que
  aparezcan en departamentos nuevos.

## T-26 · Validador de piezas sueltas o flotando

**Por qué:** el usuario vio sillas y futón "con partes que no están conectadas, semi flotando" en lo publicado; tiene
que saltar antes, sin depender del ojo.
**Hecho cuando:** al armar cada componente se revisa que cada pieza toque otra pieza del mismo componente o el piso
(o la pared, si es de pared), con una tolerancia de 1–2 mm; lo que queda suelto va a `warnings`; corre también en
`motor/pruebas/` con todos los componentes y todos sus estilos.
**Cómo:** cajas o distancias entre mallas del grupo antes de unirlas (`mergeStatic`), con un grafo de contacto.
**Verificación:** romper a propósito una silla (pata corrida) y que avise; todos los componentes actuales sin avisos.
**Estado:** hecho (2026-11-03).
**Qué se hizo:**
- `validate.js`: `loosePieces` arma un grafo de contacto entre las piezas de cada componente con la caja propia de cada
  pieza girada con ella (sirve para patas y caños inclinados; teorema del eje separador) y 2 mm de tolerancia. Tiene
  que quedar **una sola pieza unida** y apoyada: en el piso (todos), en la pared (los de pared y ventana), en el techo
  (los de techo: lo más alto) o en un lado amurado. Pared, techo y lados amurados unen lo que se atornilla ahí (la
  grifería y el receptáculo de una ducha); el piso sostiene pero no une, así una pata separada del asiento que quedó
  parada en el piso también avisa. El aviso dice cuántas piezas, dónde (centro en coordenadas del componente) y a qué
  distancia de la más cercana.
- `engine.js`: corre al armar cada mueble (una vez por tipo y parámetros) y va a `warnings`.
- Fichas (`META`): `fixed: ['back' | 'sides']` para lo amurado (bachas colgadas, grifería, mesadas, barrales de pared a
  pared) y `set: true` para juegos de objetos sueltos a propósito (ninguno lo necesita todavía).
- `motor/pruebas/piezas.html` (y `piezas.js`, que usa también `verificar.html`): cada componente con sus valores por
  defecto, cada estilo que compara su código y cada combinación de parámetros de los cuatro departamentos (243
  variantes), más una silla rota a propósito.
- Encontró y se arregló: sillón burbuja 4 cm en el aire (los gajos arrancaban en y = 0,04); barral de cortinas sin
  soportes a la pared y paños 4 mm debajo del barral; tiradores de barra sin vástagos (placard de abrir, bajo mesada,
  horno, horno eléctrico: nueva función `pull`); vidrio de la mesa con patas cromadas sin apoyos (cuatro tacos); asiento
  de la silla de madera 3 mm sobre las patas; cajón de la mesa de luz sin apoyo; jarra de la cafetera 5 mm sobre la
  base; respaldo tapizado de la cama a 4 cm de la base (dos herrajes ocultos); cortina de baño 15 mm bajo los aros;
  vidrio de la baranda sin grapas; aro del toallero del vanitory 25 mm bajo el mueble.
- `engine.js`: opción `device` en `start()` ('auto', 'desktop', 'mobile'). Con el panel del navegador oculto la ventana
  mide 0 de ancho y el motor se creía en un celular (sin oclusión): verificar, comparar, exportar y video piden
  'desktop'. Esto hacía que una corrida de verificación marcara 3–5 % en todas las vistas sin motivo.
- `motor/pruebas/cerca.html` (nuevo): uno o varios componentes en un cuarto de prueba, tres vistas, y con
  `&motor=/dist/<depto>/` la copia publicada para el antes y después.
**Verificado:** 243 variantes de 57 componentes sin piezas sueltas y la silla rota avisa; T-01: los cuatro
  departamentos con todas las vistas ≤ 0,3 % (los arreglos son de milímetros); `warnings` vacío salvo los 2 avisos
  conocidos del depto 4. Antes y después de cerca en `capturas/t26/` (sillón, mesa y silla, cortina, placard y mesa de
  luz). Catálogo regenerado, parámetros bien.
**Notas:** las aberturas (puertas y ventanas) no pasan por este control. Las vistas de `cerca.html` son fijas;
  conviene encuadrar según la caja del componente (se puede pasar `&vistas=`).

## T-27 · Encuadre automático de las vistas

**Por qué:** encuadrar cada vista contra su foto llevó 4 vueltas en San Nicolás; es lo que más tiempo de producción
consume después del plano.
**Hecho cuando:** partiendo de una cámara aproximada, una herramienta ajusta posición, dirección y campo de visión
para que el modelo coincida con la foto (bordes de paredes, piso y aberturas), y propone el resultado para revisar.
**Cómo:** comparar bordes de la foto con los del mapa de identificación (T-21) y optimizar pocos parámetros
(búsqueda local); límites razonables de altura (1–1,7 m) y fov (55–80).
**Verificación:** en los cuatro departamentos, partir de las cámaras desplazadas y volver a la buena; contar vueltas.
**Estado:** en parte (2026-11-03). La herramienta existe y mejora su puntaje en todas las vistas, pero **no cumple el
criterio**: partiendo de una cámara corrida no vuelve a la buena. No se aplicó a ningún departamento.
**Qué se hizo:**
- `motor/encuadre.html?depto=<id>[&vistas=…][&perturbar=1]` (nuevo): busca posición, rumbo, cabeceo y fov (altura 1–1,7 m
  sobre el piso del nivel, fov 50–85) que hagan coincidir los bordes del mapa de identificación (T-21) con los de la foto
  (Sobel, percentil 95, suavizado), con los bordes de paredes, piso, techo y aberturas al doble que los de muebles.
  Búsqueda local por coordenadas con pasos que se achican (unos segundos por vista a 320 px). Guarda
  `capturas/<id>/encuadre.json` y una lámina por vista en `capturas/t27/` (foto con los bordes del modelo: cámara
  actual | ajustada).
- `node motor/encuadre.mjs <id> [--aplicar] [--solo=a,b]` (nuevo): escribe `pos`, `target` y `fov` de las vistas elegidas.
**Verificado:** con `&perturbar=1` (15 cm al costado, 10 cm adelante, 4° de giro, 2° de cabeceo y 3° de fov) en las 31
  vistas con foto de los cuatro departamentos: el puntaje sube siempre (por ejemplo "Cama y placard" del depto 1
  0,19 → 0,38), pero la cámara queda a 7–44 cm y 1,4–8,6° de la original y el fov casi nunca vuelve. Es decir: el
  puntaje de bordes encuentra otras cámaras que le gustan tanto o más que la buena (hay muebles y medidas del modelo que
  no son los de la foto, y alejarse y abrir el fov se compensan). En el dormitorio de San Nicolás la cámara ajustada
  pone la línea del techo y la esquina más cerca de la foto (`capturas/t27/sannicolas-dormitorio.jpg`), pero el aire
  acondicionado queda peor. Corregido: en las vistas del altillo el límite de altura no tenía en cuenta el nivel.
**Próximo paso:** puntaje con solo las líneas estructurales (piso–pared, pared–techo, esquinas, marcos), que el modelo
  tiene bien aunque los muebles no calcen; buscar en dos escalas (160 y 320 px); fijar el fov en el de la foto si se
  conoce (dato EXIF del celular) para romper el empate entre alejarse y abrir; y recién entonces volver a correr las
  texturas (T-23), los estampados (T-24) y la vista por las ventanas (T-20), que dependen de esto.

## T-28 · Luz acogedora como estándar

**Por qué:** el usuario pidió luz "más acogedora" y aprobó el ajuste de San Nicolás; tiene que ser el resultado por
defecto de cualquier departamento, no un ajuste a mano.
**Hecho cuando:** los valores por defecto del motor dan el mismo carácter que San Nicolás (día cálido sin beige, noche
dorada con techo legible) en los cuatro departamentos; el color de paredes por defecto se mide en las fotos (T-22) en
vez de un blanco frío fijo; el usuario aprueba el antes y después.
**Cómo:** pasar `warmth`, relleno y exposición de noche probados en San Nicolás al motor, compensando los deptos que
ya tenían valores propios; revisar que el depto 4 (con lago y claraboyas) no se pase.
**Verificación:** hojas de día y de noche de los cuatro departamentos; T-01 y línea base nueva con OK del usuario.
**Estado:** hecho (2026-11-03). **Espera aprobación del usuario** del aspecto (láminas abajo).
**Qué se hizo:**
- `engine.js`: los valores por defecto pasan a ser los aprobados en San Nicolás: calidez 0,58 (antes 0,5), relleno de
  día 0,82 (antes 0,75), relleno de noche 0,5 (antes 0,26) y exposición de noche 1,35 (antes 1,15). Constantes
  `WARMTH`, `AMBIENT`, `NIGHT_AMBIENT`, `NIGHT_EXPOSURE`.
- San Nicolás ya no fija esos valores en su scene (son los del motor); conserva sus paredes `#efe8dc` y sus colgantes.
- `motor/lamina.html` (nuevo): una lámina por departamento con tres vistas de día arriba y de noche abajo; acepta
  `&lighting=<json>` para probar valores sin tocar los scene.
- SKILL.md: la luz por defecto ya es la acogedora.
**Verificado:** láminas `capturas/t28/antes-despues-<depto>.jpg` (arriba el antes, abajo el después; en cada una, día
  y noche): de día apenas más cálido sin paredes beige; de noche dorado con techos y alacenas legibles; el depto 4 con
  lago y claraboyas no se pasa. T-01: deptos 1, 2 y 4 cambian 0,5–0,8 % (el tono), San Nicolás igual; sin avisos
  nuevos. Línea base actualizada para que los tickets que siguen se comparen contra esto (si el usuario no lo
  aprueba, volver a 0,5 / 0,75 / 0,26 / 1,15 y rehacer la base).
**Pendiente:** el color de paredes por defecto medido en las fotos queda para T-22 (propone `wallColor` por
  departamento).

## T-29 · Registro de tiempo y vueltas por departamento

**Por qué:** para que el negocio deje margen, producir un departamento tiene que llevar menos de una hora; hay que
saber dónde se va el tiempo.
**Hecho cuando:** cada departamento tiene `capturas/<id>/proceso.json` con las vueltas de validar y comparar, los
cambios de motor que pidió y el tiempo de cada paso; un resumen en TICKETS.md por departamento nuevo.
**Verificación:** el próximo departamento nuevo queda registrado completo.

## T-30 · Vitrina pública y recepción de pedidos

**Por qué:** vender necesita algo para mostrar y una forma simple de pedir.
**Hecho cuando:** en el dominio de T-17 hay una página con 3–4 departamentos de muestra (recorrido, video y plano),
qué incluye cada opción, precios y un formulario de pedido (link del anuncio, fotos, datos y permiso para usarlas);
cada pedido llega listo para empezar el paso 1 de SKILL.md.
**Cómo:** página estática; el formulario con un servicio de formularios (elegir con el usuario).
**Verificación:** hacer un pedido de prueba de punta a punta.

## T-31 · Validación comercial

**Por qué:** antes de invertir mucho más hay que saber qué compraría la gente y cuánto pagaría.
**Hecho cuando:** 8–10 charlas con anfitriones, administradores de alquiler temporario e inmobiliarias mostrando las
demos; anotado qué usarían (link, video, plano, imágenes), para qué y cuánto pagarían; conclusiones que reordenan
esta hoja de ruta.
**Cómo:** guion corto de preguntas; ofrecer armar su propia propiedad como demo privada (con su permiso).
**Nota:** lo hace el usuario; Claude prepara el guion, las demos y el resumen.

## T-32 · Publicados al día

**Por qué:** los deptos 2 y 4 siguen con el motor anterior y el 1 no tiene las últimas mejoras; una demo vieja
vende peor.
**Hecho cuando:** los publicados usan el motor actual (con permiso del usuario en cada republicación) y la tabla de
publicados de arriba dice qué versión tiene cada uno; con T-17, pasan al hosting propio.
**Verificación:** leer cada artifact publicado y compararlo con `dist/`.

## Informe: departamento 5, Departamento demo (2026-11-04)

Entrega completa pedida por el usuario "como para un cliente que paga". Fotos `departamento5/` (29 AVIF) →
`fotos/depto5/` (ffmpeg, nombres sin ñ: `bano1`…); anuncio de Airbnb 1597929013724539655 (
estudio, 2 camas, 1 baño, hasta 2 huéspedes, sin m²); Street View solo como referencia (fachada al
noroeste, ~319°, calle angosta con plátanos, edificios de 8–11 pisos enfrente). Resultado: `departamentos/depto5/`
(3 ambientes, ~28 m² más el balcón, 22 vistas, 20 con foto), `dist/depto5/` y `entregas/depto5/` (ver T-19).
- Inventario 1 vuelta: las 29 fotos son del departamento (las 4 "afuera" son el balcón; una se usa como vista "Vista al
  balcón"; ninguna del edificio). La distribución costó: la puerta de entrada, el baño (se entra desde el vestíbulo de la
  cocina, puerta junto a la heladera) y el pase a la cocina salieron de cruzar adicional, adicional3, cocina4 y living6.
- Medidas 1 vuelta (cama de una plaza, puerta y sillón como regla). Plano 1 + 3 retoques (arco más lejos de la fachada,
  pase a la cocina más cerca de la entrada, puerta de entrada junto a la consola).
- Validar 5 vueltas (4 → 1 → 1 → 1 → 0 avisos: cama contra la pared y contra la mesa de luz, banco, silla contra la
  pared, alacena sobre la heladera); circulación de 60 cm toda en verde desde la primera.
- Comparar 5 hojas completas + vistas sueltas. Puntaje de parecido 12,1 → 11,5 (colores medidos: se aplicaron 4 de 20,
  los confiables que no venían teñidos por la luz; los rosados y azulados se descartaron mirándolos).
- Cambios de motor y catálogo (todos generales, con ficha y comentario): abertura `arch` (arco de medio punto con barra
  `counter`); pisos `herringbone` (parquet en espiga) y `terrazzo` (granito); materiales `marble`, `frosted` (esmerilado
  que de noche no se oscurece) y `voile`; componentes `room-divider`, `bench`, `console-table`, `bar-stool`; variantes
  `chair` "wishbone", `dining-table` "round" (pie tulipa), `coffee-table` "oval" (metal, dos estantes), `sofa`
  "slipcover", `toilet` `cistern: "wall"`, `fridge` `finish: "enamel"` y `doors: 1`, `kitchen-wall` nicho `box` con
  `shelves` e `inside`, `curtains` `sheer`, `round-mirror` `ring`, `table-setting` `plate: false`, `tabletop-decor`
  "dried-flowers" y "diffuser"; baranda `balusters`; entorno `city.floors`; `exterior.bearing` (norte del plano); fichas:
  la alacena y el estante de cubos encastran con la heladera, el inodoro va amurado. Herramientas: `comparar.html` con
  el panel oculto (T-33), `ventanas.html&vistas=`, `video.html&formato=vertical`, `plano.html` (norte y arco),
  `motor/kit.mjs`.
- Verificado: `warnings` vacío en el depto 5; 308 variantes de 66 componentes sin piezas sueltas; catálogo con parámetros
  bien en los cinco; T-01: deptos 1, 2 y San Nicolás sin cambios, el 4 solo con sus 2 avisos conocidos (todas las vistas
  ≤ 0,3 %); línea base del depto 5 guardada. Capturas de cerca: `capturas/depto5/cerca-*.jpg`.
- Lo que no se pudo igualar: los encuadres de las fotos de gran angular (0,5×) quedan aproximados (T-34); la vista por
  las ventanas desde las fotos no se usó: el recorte de living1/living8 traía cortina y mesa ratona (fantasmas) y el de
  la foto del balcón traía marcos y baranda reales, así que va el entorno generado ajustado a Street View (T-35); las
  paredes de las fotos se ven más cálidas que en el render (es la luz de la foto; la luz quedó en los valores por
  defecto); vanitory con bacha de loza y cortina de baño con volado (T-36); el travesaño bajo del divisor se ve
  punteado visto muy en ángulo (posible ruido de la oclusión ambiental sobre un perfil fino delante del vidrio).
  **Corrección (2026-11-04):** sacarle la sombra al vidrio del divisor no arreglaba el punteado y lo dejaba a pleno sol,
  durazno y opaco (así quedó en la versión 1 publicada); se volvió atrás y el vidrio recibe sombra otra vez, como en las
  imágenes y los videos de la entrega. Falta republicar el depto 5.
- Dudas para el dueño (en el plano): medidas generales, ubicación del baño y lado de la ducha, largo de la cocina y qué
  hay entre la heladera y el baño, largo del balcón, si el sillón es cama (el anuncio dice 2 camas).

## T-33 · Herramientas con el panel del navegador oculto

**Por qué:** con el panel oculto la ventana mide 0 y las hojas de `comparar.html` salían de un solo color (lienzo de
300 × 150); se perdió una vuelta entera hasta notarlo.
**Hecho en parte (2026-11-04):** `comparar.html` le da a la caja un ancho fijo (540 o 720 px, sin achicarse en el flex)
cuando `innerWidth` es menor a 200. **Falta:** revisar el resto (`colores.html`, `ventanas.html`, `encuadre.html`,
`lamina.html`) y que avisen en la página si el lienzo mide 300 × 150.

## T-34 · Fotos de gran angular en el encuadre

**Por qué:** casi todas las fotos de anuncios recientes son de 0,5× (campo vertical de 90–100°, bordes estirados); con
fov 70–78 la cámara queda más atrás que en la foto y el puntaje de parecido no mejora al abrir el fov (T-27).
**Hecho cuando:** el encuadre (manual o T-27) reconoce una foto de gran angular (líneas curvas en los bordes, EXIF si lo
hay) y prueba fov 85–100 con la distorsión del lente; los deptos con fotos así mejoran su puntaje.

## T-35 · Vista por la ventana cuando ninguna foto calza

**Descartado (2026-11-04):** se quitó la vista por la ventana tomada de las fotos (ver T-20).

**Por qué:** en el depto 5 ninguna vista calzaba lo suficiente para recortar la ventana sin fantasmas; la foto tomada
desde la puerta del balcón muestra la vista real pero con marcos y baranda.
**Hecho cuando:** `ventanas.html` acepta un recorte marcado a mano (rectángulo en la foto) o borra de la foto los marcos
de una puerta abierta; o se usa la foto del balcón proyectada en un panel a la distancia de los edificios de enfrente.

## T-36 · Baño: vanitory con bacha de loza y cortina con volado

**Por qué:** en el depto 5 (y es lo más común en Buenos Aires) el vanitory es un mueble con la bacha de loza apoyada
que sobresale, y la cortina tiene un volado abajo; el catálogo los dibuja con mesada recta y cortina lisa.
**Hecho cuando:** `vanity` `style: "ceramic-top"` y `shower-curtain` `ruffle`, con ficha y captura de cerca.

## T-40 · Visor más simple y noche precargada

**Por qué (pedido del usuario, 2026-11-04):** la barra con más de 20 vistas y cuatro ajustes tapaba un tercio de la
pantalla; la ficha mostraba todo el texto; los botones "Con techo", "Estilo maqueta" y "Decoración extra" no aportaban;
"De noche" tardaba en aparecer.
**Hecho (2026-11-04):**
- `visor.html`: sin botones de techo (sale solo en las vistas "cut", como antes), maqueta ni decoración (siempre
  prendida). La ficha muestra el título y "Más información", que despliega el "about" y el aviso de modelo aproximado
  (con `&dev` sigue igual que antes). Las vistas van en una sola píldora abajo: ‹ nombre n/total › y "De noche" (en
  celular solo la luna); tocar el nombre abre la lista numerada de todas las vistas (flechas, Inicio/Fin, Escape;
  tocar fuera la cierra). ‹ › dan la vuelta. Copia del visor anterior en `capturas/quitado-visor-barras/`.
- `engine.js`: `api.ready`. Al cambiar día/noche o con/sin techo cambia la cantidad de luces y se recompilaban todos los
  materiales; además las texturas se subían a la placa recién al verlas. Ahora, después del primer cuadro, se compilan
  en segundo plano (`compileAsync`) todas las combinaciones día/noche × techo × nivel de las vistas, se suben las
  texturas de a 6 y se dibuja cada combinación una vez sin mostrarla.
**Cómo se verificó:** depto 5 en la PC, pasar a noche: de ~270 ms a ~60 ms; primera vista de adentro: de ~250 ms a
~50 ms; en modo celular todos los cambios 20–35 ms sin programas nuevos. La precarga termina ~1 s después de cargar.
`verificar.html` de los cinco: sin cambios (depto 4 solo con sus dos avisos conocidos). `dist/depto5` reempaquetado.
`sitio/` rearmado con `publicar.mjs` (2026-11-04, 5 deptos, 29 archivos, 1,6 MB) y probado en local.
**Falta:** que el usuario lo suba a Cloudflare y probarlo en un celular real.

## T-41 · Celular con la misma calidez que la PC

**Por qué (usuario, 2026-11-04, capturas de su iPhone y su PC):** en el celular el depto se veía lavado y plano: paredes,
puerta y techo casi del mismo tono, sin la profundidad cálida de la PC.
**Diagnóstico:** `motor/pruebas/movil-pc.html` dibuja la misma pose con el motor de PC, el de celular y el de celular
anterior, y mide la diferencia de luminancia contra la PC. Sacándole la oclusión ambiental a la PC la diferencia
bajaba de 6,4 a 2,4: casi todo era la falta de sombra suave en rincones, uniones y pie de los muebles. Abrir el spot de
las ventanas no cambiaba nada.
**Hecho:** el celular dibuja con posproceso: GTAO de 8 muestras (24 en PC) que reconstruye las normales desde la
profundidad del cuadro (no vuelve a dibujar la escena), muestreo múltiple ×4 en lugar del antialiasing del lienzo, y
la oclusión no se apaga nunca (los escalones de calidad del celular solo bajan la resolución). `start(…, { mobileAO:
false })` vuelve a lo anterior para comparar. Media resolución quedó descartada: dejaba bordes escalonados.
**Resultado (diferencia contra la PC, antes → ahora):** hacia la puerta 6,4 → 2,4; ventanal 7,5 → 5,5; cocina 5,0 →
2,2; baño 9,1 → 6,6; noche 3,7 → 1,5. Hojas PC | celular nuevo | celular anterior en `capturas/movil-pc/final-*.jpg`.
Costo en la PC con un cuadro de 1080 × 1920: 12,6 → 15,7 ms. `verificar.html` de los cinco sin cambios (el camino de
PC no se tocó). Sitio rearmado.
**Falta:** probarlo en el iPhone del usuario (fluidez y color). Lo que todavía difiere: el vidrio esmerilado y la cortina
del baño se ven más transparentes y parejos en el celular (las ventanas son spots y no luces de área), y por el
vidrio se ve un poco la sombra suave de lo que está detrás.

## T-42 · Guía de la primera visita y ayuda

**Por qué (usuario, 2026-11-04):** no quedaba claro cómo usar el visor. El aviso de una línea aparecía 5 s y se iba
solo; hay dos formas de moverse (girar desde arriba, caminar adentro) y nada lo decía; no se notaba que › es el
recorrido.
**Hecho (`visor.html`, propuesta de 5 pasos aceptada por el usuario):**
1. Al cargar, sobre la escena: un punto que se desliza (el gesto) y "Arrastrá para girar · Pellizcá para acercar" (con
   mouse: rueda). Se va al arrastrar o usar la rueda, no por tiempo.
2. Después, la flecha › late con un globo "Tocá › para entrar al departamento" (que no se sale de la pantalla).
3. En la primera vista de adentro: "Arrastrá para mirar · Tocá el piso para caminar hasta ahí" (con mouse: doble clic o
   WASD). Se va con cualquier gesto sobre la escena.
4. Se guarda en el navegador (`localStorage` "recorrelo3d-guia"): quien vuelve no ve nada. `?ayuda` la muestra igual.
   Si se entra por un link a una vista de adentro, arranca en el paso 3.
5. Botón "?" en la píldora: tarjeta "Cómo recorrer" (desde arriba, adentro, vistas, de noche), con los gestos táctiles o
   de mouse según el equipo. Reemplaza al aviso que aparecía y se iba.
**Cómo se verificó:** los tres pasos y la tarjeta en la PC, y en 375 × 812 la píldora con "?" y el globo entran en
pantalla; con la guía vista, al recargar no aparece. Sitio rearmado.
**Ajuste 3 (2026-11-04, pedido del usuario):** faltaba enseñar el zoom. Paso propio "acercar" después de girar la
maqueta (o, si se entra directo a una vista de adentro, después de mirar alrededor): en celular dos dedos que se separan,
"Pellizcá con dos dedos para acercar · Separalos para acercar y juntalos para alejar"; en la PC la rueda del mouse,
"Usá la rueda para acercar · Hacia adelante acerca y hacia atrás aleja". Se va al pellizcar (dos dedos que cambian más
de 30 px de distancia) o usar la rueda; si la persona ya acercó por su cuenta, se saltea. Además, `engine.js`: si se
toca la pantalla durante el vuelo hacia una vista desde arriba, el fov igual termina en el de la vista (antes se
quedaba en el de ese instante, que viniendo de una vista de adentro con el zoom más abierto era muy amplio).
**Ajuste 2 (2026-11-04, pedido del usuario):** la guía ya no se recuerda en el navegador: aparece cada vez que se abre
el recorrido, sin `?ayuda` (cada paso se va con el gesto, así que a quien ya sabe le dura un instante).
**Ajuste (2026-11-04, pedido del usuario):** faltaba enseñar a moverse. El paso 3 queda solo para mirar ("Arrastrá para mirar
alrededor") y se agregó un paso 4 de caminar: en celular un toque animado sobre el piso, "Tocá el piso para caminar", que
se va recién cuando la cámara de verdad se movió (un toque en una pared no cuenta); en la PC las teclas W A S D dibujadas
que se van presionando, "Caminá con W A S D" (o flechas, doble clic), que se va con esas teclas o el doble clic. Si la
persona ya camina en el paso 3, el 4 se saltea. Probado en PC (W cierra la guía) y en 375 × 812 (con la cámara movida a
mano: los toques simulados no caminan porque setPointerCapture rechaza un dedo falso).
**Falta:** que el usuario lo pruebe en el celular. Aparte quedó propuesto un "▶ Recorrer" automático por las vistas.

## T-43 · Vistas de adentro con el zoom más abierto

**Por qué (usuario, 2026-11-04):** que cada vista arranque con el menor zoom posible, para que se vea lo más posible.
**Hecho:** `start(…, { wideViews: true })` (solo lo pide `visor.html`): las vistas de adentro arrancan con el fov en el
máximo que permite la rueda o el pellizco (`FOV_MAX` = 100, antes del ajuste a la proporción de la foto, que conserva la
diagonal). Las vistas sin foto se ajustan como una vertical de celular (0,75) para no quedar en ojo de pez en pantallas
apaisadas. Las vistas desde arriba no cambian (ya encuadran el depto entero). comparar, verificar, video y exportar
siguen con el fov de cada vista (tienen que calzar con la foto).
**Cómo se verificó:** `motor/pruebas/abierto.html` → `capturas/abierto/` (PC 640 × 360 y celular 300 × 650, antes y
después) en living1, cocina1, bano1 y dormitorio4; `verificar.html` de los cinco sin cambios. Sitio rearmado.
**Ojo:** con más campo asoman en los bordes cosas cercanas (marco del divisor, de la puerta del baño) y lo de las orillas
se estira un poco, como en un gran angular.

## T-44 · Dirección más simple para el depto 5

**Por qué (usuario, 2026-11-04):** la dirección `/palermo-chico-q7q3/` le parecía rara; por ahora queda
**https://recorrelo3d.pages.dev/departamento-prueba/**.
**Hecho:** `publicar.json` → `depto5: departamento-prueba` y `"redirecciones": { "palermo-chico-q7q3": "departamento-prueba" }`.
`publicar.mjs` arma `sitio/_redirects` (Cloudflare Pages) con 302 de la carpeta vieja a la nueva, así el QR ya impreso
sigue funcionando (302 para que el navegador no lo recuerde si el nombre vuelve a cambiar). Regenerados con la dirección
nueva: `entregas/depto5/` (qr.png, links.json, portada.jpg; index.html y tarjeta.html con `kit.mjs`) y en
`presentacion/` qr-demo.png y portada-demo.jpg (los dos QR leídos con jsQR: llevan a /departamento-prueba/).
**Falta:** subir `sitio/` y probar en el celular la dirección nueva y que el QR viejo redirija. Los otros cuatro deptos
siguen con id + 4 letras.

## T-45 · Dos modos: Vista general y Recorrido

**Por qué (usuario, 2026-11-05):** la primera persona contactada (una administradora) dijo que lo veía "difícil de
maniobrar para gente +40" y pidió "estabilizar la altura en el recorrido": probablemente nunca salió de la vista
general. El usuario pidió dejar solo dos vistas con un selector y que la guía explique mejor cómo entrar.
**Hecho (`visor.html`):** la píldora pasa a ser [Vista general | Recorrido] · luna · "?". "Vista general" es la primera
vista "cut" del scene; "Recorrido" arranca en la primera vista de adentro con foto (o en la del link, si se entra con
`?vista=`/#). Se quitaron ‹ ›, el nombre de la vista y la lista desplegable. El paso de la guía que señalaba › ahora
señala "Recorrido": "Tocá «Recorrido» para entrar al departamento" (con mouse: "Hacé clic en…"). La tarjeta "?" explica
los dos modos. Sin vista desde arriba o sin vista de adentro, el selector no aparece. Las demás vistas del scene siguen
existiendo para videos, portada, links y herramientas. Copia del visor anterior en `capturas/quitado-visor-barras/visor-22-vistas.html`.
**Cómo se verificó:** en la PC la secuencia girar → rueda → globo sobre "Recorrido" → clic → "Arrastrá para mirar
alrededor" en living1 → "Vista general" vuelve a #general; en 375 × 812 la píldora y el globo entran en pantalla.
**Falta:** subir `sitio/`. Pendiente aparte (propuesto): limitar la cámara de la vista general (inclinación, zoom y
desplazamiento) y el botón "▶ Recorrer" automático.

## T-46 · Vista general del celular más cerca y centrada

**Por qué (usuario, 2026-11-05):** en el celular la vista general arrancaba muy lejos.
**Hecho (`engine.js`, `fitAerial`, solo pantallas verticales):** el encuadre usa las esquinas reales del departamento
(más 20 cm de pared) y de cada balcón, en lugar de una sola caja que los abarcaba y dejaba una esquina vacía; antes de
alejar la cámara centra el departamento de costado (cámara y punto de mira se corren juntos) y el margen es 3 % a los
costados y 10 % arriba y abajo. `go()` toma de `fitAerial` la posición y el punto de mira. En el depto 5: de 30,3 a
26,5 m. Las vistas de adentro y las pantallas apaisadas no cambian.
**Cómo se verificó:** captura en 375 × 812; `verificar.html` de los cinco: cambian solo las vistas generales de depto1
(7,1 %) y depto5 (11,3 %), revisadas lado a lado (`capturas/movil-pc/verif-aereas.jpg`), y se actualizó la línea base.

## T-47 · Landing como portada del sitio

**Por qué (usuario, 2026-11-05):** hizo una landing (React + Vite, `Desktop/LANDING_PAGE_RECORRELO3D`) y pidió sumarla al
sitio "solo si es seguro". El depto 5 es de un conocido suyo (le recomendé pedirle el OK por escrito para las fotos).
**Hecho:** `publicar.json` → `"landing": "../LANDING_PAGE_RECORRELO3D/dist"`. `publicar.mjs` copia a la raíz de `sitio/` su
index.html, sus .js/.css y solo las imágenes que el código nombra (13 de 32: no se publican las de San Nicolás, el plano
del depto 1 ni las fotos sin usar). Buscadores: la landing se indexa (robots.txt `Allow: /`, sin nombrar carpetas, porque
es público); cada recorrido lleva `X-Robots-Tag: noindex` por `_headers` (no se publica) y `<meta name="robots"
content="noindex">` en su página. Sin "landing" vuelve la portada neutra. `serve.mjs` acepta `ROOT=sitio` (y abre el
index.html de cada carpeta) para probar el sitio como en Cloudflare: configuración `sitio` en `.claude/launch.json`
(puerto 5183). La landing se recompiló con `npm run build` (salió igual que la anterior).
**Cómo se verificó:** en http://localhost:5183/ la landing carga todas sus imágenes sin errores; /departamento-prueba/
abre el recorrido con los dos modos y noindex. Sitio: 43 archivos, 6,2 MB.
**Ojo:** la landing incrusta el recorrido con la dirección absoluta `https://recorrelo3d.pages.dev/departamento-prueba/`;
con dominio propio conviene cambiarla por `/departamento-prueba/`. Muestra el WhatsApp y el Gmail personales del usuario.
**Falta:** subir `sitio/`.

## T-48 · Landing adaptada al celular y corregida

**Pedido (usuario, 2026-11-05):** analizar la landing, adaptarla al celular y corregir todos los errores.
**Hecho (en `Desktop/LANDING_PAGE_RECORRELO3D`; App.tsx anterior en `capturas/landing-antes/`):**
- Celular: las fotos del arco dejan scrollear con el dedo (`touch-action: pan-y` y sin arrastre táctil; antes atrapaban
  el dedo); el recorrido incrustado se activa con "Tocá para recorrer acá" (más "Abrir en pantalla completa") para no
  atrapar el scroll; "imán" entre secciones solo desde 768 px; las secciones ya no se fuerzan a una pantalla en el
  celular; la barra falsa del navegador no se desborda; botones de contacto del mismo ancho y pie centrado; textos
  según el equipo ("Deslizá hacia abajo…" / "Scrolleá… rueda").
- Contenido: la portada y "Cómo es el proceso" usaban renders del depto 1 (otro anuncio) mezclados con fotos del depto 5:
  ahora son renders del depto 5 (`public/assets/3d-*.jpg`, recortes de `capturas/depto5/imagenes/`). Textos que
  prometían exactitud pasan a "a partir de lo que muestran tus fotos", "medidas aproximadas", "fiel a tus fotos".
  Texto del demo actualizado a los dos modos. "Email" → "mail". Sin salto forzado en el subtítulo.
- Técnico: el recorrido se incrusta con `/departamento-prueba/` (relativo: sirve con dominio propio) y la barra muestra
  la dirección real; ícono propio `favicon.svg` (antes el QR, con tipo equivocado); vista previa para WhatsApp y redes
  (`og:*`, imagen `assets/og.jpg` 1200 × 630 con la dirección completa: cambiarla si cambia el dominio);
  `theme-color`; fotos del arco con teclado (Enter/Espacio); animaciones de aparición una sola vez.
- `publicar.mjs` copia también los archivos sueltos de la raíz de la landing (el ícono).
**Cómo se verificó:** `npm run build` sin errores; en http://localhost:5183/ (preview `sitio`) a 375 × 812: sin desborde
horizontal, `touch-action` de las fotos `pan-y`, capa del demo y su activación, Contacto; en PC: sin capa, imán activo,
sin errores de carga. El sitio publica 14 archivos de la landing (ninguno del depto 1).
**Ajuste (2026-11-05, usuario):** en el celular (menos de 768 px) la portada va sin las fotos giratorias (solo texto y
botones; título de 29–32 px para que entre en dos líneas), las tarjetas de problema/solución son más compactas y el demo
no se incrusta: imagen del living con el botón "Abrir el recorrido 3D" que lleva a `/departamento-prueba/`. La PC queda
igual (rueda de fotos y recorrido incrustado; en tablets táctiles se activa con un toque). Versión previa en
`capturas/landing-antes/App-con-fotos-en-celular.tsx`.
**Ajuste 2 (2026-11-05, usuario, con captura del iPhone):** cada sección ocupa una pantalla también en el celular
(`min-h-[calc(100svh-64px)]`, la altura con la barra del navegador visible) y se ajustaron márgenes, títulos, fotos y
tarjetas solo en el celular para que ninguna pase de una pantalla (a 375 × 812 las ocho miden 748 px). El "imán" entre
secciones vuelve a estar activo en el celular.
**Ajuste 3 (2026-11-05, usuario):** "Consultar" no llevaba abajo: el desplazamiento suave con el imán entre secciones
se frena en Safari del iPhone. Los links internos (#…) ahora los maneja App.tsx: apaga el imán durante el salto, va con
`scrollTo` suave, al quedarse quieta corrige la posición con un salto instantáneo si quedó corrida y vuelve a prender el
imán. Probado en PC y 375 × 812: Consultar, Ver demo y Proceso terminan con la sección justo debajo de la barra.
**Falta:** subir `sitio/`; probarlo en un celular real.

## T-49 · Nombre del depto 5: "Departamento demo"

**Pedido (usuario, 2026-11-05):** cambiar el nombre anterior del depto 5 por "Departamento demo" en todos los archivos.
**Hecho:** 22 reemplazos en 16 archivos de texto (scene.json, links.json, plano.svg, guía y textos de capturas, y la copia del
proyecto en `LANDING_PAGE_RECORRELO3D/informacionDelProyecto/`); regenerados `dist/depto5`, el kit (`entregas/depto5/`
index.html y tarjeta.html), `sitio/` y el artifact privado (versión 4). Verificado: ningún archivo de texto conserva el
nombre viejo y el recorrido muestra "Departamento demo".
**Falta:** los videos (`entregas/depto5/recorrido*.mp4`) tienen el nombre escrito en la imagen: regenerarlos con
`motor/video.html` (horizontal y `&formato=vertical`, con sus livianos). El "about" ya no menciona el barrio (2026-11-05).

## T-50 · Pantalla de carga de la landing

**Pedido (usuario, 2026-11-05):** usar el componente MorphingSquare como loader y que la página se arme completa antes
de mostrarse ("si no, funciona trabada").
**Hecho (`Desktop/LANDING_PAGE_RECORRELO3D`):** el proyecto ya tenía estructura shadcn (`components/ui`, `@/lib/utils`),
Tailwind 4 y TypeScript; `motion` ya estaba y se instaló `class-variance-authority` (pedido explícito, sin
vulnerabilidades). `components/ui/morphing-square.tsx` tal cual; el ejemplo va en `morphing-square-demo.tsx` (ya existía
un `demo.tsx` de la barra). `components/ui/page-loader.tsx` envuelve a App en `src/main.tsx`: la página se arma tapada
y el loader ("Cargando…", cuadrado verde #2f5d50) se va con un fundido cuando cargaron la página, las tipografías y las
imágenes no diferidas (las de la portada), más dos cuadros para que se acomode; mínimo 0,6 s, tope 10 s; bloquea el
scroll mientras tanto y llama a `ScrollTrigger.refresh()`. En `index.html`, una copia en CSS del mismo cuadrado
(`#boot-loader`) se ve mientras se descarga el código y React la reemplaza.
**Cómo se verificó:** `npm run build` sin errores; en el preview `sitio` el loader aparece, la página se arma debajo, el
scroll queda bloqueado y al final el loader desaparece y se libera el scroll (con el panel oculto, por el tope de 10 s:
ahí no corren los cuadros).
**Falta:** subir `sitio/`; mirarlo en el iPhone.

## T-51 · Rueda de la portada con escenas nuevas (fotos de Pexels) y piezas nuevas del motor

**Pedido (usuario, 2026-11-05):** no repetir tanto el depto demo en la rueda de fotos, sin vistas generales; renderizar
tres fotos de Pexels (loft con vigas de hormigón, living con araña de cristal, living con sillón en L y patio)
"bien hermosas" y usar algunas del depto demo y el living de Bariloche.
**Hecho:**
- Motor (generales): vigas y pilares aceptan "color" y "finish": "concrete" (textura de hormigón nueva, `M.concrete`);
  mesa de comedor "shape": "plank" (tablón de madera sobre caballetes de hierro en A); componente nuevo `chandelier`
  (araña de caireles: placa cromada y miles de cuentas como instancias, cromadas y algunas que brillan de noche; "day").
  Las cuentas llevan `noTouch`: el control de piezas sueltas las comparaba de a pares y colgaba la página.
- Escenas nuevas en `muestras/` (fuera de `departamentos/`, no entran en la verificación): `loft`, `lobby`, `patio`, con
  las fotos en `muestras/pexels-png/` y una vista "foto" ajustada contra cada foto con comparar.html (hojas en
  `capturas/muestras*/`). La pared amarilla del patio es un `wall-tiles` liso de una sola placa.
- Rueda (App.tsx, solo PC): 12 imágenes distintas: del demo (living en 3D, foto real del living, cama de noche, cocina),
  las tres escenas de día y de noche y el living de Bariloche de día y de noche (`public/assets/rueda-*.jpg`, renders
  apaisados 1600 × 988 reducidos a 1200; el lobby mirando un poco hacia arriba para que entre la araña).
- Renders del depto 4 regenerados con exportar.html (`entregas/depto4/`, 26 imágenes; uso interno).
**Cómo se verificó:** verificar.html de los cinco sin cambios (depto 4 con sus dos avisos de siempre, máx. 0,3 %);
catalogo.mjs actualizado; en el preview `sitio` la rueda tiene 12 imágenes únicas y ninguna rota.
**Ajuste (2026-11-05, usuario):** se sumaron fotos reales y modos noche: la rueda pasa a 19 imágenes en grupos foto real →
render de día → render de noche: las tres fotos de Pexels (`rueda-foto-*.jpg`, recortes apaisados), tres fotos del
demo (living, dormitorio, cocina) y renders de noche nuevos del demo con el motor actual (`rueda-demo-*-noche.jpg`; los
de `capturas/depto5/imagenes` eran de un motor viejo y se veían de día). Scroll por tarjeta 0,09 → 0,06 para que la
portada no se alargue. Preview `sitio`: 19 imágenes únicas, ninguna rota.
**Falta:** subir `sitio/`. Ojo: Bariloche es un anuncio ajeno (solo render, sin nombre ni ubicación).

## T-52 · Limpieza del proyecto y sin videos (hecho, 2026-11-07)

**Pedido del usuario:** "lo de los videos no será necesario: borrarlo y olvidarlo"; hacer las eliminaciones propuestas.
**Qué se hizo:** git local (sin remoto) con el estado previo como primer commit. Se borraron los videos de todas las
entregas, `motor/video.html` y toda mención en kit.mjs, exportar, plano, visor, engine, serve y SKILL.md (la entrega es
recorrido 3D + tarjeta con QR). Fuera: `prototipo-detalle/`, `motor/lamina.html`, entregas de los deptos 1, 2, 4 y San
Nicolás, capturas `t*`, `analisis-*` y `quitado-*`, los cuatro `prompt-*.md` y `ESTADO-2026-11-07.md` (reemplazados por
`LEEME.md`). Fotos reordenadas en `fotos/<id>/` (PNG de las vistas) y `fotos/<id>/original/`; rutas actualizadas en los
scene, comparar.html, convertir-avif.mjs y SKILL.md. launch.json sin las configuraciones viejas. Todo recuperable desde git.
**Falta:** borrar `LANDING_PAGE_RECORRELO3D/informacionDelProyecto/` (340 MB, copia vieja): el permiso automático no dejó
borrar fuera de la carpeta del proyecto; lo hace el usuario o lo autoriza.

## T-53 · Entorno urbano más chico y de más calidad (hecho, 2026-11-07)

**Pedido del usuario:** "el ambiente generado puede parecer medio barato; generar un entorno más chico pero de mayor calidad".
**Qué se hizo (components.js, `cityAround` rehecho):** la cuadra de enfrente y los vecinos de la propia cuadra (±36 m)
tienen relieve: marcos de ventana que sobresalen 10 cm (el vidrio parece hundido), carpinterías, vidrio con reflejo de
cielo e interior en penumbra (de noche, 30 % encendidas), persianas a distinta altura, balconcitos con baranda de hierro,
balcones corridos con vidrio, molduras, cornisa, parapeto, azotea con baldosas, tanques y planta baja con locales y
toldos. Tres tipos de fachada (clásica, moderna, ladrillo). Veredas de baldosas con cordón, asfalto con textura,
árboles de vereda con copa de hojas (tarjetas con transparencia, instanciadas) y sombra suave al pie, faroles con charco
de luz de noche. Más allá de ±36 m, cajas con fachada pintada; al fondo, una silueta de ciudad en la bruma (antes había
torres y manzanas enteras de cajas lisas). Los vecinos cercanos quedan al menos dos pisos por debajo del departamento.
Pisos de abajo del propio edificio: la misma baranda que el balcón del depto y puertaventanas con vidrio (antes,
antepechos macizos y paneles azules). Ventanas, balcones y hojas instanciados: por cuadro, las llamadas de dibujo
quedaron iguales o menores (living1 579 → 471) y los triángulos +15 %.
**Cómo se verificó:** `motor/pruebas/entorno.html` (hojas en `capturas/entorno/`: antes, despues, despues2, despues3);
verificar.html del depto 5 (cambian general 8,6 %, balcón 6,2 %, planta 7,5 %; el resto < 1,5 %), línea base
actualizada; sin avisos. Los otros deptos con ciudad también cambian (no se verificaron, por pedido del usuario).

## T-54 · Pulido con la cámara quieta (hecho, 2026-11-07)

**Qué se hizo (engine.js):** al detenerse la cámara el visor suma 24 cuadros (12 en celular), cada uno con la cámara
corrida una fracción de píxel y el sol corrido dentro de un disco de ~0,7°: bordes sin dientes, ruido de la oclusión
promediado y sombras con penumbra suave. Se ve en ~0,3 s y se descarta al moverse (mientras se camina no cambia nada;
al arrancar a moverse vuelve el cuadro simple, diferencia sutil). `frame()`/`capture()` devuelven el cuadro pulido
(exportar, portada y verificación salen mejor); `start(…, { refine: false })` lo apaga. Barandas sin mipmaps para que
no desaparezcan de lejos.
**Cómo se verificó:** `capturas/entorno/sin-pulido.jpg` vs `con-pulido.jpg` y `recorte.jpg`; verificar.html por cuadro.
**Falta:** probarlo en el celular real; siguientes mejoras propuestas: reflejos de metales y espejos con el propio
departamento (captura del ambiente), luz rebotada por ambiente (sondas), brillo suave de las lámparas de noche,
texturas reales (descarga: pedir permiso) y limitar la cámara de la vista general + "▶ Recorrer".
**Ajuste (2026-11-07, usuario: la luz de las farolas "muy bruta y potente"):** el charco de luz es ahora una caída
gaussiana sin borde, a menos de la mitad de intensidad (0,55 → 0,28), pegado a cada superficie (vereda, cordón,
calzada) en vez de un disco que flotaba a la altura de la vereda, y los faroles de una y otra vereda van alternados para
que los charcos no se pisen. La sombra al pie de los árboles también era un disco de borde duro (alphaMap leía una
textura con transparencia): ahora es un degradé suave. Hoja: `capturas/entorno/faroles-final.jpg` (día | noche).
verificar.html del depto 5: sin cambios (0,2 %).
**Ajuste (2026-11-07, usuario: "ciertos bugs en los árboles, de noche y de día"):** tres causas. (1) Cuadrados oscuros
en las copas: la pasada de normales de la oclusión ambiental (GTAOPass, en la PC) dibuja todo con un material propio
que ignora la transparencia, y cada tarjeta de hojas contaba como un cuadrado entero; ahora las piezas con alphaTest
(hojas, barandas de barrotes, silueta lejana) se ocultan solo en esa pasada (engine.js). (2) Manchas celestes con forma
de hoja sobre las fachadas: las copas (radio ~3 m) se metían en balcones y paredes, y las hojas atrapadas detrás de las
barandas de vidrio se veían así; ahora el tronco va a 60 cm del cordón y la copa se achata del lado de la fachada (poda
de vereda, `CLEAR` 1,15 m). (3) Hojas de canto que reflejaban el entorno: material mate (Lambert), además más liviano.
Hojas: `capturas/entorno/arboles.jpg` (antes del arreglo de copas), `arboles3.jpg` (después). verificar.html del depto 5:
solo cambia la Planta (3 %, copas más angostas); línea base actualizada.
**Ajuste (2026-11-07, usuario: los árboles "quedaron muy chatos"):** en lugar de achatar la copa hacia la fachada, los
árboles miden 7 a 9,5 m y la copa (redonda, 10 % más ancha a lo largo de la calle) se corre 80 cm hacia la calzada con
el tronco apenas inclinado hacia ese lado; solo se angosta hacia la fachada lo que haga falta (`REACH` 1,95 m desde su
centro, k entre 0,68 y 0,93). Ningún árbol queda a menos de 2,2 m de un farol. Hoja: `capturas/entorno/arboles4.jpg`.
verificar.html del depto 5: solo la Planta (2,2 %); línea base actualizada.

## T-55 · Luz rebotada horneada y reflejos reales (espera aprobación del usuario, 2026-11-07)

**Qué se hizo:** (1) `motor/hornear.html?id=<depto>`: en una grilla cada 50 cm (y ~80 cm en altura) dentro del
departamento renderiza un cubo de 16 px con toda la luz prendida y lo guarda como armónicos esféricos de orden 1, de
día y de noche, en `departamentos/<id>/gi.json` (Float16 en base64; depto 5: 1.280 puntos, 80 KB, 13 s). Los puntos
dentro de paredes o muebles se rellenan con sus vecinos. El scene lo usa con `"lighting": { "bake": "gi.json" }`
(`"bounce"` regula cuánto suma; por defecto 0,6). El motor lo carga en tres texturas 3D y cada material lo suma a su luz
indirecta según posición y normal; con horneado, la luz hemisférica baja a la mitad (sumado encima todo quedaba lavado:
`capturas/rebote/f1.jpg`). Hay que volver a hornear si cambian distribución, muebles o luz. empaquetar.mjs copia el
gi.json; serve.mjs acepta guardarlo. (2) Reflejos reales: cada metal o espejo de adentro tiene una copia del material
por ambiente y refleja una foto de su ambiente (desde el centro, a 1,4 m, de día y de noche) tomada en la precarga
(`ready`); verificar.html y exportar.html esperan `api.ready`. (3) De paso: la comprobación de sintaxis tiene que ser
`node --input-type=module --check < archivo` (`node --check` no detectó un salto de línea dentro de un texto).
**Cómo se verificó:** `motor/pruebas/rebote.html` → `capturas/rebote/antes-despues.jpg` (motor anterior vs nuevo, día y
noche): de noche el techo deja de verse marrón y oscuro y la luz se reparte; de día paredes y techo toman algo del tono
del piso. verificar.html del depto 5: todas las vistas de adentro cambian 6–10 % (es el tono de la luz); **línea base sin
actualizar** y `sitio/` sin rearmar hasta que el usuario lo apruebe.

## T-56 · Pie del inodoro y bidet, espejos sin reflejo y florero nuevo (hecho, 2026-11-07)

**Pedido del usuario:** "arreglar estas luces debajo del inodoro y bidet, sacá el reflejo del espejo porque se ve mal y
no aporta, mejoremos cómo se ve el florero".
**Qué se hizo:** (1) Inodoro y bidet: el perfil del torno arrancaba con la base cerrada y la normal de la esquina se
promediaba con la del fondo (hacia el piso): los primeros 6 cm de loza se veían negros. El perfil ahora empieza en el
borde de abajo. (2) Espejos (`M.mirror`, todos): sin reflejo; plateado claro con un degradé suave, mate al entorno.
(3) `tabletop-decor` "dried-flowers" rehecho según la foto `adicional2`: vidrio cónico más ancho arriba con un dedo de
agua, 8 tallos curvos en abanico con ramitas laterales, cabezuelas bordó grandes (cúpulas de ~5 cm de florcitas),
ramilletes de pimpollos crema en pedicelos y hojitas verdes; todo lo chico unido en una malla por material (el depto 5
pasó de 289 a 260 mallas).
**Cómo se verificó:** `capturas/rebote/florero-bano.jpg` y `florero2.jpg` (de día y de noche, de cerca); verificar.html
del depto 5 sin avisos ni piezas sueltas (la línea base sigue esperando la aprobación de T-55).
