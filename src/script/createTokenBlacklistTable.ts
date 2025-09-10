// script/createTokenBlacklistTable.ts
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

async function createTokenBlacklistTable() {
  try {
    console.log('Creating TokenBlacklist table...');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS TokenBlacklist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(767) NOT NULL,
        userId INT NOT NULL,
        tokenType ENUM('access', 'refresh') NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_token (token),
        INDEX idx_userId (userId),
        INDEX idx_expiresAt (expiresAt),
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await sequelize.query(createTableQuery, { type: QueryTypes.RAW });

    console.log('✅ TokenBlacklist table created successfully');

    // Create a cleanup function to remove expired tokens
    const cleanupExpiredTokens = async () => {
      try {
        const deleteQuery = `
          DELETE FROM TokenBlacklist 
          WHERE expiresAt < NOW()
        `;
        
        const result = await sequelize.query(deleteQuery, { type: QueryTypes.DELETE });
        console.log(`🧹 Cleaned up expired tokens`);
      } catch (error) {
        console.error('Error cleaning up expired tokens:', error);
      }
    };

    // Run cleanup immediately
    await cleanupExpiredTokens();

    console.log('✅ TokenBlacklist setup completed');
  } catch (error) {
    console.error('❌ Error creating TokenBlacklist table:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  createTokenBlacklistTable()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default createTokenBlacklistTable;
