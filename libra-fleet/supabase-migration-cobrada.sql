-- ============================================
-- MIGRACIÓN: Agregar campo "cobrada" a OTs
-- Ejecutar una sola vez en Supabase sobre la base existente.
-- ============================================

ALTER TABLE ordenes_trabajo
  ADD COLUMN IF NOT EXISTS cobrada BOOLEAN DEFAULT false;

ALTER TABLE ordenes_trabajo
  ADD COLUMN IF NOT EXISTS fecha_cobro TIMESTAMPTZ;
