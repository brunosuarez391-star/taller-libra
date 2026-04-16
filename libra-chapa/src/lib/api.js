import { supabase } from './supabase'

// ============ CLIENTES (compartidos con libra-fleet) ============
export async function getClientes() {
  const { data, error } = await supabase.from('clientes').select('*').order('nombre')
  if (error) throw error
  return data
}

export async function crearCliente(cliente) {
  const { data, error } = await supabase.from('clientes').insert(cliente).select().single()
  if (error) throw error
  return data
}

// ============ PRESUPUESTOS CHAPA ============
export async function getPresupuestosChapa() {
  const { data, error } = await supabase
    .from('presupuestos_chapa')
    .select('*, clientes(nombre, telefono)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function crearPresupuestoChapa(presupuesto) {
  const { data, error } = await supabase
    .from('presupuestos_chapa')
    .insert(presupuesto)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarEstadoChapa(id, estado) {
  const { error } = await supabase
    .from('presupuestos_chapa')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function actualizarRemitoChapa(id, remito_numero, remito_fecha) {
  const { error } = await supabase
    .from('presupuestos_chapa')
    .update({ remito_numero, remito_fecha, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function eliminarPresupuestoChapa(id) {
  const { error } = await supabase.from('presupuestos_chapa').delete().eq('id', id)
  if (error) throw error
}
