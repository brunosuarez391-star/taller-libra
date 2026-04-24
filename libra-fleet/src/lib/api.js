import { supabase } from './supabase'

// ============ BUS DE EVENTOS (n8n) ============
const BUS_URL = 'https://brunosuerez.app.n8n.cloud/webhook/taller-libra-bus'

export async function dispararEvento(evento, datos = {}, origen = 'libra_fleet_app') {
  try {
    const res = await fetch(BUS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evento, datos, origen })
    })
    return await res.json().catch(() => ({ status: 'ok' }))
  } catch (err) {
    console.warn('Bus no respondió:', err.message)
    return { status: 'bus_offline' }
  }
}

// ============ CLIENTES ============
export async function getClientes() {
  const { data, error } = await supabase.from('clientes').select('*').order('nombre')
  if (error) throw error
  return data
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

// ============ ARCHIVOS OT (Google Drive) ============
export async function listArchivosOT(otId) {
  const { data, error } = await supabase
    .from('archivos_ot')
    .select('*')
    .eq('ot_id', otId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function crearArchivoOT(archivo) {
  const { data, error } = await supabase
    .from('archivos_ot')
    .insert(archivo)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function eliminarArchivoOT(id) {
  const { error } = await supabase.from('archivos_ot').delete().eq('id', id)
  if (error) throw error
}

// ============ PRESUPUESTOS ============
export async function getPresupuestos() {
  const { data, error } = await supabase.from('presupuestos').select('*, clientes(nombre)').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function crearPresupuesto(presupuesto) {
  const { data, error } = await supabase.from('presupuestos').insert(presupuesto).select().single()
  if (error) throw error
  return data
}
