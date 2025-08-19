"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const sequelize_1 = require("sequelize");
async function debugRoles() {
    try {
        console.log('🔍 Debugging roles table...\n');
        await database_1.default.authenticate();
        console.log('✅ Database connection established');
        const tables = await database_1.default.query("SHOW TABLES", { type: sequelize_1.QueryTypes.SHOWTABLES });
        console.log('📋 Existing tables:', tables);
        const roles = await database_1.default.query("SELECT * FROM roles", { type: sequelize_1.QueryTypes.SELECT });
        console.log('\n🔑 Roles in database:');
        if (roles.length === 0) {
            console.log('❌ No roles found in roles table');
        }
        else {
            roles.forEach((role) => {
                console.log(`- ID: ${role.id}, Name: '${role.name}', Description: ${role.description}`);
            });
        }
        const users = await database_1.default.query("SELECT * FROM users", { type: sequelize_1.QueryTypes.SELECT });
        console.log('\n👥 Users in database:');
        if (users.length === 0) {
            console.log('❌ No users found in users table');
        }
        else {
            users.forEach((user) => {
                console.log(`- ID: ${user.id}, Email: ${user.email}, RoleID: ${user.roleId}`);
            });
        }
        const rolesStructure = await database_1.default.query("DESCRIBE roles", { type: sequelize_1.QueryTypes.DESCRIBE });
        console.log('\n🏗️  Roles table structure:');
        if (Array.isArray(rolesStructure)) {
            rolesStructure.forEach((column) => {
                console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
            });
        }
        else {
            console.log('Table structure query returned non-array result');
        }
    }
    catch (error) {
        console.error('❌ Debug failed:', error);
        throw error;
    }
}
debugRoles()
    .then(() => {
    console.log('\nDebug completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('Debug failed:', error);
    process.exit(1);
});
