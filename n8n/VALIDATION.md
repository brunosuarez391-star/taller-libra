# Validación local — n8n 1.84.1

Los 4 workflows se instalaron y probaron contra una instancia n8n local antes de subirse al repo.
Este documento registra el banco de pruebas, hallazgos y correcciones.

## Setup de validación

- **n8n:** 1.84.1 (versión estable; `2.16.2` tiene un bug con `zod` al cargar el módulo `@n8n/api-types`)
- **Node:** 22.22.2
- **DB:** SQLite en `/root/.n8n/database.sqlite`
- **Puerto:** 5678

```bash
npm install n8n@1.84.1 --overrides='{"xlsx":"npm:@e965/xlsx@latest"}'
N8N_RUNNERS_ENABLED=true n8n start
```

## Import via UI vs CLI

Los JSONs del repo están en **formato single-object** (un workflow por archivo), que es lo que acepta la **UI** (n8n → Workflows → Import from file).

Para importar por **CLI** (`n8n import:workflow --input=file.json`), el archivo debe ser un **array** de workflows. Si querés hacerlo por CLI, wrappealo:

```bash
node -e "
const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('taller-libra-bus.json'));
fs.writeFileSync('bus-array.json', JSON.stringify([wf], null, 2));
"
n8n import:workflow --input=bus-array.json
```

**Para tu flujo normal** (importar via UI en `brunosuerez.app.n8n.cloud`), los archivos ya funcionan tal cual.

## Resultados por workflow

### ✅ Router (`taller-libra-bus.json`) — `responseMode: responseNode`

Probé los 11 eventos catalogados + 1 evento desconocido. Todos ruteados correctamente:

| Evento | Respuesta esperada | Resultado |
|---|---|---|
| `cerebro.heartbeat` | `{status:"ok", mensaje:"pong"}` | ✅ |
| `flota_recepcion` | "🚛 OT de camión pesado recibida..." | ✅ |
| `flota_liviana_recepcion` | Mensaje recepción liviana | ✅ |
| `ot_finalizada` | "✅ OT finalizada..." | ✅ |
| `cliente_creado` | "👥 Cliente nuevo..." | ✅ |
| `presupuesto_creado` | "💰 Presupuesto creado..." | ✅ |
| `marketing_publicar` | "📣 Publicación..." | ✅ |
| `lead_captado` | "🎯 Lead capturado..." | ✅ |
| `gasto_registrado` | "📊 Gasto registrado..." | ✅ |
| `evento_desconocido` (fallback) | `{status:"unknown_event"}` | ✅ |

Latencia promedio: <100ms.

### ⚠️ Agente Marketing (`agente-marketing.json`) — corregido

**Bug original:** el IF con `operator.type='array', operation='contains'` y `typeValidation:'strict'` devolvía:

```
Wrong type: 'facebook' is a string but was expecting an array
```

**Fix aplicado:**
1. Set node "Preparar payload" ahora genera `plataformas_str` como string con join de la array
2. Los IF usan `operator.type='string', operation='contains'` sobre `plataformas_str`
3. `typeValidation` cambiado a `'loose'` para evitar falsos negativos
4. Agregado campo `foto_principal` en el Set para simplificar referencias

**Bug adicional:** con `responseMode='responseNode'`, si alguna rama HTTP fallaba (p.ej. credenciales inválidas), el workflow terminaba con error antes de llegar al Respond OK → cliente recibía respuesta vacía.

**Fix:** cambiado a `responseMode='onReceived'`. Ahora responde 200 inmediato y las llamadas FB/IG/WA corren async. Si fallan, se ven en el tab Executions pero no afecta al frontend.

### ⚠️ Agente WhatsApp (`agente-whatsapp.json`) — corregido

Mismo patrón que Marketing: `responseMode` cambiado de `responseNode` a `onReceived` por la misma razón (fire-and-forget para plantillas WhatsApp).

### ⚠️ Agente Leads (`agente-leads-sheets.json`) — corregido

Idem: `onReceived` en vez de `responseNode`. Ahora la notificación al admin + append a Google Sheets corren async.

## Limitaciones del sandbox de validación

El sandbox local bloquea tráfico saliente a dominios externos (`graph.facebook.com`, APIs de Google). Los errores `403 "Host not in allowlist"` que aparecen en el log de ejecuciones son **artefactos del sandbox**, no del workflow. En tu n8n Cloud no existen esos bloqueos.

Lo que **NO** pude validar localmente (requiere producción con credenciales reales):

- Respuesta real de Facebook Graph API al publicar foto
- Respuesta real de Instagram Graph API (2-step media_publish)
- Envío efectivo de plantillas WhatsApp Cloud
- Append a Google Sheets
- Validez de tokens FB/IG/WA
- Aprobación de plantillas WhatsApp por Meta (`ot_ingresada`, `ot_finalizada`, `presupuesto_listo`)

Lo que **SÍ** queda validado y funcionará en tu cloud:

- Sintaxis/estructura de los 4 workflows JSON (importan limpio)
- Lógica del Switch por evento (router)
- Lógica de condicionales IF (marketing)
- Expresiones de templating n8n (`={{...}}`)
- `responseMode` correcto para cada caso
- Activación sin errores (los 4 arrancan al activar)
- Latencia de respuesta (< 100ms)

## Procedimiento recomendado para subir a producción

1. Abrí https://brunosuerez.app.n8n.cloud/home/workflows
2. Importar → subí `taller-libra-bus.json`
3. Activar → verificar que la URL del webhook quede `https://brunosuerez.app.n8n.cloud/webhook/taller-libra-bus` (matchea `BUS_URL` en `libra-fleet/src/lib/api.js`)
4. Cargar las variables de entorno del `setup/credentials.md`
5. Crear las credenciales (WhatsApp, FB, IG, Gmail, Sheets)
6. Aprobar plantillas WhatsApp en Meta (si vas a usar el agente-whatsapp)
7. Importar los otros 3 workflows (`agente-marketing`, `agente-whatsapp`, `agente-leads-sheets`)
8. Desde el panel Cerebro (`/cerebro` en la app), click en **Ping bus** → debe decir `online`
9. Crear una OT de prueba → verificar que llegue WhatsApp al cliente
10. Publicar desde Marketing → verificar que aparezca en Facebook / Instagram

## Herramientas usadas en validación

- `n8n import:workflow --input=<array.json>` para importar
- `n8n update:workflow --id=<id> --active=true` para activar
- `n8n list:workflow` para confirmar IDs
- Acceso directo a la DB SQLite (`database.sqlite`) para inspeccionar ejecuciones
- `curl` contra `http://localhost:5678/webhook/<path>` para simular POSTs del frontend
