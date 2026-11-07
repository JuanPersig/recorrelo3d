# Recorrelo 3D · leer al empezar una sesión

Fotos de un departamento → `scene.json` → recorrido 3D en el navegador (Three.js). Público: anfitriones e
inmobiliarias. Cómo modelar un depto nuevo: `SKILL.md`. Historial de cambios: `TICKETS.md`. Todo lo visible, en español
rioplatense. Hay git local (sin remoto): commitear al cerrar cada tanda.

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `motor/` | `engine.js` (escena, luz, posproceso, cámara), `components.js` (catálogo de piezas), `validate.js`, `visor.html` y herramientas (`comparar`, `verificar`, `exportar`, `plano`, `colores`, `encuadre`, `telas`, `texturas`) |
| `departamentos/<id>/scene.json` | lo único que cambia por depto (depto1, depto2, depto4, sannicolas, depto5) |
| `fotos/<id>/` | PNG que usan las vistas; `fotos/<id>/original/` las originales. `fotos/depto3/` sin modelar |
| `muestras/` | escenas de la rueda de la landing (fotos de Pexels), fuera de la verificación |
| `capturas/` | hojas de comparación por depto, línea base de `verificar.html`, imágenes de la landing |
| `entregas/depto5/` | kit del dueño: `index.html` + `tarjeta.html` con QR (`node motor/kit.mjs depto5`) |
| `dist/`, `sitio/` | se regeneran (`empaquetar.mjs`, `publicar.mjs`); no van a git |
| `presentacion/carta.html` | carta del servicio con QR al recorrido de muestra |
| `comercial/` | planillas de administradoras de temporarios |

- **Landing** (React + Vite): `C:\Users\juanp\Desktop\LANDING_PAGE_RECORRELO3D`, `npm run build` ahí;
  `node motor/publicar.mjs` copia su `dist/` a la raíz de `sitio/`.
- **Sitio público:** https://recorrelo3d.pages.dev (Cloudflare Pages). El usuario sube `sitio/` entera. Carpetas fijas en
  `publicar.json`; `palermo-chico-q7q3` redirige a `departamento-prueba` por un QR impreso: no tocar.
- **Artifact privado del depto 5:** https://claude.ai/artifact/GvmujzWsuucQ8GepG3rekX (desde `dist/depto5/`).

## Servidores (`.claude/launch.json`)

`visor` :5180 (raíz del proyecto) · `sitio` :5183 (`sitio/` como Cloudflare) · `landing` :5184 (`npm run dev`).
Con el panel del navegador oculto no corre `requestAnimationFrame`: las herramientas usan temporizadores.

## Reglas del usuario

- Solo se pule el **depto 5 ("Departamento demo"**, sin barrio en nada público). Los cambios de motor son generales,
  pero se verifica **solo el depto 5**: `motor/verificar.html?deptos=depto5` (`&base=1` solo si el cambio es bueno).
- Entrega = recorrido 3D + tarjeta con QR. **Sin videos** (se quitaron el 2026-11-07), sin imágenes sueltas ni plano,
  sin fotos reales en las ventanas.
- Piezas sin caras compartidas ni flotando; 60 cm de circulación; `warnings` vacío. Nada que se prenda, apague o
  cambie de calidad a la vista mientras se camina.
- Preguntar antes de publicar/republicar, descargar o instalar dependencias.
- No editar con Get-Content/Set-Content de PowerShell (rompe acentos); scripts temporales en el scratchpad.
- Trabajar en tandas, sin frenar en cada ticket.

## Pendientes

1. Subir `sitio/` a Cloudflare (el usuario).
2. Calidad del render del visor y entorno por las ventanas (en curso, ver TICKETS).
3. Limitar la cámara de la vista general y botón "▶ Recorrer" (feedback de una administradora).
4. Sección "Cómo es el proceso" de la landing: elegir qué imagen va (propuesta: una por paso).
5. `og:image` para `/departamento-prueba/`; dominio propio (`recorrelo3d.com.ar`).
6. Probar en el iPhone del usuario (rendimiento real en celular, T-11).
7. Comercial: seguir la planilla; mail de contacto propio.
