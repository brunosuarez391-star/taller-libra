-- Migración: agregar soporte de remitos en presupuestos y ordenes_trabajo
-- Ejecutar en Supabase → SQL Editor → Run
-- Fecha: 2026-04-16

ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS remito_numero TEXT,
  ADD COLUMN IF NOT EXISTS remito_fecha DATE;

ALTER TABLE ordenes_trabajo
  ADD COLUMN IF NOT EXISTS remito_numero TEXT,
  ADD COLUMN IF NOT EXISTS remito_fecha DATE;

-- Índices para búsquedas rápidas por número de remito
CREATE INDEX IF NOT EXISTS idx_presupuestos_remito ON presupuestos(remito_numero) WHERE remito_numero IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ordenes_remito ON ordenes_trabajo(remito_numero) WHERE remito_numero IS NOT NULL;
