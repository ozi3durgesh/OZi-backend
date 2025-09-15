const sequelize = require('./dist/config/database.js').default;

async function insertTestReturnRequest() {
  try {
    console.log('🔄 Inserting test return request item...');
    
    const timestamp = Date.now();
    
    await sequelize.query(`
      INSERT INTO return_request_items (
        return_order_id,
        original_order_id,
        customer_id,
        return_reason,
        status,
        return_type,
        total_items_count,
        total_return_amount,
        item_id,
        quantity,
        price,
        item_details,
        qc_status,
        timeline_events,
        last_event_type,
        last_event_notes,
        created_at,
        updated_at,
        created_by,
        is_active
      ) VALUES (
        'ozi17579182057130001-PD',
        'ozi17579182057130001',
        33,
        'defective_product',
        'pending',
        'full_return',
        1,
        100.00,
        328,
        1,
        100.00,
        'Test item for return',
        'pending',
        '[{"event_type":"created","status":"pending","notes":"Return request created for item 328","metadata":null,"created_at":${timestamp},"created_by":1}]',
        'created',
        'Return request created for item 328',
        ${timestamp},
        ${timestamp},
        1,
        1
      )
    `);
    
    console.log('✅ Test return request item inserted successfully');
    
    // Verify the insertion
    const [results] = await sequelize.query(`
      SELECT * FROM return_request_items WHERE return_order_id = 'ozi17579182057130001-PD'
    `);
    
    console.log('📋 Inserted record:', results[0]);
    
  } catch (error) {
    console.error('❌ Error inserting test return request:', error);
  } finally {
    await sequelize.close();
  }
}

insertTestReturnRequest();
