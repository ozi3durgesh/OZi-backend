import sequelize from './database';
import { QueryTypes } from 'sequelize';

export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔄 Running database migrations...');
    
    // Create ecom_logs table if it doesn't exist
    await createEcomLogsTable();
    
    // Create dc_inventory_1 table if it doesn't exist
    await createDCInventory1Table();
    
    // Update vendor_dc table with new fields
    await updateVendorDCTable();
    
    // Add margin column to dc_po_products table
    await addMarginColumnToDCPOProducts();
    
    // Add new vendor fields to vendor_dc table
    await addNewVendorFields();
    
    // Create fc_po_sku_matrix table
    await createFCPOSkuMatrixTable();
    
    // Add sku_matrix_on_catalogue_id column to fc_po_products table
    await addSkuMatrixColumnToFCPOProducts();
    
    // Update inventory table with new columns
    await updateInventoryTable();
    
    // Migrate dc_po_sku_matrix to add dcPOId column (drop dc_po_products table)
    await migrateDCPOSkuMatrixToDropProducts();
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

const createEcomLogsTable = async (): Promise<void> => {
  try {
    // Check if table exists
    const tableExists = await sequelize.query(
      "SHOW TABLES LIKE 'ecom_logs'",
      { type: QueryTypes.SELECT }
    );
    
    if (tableExists.length === 0) {
      console.log('📋 Creating ecom_logs table...');
      
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS ecom_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          action VARCHAR(255) NOT NULL,
          payload TEXT NOT NULL,
          response TEXT NOT NULL,
          status VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_order_id (order_id),
          INDEX idx_action (action),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ ecom_logs table created successfully');
    } else {
      console.log('ℹ️ ecom_logs table already exists');
    }
  } catch (error) {
    console.error('❌ Error creating ecom_logs table:', error);
    throw error;
  }
};

const createDCInventory1Table = async (): Promise<void> => {
  try {
    // Check if table exists
    const tableExists = await sequelize.query(
      "SHOW TABLES LIKE 'dc_inventory_1'",
      { type: QueryTypes.SELECT }
    );
    
    if (tableExists.length === 0) {
      console.log('📋 Creating dc_inventory_1 table...');
      
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS dc_inventory_1 (
          id INT AUTO_INCREMENT PRIMARY KEY,
          catalogue_id VARCHAR(7) NOT NULL UNIQUE,
          po_raise_quantity INT NOT NULL DEFAULT 0,
          po_approve_quantity INT NOT NULL DEFAULT 0,
          sku_split JSON DEFAULT NULL,
          grn_done JSON DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_catalogue_id (catalogue_id),
          INDEX idx_po_raise_quantity (po_raise_quantity),
          INDEX idx_po_approve_quantity (po_approve_quantity)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ dc_inventory_1 table created successfully');
    } else {
      console.log('ℹ️ dc_inventory_1 table already exists');
    }
  } catch (error) {
    console.error('❌ Error creating dc_inventory_1 table:', error);
    throw error;
  }
};

const updateVendorDCTable = async (): Promise<void> => {
  try {
    console.log('📋 Updating vendor_dc table...');
    
    // Check if trade_name column exists
    const columns = await sequelize.query(
      "SHOW COLUMNS FROM vendor_dc LIKE 'trade_name'",
      { type: QueryTypes.SELECT }
    );
    
    if (columns.length === 0) {
      console.log('🔄 Adding new columns to vendor_dc table...');
      
      // Add new columns
      await sequelize.query(`
        ALTER TABLE vendor_dc 
        ADD COLUMN trade_name VARCHAR(255) NOT NULL DEFAULT '' AFTER dc_id,
        ADD COLUMN brand_name VARCHAR(255) NULL AFTER vendor_type,
        ADD COLUMN model VARCHAR(255) NULL AFTER brand_name,
        ADD COLUMN vrf VARCHAR(500) NULL AFTER model
      `);
      
      // Copy data from business_name to trade_name
      await sequelize.query(`
        UPDATE vendor_dc SET trade_name = business_name WHERE trade_name = ''
      `);
      
      // Drop old columns
      await sequelize.query(`
        ALTER TABLE vendor_dc 
        DROP COLUMN business_name,
        DROP COLUMN status,
        DROP COLUMN credit_limit,
        DROP COLUMN rating,
        DROP COLUMN notes
      `);
      
      console.log('✅ vendor_dc table updated successfully');
    } else {
      console.log('ℹ️ vendor_dc table already updated');
    }
  } catch (error) {
    console.error('❌ Error updating vendor_dc table:', error);
    throw error;
  }
};

const addMarginColumnToDCPOProducts = async (): Promise<void> => {
  try {
    // Check if dc_po_products table exists (it may have been dropped as part of migration)
    const [tables] = await sequelize.query(
      "SHOW TABLES LIKE 'dc_po_products'",
      { type: QueryTypes.SELECT }
    ) as any[];

    if (!tables || tables.length === 0) {
      console.log('ℹ️ dc_po_products table does not exist (already dropped or never created) - skipping margin column migration');
      return;
    }

    console.log('📋 Adding margin column to dc_po_products table...');
    
    // Check if margin column exists
    const columns = await sequelize.query(
      "SHOW COLUMNS FROM dc_po_products LIKE 'margin'",
      { type: QueryTypes.SELECT }
    ) as any[];
    
    if (!columns || columns.length === 0) {
      console.log('🔄 Adding margin column to dc_po_products table...');
      
      // Add margin column
      await sequelize.query(`
        ALTER TABLE dc_po_products 
        ADD COLUMN margin VARCHAR(50) NULL AFTER cgst
      `);
      
      console.log('✅ margin column added to dc_po_products table successfully');
    } else {
      console.log('ℹ️ margin column already exists in dc_po_products table');
    }
  } catch (error: any) {
    // If table doesn't exist, just log and continue (don't throw)
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('ℹ️ dc_po_products table does not exist - skipping margin column migration');
      return;
    }
    console.error('❌ Error adding margin column to dc_po_products table:', error);
    // Don't throw - allow server to start even if this migration fails
    console.warn('⚠️ Continuing without margin column migration');
  }
};

const addNewVendorFields = async (): Promise<void> => {
  try {
    console.log('📋 Adding new vendor fields to vendor_dc table...');
    
    // Check if agreement column exists (one of the new fields)
    const columns = await sequelize.query(
      "SHOW COLUMNS FROM vendor_dc LIKE 'agreement'",
      { type: QueryTypes.SELECT }
    );
    
    if (columns.length === 0) {
      console.log('🔄 Adding new vendor fields to vendor_dc table...');
      
      // Add new columns
      await sequelize.query(`
        ALTER TABLE vendor_dc 
        ADD COLUMN agreement VARCHAR(500) NULL AFTER agreement_doc,
        ADD COLUMN pan_document VARCHAR(500) NULL AFTER agreement,
        ADD COLUMN gst_certificate VARCHAR(500) NULL AFTER pan_document,
        ADD COLUMN cancelled_cheque VARCHAR(500) NULL AFTER gst_certificate,
        ADD COLUMN msme_certificate VARCHAR(500) NULL AFTER cancelled_cheque,
        ADD COLUMN bank_account_number VARCHAR(50) NULL AFTER msme_certificate,
        ADD COLUMN ifsc_code VARCHAR(20) NULL AFTER bank_account_number,
        ADD COLUMN stock_correction BOOLEAN NULL DEFAULT FALSE AFTER ifsc_code,
        ADD COLUMN stock_correction_percentage VARCHAR(10) NULL AFTER stock_correction
      `);
      
      console.log('✅ New vendor fields added to vendor_dc table successfully');
    } else {
      console.log('ℹ️ New vendor fields already exist in vendor_dc table');
    }
  } catch (error) {
    console.error('❌ Error adding new vendor fields to vendor_dc table:', error);
    throw error;
  }
};

const createFCPOSkuMatrixTable = async (): Promise<void> => {
  try {
    // Check if table exists
    const tableExists = await sequelize.query(
      "SHOW TABLES LIKE 'fc_po_sku_matrix'",
      { type: QueryTypes.SELECT }
    );
    
    if (tableExists.length === 0) {
      console.log('📋 Creating fc_po_sku_matrix table...');
      
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS fc_po_sku_matrix (
          id INT AUTO_INCREMENT PRIMARY KEY,
          fc_po_id INT NOT NULL,
          fc_po_product_id INT NOT NULL,
          catalogue_id VARCHAR(255) NOT NULL,
          sku VARCHAR(50) NOT NULL,
          product_name VARCHAR(255) NOT NULL,
          hsn VARCHAR(20) NULL,
          mrp DECIMAL(10, 2) NULL,
          ean_upc VARCHAR(50) NULL,
          brand VARCHAR(100) NULL,
          weight DECIMAL(8, 2) NULL,
          length DECIMAL(8, 2) NULL,
          height DECIMAL(8, 2) NULL,
          width DECIMAL(8, 2) NULL,
          gst DECIMAL(5, 2) NULL,
          cess DECIMAL(5, 2) NULL,
          selling_price DECIMAL(10, 2) NULL,
          rlp DECIMAL(10, 2) NULL,
          rlp_without_tax DECIMAL(10, 2) NULL,
          gst_type ENUM('SGST+CGST', 'IGST', 'NONE') NULL,
          quantity INT NOT NULL,
          total_amount DECIMAL(12, 2) NOT NULL,
          status ENUM('PENDING', 'READY_FOR_GRN', 'PROCESSED') NOT NULL DEFAULT 'PENDING',
          created_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_fc_po_id (fc_po_id),
          INDEX idx_fc_po_product_id (fc_po_product_id),
          INDEX idx_catalogue_id (catalogue_id),
          INDEX idx_sku (sku),
          INDEX idx_status (status),
          FOREIGN KEY (fc_po_id) REFERENCES fc_purchase_orders(id) ON DELETE CASCADE,
          FOREIGN KEY (fc_po_product_id) REFERENCES fc_po_products(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ fc_po_sku_matrix table created successfully');
    } else {
      console.log('ℹ️ fc_po_sku_matrix table already exists');
    }
  } catch (error) {
    console.error('❌ Error creating fc_po_sku_matrix table:', error);
    throw error;
  }
};

const addSkuMatrixColumnToFCPOProducts = async (): Promise<void> => {
  try {
    console.log('📋 Adding sku_matrix_on_catalogue_id column to fc_po_products table...');
    
    // Check if sku_matrix_on_catalogue_id column exists
    const columns = await sequelize.query(
      "SHOW COLUMNS FROM fc_po_products LIKE 'sku_matrix_on_catalogue_id'",
      { type: QueryTypes.SELECT }
    );
    
    if (columns.length === 0) {
      console.log('🔄 Adding sku_matrix_on_catalogue_id column to fc_po_products table...');
      
      // Add sku_matrix_on_catalogue_id column
      await sequelize.query(`
        ALTER TABLE fc_po_products 
        ADD COLUMN sku_matrix_on_catalogue_id TEXT NULL AFTER notes
      `);
      
      console.log('✅ sku_matrix_on_catalogue_id column added to fc_po_products table successfully');
    } else {
      console.log('ℹ️ sku_matrix_on_catalogue_id column already exists in fc_po_products table');
    }
  } catch (error) {
    console.error('❌ Error adding sku_matrix_on_catalogue_id column to fc_po_products table:', error);
    throw error;
  }
};

const updateInventoryTable = async (): Promise<void> => {
  try {
    console.log('📋 Updating inventory table with new columns...');
    
    // Check if sale_available_quantity column exists
    const saleAvailableColumn = await sequelize.query(
      "SHOW COLUMNS FROM inventory LIKE 'sale_available_quantity'",
      { type: QueryTypes.SELECT }
    );
    
    // Check if dc_id column exists
    const dcIdColumn = await sequelize.query(
      "SHOW COLUMNS FROM inventory LIKE 'dc_id'",
      { type: QueryTypes.SELECT }
    );
    
    if (saleAvailableColumn.length === 0) {
      console.log('🔄 Adding sale_available_quantity column to inventory table...');
      
      // Add sale_available_quantity column after fc_putaway_quantity
      await sequelize.query(`
        ALTER TABLE inventory 
        ADD COLUMN sale_available_quantity INT NOT NULL DEFAULT 0 AFTER fc_putaway_quantity
      `);
      
      console.log('✅ sale_available_quantity column added to inventory table successfully');
    } else {
      console.log('ℹ️ sale_available_quantity column already exists in inventory table');
    }
    
    if (dcIdColumn.length === 0) {
      console.log('🔄 Adding dc_id column to inventory table...');
      
      // Add dc_id column after fc_id
      await sequelize.query(`
        ALTER TABLE inventory 
        ADD COLUMN dc_id INT NULL AFTER fc_id,
        ADD INDEX idx_dc_id (dc_id)
      `);
      
      console.log('✅ dc_id column added to inventory table successfully');
    } else {
      console.log('ℹ️ dc_id column already exists in inventory table');
    }
    
  } catch (error) {
    console.error('❌ Error updating inventory table:', error);
    throw error;
  }
};

export const migrateDCPOSkuMatrixToDropProducts = async (): Promise<void> => {
  try {
    console.log('📋 Migrating dc_po_sku_matrix to drop dc_po_products dependency...');
    
    // Check if dcPOId column exists
    const columns = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'dc_po_sku_matrix' 
      AND COLUMN_NAME = 'dcPOId'
    `, { type: QueryTypes.SELECT }) as any[];

    // Add dcPOId column if it doesn't exist
    if (!columns || columns.length === 0) {
      console.log('🔄 Adding dcPOId column to dc_po_sku_matrix...');
      
      await sequelize.query(`
        ALTER TABLE dc_po_sku_matrix 
        ADD COLUMN dcPOId INT NULL AFTER id
      `);

      // Populate dcPOId from dc_po_products table if it exists
      const poProductsTable = await sequelize.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'dc_po_products'
      `, { type: QueryTypes.SELECT }) as any[];

      if (poProductsTable && poProductsTable.length > 0) {
        console.log('🔄 Populating dcPOId from dc_po_products...');
        await sequelize.query(`
          UPDATE dc_po_sku_matrix sku
          INNER JOIN dc_po_products prod ON sku.dcPOProductId = prod.id
          SET sku.dcPOId = prod.dcPOId
          WHERE sku.dcPOId IS NULL
        `);
      }

      // Make dcPOId NOT NULL after populating (if we have data)
      const nonNullCount = await sequelize.query(`
        SELECT COUNT(*) as count FROM dc_po_sku_matrix WHERE dcPOId IS NOT NULL
      `, { type: QueryTypes.SELECT }) as any[];

      if (nonNullCount && nonNullCount.length > 0 && nonNullCount[0]?.count > 0) {
        await sequelize.query(`
          ALTER TABLE dc_po_sku_matrix 
          MODIFY COLUMN dcPOId INT NOT NULL
        `);

        // Add foreign key constraint
        try {
          await sequelize.query(`
            ALTER TABLE dc_po_sku_matrix 
            ADD CONSTRAINT fk_dc_po_sku_matrix_dc_po_id 
            FOREIGN KEY (dcPOId) REFERENCES dc_purchase_orders(id) 
            ON DELETE CASCADE ON UPDATE CASCADE
          `);
        } catch (fkError: any) {
          // Constraint might already exist
          if (!fkError.message.includes('Duplicate key')) {
            console.warn('⚠️ Could not add foreign key constraint:', fkError.message);
          }
        }

        // Add index
        try {
          await sequelize.query(`
            CREATE INDEX idx_dc_po_sku_matrix_dc_po_id ON dc_po_sku_matrix(dcPOId)
          `);
        } catch (idxError: any) {
          // Index might already exist
          if (!idxError.message.includes('Duplicate key')) {
            console.warn('⚠️ Could not add index:', idxError.message);
          }
        }
      }

      // Drop foreign key constraint on dcPOProductId if it exists
      try {
        const constraints = await sequelize.query(`
          SELECT CONSTRAINT_NAME 
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'dc_po_sku_matrix' 
          AND COLUMN_NAME = 'dcPOProductId'
          AND REFERENCED_TABLE_NAME IS NOT NULL
        `, { type: QueryTypes.SELECT }) as any[];

        if (constraints && constraints.length > 0) {
          for (const constraint of constraints) {
            try {
              await sequelize.query(`
                ALTER TABLE dc_po_sku_matrix 
                DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
              `);
            } catch (dropError) {
              console.warn(`⚠️ Could not drop foreign key ${constraint.CONSTRAINT_NAME}:`, (dropError as Error).message);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Error checking for foreign keys:', (error as Error).message);
      }

      // Make dcPOProductId nullable
      try {
        await sequelize.query(`
          ALTER TABLE dc_po_sku_matrix 
          MODIFY COLUMN dcPOProductId INT NULL
        `);
      } catch (error) {
        console.warn('⚠️ Could not modify dcPOProductId column:', (error as Error).message);
      }

      // Drop dc_po_products table if it exists and is no longer needed
      const dcPoProductsTable = await sequelize.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'dc_po_products'
      `, { type: QueryTypes.SELECT }) as any[];

      if (dcPoProductsTable && dcPoProductsTable.length > 0) {
        console.log('🔄 Dropping dc_po_products table...');
        try {
          await sequelize.query(`DROP TABLE dc_po_products`);
          console.log('✅ dc_po_products table dropped successfully');
        } catch (dropError: any) {
          console.warn('⚠️ Could not drop dc_po_products table (may have dependencies):', dropError.message);
        }
      }

      console.log('✅ dc_po_sku_matrix migration completed successfully');
    } else {
      console.log('ℹ️ dcPOId column already exists in dc_po_sku_matrix');
    }
  } catch (error) {
    console.error('❌ Error migrating dc_po_sku_matrix:', error);
    // Don't throw - allow server to start even if migration fails
    console.warn('⚠️ Server will continue, but migration should be run manually');
  }
};
