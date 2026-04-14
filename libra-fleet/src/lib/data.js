// Flota Acacio Lorenzo — 13 unidades Mercedes-Benz (para referencia)
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

// Precio por defecto cuando el modelo no está en la tabla
const PRECIO_DEFAULT = { mo: 300000, insumos: 200000, total: 500000 }

// Precios service 20k (s/IVA) por marca/modelo
// Mantiene los existentes de Jones SRL y agrega defaults por categoría
const PRECIOS_MODELOS = {
  // Mercedes-Benz camiones pesados — Jones SRL N°33036
  'M.B. 1634': { mo: 600000, insumos: 423946, total: 1023946 },
  'M.B. 1624': { mo: 600000, insumos: 390000, total: 990000 },
  'M.B. 1735': { mo: 600000, insumos: 450000, total: 1050000 },
  // Utilitarios Mercedes-Benz
  'M.B. Sprinter': { mo: 250000, insumos: 180000, total: 430000 },
  'Mercedes-Benz Sprinter': { mo: 250000, insumos: 180000, total: 430000 },
  // Genéricos por categoría
  '_camion_pesado': { mo: 600000, insumos: 400000, total: 1000000 },
  '_tractor': { mo: 600000, insumos: 420000, total: 1020000 },
  '_utilitario': { mo: 250000, insumos: 180000, total: 430000 },
  '_camioneta': { mo: 200000, insumos: 150000, total: 350000 },
  '_semirremolque': { mo: 350000, insumos: 100000, total: 450000 },
}

// Mantengo el export PRECIOS con un Proxy para compatibilidad con código viejo
// Si busca "M.B. 1634" lo encuentra; si no, devuelve el default
export const PRECIOS = new Proxy(PRECIOS_MODELOS, {
  get(target, prop) {
    if (prop in target) return target[prop]
    // Buscar match parcial por si viene "M.B. Sprinter 313" o similar
    const key = String(prop).toLowerCase()
    for (const k of Object.keys(target)) {
      if (k.startsWith('_')) continue
      if (key.includes(k.toLowerCase()) || k.toLowerCase().includes(key)) {
        return target[k]
      }
    }
    return PRECIO_DEFAULT
  },
  has(target, prop) {
    return prop in target || true // siempre reporta que tiene el precio (via default)
  }
})

// Función helper que devuelve el precio para un vehículo dado
// Intenta match exacto primero, después por categoría, y finalmente default
export function obtenerPrecio(vehiculo) {
  if (!vehiculo) return PRECIO_DEFAULT
  const modelo = vehiculo.modelo || ''
  const marca = vehiculo.marca || ''
  const categoria = (vehiculo.categoria || '').toLowerCase()

  // 1. Match exacto por marca + modelo
  const clave1 = `${marca} ${modelo}`.trim()
  if (PRECIOS_MODELOS[clave1]) return PRECIOS_MODELOS[clave1]

  // 2. Match por modelo solo
  if (PRECIOS_MODELOS[modelo]) return PRECIOS_MODELOS[modelo]
  if (PRECIOS_MODELOS[`M.B. ${modelo}`]) return PRECIOS_MODELOS[`M.B. ${modelo}`]

  // 3. Fallback por categoría
  if (categoria.includes('camión pesado') || categoria.includes('camion pesado')) {
    return PRECIOS_MODELOS._camion_pesado
  }
  if (categoria.includes('tractor')) return PRECIOS_MODELOS._tractor
  if (categoria.includes('utilitario')) return PRECIOS_MODELOS._utilitario
  if (categoria.includes('camioneta')) return PRECIOS_MODELOS._camioneta
  if (categoria.includes('semirremolque')) return PRECIOS_MODELOS._semirremolque

  // 4. Default
  return PRECIO_DEFAULT
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

// Categorías disponibles para vehículos — editable desde la UI
export const CATEGORIAS_VEHICULO = [
  'Camión Pesado',
  'Tractor',
  'Semirremolque',
  'Utilitario',
  'Camioneta',
  'Auto',
  'Maquinaria',
  'Otro',
]

// Marcas comunes para autocompletar
export const MARCAS_COMUNES = [
  'Mercedes-Benz',
  'Scania',
  'Volvo',
  'Iveco',
  'MAN',
  'Ford',
  'Volkswagen',
  'Renault',
  'Fiat',
  'Toyota',
  'Chevrolet',
  'DAF',
  'Hino',
  'Peugeot',
  'Citroen',
  'Isuzu',
]

export const EMPRESA = {
  nombre: 'Libra Servicios Industriales',
  cuit: '20-35658676-0',
  direccion: 'Av. del Progreso 7080, Parque Industrial',
  ciudad: 'Comodoro Rivadavia, Chubut',
  tel: '2974773784',
  email: 'bruno@librapatagonia.com',
  web: 'librapatagonia.com',
}
