-- Create putaway_tasks table
CREATE TABLE IF NOT EXISTS putaway_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grn_id INT NOT NULL,
  grn_line_id INT NOT NULL,
  sku_id VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  status ENUM('pending', 'in-progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  assigned_to INT NULL,
  bin_location VARCHAR(100) NULL,
  scanned_quantity INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  remarks VARCHAR(255) NULL,
  INDEX idx_grn_id (grn_id),
  INDEX idx_grn_line_id (grn_line_id),
  INDEX idx_sku_id (sku_id),
  INDEX idx_status (status),
  INDEX idx_assigned_to (assigned_to),
  FOREIGN KEY (grn_id) REFERENCES grns(id) ON DELETE CASCADE,
  FOREIGN KEY (grn_line_id) REFERENCES grn_lines(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Create putaway_audit table
CREATE TABLE IF NOT EXISTS putaway_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  putaway_task_id INT NOT NULL,
  user_id INT NOT NULL,
  action ENUM('scan_product', 'scan_bin', 'confirm_quantity', 'complete_task', 'override_bin') NOT NULL,
  sku_id VARCHAR(50) NOT NULL,
  bin_location VARCHAR(100) NULL,
  quantity INT NOT NULL,
  from_bin VARCHAR(100) NULL,
  to_bin VARCHAR(100) NULL,
  reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_putaway_task_id (putaway_task_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_sku_id (sku_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (putaway_task_id) REFERENCES putaway_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create bin_locations table
CREATE TABLE IF NOT EXISTS bin_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bin_code VARCHAR(50) NOT NULL UNIQUE,
  zone VARCHAR(50) NOT NULL,
  aisle VARCHAR(50) NOT NULL,
  rack VARCHAR(50) NOT NULL,
  shelf VARCHAR(50) NOT NULL,
  capacity INT NOT NULL DEFAULT 0,
  current_quantity INT NOT NULL DEFAULT 0,
  sku_mapping JSON NULL COMMENT 'Array of SKU IDs that can be stored in this bin',
  category_mapping JSON NULL COMMENT 'Array of category IDs that can be stored in this bin',
  status ENUM('active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bin_code (bin_code),
  INDEX idx_zone (zone),
  INDEX idx_aisle (aisle),
  INDEX idx_status (status)
);

-- Insert sample bin locations
INSERT INTO bin_locations (bin_code, zone, aisle, rack, shelf, capacity, current_quantity) VALUES
('A1-B1-C1', 'A', '1', 'B', '1', 100, 0),
('A1-B1-C2', 'A', '1', 'B', '1', 100, 0),
('A1-B2-C1', 'A', '1', 'B', '2', 100, 0),
('A1-B2-C2', 'A', '1', 'B', '2', 100, 0),
('A2-B1-C1', 'A', '2', 'B', '1', 100, 0),
('A2-B1-C2', 'A', '2', 'B', '1', 100, 0),
('B1-B1-C1', 'B', '1', 'B', '1', 100, 0),
('B1-B1-C2', 'B', '1', 'B', '1', 100, 0),
('B1-B2-C1', 'B', '1', 'B', '2', 100, 0),
('B1-B2-C2', 'B', '1', 'B', '2', 100, 0);
