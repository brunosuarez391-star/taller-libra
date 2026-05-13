# LIBRA FLEET — Resumen completo del proyecto

> Documento de handoff técnico y funcional · Mayo 2026
> Owner: Bruno Germán Suárez · Libra Servicios Industriales · Comodoro Rivadavia, Chubut

---

## 1. Identidad y propósito

**Libra Fleet** es la aplicación web/PWA de gestión de flota y taller mecánico de Libra Servicios Industriales. Maneja:

- Flota de camiones (gestión de unidades, choferes, vencimientos VTV/Seguro/RUTA)
- Órdenes de trabajo (service preventivo, reparaciones, urgencias)
- Presupuestos editables con generación de PDF
- Facturación mensual con detalle item-por-item
- Sync automático a la app contable Libra Contaduría
- Bus de eventos para automatizaciones (WhatsApp, n8n)

**Cliente principal en operación**: Acacio Lorenzo (13 unidades Mercedes-Benz U01-U13).
**Multi-cliente**: el sistema soporta cualquier cantidad de clientes/flotas adicionales.

---

## 2. URLs y deploy

| Recurso | URL/path |
|---|---|
| App productiva | https://taller-libra.vercel.app |
| Repositorio | https://github.com/brunosuarez391-star/taller-libra |
| Branch principal | `main` |
| Vercel project | `taller-libra` (team `brunosuarez391-stars-projects`) |
| Auto-deploy | cada `git push origin main` → ~2 min |
| Código local | `C:\Users\bruno\Desktop\libra-fleet-source\libra-fleet\` |

---

## 3. Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 19.2 + Vite 8 |
| Routing | React Router 7 |
| Styles | Tailwind CSS 4 (con `dark:` mode) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| PDFs | jsPDF (sin html2canvas — vector puro) |
| Bus de eventos | n8n (`brunosuerez.app.n8n.cloud/webhook/taller-libra-bus`) |
| Hosting | Vercel |
| Sync externo | Edge Function `fleet-factura-sync` → Supabase Contaduría |
| Auth | Supabase Auth (email/password) |

---

## 4. Base de datos — Supabase Fleet

**Project ID**: `ibvdcvpozgfjxqcbflwu`
**URL**: `https://ibvdcvpozgfjxqcbflwu.supabase.co`

### Tablas principales

```
clientes                  Clientes de la flota (Acacio Lorenzo + futuros)
vehiculos                 Unidades con código U01-U13, marca, modelo, patente,
                          chofer, chofer_telefono, KM actuales, vencimientos
                          VTV/Seguro/RUTA/RTO, compañía y póliza de seguro
conductores               Multi-chofer por flota con DNI, teléfono, licencia
                          (número, categoría, vencimiento)

ordenes_trabajo           OTs con OT-XXXX-XXX, vehículo_id, cliente_id, KM,
                          servicio_nombre, servicio_tipo, mecánico, estado,
                          patente, chofer, tipo_servicio (service/reparacion/
                          urgencia/inspeccion), remito_numero/fecha
servicios_ot              Checklist de tareas por OT
insumos_ot                Items/repuestos con descripción, cantidad,
                          precio_unit, proveedor (para OTs de reparación)

presupuestos              PP-XXXX-XXX con cliente_id, vehiculo_id, fecha,
                          subtotal_siva, iva, total_civa, estado
                          (borrador/enviado/aprobado/rechazado), remito
items_presupuesto         Items detallados de cada presupuesto

proveedores               Catálogo de proveedores (Jones SRL, etc.)
cotizaciones              Cotizaciones recibidas

gastos                    Gastos del taller con categoría, proveedor,
                          concepto, monto, método de pago
insumos                   Inventario de stock con código, descripción,
                          stock, stock_minimo, precio, proveedor
movimientos_inventario    Auditoría de ajustes de stock
mecanicos                 Equipo de mecánicos
turnos                    Agenda de turnos programados
```

### Vistas

```
vencimientos_proximos     View calculada con VTV/Seguro/RUTA/RTO ≤60 días
                          + severidad (vencido / crítico ≤7d / próximo ≤30d / ok)
                          + días restantes
```

---

## 5. Estructura de la app

### Navegación principal

```
PRINCIPAL
├── Dashboard          KPIs + Panel de Vencimientos con alertas por severidad
├── Cerebro            Control central + log del bus de eventos
└── Flota              CRUD de vehículos con patente, chofer, vencimientos

OPERACIONES
├── OTs                Órdenes de trabajo con filtros estado+fecha
├── Nueva OT           Creación con auto-fill desde vehículo seleccionado
├── Agenda             Turnos programados
├── Clientes           CRUD
└── Equipo             Mecánicos

ADMINISTRACIÓN
├── Presupuestos       Borrador / lista guardada con edición completa
├── Facturación        Mensual con detalle item-por-item por cliente
├── Cobranzas          Seguimiento de pagos
├── Inventario         Repuestos con stock + movimientos
├── Finanzas           Gastos
├── Marketing          Publicación a redes vía bus n8n
└── Sistema IA         Asistente
```

### Página pública

```
/flota/:codigo         Vista pública de un vehículo (sin auth) para que
                       los choferes vean info de su unidad
```

---

## 6. Funcionalidades clave

### 6.1 Gestión de flota

- 13 unidades Acacio Lorenzo (U01-U13) Mercedes-Benz precargadas con marca/modelo
- Patente, chofer asignado, teléfono del chofer por vehículo
- Vencimientos VTV, Seguro (con compañía+póliza), RUTA, RTO
- Sistema de alertas por severidad:
  - **Vencido**: en rojo — fecha menor a hoy
  - **Crítico**: en naranja — vence en ≤7 días
  - **Próximo**: en amarillo — vence en ≤30 días
- KM actuales editable inline desde la tarjeta del vehículo
- Categorías: Camión Pesado, Tractor, Semirremolque, Utilitario, Camioneta, Auto, Maquinaria

### 6.2 Órdenes de trabajo (OTs)

- Auto-fill desde vehículo seleccionado (cliente, KM, patente, chofer)
- Validación de KM (no permite menor al último registrado, salvo confirmación)
- Distinción tipo_servicio:
  - `service` — preventivo (Service 20k/50k/100k con checklist UOM-Jones)
  - `reparacion` — items custom con cantidad y precio
  - `urgencia` — emergencias
  - `inspeccion` — chequeo sin tareas
- Items detallados para reparaciones (descripción, cantidad, precio_unit)
- Estados: Ingresado / En proceso / Finalizado / Entregado / Cobrada
- Generación de etiqueta de service para imprimir y pegar al vehículo
- **PDF profesional** con cabecera empresa, datos cliente/vehículo/chofer/patente, servicio, KM ingreso/próximo, mecánico, items con cantidad/precio/subtotal, IVA 21%, total, observaciones, espacio para firma cliente y taller, remito
- **Botón WhatsApp** que abre WA con el detalle armado al teléfono del cliente
- Edición inline de patente, chofer, KM, observaciones, mecánico, remito

### 6.3 Presupuestos

- Service preventivo con autocompletado por modelo (precios derivados del catálogo Jones SRL)
- Reparación con items custom editables
- Lista guardada con filtros estado + mes
- Botones por presupuesto:
  - 📄 **PDF** — descarga
  - 📲 **WhatsApp** — manda al cliente
  - ✏️ **Editar** — modifica items/cantidades/precios/observaciones (mantiene número)
  - 📋 **Duplicar** — lo carga como nuevo (genera otro número)
  - ✓ **Aprobar** / ✕ **Rechazar** — cambio de estado
  - 🗑️ **Eliminar**
- Remitos asociables (número + fecha)
- Estados: borrador / enviado / aprobado / rechazado

### 6.4 Facturación mensual

- Selector mes + cliente (todos / específico)
- KPIs: OTs / Neto s/IVA / IVA / Total c/IVA
- **PDF detallado item-por-item**:
  - Por cliente: header con conteo de OTs + presupuestos aprobados
  - Por OT: número, fecha, unidad, patente, chofer, total + items desglosados (cant/precio/subtotal)
  - Para services preventivos: separa MO + Insumos
  - Para reparaciones: lista cada insumo_ot con su precio
  - Por presupuesto aprobado: número, fecha, remito si tiene + items desglosados
  - Subtotales por sección + total cliente al final del bloque
- **Botón "📤 Enviar a Contaduría"** por cliente:
  - Llama a Edge Function `fleet-factura-sync` con auth Bearer
  - Inserta en `arca_facturas_emitidas` del proyecto Contaduría
  - Idempotencia por `fleet_ref = {mes}-{cliente_id}`
  - Trazabilidad: metadata con qué OTs, qué presupuestos, qué mes
  - Marca local en localStorage para feedback visual ("✓ Enviada N° 0003-00000045")

### 6.5 Bus de eventos n8n

URL del webhook: `https://brunosuerez.app.n8n.cloud/webhook/taller-libra-bus`

Eventos disparados:

| Evento | Cuándo | Payload |
|---|---|---|
| `flota_recepcion` / `flota_liviana_recepcion` | Crear OT (según categoría) | OT, cliente, vehículo, KM |
| `ot_finalizada` | OT pasa a Finalizado | OT, cliente, teléfono → dispara WhatsApp |
| `presupuesto_creado` | Guardar presupuesto | Número, cliente, total |
| `presupuesto_aprobado` / `presupuesto_rechazado` | Cambio de estado | Número, cliente, total |
| `cliente_creado` / `cliente_actualizado` / `cliente_eliminado` | CRUD clientes | Datos del cliente |
| `gasto_registrado` / `gasto_eliminado` | Finanzas | Gasto |
| `stock_bajo` | Stock ≤ stock_minimo | Insumo, stock actual |
| `stock_ajustado` | Cambio de stock | Insumo, delta |
| `turno_creado` / `turno_completado` / `turno_cancelado` | Agenda | Turno |
| `factura_a_contaduria` | Botón "Enviar a Contaduría" | Cliente, total, mes, ok |
| `marketing_publicar` | Botón publicar | Plataforma, texto, fotos |
| `lead_captado` | Marketing | Nombre, teléfono, fuente |
| `cerebro.heartbeat` | Heartbeat manual | Fuente |

Log local: últimos 100 eventos guardados en `localStorage` (`libra_bus_log`).

---

## 7. Datos de la empresa

| Campo | Valor |
|---|---|
| Razón social | Suárez Bruno Germán |
| CUIT | 20-35658676-0 |
| Condición ARCA | Responsable Inscripto |
| Domicilio | Av. del Progreso 7080, Parque Industrial |
| Ciudad | Comodoro Rivadavia, Chubut |
| Teléfono | 297-477-3784 |
| Email | bruno@librapatagonia.com |
| Web | librapatagonia.com |

---

## 8. Cliente principal: Acacio Lorenzo

13 unidades Mercedes-Benz registradas:

| Código | Modelo | Tipo | Categoría |
|---|---|---|---|
| U01 | M.B. 1634 | Balancín | Camión Pesado |
| U02 | M.B. 1634 | Balancín | Camión Pesado |
| U03 | M.B. 1624 | Balancín | Camión Pesado |
| U04 | M.B. 1624 | Balancín | Camión Pesado |
| U05 | M.B. 1634 | Semi Largo 3 Ejes | Tractor |
| U06 | M.B. 1634 | Semi Largo 3 Ejes | Tractor |
| U07 | M.B. 1634 | Semi Corto 1 Eje | Tractor |
| U08 | M.B. 1634 | Semi Corto 2 Ejes | Tractor |
| U09 | M.B. 1634 | Semi Largo 3 Ejes | Tractor |
| U10 | M.B. 1634 | Semi Largo 3 Ejes | Tractor |
| U11 | M.B. 1735 | Semi Corto 2 Ejes | Tractor |
| U12 | M.B. 1634 | Semi Largo 3 Ejes | Tractor |
| U13 | M.B. 1634 | Semi Largo 3 Ejes | Tractor |

**Proveedor principal de insumos**: Jones Carlos Alberto y Jones Eduardo SRL (CUIT 30-71094293-1, Comodoro Rivadavia).

**Cotización vigente Jones SRL N°33036** (fecha 2026-03-30):
- Filtro aire MB 1634 OM457: $63.028
- Filtro aceite MB 1634 OM457: $20.447
- Aceite motor MB 1634 OM457: $261.212
- Filtro combustible MB 1634 OM457: $30.088
- Trampa agua MB 1634 OM457: $49.170
- **Total**: $423.946

---

## 9. Integraciones cross-app

### Fleet → Contaduría (1-way)

Cuando Bruno cierra la facturación mensual y aprieta "Enviar a Contaduría":

1. Frontend Fleet llama a Edge Function `fleet-factura-sync` (en proyecto Supabase Contaduría)
2. Auth: header `Authorization: Bearer <FLEET_SYNC_TOKEN>`
3. Edge Function:
   - Valida token
   - Asigna número correlativo de factura (PV 3, tipo A)
   - Inserta en `arca_facturas_emitidas` con estado `pendiente` (queda esperando CAE de ARCA, que se autoriza desde la app de Contaduría)
   - Idempotencia: si ya existe una factura con `metadata.fleet_ref` igual, devuelve la existente sin duplicar
   - Trazabilidad: guarda `ots_incluidas`, `presupuestos_incluidos`, `mes` en `metadata`
4. Frontend Fleet recibe número formateado (`0003-00000045`) y total
5. Marca como enviada en localStorage para evitar reenvíos accidentales

**Token de sync**: `fleet_8x9aPq2K7vM4nL6jR3wY5uH1tBcZ0eF`
- En Fleet: `VITE_FLEET_SYNC_TOKEN` (Vercel env var)
- En Contaduría: secret `FLEET_SYNC_TOKEN` de Supabase Functions

---

## 10. Variables de entorno (Vercel)

Configuradas en production + development del proyecto `taller-libra`:

```
VITE_SUPABASE_URL              https://ibvdcvpozgfjxqcbflwu.supabase.co
VITE_SUPABASE_ANON_KEY         (anon key del proyecto Fleet)
VITE_CONTADURIA_SYNC_URL       https://zcballhidbpsatqjnbuw.supabase.co/functions/v1/fleet-factura-sync
VITE_FLEET_SYNC_TOKEN          fleet_8x9aPq2K7vM4nL6jR3wY5uH1tBcZ0eF
```

---

## 11. Estructura de carpetas

```
libra-fleet-source/
├── libra-fleet/                          App principal
│   ├── src/
│   │   ├── App.jsx                       Router con BrowserRouter + lazy loading
│   │   ├── main.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx                Header + nav lateral + footer
│   │   │   ├── BusquedaGlobal.jsx        Spotlight de búsqueda
│   │   │   ├── PanelVencimientos.jsx     Alertas en Dashboard
│   │   │   ├── PresupuestoView.jsx       Vista de presupuesto generado
│   │   │   ├── EtiquetaService.jsx       Etiqueta para pegar al vehículo
│   │   │   └── ThemeToggle.jsx           Light/dark
│   │   ├── lib/
│   │   │   ├── supabase.js               Cliente Supabase
│   │   │   ├── api.js                    Todas las funciones de DB + bus
│   │   │   ├── data.js                   Constantes (precios, servicios, empresa)
│   │   │   ├── presupuestoPDF.js         Generador PDF presupuestos
│   │   │   ├── otPDF.js                  Generador PDF de OTs
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── Vehiculos.jsx
│   │       ├── NuevoVehiculo.jsx
│   │       ├── VehiculoDetalle.jsx
│   │       ├── VehiculoPublico.jsx       (sin auth)
│   │       ├── Ordenes.jsx
│   │       ├── NuevaOT.jsx
│   │       ├── Agenda.jsx
│   │       ├── Clientes.jsx
│   │       ├── Equipo.jsx
│   │       ├── Inventario.jsx
│   │       ├── Presupuestos.jsx
│   │       ├── Facturacion.jsx
│   │       ├── Cobranzas.jsx
│   │       ├── Finanzas.jsx
│   │       ├── Marketing.jsx
│   │       ├── Cerebro.jsx
│   │       ├── SistemaIA.jsx
│   │       └── Login.jsx
│   ├── supabase-schema.sql                       Schema base
│   ├── supabase-schema-v2.sql                    Migración (gastos, inventario, etc.)
│   ├── supabase-migration-vehiculos.sql          Categorías libres
│   ├── supabase-migration-remitos.sql            Remitos en presupuestos y OTs
│   ├── supabase-migration-flota-real.sql         Patente/chofer/vencimientos/conductores
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
├── n8n/                                  Workflows + docs del bus
├── skills/                               Skills de Claude (brand, FAQ, catálogo)
├── libra-chapa/                          Sub-app Chapa y Pintura (otra DB)
└── managed-agent/                        Setup del Claude Agent
```

---

## 12. Scripts útiles (desde `libra-fleet/`)

```bash
npm run dev          # Vite dev server en :5173
npm run build        # Build producción → dist/
npm run lint         # ESLint
npm run preview      # Preview del build
```

Deploy: solo `git push origin main` y Vercel construye y publica.

---

## 13. Estado actual

✅ **Productivo y en uso diario**: Bruno opera las 13 unidades de Acacio Lorenzo todos los días.

### Funciona al 100%

- Carga de OTs con auto-fill, validaciones, items detallados
- Generación de PDFs profesionales (presupuestos + OTs + facturación mensual)
- WhatsApp directo desde cada OT y presupuesto
- Edición de presupuestos guardados (cambios de items/precios sin perder número)
- Sync mensual a Contaduría con un click
- Alertas de vencimientos en Dashboard

### Pendientes operativos (de Bruno)

- Cargar vencimientos VTV/Seguro/RUTA reales de cada unidad
- Sumar nuevos clientes/flotas a medida que entran
- Actualizar precios paritarios trimestrales en `lib/data.js`

### Mejoras posibles

- Hub Maestro unificando Fleet + Contaduría + Chapa en un dashboard único
- Notificaciones automáticas de vencimientos VTV/Seguro/RUTA por WhatsApp (vía bus n8n + workflow)
- Stock automático que descuenta de inventario al cargar items en OT
- Adjuntar archivos (Fusion 360, fotos) a presupuestos
- App mobile nativa (React Native con misma DB Supabase)

---

## 14. Glosario rápido

- **OT**: Orden de Trabajo. Identifica un trabajo concreto sobre un vehículo.
- **Presupuesto** (PP): cotización al cliente antes de hacer el trabajo. Tiene número PP-XXXX-XXX.
- **Remito**: comprobante de entrega del trabajo terminado, asociable a OT y a presupuesto.
- **Bus de eventos**: pipeline central de notificaciones que dispara automatizaciones (n8n).
- **Cerebro**: panel central de control con visualización de eventos del bus.
- **VTV**: Verificación Técnica Vehicular (obligatoria, vence anual).
- **RUTA**: tarjeta verde / cédula azul.
- **RTO**: Revisión Técnica Obligatoria.
- **F.931**: formulario de cargas sociales (Sueldos, en la app Contaduría).
- **CAE**: Código de Autorización Electrónico (ARCA, en la app Contaduría).

---

**FIN DEL DOCUMENTO**

Para dudas: bruno@librapatagonia.com
