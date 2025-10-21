const { QueryInterface, DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting product tables merge migration...');
      
      // Step 1: Create the new unified product_master table
      await queryInterface.createTable('product_master_new', {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        category_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        catalogue_id: {
          type: DataTypes.STRING(7),
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        hsn: {
          type: DataTypes.STRING(8),
          allowNull: false,
        },
        image_url: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        mrp: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        cost: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        ean_upc: {
          type: DataTypes.STRING(14),
          allowNull: false,
        },
        brand_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        weight: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        length: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        height: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        width: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        inventory_threshold: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        gst: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
        },
        cess: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
        },
        sku: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        item_code: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        dc_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        createdBy: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        updatedBy: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: [],
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      }, { transaction });

      // Step 2: Create indexes for better performance
      await queryInterface.addIndex('product_master_new', ['catalogue_id'], { transaction });
      await queryInterface.addIndex('product_master_new', ['sku'], { transaction });
      await queryInterface.addIndex('product_master_new', ['brand_id'], { transaction });
      await queryInterface.addIndex('product_master_new', ['category_id'], { transaction });
      await queryInterface.addIndex('product_master_new', ['dc_id'], { transaction });
      await queryInterface.addIndex('product_master_new', ['status'], { transaction });

      // Step 3: Migrate data from parent_product_master table
      console.log('Migrating data from parent_product_master...');
      await queryInterface.sequelize.query(`
        INSERT INTO product_master_new (
          id, name, status, category_id, catalogue_id, description, hsn, 
          image_url, mrp, cost, ean_upc, brand_id, weight, length, height, 
          width, inventory_threshold, gst, cess, sku, item_code, dc_id, 
          createdBy, updatedBy, createdAt, updatedAt
        )
        SELECT 
          id,
          name,
          status,
          category_id,
          catalogue_id,
          description,
          hsn,
          image_url,
          mrp,
          NULL as cost, -- cost not available in parent_product_master
          ean_upc,
          brand_id,
          weight,
          length,
          height,
          width,
          inventory_threshold,
          gst,
          cess,
          CONCAT('PP-', catalogue_id) as sku, -- Generate SKU from catalogue_id
          NULL as item_code, -- item_code not available in parent_product_master
          NULL as dc_id, -- dc_id not available in parent_product_master
          createdBy,
          JSON_ARRAY(updatedBy) as updatedBy,
          createdAt,
          updatedAt
        FROM parent_product_master
        WHERE status = 1
      `, { transaction });

      // Step 4: Migrate data from product_master table (only if not already exists in parent_product_master)
      console.log('Migrating data from product_master...');
      await queryInterface.sequelize.query(`
        INSERT INTO product_master_new (
          id, name, status, category_id, catalogue_id, description, hsn, 
          image_url, mrp, cost, ean_upc, brand_id, weight, length, height, 
          width, inventory_threshold, gst, cess, sku, item_code, dc_id, 
          createdBy, updatedBy, createdAt, updatedAt
        )
        SELECT 
          pm.id + 1000000 as id, -- Offset to avoid ID conflicts
          COALESCE(pm.name, 'Unknown Product') as name,
          COALESCE(pm.status, 1) as status,
          COALESCE(pm.category_id, 1) as category_id, -- Default category if null
          COALESCE(CAST(pm.catelogue_id AS CHAR), CONCAT('PM-', pm.id)) as catalogue_id,
          COALESCE(pm.description, 'No description available') as description,
          COALESCE(pm.hsn, '00000000') as hsn,
          COALESCE(pm.image_url, '') as image_url,
          COALESCE(pm.mrp, 0.00) as mrp,
          pm.cost,
          COALESCE(pm.ean_upc, '00000000000000') as ean_upc,
          COALESCE(pm.brand_id, 1) as brand_id, -- Default brand if null
          COALESCE(pm.weight, 0.00) as weight,
          COALESCE(pm.length, 0.00) as length,
          COALESCE(pm.height, 0.00) as height,
          COALESCE(pm.width, 0.00) as width,
          COALESCE(pm.inventory_thresshold, 0) as inventory_threshold,
          COALESCE(CAST(pm.gst AS DECIMAL(5,2)), 0.00) as gst,
          COALESCE(pm.cess, 0.00) as cess,
          pm.sku,
          pm.item_code,
          pm.dc_id,
          COALESCE(pm.created_by, 1) as createdBy, -- Default user if null
          COALESCE(pm.updated_by, JSON_ARRAY()) as updatedBy,
          COALESCE(pm.created_at, NOW()) as createdAt,
          COALESCE(pm.updated_at, NOW()) as updatedAt
        FROM product_master pm
        WHERE pm.status = 1
        AND NOT EXISTS (
          SELECT 1 FROM parent_product_master ppm 
          WHERE ppm.catalogue_id = CAST(pm.catelogue_id AS CHAR)
        )
      `, { transaction });

      // Step 5: Update foreign key references in related tables
      console.log('Updating foreign key references...');
      
      // Update DCPOProduct table to reference new product_master
      await queryInterface.sequelize.query(`
        UPDATE dc_po_products 
        SET productId = (
          SELECT pmn.id 
          FROM product_master_new pmn 
          WHERE pmn.catalogue_id = dc_po_products.catalogue_id
        )
        WHERE EXISTS (
          SELECT 1 FROM product_master_new pmn 
          WHERE pmn.catalogue_id = dc_po_products.catalogue_id
        )
      `, { transaction });

      // Step 6: Drop old tables and rename new table
      console.log('Dropping old tables and renaming new table...');
      await queryInterface.dropTable('product_master', { transaction });
      await queryInterface.dropTable('parent_product_master', { transaction });
      await queryInterface.renameTable('product_master_new', 'product_master', { transaction });

      // Step 7: Add foreign key constraints
      await queryInterface.addConstraint('product_master', {
        fields: ['brand_id'],
        type: 'foreign key',
        name: 'fk_product_master_brand',
        references: {
          table: 'Brands',
          field: 'id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
        transaction
      });

      await queryInterface.addConstraint('product_master', {
        fields: ['createdBy'],
        type: 'foreign key',
        name: 'fk_product_master_created_by',
        references: {
          table: 'Users',
          field: 'id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
        transaction
      });

      await queryInterface.addConstraint('product_master', {
        fields: ['dc_id'],
        type: 'foreign key',
        name: 'fk_product_master_dc',
        references: {
          table: 'DistributionCenters',
          field: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        transaction
      });

      await transaction.commit();
      console.log('Product tables merge migration completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Rolling back product tables merge migration...');
      
      // This is a complex rollback - we'll need to recreate the original tables
      // and split the data back. For now, we'll just log a warning.
      console.warn('Rollback not fully implemented - manual intervention required');
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
