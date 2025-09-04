import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

const createPutawayTestData = async () => {
  try {
    console.log('Creating test data for Putaway flow...');
    
    // 1. Create test purchase orders
    await sequelize.query(`
      INSERT INTO purchase_orders (po_id, vendor_name, purchase_date, expected_delivery_date, approval_status, total_amount, total_units, total_skus) VALUES
      ('PO-2024-001', 'ABC Suppliers', '2024-01-10', '2024-01-20', 'grn', 50000.00, 100, 5),
      ('PO-2024-002', 'XYZ Vendors', '2024-01-12', '2024-01-22', 'grn', 75000.00, 150, 8)
      ON DUPLICATE KEY UPDATE vendor_name = VALUES(vendor_name)
    `, { type: QueryTypes.RAW });
    
    console.log('✅ Test purchase orders created');
    
    // 2. Get the PO IDs
    const pos = await sequelize.query(
      "SELECT id, po_id FROM purchase_orders WHERE po_id IN ('PO-2024-001', 'PO-2024-002')",
      { type: QueryTypes.SELECT }
    );
    
    const po1 = pos[0] as any;
    const po2 = pos[1] as any;
    
    // 3. Create test GRNs
    await sequelize.query(`
      INSERT INTO grns (po_id, status, created_by, created_at, updated_at) VALUES
      (${po1.id}, 'completed', 2, NOW(), NOW()),
      (${po2.id}, 'partial', 2, NOW(), NOW())
      ON DUPLICATE KEY UPDATE status = VALUES(status)
    `, { type: QueryTypes.RAW });
    
    console.log('✅ Test GRNs created');
    
    // 4. Get the GRN IDs
    const grns = await sequelize.query(
      `SELECT id, po_id FROM grns WHERE po_id IN (${po1.id}, ${po2.id})`,
      { type: QueryTypes.SELECT }
    );
    
    const grn1 = grns[0] as any;
    const grn2 = grns[1] as any;
    
    // 5. Create test products
    await sequelize.query(`
      INSERT INTO product_master (SKU, ProductName, EAN_UPC, MRP, ModelNum, Color, Size, Category) VALUES
      ('SKU001', 'Test Product 1', '1234567890123', 999.99, 'MODEL-001', 'Red', 'M', 'Electronics'),
      ('SKU002', 'Test Product 2', '1234567890124', 1499.99, 'MODEL-002', 'Blue', 'L', 'Electronics'),
      ('SKU003', 'Test Product 3', '1234567890125', 799.99, 'MODEL-003', 'Green', 'S', 'Clothing')
      ON DUPLICATE KEY UPDATE ProductName = VALUES(ProductName)
    `, { type: QueryTypes.RAW });
    
    console.log('✅ Test products created');
    
    // 6. Create test GRN lines with QC passed quantities
    await sequelize.query(`
      INSERT INTO grn_lines (grn_id, sku_id, ean, ordered_qty, received_qty, qc_pass_qty, qc_fail_qty, rtv_qty, held_qty, line_status, created_at, updated_at) VALUES
      (${grn1.id}, 'SKU001', '1234567890123', 50, 50, 45, 3, 2, 0, 'completed', NOW(), NOW()),
      (${grn1.id}, 'SKU002', '1234567890124', 30, 30, 28, 1, 1, 0, 'completed', NOW(), NOW()),
      (${grn2.id}, 'SKU003', '1234567890125', 40, 40, 35, 2, 3, 0, 'completed', NOW(), NOW())
      ON DUPLICATE KEY UPDATE qc_pass_qty = VALUES(qc_pass_qty)
    `, { type: QueryTypes.RAW });
    
    console.log('✅ Test GRN lines created');
    
    // 7. Show summary
    const summary = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM purchase_orders WHERE po_id IN ('PO-2024-001', 'PO-2024-002')) as po_count,
        (SELECT COUNT(*) FROM grns WHERE po_id IN (${po1.id}, ${po2.id})) as grn_count,
        (SELECT COUNT(*) FROM grn_lines WHERE grn_id IN (${grn1.id}, ${grn2.id})) as grn_line_count,
        (SELECT COUNT(*) FROM product_master WHERE SKU IN ('SKU001', 'SKU002', 'SKU003')) as product_count,
        (SELECT COUNT(*) FROM bin_locations) as bin_count
    `, { type: QueryTypes.SELECT });
    
    const data = summary[0] as any;
    console.log('\n📊 Test Data Summary:');
    console.log(`Purchase Orders: ${data.po_count}`);
    console.log(`GRNs: ${data.grn_count}`);
    console.log(`GRN Lines: ${data.grn_line_count}`);
    console.log(`Products: ${data.product_count}`);
    console.log(`Bin Locations: ${data.bin_count}`);
    
    console.log('\n🎯 Test Data Ready for Putaway Flow!');
    console.log('GRN IDs:', grn1.id, grn2.id);
    console.log('SKU IDs: SKU001, SKU002, SKU003');
    console.log('Bin Locations: A1-B1-C1, A1-B1-C2, A1-B2-C1');
    
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
};

// Run the setup
createPutawayTestData()
  .then(() => {
    console.log('Test data creation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test data creation failed:', error);
    process.exit(1);
  });
