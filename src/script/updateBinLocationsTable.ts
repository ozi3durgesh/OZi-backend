// script/updateBinLocationsTable.ts
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

async function updateBinLocationsTable() {
  try {
    console.log('🚀 Starting bin_locations table update...');

    // Check if table exists
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    const binLocationsExists = tableExists.includes('bin_locations');
    
    if (!binLocationsExists) {
      console.log('❌ bin_locations table does not exist. Please run the putaway setup first.');
      return;
    }

    // Add new columns to bin_locations table
    const newColumns = [
      {
        name: 'bin_id',
        definition: 'VARCHAR(50) UNIQUE COMMENT "Unique bin identifier"'
      },
      {
        name: 'bin_name',
        definition: 'VARCHAR(100) COMMENT "Human readable bin name"'
      },
      {
        name: 'bin_type',
        definition: 'VARCHAR(50) COMMENT "Type of bin (Good Bin, Bad Bin, etc.)"'
      },
      {
        name: 'zone_type',
        definition: 'VARCHAR(50) COMMENT "Type of zone (Each, Bulk, etc.)"'
      },
      {
        name: 'zone_name',
        definition: 'VARCHAR(100) COMMENT "Name of the zone"'
      },
      {
        name: 'bin_dimensions',
        definition: 'VARCHAR(100) COMMENT "Physical dimensions of the bin"'
      },
      {
        name: 'preferred_product_category',
        definition: 'VARCHAR(100) COMMENT "Preferred product category for this bin"'
      },
      {
        name: 'no_of_categories',
        definition: 'INTEGER DEFAULT 0 COMMENT "Number of categories in this bin"'
      },
      {
        name: 'no_of_sku_uom',
        definition: 'INTEGER DEFAULT 0 COMMENT "Number of SKU/UOM in this bin"'
      },
      {
        name: 'no_of_items',
        definition: 'INTEGER DEFAULT 0 COMMENT "Number of items in this bin"'
      },
      {
        name: 'bin_capacity',
        definition: 'INTEGER DEFAULT 0 COMMENT "Maximum capacity of the bin"'
      },
      {
        name: 'bin_created_by',
        definition: 'VARCHAR(100) COMMENT "User who created the bin"'
      },
      {
        name: 'bin_status',
        definition: 'VARCHAR(50) DEFAULT "Unlocked" COMMENT "Current status of the bin"'
      }
    ];

    console.log('📝 Adding new columns to bin_locations table...');
    
    for (const column of newColumns) {
      try {
        await sequelize.query(
          `ALTER TABLE bin_locations ADD COLUMN ${column.name} ${column.definition}`,
          { type: QueryTypes.RAW }
        );
        console.log(`✅ Added column: ${column.name}`);
      } catch (error: any) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`ℹ️  Column ${column.name} already exists, skipping...`);
        } else {
          console.log(`❌ Error adding column ${column.name}:`, error.message);
        }
      }
    }

    // Update existing records with default values
    console.log('🔄 Updating existing records with default values...');
    
    await sequelize.query(
      `UPDATE bin_locations SET 
        bin_id = CONCAT('BIN_', id),
        bin_name = bin_code,
        bin_type = 'Good Bin',
        zone_type = 'Each',
        zone_name = zone,
        bin_dimensions = '100 x 100 x 100 cm',
        preferred_product_category = '',
        no_of_categories = CASE WHEN category_mapping IS NOT NULL THEN JSON_LENGTH(category_mapping) ELSE 0 END,
        no_of_sku_uom = CASE WHEN sku_mapping IS NOT NULL THEN JSON_LENGTH(sku_mapping) ELSE 0 END,
        no_of_items = current_quantity,
        bin_capacity = capacity,
        bin_created_by = 'System',
        bin_status = CASE 
          WHEN status = 'active' THEN 'Unlocked'
          WHEN status = 'inactive' THEN 'All bin activities locked'
          WHEN status = 'maintenance' THEN 'All bin activities locked'
          ELSE 'Unlocked'
        END
      WHERE bin_id IS NULL`,
      { type: QueryTypes.RAW }
    );

    console.log('✅ Updated existing records');

    // Insert sample data
    console.log('📦 Inserting sample data...');
    
    const sampleData = [
      {
        bin_id: '3026172',
        bin_code: 'BIN_3026172',
        zone: 'default',
        aisle: 'A01',
        rack: 'R01',
        shelf: 'S01',
        capacity: 5000,
        current_quantity: 100,
        sku_mapping: JSON.stringify([]),
        category_mapping: JSON.stringify([]),
        status: 'active',
        bin_name: 'default',
        bin_type: 'Good Bin',
        zone_type: 'Each',
        zone_name: 'default',
        bin_dimensions: '100 x 100 x 100 cm',
        preferred_product_category: '',
        no_of_categories: 0,
        no_of_sku_uom: 0,
        no_of_items: 100,
        bin_capacity: 5000,
        bin_created_by: 'Amit kumar',
        bin_status: 'Unlocked'
      },
      {
        bin_id: '3026833',
        bin_code: 'BIN_3026833',
        zone: 'ZONE-1',
        aisle: 'A01',
        rack: 'R01',
        shelf: 'S01',
        capacity: 100,
        current_quantity: 0,
        sku_mapping: JSON.stringify([]),
        category_mapping: JSON.stringify([]),
        status: 'active',
        bin_name: 'R001-S01',
        bin_type: 'Good Bin',
        zone_type: 'Each',
        zone_name: 'ZONE-1',
        bin_dimensions: '90 x 45 x 48 cm',
        preferred_product_category: '',
        no_of_categories: 0,
        no_of_sku_uom: 0,
        no_of_items: 0,
        bin_capacity: 100,
        bin_created_by: 'Amit kumar',
        bin_status: 'Unlocked'
      },
      {
        bin_id: '3026834',
        bin_code: 'BIN_3026834',
        zone: 'ZONE-1',
        aisle: 'A01',
        rack: 'R01',
        shelf: 'S02',
        capacity: 100,
        current_quantity: 0,
        sku_mapping: JSON.stringify([]),
        category_mapping: JSON.stringify([]),
        status: 'inactive',
        bin_name: 'R001-S02',
        bin_type: 'Good Bin',
        zone_type: 'Each',
        zone_name: 'ZONE-1',
        bin_dimensions: '90 x 45 x 48 cm',
        preferred_product_category: '',
        no_of_categories: 0,
        no_of_sku_uom: 0,
        no_of_items: 0,
        bin_capacity: 100,
        bin_created_by: 'Amit kumar',
        bin_status: 'All bin activities locked'
      },
      {
        bin_id: '3026835',
        bin_code: 'BIN_3026835',
        zone: 'ZONE-1',
        aisle: 'A01',
        rack: 'R01',
        shelf: 'S03',
        capacity: 100,
        current_quantity: 0,
        sku_mapping: JSON.stringify([]),
        category_mapping: JSON.stringify([]),
        status: 'inactive',
        bin_name: 'R001-S03',
        bin_type: 'Good Bin',
        zone_type: 'Each',
        zone_name: 'ZONE-1',
        bin_dimensions: '90 x 45 x 48 cm',
        preferred_product_category: '',
        no_of_categories: 0,
        no_of_sku_uom: 0,
        no_of_items: 0,
        bin_capacity: 100,
        bin_created_by: 'Amit kumar',
        bin_status: 'All bin activities locked'
      },
      {
        bin_id: '3026836',
        bin_code: 'BIN_3026836',
        zone: 'ZONE-1',
        aisle: 'A01',
        rack: 'R01',
        shelf: 'S04',
        capacity: 100,
        current_quantity: 0,
        sku_mapping: JSON.stringify([]),
        category_mapping: JSON.stringify([]),
        status: 'inactive',
        bin_name: 'R001-S04',
        bin_type: 'Good Bin',
        zone_type: 'Each',
        zone_name: 'ZONE-1',
        bin_dimensions: '90 x 45 x 48 cm',
        preferred_product_category: '',
        no_of_categories: 0,
        no_of_sku_uom: 0,
        no_of_items: 0,
        bin_capacity: 100,
        bin_created_by: 'Amit kumar',
        bin_status: 'All bin activities locked'
      },
      {
        bin_id: '3026837',
        bin_code: 'BIN_3026837',
        zone: 'ZONE-1',
        aisle: 'A01',
        rack: 'R01',
        shelf: 'S05',
        capacity: 100,
        current_quantity: 0,
        sku_mapping: JSON.stringify([]),
        category_mapping: JSON.stringify([]),
        status: 'inactive',
        bin_name: 'R001-S05',
        bin_type: 'Good Bin',
        zone_type: 'Each',
        zone_name: 'ZONE-1',
        bin_dimensions: '90 x 45 x 48 cm',
        preferred_product_category: '',
        no_of_categories: 0,
        no_of_sku_uom: 0,
        no_of_items: 0,
        bin_capacity: 100,
        bin_created_by: 'Amit kumar',
        bin_status: 'All bin activities locked'
      },
      {
        bin_id: '3026838',
        bin_code: 'BIN_3026838',
        zone: 'ZONE-1',
        aisle: 'A02',
        rack: 'R01',
        shelf: 'S01',
        capacity: 100,
        current_quantity: 0,
        sku_mapping: JSON.stringify([]),
        category_mapping: JSON.stringify([]),
        status: 'inactive',
        bin_name: 'R002-S01',
        bin_type: 'Good Bin',
        zone_type: 'Each',
        zone_name: 'ZONE-1',
        bin_dimensions: '90 x 45 x 48 cm',
        preferred_product_category: '',
        no_of_categories: 0,
        no_of_sku_uom: 0,
        no_of_items: 0,
        bin_capacity: 100,
        bin_created_by: 'Amit kumar',
        bin_status: 'All bin activities locked'
      },
      {
        bin_id: '3026839',
        bin_code: 'BIN_3026839',
        zone: 'ZONE-1',
        aisle: 'A02',
        rack: 'R01',
        shelf: 'S02',
        capacity: 100,
        current_quantity: 0,
        sku_mapping: JSON.stringify([]),
        category_mapping: JSON.stringify([]),
        status: 'inactive',
        bin_name: 'R002-S02',
        bin_type: 'Good Bin',
        zone_type: 'Each',
        zone_name: 'ZONE-1',
        bin_dimensions: '90 x 45 x 48 cm',
        preferred_product_category: '',
        no_of_categories: 0,
        no_of_sku_uom: 0,
        no_of_items: 0,
        bin_capacity: 100,
        bin_created_by: 'Amit kumar',
        bin_status: 'All bin activities locked'
      },
      {
        bin_id: '3026840',
        bin_code: 'BIN_3026840',
        zone: 'ZONE-1',
        aisle: 'A02',
        rack: 'R01',
        shelf: 'S03',
        capacity: 100,
        current_quantity: 0,
        sku_mapping: JSON.stringify([]),
        category_mapping: JSON.stringify([]),
        status: 'inactive',
        bin_name: 'R002-S03',
        bin_type: 'Good Bin',
        zone_type: 'Each',
        zone_name: 'ZONE-1',
        bin_dimensions: '90 x 45 x 48 cm',
        preferred_product_category: '',
        no_of_categories: 0,
        no_of_sku_uom: 0,
        no_of_items: 0,
        bin_capacity: 100,
        bin_created_by: 'Amit kumar',
        bin_status: 'All bin activities locked'
      }
    ];

    for (const data of sampleData) {
      try {
        await sequelize.query(
          `INSERT INTO bin_locations (
            bin_id, bin_code, zone, aisle, rack, shelf, capacity, current_quantity,
            sku_mapping, category_mapping, status, bin_name, bin_type, zone_type,
            zone_name, bin_dimensions, preferred_product_category, 
            no_of_categories, no_of_sku_uom, no_of_items, bin_capacity, 
            bin_created_by, bin_status, created_at, updated_at
          ) VALUES (
            :bin_id, :bin_code, :zone, :aisle, :rack, :shelf, :capacity, :current_quantity,
            :sku_mapping, :category_mapping, :status, :bin_name, :bin_type, :zone_type,
            :zone_name, :bin_dimensions, :preferred_product_category,
            :no_of_categories, :no_of_sku_uom, :no_of_items, :bin_capacity,
            :bin_created_by, :bin_status, NOW(), NOW()
          )`,
          {
            replacements: data,
            type: QueryTypes.INSERT
          }
        );
        console.log(`✅ Inserted sample data for bin: ${data.bin_name} (${data.bin_id})`);
      } catch (error: any) {
        if (error.message.includes('Duplicate entry')) {
          console.log(`ℹ️  Sample data for bin ${data.bin_id} already exists, skipping...`);
        } else {
          console.log(`❌ Error inserting sample data for bin ${data.bin_id}:`, error.message);
        }
      }
    }

    // Show final table structure
    console.log('\n📊 Final bin_locations table structure:');
    const tableInfo = await sequelize.query(
      'DESCRIBE bin_locations',
      { type: QueryTypes.SELECT }
    );
    
    tableInfo.forEach((column: any) => {
      console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : ''} ${column.Key ? `(${column.Key})` : ''}`);
    });

    // Show record count
    const recordCount = await sequelize.query(
      'SELECT COUNT(*) as count FROM bin_locations',
      { type: QueryTypes.SELECT }
    );
    console.log(`\n📈 Total records in bin_locations: ${(recordCount[0] as any).count}`);

    console.log('\n🎉 bin_locations table update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating bin_locations table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the update if this script is executed directly
if (require.main === module) {
  updateBinLocationsTable()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default updateBinLocationsTable;
