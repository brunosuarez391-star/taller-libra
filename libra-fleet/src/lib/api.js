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

export async function crearVehiculo(vehiculo) {
  const { data, error } = await supabase
    .from('vehiculos')
    .insert(vehiculo)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarVehiculo(vehiculoId, campos) {
  const { error } = await supabase
    .from('vehiculos')
    .update(campos)
    .eq('id', vehiculoId)
  if (error) throw error
}

export async function eliminarVehiculo(vehiculoId) {
  const { error } = await supabase.from('vehiculos').delete().eq('id', vehiculoId)
  if (error) throw error
}

export async function crearCliente(cliente) {
  const { data, error } = await supabase
    .from('clientes')
    .insert(cliente)
    .select()
    .single()
  if (error) throw error
  return data
}

// ============ ORDENES DE TRABAJO ============
export async function getOrdenes() {
  const { data, error } = await supabase.from('ordenes_trabajo').select('*, vehiculos(codigo, modelo, tipo, marca, categoria), clientes(nombre, telefono), insumos_ot(*)').order('created_at', { ascending: false })
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

  // Si la OT se marca como Finalizado, disparar webhook de notificación WhatsApp
  if (estado === 'Finalizado') {
    try {
      await notificarOTFinalizada(otId)
    } catch (e) {
      console.warn('[OT] Estado actualizado pero falló notificación:', e.message)
    }
  }
}

async function notificarOTFinalizada(otId) {
  // Cargar OT completa con vehículo y cliente
  const { data: ot } = await supabase
    .from('ordenes_trabajo')
    .select('*, vehiculos(codigo, modelo, marca), clientes(nombre, telefono)')
    .eq('id', otId)
    .single()

  if (!ot) return

  const vehiculoLabel = ot.vehiculos
    ? `${ot.vehiculos.codigo} ${ot.vehiculos.marca || ''} ${ot.vehiculos.modelo || ''}`.trim()
    : 'Vehículo sin datos'

  const payload = {
    ot_numero: ot.ot_numero,
    cliente: ot.clientes?.nombre || 'Cliente',
    vehiculo: vehiculoLabel,
    servicio: ot.servicio_nombre || ot.servicio_tipo || 'Servicio',
    telefono: ot.clientes?.telefono || '',
  }

  // Disparar webhook n8n (fire-and-forget — no bloquear UI si falla)
  const webhookUrl = 'https://brunosuerez.app.n8n.cloud/webhook/ot-finalizada'
  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(e => console.warn('[OT] Webhook notificación falló:', e.message))
}

export async function actualizarOT(otId, campos) {
  const { error } = await supabase.from('ordenes_trabajo').update({ ...campos, updated_at: new Date().toISOString() }).eq('id', otId)
  if (error) throw error

  // Si el campo actualizado incluye cambio a Finalizado, disparar notificación
  if (campos.estado === 'Finalizado') {
    try {
      await notificarOTFinalizada(otId)
    } catch (e) {
      console.warn('[OT] Actualizada pero falló notificación:', e.message)
    }
  }
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

// ============ INSUMOS OT (trabajos extras / reparaciones con precios) ============
export async function crearInsumosOT(otId, items) {
  const filas = items.map(it => ({
    ot_id: otId,
    descripcion: it.descripcion,
    cantidad: it.cantidad || 1,
    precio_unit: it.precio_unit || 0,
    proveedor: it.proveedor || '',
  }))
  const { error } = await supabase.from('insumos_ot').insert(filas)
  if (error) throw error
}

// ============ PRESUPUESTOS ============
export async function getPresupuestos() {
  const { data, error } = await supabase
    .from('presupuestos')
    .select('*, clientes(nombre, telefono), items_presupuesto(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function crearPresupuesto(presupuesto) {
  const { data, error } = await supabase.from('presupuestos').insert(presupuesto).select().single()
  if (error) throw error
  return data
}

/**
 * Crea un presupuesto completo con sus items en una sola llamada.
 * payload = {
 *   numero, cliente_id, vehiculo_id?, fecha, subtotal_siva, iva, total_civa,
 *   estado, observaciones?, items: [{ descripcion, cantidad, precio_unit, total }]
 * }
 */
export async function crearPresupuestoCompleto(payload) {
  const { items = [], vehiculo_id, ...cabecera } = payload
  const { data: presupuesto, error: e1 } = await supabase
    .from('presupuestos')
    .insert(cabecera)
    .select()
    .single()
  if (e1) throw e1

  if (items.length > 0) {
    const filas = items.map(it => ({
      presupuesto_id: presupuesto.id,
      vehiculo_id: vehiculo_id || null,
      descripcion: it.descripcion,
      mano_obra: 0,
      insumos: 0,
      total: (it.cantidad || 1) * (it.precio_unit || it.precio || 0),
    }))
    const { error: e2 } = await supabase.from('items_presupuesto').insert(filas)
    if (e2) {
      // Rollback — eliminar la cabecera si los items fallaron
      await supabase.from('presupuestos').delete().eq('id', presupuesto.id)
      throw e2
    }
  }

  return presupuesto
}

export async function actualizarEstadoPresupuesto(id, estado) {
  const { error } = await supabase
    .from('presupuestos')
    .update({ estado })
    .eq('id', id)
  if (error) throw error
}

export async function actualizarRemitoPresupuesto(id, remito_numero, remito_fecha) {
  const { error } = await supabase
    .from('presupuestos')
    .update({ remito_numero: remito_numero || null, remito_fecha: remito_fecha || null })
    .eq('id', id)
  if (error) throw error
}

export async function actualizarRemitoOT(id, remito_numero, remito_fecha) {
  const { error } = await supabase
    .from('ordenes_trabajo')
    .update({ remito_numero: remito_numero || null, remito_fecha: remito_fecha || null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function eliminarPresupuesto(id) {
  const { error: e1 } = await supabase.from('items_presupuesto').delete().eq('presupuesto_id', id)
  if (e1) throw e1
  const { error: e2 } = await supabase.from('presupuestos').delete().eq('id', id)
  if (e2) throw e2
}
