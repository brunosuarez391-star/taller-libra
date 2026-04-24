-- ============================================
-- LIBRA FLEET — Esquema de base de datos
-- Libra Servicios Industriales
-- ============================================

-- Clientes
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  cuit TEXT,
  telefono TEXT,
  contacto TEXT,
  direccion TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vehículos
CREATE TABLE vehiculos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  marca TEXT DEFAULT 'Mercedes-Benz',
  modelo TEXT NOT NULL,
  tipo TEXT,
  anio INTEGER,
  categoria TEXT CHECK (categoria IN ('Camión Pesado', 'Tractor', 'Semirremolque', 'Utilitario')),
  km_actuales INTEGER DEFAULT 0,
  cliente_id UUID REFERENCES clientes(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Órdenes de Trabajo
CREATE TABLE ordenes_trabajo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ot_numero TEXT NOT NULL UNIQUE,
  vehiculo_id UUID REFERENCES vehiculos(id),
  cliente_id UUID REFERENCES clientes(id),
  km_ingreso INTEGER NOT NULL,
  km_proximo INTEGER,
  fecha DATE DEFAULT CURRENT_DATE,
  servicio_tipo TEXT DEFAULT 'service_20k',
  servicio_nombre TEXT,
  mecanico TEXT DEFAULT 'Bruno Suarez',
  estado TEXT DEFAULT 'Ingresado' CHECK (estado IN ('Ingresado', 'En proceso', 'Finalizado', 'Entregado')),
  cobrada BOOLEAN DEFAULT false,
  fecha_cobro TIMESTAMPTZ,
  observaciones TEXT,
  firma_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Servicios por OT (checklist)
CREATE TABLE servicios_ot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ot_id UUID REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  completado BOOLEAN DEFAULT false
);

-- Insumos por OT
CREATE TABLE insumos_ot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ot_id UUID REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  cantidad INTEGER DEFAULT 1,
  precio_unit NUMERIC(12,2) DEFAULT 0,
  proveedor TEXT DEFAULT 'Jones SRL'
);

-- Presupuestos
CREATE TABLE presupuestos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  cliente_id UUID REFERENCES clientes(id),
  fecha DATE DEFAULT CURRENT_DATE,
  validez_dias INTEGER DEFAULT 15,
  condicion_pago TEXT DEFAULT '30 días',
  subtotal_siva NUMERIC(14,2) DEFAULT 0,
  iva NUMERIC(14,2) DEFAULT 0,
  total_civa NUMERIC(14,2) DEFAULT 0,
  estado TEXT DEFAULT 'enviado' CHECK (estado IN ('borrador', 'enviado', 'aprobado', 'rechazado')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Items de presupuesto
CREATE TABLE items_presupuesto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE CASCADE,
  vehiculo_id UUID REFERENCES vehiculos(id),
  descripcion TEXT NOT NULL,
  mano_obra NUMERIC(12,2) DEFAULT 0,
  insumos NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0
);

-- Proveedores
CREATE TABLE proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  cuit TEXT,
  telefono TEXT,
  email TEXT,
  rubro TEXT,
  direccion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cotizaciones
CREATE TABLE cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id UUID REFERENCES proveedores(id),
  numero TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  items_json JSONB,
  total NUMERIC(14,2) DEFAULT 0,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Cliente: Acacio Lorenzo
INSERT INTO clientes (nombre, telefono, contacto) VALUES
  ('Acacio Lorenzo', '', 'Acacio Lorenzo');

-- Cliente: La Anónima
INSERT INTO clientes (nombre, telefono, contacto) VALUES
  ('La Anónima', '', 'Facundo');

-- Proveedor: Jones SRL
INSERT INTO proveedores (nombre, cuit, telefono, email, rubro, direccion) VALUES
  ('Jones Carlos Alberto y Jones Eduardo SRL', '30-71094293-1', '297-4788666', 'facturacion@jonessrl.com.ar', 'Filtros e insumos industriales', 'Juan Bilbao 281 esq. Massini, Comodoro Rivadavia');

-- Vehículos Acacio Lorenzo (13 unidades MB)
DO $$
DECLARE
  cliente_uuid UUID;
BEGIN
  SELECT id INTO cliente_uuid FROM clientes WHERE nombre = 'Acacio Lorenzo' LIMIT 1;

  INSERT INTO vehiculos (codigo, marca, modelo, tipo, categoria, cliente_id) VALUES
    ('U01', 'Mercedes-Benz', '1634', 'Balancín', 'Camión Pesado', cliente_uuid),
    ('U02', 'Mercedes-Benz', '1634', 'Balancín', 'Camión Pesado', cliente_uuid),
    ('U03', 'Mercedes-Benz', '1624', 'Balancín', 'Camión Pesado', cliente_uuid),
    ('U04', 'Mercedes-Benz', '1624', 'Balancín', 'Camión Pesado', cliente_uuid),
    ('U05', 'Mercedes-Benz', '1634', 'Semi Largo 3 Ejes', 'Tractor', cliente_uuid),
    ('U06', 'Mercedes-Benz', '1634', 'Semi Largo 3 Ejes', 'Tractor', cliente_uuid),
    ('U07', 'Mercedes-Benz', '1634', 'Semi Corto 1 Eje', 'Tractor', cliente_uuid),
    ('U08', 'Mercedes-Benz', '1634', 'Semi Corto 2 Ejes', 'Tractor', cliente_uuid),
    ('U09', 'Mercedes-Benz', '1634', 'Semi Largo 3 Ejes', 'Tractor', cliente_uuid),
    ('U10', 'Mercedes-Benz', '1634', 'Semi Largo 3 Ejes', 'Tractor', cliente_uuid),
    ('U11', 'Mercedes-Benz', '1735', 'Semi Corto 2 Ejes', 'Tractor', cliente_uuid),
    ('U12', 'Mercedes-Benz', '1634', 'Semi Largo 3 Ejes', 'Tractor', cliente_uuid),
    ('U13', 'Mercedes-Benz', '1634', 'Semi Largo 3 Ejes', 'Tractor', cliente_uuid);
END $$;

-- Cotización Jones SRL N°33036
DO $$
DECLARE
  jones_uuid UUID;
BEGIN
  SELECT id INTO jones_uuid FROM proveedores WHERE cuit = '30-71094293-1' LIMIT 1;

  INSERT INTO cotizaciones (proveedor_id, numero, fecha, items_json, total) VALUES
    (jones_uuid, '33036', '2026-03-30', '[
      {"descripcion": "Filtro aire MB 1634 OM457", "precio": 63028},
      {"descripcion": "Filtro aceite MB 1634 OM457", "precio": 20447},
      {"descripcion": "Aceite motor MB 1634 OM457", "precio": 261212},
      {"descripcion": "Filtro combustible MB 1634 OM457", "precio": 30088},
      {"descripcion": "Trampa agua MB 1634 OM457", "precio": 49170}
    ]'::jsonb, 423946);
END $$;

-- ============================================
-- PERMISOS (RLS deshabilitado para desarrollo)
-- ============================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_ot ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos_ot ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

-- Política pública para desarrollo (cambiar en producción)
CREATE POLICY "Allow all" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON vehiculos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON ordenes_trabajo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON servicios_ot FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON insumos_ot FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON presupuestos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON items_presupuesto FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON proveedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cotizaciones FOR ALL USING (true) WITH CHECK (true);
