export const HOTEL = {
  name: 'Hotel Luque',
  city: 'Comodoro Rivadavia',
  province: 'Chubut',
  country: 'Argentina',
  totalRooms: 60,
  floors: 4,
  roomsPerFloor: 15,
  currency: 'ARS',
  taxRate: 0.21,
}

export const ROOM_TYPES = {
  individual: {
    key: 'individual',
    label: 'Individual',
    capacity: 1,
    rate: 45000,
    amenities: ['WiFi', 'TV', 'Baño privado', 'Calefacción'],
  },
  doble: {
    key: 'doble',
    label: 'Doble',
    capacity: 2,
    rate: 65000,
    amenities: ['WiFi', 'TV', 'Baño privado', 'Calefacción', 'Frigobar'],
  },
  triple: {
    key: 'triple',
    label: 'Triple',
    capacity: 3,
    rate: 85000,
    amenities: ['WiFi', 'TV', 'Baño privado', 'Calefacción', 'Frigobar'],
  },
  suite: {
    key: 'suite',
    label: 'Suite',
    capacity: 4,
    rate: 125000,
    amenities: ['WiFi', 'Smart TV', 'Baño privado', 'Calefacción', 'Frigobar', 'Jacuzzi', 'Vista al mar'],
  },
}

export const ROOM_STATUS = {
  disponible: { label: 'Disponible', color: '#10b981', bg: '#052e2a' },
  ocupada: { label: 'Ocupada', color: '#38bdf8', bg: '#0c2d3f' },
  reservada: { label: 'Reservada', color: '#a78bfa', bg: '#231a3d' },
  limpieza: { label: 'Limpieza', color: '#fbbf24', bg: '#2a2109' },
  mantenimiento: { label: 'Mantenimiento', color: '#fb923c', bg: '#2a1609' },
  fuera_servicio: { label: 'Fuera de servicio', color: '#64748b', bg: '#1e293b' },
}

export const RESERVATION_STATUS = {
  pendiente: { label: 'Pendiente', color: '#fbbf24' },
  confirmada: { label: 'Confirmada', color: '#a78bfa' },
  en_curso: { label: 'En curso', color: '#38bdf8' },
  finalizada: { label: 'Finalizada', color: '#10b981' },
  cancelada: { label: 'Cancelada', color: '#f87171' },
}

export const PAYMENT_METHODS = [
  'Efectivo',
  'Transferencia',
  'Tarjeta de Crédito',
  'Tarjeta de Débito',
  'Mercado Pago',
]

export const EXTRA_SERVICES = [
  { key: 'desayuno', label: 'Desayuno', price: 6500 },
  { key: 'almuerzo', label: 'Almuerzo', price: 12500 },
  { key: 'cena', label: 'Cena', price: 14000 },
  { key: 'lavanderia', label: 'Lavandería', price: 8000 },
  { key: 'minibar', label: 'Consumo minibar', price: 0 },
  { key: 'estacionamiento', label: 'Estacionamiento', price: 4000 },
  { key: 'spa', label: 'Spa / Masajes', price: 22000 },
  { key: 'traslado', label: 'Traslado al aeropuerto', price: 15000 },
]

function typeForPosition(pos) {
  if (pos <= 4) return 'individual'
  if (pos <= 10) return 'doble'
  if (pos <= 13) return 'triple'
  return 'suite'
}

export function buildInitialRooms() {
  const rooms = []
  for (let floor = 1; floor <= HOTEL.floors; floor++) {
    for (let pos = 1; pos <= HOTEL.roomsPerFloor; pos++) {
      const number = floor * 100 + pos
      const type = typeForPosition(pos)
      rooms.push({
        id: `R${number}`,
        number,
        floor,
        type,
        status: 'disponible',
        notes: '',
      })
    }
  }
  return rooms
}

export const SEED_GUESTS = [
  {
    id: 'G1',
    firstName: 'María',
    lastName: 'González',
    dni: '28456789',
    phone: '+54 297 412-3456',
    email: 'maria.gonzalez@example.com',
    address: 'Av. Rivadavia 1234, Buenos Aires',
    nationality: 'Argentina',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'G2',
    firstName: 'Juan',
    lastName: 'Martínez',
    dni: '30123456',
    phone: '+54 11 5678-1234',
    email: 'juan.martinez@example.com',
    address: 'Belgrano 567, Rosario',
    nationality: 'Argentina',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'G3',
    firstName: 'Carla',
    lastName: 'Silva',
    dni: '35987654',
    phone: '+55 11 9876-5432',
    email: 'carla.silva@example.com',
    address: 'Av. Paulista 500, São Paulo',
    nationality: 'Brasil',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
]
