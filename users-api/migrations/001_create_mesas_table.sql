-- Migración para crear la tabla de mesas
-- Ejecutar este script si la auto-migración no funcionó

CREATE TABLE IF NOT EXISTS `mesas` (
  `id_mesa` bigint unsigned NOT NULL AUTO_INCREMENT,
  `numero` varchar(50) NOT NULL COMMENT 'Número o nombre de la mesa',
  `negocio_id` bigint unsigned NOT NULL COMMENT 'ID del negocio al que pertenece',
  `sucursal_id` varchar(100) NOT NULL COMMENT 'ID de la sucursal',
  `qr_code` varchar(500) NOT NULL COMMENT 'Código QR en base64',
  `activo` tinyint(1) DEFAULT '1' COMMENT 'Si la mesa está activa',
  `creado_en` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de creación',
  PRIMARY KEY (`id_mesa`),
  UNIQUE KEY `idx_qr_code` (`qr_code`),
  KEY `idx_negocio_id` (`negocio_id`),
  KEY `idx_sucursal_id` (`sucursal_id`),
  CONSTRAINT `fk_mesas_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocios` (`id_negocio`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de mesas para órdenes por QR';
