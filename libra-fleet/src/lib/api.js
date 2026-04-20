import { supabase } from './supabase'

// ============ BUS DE EVENTOS (n8n) ============
export const BUS_URL = 'https://brunosuerez.app.n8n.cloud/webhook/taller-libra-bus'
const BUS_LOG_KEY = 'libra_bus_log'
const BUS_LOG_MAX = 100

function logBus(entry) {
  try {
    const prev = JSON.parse(localStorage.getItem(BUS_LOG_KEY) || '[]')
    const next = [entry, ...prev].slice(0, BUS_LOG_MAX)
    localStorage.setItem(BUS_LOG_KEY, JSON.stringify(next))
  } catch {
    // storage full or unavailable — no se loguea
  }
}

export function getBusLog() {
  try { return JSON.parse(localStorage.getItem(BUS_LOG_KEY) || '[]') } catch { return [] }
}

export function limpiarBusLog() {
  try { localStorage.removeItem(BUS_LOG_KEY) } catch {
    // ignore
  }
}

export async function dispararEvento(evento, datos = {}, origen = 'libra_fleet_app') {
  const ts = new Date().toISOString()
  try {
    const res = await fetch(BUS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evento, datos, origen, ts })
    })
    const json = await res.json().catch(() => ({ status: 'ok' }))
    logBus({ ts, evento, datos, origen, status: res.ok ? 'ok' : 'error', http: res.status })
    return json
  } catch (err) {
    console.warn('Bus no respondió:', err.message)
    logBus({ ts, evento, datos, origen, status: 'offline', error: err.message })
    return { status: 'bus_offline' }
  }
}

export async function pingBus() {
  return dispararEvento('cerebro.heartbeat', { fuente: 'panel_cerebro' }, 'cerebro')
}

// ============ CLIENTES ============
export async function getClientes() {
  const { data, error } = await supabase.from('clientes').select('*').order('nombre')
  if (error) throw error
  return data
}

export async function crearCliente(cliente) {
  const { data, error } = await supabase.from('clientes').insert(cliente).select().single()
  if (error) throw error
  dispararEvento('cliente_creado', {
    cliente_id: data.id,
    nombre: data.nombre,
    telefono: data.telefono,
    email: data.email,
    cuit: data.cuit,
  })
  return data
}

export async function actualizarCliente(id, campos) {
  const { data, error } = await supabase.from('clientes').update(campos).eq('id', id).select().single()
  if (error) throw error
  dispararEvento('cliente_actualizado', { cliente_id: id, cambios: campos, nombre: data.nombre })
  return data
}

export async function eliminarCliente(id) {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw error
  dispararEvento('cliente_eliminado', { cliente_id: id })
}

// ============ VEHICULOS ============
export async function getVehiculos() {
  const { data, error } = await supabase.from('vehiculos').select('*, clientes(nombre)').order('codigo')
  if (error) throw error
  return data
}

export async function getVehiculoPorCodigo(codigo) {
  const { data, error } = await supabase.from('vehiculos').select('*, clientes(nombre)').eq('codigo', codigo).single()
  if (error) return null
  return data
}

export async function actualizarKm(vehiculoId, km) {
  const { error } = await supabase.from('vehiculos').update({ km_actuales: km }).eq('id', vehiculoId)
  if (error) throw error
}

// ============ ORDENES DE TRABAJO ============
export async function getOrdenes() {
  const { data, error } = await supabase.from('ordenes_trabajo').select('*, vehiculos(codigo, modelo, tipo), clientes(nombre)').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getOrdenesPorVehiculo(vehiculoId) {
  const { data, error } = await supabase.from('ordenes_trabajo').select('*').eq('vehiculo_id', vehiculoId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getOrdenesPorCodigo(codigo) {
  const { data: vehiculo } = await supabase.from('vehiculos').select('id').eq('codigo', codigo).single()
  if (!vehiculo) return []
  const { data, error } = await supabase.from('ordenes_trabajo').select('*').eq('vehiculo_id', vehiculo.id).order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function crearOrden(orden) {
  const { data, error } = await supabase.from('ordenes_trabajo').insert(orden).select('*, vehiculos(codigo, modelo, tipo, categoria), clientes(nombre, telefono)').single()
  if (error) throw error
  const esPesada = data.vehiculos?.categoria === 'Camión Pesado' || data.vehiculos?.categoria === 'Tractor'
  const evento = esPesada ? 'flota_recepcion' : 'flota_liviana_recepcion'
  dispararEvento(evento, {
    ot_numero: data.ot_numero,
    cliente: data.clientes?.nombre,
    telefono: data.clientes?.telefono,
    codigo: data.vehiculos?.codigo,
    modelo: data.vehiculos?.modelo,
    categoria: data.vehiculos?.categoria,
    km: data.km_ingreso,
    proximo_km: data.km_proximo,
    servicio: data.servicio_nombre,
    mecanico: data.mecanico,
  })
  return data
}

export async function actualizarEstadoOT(otId, estado) {
  const { data, error } = await supabase.from('ordenes_trabajo').update({ estado, updated_at: new Date().toISOString() }).eq('id', otId).select('*, vehiculos(codigo, modelo, tipo), clientes(nombre, telefono)').single()
  if (error) throw error
  if (estado === 'Finalizado') {
    dispararEvento('ot_finalizada', {
      ot_numero: data.ot_numero,
      cliente: data.clientes?.nombre,
      telefono: data.clientes?.telefono || '5492974773784',
      vehiculo: `${data.vehiculos?.codigo || ''} ${data.vehiculos?.modelo || ''} ${data.vehiculos?.tipo || ''}`.trim(),
      km: data.km_ingreso,
      proximo_km: data.km_proximo,
      servicio: data.servicio_nombre,
    })
  }
}

export async function actualizarOT(otId, campos) {
  const { error } = await supabase.from('ordenes_trabajo').update({ ...campos, updated_at: new Date().toISOString() }).eq('id', otId)
  if (error) throw error
}

export async function eliminarOT(otId) {
  const { error: e1 } = await supabase.from('servicios_ot').delete().eq('ot_id', otId)
  if (e1) throw e1
  const { error: e2 } = await supabase.from('insumos_ot').delete().eq('ot_id', otId)
  if (e2) throw e2
  const { error: e3 } = await supabase.from('ordenes_trabajo').delete().eq('id', otId)
  if (e3) throw e3
}

// ============ SERVICIOS OT ============
export async function crearServiciosOT(otId, items) {
  const servicios = items.map(desc => ({ ot_id: otId, descripcion: desc, completado: false }))
  const { error } = await supabase.from('servicios_ot').insert(servicios)
  if (error) throw error
}

// ============ PRESUPUESTOS ============
export async function getPresupuestos() {
  const { data, error } = await supabase.from('presupuestos').select('*, clientes(nombre)').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function crearPresupuesto(presupuesto) {
  const { data, error } = await supabase.from('presupuestos').insert(presupuesto).select('*, clientes(nombre, telefono, email)').single()
  if (error) throw error
  dispararEvento('presupuesto_creado', {
    numero: data.numero,
    cliente: data.clientes?.nombre,
    telefono: data.clientes?.telefono,
    email: data.clientes?.email,
    total: data.total_civa,
    validez_dias: data.validez_dias,
  })
  return data
}

export async function actualizarPresupuestoEstado(id, estado) {
  const { data, error } = await supabase.from('presupuestos').update({ estado }).eq('id', id).select('*, clientes(nombre)').single()
  if (error) throw error
  dispararEvento('presupuesto_' + estado, {
    numero: data.numero,
    cliente: data.clientes?.nombre,
    total: data.total_civa,
  })
  return data
}

// ============ MARKETING ============
export async function publicarMarketing({ plataformas, titulo, texto, hashtags, fotos, programado_para }) {
  const payload = {
    plataformas,
    titulo,
    texto,
    hashtags,
    fotos: fotos || [],
    programado_para: programado_para || null,
  }
  return dispararEvento('marketing_publicar', payload, 'marketing')
}

export async function captarLead({ nombre, telefono, fuente, mensaje }) {
  return dispararEvento('lead_captado', { nombre, telefono, fuente, mensaje }, 'marketing')
}

// ============ FINANZAS (gastos en Supabase) ============
export async function getGastos() {
  const { data, error } = await supabase.from('gastos').select('*').order('fecha', { ascending: false })
  if (error) throw error
  return data || []
}

export async function registrarGasto({ fecha, categoria, proveedor, concepto, monto, metodo_pago }) {
  const payload = {
    fecha: fecha || new Date().toISOString().slice(0, 10),
    categoria: categoria || 'Otros',
    proveedor: proveedor || null,
    concepto,
    monto: Number(monto) || 0,
    metodo_pago: metodo_pago || 'Efectivo',
  }
  const { data, error } = await supabase.from('gastos').insert(payload).select().single()
  if (error) throw error
  dispararEvento('gasto_registrado', data, 'finanzas')
  return data
}

export async function eliminarGasto(id) {
  const { error } = await supabase.from('gastos').delete().eq('id', id)
  if (error) throw error
  dispararEvento('gasto_eliminado', { id }, 'finanzas')
}

// ============ INVENTARIO (insumos en Supabase) ============
export async function getInventario() {
  const { data, error } = await supabase.from('insumos').select('*').order('codigo')
  if (error) throw error
  return data || []
}

export async function getMovimientosInventario() {
  const { data, error } = await supabase.from('movimientos_inventario').select('*').order('ts', { ascending: false }).limit(200)
  if (error) throw error
  return data || []
}

export async function crearInsumo({ codigo, descripcion, categoria, unidad, stock, stock_minimo, precio_unit, proveedor, ubicacion }) {
  const payload = {
    codigo: codigo || null,
    descripcion,
    categoria: categoria || 'Repuestos',
    unidad: unidad || 'unidad',
    stock: Number(stock) || 0,
    stock_minimo: Number(stock_minimo) || 0,
    precio_unit: Number(precio_unit) || 0,
    proveedor: proveedor || null,
    ubicacion: ubicacion || null,
  }
  if (!payload.codigo) {
    const { count } = await supabase.from('insumos').select('*', { count: 'exact', head: true })
    payload.codigo = 'INV-' + String((count || 0) + 1).padStart(3, '0')
  }
  const { data, error } = await supabase.from('insumos').insert(payload).select().single()
  if (error) throw error
  dispararEvento('insumo_creado', { codigo: data.codigo, descripcion: data.descripcion }, 'inventario')
  return data
}

export async function actualizarInsumo(id, campos) {
  const { data, error } = await supabase.from('insumos').update(campos).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function eliminarInsumo(id) {
  const { error } = await supabase.from('insumos').delete().eq('id', id)
  if (error) throw error
}

export async function ajustarStock(id, delta, motivo) {
  const { data: item, error: e1 } = await supabase.from('insumos').select('*').eq('id', id).single()
  if (e1) throw e1
  const stockAnterior = item.stock
  const stockNuevo = Math.max(0, stockAnterior + Number(delta))

  const { data: updated, error: e2 } = await supabase.from('insumos').update({ stock: stockNuevo }).eq('id', id).select().single()
  if (e2) throw e2

  await supabase.from('movimientos_inventario').insert({
    insumo_id: id,
    codigo: item.codigo,
    descripcion: item.descripcion,
    delta: Number(delta),
    stock_anterior: stockAnterior,
    stock_nuevo: stockNuevo,
    motivo: motivo || (delta > 0 ? 'Ingreso' : 'Egreso'),
  })

  if (item.stock_minimo > 0 && stockNuevo <= item.stock_minimo) {
    dispararEvento('stock_bajo', {
      codigo: item.codigo,
      descripcion: item.descripcion,
      stock_actual: stockNuevo,
      stock_minimo: item.stock_minimo,
      proveedor: item.proveedor,
    }, 'inventario')
  }
  dispararEvento('stock_ajustado', {
    codigo: item.codigo,
    delta: Number(delta),
    stock_nuevo: stockNuevo,
    motivo: motivo || '',
  }, 'inventario')
  return updated
}

// ============ EQUIPO (mecánicos en Supabase) ============
export async function getMecanicos() {
  const { data, error } = await supabase.from('mecanicos').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function crearMecanico(m) {
  const payload = {
    nombre: m.nombre,
    rol: m.rol || 'Mecánico',
    telefono: m.telefono || null,
    email: m.email || null,
    especialidad: m.especialidad || 'General',
    tarifa_hora: Number(m.tarifa_hora) || 0,
    activo: true,
  }
  const { data, error } = await supabase.from('mecanicos').insert(payload).select().single()
  if (error) throw error
  dispararEvento('mecanico_creado', { nombre: data.nombre, rol: data.rol, telefono: data.telefono }, 'equipo')
  return data
}

export async function actualizarMecanico(id, campos) {
  const { data, error } = await supabase.from('mecanicos').update(campos).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function eliminarMecanico(id) {
  const { error } = await supabase.from('mecanicos').delete().eq('id', id)
  if (error) throw error
}

// ============ AGENDA (turnos en Supabase) ============
export async function getAgenda() {
  const { data, error } = await supabase.from('turnos').select('*').order('fecha', { ascending: false }).order('hora')
  if (error) throw error
  return data || []
}

export async function crearTurno({ fecha, hora, cliente, telefono, vehiculo, servicio, mecanico, notas }) {
  const payload = {
    fecha,
    hora: hora || '09:00',
    cliente,
    telefono: telefono || null,
    vehiculo: vehiculo || null,
    servicio: servicio || 'Service',
    mecanico: mecanico || null,
    notas: notas || null,
    estado: 'Programado',
  }
  const { data, error } = await supabase.from('turnos').insert(payload).select().single()
  if (error) throw error
  dispararEvento('turno_creado', {
    fecha: data.fecha,
    hora: data.hora,
    cliente: data.cliente,
    telefono: data.telefono,
    vehiculo: data.vehiculo,
    servicio: data.servicio,
    mecanico: data.mecanico,
  }, 'agenda')
  return data
}

export async function actualizarTurno(id, campos) {
  const { data, error } = await supabase.from('turnos').update(campos).eq('id', id).select().single()
  if (error) throw error
  if (campos.estado) {
    dispararEvento('turno_' + campos.estado.toLowerCase(), {
      id,
      cliente: data.cliente,
      fecha: data.fecha,
      hora: data.hora,
    }, 'agenda')
  }
  return data
}

export async function eliminarTurno(id) {
  const { error } = await supabase.from('turnos').delete().eq('id', id)
  if (error) throw error
  dispararEvento('turno_cancelado', { id }, 'agenda')
}

// ============ MIGRACIÓN (localStorage → Supabase) ============
// Se corre una sola vez desde el panel Cerebro después de aplicar supabase-schema-v2.sql.
// Sube los datos locales y limpia localStorage si todo sale OK.
export function tieneDatosLocalesParaMigrar() {
  const keys = ['libra_gastos', 'libra_inventario', 'libra_inv_movimientos', 'libra_mecanicos', 'libra_agenda']
  return keys.some(k => {
    try {
      const v = JSON.parse(localStorage.getItem(k) || '[]')
      return Array.isArray(v) && v.length > 0
    } catch { return false }
  })
}

export async function migrarLocalStorageASupabase() {
  const report = { gastos: 0, insumos: 0, mecanicos: 0, turnos: 0, movimientos: 0, errores: [] }
  const safe = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }

  const gastosLS = safe('libra_gastos')
  if (gastosLS.length > 0) {
    const rows = gastosLS.map(g => ({
      fecha: g.fecha,
      categoria: g.categoria || 'Otros',
      proveedor: g.proveedor || null,
      concepto: g.concepto,
      monto: Number(g.monto) || 0,
      metodo_pago: g.metodo_pago || 'Efectivo',
    }))
    const { error } = await supabase.from('gastos').insert(rows)
    if (error) report.errores.push({ tabla: 'gastos', error: error.message })
    else report.gastos = rows.length
  }

  const insumosLS = safe('libra_inventario')
  const codigoToId = {}
  if (insumosLS.length > 0) {
    const rows = insumosLS.map(i => ({
      codigo: i.codigo,
      descripcion: i.descripcion,
      categoria: i.categoria || 'Repuestos',
      unidad: i.unidad || 'unidad',
      stock: Number(i.stock) || 0,
      stock_minimo: Number(i.stock_minimo) || 0,
      precio_unit: Number(i.precio_unit) || 0,
      proveedor: i.proveedor || null,
      ubicacion: i.ubicacion || null,
    }))
    const { data, error } = await supabase.from('insumos').insert(rows).select('id, codigo')
    if (error) report.errores.push({ tabla: 'insumos', error: error.message })
    else {
      report.insumos = data.length
      data.forEach(d => { codigoToId[d.codigo] = d.id })
    }
  }

  const movsLS = safe('libra_inv_movimientos')
  if (movsLS.length > 0 && Object.keys(codigoToId).length > 0) {
    const rows = movsLS
      .map(m => ({
        insumo_id: codigoToId[m.codigo] || null,
        codigo: m.codigo,
        descripcion: m.descripcion,
        delta: Number(m.delta) || 0,
        stock_anterior: m.stock_anterior,
        stock_nuevo: m.stock_nuevo,
        motivo: m.motivo || null,
        ts: m.ts,
      }))
      .filter(r => r.insumo_id)
    if (rows.length > 0) {
      const { error } = await supabase.from('movimientos_inventario').insert(rows)
      if (error) report.errores.push({ tabla: 'movimientos', error: error.message })
      else report.movimientos = rows.length
    }
  }

  const mecanicosLS = safe('libra_mecanicos')
  if (mecanicosLS.length > 0) {
    const existentes = await supabase.from('mecanicos').select('nombre')
    const existentesSet = new Set((existentes.data || []).map(m => m.nombre))
    const rows = mecanicosLS
      .filter(m => !existentesSet.has(m.nombre))
      .map(m => ({
        nombre: m.nombre,
        rol: m.rol || 'Mecánico',
        telefono: m.telefono || null,
        email: m.email || null,
        especialidad: m.especialidad || 'General',
        tarifa_hora: Number(m.tarifa_hora) || 0,
        activo: m.activo !== false,
      }))
    if (rows.length > 0) {
      const { error } = await supabase.from('mecanicos').insert(rows)
      if (error) report.errores.push({ tabla: 'mecanicos', error: error.message })
      else report.mecanicos = rows.length
    }
  }

  const turnosLS = safe('libra_agenda')
  if (turnosLS.length > 0) {
    const rows = turnosLS.map(t => ({
      fecha: t.fecha,
      hora: t.hora || '09:00',
      cliente: t.cliente,
      telefono: t.telefono || null,
      vehiculo: t.vehiculo || null,
      servicio: t.servicio || 'Service',
      mecanico: t.mecanico || null,
      notas: t.notas || null,
      estado: t.estado || 'Programado',
    }))
    const { error } = await supabase.from('turnos').insert(rows)
    if (error) report.errores.push({ tabla: 'turnos', error: error.message })
    else report.turnos = rows.length
  }

  if (report.errores.length === 0) {
    localStorage.removeItem('libra_gastos')
    localStorage.removeItem('libra_inventario')
    localStorage.removeItem('libra_inv_movimientos')
    localStorage.removeItem('libra_mecanicos')
    localStorage.removeItem('libra_agenda')
  }

  return report
}
