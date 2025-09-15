-- Migration to add return_item_id columns to orders and order_details tables
-- Run this SQL script in your database

-- Add return_item_id column to orders table
ALTER TABLE `orders` 
ADD COLUMN `return_item_id` VARCHAR(50) NULL COMMENT 'Return order ID for tracking returns';

-- Add return_item_id column to order_details table  
ALTER TABLE `order_details` 
ADD COLUMN `return_item_id` VARCHAR(50) NULL COMMENT 'Return order ID for tracking returns';

-- Add indexes for better performance
CREATE INDEX `idx_orders_return_item_id` ON `orders` (`return_item_id`);
CREATE INDEX `idx_order_details_return_item_id` ON `order_details` (`return_item_id`);

-- Verify the columns were added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'ozi_backend' 
AND TABLE_NAME IN ('orders', 'order_details') 
AND COLUMN_NAME = 'return_item_id';
