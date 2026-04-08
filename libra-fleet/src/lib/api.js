import { supabase } from './supabase'

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
  const { data, error } = await supabase.from('ordenes_trabajo').insert(orden).select().single()
  if (error) throw error
  return data
}

export async function actualizarEstadoOT(otId, estado) {
  const { error } = await supabase.from('ordenes_trabajo').update({ estado, updated_at: new Date().toISOString() }).eq('id', otId)
  if (error) throw error
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
  const { data, error } = await supabase.from('presupuestos').insert(presupuesto).select().single()
  if (error) throw error
  return data
}
