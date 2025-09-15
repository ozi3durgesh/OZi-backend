import sequelize from '../config/database';

async function createReturnTable() {
  try {
    console.log('🔄 Creating return_request_items table...');
    
    // Create the return_request_items table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`return_request_items\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`return_order_id\` varchar(50) NOT NULL,
        \`original_order_id\` varchar(50) NOT NULL,
        \`customer_id\` int NOT NULL,
        \`return_reason\` enum('defective_product','wrong_item','damaged_in_transit','not_as_described','size_issue','quality_issue','customer_changed_mind','duplicate_order','late_delivery','try_and_buy_not_satisfied','try_and_buy_expired','other') NOT NULL,
        \`status\` enum('pending','approved','pickup_scheduled','in_transit','received','qc_pending','qc_completed','refund_initiated','refunded','rejected','cancelled') NOT NULL DEFAULT 'pending',
        \`return_type\` enum('full_return','partial_return','exchange','try_and_buy_return') NOT NULL DEFAULT 'full_return',
        \`total_items_count\` int NOT NULL DEFAULT '0',
        \`total_return_amount\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`pidge_tracking_id\` varchar(100) DEFAULT NULL,
        \`pickup_address\` json DEFAULT NULL,
        \`return_notes\` text,
        \`images\` json DEFAULT NULL,
        \`item_id\` int NOT NULL,
        \`quantity\` int NOT NULL,
        \`item_details\` text,
        \`variation\` varchar(255) DEFAULT NULL,
        \`price\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`item_images\` json DEFAULT NULL,
        \`item_notes\` text,
        \`qc_status\` enum('pending','passed','failed','needs_repair','disposal') NOT NULL DEFAULT 'pending',
        \`qc_notes\` text,
        \`qc_by\` int DEFAULT NULL,
        \`qc_at\` bigint DEFAULT NULL,
        \`timeline_events\` json DEFAULT NULL,
        \`last_event_type\` enum('created','approved','pickup_scheduled','picked_up','in_transit','received','qc_started','qc_completed','grn_created','putaway_started','putaway_completed','refund_initiated','refunded','rejected','cancelled','status_updated') NOT NULL DEFAULT 'created',
        \`last_event_notes\` text,
        \`last_event_metadata\` json DEFAULT NULL,
        \`is_try_and_buy\` tinyint NOT NULL DEFAULT '0',
        \`customer_feedback\` text,
        \`overall_rating\` int DEFAULT NULL,
        \`item_feedback\` text,
        \`item_rating\` int DEFAULT NULL,
        \`try_and_buy_reason\` varchar(50) DEFAULT NULL,
        \`grn_id\` int DEFAULT NULL,
        \`grn_status\` varchar(50) DEFAULT NULL,
        \`received_quantity\` int DEFAULT NULL,
        \`expected_quantity\` int DEFAULT NULL,
        \`putaway_status\` varchar(50) DEFAULT NULL,
        \`bin_location_id\` varchar(50) DEFAULT NULL,
        \`putaway_by\` int DEFAULT NULL,
        \`putaway_at\` bigint DEFAULT NULL,
        \`putaway_notes\` text,
        \`created_at\` bigint NOT NULL,
        \`updated_at\` bigint NOT NULL,
        \`created_by\` int NOT NULL,
        \`is_active\` tinyint NOT NULL DEFAULT '1',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`return_order_id\` (\`return_order_id\`),
        KEY \`original_order_id\` (\`original_order_id\`),
        KEY \`customer_id\` (\`customer_id\`),
        KEY \`status\` (\`status\`),
        KEY \`item_id\` (\`item_id\`),
        KEY \`qc_status\` (\`qc_status\`),
        KEY \`is_try_and_buy\` (\`is_try_and_buy\`),
        KEY \`grn_id\` (\`grn_id\`),
        KEY \`putaway_status\` (\`putaway_status\`),
        KEY \`created_at\` (\`created_at\`),
        CONSTRAINT \`return_request_items_customer_id_fkey\` FOREIGN KEY (\`customer_id\`) REFERENCES \`Users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`return_request_items_created_by_fkey\` FOREIGN KEY (\`created_by\`) REFERENCES \`Users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    
    console.log('✅ Created return_request_items table successfully');
    
    // Verify the table was created
    const [results] = await sequelize.query(`
      SHOW TABLES LIKE 'return_request_items'
    `);
    
    if (results.length > 0) {
      console.log('📋 Table verification: return_request_items table exists');
      
      // Show table structure
      const [structure] = await sequelize.query(`
        DESCRIBE return_request_items
      `);
      
      console.log('📊 Table structure:');
      console.table(structure);
    } else {
      console.log('❌ Table verification failed: return_request_items table not found');
    }
    
    console.log('🎉 Table creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Table creation failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the table creation
createReturnTable()
  .then(() => {
    console.log('✅ Table creation script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Table creation script failed:', error);
    process.exit(1);
  });
