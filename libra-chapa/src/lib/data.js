export const EMPRESA = {
  nombre: 'Libra Chapa y Pintura',
  razon: 'Libra Servicios Industriales',
  cuit: '20-35658676-0',
  direccion: 'Av. del Progreso 7080, Parque Industrial',
  ciudad: 'Comodoro Rivadavia, Chubut',
  tel: '2974773784',
  whatsapp: '542974773784',
  email: 'bruno@librapatagonia.com',
  instagram: '@chapaypinturaslibra',
  web: 'librapatagonia.com',
}

export const PANELES = [
  { id: 'capot', nombre: 'Capó', paneles: 2, zona: 'Frente' },
  { id: 'paragolpes_del', nombre: 'Paragolpes delantero', paneles: 1, zona: 'Frente' },
  { id: 'paragolpes_tras', nombre: 'Paragolpes trasero', paneles: 1, zona: 'Atrás' },
  { id: 'puerta_di', nombre: 'Puerta delantera izquierda', paneles: 1, zona: 'Lateral izq.' },
  { id: 'puerta_dd', nombre: 'Puerta delantera derecha', paneles: 1, zona: 'Lateral der.' },
  { id: 'puerta_ti', nombre: 'Puerta trasera izquierda', paneles: 1, zona: 'Lateral izq.' },
  { id: 'puerta_td', nombre: 'Puerta trasera derecha', paneles: 1, zona: 'Lateral der.' },
  { id: 'guardabarros_di', nombre: 'Guardabarros delantero izq.', paneles: 1, zona: 'Lateral izq.' },
  { id: 'guardabarros_dd', nombre: 'Guardabarros delantero der.', paneles: 1, zona: 'Lateral der.' },
  { id: 'lateral_izq', nombre: 'Lateral izquierdo (completo)', paneles: 2, zona: 'Lateral izq.' },
  { id: 'lateral_der', nombre: 'Lateral derecho (completo)', paneles: 2, zona: 'Lateral der.' },
  { id: 'techo', nombre: 'Techo', paneles: 2, zona: 'Superior' },
  { id: 'baul', nombre: 'Baúl / Portón trasero', paneles: 1, zona: 'Atrás' },
  { id: 'zocalo_izq', nombre: 'Zócalo izquierdo', paneles: 1, zona: 'Lateral izq.' },
  { id: 'zocalo_der', nombre: 'Zócalo derecho', paneles: 1, zona: 'Lateral der.' },
]

export const TIPOS_TRABAJO = [
  { id: 'abolladuras', nombre: 'Reparación de abolladuras', icon: '🔨' },
  { id: 'rayones', nombre: 'Reparación de rayones', icon: '✏️' },
  { id: 'pintura_parcial', nombre: 'Pintura parcial (paneles)', icon: '🎨' },
  { id: 'pintura_completa', nombre: 'Pintura completa', icon: '🖌️' },
  { id: 'pulido', nombre: 'Pulido y lustrado', icon: '✨' },
  { id: 'antirroide', nombre: 'Tratamiento antirroide', icon: '🛡️' },
  { id: 'choque', nombre: 'Reparación por choque', icon: '💥' },
  { id: 'otro', nombre: 'Otro', icon: '🔧' },
]

export const COMPLEJIDAD = [
  { id: 'leve', nombre: 'Leve', desc: 'Rayón superficial, abolladura chica', multiplicador: 0.7 },
  { id: 'media', nombre: 'Media', desc: 'Abolladura mediana, pintura descascarada', multiplicador: 1.0 },
  { id: 'alta', nombre: 'Alta', desc: 'Daño profundo, chapa deformada, fibra rota', multiplicador: 1.4 },
]

export const ESTADOS = ['Cotizado', 'Aprobado', 'En trabajo', 'Terminado', 'Entregado']
