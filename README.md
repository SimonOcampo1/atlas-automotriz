## Atlas Automotriz

Atlas Automotriz es una web interactiva para explorar marcas, logos y modelos de autos con datos y assets centralizados en un CDN (Supabase Storage).

### Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS + shadcn/ui
- Supabase Storage (assets públicos)

### Objetivos

- Explorar marcas y modelos con imágenes.
- Quizzes y navegación por categorías.
- Assets servidos por CDN para evitar límites de almacenamiento en Vercel.

## Configuración de assets (Supabase)

El proyecto carga TODO desde Supabase cuando `NEXT_PUBLIC_ASSET_MODE=cdn`.

Variables de entorno requeridas:

- `NEXT_PUBLIC_ASSET_MODE=cdn`
- `NEXT_PUBLIC_ASSET_BASE_URL=https://<PROJECT_REF>.supabase.co/storage/v1/object/public/assets`

En Supabase, el bucket público `assets` debe contener esta estructura:

```
/ultimatespecs_complete_db.jsonl
/ultimatespecs/...
/car-logos-dataset/...
/flags/...
```

## Desarrollo local

```bash
npm install
npm run dev
```

Si no usas CDN en local, puedes colocar assets en `public/` y usar:

```
NEXT_PUBLIC_ASSET_MODE=local
```

## Deploy

1) Configura las variables en Vercel.
2) Redeploy del proyecto.

## Scripts

- `npm run dev` — servidor local
- `npm run build` — build de producción
- `npm run lint` — lint

## Repo de assets

Se recomienda mantener un repositorio separado únicamente con los assets públicos (para libre acceso). La app consume esos assets desde el CDN configurado en `NEXT_PUBLIC_ASSET_BASE_URL`.
 