-- Tabla presupuestos_chapa — Presupuestos de Chapa y Pintura
-- Ejecutar en Supabase → SQL Editor → Run

CREATE TABLE IF NOT EXISTS presupuestos_chapa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT UNIQUE,
  cliente_id UUID REFERENCES clientes(id),
  vehiculo TEXT,
  tipo_trabajo TEXT NOT NULL DEFAULT 'pintura_parcial',
  complejidad TEXT NOT NULL DEFAULT 'media',
  paneles_detalle JSONB DEFAULT '[]',
  total_paneles INTEGER DEFAULT 0,
  precio_por_panel NUMERIC(12,2) DEFAULT 0,
  subtotal_siva NUMERIC(12,2) DEFAULT 0,
  iva NUMERIC(12,2) DEFAULT 0,
  total_civa NUMERIC(12,2) DEFAULT 0,
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'Cotizado',
  remito_numero TEXT,
  remito_fecha DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS y permitir acceso público (misma política que las otras tablas)
ALTER TABLE presupuestos_chapa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo" ON presupuestos_chapa FOR ALL USING (true) WITH CHECK (true);
