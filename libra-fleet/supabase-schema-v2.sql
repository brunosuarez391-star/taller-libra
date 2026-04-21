-- ============================================
-- LIBRA FLEET — Esquema v2 (Supabase)
-- Migración de sectores locales a Supabase:
-- Gastos, Inventario, Movimientos, Mecánicos, Turnos (Agenda)
--
-- Ejecutar en: Supabase dashboard → SQL Editor → New query → paste → Run
-- Solo una vez. Es idempotente (usa IF NOT EXISTS).
-- ============================================

-- Gastos
CREATE TABLE IF NOT EXISTS gastos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria TEXT NOT NULL DEFAULT 'Otros',
  proveedor TEXT,
  concepto TEXT NOT NULL,
  monto NUMERIC(14,2) NOT NULL DEFAULT 0,
  metodo_pago TEXT DEFAULT 'Efectivo',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha DESC);

-- Insumos (inventario)
CREATE TABLE IF NOT EXISTS insumos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL,
  categoria TEXT DEFAULT 'Repuestos',
  unidad TEXT DEFAULT 'unidad',
  stock INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER DEFAULT 0,
  precio_unit NUMERIC(12,2) DEFAULT 0,
  proveedor TEXT,
  ubicacion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insumos_codigo ON insumos(codigo);
CREATE INDEX IF NOT EXISTS idx_insumos_categoria ON insumos(categoria);

-- Movimientos de inventario (auditoría de ajustes)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insumo_id UUID REFERENCES insumos(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ DEFAULT now(),
  codigo TEXT,
  descripcion TEXT,
  delta INTEGER NOT NULL,
  stock_anterior INTEGER,
  stock_nuevo INTEGER,
  motivo TEXT
);
CREATE INDEX IF NOT EXISTS idx_mov_insumo_ts ON movimientos_inventario(insumo_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_mov_ts ON movimientos_inventario(ts DESC);

-- Mecánicos
CREATE TABLE IF NOT EXISTS mecanicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol TEXT DEFAULT 'Mecánico',
  telefono TEXT,
  email TEXT,
  especialidad TEXT DEFAULT 'General',
  tarifa_hora NUMERIC(12,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Turnos (agenda)
CREATE TABLE IF NOT EXISTS turnos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  hora TEXT NOT NULL DEFAULT '09:00',
  cliente TEXT NOT NULL,
  telefono TEXT,
  vehiculo TEXT,
  servicio TEXT DEFAULT 'Service',
  mecanico TEXT,
  notas TEXT,
  estado TEXT DEFAULT 'Programado' CHECK (estado IN ('Programado','Confirmado','Enproceso','Completado','Cancelado')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha_hora ON turnos(fecha, hora);

-- Leads (contactos entrantes desde marketing / web / WhatsApp)
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ts TIMESTAMPTZ DEFAULT now(),
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  fuente TEXT DEFAULT 'Web' CHECK (fuente IN ('Web','Facebook','Instagram','WhatsApp','Telefono','Referido','Otro')),
  mensaje TEXT,
  estado TEXT DEFAULT 'Nuevo' CHECK (estado IN ('Nuevo','Contactado','Presupuestado','Convertido','Descartado'))
);
CREATE INDEX IF NOT EXISTS idx_leads_ts ON leads(ts DESC);
CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads(estado);

-- ============================================
-- Seed: Bruno Suarez como Jefe de Taller
-- ============================================
INSERT INTO mecanicos (nombre, rol, telefono, email, especialidad, tarifa_hora, activo)
SELECT 'Bruno Suarez', 'Jefe de Taller', '2974773784', 'bruno@librapatagonia.com', 'Motor pesado MB', 100000, true
WHERE NOT EXISTS (SELECT 1 FROM mecanicos WHERE nombre = 'Bruno Suarez');

-- ============================================
-- RLS (consistente con el schema existente — Allow all para dev)
-- ============================================
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE mecanicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all" ON gastos FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all" ON insumos FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all" ON movimientos_inventario FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all" ON mecanicos FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all" ON turnos FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all" ON leads FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
