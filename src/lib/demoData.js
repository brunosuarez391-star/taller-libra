// Datos demo para desarrollo sin Supabase
// Flota actual de Acacio Lorenzo

export const vehiculosDemo = [
  { id: 'U01', codigo: 'U01', marca: 'Mercedes-Benz', modelo: '1634 Balancín', anio: 2018, categoria: 'Camión Pesado', km_actuales: 85320, estado: 'activo', cliente: 'Acacio Lorenzo' },
  { id: 'U02', codigo: 'U02', marca: 'Mercedes-Benz', modelo: '1634 Balancín', anio: 2019, categoria: 'Camión Pesado', km_actuales: 72100, estado: 'activo', cliente: 'Acacio Lorenzo' },
  { id: 'U03', codigo: 'U03', marca: 'Mercedes-Benz', modelo: '1624 Balancín', anio: 2017, categoria: 'Camión Pesado', km_actuales: 91500, estado: 'mantenimiento', cliente: 'Acacio Lorenzo' },
  { id: 'U04', codigo: 'U04', marca: 'Mercedes-Benz', modelo: '1624 Balancín', anio: 2018, categoria: 'Camión Pesado', km_actuales: 68200, estado: 'activo', cliente: 'Acacio Lorenzo' },
  { id: 'U05', codigo: 'U05', marca: 'Mercedes-Benz', modelo: '1634 Semi Largo 3 Ejes', anio: 2020, categoria: 'Tractor', km_actuales: 55800, estado: 'activo', cliente: 'Acacio Lorenzo' },
  { id: 'U06', codigo: 'U06', marca: 'Mercedes-Benz', modelo: '1634 Semi Largo 3 Ejes', anio: 2019, categoria: 'Tractor', km_actuales: 63400, estado: 'activo', cliente: 'Acacio Lorenzo' },
  { id: 'U07', codigo: 'U07', marca: 'Mercedes-Benz', modelo: '1634 Semi Corto 1 Eje', anio: 2018, categoria: 'Tractor', km_actuales: 78900, estado: 'activo', cliente: 'Acacio Lorenzo' },
  { id: 'U08', codigo: 'U08', marca: 'Mercedes-Benz', modelo: '1634 Semi Corto 2 Ejes', anio: 2019, categoria: 'Tractor', km_actuales: 45600, estado: 'activo', cliente: 'Acacio Lorenzo' },
  { id: 'U09', codigo: 'U09', marca: 'Mercedes-Benz', modelo: '1634 Semi Largo 3 Ejes', anio: 2020, categoria: 'Tractor', km_actuales: 52300, estado: 'activo', cliente: 'Acacio Lorenzo' },
  { id: 'U10', codigo: 'U10', marca: 'Mercedes-Benz', modelo: '1634 Semi Largo 3 Ejes', anio: 2018, categoria: 'Tractor', km_actuales: 88100, estado: 'mantenimiento', cliente: 'Acacio Lorenzo' },
  { id: 'U11', codigo: 'U11', marca: 'Mercedes-Benz', modelo: '1735 Semi Corto 2 Ejes', anio: 2021, categoria: 'Tractor', km_actuales: 34200, estado: 'activo', cliente: 'Acacio Lorenzo' },
  { id: 'U12', codigo: 'U12', marca: 'Mercedes-Benz', modelo: '1634 Semi Largo 3 Ejes', anio: 2019, categoria: 'Tractor', km_actuales: 71800, estado: 'activo', cliente: 'Acacio Lorenzo' },
  { id: 'U13', codigo: 'U13', marca: 'Mercedes-Benz', modelo: '1634 Semi Largo 3 Ejes', anio: 2020, categoria: 'Tractor', km_actuales: 48900, estado: 'activo', cliente: 'Acacio Lorenzo' },
]

export const serviciosService20k = [
  'Cambio de aceite motor + filtro de aceite',
  'Reemplazo filtro de aire y filtro de combustible',
  'Inspección y engrase general de puntos de lubricación',
  'Control y ajuste de frenos (tambores/discos según modelo)',
  'Revisión sistema de refrigeración y niveles',
  'Limpieza exterior con hidrolavadora',
  'Diagnóstico general del vehículo',
  'Material, transporte y mano de obra incluidos',
]

export const ordenesTrabajoDemo = [
  {
    id: 'OT-2026-001',
    vehiculo_id: 'U05',
    km_ingreso: 85320,
    fecha: '2026-04-06',
    mecanico: 'Bruno Suarez',
    servicios: [
      'Cambio de aceite motor + filtro de aceite',
      'Reemplazo filtro de aire y filtro de combustible',
      'Inspección y engrase general de puntos de lubricación',
      'Control y ajuste de frenos (tambores/discos según modelo)',
      'Limpieza exterior con hidrolavadora',
    ],
    observaciones: 'Service 20.000 km programado. Sin novedades adicionales.',
    estado: 'finalizado',
    km_proximo_service: 105320,
  },
  {
    id: 'OT-2026-002',
    vehiculo_id: 'U03',
    km_ingreso: 91500,
    fecha: '2026-04-05',
    mecanico: 'Bruno Suarez',
    servicios: [
      'Cambio de aceite motor + filtro de aceite',
      'Reemplazo filtro de aire y filtro de combustible',
      'Diagnóstico general del vehículo',
    ],
    observaciones: 'Se detectó desgaste en pastillas de freno. Programar cambio.',
    estado: 'en_proceso',
    km_proximo_service: 111500,
  },
]

let nextOTNumber = 3

export function generarIdOT() {
  const id = `OT-2026-${String(nextOTNumber).padStart(3, '0')}`
  nextOTNumber++
  return id
}
