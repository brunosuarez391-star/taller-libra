# ✅ Production Checklist — Taller Libra

Marcá cada ítem a medida que lo completás. Seguí el orden: cada sección desbloquea la siguiente.

---

## 🎯 Fase 1: Bus de eventos (el cerebro funciona)

- [ ] Importé los 4 archivos **uno por uno** en https://brunosuerez.app.n8n.cloud/ (UI no acepta array):
      `taller-libra-bus.json` · `agente-marketing.json` · `agente-whatsapp.json` · `agente-leads-sheets.json`
- [ ] Los 4 workflows están con el toggle en ON (verde)
- [ ] La URL del webhook del router es `https://brunosuerez.app.n8n.cloud/webhook/taller-libra-bus`
- [ ] Panel Cerebro (`/cerebro`) muestra **Bus n8n: online** (verde)
- [ ] Click en "Ping bus" dispara `cerebro.heartbeat` y aparece en el feed

---

## 🎯 Fase 2: WhatsApp al cliente (el agente más importante)

- [ ] App creada en [developers.facebook.com](https://developers.facebook.com/apps) tipo Business
- [ ] Producto WhatsApp agregado
- [ ] Phone Number ID copiado en variable n8n `WHATSAPP_PHONE_ID`
- [ ] Access Token copiado en variable n8n `WHATSAPP_TOKEN`
- [ ] Mi número (5492974773784) agregado como tester en WhatsApp → API Setup
- [ ] Plantilla `ot_ingresada` creada en WhatsApp Manager (es_AR, categoría UTILITY, 3 parámetros)
- [ ] Plantilla `ot_finalizada` creada (es_AR, 4 parámetros)
- [ ] Plantilla `presupuesto_listo` creada (es_AR, 4 parámetros)
- [ ] Las 3 plantillas en estado **Aprobada** (no Pendiente)
- [ ] Test desde Cerebro → Agente Finalización → llega WhatsApp al cliente

---

## 🎯 Fase 3: Marketing a redes (el agente que trae trabajo)

### Facebook

- [ ] Fanpage de Libra identificada (copié su ID)
- [ ] Token de usuario generado en Graph API Explorer con permisos: `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`, `instagram_content_publish`, `instagram_basic`
- [ ] Page Access Token permanente obtenido via `/me/accounts`
- [ ] `FB_PAGE_ID` y `FB_PAGE_ACCESS_TOKEN` cargados en n8n

### Instagram

- [ ] Cuenta de IG en modo **Business** (no Creator, no Personal)
- [ ] Cuenta IG **conectada a la Fanpage** de Facebook
- [ ] `IG_BUSINESS_ACCOUNT_ID` obtenido vía GET `/{PAGE_ID}?fields=instagram_business_account`
- [ ] `IG_ACCESS_TOKEN` = mismo valor que `FB_PAGE_ACCESS_TOKEN`

### Supabase Storage para fotos

- [ ] Bucket `fotos` tiene policy **Public read**
- [ ] Subí al menos 1 foto de prueba al bucket
- [ ] URL pública accesible desde navegador privado (sin login)

### Tests

- [ ] Test desde Cerebro → Agente Marketing → Bus respondió OK
- [ ] En n8n → Executions del workflow Marketing → Status **success**
- [ ] Post aparece en la Fanpage de Facebook
- [ ] Post aparece en Instagram (tarda unos segundos, el media_publish es async)

---

## 🎯 Fase 4: Leads a Google Sheets

- [ ] Google Sheet creada: **Libra — Leads** con columnas `ts | nombre | telefono | fuente | mensaje | estado`
- [ ] ID de la sheet copiado en variable `SHEET_LEADS_ID`
- [ ] Credencial Google Sheets OAuth2 creada en n8n (login bruno@librapatagonia.com)
- [ ] Nodo "Google Sheets — Append lead" del workflow Leads tiene la credencial seleccionada
- [ ] Test desde Cerebro → Agente Leads → fila aparece en la Sheet + WhatsApp al admin

---

## 🎯 Fase 5: Sheets adicionales (opcional pero recomendado)

- [ ] Sheet "Libra — Gastos" (`fecha | categoria | proveedor | concepto | monto | metodo_pago`) + `SHEET_GASTOS_ID`
- [ ] Sheet "Libra — Clientes" (`ts | nombre | cuit | telefono | email | contacto`) + `SHEET_CLIENTES_ID`
- [ ] Sheet "Libra — Publicaciones" (`ts | plataformas | titulo | texto | url_fb | url_ig`) + `SHEET_PUBLICACIONES_ID`
- [ ] Nodos Sheets agregados a los workflows correspondientes

---

## 🎯 Fase 6: Token permanente de WhatsApp (importante!)

El token temporal dura **24 horas**. Para producción necesitás uno permanente.

- [ ] Creé un System User en [business.facebook.com/settings/system-users](https://business.facebook.com/settings/system-users)
- [ ] Asigné mi app al System User
- [ ] Generé System User Access Token con permiso `whatsapp_business_messaging` y `whatsapp_business_management`
- [ ] Marqué el token como **Nunca expira** (o al menos 60 días)
- [ ] Reemplacé `WHATSAPP_TOKEN` en n8n con el nuevo token

---

## 🎯 Fase 7: Validación end-to-end

Prueba real de flujo completo:

- [ ] Creé un cliente nuevo desde la app → llegó al Sheets (si configurado) + evento `cliente_creado` en el feed Cerebro
- [ ] Creé una OT nueva → WhatsApp llega al cliente con plantilla `ot_ingresada`
- [ ] Cambié estado OT a Finalizado → WhatsApp llega con plantilla `ot_finalizada`
- [ ] Publiqué un post desde Marketing con foto real → apareció en FB e IG
- [ ] Capturé un lead manual → apareció en Sheets + admin recibió WhatsApp
- [ ] Registré un gasto → apareció evento `gasto_registrado` en el feed
- [ ] El panel Cerebro muestra los 11 agentes con al menos 1 trigger cada uno ✅

---

## 🚀 Ya está en producción

Si llegaste hasta acá sin boxes sin tildar, el sistema está operativo. Ahora:

1. **Compartí el link de la app** con tu equipo / clientes
2. **Publicá en redes** desde el módulo Marketing para atraer leads
3. **Revisá el panel Cerebro** al menos 1 vez al día para ver alertas y actividad
4. **Renová tokens** cada 60 días (anotá fecha en calendar)

---

## 📅 Mantenimiento recurrente

- **Cada semana**: revisar el feed del Cerebro para detectar errores en los agentes
- **Cada mes**: exportar reporte financiero desde módulo Finanzas
- **Cada 2 meses**: renovar tokens de Meta (FB + IG + WA)
- **Según necesidad**: aprobar nuevas plantillas de WhatsApp (recordatorios, promos, etc.)
