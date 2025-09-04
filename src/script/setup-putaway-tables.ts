import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

const createPutawayTables = async () => {
  try {
    console.log('Setting up putaway tables...');
    
    // Create putaway_tasks table
    await sequelize.query(`
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
        INDEX idx_assigned_to (assigned_to)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, { type: QueryTypes.RAW });
    
    console.log('✅ putaway_tasks table created');
    
    // Create putaway_audit table
    await sequelize.query(`
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
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, { type: QueryTypes.RAW });
    
    console.log('✅ putaway_audit table created');
    
    // Create bin_locations table
    await sequelize.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, { type: QueryTypes.RAW });
    
    console.log('✅ bin_locations table created');
    
    // Check if sample bin locations exist
    const existingBins = await sequelize.query(
      "SELECT COUNT(*) as count FROM bin_locations",
      { type: QueryTypes.SELECT }
    );
    
    if ((existingBins[0] as any).count === 0) {
      // Insert sample bin locations
      await sequelize.query(`
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
        ('B1-B2-C2', 'B', '1', 'B', '2', 100, 0)
      `, { type: QueryTypes.RAW });
      
      console.log('✅ Sample bin locations inserted');
    } else {
      console.log('ℹ️ Bin locations already exist');
    }
    
    console.log('✅ Putaway tables setup completed successfully');
    
  } catch (error) {
    console.error('Error setting up putaway tables:', error);
    throw error;
  }
};

// Run the setup
createPutawayTables()
  .then(() => {
    console.log('Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
