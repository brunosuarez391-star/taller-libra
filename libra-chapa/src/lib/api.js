import { supabase } from './supabase'

// ============ BUS DE EVENTOS (n8n) ============
const BUS_URL = 'https://brunosuerez.app.n8n.cloud/webhook/taller-libra-bus'

export async function dispararEvento(evento, datos = {}, origen = 'libra_chapa_app') {
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
    .select('*, clientes(nombre, telefono)')
    .single()
  if (error) throw error
  // Disparar al Bus
  dispararEvento('presupuesto_chapa_solicitado', {
    numero: data.numero,
    cliente: data.clientes?.nombre,
    telefono: data.clientes?.telefono,
    vehiculo: data.vehiculo,
    patente: data.patente,
    trabajo: data.trabajo,
    total: data.total,
  })
  return data
}

export async function actualizarEstadoChapa(id, estado) {
  const { data, error } = await supabase
    .from('presupuestos_chapa')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, clientes(nombre, telefono)')
    .single()
  if (error) throw error
  // Si se aprueba, disparar evento
  if (estado === 'aprobado') {
    dispararEvento('presupuesto_aprobado', {
      numero: data.numero,
      cliente: data.clientes?.nombre,
      telefono: data.clientes?.telefono,
      vehiculo: data.vehiculo,
      trabajo: data.trabajo,
      total: data.total,
      tipo: 'chapa_pintura',
    })
  }
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
