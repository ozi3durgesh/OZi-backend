import sequelize from '../config/database';

async function updateOrdersTableStructure() {
  try {
    console.log('Updating orders table structure to match production requirements...');

    // Add new columns to existing orders table
    const alterQueries = [
      // Core order fields
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount_title VARCHAR(255) AFTER coupon_discount_amount",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid' NOT NULL AFTER order_type",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'pending' NOT NULL AFTER payment_status",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_tax_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL AFTER order_status",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(255) AFTER payment_method",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_id INT AFTER transaction_reference",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_man_id INT AFTER delivery_address_id",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) AFTER delivery_man_id",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_note TEXT AFTER coupon_code",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS checked TINYINT DEFAULT 0 NOT NULL AFTER order_type",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10,2) DEFAULT 0.00 NOT NULL AFTER created_at",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS schedule_at BIGINT AFTER delivery_charge",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS callback VARCHAR(255) AFTER schedule_at",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS otp INT AFTER callback",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS pending BIGINT AFTER otp",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted BIGINT AFTER pending",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed BIGINT AFTER accepted",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS processing BIGINT AFTER confirmed",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS handover BIGINT AFTER processing",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS picked_up BIGINT AFTER handover",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered BIGINT AFTER picked_up",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS reached_delivery_timestamp BIGINT AFTER delivered",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS canceled BIGINT AFTER reached_delivery_timestamp",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_requested TINYINT DEFAULT 0 NOT NULL AFTER canceled",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded TINYINT DEFAULT 0 NOT NULL AFTER refund_requested",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT NOT NULL AFTER refunded",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled TINYINT DEFAULT 0 NOT NULL AFTER delivery_address",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_discount_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL AFTER scheduled",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_delivery_charge DECIMAL(10,2) DEFAULT 0.00 NOT NULL AFTER store_discount_amount",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS failed TINYINT DEFAULT 0 NOT NULL AFTER original_delivery_charge",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS adjusment DECIMAL(10,2) DEFAULT 0.00 NOT NULL AFTER failed",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS edited TINYINT DEFAULT 0 NOT NULL AFTER adjusment",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time VARCHAR(50) AFTER edited",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS zone_id INT DEFAULT 1 AFTER delivery_time",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS module_id INT DEFAULT 1 AFTER zone_id",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_attachment TEXT AFTER module_id",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS parcel_category_id INT AFTER order_attachment",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS receiver_details JSON AFTER parcel_category_id",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS charge_payer VARCHAR(50) DEFAULT 'sender' NOT NULL AFTER receiver_details",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS dm_tips DECIMAL(10,2) DEFAULT 0.00 NOT NULL AFTER distance",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS free_delivery_by VARCHAR(50) AFTER dm_tips",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_request_canceled TINYINT DEFAULT 0 NOT NULL AFTER free_delivery_by",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS prescription_order TINYINT DEFAULT 0 NOT NULL AFTER refund_request_canceled",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_status VARCHAR(50) DEFAULT 'excluded' NOT NULL AFTER prescription_order",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS dm_vehicle_id INT AFTER tax_status",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT AFTER dm_vehicle_id",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS canceled_by VARCHAR(50) AFTER cancellation_reason",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_created_by VARCHAR(50) AFTER canceled_by",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_on_product_by VARCHAR(50) AFTER coupon_created_by",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS processing_time INT AFTER discount_on_product_by",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS unavailable_item_note TEXT AFTER processing_time",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS cutlery TINYINT DEFAULT 0 NOT NULL AFTER unavailable_item_note",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_instruction TEXT AFTER cutlery",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 10.00 NOT NULL AFTER delivery_instruction",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS additional_charge DECIMAL(10,2) DEFAULT 0.00 NOT NULL AFTER tax_percentage",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_proof TEXT AFTER additional_charge",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS partially_paid_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL AFTER order_proof",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_guest TINYINT DEFAULT 0 NOT NULL AFTER partially_paid_amount",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS flash_admin_discount_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL AFTER is_guest",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS flash_store_discount_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL AFTER flash_admin_discount_amount",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_back_id INT AFTER flash_store_discount_amount",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS extra_packaging_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL AFTER cash_back_id",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS ref_bonus_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL AFTER extra_packaging_amount",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS EcommInvoiceID VARCHAR(255) AFTER ref_bonus_amount",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS EcommOrderID VARCHAR(255) AFTER EcommInvoiceID",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb_number VARCHAR(255) AFTER EcommOrderID",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS promised_duration VARCHAR(50) AFTER awb_number",
    ];

    // Execute all alter queries
    for (const query of alterQueries) {
      try {
        await sequelize.query(query);
        console.log(`Executed: ${query}`);
      } catch (error: any) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`Column already exists, skipping: ${query}`);
        } else {
          console.error(`Error executing query: ${query}`, error.message);
        }
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
        console.log(`Executed: ${query}`);
      } catch (error: any) {
        console.error(`Error executing query: ${query}`, error.message);
      }
    }

    // Add new indexes for better performance
    const indexQueries = [
      "CREATE INDEX IF NOT EXISTS idx_order_status ON orders(order_status)",
      "CREATE INDEX IF NOT EXISTS idx_payment_status ON orders(payment_status)",
      "CREATE INDEX IF NOT EXISTS idx_delivery_man_id ON orders(delivery_man_id)",
      "CREATE INDEX IF NOT EXISTS idx_coupon_code ON orders(coupon_code)",
    ];

    // Execute all index queries
    for (const query of indexQueries) {
      try {
        await sequelize.query(query);
        console.log(`Executed: ${query}`);
      } catch (error: any) {
        if (error.message.includes('Duplicate key name')) {
          console.log(`Index already exists, skipping: ${query}`);
        } else {
          console.error(`Error executing query: ${query}`, error.message);
        }
      }
    }

    console.log('Orders table structure update completed successfully!');
    
    // Show the final table structure
    const [results] = await sequelize.query("DESCRIBE orders");
    console.log('\nFinal orders table structure:');
    console.table(results);

  } catch (error) {
    console.error('Error updating orders table structure:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
updateOrdersTableStructure();
