-- Migration: Add portfolio_category, category, sub_category fields to product_master table
-- Date: 2025-01-23
-- Description: Replace single category field with three hierarchical category fields

-- Step 1: Add new category fields
ALTER TABLE `product_master` 
ADD COLUMN `portfolio_category` VARCHAR(100) NOT NULL DEFAULT 'General' AFTER `name`,
ADD COLUMN `sub_category` VARCHAR(100) NOT NULL DEFAULT 'General' AFTER `category`;

-- Step 2: Migrate existing category data to the new category field
-- (portfolio_category and sub_category will use default 'General' values)
UPDATE `product_master` 
SET `category` = COALESCE(`category`, 'General')
WHERE `category` IS NULL OR `category` = '';

-- Step 3: Add indexes for better performance
CREATE INDEX idx_product_master_portfolio_category ON `product_master` (`portfolio_category`);
CREATE INDEX idx_product_master_sub_category ON `product_master` (`sub_category`);
CREATE INDEX idx_product_master_category_hierarchy ON `product_master` (`portfolio_category`, `category`, `sub_category`);

-- Step 4: Update existing indexes (if needed)
-- The existing category index will remain for backward compatibility

-- Step 5: Add constraints to ensure data integrity
ALTER TABLE `product_master` 
ADD CONSTRAINT chk_portfolio_category_not_empty CHECK (`portfolio_category` != ''),
ADD CONSTRAINT chk_category_not_empty CHECK (`category` != ''),
ADD CONSTRAINT chk_sub_category_not_empty CHECK (`sub_category` != '');

-- Step 6: Optional - Add foreign key constraints if you have category reference tables
-- ALTER TABLE `product_master` 
-- ADD CONSTRAINT fk_portfolio_category FOREIGN KEY (`portfolio_category`) REFERENCES `portfolio_categories`(`name`),
-- ADD CONSTRAINT fk_category FOREIGN KEY (`category`) REFERENCES `categories`(`name`),
-- ADD CONSTRAINT fk_sub_category FOREIGN KEY (`sub_category`) REFERENCES `sub_categories`(`name`);

-- Note: Uncomment the foreign key constraints above if you have reference tables for categories
