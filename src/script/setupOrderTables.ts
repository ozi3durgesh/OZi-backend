import sequelize from '../config/database';
import { DataTypes } from 'sequelize';

async function setupOrderTables() {
  try {
    console.log('Setting up orders table with PHP production fields...');

    // Create orders table with all fields
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        cart JSON NOT NULL,
        coupon_discount_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
        order_amount DECIMAL(10,2) NOT NULL,
        order_type VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        store_id INT NOT NULL,
        distance DECIMAL(10,6) DEFAULT 0.000000 NOT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
        tax_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
        address TEXT NOT NULL,
        latitude DECIMAL(15,12) DEFAULT 0.000000000000 NOT NULL,
        longitude DECIMAL(15,12) DEFAULT 0.000000000000 NOT NULL,
        contact_person_name VARCHAR(255) DEFAULT '' NOT NULL,
        contact_person_number VARCHAR(20) NOT NULL,
        address_type VARCHAR(50) DEFAULT 'others' NOT NULL,
        is_scheduled TINYINT DEFAULT 0 NOT NULL,
        scheduled_timestamp BIGINT DEFAULT 0 NOT NULL,
        promised_delv_tat VARCHAR(10) DEFAULT '24' NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        
        -- Additional fields to match PHP functionality
        order_note TEXT,
        delivery_instruction TEXT,
        unavailable_item_note TEXT,
        dm_tips DECIMAL(10,2) DEFAULT 0.00,
        cutlery TINYINT DEFAULT 0,
        partial_payment TINYINT DEFAULT 0,
        is_buy_now TINYINT DEFAULT 0,
        extra_packaging_amount DECIMAL(10,2) DEFAULT 0.00,
        create_new_user TINYINT DEFAULT 0,
        is_guest TINYINT DEFAULT 0,
        otp INT,
        zone_id INT DEFAULT 1,
        module_id INT DEFAULT 1,
        parcel_category_id INT,
        receiver_details JSON,
        charge_payer VARCHAR(50),
        order_attachment JSON,
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        order_status VARCHAR(50) DEFAULT 'pending',
        transaction_reference VARCHAR(255),
        confirmed BIGINT,
        pending BIGINT,
        canceled BIGINT,
        canceled_by VARCHAR(255),
        cancellation_reason TEXT,
        refund_requested TINYINT DEFAULT 0,
        refunded TINYINT DEFAULT 0,
        failed TINYINT DEFAULT 0,
        delivered TINYINT DEFAULT 0,
        processing TINYINT DEFAULT 0,
        picked_up TINYINT DEFAULT 0,
        handover TINYINT DEFAULT 0,
        reached_pickup TINYINT DEFAULT 0,
        out_for_delivery TINYINT DEFAULT 0,
        out_for_pickup TINYINT DEFAULT 0,
        dm_vehicle_id INT,
        awb_number VARCHAR(255),
        delivery_man_id INT,
        partially_paid_amount DECIMAL(10,2) DEFAULT 0.00,
        ref_bonus_amount DECIMAL(10,2) DEFAULT 0.00,
        flash_admin_discount_amount DECIMAL(10,2) DEFAULT 0.00,
        flash_store_discount_amount DECIMAL(10,2) DEFAULT 0.00,
        additional_charge DECIMAL(10,2) DEFAULT 0.00,
        coupon_created_by VARCHAR(255),
        coupon_discount_title VARCHAR(255),
        store_discount_amount DECIMAL(10,2) DEFAULT 0.00,
        tax_percentage DECIMAL(5,2) DEFAULT 10.00,
        total_tax_amount DECIMAL(10,2) DEFAULT 0.00,
        original_delivery_charge DECIMAL(10,2) DEFAULT 0.00,
        free_delivery_by VARCHAR(255),
        tax_status VARCHAR(50) DEFAULT 'excluded',
        prescription_order TINYINT DEFAULT 0,
        scheduled TINYINT DEFAULT 0,
        schedule_at BIGINT,
        
        INDEX idx_user_id (user_id),
        INDEX idx_store_id (store_id),
        INDEX idx_created_at (created_at),
        INDEX idx_order_status (order_status),
        INDEX idx_payment_status (payment_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Orders table setup completed successfully!');
    
    // Check if we need to add missing columns to existing table
    const [existingColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'orders'
    `);
    
    const existingColumnNames = (existingColumns as any[]).map(col => col.COLUMN_NAME);
    
    // List of new columns to add
    const newColumns = [
      'order_note',
      'delivery_instruction', 
      'unavailable_item_note',
      'dm_tips',
      'cutlery',
      'partial_payment',
      'is_buy_now',
      'extra_packaging_amount',
      'create_new_user',
      'is_guest',
      'otp',
      'zone_id',
      'module_id',
      'parcel_category_id',
      'receiver_details',
      'charge_payer',
      'order_attachment',
      'payment_status',
      'order_status',
      'transaction_reference',
      'confirmed',
      'pending',
      'canceled',
      'canceled_by',
      'cancellation_reason',
      'refund_requested',
      'refunded',
      'failed',
      'delivered',
      'processing',
      'picked_up',
      'handover',
      'reached_pickup',
      'out_for_delivery',
      'out_for_pickup',
      'dm_vehicle_id',
      'awb_number',
      'delivery_man_id',
      'partially_paid_amount',
      'ref_bonus_amount',
      'flash_admin_discount_amount',
      'flash_store_discount_amount',
      'additional_charge',
      'coupon_created_by',
      'coupon_discount_title',
      'store_discount_amount',
      'tax_percentage',
      'total_tax_amount',
      'original_delivery_charge',
      'free_delivery_by',
      'tax_status',
      'prescription_order',
      'scheduled',
      'schedule_at'
    ];

    // Add missing columns
    for (const column of newColumns) {
      if (!existingColumnNames.includes(column)) {
        let columnDefinition = '';
        
        switch (column) {
          case 'order_note':
          case 'delivery_instruction':
          case 'unavailable_item_note':
          case 'cancellation_reason':
            columnDefinition = 'TEXT';
            break;
          case 'dm_tips':
          case 'extra_packaging_amount':
          case 'partially_paid_amount':
          case 'ref_bonus_amount':
          case 'flash_admin_discount_amount':
          case 'flash_store_discount_amount':
          case 'additional_charge':
          case 'store_discount_amount':
          case 'total_tax_amount':
          case 'original_delivery_charge':
            columnDefinition = 'DECIMAL(10,2) DEFAULT 0.00';
            break;
          case 'cutlery':
          case 'partial_payment':
          case 'is_buy_now':
          case 'create_new_user':
          case 'is_guest':
          case 'refund_requested':
          case 'refunded':
          case 'failed':
          case 'delivered':
          case 'processing':
          case 'picked_up':
          case 'handover':
          case 'reached_pickup':
          case 'out_for_delivery':
          case 'out_for_pickup':
          case 'prescription_order':
          case 'scheduled':
            columnDefinition = 'TINYINT DEFAULT 0';
            break;
          case 'otp':
          case 'zone_id':
          case 'module_id':
          case 'parcel_category_id':
          case 'dm_vehicle_id':
          case 'delivery_man_id':
            columnDefinition = 'INT';
            break;
          case 'confirmed':
          case 'pending':
          case 'canceled':
          case 'schedule_at':
            columnDefinition = 'BIGINT';
            break;
          case 'receiver_details':
          case 'order_attachment':
            columnDefinition = 'JSON';
            break;
          case 'charge_payer':
          case 'payment_status':
          case 'order_status':
          case 'canceled_by':
          case 'awb_number':
          case 'free_delivery_by':
          case 'tax_status':
            columnDefinition = 'VARCHAR(255)';
            break;
          case 'coupon_created_by':
          case 'coupon_discount_title':
            columnDefinition = 'VARCHAR(255)';
            break;
          case 'dm_tips':
            columnDefinition = 'DECIMAL(10,2) DEFAULT 0.00';
            break;
          case 'tax_percentage':
            columnDefinition = 'DECIMAL(5,2) DEFAULT 10.00';
            break;
          default:
            columnDefinition = 'VARCHAR(255)';
        }

        try {
          await sequelize.query(`ALTER TABLE orders ADD COLUMN ${column} ${columnDefinition}`);
          console.log(`Added column: ${column}`);
        } catch (error) {
          console.log(`Column ${column} already exists or error:`, error);
        }
      }
    }

    console.log('Order table migration completed!');
    
  } catch (error) {
    console.error('Error setting up order tables:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the setup
setupOrderTables();
