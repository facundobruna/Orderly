-- Migración para agregar coordenadas geográficas a la tabla negocios
-- Esto permite calcular distancias y mostrar negocios cercanos

ALTER TABLE `negocios`
ADD COLUMN `latitud` DECIMAL(10, 8) NULL COMMENT 'Latitud del negocio para geolocalización',
ADD COLUMN `longitud` DECIMAL(11, 8) NULL COMMENT 'Longitud del negocio para geolocalización';

-- Agregar índice para búsquedas de geolocalización
CREATE INDEX `idx_coordenadas` ON `negocios` (`latitud`, `longitud`);