"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function testSimpleRegistration() {
    try {
        console.log('Testing simple registration...\n');
        await (0, database_1.connectDatabase)();
        console.log('✅ Database connection established');
        const roles = await models_1.Role.findAll();
        console.log(`Available roles: ${roles.map(r => r.name).join(', ')}`);
        const totalUsers = await models_1.User.count();
        console.log(`Total users: ${totalUsers}`);
        console.log('\nAttempting to create a test user...');
        const hashedPassword = await bcryptjs_1.default.hash('Password123', 10);
        const testUser = await models_1.User.create({
            email: 'simpletest@example.com',
            password: hashedPassword,
            roleId: 3,
            isActive: true,
            availabilityStatus: 'available'
        });
        console.log('✅ Test user created successfully:', {
            id: testUser.id,
            email: testUser.email,
            roleId: testUser.roleId
        });
        await testUser.destroy();
        console.log('✅ Test user cleaned up');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        throw error;
    }
}
testSimpleRegistration()
    .then(() => {
    console.log('Simple registration test completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('Simple registration test failed:', error);
    process.exit(1);
});
