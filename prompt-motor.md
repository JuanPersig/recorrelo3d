Respondeme en español (rioplatense). Antes de empezar, leé tu memoria (MEMORY.md y sus archivos), `TICKETS.md` (sobre todo la "Hoja de ruta para vender" y los tickets T-17 a T-32), `SKILL.md` y `motor/CATALOGO.md`.

## Qué quiero

Que resuelvas, uno detrás de otro y sin frenar a pedirme confirmación en cada uno, todos los tickets orientados a mejorar el motor. Todo tiene que servir para cualquier departamento y mejorar los resultados futuros del motor, no ser un ajuste para uno solo. San Nicolás es el caso de prueba más reciente, pero cada mejora se verifica en los cuatro departamentos (depto1, depto2, depto4 y sannicolas).

Fuera de alcance por ahora: hosting y publicación (T-17, la parte de hosting de T-12, T-32), vitrina y venta (T-30, T-31), kit y estudio de producción (T-18, T-19), registro de tiempos (T-29), la prueba en celular real (T-11) y la fidelidad puntual de un departamento (T-14).

## Orden

1. T-26 · Validador de piezas sueltas o flotando. Va primero porque protege todo lo que viene.
2. T-28 · Luz acogedora como estándar: llevar al motor lo que aprobé en San Nicolás. Dejá el antes y después de día y de noche de los cuatro deptos en una lámina y marcalo "espera aprobación del usuario", pero seguí con el resto.
3. T-21 · Mapa de identificación por foto y puntaje de parecido. Es la base de los siguientes.
4. T-20 · Vista real por la ventana tomada de las fotos.
5. T-22 · Colores medidos en las fotos.
6. T-23 · Texturas de imagen rectificadas: piso, azulejos, mesada y madera.
7. T-24 · Estampados de telas desde las fotos.
8. T-25 · Catálogo: piezas que faltan y más variedad. Cada pieza nueva pasa por T-26 y se revisa con capturas de cerca.
9. T-27 · Encuadre automático de las vistas.
10. T-10 · Entorno generado para las ventanas sin foto.
11. T-13 · Generalidad del motor: paredes en ángulo, ambientes en L, fachada a cualquier lado, escalera caminable.
12. T-09 · Generador del plano 2D desde el scene.json, con nombres, medidas y muebles en silueta.

## Cómo trabajar

- Al tomar un ticket marcalo "en curso" en TICKETS.md. Al terminarlo, marcalo "hecho" con la fecha, qué se hizo, cómo se verificó y qué quedó pendiente. Así otra sesión puede retomar donde quedaste.
- Antes de dar por hecho cualquier cambio de motor o componentes, corré `motor/verificar.html` y revisá lo que marque. La línea base se actualiza (`&base=1`) solo después de mirar que el cambio es bueno.
- Para fidelidad, compará con `motor/comparar.html?…&capturar=<carpeta>` y leé las hojas a tamaño real. Lo que cambie la imagen mostralo en láminas antes/después, en `capturas/<ticket>/`.
- Si un ticket es grande, dividilo en partes verificables y anotá cuáles quedaron.
- Si te acercás al límite de uso o el contexto se llena, dejá el ticket en curso anotado en TICKETS.md con el próximo paso concreto.
- Al final de la tanda, un resumen: qué tickets quedaron hechos, qué espera mi aprobación (como el aspecto de T-28) y qué quedó pendiente, con las láminas para mirar.

## Reglas de siempre

- Cambios generales, nada de parches para un departamento.
- `window.__viewer.warnings` vacío en los cuatro departamentos (el depto 4 tiene 2 avisos conocidos que esperan a T-09).
- Ninguna pieza comparte caras con otra, y ninguna queda suelta o flotando.
- Al menos 60 cm de circulación. Lo que es solo ambientación va con `"decor": true`.
- Nada que se prenda, apague o cambie de calidad a la vista mientras se camina.
- No edites archivos con Get-Content/Set-Content de PowerShell: rompe los acentos. Usá Edit/Write o scripts de node.
- Preguntame antes de publicar o republicar, y antes de descargar archivos o instalar dependencias.
- Todo lo visible para mí, en español.

## Datos prácticos del entorno

- Servidor de desarrollo: `visor` de `.claude/launch.json` (puerto 5180), con `preview_start`.
- Con el panel del navegador oculto no corre `requestAnimationFrame`. Para capturar:
  - usá `comparar.html` con `&capturar=`, o `__viewer.capture()`;
  - subí las imágenes pasando el data URL a bytes y haciendo POST a `/capturas/...`, porque `toBlob` y `<video>` pueden colgarse.
- ffmpeg está instalado. Sirve para armar láminas (`hstack`, `xstack`) y revisar videos.
- En los heredoc de Bash las barras invertidas pueden perderse. Para escribir regex en archivos usá Write o `String.fromCharCode(92)`.
- Los scripts temporales van en el scratchpad de la sesión, no en el proyecto.
