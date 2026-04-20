# Migración v2 — localStorage → Supabase

**Objetivo:** pasar 4 módulos (Gastos, Inventario, Equipo, Agenda) de localStorage a Supabase para habilitar uso multi-usuario / multi-dispositivo.

**Tiempo estimado:** 5 minutos.

---

## Por qué es necesario

Hasta ahora, Inventario / Equipo / Agenda / Gastos guardaban todo en `localStorage` del navegador:

- Si cargabas un mecánico en tu PC, no aparecía en el celu.
- Si alguien del equipo usaba otro navegador, veía todo vacío.
- Si borrabas el caché del navegador, se perdía todo.

A partir de v2, estas 4 entidades viven en Supabase (igual que ya hacían clientes/vehículos/OTs), con replicación automática entre dispositivos.

---

## Paso 1 · Aplicar el schema en Supabase (1 min)

1. Abrí el [dashboard de Supabase](https://supabase.com/dashboard/project/zcballhidbpsatqjnbuw/sql/new)
2. SQL Editor → **New query**
3. Copiá y pegá todo el contenido de **`libra-fleet/supabase-schema-v2.sql`**
4. Click **Run** (o Ctrl+Enter)

Deberías ver `Success. No rows returned` — significa que creó las 5 tablas nuevas:

- `gastos`
- `insumos`
- `movimientos_inventario`
- `mecanicos` (con Bruno Suarez pre-cargado como Jefe de Taller)
- `turnos`

Es **idempotente** — podés correrlo múltiples veces sin romper nada (usa `CREATE TABLE IF NOT EXISTS`).

---

## Paso 2 · Deploy del nuevo código (2 min)

El branch `claude/resume-session-fix-error-Qcr4E` ya tiene el código migrado. Deploy normal en Vercel (si tenés autodeploy, se dispara solo al mergear; si no, deploy manual).

Después del deploy, la app carga todas las entidades en paralelo desde Supabase al abrir.

**Si una tabla no existe** → la app muestra banner amarillo "No se pudieron cargar algunos datos" pero sigue funcionando. Volvé al Paso 1.

---

## Paso 3 · Migrar datos locales (2 min)

Si ya tenías datos cargados en los módulos Inventario/Equipo/Agenda/Gastos desde tu navegador actual:

1. Abrí la app deployada en **ese mismo navegador** (el que tiene los datos locales)
2. Andá a **`/cerebro`**
3. Vas a ver un banner amarillo: **"⚡ Migración pendiente"**
4. Click en **🚀 Migrar ahora** → confirmá

El script:
1. Lee los datos de `localStorage`
2. Los inserta en las tablas de Supabase
3. Si **todo sale bien** → limpia `localStorage`
4. Si **hay algún error** → no toca `localStorage` (podés reintentar)

Reporte esperado:
```
✅ Migración exitosa. Datos locales limpiados.
Gastos migrados: 12
Insumos migrados: 47
Movimientos migrados: 89
Mecánicos migrados: 3
Turnos migrados: 8
```

> ⚠️ **Si usás varios navegadores** (PC + celu + tablet): repetí los Pasos 3 en cada uno. Después de migrar en uno, los datos aparecen automáticamente en los otros porque todos leen de Supabase.

---

## Verificación post-migración

En el dashboard de Supabase → Table Editor:

- `gastos` → filas esperadas
- `insumos` → items de inventario
- `movimientos_inventario` → historial de ajustes
- `mecanicos` → plantilla (incluyendo Bruno Suarez)
- `turnos` → programación

En la app:

- **Finanzas** → KPIs con ingresos (desde OTs) y gastos (desde Supabase)
- **Inventario** → stock con alertas
- **Equipo** → mecánicos activos
- **Agenda** → turnos del día/semana
- **Cerebro** → banner de migración desaparece

---

## Rollback (en caso de emergencia)

Si algo sale mal:

1. **Datos seguros:** el migrador NO borra `localStorage` si hay errores, así que podés volver a la versión anterior sin perder datos.
2. **Revertir deploy:** redeploy el commit anterior a `2df...` (migración). Los módulos vuelven a usar `localStorage`.
3. **Datos ya subidos a Supabase:** `DELETE FROM gastos;` / `DELETE FROM insumos;` etc. en el SQL Editor si querés limpiar.

---

## Cambios técnicos (para referencia)

### `libra-fleet/src/lib/api.js`

Todas estas funciones ahora son async y pegan contra Supabase en vez de `localStorage`:

| Función | Tabla Supabase |
|---|---|
| `getGastos()`, `registrarGasto()`, `eliminarGasto()` | `gastos` |
| `getInventario()`, `crearInsumo()`, `actualizarInsumo()`, `eliminarInsumo()`, `ajustarStock()` | `insumos` |
| `getMovimientosInventario()` | `movimientos_inventario` |
| `getMecanicos()`, `crearMecanico()`, `actualizarMecanico()`, `eliminarMecanico()` | `mecanicos` |
| `getAgenda()`, `crearTurno()`, `actualizarTurno()`, `eliminarTurno()` | `turnos` |

Funciones nuevas:
- `tieneDatosLocalesParaMigrar()` — booleano, indica si hay datos en localStorage pendientes
- `migrarLocalStorageASupabase()` — lee localStorage y sube a Supabase, devuelve reporte

### `libra-fleet/src/App.jsx`

Carga las 8 entidades (ordenes, vehiculos, clientes, gastos, insumos, movimientos, mecanicos, turnos) en paralelo al inicio. Pasa como props + `onRefresh` callback a las páginas.

### Páginas modificadas

`Finanzas.jsx`, `Inventario.jsx`, `Equipo.jsx`, `Agenda.jsx`, `Cerebro.jsx` — usan props + `onRefresh` en vez de leer localStorage directo.

### Eventos del bus

Los eventos al bus n8n siguen disparándose igual (`gasto_registrado`, `stock_bajo`, `mecanico_creado`, `turno_creado`, etc.) — solo cambió la fuente de datos.
