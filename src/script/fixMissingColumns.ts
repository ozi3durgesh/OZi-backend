import sequelize from '../config/database';

async function fixMissingColumns() {
  try {
    console.log('Adding missing columns to orders table...');

    // Check which columns exist and add missing ones
    const [existingColumns] = await sequelize.query("SHOW COLUMNS FROM orders");
    const existingColumnNames = existingColumns.map((col: any) => col.Field);
    
    console.log('Existing columns:', existingColumnNames);

    // Define all required columns with their definitions
    const requiredColumns = {
      'coupon_discount_title': 'VARCHAR(255)',
      'payment_status': 'VARCHAR(50) DEFAULT "unpaid"',
      'order_status': 'VARCHAR(50) DEFAULT "pending"',
      'total_tax_amount': 'DECIMAL(10,2) DEFAULT 0.00',
      'transaction_reference': 'VARCHAR(255)',
      'delivery_address_id': 'INT',
      'delivery_man_id': 'INT',
      'coupon_code': 'VARCHAR(50)',
      'order_note': 'TEXT',
      'checked': 'TINYINT DEFAULT 0',
      'delivery_charge': 'DECIMAL(10,2) DEFAULT 0.00',
      'schedule_at': 'BIGINT',
      'callback': 'VARCHAR(255)',
      'otp': 'INT',
      'pending': 'BIGINT',
      'accepted': 'BIGINT',
      'confirmed': 'BIGINT',
      'processing': 'BIGINT',
      'handover': 'BIGINT',
      'picked_up': 'BIGINT',
      'delivered': 'BIGINT',
      'reached_delivery_timestamp': 'BIGINT',
      'canceled': 'BIGINT',
      'refund_requested': 'TINYINT DEFAULT 0',
      'refunded': 'TINYINT DEFAULT 0',
      'delivery_address': 'TEXT',
      'scheduled': 'TINYINT DEFAULT 0',
      'store_discount_amount': 'DECIMAL(10,2) DEFAULT 0.00',
      'original_delivery_charge': 'DECIMAL(10,2) DEFAULT 0.00',
      'failed': 'TINYINT DEFAULT 0',
      'adjusment': 'DECIMAL(10,2) DEFAULT 0.00',
      'edited': 'TINYINT DEFAULT 0',
      'delivery_time': 'VARCHAR(50)',
      'zone_id': 'INT DEFAULT 1',
      'module_id': 'INT DEFAULT 1',
      'order_attachment': 'TEXT',
      'parcel_category_id': 'INT',
      'receiver_details': 'JSON',
      'charge_payer': 'VARCHAR(50) DEFAULT "sender"',
      'dm_tips': 'DECIMAL(10,2) DEFAULT 0.00',
      'free_delivery_by': 'VARCHAR(50)',
      'refund_request_canceled': 'TINYINT DEFAULT 0',
      'prescription_order': 'TINYINT DEFAULT 0',
      'tax_status': 'VARCHAR(50) DEFAULT "excluded"',
      'dm_vehicle_id': 'INT',
      'cancellation_reason': 'TEXT',
      'canceled_by': 'VARCHAR(50)',
      'coupon_created_by': 'VARCHAR(50)',
      'discount_on_product_by': 'VARCHAR(50)',
      'processing_time': 'INT',
      'unavailable_item_note': 'TEXT',
      'cutlery': 'TINYINT DEFAULT 0',
      'delivery_instruction': 'TEXT',
      'tax_percentage': 'DECIMAL(5,2) DEFAULT 10.00',
      'additional_charge': 'DECIMAL(10,2) DEFAULT 0.00',
      'order_proof': 'TEXT',
      'partially_paid_amount': 'DECIMAL(10,2) DEFAULT 0.00',
      'is_guest': 'TINYINT DEFAULT 0',
      'flash_admin_discount_amount': 'DECIMAL(10,2) DEFAULT 0.00',
      'flash_store_discount_amount': 'DECIMAL(10,2) DEFAULT 0.00',
      'cash_back_id': 'INT',
      'extra_packaging_amount': 'DECIMAL(10,2) DEFAULT 0.00',
      'ref_bonus_amount': 'DECIMAL(10,2) DEFAULT 0.00',
      'EcommInvoiceID': 'VARCHAR(255)',
      'EcommOrderID': 'VARCHAR(255)',
      'awb_number': 'VARCHAR(255)',
      'promised_duration': 'VARCHAR(50)',
      'guest_id': 'VARCHAR(255)',
      'password': 'VARCHAR(255)'
    };

    // Add missing columns
    for (const [columnName, columnDef] of Object.entries(requiredColumns)) {
      if (!existingColumnNames.includes(columnName)) {
        try {
          const alterQuery = `ALTER TABLE orders ADD COLUMN ${columnName} ${columnDef}`;
          await sequelize.query(alterQuery);
          console.log(`✅ Added column: ${columnName}`);
        } catch (error: any) {
          if (error.message.includes('Duplicate column name')) {
            console.log(`⚠️  Column already exists: ${columnName}`);
          } else {
            console.error(`❌ Error adding column ${columnName}:`, error.message);
          }
        }
      } else {
        console.log(`✅ Column already exists: ${columnName}`);
      }
    }

    // Update existing records to set default values for new required fields
    const updateQueries = [
      "UPDATE orders SET delivery_address = address WHERE delivery_address IS NULL OR delivery_address = ''",
      "UPDATE orders SET payment_status = 'unpaid' WHERE payment_status IS NULL",
      "UPDATE orders SET order_status = 'pending' WHERE order_status IS NULL",
      "UPDATE orders SET total_tax_amount = tax_amount WHERE total_tax_amount IS NULL",
      "UPDATE orders SET checked = 0 WHERE checked IS NULL",
      "UPDATE orders SET delivery_charge = 0.00 WHERE delivery_charge IS NULL",
      "UPDATE orders SET scheduled = 0 WHERE scheduled IS NULL",
      "UPDATE orders SET store_discount_amount = 0.00 WHERE store_discount_amount IS NULL",
      "UPDATE orders SET original_delivery_charge = 0.00 WHERE original_delivery_charge IS NULL",
      "UPDATE orders SET failed = 0 WHERE failed IS NULL",
      "UPDATE orders SET adjusment = 0.00 WHERE adjusment IS NULL",
      "UPDATE orders SET edited = 0 WHERE edited IS NULL",
      "UPDATE orders SET zone_id = 1 WHERE zone_id IS NULL",
      "UPDATE orders SET module_id = 1 WHERE module_id IS NULL",
      "UPDATE orders SET charge_payer = 'sender' WHERE charge_payer IS NULL",
      "UPDATE orders SET dm_tips = 0.00 WHERE dm_tips IS NULL",
      "UPDATE orders SET refund_request_canceled = 0 WHERE refund_request_canceled IS NULL",
      "UPDATE orders SET prescription_order = 0 WHERE prescription_order IS NULL",
      "UPDATE orders SET tax_status = 'excluded' WHERE tax_status IS NULL",
      "UPDATE orders SET cutlery = 0 WHERE cutlery IS NULL",
      "UPDATE orders SET tax_percentage = 10.00 WHERE tax_percentage IS NULL",
      "UPDATE orders SET additional_charge = 0.00 WHERE additional_charge IS NULL",
      "UPDATE orders SET partially_paid_amount = 0.00 WHERE partially_paid_amount IS NULL",
      "UPDATE orders SET is_guest = 0 WHERE is_guest IS NULL",
      "UPDATE orders SET flash_admin_discount_amount = 0.00 WHERE flash_admin_discount_amount IS NULL",
      "UPDATE orders SET flash_store_discount_amount = 0.00 WHERE flash_store_discount_amount IS NULL",
      "UPDATE orders SET extra_packaging_amount = 0.00 WHERE extra_packaging_amount IS NULL",
      "UPDATE orders SET ref_bonus_amount = 0.00 WHERE ref_bonus_amount IS NULL",
    ];

    // Execute all update queries
    for (const query of updateQueries) {
      try {
        await sequelize.query(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error: any) {
        console.error(`❌ Error executing query: ${query}`, error.message);
      }
    }

    // Add indexes for better performance
    const indexQueries = [
      "CREATE INDEX idx_order_status ON orders(order_status)",
      "CREATE INDEX idx_payment_status ON orders(payment_status)",
      "CREATE INDEX idx_delivery_man_id ON orders(delivery_man_id)",
      "CREATE INDEX idx_coupon_code ON orders(coupon_code)",
    ];

    // Execute all index queries
    for (const query of indexQueries) {
      try {
        await sequelize.query(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error: any) {
        if (error.message.includes('Duplicate key name')) {
          console.log(`⚠️  Index already exists: ${query}`);
        } else {
          console.error(`❌ Error executing query: ${query}`, error.message);
        }
      }
    }

    console.log('✅ Orders table structure fix completed successfully!');
    
    // Show the final table structure
    const [results] = await sequelize.query("DESCRIBE orders");
    console.log('\n📋 Final orders table structure:');
    console.table(results);

  } catch (error) {
    console.error('❌ Error fixing orders table structure:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
fixMissingColumns();
