# n8n — Bus de Eventos Taller Libra

Configuración de workflows para el Cerebro y los agentes del sistema.

## Arquitectura

```
┌────────────────────────┐         POST         ┌────────────────────────┐
│  libra-fleet (React)   │ ───────────────────> │  Webhook único n8n     │
│  src/lib/api.js        │  /taller-libra-bus   │  taller-libra-bus      │
└────────────────────────┘                      └───────────┬────────────┘
                                                            │
                                                  Switch por $json.evento
                                                            │
        ┌───────────────┬────────────┬────────────┬─────────┼──────────┬──────────┬──────────┐
        ▼               ▼            ▼            ▼         ▼          ▼          ▼          ▼
  flota_recepcion  ot_finalizada  cliente_*  presupuesto  marketing  lead   gasto_*   heartbeat
        │               │            │            │         │          │          │          │
        ▼               ▼            ▼            ▼         ▼          ▼          ▼          ▼
    WhatsApp        WhatsApp     Sheets+Email  Email+WA   FB/IG API   WA Admin   Sheets    ok:true
    Sheets          Email PDF                             Sheets
```

## Un solo webhook, muchos eventos

Todos los sectores de la app disparan al mismo webhook:

```
https://brunosuerez.app.n8n.cloud/webhook/taller-libra-bus
```

El workflow router (`taller-libra-bus.json`) usa un **Switch** sobre `$json.evento` para rutear al handler correcto.

---

## Setup paso a paso

### 1. Importar el router

1. Abrir n8n Cloud → Workflows → Import from file
2. Subir `workflows/taller-libra-bus.json`
3. Activar el workflow (toggle arriba a la derecha)
4. Verificar que la URL del webhook coincida con `BUS_URL` en `libra-fleet/src/lib/api.js`

### 2. Configurar credenciales

| Credencial | Para qué | Cómo obtenerla |
|---|---|---|
| **WhatsApp Business Cloud API** | Recepción, finalización, leads | [developers.facebook.com/apps](https://developers.facebook.com/apps) → WhatsApp → Access token permanente |
| **Facebook Graph API** | Marketing (publicar en Page) | Mismo app → Page Access Token con `pages_manage_posts` |
| **Instagram Graph API** | Marketing (Instagram Business) | Mismo app → IG Business Account ID + token con `instagram_content_publish` |
| **Gmail** o **SMTP** | Emails a clientes | OAuth2 Gmail o SMTP de Google Workspace |
| **Google Sheets** | Logs CRM/gastos/leads | OAuth2 |
| **Supabase** (opcional) | Leer estado desde n8n | Service role key de tu proyecto |

### 3. Variables de entorno en n8n

Ir a **Settings → Environments** y cargar:

```
FB_PAGE_ID=<id de tu Fanpage>
FB_PAGE_ACCESS_TOKEN=<token permanente>
IG_BUSINESS_ACCOUNT_ID=<id cuenta Instagram Business>
IG_ACCESS_TOKEN=<mismo token FB con permisos IG>
WHATSAPP_PHONE_ID=<tu número ID Meta>
WHATSAPP_TOKEN=<token cloud api>
ADMIN_WHATSAPP=5492974773784
SHEET_LEADS_ID=<id hoja Google Sheets de leads>
SHEET_GASTOS_ID=<id hoja de gastos>
SHEET_CLIENTES_ID=<id hoja de clientes>
```

### 4. Probar cada evento

Desde el panel **Cerebro** (`/cerebro` en la app), click en **Ping bus** — debe aparecer `status: ok`.

Luego desde cada sector:
- **+ Nueva OT** → dispara `flota_recepcion` o `flota_liviana_recepcion`
- **OTs** → cambiar estado a Finalizado → dispara `ot_finalizada`
- **Clientes** → nuevo cliente → dispara `cliente_creado`
- **Presupuestos** → crear → dispara `presupuesto_creado`
- **Marketing** → Publicar ahora → dispara `marketing_publicar`
- **Marketing → Capturar lead** → dispara `lead_captado`
- **Finanzas** → Registrar gasto → dispara `gasto_registrado`

Cada evento aparece en el feed del panel Cerebro con status `ok` o `error`.

---

## Integraciones clave

### Publicar en Facebook (foto con texto)

```
POST https://graph.facebook.com/v19.0/{{$env.FB_PAGE_ID}}/photos
Body:
  url = {{$json.datos.fotos[0]}}
  message = {{$json.datos.titulo}}\n\n{{$json.datos.texto}}\n\n{{$json.datos.hashtags}}
  access_token = {{$env.FB_PAGE_ACCESS_TOKEN}}
```

### Publicar en Instagram (2 pasos)

```
1) POST /{{$env.IG_BUSINESS_ACCOUNT_ID}}/media
   image_url = {{$json.datos.fotos[0]}}
   caption   = {{$json.datos.texto}}\n\n{{$json.datos.hashtags}}
   access_token = {{$env.IG_ACCESS_TOKEN}}
   → devuelve creation_id

2) POST /{{$env.IG_BUSINESS_ACCOUNT_ID}}/media_publish
   creation_id = <id del paso 1>
   access_token = {{$env.IG_ACCESS_TOKEN}}
```

### WhatsApp al cliente (plantilla)

```
POST https://graph.facebook.com/v19.0/{{$env.WHATSAPP_PHONE_ID}}/messages
Headers: Authorization: Bearer {{$env.WHATSAPP_TOKEN}}
Body:
{
  "messaging_product": "whatsapp",
  "to": "{{$json.datos.telefono}}",
  "type": "template",
  "template": { "name": "ot_ingresada", "language": { "code": "es_AR" } }
}
```

---

## Troubleshooting

**El panel dice "Bus offline"** → El workflow no está activo o la URL no coincide. Revisá el toggle del workflow y comparalo con `BUS_URL` en `api.js`.

**Evento llega al bus pero no ejecuta el agente** → Revisá la condición del Switch. n8n es case-sensitive con el valor de `$json.evento`.

**Instagram no publica** → La foto debe estar en URL pública HTTPS accesible externamente. Drive no funciona. Usá Supabase Storage bucket `fotos` con permiso público.

**WhatsApp devuelve 400** → El número debe empezar con código país sin `+`. Ej: `5492974773784`. La plantilla debe estar aprobada por Meta.

---

## Archivos de este directorio

```
n8n/
├── README.md           ← este archivo
├── EVENTS.md           ← catálogo completo de eventos y payloads
├── workflows/
│   └── taller-libra-bus.json  ← workflow router importable
└── setup/
    └── credentials.md  ← guía detallada de credenciales
```
