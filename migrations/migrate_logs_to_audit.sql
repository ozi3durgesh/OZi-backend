-- Migration: Move logs functionality from product_master to product_master_audit
-- This script removes the logs column from product_master and adds new columns to product_master_audit

-- Step 1: Add new columns to product_master_audit table
ALTER TABLE `product_master_audit` 
ADD COLUMN `action` VARCHAR(50) NOT NULL DEFAULT 'UPDATE' AFTER `user_id`,
ADD COLUMN `description` TEXT NULL AFTER `action`,
ADD COLUMN `metadata` TEXT NULL AFTER `description`;

-- Step 2: Update the operation_type enum to include new values
ALTER TABLE `product_master_audit` 
MODIFY COLUMN `operation_type` ENUM('BULK_UPDATE', 'INDIVIDUAL_UPDATE', 'REVERT', 'CREATE', 'UPDATE', 'DELETE') NOT NULL;

-- Step 3: Migrate existing logs data from product_master to product_master_audit
-- This will create audit records for existing logs
INSERT INTO `product_master_audit` (
    `product_master_id`,
    `field_name`,
    `old_value`,
    `new_value`,
    `operation_type`,
    `batch_id`,
    `user_id`,
    `action`,
    `description`,
    `metadata`,
    `created_at`
)
SELECT 
    pm.id as `product_master_id`,
    'logs' as `field_name`,
    NULL as `old_value`,
    JSON_EXTRACT(pm.logs, '$[0].action') as `new_value`,
    'UPDATE' as `operation_type`,
    CONCAT('migrated_', UNIX_TIMESTAMP()) as `batch_id`,
    COALESCE(JSON_EXTRACT(pm.logs, '$[0].user_id'), pm.created_by) as `user_id`,
    COALESCE(JSON_EXTRACT(pm.logs, '$[0].action'), 'MIGRATED') as `action`,
    CONCAT('Migrated from logs column - ', COALESCE(JSON_EXTRACT(pm.logs, '$[0].timestamp'), 'unknown timestamp')) as `description`,
    pm.logs as `metadata`,
    COALESCE(STR_TO_DATE(JSON_EXTRACT(pm.logs, '$[0].timestamp'), '%Y-%m-%dT%H:%i:%s.%fZ'), pm.updated_at) as `created_at`
FROM `product_master` pm
WHERE pm.logs IS NOT NULL 
  AND JSON_LENGTH(pm.logs) > 0
  AND JSON_EXTRACT(pm.logs, '$[0]') IS NOT NULL;

-- Step 4: Remove the logs column from product_master table
ALTER TABLE `product_master` DROP COLUMN `logs`;

-- Step 5: Add indexes for better performance
CREATE INDEX idx_product_master_audit_action ON `product_master_audit` (`action`);
CREATE INDEX idx_product_master_audit_created_at ON `product_master_audit` (`created_at`);
CREATE INDEX idx_product_master_audit_user_action ON `product_master_audit` (`user_id`, `action`);
