"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const sequelize_1 = require("sequelize");
async function fixDatabaseSchema() {
    try {
        console.log('🔧 Fixing database schema...\n');
        await database_1.default.authenticate();
        console.log('✅ Database connection established');
        const tables = await database_1.default.query("SHOW TABLES", { type: sequelize_1.QueryTypes.SHOWTABLES });
        console.log('📋 Existing tables:', tables);
        const constraints = await database_1.default.query(`SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        REFERENCED_TABLE_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME IS NOT NULL`, { type: sequelize_1.QueryTypes.SELECT });
        console.log('🔗 Foreign key constraints:', constraints);
        if (tables.length > 0) {
            console.log('⚠️  Tables already exist. Dropping them to resolve conflicts...');
            await database_1.default.query('SET FOREIGN_KEY_CHECKS = 0');
            for (const table of tables.reverse()) {
                const tableName = Object.values(table)[0];
                console.log(`🗑️  Dropping table: ${tableName}`);
                await database_1.default.query(`DROP TABLE IF EXISTS \`${tableName}\``);
            }
            await database_1.default.query('SET FOREIGN_KEY_CHECKS = 1');
            console.log('✅ All existing tables dropped');
        }
        console.log('📦 Importing models...');
        await import('../models/index.js');
        console.log('✅ Models imported successfully');
        console.log('🔄 Creating fresh database schema...');
        await database_1.default.sync({ force: true });
        console.log('✅ Database schema created successfully');
        console.log('\n🎉 Database schema fixed successfully!');
        console.log('Next steps:');
        console.log('1. Run: npm run init-rbac');
        console.log('2. Run: npm run test-registration');
        console.log('3. Start server: npm run dev');
    }
    catch (error) {
        console.error('❌ Database schema fix failed:', error);
        throw error;
    }
}
fixDatabaseSchema()
    .then(() => {
    console.log('Database schema fix completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('Database schema fix failed:', error);
    process.exit(1);
});
