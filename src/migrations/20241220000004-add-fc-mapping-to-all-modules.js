'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Adding FC mapping to all modules...');

    // Add fc_id to Orders table (if not already exists)
    try {
      await queryInterface.addColumn('orders', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to orders table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in orders table');
      } else {
        console.error('❌ Error adding fc_id to orders:', error.message);
      }
    }

    // Add fc_id to product_master table
    try {
      await queryInterface.addColumn('product_master', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to product_master table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in product_master table');
      } else {
        console.error('❌ Error adding fc_id to product_master:', error.message);
      }
    }

    // Add fc_id to purchase_orders table
    try {
      await queryInterface.addColumn('purchase_orders', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to purchase_orders table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in purchase_orders table');
      } else {
        console.error('❌ Error adding fc_id to purchase_orders:', error.message);
      }
    }

    // Add fc_id to grns table
    try {
      await queryInterface.addColumn('grns', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to grns table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in grns table');
      } else {
        console.error('❌ Error adding fc_id to grns:', error.message);
      }
    }

    // Add fc_id to grn_lines table
    try {
      await queryInterface.addColumn('grn_lines', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to grn_lines table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in grn_lines table');
      } else {
        console.error('❌ Error adding fc_id to grn_lines:', error.message);
      }
    }

    // Add fc_id to grn_batches table
    try {
      await queryInterface.addColumn('grn_batches', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to grn_batches table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in grn_batches table');
      } else {
        console.error('❌ Error adding fc_id to grn_batches:', error.message);
      }
    }

    // Add fc_id to inventory table
    try {
      await queryInterface.addColumn('inventory', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to inventory table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in inventory table');
      } else {
        console.error('❌ Error adding fc_id to inventory:', error.message);
      }
    }

    // Add fc_id to inventory_logs table
    try {
      await queryInterface.addColumn('inventory_logs', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to inventory_logs table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in inventory_logs table');
      } else {
        console.error('❌ Error adding fc_id to inventory_logs:', error.message);
      }
    }

    // Add fc_id to vendors table
    try {
      await queryInterface.addColumn('vendors', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to vendors table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in vendors table');
      } else {
        console.error('❌ Error adding fc_id to vendors:', error.message);
      }
    }

    // Add fc_id to warehouses table
    try {
      await queryInterface.addColumn('warehouses', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to warehouses table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in warehouses table');
      } else {
        console.error('❌ Error adding fc_id to warehouses:', error.message);
      }
    }

    // Add fc_id to picking_waves table
    try {
      await queryInterface.addColumn('picking_waves', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to picking_waves table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in picking_waves table');
      } else {
        console.error('❌ Error adding fc_id to picking_waves:', error.message);
      }
    }

    // Add fc_id to picklist_items table
    try {
      await queryInterface.addColumn('picklist_items', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to picklist_items table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in picklist_items table');
      } else {
        console.error('❌ Error adding fc_id to picklist_items:', error.message);
      }
    }

    // Add fc_id to packing_jobs table
    try {
      await queryInterface.addColumn('packing_jobs', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to packing_jobs table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in packing_jobs table');
      } else {
        console.error('❌ Error adding fc_id to packing_jobs:', error.message);
      }
    }

    // Add fc_id to handovers table
    try {
      await queryInterface.addColumn('handovers', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to handovers table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in handovers table');
      } else {
        console.error('❌ Error adding fc_id to handovers:', error.message);
      }
    }

    // Add fc_id to putaway_tasks table
    try {
      await queryInterface.addColumn('putaway_tasks', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to putaway_tasks table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in putaway_tasks table');
      } else {
        console.error('❌ Error adding fc_id to putaway_tasks:', error.message);
      }
    }

    // Add fc_id to putaway_audits table
    try {
      await queryInterface.addColumn('putaway_audits', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to putaway_audits table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in putaway_audits table');
      } else {
        console.error('❌ Error adding fc_id to putaway_audits:', error.message);
      }
    }

    // Add fc_id to bin_locations table
    try {
      await queryInterface.addColumn('bin_locations', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to bin_locations table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in bin_locations table');
      } else {
        console.error('❌ Error adding fc_id to bin_locations:', error.message);
      }
    }

    // Add fc_id to return_request_items table
    try {
      await queryInterface.addColumn('return_request_items', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to return_request_items table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in return_request_items table');
      } else {
        console.error('❌ Error adding fc_id to return_request_items:', error.message);
      }
    }

    // Add fc_id to bulk_import_logs table
    try {
      await queryInterface.addColumn('bulk_import_logs', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to bulk_import_logs table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in bulk_import_logs table');
      } else {
        console.error('❌ Error adding fc_id to bulk_import_logs:', error.message);
      }
    }

    // Add fc_id to po_products table
    try {
      await queryInterface.addColumn('po_products', 'fc_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fulfillment_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added fc_id to po_products table');
    } catch (error) {
      if (error.message.includes('ER_DUP_FIELDNAME')) {
        console.log('ℹ️ fc_id already exists in po_products table');
      } else {
        console.error('❌ Error adding fc_id to po_products:', error.message);
      }
    }

    // Create indexes for better performance
    const tablesWithFC = [
      'orders', 'product_master', 'purchase_orders', 'grns', 'grn_lines', 'grn_batches',
      'inventory', 'inventory_logs', 'vendors', 'warehouses', 'picking_waves', 'picklist_items',
      'packing_jobs', 'handovers', 'putaway_tasks', 'putaway_audits', 'bin_locations',
      'return_request_items', 'bulk_import_logs', 'po_products'
    ];

    for (const table of tablesWithFC) {
      try {
        await queryInterface.addIndex(table, ['fc_id'], {
          name: `idx_${table}_fc_id`
        });
        console.log(`✅ Added index for fc_id in ${table} table`);
      } catch (error) {
        if (error.message.includes('ER_DUP_KEYNAME')) {
          console.log(`ℹ️ Index for fc_id already exists in ${table} table`);
        } else {
          console.error(`❌ Error adding index for fc_id in ${table}:`, error.message);
        }
      }
    }

    console.log('🎉 FC mapping migration completed successfully!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back FC mapping migration...');

    const tablesWithFC = [
      'orders', 'product_master', 'purchase_orders', 'grns', 'grn_lines', 'grn_batches',
      'inventory', 'inventory_logs', 'vendors', 'warehouses', 'picking_waves', 'picklist_items',
      'packing_jobs', 'handovers', 'putaway_tasks', 'putaway_audits', 'bin_locations',
      'return_request_items', 'bulk_import_logs', 'po_products'
    ];

    // Remove indexes first
    for (const table of tablesWithFC) {
      try {
        await queryInterface.removeIndex(table, `idx_${table}_fc_id`);
        console.log(`✅ Removed index for fc_id in ${table} table`);
      } catch (error) {
        console.log(`ℹ️ Index for fc_id not found in ${table} table`);
      }
    }

    // Remove fc_id columns
    for (const table of tablesWithFC) {
      try {
        await queryInterface.removeColumn(table, 'fc_id');
        console.log(`✅ Removed fc_id from ${table} table`);
      } catch (error) {
        console.log(`ℹ️ fc_id column not found in ${table} table`);
      }
    }

    console.log('🎉 FC mapping rollback completed!');
  }
};
