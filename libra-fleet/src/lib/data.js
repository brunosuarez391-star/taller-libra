// Flota Acacio Lorenzo — 13 unidades Mercedes-Benz
export const FLOTA_ACACIO = [
  { codigo: 'U01', modelo: 'M.B. 1634', tipo: 'Balancín', categoria: 'Camión Pesado' },
  { codigo: 'U02', modelo: 'M.B. 1634', tipo: 'Balancín', categoria: 'Camión Pesado' },
  { codigo: 'U03', modelo: 'M.B. 1624', tipo: 'Balancín', categoria: 'Camión Pesado' },
  { codigo: 'U04', modelo: 'M.B. 1624', tipo: 'Balancín', categoria: 'Camión Pesado' },
  { codigo: 'U05', modelo: 'M.B. 1634', tipo: 'Semi Largo 3 Ejes', categoria: 'Tractor' },
  { codigo: 'U06', modelo: 'M.B. 1634', tipo: 'Semi Largo 3 Ejes', categoria: 'Tractor' },
  { codigo: 'U07', modelo: 'M.B. 1634', tipo: 'Semi Corto 1 Eje', categoria: 'Tractor' },
  { codigo: 'U08', modelo: 'M.B. 1634', tipo: 'Semi Corto 2 Ejes', categoria: 'Tractor' },
  { codigo: 'U09', modelo: 'M.B. 1634', tipo: 'Semi Largo 3 Ejes', categoria: 'Tractor' },
  { codigo: 'U10', modelo: 'M.B. 1634', tipo: 'Semi Largo 3 Ejes', categoria: 'Tractor' },
  { codigo: 'U11', modelo: 'M.B. 1735', tipo: 'Semi Corto 2 Ejes', categoria: 'Tractor' },
  { codigo: 'U12', modelo: 'M.B. 1634', tipo: 'Semi Largo 3 Ejes', categoria: 'Tractor' },
  { codigo: 'U13', modelo: 'M.B. 1634', tipo: 'Semi Largo 3 Ejes', categoria: 'Tractor' },
]

// Precios service 20k (s/IVA) — Cotización Jones SRL N°33036
export const PRECIOS = {
  'M.B. 1634': { mo: 600000, insumos: 423946, total: 1023946 },
  'M.B. 1624': { mo: 600000, insumos: 390000, total: 990000 },
  'M.B. 1735': { mo: 600000, insumos: 450000, total: 1050000 },
}

export const SERVICIOS = {
  service_20k: {
    nombre: 'Service 20.000 km',
    items: [
      'Cambio de aceite motor + filtro de aceite',
      'Reemplazo filtro de aire y filtro de combustible',
      'Inspección y engrase general de puntos de lubricación',
      'Control y ajuste de frenos (tambores/discos según modelo)',
      'Revisión sistema de refrigeración y niveles',
      'Limpieza exterior con hidrolavadora',
      'Diagnóstico general del vehículo',
      'Material, transporte y mano de obra incluidos',
    ],
    tiempo: '6-8 horas',
  },
  service_50k: {
    nombre: 'Service 50.000 km',
    items: [
      'Todo lo incluido en Service 20.000 km',
      'Cambio líquido refrigerante',
      'Cambio filtro secador de aire',
      'Regulación de válvulas',
      'Revisión suspensión completa',
    ],
    tiempo: '10-14 horas',
  },
  service_100k: {
    nombre: 'Service 100.000 km',
    items: [
      'Todo lo incluido en Service 50.000 km',
      'Cambio de correas',
      'Revisión turbo',
      'Cambio rodamientos de mazas',
      'Revisión caja y diferencial',
    ],
    tiempo: '20-30 horas',
  },
}

export const ESTADOS_OT = ['Ingresado', 'En proceso', 'Finalizado', 'Entregado']

export const EMPRESA = {
  nombre: 'Libra Servicios Industriales',
  cuit: '20-35658676-0',
  direccion: 'Av. del Progreso 7080, Parque Industrial',
  ciudad: 'Comodoro Rivadavia, Chubut',
  tel: '2974773784',
  email: 'bruno@librapatagonia.com',
  web: 'librapatagonia.com',
}
