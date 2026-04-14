---
name: mapa-agentes-libra
description: Mapa completo del ecosistema de agentes n8n del Taller Libra — qué hace cada uno, qué eventos consume, qué webhooks expone y cuándo invocarlo
target_agents: ["Bus de Eventos — Coordinador Taller Libra"]
last_updated: 2026-04-14
language: es-AR
---

# Mapa de Agentes — Sistema IA Taller Libra

Este skill le da al **Bus de Eventos Coordinador** el conocimiento completo
del ecosistema para rutear eventos correctamente y tomar decisiones de
orquestación.

---

## 🧭 Diagrama general

```
                    ┌─────────────────────┐
                    │  Bus de Eventos     │  ← tú estás acá
                    │  (coordinador)      │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
    │  Taller   │        │   Flota   │        │  Infra    │
    │  (1-10)   │        │  Pesada   │        │ (monitor) │
    │           │        │  (F1-F4)  │        │           │
    └───────────┘        └───────────┘        └───────────┘
```

**Regla de oro**: si un evento no matchea una ruta conocida, derivarlo a
**Monitor de Errores** con `status: 'unknown_event'` en vez de fallar.

---

## 📋 Catálogo de agentes

### 🏪 Agentes del Taller (general)

#### `Agente 1 — Redes + Canva + Sheets + Gmail`
- **Workflow ID**: `TLTWJCVXjfTD4zDx`
- **Trigger**: Schedule Lunes 7 AM
- **Qué hace**: genera calendario de 6 posts de Instagram para la semana,
  crea diseños en Canva, registra en Sheets, envía link por Gmail
- **Webhook expuesto**: — (solo scheduled)
- **Skills útiles**: `brand-libra`, `instagram-best-practices`
- **Cuándo invocar**: automáticamente, no requiere rutear eventos

#### `Agente 2 — Presupuestos + Sheets + WhatsApp`
- **Workflow ID**: `ewQAaCHMUJNSnuzV`
- **Trigger**: Webhook
- **URL**: `https://brunosuerez.app.n8n.cloud/webhook/taller-libra-presupuesto`
- **Qué hace**: recibe datos de un presupuesto de chapa/mecánica, lo arma
  con Claude, guarda en Sheets "Finanzas" y envía por WhatsApp al cliente
- **Evento que lo dispara**: `presupuesto_solicitado`
- **Payload esperado**:
  ```json
  {
    "cliente": "nombre",
    "telefono": "54XXXXXX",
    "vehiculo": "modelo",
    "servicio": "descripción",
    "observaciones": "opcional"
  }
  ```
- **Skills útiles**: `precios-chapa-pintura`, `faq-taller-libra`

#### `Agente 3 — Stock + Sheets real`
- **Workflow ID**: `0XUXKBPpjRRpauYO`
- **Trigger**: Webhook
- **Qué hace**: lee stock desde Sheets, detecta críticos, genera alerta
  y orden de compra con Claude, avisa por WhatsApp al proveedor
- **Evento**: `stock_critico` o consulta manual
- **Skills útiles**: `catalogo-jones-srl`, `consumo-historico-taller`

#### `Agente 4 — WhatsApp Cloud API + Claude` ⭐
- **Workflow ID**: `n0ly83WBpvkSe1Zb`
- **Trigger**: Webhook (Meta WhatsApp Cloud API)
- **URL del webhook**: `https://brunosuerez.app.n8n.cloud/webhook/taller-libra-whatsapp`
- **Phone ID**: `1068974976297300`
- **Qué hace**: chatbot principal del taller. Responde consultas de clientes
  por WhatsApp con Claude
- **Skills útiles**: `faq-taller-libra` (CRÍTICO), `brand-libra`
- **Cuándo invocar**: automático desde cada mensaje entrante de Meta

#### `Agente 5 — Dashboard Ejecutivo + Gmail`
- **Workflow ID**: `wVUzZxAgqBb2SUhI`
- **Trigger**: Schedule Lunes 8 AM
- **Qué hace**: lee Turnos, Trabajos y Stock de Sheets, genera dashboard
  con Claude, guarda métricas en "Dashboard" y envía por Gmail
- **Skills útiles**: `kpi-definitions`, `narrativa-ejecutiva`

#### `Agente 6 — Gestión + Sheets + Calendar`
- **Workflow ID**: `iPVz4rrAWTxSLfEb`
- **Trigger**: Webhook
- **URL**: `https://brunosuerez.app.n8n.cloud/webhook/taller-libra-gestion`
- **Qué hace**: registra en Sheets (Clientes, Turnos, Trabajos) y crea
  evento en Google Calendar
- **Eventos que lo disparan**: `turno_confirmado`, `cliente_nuevo`,
  `pago_recibido`, `trabajo_terminado`
- **Skills útiles**: `reglas-agenda-libra`

#### `Agente 7 — RRHH Taller Libra`
- **Workflow ID**: `jTYXki5PeJ1SnOXC`
- **Trigger**: Schedule Viernes 5 PM + Webhook
- **URL**: `https://brunosuerez.app.n8n.cloud/webhook/taller-libra-rrhh`
- **Qué hace**: gestión de sueldos, asistencia, vacaciones, desempeño.
  Reporte semanal los viernes
- **Evento**: `consulta_rrhh`
- **Skills útiles**: `equipo-taller-libra`, `leyes-laborales-arg`

#### `Agente 8 — Marketing + Canva + Gmail + Sheets`
- **Workflow ID**: `RpwTodX8OeGKe5Cg`
- **Trigger**: Schedule Lunes 9 AM
- **Qué hace**: análisis Instagram + WhatsApp + gestor con Canva MCP para
  creatividades, reporte por Gmail, historial en Sheets
- **Skills útiles**: `brand-libra`, `competidores-locales`

#### `Agente 9 — CPN Libra Contable & Fiscal` ⭐
- **Workflow ID**: `1H8iWLRlW3uhEO7W`
- **Trigger**: Schedule Lunes 8:15 AM + Webhook
- **URL**: `https://brunosuerez.app.n8n.cloud/webhook/taller-libra-contable`
- **Qué hace**: agente contable/fiscal argentino. Responde consultas sobre
  IVA, Ganancias, IIBB Chubut, sueldos. Alertas de vencimientos los lunes
- **Evento**: `consulta_contable`
- **Skills útiles**: `vencimientos-afip-2026` (CRÍTICO), `facturacion-arg`

#### `Agente 10 — Instagram + Facebook`
- **Workflow ID**: `S96FE8cqiysrIbdK`
- **Trigger**: Schedule Lunes 7:15 AM
- **Qué hace**: publica en Instagram y Facebook usando Page Token de Meta
- **Page ID**: `61575432374242`
- **Skills útiles**: `brand-libra`, `graph-api-meta`

---

### 🚛 Agentes de Flota Pesada (F1-F4)

#### `F1 — Recepción Flota Pesada`
- **Workflow ID**: `qayz6TnguAvNBoHO`
- **Trigger**: Webhook
- **URL**: `https://brunosuerez.app.n8n.cloud/webhook/libra-fleet-recepcion`
- **Qué hace**: recibe unidades de flota pesada, crea OT digital, registra
  en Sheets y envía email con detalle
- **Evento**: `flota_recepcion`
- **Skills útiles**: `checklist-recepcion-camion`, `catalogo-jones-srl`

#### `F2 — Presupuestos Flota Pesada` ⭐
- **Workflow ID**: `GQLdqyXVswzquwoA`
- **Trigger**: Webhook
- **URL**: `https://brunosuerez.app.n8n.cloud/webhook/libra-fleet-presupuesto`
- **Qué hace**: genera presupuestos de flota pesada con precios Jones SRL.
  Registra en Sheets y envía email
- **Evento**: `flota_presupuesto`
- **Skills útiles**: `catalogo-jones-srl` (CRÍTICO), `mantenimiento-mb-pesados`

#### `F3 — Alertas Service Flota Pesada`
- **Workflow ID**: `jrgTi4Qu93t7JOi8`
- **Trigger**: Schedule diario 7 AM
- **Qué hace**: revisa diariamente el estado de la flota, clasifica urgencias
  y envía reporte por email
- **Skills útiles**: `umbrales-service-camion`

#### `F4 — Reportes Flota Empresa`
- **Workflow ID**: `WxIv81YC8exjOniG`
- **Trigger**: Schedule Viernes 6 PM + Webhook
- **URL**: `https://brunosuerez.app.n8n.cloud/webhook/libra-fleet-reporte`
- **Qué hace**: genera reportes semanales de flota para empresas clientes
- **Evento**: `flota_reporte`
- **Skills útiles**: `formato-reporte-empresarial`

---

### 🧠 Infraestructura

#### `Bus de Eventos — Coordinador` (tú)
- **Workflow ID**: `0YG28TxT49BRfDP7`
- **URL**: `https://brunosuerez.app.n8n.cloud/webhook/taller-libra-bus`
- **Qué hace**: recibe eventos de cualquier fuente y los rutea al agente
  correspondiente
- **Input**: `{ evento, datos, origen }`

#### `Monitor de Errores`
- **Workflow ID**: `r5ZbjdVfgfyO3KEC`
- **URL**: `https://brunosuerez.app.n8n.cloud/webhook/taller-libra-errores`
- **Qué hace**: recibe alertas de error, envía email a Bruno, registra en Sheets
- **Evento**: `error_sistema`, `stock_critico`, eventos desconocidos

#### `Monitor de Salud`
- **Workflow ID**: `EUOnmM8k16jor0nc`
- **Trigger**: Schedule diario 6 AM
- **Qué hace**: verifica que Google Sheets y Claude API respondan, envía
  email con estado del sistema

#### `Seguimiento Post Servicio`
- **Workflow ID**: `qJKk7s48DKGsDYEf`
- **Trigger**: Schedule Viernes 4 PM
- **Qué hace**: revisa trabajos terminados de la semana y genera mensajes
  de seguimiento con Claude

#### `Sync Supabase → Sheets (Flota)`
- **Workflow ID**: `Dp5YvKNw8eJPy2Qc`
- **Trigger**: Schedule cada hora
- **Qué hace**: sincroniza vehículos de Supabase a la tab "Flota" en Sheets

#### `Reporte Diario Unificado`
- **Workflow ID**: `CvCEQnei1QSjUhJo`
- **Trigger**: Schedule diario 8 AM
- **Qué hace**: consolida alertas de flota + stock + turnos del día en un
  email HTML

#### `Notificación OT → WhatsApp`
- **Workflow ID**: `ERBuJioWy0MzcqA0`
- **URL**: `https://brunosuerez.app.n8n.cloud/webhook/ot-finalizada`
- **Qué hace**: cuando una OT se marca como Finalizado, genera mensaje con
  Claude y avisa al cliente por WhatsApp
- **Evento**: `ot_finalizada`

#### `Dashboard API — Lectura Sheets`
- **Workflow ID**: `r09EkPg4qEooROJu`
- **URL**: `https://brunosuerez.app.n8n.cloud/webhook/dashboard-leer`
- **Qué hace**: proxy para que la app Libra Fleet lea tabs de Google Sheets

---

## 🔀 Taxonomía de eventos

Lista canónica de eventos que el Bus puede recibir y a qué agente los rutea:

| Evento | Agente destino | Descripción |
|---|---|---|
| `presupuesto_solicitado` | Agente 2 | Cliente pide presupuesto de chapa/mecánica |
| `consulta_rrhh` | Agente 7 | Consulta interna de RRHH |
| `consulta_contable` | Agente 9 | Consulta fiscal o contable |
| `consulta_whatsapp` | Agente 4 | Mensaje nuevo de WhatsApp |
| `turno_confirmado` | Agente 6 | Cliente confirma turno |
| `cliente_nuevo` | Agente 6 | Alta de cliente |
| `pago_recibido` | Agente 6 | Se registra un pago |
| `trabajo_terminado` | Agente 6 | OT pasa a "Finalizado" |
| `stock_critico` | Monitor de Errores + Agente 3 | Un insumo bajó del mínimo |
| `error_sistema` | Monitor de Errores | Cualquier error de otro agente |
| `flota_recepcion` | F1 | Ingresa una unidad al taller |
| `flota_presupuesto` | F2 | Se pide presupuesto de flota |
| `flota_reporte` | F4 | Se pide reporte de flota |
| `ot_finalizada` | Notificación OT WhatsApp | OT finalizada desde app |
| `evento_desconocido` | Log en Sheets | Cualquier evento no catalogado |

### Payload estándar de entrada al Bus
```json
{
  "evento": "nombre_del_evento",
  "datos": { /* específico del evento */ },
  "origen": "whatsapp | app_libra_fleet | schedule | manual"
}
```

### Payload estándar al agente destino
```json
{
  "accion": "lo_que_debe_hacer",
  "datos": { /* forwarded */ },
  "origen": "bus_central",
  "timestamp": "ISO 8601"
}
```

---

## 🧠 Reglas de decisión del Bus

### Cuando llega un evento conocido
1. Lookup en la taxonomía → obtener URL destino
2. Generar resumen con Claude (2 líneas) de qué pasó
3. Hacer POST al webhook del agente destino
4. Loggear resultado en Sheets "Bus_Eventos"
5. Responder con `{ status: 'ok' }`

### Cuando llega un evento desconocido
1. NO fallar. NO 500.
2. Loggear en Sheets con `status: 'unknown_event'`
3. Avisar a Monitor de Errores para notificación a Bruno
4. Responder con `{ status: 'skipped', razon: 'evento no catalogado' }`

### Cuando llega un evento crítico
Eventos críticos: `error_sistema`, `stock_critico`, `flota_recepcion`
con urgencia alta.

1. Rutear inmediatamente (no esperar)
2. Notificar también a Bruno por email o WhatsApp
3. Si el agente destino falla, reintentar 1 vez
4. Si falla de nuevo, escalar a Monitor de Errores

---

## 🔒 Reglas estrictas

### NUNCA
- ❌ Rutear datos crudos sin sanitizar (filtrar teléfonos, datos sensibles)
- ❌ Responder con 500 o timeout visible al que invocó
- ❌ Loggear passwords, tokens, o datos bancarios
- ❌ Ejecutar un agente que no está en la lista canónica

### SIEMPRE
- ✅ Validar que `evento` esté en la taxonomía antes de rutear
- ✅ Loggear cada ruteo en Sheets "Bus_Eventos" con timestamp
- ✅ Responder algo al invocador (ok o skipped o error con contexto)
- ✅ Derivar eventos desconocidos a Monitor, no fallar en silencio
- ✅ Usar Claude solo para resumir (no para decidir)

---

## 🔧 Cómo agregar un agente nuevo al mapa

1. Crear el workflow en n8n
2. Exponer un webhook con path estándar: `/webhook/taller-libra-XXX` o `/webhook/libra-fleet-XXX`
3. Agregar entrada en la "Taxonomía de eventos" de este skill
4. Actualizar el Code node "Rutear evento" del Bus con la nueva ruta
5. Actualizar el README de skills si necesita un skill asociado
6. Probar con un evento manual desde el Bus

---

*Última actualización: 14 de abril de 2026 · Mapa mantenido por Bruno Suárez*
