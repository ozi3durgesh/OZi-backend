-- Create inventory tables with optimized structure
-- This migration creates the inventory tracking system

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(50) NOT NULL UNIQUE,
  po_quantity INT NOT NULL DEFAULT 0,
  grn_quantity INT NOT NULL DEFAULT 0,
  putaway_quantity INT NOT NULL DEFAULT 0,
  picklist_quantity INT NOT NULL DEFAULT 0,
  return_try_and_buy_quantity INT NOT NULL DEFAULT 0,
  return_other_quantity INT NOT NULL DEFAULT 0,
  total_available_quantity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_sku (sku),
  INDEX idx_po_quantity (po_quantity),
  INDEX idx_grn_quantity (grn_quantity),
  INDEX idx_putaway_quantity (putaway_quantity),
  INDEX idx_picklist_quantity (picklist_quantity),
  INDEX idx_total_available (total_available_quantity),
  INDEX idx_sku_putaway (sku, putaway_quantity),
  INDEX idx_sku_picklist (sku, picklist_quantity),
  
  -- Constraints
  CONSTRAINT chk_po_quantity CHECK (po_quantity >= 0),
  CONSTRAINT chk_grn_quantity CHECK (grn_quantity >= 0),
  CONSTRAINT chk_putaway_quantity CHECK (putaway_quantity >= 0),
  CONSTRAINT chk_picklist_quantity CHECK (picklist_quantity >= 0),
  CONSTRAINT chk_return_try_and_buy_quantity CHECK (return_try_and_buy_quantity >= 0),
  CONSTRAINT chk_return_other_quantity CHECK (return_other_quantity >= 0),
  -- Removed constraint to allow negative values (overallocated items)
  -- CONSTRAINT chk_total_available_quantity CHECK (total_available_quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create inventory_logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(50) NOT NULL,
  operation_type ENUM('po', 'grn', 'putaway', 'picklist', 'return_try_and_buy', 'return_other') NOT NULL,
  quantity_change INT NOT NULL,
  previous_quantity INT NOT NULL,
  new_quantity INT NOT NULL,
  reference_id VARCHAR(100) DEFAULT NULL,
  operation_details JSON DEFAULT NULL,
  performed_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_sku (sku),
  INDEX idx_operation_type (operation_type),
  INDEX idx_reference_id (reference_id),
  INDEX idx_performed_by (performed_by),
  INDEX idx_created_at (created_at),
  INDEX idx_sku_operation (sku, operation_type),
  INDEX idx_sku_created_at (sku, created_at),
  INDEX idx_operation_created_at (operation_type, created_at),
  
  -- Constraints
  CONSTRAINT chk_previous_quantity CHECK (previous_quantity >= 0),
  CONSTRAINT chk_new_quantity CHECK (new_quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create triggers for automatic inventory updates

-- Trigger for GRN Line operations
DELIMITER $$

-- After GRN Line Insert
CREATE TRIGGER after_grn_line_insert
AFTER INSERT ON grn_lines
FOR EACH ROW
BEGIN
  DECLARE current_grn_qty INT DEFAULT 0;
  DECLARE current_putaway_qty INT DEFAULT 0;
  DECLARE current_picklist_qty INT DEFAULT 0;
  DECLARE current_total_available INT DEFAULT 0;
  
  -- Get current quantities
  SELECT 
    COALESCE(grn_quantity, 0),
    COALESCE(putaway_quantity, 0),
    COALESCE(picklist_quantity, 0),
    COALESCE(total_available_quantity, 0)
  INTO current_grn_qty, current_putaway_qty, current_picklist_qty, current_total_available
  FROM inventory 
  WHERE sku = NEW.sku;
  
  -- Insert or update inventory
  INSERT INTO inventory (sku, grn_quantity, putaway_quantity, picklist_quantity, total_available_quantity)
  VALUES (NEW.sku, NEW.quantity, 0, 0, 0)
  ON DUPLICATE KEY UPDATE 
    grn_quantity = grn_quantity + NEW.quantity,
    updated_at = CURRENT_TIMESTAMP;
  
  -- Log the operation
  INSERT INTO inventory_logs (
    sku, operation_type, quantity_change, previous_quantity, new_quantity, 
    reference_id, operation_details, performed_by
  ) VALUES (
    NEW.sku, 'grn', NEW.quantity, current_grn_qty, current_grn_qty + NEW.quantity,
    NEW.grn_id, JSON_OBJECT('grn_line_id', NEW.id, 'batch_number', NEW.batch_number), NEW.created_by
  );
END$$

-- After GRN Line Update
CREATE TRIGGER after_grn_line_update
AFTER UPDATE ON grn_lines
FOR EACH ROW
BEGIN
  DECLARE current_grn_qty INT DEFAULT 0;
  DECLARE quantity_diff INT DEFAULT 0;
  
  -- Get current quantity
  SELECT COALESCE(grn_quantity, 0) INTO current_grn_qty
  FROM inventory 
  WHERE sku = NEW.sku;
  
  -- Calculate quantity difference
  SET quantity_diff = NEW.quantity - OLD.quantity;
  
  IF quantity_diff != 0 THEN
    -- Update inventory
    UPDATE inventory 
    SET grn_quantity = grn_quantity + quantity_diff,
        updated_at = CURRENT_TIMESTAMP
    WHERE sku = NEW.sku;
    
    -- Log the operation
    INSERT INTO inventory_logs (
      sku, operation_type, quantity_change, previous_quantity, new_quantity, 
      reference_id, operation_details, performed_by
    ) VALUES (
      NEW.sku, 'grn', quantity_diff, current_grn_qty, current_grn_qty + quantity_diff,
      NEW.grn_id, JSON_OBJECT('grn_line_id', NEW.id, 'old_quantity', OLD.quantity, 'new_quantity', NEW.quantity), NEW.updated_by
    );
  END IF;
END$$

-- After GRN Line Delete
CREATE TRIGGER after_grn_line_delete
AFTER DELETE ON grn_lines
FOR EACH ROW
BEGIN
  DECLARE current_grn_qty INT DEFAULT 0;
  
  -- Get current quantity
  SELECT COALESCE(grn_quantity, 0) INTO current_grn_qty
  FROM inventory 
  WHERE sku = OLD.sku;
  
  -- Update inventory
  UPDATE inventory 
  SET grn_quantity = grn_quantity - OLD.quantity,
      updated_at = CURRENT_TIMESTAMP
  WHERE sku = OLD.sku;
  
  -- Log the operation
  INSERT INTO inventory_logs (
    sku, operation_type, quantity_change, previous_quantity, new_quantity, 
    reference_id, operation_details
  ) VALUES (
    OLD.sku, 'grn', -OLD.quantity, current_grn_qty, current_grn_qty - OLD.quantity,
    OLD.grn_id, JSON_OBJECT('grn_line_id', OLD.id, 'deleted_quantity', OLD.quantity)
  );
END$$

-- Trigger for Putaway Task operations
CREATE TRIGGER after_putaway_task_insert
AFTER INSERT ON putaway_tasks
FOR EACH ROW
BEGIN
  DECLARE current_putaway_qty INT DEFAULT 0;
  DECLARE current_grn_qty INT DEFAULT 0;
  DECLARE current_total_available INT DEFAULT 0;
  
  -- Get current quantities
  SELECT 
    COALESCE(putaway_quantity, 0),
    COALESCE(grn_quantity, 0),
    COALESCE(total_available_quantity, 0)
  INTO current_putaway_qty, current_grn_qty, current_total_available
  FROM inventory 
  WHERE sku = NEW.sku;
  
  -- Insert or update inventory
  INSERT INTO inventory (sku, putaway_quantity, total_available_quantity)
  VALUES (NEW.sku, NEW.quantity, NEW.quantity)
  ON DUPLICATE KEY UPDATE 
    putaway_quantity = putaway_quantity + NEW.quantity,
    total_available_quantity = total_available_quantity + NEW.quantity,
    updated_at = CURRENT_TIMESTAMP;
  
  -- Log the operation
  INSERT INTO inventory_logs (
    sku, operation_type, quantity_change, previous_quantity, new_quantity, 
    reference_id, operation_details, performed_by
  ) VALUES (
    NEW.sku, 'putaway', NEW.quantity, current_putaway_qty, current_putaway_qty + NEW.quantity,
    NEW.grn_id, JSON_OBJECT('putaway_task_id', NEW.id, 'bin_location', NEW.bin_location_id), NEW.assigned_to
  );
END$$

-- Trigger for Picklist Item operations
CREATE TRIGGER after_picklist_item_insert
AFTER INSERT ON picklist_items
FOR EACH ROW
BEGIN
  DECLARE current_picklist_qty INT DEFAULT 0;
  DECLARE current_putaway_qty INT DEFAULT 0;
  DECLARE current_total_available INT DEFAULT 0;
  
  -- Get current quantities
  SELECT 
    COALESCE(picklist_quantity, 0),
    COALESCE(putaway_quantity, 0),
    COALESCE(total_available_quantity, 0)
  INTO current_picklist_qty, current_putaway_qty, current_total_available
  FROM inventory 
  WHERE sku = NEW.sku;
  
  -- Check if sufficient quantity available
  IF current_putaway_qty >= NEW.quantity THEN
    -- Insert or update inventory
    INSERT INTO inventory (sku, picklist_quantity, total_available_quantity)
    VALUES (NEW.sku, NEW.quantity, -NEW.quantity)
    ON DUPLICATE KEY UPDATE 
      picklist_quantity = picklist_quantity + NEW.quantity,
      total_available_quantity = total_available_quantity - NEW.quantity,
      updated_at = CURRENT_TIMESTAMP;
    
    -- Log the operation
    INSERT INTO inventory_logs (
      sku, operation_type, quantity_change, previous_quantity, new_quantity, 
      reference_id, operation_details, performed_by
    ) VALUES (
      NEW.sku, 'picklist', NEW.quantity, current_picklist_qty, current_picklist_qty + NEW.quantity,
      NEW.wave_id, JSON_OBJECT('picklist_item_id', NEW.id, 'order_id', NEW.order_id), NEW.picked_by
    );
  ELSE
    -- Log error - insufficient quantity
    INSERT INTO inventory_logs (
      sku, operation_type, quantity_change, previous_quantity, new_quantity, 
      reference_id, operation_details, performed_by
    ) VALUES (
      NEW.sku, 'picklist', 0, current_picklist_qty, current_picklist_qty,
      NEW.wave_id, JSON_OBJECT('error', 'INSUFFICIENT_QUANTITY', 'requested', NEW.quantity, 'available', current_putaway_qty), NEW.pickedBy
    );
  END IF;
END$$

-- Trigger for Return operations
CREATE TRIGGER after_return_request_item_insert
AFTER INSERT ON return_request_items
FOR EACH ROW
BEGIN
  DECLARE current_return_qty INT DEFAULT 0;
  DECLARE operation_type_val VARCHAR(20);
  
  -- Determine operation type based on return type
  IF NEW.is_try_and_buy = 1 THEN
    SET operation_type_val = 'return_try_and_buy';
  ELSE
    SET operation_type_val = 'return_other';
  END IF;
  
  -- Get current quantity
  SELECT COALESCE(
    CASE 
      WHEN operation_type_val = 'return_try_and_buy' THEN return_try_and_buy_quantity
      ELSE return_other_quantity
    END, 0
  ) INTO current_return_qty
  FROM inventory 
  WHERE sku = NEW.item_id;
  
  -- Insert or update inventory
  INSERT INTO inventory (sku, return_try_and_buy_quantity, return_other_quantity)
  VALUES (
    NEW.item_id, 
    CASE WHEN operation_type_val = 'return_try_and_buy' THEN NEW.quantity ELSE 0 END,
    CASE WHEN operation_type_val = 'return_other' THEN NEW.quantity ELSE 0 END
  )
  ON DUPLICATE KEY UPDATE 
    return_try_and_buy_quantity = CASE 
      WHEN operation_type_val = 'return_try_and_buy' THEN return_try_and_buy_quantity + NEW.quantity
      ELSE return_try_and_buy_quantity
    END,
    return_other_quantity = CASE 
      WHEN operation_type_val = 'return_other' THEN return_other_quantity + NEW.quantity
      ELSE return_other_quantity
    END,
    updated_at = CURRENT_TIMESTAMP;
  
  -- Log the operation
  INSERT INTO inventory_logs (
    sku, operation_type, quantity_change, previous_quantity, new_quantity, 
    reference_id, operation_details, performed_by
  ) VALUES (
    NEW.item_id, operation_type_val, NEW.quantity, current_return_qty, current_return_qty + NEW.quantity,
    NEW.return_order_id, JSON_OBJECT('return_request_item_id', NEW.id, 'return_type', NEW.return_type), NEW.created_by
  );
END$$

DELIMITER ;

-- Create stored procedure for inventory reconciliation
DELIMITER $$
CREATE PROCEDURE ReconcileInventory(IN target_sku VARCHAR(50))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Update total_available_quantity for the SKU
  UPDATE inventory 
  SET total_available_quantity = putaway_quantity - picklist_quantity,
      updated_at = CURRENT_TIMESTAMP
  WHERE sku = target_sku;
  
  COMMIT;
END$$
DELIMITER ;

-- Create view for inventory summary
CREATE VIEW inventory_summary AS
SELECT 
  sku,
  po_quantity,
  grn_quantity,
  putaway_quantity,
  picklist_quantity,
  return_try_and_buy_quantity,
  return_other_quantity,
  total_available_quantity,
  (putaway_quantity - picklist_quantity) as available_for_picking,
  (po_quantity + grn_quantity + putaway_quantity + return_try_and_buy_quantity + return_other_quantity) as total_inventory,
  created_at,
  updated_at
FROM inventory;
