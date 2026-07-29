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

## Supabase

La autenticación y el espacio de trabajo usan Supabase SSR con sesiones en
cookies. Para configurarlo localmente:

1. Copia `.env.example` como `.env.local`.
2. Añade la URL y la clave pública del proyecto de Supabase.
3. Aplica, en orden, las migraciones de `supabase/migrations`.
4. Crea un usuario en Supabase Auth y abre `/login`.

La migración crea perfiles, proyectos, referencias y renders. Todas las tablas
tienen Row Level Security para limitar los datos al propietario del proyecto.
La clave `service_role` no es necesaria y nunca debe exponerse en variables
`NEXT_PUBLIC_*`.

## Generación de renders

El primer proveedor integrado es Stability AI mediante sus servicios Control
Sketch y Control Structure. Configura `STABILITY_API_KEY` únicamente como
variable privada del servidor. Los usuarios autenticados pueden abrir
`/panel/nuevo-render`, subir una imagen y registrar la generación dentro de su
proyecto de Supabase. Los archivos originales y resultados se guardan en el
bucket privado `render-assets`; el panel crea enlaces temporales para descargar
los resultados y permite generar una nueva variación desde el render más
reciente de cada proyecto.
