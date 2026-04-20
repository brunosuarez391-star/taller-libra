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
  // Disparar evento al Bus según categoría del vehículo
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
  // Si se marca como Finalizada, disparar ot_finalizada al Bus
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

// ============ FINANZAS (gastos locales) ============
const GASTOS_KEY = 'libra_gastos'

export function getGastos() {
  try { return JSON.parse(localStorage.getItem(GASTOS_KEY) || '[]') } catch { return [] }
}

export async function registrarGasto({ fecha, categoria, proveedor, concepto, monto, metodo_pago }) {
  const gasto = {
    id: crypto.randomUUID(),
    fecha: fecha || new Date().toISOString().slice(0, 10),
    categoria,
    proveedor,
    concepto,
    monto: Number(monto) || 0,
    metodo_pago: metodo_pago || 'Efectivo',
    created_at: new Date().toISOString(),
  }
  const prev = getGastos()
  localStorage.setItem(GASTOS_KEY, JSON.stringify([gasto, ...prev]))
  dispararEvento('gasto_registrado', gasto, 'finanzas')
  return gasto
}

export async function eliminarGasto(id) {
  const prev = getGastos()
  localStorage.setItem(GASTOS_KEY, JSON.stringify(prev.filter(g => g.id !== id)))
  dispararEvento('gasto_eliminado', { id }, 'finanzas')
}
