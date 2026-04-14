-- ============================================
-- MIGRACIÓN: Permitir cualquier categoría de vehículo
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Eliminar el constraint que limita las categorías a 4 valores fijos
ALTER TABLE vehiculos
  DROP CONSTRAINT IF EXISTS vehiculos_categoria_check;

-- Ahora la columna categoria acepta cualquier string
-- (la app valida en el frontend desde CATEGORIAS_VEHICULO en data.js)

-- Verificación
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%vehiculos%';
