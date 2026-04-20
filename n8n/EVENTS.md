# Catálogo de Eventos — Taller Libra Bus

Todos los eventos llegan por **POST** al webhook único:

```
https://brunosuerez.app.n8n.cloud/webhook/taller-libra-bus
```

Estructura común del body:

```json
{
  "evento": "nombre_del_evento",
  "datos": { "...": "payload específico" },
  "origen": "libra_fleet_app | cerebro | marketing | finanzas",
  "ts": "2026-04-20T14:23:11.000Z"
}
```

El workflow router debe leer `$json.evento` y ramificar hacia cada agente.

---

## 1. `flota_recepcion` — Agente Recepción Pesada

Disparado al crear una OT para camión pesado o tractor.

```json
{
  "evento": "flota_recepcion",
  "datos": {
    "ot_numero": "OT-000123",
    "cliente": "Acacio Lorenzo",
    "telefono": "5492974773784",
    "codigo": "U05",
    "modelo": "M.B. 1634",
    "categoria": "Tractor",
    "km": 182400,
    "proximo_km": 202400,
    "servicio": "Service 20.000 km",
    "mecanico": "Bruno Suarez"
  }
}
```

**Acciones del agente:**
- Enviar WhatsApp al cliente confirmando ingreso
- Crear fila en Google Sheets "OTs activas"
- Notificar al admin por WhatsApp

---

## 2. `flota_liviana_recepcion` — Agente Recepción Liviana

Igual payload que `flota_recepcion` pero categoría `Utilitario` / `Semirremolque`.

---

## 3. `ot_finalizada` — Agente Finalización

Disparado cuando una OT pasa a estado `Finalizado`.

```json
{
  "evento": "ot_finalizada",
  "datos": {
    "ot_numero": "OT-000123",
    "cliente": "Acacio Lorenzo",
    "telefono": "5492974773784",
    "vehiculo": "U05 M.B. 1634 Tractor",
    "km": 182400,
    "proximo_km": 202400,
    "servicio": "Service 20.000 km"
  }
}
```

**Acciones:**
- WhatsApp al cliente: "Tu unidad está lista para retirar"
- Marcar OT como lista en Google Sheets
- Si el cliente tiene email → enviar factura/remito PDF

---

## 4. `cliente_creado` — Agente CRM

```json
{
  "evento": "cliente_creado",
  "datos": {
    "cliente_id": "uuid-xxxx",
    "nombre": "Transporte del Sur SA",
    "telefono": "5492974111222",
    "email": "contacto@sur.com.ar",
    "cuit": "30-12345678-9"
  }
}
```

**Acciones:**
- Agregar a Google Sheets "Clientes"
- Enviar email de bienvenida con presentación de servicios
- Agregar a lista de difusión de WhatsApp Business
- Sincronizar a HubSpot / CRM externo (si aplica)

---

## 5. `cliente_actualizado` / `cliente_eliminado`

```json
{
  "evento": "cliente_actualizado",
  "datos": { "cliente_id": "uuid", "cambios": {...}, "nombre": "..." }
}
```

---

## 6. `presupuesto_creado` — Agente Ventas

```json
{
  "evento": "presupuesto_creado",
  "datos": {
    "numero": "PRES-2026-045",
    "cliente": "Acacio Lorenzo",
    "telefono": "5492974773784",
    "email": "contacto@acacio.com.ar",
    "total": 1239425,
    "validez_dias": 15
  }
}
```

**Acciones:**
- Enviar presupuesto por email
- WhatsApp al cliente con link al PDF
- Crear tarea de seguimiento a 3 días si no responde
- Registrar en pipeline de ventas

---

## 7. `presupuesto_aprobado` / `presupuesto_rechazado` / `presupuesto_enviado`

Mismo payload base, evento cambia según acción.

---

## 8. `marketing_publicar` — Agente Marketing

```json
{
  "evento": "marketing_publicar",
  "datos": {
    "plataformas": ["facebook", "instagram"],
    "titulo": "Service 20k Mercedes-Benz",
    "texto": "Texto del post...\n\n📞 2974773784",
    "hashtags": "#LibraServicios #MercedesBenz",
    "fotos": [
      "https://zcballhidbpsatqjnbuw.supabase.co/storage/v1/object/public/fotos/post-01.jpg"
    ],
    "programado_para": null
  }
}
```

**Acciones:**
- Si `facebook` en plataformas → POST a Facebook Graph API `/{page_id}/photos` o `/feed`
- Si `instagram` en plataformas → crear media container + publish
- Si `whatsapp` → enviar a WhatsApp Business broadcast
- Si `programado_para` tiene fecha → usar Schedule Trigger en n8n
- Guardar log en Google Sheets "Publicaciones"

---

## 9. `lead_captado` — Agente Leads

```json
{
  "evento": "lead_captado",
  "datos": {
    "nombre": "Juan Pérez",
    "telefono": "5492974999888",
    "fuente": "Instagram",
    "mensaje": "Necesito cotización service 20k para Acciones MB 1634"
  }
}
```

**Acciones:**
- Notificar al admin por WhatsApp con botones de respuesta rápida
- Crear entrada en Google Sheets "Leads"
- Enviar auto-respuesta al lead: "Gracias por tu consulta, te respondemos en <24hs"

---

## 10. `gasto_registrado` — Agente Finanzas

```json
{
  "evento": "gasto_registrado",
  "datos": {
    "id": "uuid",
    "fecha": "2026-04-20",
    "categoria": "Insumos",
    "proveedor": "Jones SRL",
    "concepto": "Filtros MB 1634",
    "monto": 110000,
    "metodo_pago": "Transferencia"
  }
}
```

**Acciones:**
- Agregar a Google Sheets "Gastos"
- Si monto > umbral → notificar admin
- Consolidar totales mensuales para reporte

---

## 11. `cerebro.heartbeat` — Ping de salud

```json
{ "evento": "cerebro.heartbeat", "datos": { "fuente": "panel_cerebro" } }
```

El workflow debe responder con `{ "status": "ok", "ts": "..." }` para que el panel muestre "bus online".

---

## Respuesta esperada del router

Cualquier evento debe devolver JSON con al menos:

```json
{ "status": "ok", "evento": "...", "procesado_en": "2026-04-20T14:23:11Z" }
```

Si hay error: `{ "status": "error", "mensaje": "..." }` con HTTP 500 (para que el log del panel lo muestre en rojo).
