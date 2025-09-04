import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

const createSampleData = async () => {
  try {
    console.log('Creating sample data for putaway testing...');
    
    // Check if we have any purchase orders
    const poCount = await sequelize.query(
      "SELECT COUNT(*) as count FROM purchase_orders",
      { type: QueryTypes.SELECT }
    );
    
    if ((poCount[0] as any).count === 0) {
      // Create sample purchase order
      await sequelize.query(`
        INSERT INTO purchase_orders (po_id, vendor_name, purchase_date, expected_delivery_date, approval_status, total_amount, total_units, total_skus) VALUES
        ('PO-2024-001', 'ABC Suppliers', '2024-01-10', '2024-01-20', 'grn', 50000.00, 100, 5),
        ('PO-2024-002', 'XYZ Vendors', '2024-01-12', '2024-01-22', 'grn', 75000.00, 150, 8)
      `, { type: QueryTypes.RAW });
      
      console.log('✅ Sample purchase orders created');
    }
    
    // Get the created PO IDs
    const pos = await sequelize.query(
      "SELECT id, po_id FROM purchase_orders LIMIT 2",
      { type: QueryTypes.SELECT }
    );
    
    if (pos.length === 0) {
      console.log('No purchase orders found');
      return;
    }
    
    const po1 = pos[0] as any;
    const po2 = pos[1] as any;
    
    // Check if we have any GRNs
    const grnCount = await sequelize.query(
      "SELECT COUNT(*) as count FROM grns",
      { type: QueryTypes.SELECT }
    );
    
    if ((grnCount[0] as any).count === 0) {
      // Create sample GRNs
      await sequelize.query(`
        INSERT INTO grns (po_id, status, created_by, created_at, updated_at) VALUES
        (${po1.id}, 'completed', 2, NOW(), NOW()),
        (${po2.id}, 'partial', 2, NOW(), NOW())
      `, { type: QueryTypes.RAW });
      
      console.log('✅ Sample GRNs created');
    }
    
    // Get the created GRN IDs
    const grns = await sequelize.query(
      "SELECT id, po_id FROM grns LIMIT 2",
      { type: QueryTypes.SELECT }
    );
    
    if (grns.length === 0) {
      console.log('No GRNs found');
      return;
    }
    
    const grn1 = grns[0] as any;
    const grn2 = grns[1] as any;
    
    // Check if we have any products
    const productCount = await sequelize.query(
      "SELECT COUNT(*) as count FROM product_master",
      { type: QueryTypes.SELECT }
    );
    
    if ((productCount[0] as any).count === 0) {
      // Create sample products
      await sequelize.query(`
        INSERT INTO product_master (SKU, ProductName, EAN_UPC, MRP, ModelNum, Color, Size, Category) VALUES
        ('SKU001', 'Test Product 1', '1234567890123', 999.99, 'MODEL-001', 'Red', 'M', 'Electronics'),
        ('SKU002', 'Test Product 2', '1234567890124', 1499.99, 'MODEL-002', 'Blue', 'L', 'Electronics'),
        ('SKU003', 'Test Product 3', '1234567890125', 799.99, 'MODEL-003', 'Green', 'S', 'Clothing')
      `, { type: QueryTypes.RAW });
      
      console.log('✅ Sample products created');
    }
    
    // Check if we have any GRN lines
    const grnLineCount = await sequelize.query(
      "SELECT COUNT(*) as count FROM grn_lines",
      { type: QueryTypes.SELECT }
    );
    
    if ((grnLineCount[0] as any).count === 0) {
      // Create sample GRN lines
      await sequelize.query(`
        INSERT INTO grn_lines (grn_id, sku_id, ean, ordered_qty, received_qty, qc_pass_qty, qc_fail_qty, rtv_qty, held_qty, line_status, created_at, updated_at) VALUES
        (${grn1.id}, 'SKU001', '1234567890123', 50, 50, 45, 3, 2, 0, 'completed', NOW(), NOW()),
        (${grn1.id}, 'SKU002', '1234567890124', 30, 30, 28, 1, 1, 0, 'completed', NOW(), NOW()),
        (${grn2.id}, 'SKU003', '1234567890125', 40, 40, 35, 2, 3, 0, 'completed', NOW(), NOW())
      `, { type: QueryTypes.RAW });
      
      console.log('✅ Sample GRN lines created');
    }
    
    console.log('✅ Sample data creation completed successfully');
    
    // Show summary
    const summary = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM purchase_orders) as po_count,
        (SELECT COUNT(*) FROM grns) as grn_count,
        (SELECT COUNT(*) FROM grn_lines) as grn_line_count,
        (SELECT COUNT(*) FROM product_master) as product_count,
        (SELECT COUNT(*) FROM bin_locations) as bin_count
    `, { type: QueryTypes.SELECT });
    
    const data = summary[0] as any;
    console.log('\n📊 Database Summary:');
    console.log(`Purchase Orders: ${data.po_count}`);
    console.log(`GRNs: ${data.grn_count}`);
    console.log(`GRN Lines: ${data.grn_line_count}`);
    console.log(`Products: ${data.product_count}`);
    console.log(`Bin Locations: ${data.bin_count}`);
    
  } catch (error) {
    console.error('Error creating sample data:', error);
    throw error;
  }
};

// Run the setup
createSampleData()
  .then(() => {
    console.log('Sample data creation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Sample data creation failed:', error);
    process.exit(1);
  });
