"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function createTestUser() {
    try {
        console.log('Creating permanent test user...\n');
        await (0, database_1.connectDatabase)();
        console.log('✅ Database connection established');
        const roles = await models_1.Role.findAll();
        console.log(`Available roles: ${roles.map(r => r.name).join(', ')}`);
        const existingUser = await models_1.User.findOne({ where: { email: 'test@ozi.com' } });
        if (existingUser) {
            console.log('✅ Test user already exists:', {
                id: existingUser.id,
                email: existingUser.email,
                roleId: existingUser.roleId
            });
            return;
        }
        console.log('\nCreating permanent test user...');
        const hashedPassword = await bcryptjs_1.default.hash('password123', 10);
        const testUser = await models_1.User.create({
            email: 'test@ozi.com',
            password: hashedPassword,
            roleId: 1,
            isActive: true,
            availabilityStatus: 'available'
        });
        console.log('✅ Test user created successfully:', {
            id: testUser.id,
            email: testUser.email,
            roleId: testUser.roleId,
            password: 'password123'
        });
        console.log('\nYou can now login with:');
        console.log('Email: test@ozi.com');
        console.log('Password: password123');
    }
    catch (error) {
        console.error('❌ Failed to create test user:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        throw error;
    }
    finally {
        process.exit(0);
    }
}
createTestUser()
    .then(() => {
    console.log('\nTest user creation completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('Test user creation failed:', error);
    process.exit(1);
});
