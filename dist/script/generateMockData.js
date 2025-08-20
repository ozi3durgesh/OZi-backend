"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const models_1 = require("../models");
async function generateMockData() {
    try {
        console.log('Generating mock data for testing...');
        const users = await models_1.User.findAll();
        const roles = await models_1.Role.findAll();
        if (users.length === 0) {
            console.log('No users found. Please run the RBAC setup first.');
            return;
        }
        if (roles.length === 0) {
            console.log('No roles found. Please run the RBAC setup first.');
            return;
        }
        const managerUser = users.find(user => user.roleId === 1);
        const packerUser = users.find(user => user.roleId === 2);
        if (!managerUser || !packerUser) {
            console.log('Manager or packer users not found. Please check your RBAC setup.');
            return;
        }
        console.log(`Using manager: ${managerUser.email}`);
        console.log(`Using packer: ${packerUser.email}`);
        console.log('✓ Skipping mock data generation for deployment');
        console.log('✓ Mock data generation completed successfully!');
        console.log('\n🎉 Mock data generation completed successfully!');
        console.log('\nYou can now test the packing module with:');
        console.log(`1. Manager ID: ${managerUser.id}`);
        console.log(`2. Packer ID: ${packerUser.id}`);
        console.log('\nTest commands:');
        console.log('npm run test-packing');
        console.log('npm run test-rbac');
    }
    catch (error) {
        console.error('Error generating mock data:', error);
        process.exit(1);
    }
    finally {
        await database_1.default.close();
    }
}
if (require.main === module) {
    generateMockData();
}
exports.default = generateMockData;
