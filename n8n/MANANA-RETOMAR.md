# Retomar mañana — Resumen de estado

**Fecha última sesión:** 2026-04-21

## Estado actual (cerrado esta noche)

### Workflows en n8n Cloud
- ✅ `taller-libra-bus` — **Activo** (Ping bus: online)
- ✅ `agente-marketing` — importado, no activado
- ✅ `agente-whatsapp` — importado, no activado
- ✅ `agente-leads-sheets` — importado, **DEPRECAR** (reemplazado por Supabase)

### Repositorio
- ✅ Tabla `leads` agregada a `supabase-schema-v2.sql`
- ✅ Workflow nuevo: `n8n/workflows/agente-leads-supabase.json` (reemplaza Sheets)

---

## Camino más corto para mañana (20 min total)

### Paso 1 — Actualizar Supabase (2 min)
1. Abrir [SQL Editor de Supabase](https://supabase.com/dashboard/project/zcballhidbpsatqjnbuw/sql/new)
2. Pegar el contenido completo de `libra-fleet/supabase-schema-v2.sql`
3. Click **Run**
4. Ya tenés la tabla `leads` creada

### Paso 2 — Cargar la anon key en n8n (5 min)

**Dónde obtener la anon key:**
- Supabase Dashboard → Settings → API → copiar **"anon public"** (empieza con `eyJhbGciOi...`)

**Dónde pegarla en n8n:**
- n8n Cloud → Settings → Variables → **+ Add**
- Nombre: `SUPABASE_ANON_KEY`
- Valor: (la key)
- Save

> ⚠️ Si tu plan de n8n Cloud **NO** tiene Variables (plan free), hardcodeá la key
> directamente en el workflow (en los headers `apikey` y `Authorization`).
> Reemplazá `{{$env.SUPABASE_ANON_KEY}}` por el valor real.

### Paso 3 — Importar workflow Supabase (3 min)
1. En n8n, **+ Nuevo flujo de trabajo** → Importar desde URL
2. Pegar:
   ```
   https://raw.githubusercontent.com/brunosuarez391-star/taller-libra/main/n8n/workflows/agente-leads-supabase.json
   ```
3. **Save**
4. **Activar** (toggle arriba a la derecha)

### Paso 4 — Deprecar el viejo (1 min)
- En n8n, abrí el workflow viejo `agente-leads-sheets` (el de Google Sheets)
- **Desactivar** o borrar — ya no se usa

### Paso 5 — Probar (5 min)
En la app (`libra-fleet`) → `/cerebro` → botón **"🧪 Test"** en la card "Agente Leads"

Si todo funciona:
- Supabase Dashboard → Table Editor → `leads` → deberías ver una fila nueva

### Paso 6 (opcional) — WhatsApp admin
Si querés además recibir notificación por WhatsApp al admin cada vez que entra un lead:
- Configurar credenciales Meta (guía: `n8n/setup/credentials.md` sección 1)
- Cargar en n8n: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `ADMIN_WHATSAPP=5492974773784`

Si no las cargás, el nodo de WhatsApp fallará silencioso pero el lead igual se guarda en Supabase.

---

## Trabajo pendiente después

- [ ] Meta credentials (requiere app en developers.facebook.com + templates aprobadas)
- [ ] Facebook Page Token permanente
- [ ] Instagram Business Account conectado
- [ ] Migrar localStorage → Supabase (botón en `/cerebro` si aparece banner)
- [ ] Probar los otros workflows (`agente-marketing`, `agente-whatsapp`)
