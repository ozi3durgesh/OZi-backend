// script/addStore11.ts
import sequelize from '../config/database';

async function addStore11() {
  try {
    console.log('Adding store with ID 11...');

    // Create a simple stores table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100) DEFAULT 'India',
        pincode VARCHAR(20),
        contact_person VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(20),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Stores table created/verified');

    // Insert store with ID 11
    await sequelize.query(`
      INSERT INTO stores (id, name, address, city, state, country, pincode, contact_person, contact_email, contact_phone, status)
      VALUES (11, 'Test Store 11', 'Test Address, Test City', 'Test City', 'Test State', 'India', '123456', 'Test Contact', 'test@store.com', '+91-98765-43210', 'active')
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        status = VALUES(status),
        updated_at = CURRENT_TIMESTAMP;
    `);

    console.log('✅ Store with ID 11 created/updated successfully');

    // Verify the store exists
    const [stores] = await sequelize.query('SELECT * FROM stores WHERE id = 11');
    if (stores && (stores as any[]).length > 0) {
      const store = (stores as any[])[0];
      console.log(`✅ Store verified: ID ${store.id}, Name: ${store.name}, Status: ${store.status}`);
    } else {
      console.log('❌ Store verification failed');
    }

    console.log('\n🎉 Store setup completed successfully!');
    console.log('\nYou can now test the order placement with:');
    console.log('Store ID: 11');
    console.log('Product SKU: 1191');

  } catch (error) {
    console.error('❌ Error adding store:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  addStore11()
    .then(() => {
      console.log('Store setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Store setup failed:', error);
      process.exit(1);
    });
}

export default addStore11;
