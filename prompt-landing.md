# Prompt: pulir la landing (scroll trabado en PC, tarjetas que parpadean en celular)

Copiar desde la línea de abajo y pegarlo en una sesión nueva en `C:\Users\juanp\Desktop\3D`.

---

Vamos a corregir dos problemas de la landing de Recorrelo 3D (`C:\Users\juanp\Desktop\LANDING_PAGE_RECORRELO3D`, React +
Vite + framer-motion + GSAP + Tailwind). Leé primero `LEEME.md` (sección Landing y reglas) y la memoria.

**Problema 1 · PC:** apenas carga la página, el scroll se traba unos segundos y después sigue con microtirones.
**Problema 2 · celular:** las tarjetas de la sección "Las fotos ya no alcanzan" (Problema / Solución) cargan mal:
aparecen, desaparecen y vuelven a aparecer muy rápido, un efecto feo.

Pistas que dejé al revisar el código (verificarlas, no darlas por ciertas):
1. Tarjetas (`src/App.tsx`, ~línea 279, `problemCards.map`): cada `motion.div` anima opacity/y/scale con `whileInView`
   y además tiene la clase `transition-all duration-300` de Tailwind. Una transición CSS sobre las mismas propiedades
   que anima framer-motion pelea con cada cuadro y produce el parpadeo. Probable arreglo: `transition-shadow` (o
   `transition-[box-shadow]`) en lugar de `transition-all`. Buscar el mismo patrón en todas las secciones (hay muchos
   `whileInView` con `transition-all`) y corregirlo en todas.
2. Scroll trabado al cargar: el recorrido en vivo es un `iframe` (`src/App.tsx`, ~línea 375, `src={DEMO_PATH}`,
   `loading="lazy"`). Al ser del mismo origen comparte el hilo principal con la página: el motor 3D arma el depto,
   compila sombreadores y hace la precarga (desde el 2026-11-08 la precarga es completa, con la pantalla de carga encima)
   y eso traba el scroll. Opciones: montar el iframe recién cuando el usuario toca "Tocá para recorrer acá" (mostrar
   antes una imagen fija de portada del recorrido, liviana, en WebP), o montarlo cuando la sección está cerca y el
   navegador está libre (`requestIdleCallback`). Preferir la primera: ningún costo hasta que el visitante lo pide.
3. Revisar también: `window.scrollTo(... "smooth")` al cargar (~línea 163), `scroll-behavior: smooth` en `index.css`,
   animaciones de GSAP/`container-scroll-animation.tsx` que escuchen el scroll sin `passive`, y la rueda de
   `arc-card-carousel.tsx` (imágenes grandes sin `width/height` ni `decoding="async"`, que mueven la página al cargar).

Cómo trabajar:
- **Antes de tocar nada:** la landing no tiene git. Preguntarme si hacemos `git init` con un primer commit (o una copia
  de respaldo) antes de cambiar código. No instalar dependencias sin preguntar.
- Servidor de desarrollo: `landing` en `.claude/launch.json` (puerto 5184). Medir antes y después con el navegador
  integrado: en PC, un perfil de rendimiento de la carga (tareas largas del hilo principal) y el scroll; en celular,
  `resize_window` con el preset `mobile` y recargar, y mirar las tarjetas al scrollear (si el panel está oculto, pedir
  que lo muestre: sin él no corren las animaciones).
- Que nada se prenda, apague o cambie de calidad a la vista; respetar `prefers-reduced-motion`.
- Al terminar: `npm run build` en la landing, `node motor/publicar.mjs` en el proyecto 3D para rearmar `sitio/`, y
  avisarme para que suba `sitio/` a Cloudflare. Anotar en `TICKETS.md` (qué, cómo se verificó, qué falta) y commitear el
  proyecto 3D (el `git push` lo hago yo).
- Todo lo visible, en español rioplatense.
