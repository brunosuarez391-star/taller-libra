# Libra Fleet

Webapp React + Vite para gestión de flota y órdenes de trabajo de Libra Servicios Industriales.
Backend: Supabase. Integración con Google Drive para adjuntar fotos y PDFs a cada OT.
Funciona en desktop, navegador móvil (PWA) y como app Android vía Capacitor.

## Setup

```bash
npm install
cp .env.example .env   # completar variables
npm run dev
```

### Variables de entorno

Creá un archivo `.env` en la raíz de `libra-fleet/`:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
```

## Google Drive — configuración OAuth

Los adjuntos se guardan en Drive dentro de una carpeta `Libra Fleet/<OT-NUMERO>`.
Se usa el scope `drive.file` (la app solo ve archivos que ella misma creó).

### 1. Crear OAuth Client ID

1. Entrá a <https://console.cloud.google.com/apis/credentials>.
2. Habilitá **Google Drive API** en *APIs & Services → Library*.
3. *Credentials → Create Credentials → OAuth client ID → Web application*.
4. En **Authorized JavaScript origins** agregá:
   - `http://localhost:5173` (dev)
   - La URL de producción (ej.: `https://libra-fleet.vercel.app`)
   - Si usás Capacitor Android: `https://localhost` y el scheme que configures.
5. Copiá el Client ID a `VITE_GOOGLE_CLIENT_ID`.

### 2. Esquema Supabase

Aplicá la nueva tabla `archivos_ot` definida en `supabase-schema.sql`:

```sql
CREATE TABLE archivos_ot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ot_id UUID REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
  drive_file_id TEXT NOT NULL,
  nombre TEXT,
  mime_type TEXT,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## PWA (uso en celular vía navegador)

La app se instala en el celular desde Chrome/Safari: *Agregar a la pantalla de inicio*.

- Manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js` (se registra solo en builds de producción)
- Íconos: `public/icon-192.png`, `public/icon-512.png` — regenerables con `node ../scripts/gen-pwa-icons.js`

## App Android con Capacitor

El archivo `capacitor.config.json` ya está listo. Para generar el proyecto Android:

```bash
npm install -D @capacitor/core @capacitor/cli @capacitor/android
npm run build
npx cap add android
npx cap sync android
npx cap open android   # abre Android Studio
```

Luego, para builds posteriores:

```bash
npm run android        # build + sync + open
```

Requisitos: Android Studio + SDK instalados. La app corre en un WebView, por lo que toda la integración web (incluida la de Google Drive vía GIS) funciona sin cambios.

**Tip OAuth en Capacitor**: en la consola de Google Cloud agregá como origen autorizado `https://localhost` y verificá que `server.androidScheme` en `capacitor.config.json` sea `https`.

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Vite dev server en `:5173` |
| `npm run build` | Build de producción a `dist/` |
| `npm run preview` | Servir el build |
| `npm run lint` | ESLint |
| `npm run cap:sync` | Build + `cap sync` |
| `npm run android` | Build + sync + abrir en Android Studio |

## Estructura

```
src/
  components/
    DriveAttachments.jsx   # UI de adjuntos en Drive por OT
    EtiquetaService.jsx
    Layout.jsx
  lib/
    api.js                 # Helpers Supabase + bus n8n
    drive.js               # Cliente Google Drive (GIS + Drive v3)
    useDrive.js            # Hook React para auth
    supabase.js
    data.js
  pages/
    Dashboard.jsx
    Ordenes.jsx            # Lista de OTs + adjuntos Drive
    NuevaOT.jsx
    Vehiculos.jsx
    Presupuestos.jsx
    Facturacion.jsx
    VehiculoPublico.jsx
```
