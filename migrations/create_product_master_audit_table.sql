-- Migration script for ProductMasterAudit table
-- Run this script in your MySQL database

CREATE TABLE IF NOT EXISTS `product_master_audit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_master_id` int(11) NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `old_value` text,
  `new_value` text,
  `operation_type` enum('BULK_UPDATE','INDIVIDUAL_UPDATE','REVERT') NOT NULL,
  `batch_id` varchar(100) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_master_id` (`product_master_id`),
  KEY `idx_batch_id` (`batch_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_product_master_audit_product` FOREIGN KEY (`product_master_id`) REFERENCES `product_master` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_master_audit_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
