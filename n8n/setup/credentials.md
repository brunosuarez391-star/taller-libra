# Guía detallada de credenciales n8n

Para que los agentes funcionen hay que configurar credenciales en n8n Cloud.

URL del workspace: https://brunosuerez.app.n8n.cloud/home/workflows

---

## 1. WhatsApp Business Cloud API (Meta)

**Para qué:** enviar mensajes automáticos al cliente cuando ingresa una OT, cuando finaliza, y notificar leads al admin.

### Obtener credenciales
1. Ir a [developers.facebook.com](https://developers.facebook.com) → Mis Apps → Crear app
2. Tipo: **Business**
3. Agregar producto **WhatsApp** → "Configurar"
4. Copiar:
   - **Phone Number ID** (lo muestra la consola)
   - **Temporary access token** (dura 24hs) → hay que cambiarlo por uno **permanente** creando System User con permiso `whatsapp_business_messaging`

### Cargar en n8n
Settings → Variables → Add:
```
WHATSAPP_PHONE_ID = <Phone Number ID>
WHATSAPP_TOKEN    = <token permanente>
ADMIN_WHATSAPP    = 5492974773784
```

### Plantillas aprobadas
Meta obliga a usar plantillas pre-aprobadas para iniciar conversación. Crear en WhatsApp Manager:

| Nombre | Idioma | Contenido |
|---|---|---|
| `ot_ingresada` | es_AR | "Hola {{1}}, tu unidad {{2}} ingresó al taller con OT {{3}}. Te avisamos cuando esté lista." |
| `ot_finalizada` | es_AR | "Hola {{1}}, tu unidad {{2}} ya está lista para retirar. OT {{3}}. Próximo service: {{4}} km." |
| `presupuesto_listo` | es_AR | "Hola {{1}}, tenemos tu presupuesto {{2}} por ${{3}}. Validez {{4}} días. ¿Avanzamos?" |

---

## 2. Facebook Graph API (Fanpage)

**Para qué:** publicar posts con fotos en la Fanpage de Libra.

### Obtener credenciales
1. Misma app que WhatsApp
2. Agregar producto **Facebook Login**
3. Graph API Explorer → seleccionar tu Page → permisos `pages_manage_posts`, `pages_read_engagement`
4. Generar **Page Access Token permanente**:
   - Obtener User Access Token de larga duración (60 días)
   - GET `/me/accounts?access_token={user_token}` → te devuelve el Page Token permanente

### Cargar en n8n
```
FB_PAGE_ID           = <ID de tu Fanpage>
FB_PAGE_ACCESS_TOKEN = <Page Token permanente>
```

Para obtener el Page ID: ir a la Fanpage → Settings → Info de la página → está al pie.

---

## 3. Instagram Graph API

**Para qué:** publicar en Instagram Business.

### Requisitos previos
- Cuenta Instagram debe ser **Business** o **Creator**
- Debe estar **conectada a la Fanpage** de Facebook
- Tener acceso a través del mismo Page Token de arriba

### Obtener IG Business Account ID
```
GET https://graph.facebook.com/v19.0/{FB_PAGE_ID}?fields=instagram_business_account&access_token={FB_PAGE_ACCESS_TOKEN}
```

### Cargar en n8n
```
IG_BUSINESS_ACCOUNT_ID = <id devuelto arriba>
IG_ACCESS_TOKEN        = <mismo FB_PAGE_ACCESS_TOKEN>
```

### Importante
- Las fotos deben estar en **URL pública HTTPS** accesible desde internet
- **Google Drive no funciona** (los links de Drive son privados)
- Usar **Supabase Storage** bucket `fotos` con permiso público. URL típica:
  ```
  https://zcballhidbpsatqjnbuw.supabase.co/storage/v1/object/public/fotos/post-01.jpg
  ```

---

## 4. Google Sheets

**Para qué:** logs de leads, gastos, clientes, publicaciones.

### Setup
1. Crear 4 hojas en Drive:
   - "Libra — Leads"
   - "Libra — Gastos"
   - "Libra — Clientes"
   - "Libra — Publicaciones"
2. Copiar el ID de cada hoja de la URL (la parte entre `/d/` y `/edit`)
3. En n8n → Credentials → New → Google Sheets OAuth2 → seguir flow

### Cargar IDs en n8n
```
SHEET_LEADS_ID          = <id hoja leads>
SHEET_GASTOS_ID         = <id hoja gastos>
SHEET_CLIENTES_ID       = <id hoja clientes>
SHEET_PUBLICACIONES_ID  = <id hoja publicaciones>
```

### Estructura recomendada de columnas

**Leads:** `ts | nombre | telefono | fuente | mensaje | estado`

**Gastos:** `fecha | categoria | proveedor | concepto | monto | metodo_pago`

**Clientes:** `ts | nombre | cuit | telefono | email | contacto`

**Publicaciones:** `ts | plataformas | titulo | texto | url_fb | url_ig`

---

## 5. Gmail / SMTP

**Para qué:** enviar presupuestos y facturas por email.

Opción A — **Gmail OAuth2** (más simple si usás cuenta Google):
- n8n → Credentials → Gmail OAuth2 → login con `bruno@librapatagonia.com`

Opción B — **SMTP** (más estable):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=bruno@librapatagonia.com
SMTP_PASS=<App password de Google>
```
> Para generar App Password: myaccount.google.com → Security → 2-step verification → App passwords.

---

## 6. Supabase (opcional)

Solo si algún workflow necesita leer datos directamente de la DB (por ejemplo, generar PDF de presupuesto con items desde la tabla).

```
SUPABASE_URL      = https://zcballhidbpsatqjnbuw.supabase.co
SUPABASE_SERVICE  = <service_role key — NO el anon key>
```

> ⚠️ `service_role` bypasea RLS. No exponer en frontend, solo en n8n.

---

## Checklist final

- [ ] Webhook `taller-libra-bus` activo en n8n
- [ ] WhatsApp Cloud API con token permanente + 3 plantillas aprobadas
- [ ] Facebook Page Token permanente
- [ ] Instagram Business conectado a la Fanpage
- [ ] 4 Google Sheets creadas con credenciales OAuth2
- [ ] Gmail/SMTP configurado
- [ ] Bucket `fotos` en Supabase Storage con permiso público
- [ ] Variables de entorno cargadas en n8n
- [ ] Test: ping desde `/cerebro` devuelve `status: ok`
- [ ] Test: crear OT → llega WhatsApp al cliente
- [ ] Test: publicar desde Marketing → aparece en FB e IG
- [ ] Test: registrar gasto → aparece fila en Sheets
