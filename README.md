# Muromío

Landing page de Muromío, estudio de interiorismo en León, Guanajuato, con
una sección "Render Lab" para renders de espacios con IA. Construido con
Next.js (App Router), TypeScript y Tailwind CSS, implementando el diseño
producido en Claude Design.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

- `src/app` — rutas y layout raíz (App Router)
- `src/components` — `Landing` orquesta el estado de idioma (ES/EN) y las
  animaciones de scroll (reveal, parallax, crossfade de proyecto
  destacado, galería con scroll horizontal); cada sección vive en su
  propio componente
- `src/lib/lang.ts` — helper de traducción ES/EN
- `public/images` — fotografías del proyecto Casa Serena y espacios
  comerciales usadas en el sitio

La parte de autenticación e integración con APIs de generación de renders
se está desarrollando por separado.
