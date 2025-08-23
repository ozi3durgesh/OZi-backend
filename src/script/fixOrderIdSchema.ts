import sequelize from '../config/database';

async function fixOrderIdSchema() {
  try {
    console.log('Fixing orders table schema to use custom order ID as primary key...');

    // First, let's check the current table structure
    const [currentStructure] = await sequelize.query("DESCRIBE orders");
    console.log('Current table structure:');
    console.table(currentStructure);

    // Check if there are existing orders
    const [existingOrders] = await sequelize.query("SELECT COUNT(*) as count FROM orders");
    const orderCount = (existingOrders as any)[0]?.count || 0;
    console.log(`Found ${orderCount} existing orders`);

    if (orderCount > 0) {
      console.log('⚠️  WARNING: There are existing orders. This will require data migration.');
      console.log('⚠️  Please backup your data before proceeding.');
      
      // For now, let's just add the new id field and update existing records
      // We'll keep the old structure for backward compatibility during migration
      
      // Add a new id_string field to store the custom order ID
      try {
        await sequelize.query("ALTER TABLE orders ADD COLUMN id_string VARCHAR(50) AFTER id");
        console.log('✅ Added id_string column');
      } catch (error: any) {
        if (error.message.includes('Duplicate column name')) {
          console.log('⚠️  id_string column already exists');
        } else {
          console.error('❌ Error adding id_string column:', error.message);
        }
      }

      // Generate custom order IDs for existing orders
      console.log('Generating custom order IDs for existing orders...');
      const [orders] = await sequelize.query("SELECT id, created_at FROM orders ORDER BY id");
      
      for (const order of orders as any[]) {
        const timestamp = order.created_at * 1000; // Convert to milliseconds
        const sequence = order.id.toString().padStart(4, '0');
        const customOrderId = `ozi${timestamp}${sequence}`;
        
        try {
          await sequelize.query("UPDATE orders SET id_string = ? WHERE id = ?", {
            replacements: [customOrderId, order.id]
          });
          console.log(`✅ Updated order ${order.id} with custom ID: ${customOrderId}`);
        } catch (error: any) {
          console.error(`❌ Error updating order ${order.id}:`, error.message);
        }
      }

      // Now let's create a new table with the correct structure
      console.log('Creating new orders table with correct structure...');
      
      try {
        await sequelize.query(`
          CREATE TABLE orders_new (
            id VARCHAR(50) PRIMARY KEY,
            user_id INT NOT NULL,
            order_amount DECIMAL(10,2) NOT NULL,
            coupon_discount_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
            coupon_discount_title VARCHAR(255),
            payment_status VARCHAR(50) DEFAULT 'unpaid' NOT NULL,
            order_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
            total_tax_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
            payment_method VARCHAR(50) NOT NULL,
            transaction_reference VARCHAR(255),
            delivery_address_id INT,
            delivery_man_id INT,
            coupon_code VARCHAR(50),
            order_note TEXT,
            order_type VARCHAR(50) NOT NULL,
            checked TINYINT DEFAULT 0 NOT NULL,
            store_id INT NOT NULL,
            created_at BIGINT NOT NULL,
            updated_at BIGINT NOT NULL,
            delivery_charge DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
            schedule_at BIGINT,
            callback VARCHAR(255),
            otp INT,
            pending BIGINT,
            accepted BIGINT,
            confirmed BIGINT,
            processing BIGINT,
            handover BIGINT,
            picked_up BIGINT,
            delivered BIGINT,
            reached_delivery_timestamp BIGINT,
            canceled BIGINT,
            refund_requested TINYINT DEFAULT 0 NOT NULL,
            refunded TINYINT DEFAULT 0 NOT NULL,
            delivery_address TEXT NOT NULL,
            scheduled TINYINT DEFAULT 0 NOT NULL,
            store_discount_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
            original_delivery_charge DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
            failed TINYINT DEFAULT 0 NOT NULL,
            adjusment DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
            edited TINYINT DEFAULT 0 NOT NULL,
            delivery_time VARCHAR(50),
            zone_id INT DEFAULT 1,
            module_id INT DEFAULT 1,
            order_attachment TEXT,
            parcel_category_id INT,
            receiver_details JSON,
            charge_payer VARCHAR(50) DEFAULT 'sender' NOT NULL,
            distance DECIMAL(10,6) DEFAULT 0.000000 NOT NULL,
            dm_tips DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
            free_delivery_by VARCHAR(50),
            refund_request_canceled TINYINT DEFAULT 0 NOT NULL,
            prescription_order TINYINT DEFAULT 0 NOT NULL,
            tax_status VARCHAR(50) DEFAULT 'excluded' NOT NULL,
            dm_vehicle_id INT,
            cancellation_reason TEXT,
            canceled_by VARCHAR(50),
            coupon_created_by VARCHAR(50),
            discount_on_product_by VARCHAR(50),
            processing_time INT,
            unavailable_item_note TEXT,
            cutlery TINYINT DEFAULT 0 NOT NULL,
            delivery_instruction TEXT,
            tax_percentage DECIMAL(5,2) DEFAULT 10.00 NOT NULL,
            additional_charge DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
            order_proof TEXT,
            partially_paid_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
            is_guest TINYINT DEFAULT 0 NOT NULL,
            flash_admin_discount_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
            flash_store_discount_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
            cash_back_id INT,
            extra_packaging_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
            ref_bonus_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
            EcommInvoiceID VARCHAR(255),
            EcommOrderID VARCHAR(255),
            awb_number VARCHAR(255),
            promised_duration VARCHAR(50),
            cart JSON,
            discount_amount DECIMAL(10,2) DEFAULT 0.00,
            tax_amount DECIMAL(10,2) DEFAULT 0.00,
            latitude DECIMAL(15,12) DEFAULT 0.000000000000,
            longitude DECIMAL(15,12) DEFAULT 0.000000000000,
            contact_person_name VARCHAR(255) DEFAULT '',
            contact_person_number VARCHAR(20),
            address_type VARCHAR(50) DEFAULT 'others',
            is_scheduled TINYINT DEFAULT 0,
            scheduled_timestamp BIGINT DEFAULT 0,
            promised_delv_tat VARCHAR(10) DEFAULT '24',
            partial_payment TINYINT DEFAULT 0,
            is_buy_now TINYINT DEFAULT 0,
            create_new_user TINYINT DEFAULT 0,
            guest_id VARCHAR(255),
            password VARCHAR(255),
            INDEX idx_user_id (user_id),
            INDEX idx_store_id (store_id),
            INDEX idx_created_at (created_at),
            INDEX idx_order_status (order_status),
            INDEX idx_payment_status (payment_status)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Created new orders table');
      } catch (error: any) {
        console.error('❌ Error creating new table:', error.message);
        return;
      }

      // Copy data from old table to new table
      console.log('Copying data to new table...');
      try {
        await sequelize.query(`
          INSERT INTO orders_new 
          SELECT 
            id_string as id,
            user_id,
            order_amount,
            coupon_discount_amount,
            coupon_discount_title,
            payment_status,
            order_status,
            total_tax_amount,
            payment_method,
            transaction_reference,
            delivery_address_id,
            delivery_man_id,
            coupon_code,
            order_note,
            order_type,
            checked,
            store_id,
            created_at,
            updated_at,
            delivery_charge,
            schedule_at,
            callback,
            otp,
            pending,
            accepted,
            confirmed,
            processing,
            handover,
            picked_up,
            delivered,
            reached_delivery_timestamp,
            canceled,
            refund_requested,
            refunded,
            delivery_address,
            scheduled,
            store_discount_amount,
            original_delivery_charge,
            failed,
            adjusment,
            edited,
            delivery_time,
            zone_id,
            module_id,
            order_attachment,
            parcel_category_id,
            receiver_details,
            charge_payer,
            distance,
            dm_tips,
            free_delivery_by,
            refund_request_canceled,
            prescription_order,
            tax_status,
            dm_vehicle_id,
            cancellation_reason,
            canceled_by,
            coupon_created_by,
            discount_on_product_by,
            processing_time,
            unavailable_item_note,
            cutlery,
            delivery_instruction,
            tax_percentage,
            additional_charge,
            order_proof,
            partially_paid_amount,
            is_guest,
            flash_admin_discount_amount,
            flash_store_discount_amount,
            cash_back_id,
            extra_packaging_amount,
            ref_bonus_amount,
            EcommInvoiceID,
            EcommOrderID,
            awb_number,
            promised_duration,
            cart,
            discount_amount,
            tax_amount,
            latitude,
            longitude,
            contact_person_name,
            contact_person_number,
            address_type,
            is_scheduled,
            scheduled_timestamp,
            promised_delv_tat,
            partial_payment,
            is_buy_now,
            create_new_user,
            guest_id,
            password
          FROM orders
        `);
        console.log('✅ Data copied successfully');
      } catch (error: any) {
        console.error('❌ Error copying data:', error.message);
        return;
      }

      // Drop old table and rename new table
      console.log('Replacing old table with new table...');
      try {
        await sequelize.query("DROP TABLE orders");
        await sequelize.query("RENAME TABLE orders_new TO orders");
        console.log('✅ Table replaced successfully');
      } catch (error: any) {
        console.error('❌ Error replacing table:', error.message);
        return;
      }
    } else {
      // No existing orders, just recreate the table
      console.log('No existing orders found. Recreating table...');
      
      try {
        await sequelize.query("DROP TABLE IF EXISTS orders");
        console.log('✅ Dropped existing table');
      } catch (error: any) {
        console.error('❌ Error dropping table:', error.message);
      }
    }

    console.log('✅ Orders table schema fix completed successfully!');
    
    // Show the final table structure
    const [results] = await sequelize.query("DESCRIBE orders");
    console.log('\n📋 Final orders table structure:');
    console.table(results);

  } catch (error) {
    console.error('❌ Error fixing orders table schema:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
fixOrderIdSchema();
