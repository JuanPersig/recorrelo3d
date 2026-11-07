Respondeme en español (rioplatense). Antes de empezar, leé tu memoria del proyecto (MEMORY.md y sus archivos): ahí están las decisiones tomadas, la estructura y las lecciones.

## Contexto

Estoy armando una skill de Claude que convierte las fotos de un departamento de Airbnb en un modelo 3D interactivo y navegable, para vendérselo a anfitriones e inmobiliarias. La idea es que el modelo juegue a favor del dueño: fiel a las fotos, pero luciendo lo mejor del lugar, sin inventar ambientes, ventanas ni metros.

Cómo está armado hoy (carpeta C:\Users\juanp\Desktop\3D):
- `motor/`: `engine.js` (motor Three.js: niveles, techo a dos aguas, reflejos de piso, recorrido en primera persona, calidad adaptativa, unión de geometría), `components.js` (biblioteca de componentes paramétricos y entornos de ciudad y lago), `visor.html` (la página que se publica), `comparar.html` (render y foto lado a lado; con `&capturar=<carpeta>` guarda hojas día|foto|noche en `capturas/`), `serve.mjs` (servidor local en :5180), `empaquetar.mjs` (arma `dist/<depto>/`) y `convertir-avif.mjs`.
- `departamentos/depto1|depto2|depto4/scene.json`: Claude escribe solo el scene.json y el motor lo dibuja.
- Fotos: `fotosDepartamento1-png/`, `fotosDepartamento2/`, `Departamento3/` (todavía sin modelar) y `Departamento4-png/`.
- Publicados: depto 1 https://claude.ai/artifact/Bn4bhHWN2WRZZLqPHx6N3p · depto 2 https://claude.ai/artifact/JS9nntozhhdEj29qxyM2rR (con un motor viejo) · depto 4 https://claude.ai/artifact/B2j9ZZaQXsxKKQXfQTG6x2

Ojo: todavía no existe un SKILL.md. Hasta ahora cada departamento lo armó Claude a mano en la conversación.

## Lo que te pido

Un análisis completo del estado actual y una propuesta de cómo seguir. En esta etapa NO cambies código ni republiques nada: solo analizá, medí y proponé.

1. **Recorré el proyecto**: leé el motor, los componentes, el visor y los tres scene.json. Abrí los departamentos en el panel del navegador (con `preview_start` de "visor") y generá las hojas de comparación con `comparar.html` para ver cómo quedó cada vista frente a su foto. Si el panel está oculto las capturas fallan: usá el modo `&capturar=` y leé las imágenes.
2. **Evaluá cada eje, con evidencia** (capturas, números, archivos y líneas):
   - Fidelidad a las fotos: encuadre, distribución, materiales, ropa de cama y objetos, por departamento.
   - Calidad visual de día y de noche, y si el modelo "luce" el lugar sin exagerar.
   - Navegación y experiencia: los dos modos (caminar adentro, girar en las vistas generales), celular, botones, ayudas y lo que confunde.
   - Rendimiento: fps reales con el panel visible, cantidad de dibujos y triángulos, tiempo de carga, peso de lo publicado y comportamiento en celular.
   - Arquitectura del motor: qué tan general es para departamentos nuevos, qué parches quedaron atados a un caso, deuda técnica y errores latentes.
   - El proceso de la skill: cuánto tarda y cuánto depende de iterar a mano pasar de las fotos al scene.json, qué falta para que sea repetible (SKILL.md, catálogo documentado de componentes, validaciones, checklist de comparación) y dónde falla más (la distribución de ambientes sin plano).
   - El producto para vender: cómo se entrega, se comparte y se hospeda; privacidad; qué esperaría un anfitrión, y qué falta para cobrarlo (por ejemplo, el paso de plano 2D para que el dueño confirme la distribución, video o imágenes para el anuncio, marca propia).
3. **Proponé cómo seguir**: una hoja de ruta priorizada por impacto y esfuerzo, con victorias rápidas, mejoras de fondo y riesgos. Para cada punto decí qué ganaría el dueño o el negocio y cómo se verificaría que quedó bien.

## Entrega

Un informe en español, claro y sin relleno: primero un resumen de una pantalla, después el detalle por eje y al final la hoja de ruta en una tabla. Mostrame las capturas que respalden lo importante. Al terminar, preguntame por dónde quiero empezar.

## Reglas de siempre (para cuando después pasemos a implementar)

- Los cambios de motor o componentes tienen que servir para cualquier departamento, no ser un parche de uno.
- `window.__viewer.warnings` vacío, nada de piezas que compartan caras y al menos 60 cm de circulación.
- Lo que sea solo ambientación va como "decor", para poder apagarlo con "Decoración extra".
- No editar archivos con Get-Content/Set-Content de PowerShell (rompe los acentos).
- Todo lo visible para mí, en español.
