# ⚡ Setup Quickstart — n8n Cloud en 30 minutos

Objetivo: pasar de "demo con eventos vacíos" a **agentes trabajando de verdad**.

Orden pensado para que cada paso desbloquee el siguiente.

---

## 0 · Antes de arrancar (5 min)

Abrí estas 4 pestañas, las vas a usar todo el rato:

1. n8n Cloud → https://brunosuerez.app.n8n.cloud/home/workflows
2. Meta for Developers → https://developers.facebook.com/apps
3. Supabase dashboard → https://supabase.com/dashboard/project/zcballhidbpsatqjnbuw
4. Panel Cerebro de la app → (tu URL de Vercel)/cerebro

---

## 1 · Subir los 4 workflows (3 min)

1. En n8n, botón **+ Add workflow** (arriba a la derecha)
2. Menú `⋮` (tres puntos al lado de Save) → **Import from File**
3. Subí `n8n/workflows/ALL-IN-ONE.json` del repo
4. Se crean los 4 workflows de una vez. **Activá cada uno** con el toggle arriba.
5. Verificá que la URL del webhook del router sea exactamente:
   `https://brunosuerez.app.n8n.cloud/webhook/taller-libra-bus`

### ✅ Test de humo

Abrí el panel Cerebro de la app → clic en **Ping bus**. Debe decir **online** y aparecer en el feed: `cerebro.heartbeat status: ok`.

> Si dice `offline`: el workflow no está activo o la URL no coincide con `BUS_URL` en `libra-fleet/src/lib/api.js`.

---

## 2 · Variables de entorno en n8n (5 min)

En n8n → **Settings → Variables** (o el menú de usuario → Variables). Crear estas, vacías por ahora, las vamos llenando:

```
FB_PAGE_ID
FB_PAGE_ACCESS_TOKEN
IG_BUSINESS_ACCOUNT_ID
IG_ACCESS_TOKEN
WHATSAPP_PHONE_ID
WHATSAPP_TOKEN
ADMIN_WHATSAPP=5492974773784
SHEET_LEADS_ID
```

Ya podés poner `ADMIN_WHATSAPP=5492974773784` (tu número).

---

## 3 · WhatsApp Cloud API (10 min)

Es lo **primero que hay que prender** porque los demás agentes dependen de WhatsApp.

1. https://developers.facebook.com/apps → **Create App** → tipo **Business**
2. Nombre: "Taller Libra Servicios" → Contact email: `bruno@librapatagonia.com`
3. **Add product → WhatsApp**
4. Meta te da un número de prueba (ej: `+1 555 XXXXXXX`). Te sirve para probar. Para producción después agregás el tuyo `+54 297 477 3784`
5. En la consola:
   - Copiá **Phone Number ID** → pegar en variable `WHATSAPP_PHONE_ID`
   - Copiá **Temporary access token** → pegar en `WHATSAPP_TOKEN` (dura 24hs, después hay que renovarlo o crear un System User)
6. **Agregá tu número como tester** (WhatsApp → API Setup → Add phone number)

### Crear plantillas aprobadas

WhatsApp obliga a plantillas para iniciar conversación. **Sin plantillas aprobadas, los mensajes NO salen.**

Ir a **WhatsApp Manager → Message Templates → Create Template**. Crear estas 3:

| Nombre (exacto) | Categoría | Idioma | Cuerpo |
|---|---|---|---|
| `ot_ingresada` | UTILITY | es_AR | Hola {{1}}, tu unidad {{2}} ingresó al taller con OT {{3}}. Te avisamos cuando esté lista. |
| `ot_finalizada` | UTILITY | es_AR | Hola {{1}}, tu unidad {{2}} (OT {{3}}) ya está lista para retirar. Próximo service: {{4}} km. |
| `presupuesto_listo` | UTILITY | es_AR | Hola {{1}}, tenemos tu presupuesto {{2}} por ${{3}}. Validez {{4}} días. ¿Avanzamos? |

La aprobación suele tardar **minutos** pero puede tardar **hasta 24hs**. Meta aprueba solo plantillas UTILITY sin spam.

### ✅ Test

Panel Cerebro → tarjeta **Agente Finalización** → clic **🧪 Test**. Si todo OK, te llega un WhatsApp al número `5492974773784`.

---

## 4 · Facebook Page + Instagram Business (8 min)

### Page Token permanente

1. Misma app que WhatsApp → **Add product → Facebook Login**
2. https://developers.facebook.com/tools/explorer → seleccionar tu app
3. **Get User Access Token** → permisos:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_content_publish`
   - `instagram_basic`
4. Copiar el token de usuario (60 días)
5. **Intercambio a Page Token permanente:**
   ```
   GET https://graph.facebook.com/v19.0/me/accounts?access_token={USER_TOKEN}
   ```
   Te devuelve las Pages que manejás. Copiar `access_token` de tu Fanpage → pegar en `FB_PAGE_ACCESS_TOKEN`. Copiar `id` de la Page → `FB_PAGE_ID`.

### Instagram Business ID

```
GET https://graph.facebook.com/v19.0/{FB_PAGE_ID}?fields=instagram_business_account&access_token={FB_PAGE_ACCESS_TOKEN}
```

Copiar el `instagram_business_account.id` → pegar en `IG_BUSINESS_ACCOUNT_ID`. En `IG_ACCESS_TOKEN` usá **el mismo** `FB_PAGE_ACCESS_TOKEN`.

### Fotos en Supabase Storage

1. https://supabase.com/dashboard/project/zcballhidbpsatqjnbuw/storage/buckets
2. Bucket `fotos` → **Policies** → poner **Public** (lectura pública)
3. Subir fotos → copiar URL pública tipo:
   `https://zcballhidbpsatqjnbuw.supabase.co/storage/v1/object/public/fotos/nombre.jpg`

> ⚠️ **No uses Google Drive.** No funciona como CDN para Instagram.

### ✅ Test

Panel Cerebro → tarjeta **Agente Marketing** → clic **🧪 Test**. Bus debe responder OK. Revisar en n8n → Executions si el POST a FB/IG salió. Si no hay credenciales aún, falla ahí pero el bus respondió OK.

---

## 5 · Google Sheets para Leads (4 min)

1. Crear nueva Google Sheet: "Libra — Leads" con columnas: `ts | nombre | telefono | fuente | mensaje | estado`
2. Copiar el ID de la URL (entre `/d/` y `/edit`) → pegar en `SHEET_LEADS_ID`
3. En n8n → **Credentials → Add → Google Sheets OAuth2** → login con `bruno@librapatagonia.com`
4. En el workflow **Agente Leads** → abrir nodo "Google Sheets — Append lead" → seleccionar la credencial creada

### ✅ Test

Panel Cerebro → tarjeta **Agente Leads** → clic **🧪 Test**. Debe aparecer fila en la Sheet Y llegarte WhatsApp con los datos del lead.

---

## 6 · Verificación final

Abrí el panel Cerebro de la app y disparás los 11 tests. Todos deben marcar **✅ Bus respondió OK**.

Después creás **una OT real** (Nueva OT → llenar datos → guardar) y verificás que:
- Llega WhatsApp al cliente con la plantilla `ot_ingresada`
- La OT aparece en la lista
- En Cerebro, el agente "Recepción Pesada" sube a **ACTIVO**

**Si todo esto anda: estás en producción.**

---

## 🆘 Si algo rompe

| Síntoma | Causa probable | Fix |
|---|---|---|
| Bus offline | Workflow desactivado o URL mal | Activar toggle + comparar URL con `BUS_URL` |
| WhatsApp devuelve 400 | Plantilla no aprobada o número mal | Esperar aprobación / verificar `5492974773784` sin `+` |
| Instagram no publica | Foto en Drive o Cuenta no-Business | Subir a Supabase Storage + pasar a Business |
| Sheets: "credential not found" | Falta conectar OAuth2 | Abrir el nodo en n8n y seleccionar credencial |
| Test button dice "Bus offline" | Workflow inactivo | Toggle en n8n |

Ver `n8n/VALIDATION.md` para más detalle.
