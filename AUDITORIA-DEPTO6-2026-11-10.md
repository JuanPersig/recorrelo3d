# Auditoría de fidelidad del depto 6 (2026-11-10)

Prueba 1 acordada: comparar cada una de las 12 vistas con su foto y contar las diferencias por tipo, para saber dónde
está el error antes de seguir construyendo herramientas. Hojas usadas: `capturas/depto6/*.jpg` (render de día | foto).

## Cómo se hizo (y sus límites)

- Miré las 12 hojas, una por una, con la lista de control de SKILL.md: paredes, aberturas, muebles (si están, dónde, tamaño,
  color), cosas que faltan o sobran, materiales y luz. Cada diferencia lleva un tipo y una gravedad: **3** se nota a primera
  vista, **2** se nota comparando, **1** es un detalle.
- **Es una medición subjetiva**, hecha por una sola persona (yo) mirando imágenes. Sirve para ver proporciones, no para
  decir que una cifra exacta es correcta. Con las cámaras desalineadas no puedo asegurar la posición fina de los muebles,
  así que no cuento «mueble corrido»: solo diferencias que se ven aunque la cámara no calce.
- La estructura sale del control contra el plano (`INFORME-NOCTURNO-2026-11-10.md`), no de las fotos.

## Resultado

**66 diferencias** en 12 vistas, con un peso total de 128 puntos (suma de gravedades).

| Tipo | Diferencias | Peso | % del peso | Vistas afectadas |
|---|---|---|---|---|
| Color | 20 | 52 | 41 % | 10 |
| Encuadre de la cámara | 11 | 21 | 16 % | 11 |
| Material o acabado | 9 | 20 | 16 % | 6 |
| Objeto que falta | 7 | 10 | 8 % | 5 |
| Detalle decorativo | 10 | 10 | 8 % | 10 |
| Forma o proporción de un objeto | 5 | 9 | 7 % | 4 |
| Luz o exposición | 2 | 4 | 3 % | 2 |
| Objeto que sobra | 1 | 1 | 1 % | 1 |
| Aberturas (puertas y ventanas) | 1 | 1 | 1 % | 1 |
| Estructura (paredes, pilares) | 0 | 0 | 0 % | 0 |

**Lo que muestra:**

1. **Color y material son el 56 % del error.** Estructura, 0 %; aberturas, 1 %. Es coherente con el control
   contra el plano: las paredes y los vanos del depto 6 están bien.
2. **El 55 % del peso está en solo 12 problemas sistemáticos**, o sea el mismo defecto repetido en varias vistas. No son
   66 errores sueltos: arreglando una docena de cosas se corrige más de la mitad.
3. **El encuadre de la cámara pesa un 16 %** y aparece en 11 de 12 vistas. Es el único tipo que no se puede arreglar con
   parámetros del modelo (ver la prueba A).
4. Objetos que faltan, detalles decorativos y formas pesan poco (7–8 % cada uno), y casi todos son menores.

## Los problemas sistemáticos (lo que conviene arreglar primero)

«Causa probable» es una hipótesis mía a partir de lo que se ve; no la verifiqué en el código; los valores del `scene.json` que cito (colores, `gloss`, `topStyle`, `wallColor`, `baseboard`) sí los leí.

| # | Problema | Vistas | Peso | Qué se ve | Causa probable y dónde se arregla |
|---|---|---|---|---|---|
| 1 | piso del living | 5 | 15 | Piso naranja y mate; en las fotos es marrón rojizo y brillante. | Parámetros del piso del `scene.json` (`color` `#b5582c`, `gloss` 0,3). Se ajusta con una muestra de color tomada de la foto y más brillo. |
| 2 | cortinas | 4 | 11 | Cortinas durazno (y amarillas muy saturadas en el dormitorio); en las fotos son crema y pálidas. | Es el efecto «cortinas a contraluz» (T-68, `curtainLight`): con el sol cálido de este depto la tela blanca se tiñe de durazno. Bajar `lighting.curtainLight` en el depto 6 o enfriar el color de la tela. En el dormitorio, el color de la tela. |
| 3 | piso de la cocina | 3 | 9 | Piso casi blanco; en las fotos es gris con juntas oscuras. | El color del `scene.json` ya es gris (`#b9bab6`) pero el render lo aclara: probable exceso de luz rebotada o de exposición en la cocina. Medir con una muestra de la foto y oscurecer. |
| 4 | mesada de acero | 2 | 6 | Mesada blanca; en las fotos es acero inoxidable. | El `scene.json` ya pide `topStyle: steel`; el material de acero sale claro y mate. Revisar el material «acero cepillado» del motor (más oscuro y con reflejo). |
| 5 | lavatorio | 2 | 5 | Pileta cuadrada tipo bloque; en las fotos es oval con pie. | Forma del componente `vanity` con estilo `pedestal`: no se parece a una pileta con pie. Hay que rediseñar esa variante en el catálogo (cambio de motor, general). |
| 6 | ventana | 2 | 4 | Por la ventana se ve una silueta gris y una grilla; en las fotos, cielo claro. | La malla de la baranda y el cielo detrás del vidrio salen apagados. Revisar el material de la malla y la luz del exterior visto desde adentro (cambio de motor). |
| 7 | azulejos de la cocina | 2 | 4 | Azulejos lisos y beige; en las fotos tienen relieve de puntos y motivos. | Ya estaba anotado como pendiente (azulejos decorados). Hace falta una textura de azulejo con relieve y motivos (motor). |
| 8 | pared de la cocina | 2 | 4 | Paredes crema cálido; en las fotos son blancas. | `wallColor` global `#f0e9dd`. Es el mismo pendiente que el color de pared por ambiente (LEEME, «Motor» n.º 2). |
| 9 | puerta del lavadero | 2 | 4 | Puerta bordó con marco rojo; en las fotos es marrón oscuro metálico con marco de acero gris. | Color de la puerta y del marco en el `scene.json` (`material`/`color` de la abertura). |
| 10 | azulejos del baño | 2 | 4 | Azulejos grandes y crema; en las fotos son blancos y chicos, con juntas manchadas. | Tamaño y color del revestimiento del baño en el `scene.json` (`wall-tiles`): se arregla con parámetros. |
| 11 | pared del dormitorio | 1 | 3 | Pared beige grisáceo; en la foto es rosada. | Es el pendiente conocido: un solo `wallColor` para todo el depto. Hay que hacer el color de pared por ambiente (motor, general). |
| 12 | zócalo único | 1 | 2 | Zócalo de madera naranja en la cocina; en las fotos es cerámico gris. | Hay un solo color de zócalo para todo el depto (`baseboard`). Hay que poder elegirlo por ambiente (motor, general). |

**Se arreglan con parámetros del `scene.json` (sin tocar el motor):** piso del living, cortinas, piso de la cocina, puerta del
lavadero, azulejos del baño y, probablemente, la mesada. **Piden un cambio general del motor:** color de pared y de zócalo por
ambiente, pileta con pie, textura de azulejo con relieve y motivos, y la vista exterior por la ventana.

## Detalle por vista

### Living hacia el balcón

| Gravedad | Tipo | Diferencia |
|---|---|---|
| 3 | Color | cortinas durazno en el render, crema en la foto |
| 3 | Color | piso naranja y mate en el render, marrón rojizo y brillante en la foto |
| 2 | Objeto que falta | mesa ratona de madera oscura en primer plano (puede ser la mesita del escritorio mal ubicada) |
| 2 | Luz o exposición | por la ventana se ve una silueta gris plana en lugar del cielo claro |
| 2 | Encuadre de la cámara | encuadre más cerrado que la foto |
| 1 | Detalle decorativo | peluche, canasto y objetos sobre las mesas; imagen de la tele |

### Sillón y biblioteca

| Gravedad | Tipo | Diferencia |
|---|---|---|
| 3 | Color | piso naranja y mate contra marrón rojizo brillante |
| 2 | Encuadre de la cámara | la cámara queda más lejos de la biblioteca y el pasillo se ve más largo |
| 1 | Detalle decorativo | menos objetos en la biblioteca, sin peluche |

### Tele y biblioteca

| Gravedad | Tipo | Diferencia |
|---|---|---|
| 3 | Color | piso naranja y mate contra marrón rojizo brillante |
| 1 | Forma o proporción de un objeto | banqueta de madera con respaldo en la foto, asiento rojo redondo en el render |
| 1 | Objeto que sobra | lámpara redonda de techo que la foto no muestra (ahí hay un riel de spots) |
| 1 | Detalle decorativo | imagen de la tele, cables, abrigo colgado |
| 1 | Encuadre de la cámara | encuadre parecido |

### Comedor y ventanal

| Gravedad | Tipo | Diferencia |
|---|---|---|
| 3 | Color | cortinas durazno, crema en la foto |
| 3 | Color | piso naranja y mate contra marrón rojizo brillante |
| 2 | Luz o exposición | la malla de la baranda se ve como una grilla y el exterior sale gris, no celeste |
| 2 | Encuadre de la cámara | foto más abierta (se ve más pared a los lados) |
| 1 | Detalle decorativo | aire acondicionado más chico |

### Tele y comedor

| Gravedad | Tipo | Diferencia |
|---|---|---|
| 3 | Color | cortinas durazno, crema en la foto |
| 3 | Color | piso naranja y mate contra marrón rojizo brillante |
| 2 | Encuadre de la cámara | encuadre distinto |
| 1 | Forma o proporción de un objeto | el mueble de la tele tiene un puf negro en vez de las consolas |
| 1 | Detalle decorativo | peluche, cables, imagen de la tele |

### Dormitorio

| Gravedad | Tipo | Diferencia |
|---|---|---|
| 3 | Color | paredes rosadas en la foto, beige grisáceo en el render (pendiente conocido: color de pared por ambiente) |
| 2 | Color | cortina amarilla más saturada y con trama visible; en la foto son dos paños pálidos con luz entre medio |
| 2 | Material o acabado | cobertor liso y claro en el render, taupe oscuro y arrugado en la foto |
| 2 | Encuadre de la cámara | la cama queda al centro en el render y abajo a la derecha en la foto |
| 1 | Detalle decorativo | gato negro sobre la cama |
| 1 | Objeto que falta | lámpara redonda de techo (puede quedar fuera del encuadre) |

### Cocina

| Gravedad | Tipo | Diferencia |
|---|---|---|
| 3 | Color | piso casi blanco en el render, gris con juntas oscuras en la foto |
| 3 | Material o acabado | mesada blanca en el render, de acero inoxidable en la foto |
| 3 | Encuadre de la cámara | la heladera cae un 14 % más a la derecha que en la foto |
| 2 | Color | zócalo de madera anaranjado en el render, cerámico gris en la foto |
| 2 | Material o acabado | azulejos lisos; en la foto tienen relieve de puntos y motivos de cocina |
| 2 | Color | heladera gris azulada y clara, acero oscuro en la foto |
| 2 | Color | paredes crema cálido en el render, blancas en la foto |
| 1 | Detalle decorativo | menos ollas, sin bolsa colgada ni tomacorriente |

### Cocina hacia el lavadero

| Gravedad | Tipo | Diferencia |
|---|---|---|
| 3 | Color | piso casi blanco, gris en la foto |
| 2 | Color | puerta bordó en el render, marrón oscuro metálico en la foto; marco rojo en el render, de acero gris en la foto |
| 2 | Color | paredes más cálidas que la foto |
| 1 | Objeto que falta | especiero de madera bajo el calefón y tubo de luz bajo la alacena |
| 1 | Detalle decorativo | portero eléctrico y tomacorriente |
| 1 | Encuadre de la cámara | encuadre parecido |

### Mesada

| Gravedad | Tipo | Diferencia |
|---|---|---|
| 3 | Material o acabado | mesada blanca en el render, acero inoxidable en la foto |
| 3 | Color | piso casi blanco, gris en la foto |
| 2 | Material o acabado | bacha negra en el render, de acero en la foto |
| 2 | Material o acabado | azulejos lisos, sin relieve ni motivos |
| 2 | Color | marco de la puerta rojo en el render, de acero gris en la foto |
| 2 | Objeto que falta | gabinete blanco sobre las alacenas de madera |
| 1 | Objeto que falta | tubo fluorescente bajo la alacena |
| 1 | Encuadre de la cámara | encuadre parecido |

### Baño

| Gravedad | Tipo | Diferencia |
|---|---|---|
| 3 | Encuadre de la cámara | vista muy distinta (toma desde arriba con gran angular) |
| 2 | Forma o proporción de un objeto | lavatorio con pie en la foto; en el render es otra forma |
| 2 | Material o acabado | azulejos blancos y chicos en la foto, crema y grandes en el render |
| 2 | Color | piso gris beige en la foto, crema en el render |
| 1 | Detalle decorativo | portarrollos y jabonera |

### Lavatorio

| Gravedad | Tipo | Diferencia |
|---|---|---|
| 3 | Forma o proporción de un objeto | pileta oval con pie en la foto, bloque cuadrado redondeado en el render |
| 2 | Forma o proporción de un objeto | botiquín con espejo en la foto, nicho en el render |
| 2 | Material o acabado | azulejos blancos con juntas manchadas, crema y lisos en el render |
| 2 | Encuadre de la cámara | encuadre distinto |
| 1 | Detalle decorativo | toalla de más, tomacorriente, tres llaves en la foto y dos en el render |

### Balcón

| Gravedad | Tipo | Diferencia |
|---|---|---|
| 2 | Objeto que falta | caja de la persiana enrollable sobre la ventana |
| 2 | Material o acabado | revoque rústico en paredes y techo; el render es liso |
| 1 | Objeto que falta | mesita con plantas al fondo |

### Aberturas (plano)

| Gravedad | Tipo | Diferencia |
|---|---|---|
| 1 | Aberturas (puertas y ventanas) | el pasaje entre las franjas mide ≈16 cm más que el vano del plano (sin foto que lo contradiga) |

## Qué bien está

Para no leerlo solo como una lista de defectos: distribución de los ambientes, paredes, aberturas, muebles contundentes
(sillón cama, biblioteca escalonada, mesa con mantel tropical y sillas, cama, mesa de luz, calefón, carrito de cocina,
cocina a gas con el wok verde, estante de especias con luz) y la mayoría de los objetos chicos se reconocen en las fotos.
El modelo del depto 6 es fiel en estructura; lo que lo separa de las fotos es sobre todo cómo se ven las superficies.

## Conclusión y qué recomiendo

1. **El error está en superficies, no en geometría.** Eso cambia la prioridad respecto del plan de precisión: más que medir
   planos o cámaras, rinde mejorar color, brillo y materiales.
2. **Arreglar los 12 problemas sistemáticos en este orden** (por peso): piso del living, cortinas, piso de la cocina,
   mesada de acero, pileta con pie, ventana. Los primeros cuatro valen un 32 % del peso total y la mayoría se hacen con
   parámetros del `scene.json`, con cada cambio verificado contra `verificar.html?deptos=depto5,depto6`.
3. **Para que el color deje de depender del ojo:** una herramienta que tome el color medio de una zona elegida de la foto
   (piso, cortina, mesada) sin necesitar que la cámara calce. Precisión de píxel no hace falta para superficies grandes.
4. **Los cambios de motor son generales y mejoran a todos los departamentos** (color de pared y zócalo por ambiente, pileta con
   pie, textura de azulejo): conviene hacerlos como tanda aparte, con el depto 5 como prueba de que no se rompe nada.
5. **La prueba 2** (un departamento nuevo, de punta a punta) sigue siendo la que confirma si este patrón se repite fuera del
   depto 6: si en el nuevo también domina color y material, se confirma que ahí está la inversión.
