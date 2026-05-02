-- ============================================
-- LIBRA FLEET — Migración "Flota real"
-- Fecha: 2026-05-02
--
-- 1. Borrar cliente "La Anónima" (test)
-- 2. Agregar patente/chofer/dominio/vencimientos a vehiculos
-- 3. Tabla "conductores" (multi-chofer por flota)
-- 4. Tabla "vencimientos_vehiculo" (VTV/Seguro/RUTA por unidad, normalizada)
-- 5. View "vencimientos_proximos" (alertas a 30 días)
-- 6. Limpiar regex-en-observaciones de OTs viejas → columnas reales
--
-- Ejecutar en: Supabase dashboard → SQL Editor → New query → paste → Run
-- Idempotente. Se puede correr varias veces.
-- ============================================

-- 1) Borrar La Anónima si existe (test data) ---------------------------------
DO $$
DECLARE
  la_anonima_id UUID;
BEGIN
  SELECT id INTO la_anonima_id FROM clientes WHERE nombre ILIKE 'la an%nima' LIMIT 1;
  IF la_anonima_id IS NOT NULL THEN
    -- desconectar vehículos en lugar de borrar (por si hay OTs)
    UPDATE vehiculos SET cliente_id = NULL WHERE cliente_id = la_anonima_id;
    DELETE FROM clientes WHERE id = la_anonima_id;
  END IF;
END $$;

-- 2) Vehiculos: patente/chofer/vencimientos -----------------------------------
ALTER TABLE vehiculos
  ADD COLUMN IF NOT EXISTS patente TEXT,
  ADD COLUMN IF NOT EXISTS chofer TEXT,
  ADD COLUMN IF NOT EXISTS chofer_telefono TEXT,
  ADD COLUMN IF NOT EXISTS dominio TEXT,
  ADD COLUMN IF NOT EXISTS vtv_vencimiento DATE,
  ADD COLUMN IF NOT EXISTS seguro_vencimiento DATE,
  ADD COLUMN IF NOT EXISTS seguro_compania TEXT,
  ADD COLUMN IF NOT EXISTS seguro_poliza TEXT,
  ADD COLUMN IF NOT EXISTS ruta_vencimiento DATE,
  ADD COLUMN IF NOT EXISTS rto_vencimiento DATE,
  ADD COLUMN IF NOT EXISTS observaciones_vehiculo TEXT;

CREATE INDEX IF NOT EXISTS idx_vehiculos_patente ON vehiculos(patente) WHERE patente IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehiculos_vtv ON vehiculos(vtv_vencimiento) WHERE vtv_vencimiento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehiculos_seguro ON vehiculos(seguro_vencimiento) WHERE seguro_vencimiento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehiculos_ruta ON vehiculos(ruta_vencimiento) WHERE ruta_vencimiento IS NOT NULL;

-- 3) Tabla "conductores" (un vehículo puede haber tenido varios choferes) -----
CREATE TABLE IF NOT EXISTS conductores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  dni TEXT,
  telefono TEXT,
  email TEXT,
  licencia_numero TEXT,
  licencia_categoria TEXT,
  licencia_vencimiento DATE,
  vehiculo_actual_id UUID REFERENCES vehiculos(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conductores_cliente ON conductores(cliente_id);
CREATE INDEX IF NOT EXISTS idx_conductores_vehiculo ON conductores(vehiculo_actual_id);
CREATE INDEX IF NOT EXISTS idx_conductores_licencia ON conductores(licencia_vencimiento) WHERE licencia_vencimiento IS NOT NULL;

ALTER TABLE conductores ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Allow all" ON conductores FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) Ordenes: patente/chofer como columnas reales (no en observaciones) -------
ALTER TABLE ordenes_trabajo
  ADD COLUMN IF NOT EXISTS patente TEXT,
  ADD COLUMN IF NOT EXISTS chofer TEXT,
  ADD COLUMN IF NOT EXISTS tipo_servicio TEXT DEFAULT 'service'
    CHECK (tipo_servicio IN ('service', 'reparacion', 'urgencia', 'inspeccion'));

CREATE INDEX IF NOT EXISTS idx_ordenes_patente ON ordenes_trabajo(patente) WHERE patente IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ordenes_tipo_servicio ON ordenes_trabajo(tipo_servicio);

-- Migrar OTs antiguas: extraer "PAT: XXX" y "CHOFER: YYY" de observaciones
UPDATE ordenes_trabajo
SET
  patente = COALESCE(
    patente,
    NULLIF(TRIM((regexp_match(observaciones, 'PAT:\s*([^|]+?)(?:\s*\||$)'))[1]), '')
  ),
  chofer = COALESCE(
    chofer,
    NULLIF(TRIM((regexp_match(observaciones, 'CHOFER:\s*([^|]+?)(?:\s*\||$)'))[1]), '')
  )
WHERE observaciones ILIKE '%PAT:%' OR observaciones ILIKE '%CHOFER:%';

-- 5) Pre-cargar la patente/chofer en vehículos desde las OTs más recientes ----
WITH ultima_ot AS (
  SELECT DISTINCT ON (vehiculo_id)
    vehiculo_id, patente, chofer
  FROM ordenes_trabajo
  WHERE vehiculo_id IS NOT NULL AND (patente IS NOT NULL OR chofer IS NOT NULL)
  ORDER BY vehiculo_id, created_at DESC
)
UPDATE vehiculos v
SET
  patente = COALESCE(v.patente, ultima_ot.patente),
  chofer = COALESCE(v.chofer, ultima_ot.chofer)
FROM ultima_ot
WHERE v.id = ultima_ot.vehiculo_id;

-- 6) View de vencimientos próximos (≤ 60 días) — Dashboard de alertas ---------
CREATE OR REPLACE VIEW vencimientos_proximos AS
WITH veh AS (
  SELECT
    v.id, v.codigo, v.patente, v.marca, v.modelo, v.cliente_id,
    c.nombre AS cliente_nombre,
    'VTV' AS tipo,
    v.vtv_vencimiento AS fecha_vencimiento
  FROM vehiculos v LEFT JOIN clientes c ON c.id = v.cliente_id
  WHERE v.activo = true AND v.vtv_vencimiento IS NOT NULL
  UNION ALL
  SELECT v.id, v.codigo, v.patente, v.marca, v.modelo, v.cliente_id, c.nombre,
    'Seguro', v.seguro_vencimiento
  FROM vehiculos v LEFT JOIN clientes c ON c.id = v.cliente_id
  WHERE v.activo = true AND v.seguro_vencimiento IS NOT NULL
  UNION ALL
  SELECT v.id, v.codigo, v.patente, v.marca, v.modelo, v.cliente_id, c.nombre,
    'RUTA', v.ruta_vencimiento
  FROM vehiculos v LEFT JOIN clientes c ON c.id = v.cliente_id
  WHERE v.activo = true AND v.ruta_vencimiento IS NOT NULL
  UNION ALL
  SELECT v.id, v.codigo, v.patente, v.marca, v.modelo, v.cliente_id, c.nombre,
    'RTO', v.rto_vencimiento
  FROM vehiculos v LEFT JOIN clientes c ON c.id = v.cliente_id
  WHERE v.activo = true AND v.rto_vencimiento IS NOT NULL
)
SELECT
  *,
  (fecha_vencimiento - CURRENT_DATE) AS dias_restantes,
  CASE
    WHEN fecha_vencimiento < CURRENT_DATE THEN 'vencido'
    WHEN fecha_vencimiento - CURRENT_DATE <= 7 THEN 'critico'
    WHEN fecha_vencimiento - CURRENT_DATE <= 30 THEN 'proximo'
    ELSE 'ok'
  END AS severidad
FROM veh
WHERE fecha_vencimiento - CURRENT_DATE <= 60
ORDER BY fecha_vencimiento ASC;

-- 7) Verificación (solo SELECT, no rompe si todo bien) ----------------------
SELECT
  (SELECT COUNT(*) FROM clientes WHERE nombre ILIKE 'la an%nima') AS la_anonima_count,
  (SELECT COUNT(*) FROM vehiculos) AS total_vehiculos,
  (SELECT COUNT(*) FROM vehiculos WHERE patente IS NOT NULL) AS con_patente,
  (SELECT COUNT(*) FROM ordenes_trabajo WHERE patente IS NOT NULL) AS ots_con_patente_columna,
  (SELECT COUNT(*) FROM conductores) AS conductores_total,
  (SELECT COUNT(*) FROM vencimientos_proximos) AS alertas_60d;
