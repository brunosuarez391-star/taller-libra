# Handoff a Claude para Chrome

Copiá TODO este documento y pegalo como primer mensaje cuando abras Claude para Chrome.

---

Hola Claude. Soy Bruno Suarez, dueño de **Libra Servicios Industriales** (taller mecánico de camiones, Comodoro Rivadavia, Argentina). Vengo de una sesión de Claude Code (terminal) que dejó todo el código listo pero que no puede clickear en mi browser. Necesito que vos sigas desde acá.

## El proyecto

- App: **Libra Fleet** (React + Supabase) — sistema de gestión de taller
- Repo: https://github.com/brunosuarez391-star/taller-libra
- Bus de eventos: **n8n Cloud** en https://brunosuerez.app.n8n.cloud
- Supabase project ID: `zcballhidbpsatqjnbuw`
- Branch actual de trabajo: `claude/resume-session-fix-error-Qcr4E`

## Estado al día de hoy

- ✅ 4 workflows importados en n8n Cloud
- ✅ `taller-libra-bus` activo (ping responde OK)
- ✅ Supabase con schema v1 + parcialmente v2 (falta correr SQL actualizado)
- ✅ Google OAuth2 conectado en n8n (pero cuenta con problema de permisos en la hoja)
- ❌ Credenciales Meta (WhatsApp / Facebook / Instagram) — NINGUNA cargada todavía
- ❌ `SUPABASE_ANON_KEY` no cargada en n8n

## Lo que necesito que hagas (en orden de prioridad)

### Tarea 1 — Correr el SQL v2 actualizado en Supabase (agrega tabla `leads`)

1. Abrir https://supabase.com/dashboard/project/zcballhidbpsatqjnbuw/sql/new
2. Pegar el contenido de `libra-fleet/supabase-schema-v2.sql` del repo
   (URL cruda: https://raw.githubusercontent.com/brunosuarez391-star/taller-libra/claude/resume-session-fix-error-Qcr4E/libra-fleet/supabase-schema-v2.sql)
3. Click "Run"

### Tarea 2 — Cargar Supabase anon key en n8n

1. En Supabase: Settings → API → copiar "anon public" (empieza con `eyJhbG...`)
2. En n8n Cloud: Settings → Variables → **+ Add**
   - Nombre: `SUPABASE_ANON_KEY`
   - Valor: (la key)
3. Save

Si el plan de n8n Cloud no tiene Variables (free plan), hardcodeala directamente en el workflow `agente-leads-supabase` reemplazando `{{$env.SUPABASE_ANON_KEY}}`.

### Tarea 3 — Importar y activar workflow Supabase

1. En n8n: + Nuevo flujo de trabajo → Importar desde URL
2. URL: `https://raw.githubusercontent.com/brunosuarez391-star/taller-libra/claude/resume-session-fix-error-Qcr4E/n8n/workflows/agente-leads-supabase.json`
3. Save
4. Activar (toggle arriba a la derecha)
5. Desactivar el workflow viejo `agente-leads-sheets` (ya no sirve)

### Tarea 4 — Configurar credenciales Meta (WhatsApp + Facebook + Instagram)

Guía completa en: https://github.com/brunosuarez391-star/taller-libra/blob/main/n8n/setup/credentials.md

Resumen:

**WhatsApp Cloud API:**
- Ir a developers.facebook.com → Mis Apps → Crear app tipo "Business"
- Agregar producto "WhatsApp" → "Configurar"
- Copiar Phone Number ID → cargar en n8n como `WHATSAPP_PHONE_ID`
- Generar token permanente (System User con permiso `whatsapp_business_messaging`) → cargar como `WHATSAPP_TOKEN`
- Crear 3 templates en WhatsApp Manager:
  - `ot_ingresada` (es_AR): "Hola {{1}}, tu unidad {{2}} ingresó al taller con OT {{3}}. Te avisamos cuando esté lista."
  - `ot_finalizada` (es_AR): "Hola {{1}}, tu unidad {{2}} ya está lista para retirar. OT {{3}}. Próximo service: {{4}} km."
  - `presupuesto_listo` (es_AR): "Hola {{1}}, tenemos tu presupuesto {{2}} por ${{3}}. Validez {{4}} días. ¿Avanzamos?"
- Submit los 3 templates para aprobación (tarda 24-48h)
- Además cargar: `ADMIN_WHATSAPP = 5492974773784`

**Facebook:**
- Misma app que WhatsApp + producto Facebook Login
- Graph API Explorer → permisos `pages_manage_posts`, `pages_read_engagement`
- Generar Page Access Token permanente
- Cargar en n8n: `FB_PAGE_ID`, `FB_PAGE_ACCESS_TOKEN`

**Instagram:**
- Cuenta IG debe ser Business/Creator conectada a la Fanpage
- GET `graph.facebook.com/v19.0/{FB_PAGE_ID}?fields=instagram_business_account&access_token={FB_PAGE_ACCESS_TOKEN}` → devuelve el business account ID
- Cargar en n8n: `IG_BUSINESS_ACCOUNT_ID`, `IG_ACCESS_TOKEN` (= FB_PAGE_ACCESS_TOKEN)

### Tarea 5 — Activar los workflows restantes

Una vez cargadas las credenciales Meta:
- `agente-marketing` → Save → Activar
- `agente-whatsapp` → Save → Activar

### Tarea 6 — Test end-to-end

En la app libra-fleet (deploy en Vercel, o `npm run dev` local), ir a `/cerebro` → probar los botones "🧪 Test" de cada agente. Deberían llegar notificaciones a WhatsApp y aparecer filas en la tabla `leads` de Supabase.

## Reglas importantes

1. **No hagas todo de una** — avanzá tarea por tarea, en cada paso confirmame qué hiciste antes de seguir.
2. **Pedí confirmación antes de clickear botones importantes** (Save, Submit, Activate, Delete).
3. **Para passwords y 2FA los escribo yo** — vos no los manejes.
4. **Para Meta templates**, cuando Meta pida descripción/justificación de uso, responde que son notificaciones transaccionales para clientes de un taller mecánico (OT = orden de trabajo).
5. Si te trabás o no sabés algo, preguntame — no inventes.
6. Cuando termines una tarea, dejame un resumen de qué se logró y qué quedó pendiente.

## Si necesitás más contexto del código

Repositorio: https://github.com/brunosuarez391-star/taller-libra
- `libra-fleet/` = app React (cliente)
- `n8n/` = workflows de n8n + guías en `setup/` y `SETUP-QUICKSTART.md`
- `libra-chapa/` = segunda app (taller de chapa y pintura) — no tocar hoy
- `managed-agent/` = agente Anthropic para tareas de código — no tocar hoy

Arrancá por **Tarea 1** y avisame cuando esté hecha.
