# Prompt: departamento grande y cargado, con calidad premium

Copiar desde la línea de abajo y pegarlo en una sesión nueva en `C:\Users\juanp\Desktop\3D`, completando lo que está
entre `< >`.

---

Vamos a modelar un **departamento nuevo, más grande y con muchos más objetos** que el demo, para llevar el motor a un
nivel de calidad premium. El objetivo es doble: que este depto quede impecable (fiel a las fotos, muy detallado, con
luz cuidada de día y de noche) y, sobre todo, que **todo lo que haga falta mejorar se resuelva en el motor de forma
general**, para que el próximo depto salga igual de bien sin trabajo extra. El depto 5 ("Departamento demo") sigue
siendo la referencia que no se puede romper.

**Datos del depto nuevo**
- id: `<depto6>` · nombre visible: `<nombre, sin barrio ni dirección>`
- fotos: `<carpeta con las fotos>` (copiarlas a `fotos/<id>/original/` y las PNG a `fotos/<id>/`)
- anuncio / texto con medidas o ambientes (opcional): `<link o texto>`
- ¿es de un cliente con permiso o un anuncio ajeno?: `<permiso / ajeno>` (si es ajeno: solo renders, nunca sus fotos en
  algo público)

## Antes de tocar nada
1. Leé `LEEME.md` (estado, reglas, pendientes), `SKILL.md` (el proceso de fotos → scene.json), `motor/CATALOGO.md`
   (componentes y parámetros) y la memoria. El detalle histórico está en `TICKETS.md` (T-52 a T-59 son los últimos).
2. Levantá el servidor `visor` (`.claude/launch.json`, puerto 5180). El panel del navegador suele estar oculto: las
   herramientas ya usan temporizadores y esperan `api.ready`.

## Cómo trabajar (en tandas, sin frenar en cada paso)
1. **Inventario de fotos** (SKILL.md paso 1): ambiente de cada foto, desde dónde mira, qué muebles, aberturas y objetos
   se ven. En un depto cargado, listar también lo chico: libros, plantas, cuadros, almohadones, mantas, alfombras,
   lámparas, vajilla, adornos, cortinas, electrodomésticos. Lo que no se ve en ninguna foto va a `estimated`.
2. **Distribución**: plano con medidas razonables (un ambiente porteño no es chico; ≥ 60 cm de circulación). Si hay
   dudas de distribución, mostrame un plano 2D (`motor/plano.html`) antes de amueblar.
3. **Faltantes del catálogo**: antes de modelar, compará el inventario con `CATALOGO.md` y hacé una lista de piezas o
   variantes que faltan. Agregalas a `components.js` como componentes generales y paramétricos (con su ficha en
   `META`), con la misma calidad que el florero de la consola: formas con curvas reales (torno, tubos, bordes
   redondeados), piezas que se tocan sin caras compartidas ni nada flotando, todo lo chico unido por material
   (`meshBag()`), y probadas de cerca con `motor/pruebas/cerca.html`. Para floreros y ramos usar `bouquet()`/`vessel()`.
4. **scene.json** del depto nuevo: una vista por foto con `photo`, `about` para el huésped, lo decorativo con
   `"decor": true`. Cargado pero creíble: la densidad de objetos tiene que parecerse a las fotos.
5. **Comparar con las fotos** (`motor/comparar.html?scene=…&fotos=/fotos/<id>/&capturar=<id>`): encuadre, colores
   (`colores.html`), muebles en su lugar. Leé las hojas a tamaño real, no en miniatura.
6. **Luz**: con la distribución cerrada, hornear la luz rebotada (`motor/hornear.html?id=<id>`) y poner
   `"lighting": { "bake": "gi.json" }`. De día luz cálida suave; de noche, lámparas cálidas en cada ambiente que dejen
   leer todo (sin encandilar). Volver a hornear si cambian muebles o luces.
7. **Verificar**: `motor/verificar.html?deptos=depto5,<id>` sin avisos, sin piezas sueltas, el demo sin cambios
   (o cambios explicados). `&base=1` solo cuando el cambio es bueno. `node motor/catalogo.mjs` si cambió el catálogo.
8. **Rendimiento**: anotar el armado (ms), mallas, triángulos y dibujos por vista de verificar.html. Si el depto grande
   pasa de ~900 dibujos por cuadro o el armado supera ~6 s en la PC, optimizar en el motor (unir por material,
   instanciar lo repetido, texturas pre-generadas) antes de seguir. Tiene que andar fluido en un iPhone.
9. **Cerrar cada tanda**: anotar en `TICKETS.md` (qué, cómo se verificó, qué falta), actualizar `LEEME.md`, commitear
   (el `git push` lo hace el usuario) y mostrarme láminas de antes/después.

## Vara de calidad (lo que el usuario ya marcó)
- Fiel a las fotos y a favor del dueño, sin inventar lo que no existe.
- Nada de caras superpuestas ni piezas flotando: el usuario lo ve de cerca. Árboles, plantas y adornos sin cuadrados ni
  manchas (las piezas recortadas por transparencia no van a la oclusión ambiental).
- Nada que se prenda, apague o cambie de calidad a la vista mientras se camina.
- Espejos sin reflejo. Sin fotos reales por las ventanas: entorno generado.
- Luz de día cálida suave (no beige generalizado), noche cálida y legible.

## Reglas
- Cambios de motor generales; nada atado a un depto. Lo puntual de un depto va en su scene.json.
- Preguntar antes de publicar o republicar, descargar archivos o instalar dependencias. Las texturas escaneadas
  (ambientCG / Poly Haven) siguen esperando que el usuario apruebe la lista exacta.
- Todo lo visible, en español rioplatense. No editar con Get-Content/Set-Content de PowerShell; scripts temporales en el
  scratchpad. Comprobar sintaxis con `node --input-type=module --check < archivo`.
