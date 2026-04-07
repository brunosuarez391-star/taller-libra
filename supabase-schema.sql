-- Libra Fleet - Schema Supabase (PostgreSQL)
-- Ejecutar en el SQL Editor de Supabase

-- Vehículos
CREATE TABLE vehiculos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  marca TEXT NOT NULL DEFAULT 'Mercedes-Benz',
  modelo TEXT NOT NULL,
  anio INTEGER,
  categoria TEXT NOT NULL CHECK (categoria IN ('Camión Pesado', 'Tractor', 'Semirremolque')),
  km_actuales INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'mantenimiento', 'inactivo')),
  cliente TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Órdenes de Trabajo
CREATE TABLE ordenes_trabajo (
  id TEXT PRIMARY KEY, -- OT-2026-001
  vehiculo_id UUID REFERENCES vehiculos(id),
  km_ingreso INTEGER NOT NULL,
  km_proximo_service INTEGER,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  mecanico TEXT NOT NULL,
  servicios TEXT[] NOT NULL DEFAULT '{}',
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'ingresado' CHECK (estado IN ('ingresado', 'en_proceso', 'finalizado', 'entregado')),
  firma_cliente TEXT, -- base64 de la firma digital
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de kilometraje
CREATE TABLE historial_km (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehiculo_id UUID REFERENCES vehiculos(id),
  km INTEGER NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  origen TEXT DEFAULT 'manual' -- 'manual' | 'ot'
);

-- Habilitar RLS
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_km ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de lectura (para la página del QR)
CREATE POLICY "Lectura pública de vehículos" ON vehiculos FOR SELECT USING (true);
CREATE POLICY "Lectura pública de OTs" ON ordenes_trabajo FOR SELECT USING (true);
CREATE POLICY "Lectura pública de historial km" ON historial_km FOR SELECT USING (true);

-- Políticas de escritura para usuarios autenticados
CREATE POLICY "CRUD autenticado vehiculos" ON vehiculos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "CRUD autenticado OTs" ON ordenes_trabajo FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "CRUD autenticado historial" ON historial_km FOR ALL USING (auth.role() = 'authenticated');

-- Datos iniciales: Flota Acacio Lorenzo
INSERT INTO vehiculos (codigo, marca, modelo, anio, categoria, km_actuales, estado, cliente) VALUES
  ('U01', 'Mercedes-Benz', '1634 Balancín', 2018, 'Camión Pesado', 85320, 'activo', 'Acacio Lorenzo'),
  ('U02', 'Mercedes-Benz', '1634 Balancín', 2019, 'Camión Pesado', 72100, 'activo', 'Acacio Lorenzo'),
  ('U03', 'Mercedes-Benz', '1624 Balancín', 2017, 'Camión Pesado', 91500, 'mantenimiento', 'Acacio Lorenzo'),
  ('U04', 'Mercedes-Benz', '1624 Balancín', 2018, 'Camión Pesado', 68200, 'activo', 'Acacio Lorenzo'),
  ('U05', 'Mercedes-Benz', '1634 Semi Largo 3 Ejes', 2020, 'Tractor', 55800, 'activo', 'Acacio Lorenzo'),
  ('U06', 'Mercedes-Benz', '1634 Semi Largo 3 Ejes', 2019, 'Tractor', 63400, 'activo', 'Acacio Lorenzo'),
  ('U07', 'Mercedes-Benz', '1634 Semi Corto 1 Eje', 2018, 'Tractor', 78900, 'activo', 'Acacio Lorenzo'),
  ('U08', 'Mercedes-Benz', '1634 Semi Corto 2 Ejes', 2019, 'Tractor', 45600, 'activo', 'Acacio Lorenzo'),
  ('U09', 'Mercedes-Benz', '1634 Semi Largo 3 Ejes', 2020, 'Tractor', 52300, 'activo', 'Acacio Lorenzo'),
  ('U10', 'Mercedes-Benz', '1634 Semi Largo 3 Ejes', 2018, 'Tractor', 88100, 'mantenimiento', 'Acacio Lorenzo'),
  ('U11', 'Mercedes-Benz', '1735 Semi Corto 2 Ejes', 2021, 'Tractor', 34200, 'activo', 'Acacio Lorenzo'),
  ('U12', 'Mercedes-Benz', '1634 Semi Largo 3 Ejes', 2019, 'Tractor', 71800, 'activo', 'Acacio Lorenzo'),
  ('U13', 'Mercedes-Benz', '1634 Semi Largo 3 Ejes', 2020, 'Tractor', 48900, 'activo', 'Acacio Lorenzo');
