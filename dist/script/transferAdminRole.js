"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function transferAdminRole() {
    try {
        console.log('Starting admin role transfer process...\n');
        const adminRole = await models_1.Role.findOne({ where: { name: 'admin' } });
        if (!adminRole) {
            throw new Error('Admin role not found');
        }
        const currentAdmins = await models_1.User.findAll({
            where: { roleId: adminRole.id },
            attributes: ['id', 'email', 'isActive', 'createdAt']
        });
        console.log(`Found ${currentAdmins.length} current admin user(s):`);
        currentAdmins.forEach(admin => {
            console.log(`  - ID: ${admin.id}, Email: ${admin.email}, Active: ${admin.isActive}`);
        });
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const question = (query) => {
            return new Promise(resolve => rl.question(query, resolve));
        };
        console.log('\n=== Admin Role Transfer Options ===');
        console.log('1. Create new admin user');
        console.log('2. Transfer admin role to existing user');
        console.log('3. Deactivate current admin and create new one');
        console.log('4. Exit');
        const choice = await question('\nSelect option (1-4): ');
        switch (choice) {
            case '1':
                await createNewAdmin(adminRole, rl);
                break;
            case '2':
                await transferToExistingUser(adminRole, rl);
                break;
            case '3':
                await deactivateCurrentAndCreateNew(adminRole, rl);
                break;
            case '4':
                console.log('Exiting...');
                break;
            default:
                console.log('Invalid option');
        }
        rl.close();
    }
    catch (error) {
        console.error('Error in admin role transfer:', error);
        throw error;
    }
}
async function createNewAdmin(adminRole, rl) {
    console.log('\n=== Create New Admin User ===');
    const email = await rl.question('Enter email for new admin: ');
    const password = await rl.question('Enter password for new admin: ');
    const confirmPassword = await rl.question('Confirm password: ');
    if (password !== confirmPassword) {
        console.log('❌ Passwords do not match');
        return;
    }
    const existingUser = await models_1.User.findOne({ where: { email } });
    if (existingUser) {
        console.log('❌ User with this email already exists');
        return;
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const newAdmin = await models_1.User.create({
        email,
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
        availabilityStatus: 'available'
    });
    console.log(`✅ New admin user created successfully:`);
    console.log(`   ID: ${newAdmin.id}`);
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Role: Admin`);
}
async function transferToExistingUser(adminRole, rl) {
    console.log('\n=== Transfer Admin Role to Existing User ===');
    const email = await rl.question('Enter email of existing user: ');
    const user = await models_1.User.findOne({ where: { email } });
    if (!user) {
        console.log('❌ User not found');
        return;
    }
    console.log(`Found user: ${user.email} (Current role ID: ${user.roleId})`);
    const confirm = await rl.question('Are you sure you want to make this user an admin? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
        console.log('Transfer cancelled');
        return;
    }
    user.roleId = adminRole.id;
    await user.save();
    console.log(`✅ Admin role transferred successfully to ${user.email}`);
}
async function deactivateCurrentAndCreateNew(adminRole, rl) {
    console.log('\n=== Deactivate Current Admin and Create New ===');
    const currentAdmins = await models_1.User.findAll({
        where: { roleId: adminRole.id }
    });
    for (const admin of currentAdmins) {
        admin.isActive = false;
        await admin.save();
        console.log(`Deactivated admin: ${admin.email}`);
    }
    const email = await rl.question('Enter email for new admin: ');
    const password = await rl.question('Enter password for new admin: ');
    const confirmPassword = await rl.question('Confirm password: ');
    if (password !== confirmPassword) {
        console.log('❌ Passwords do not match');
        return;
    }
    const existingUser = await models_1.User.findOne({ where: { email } });
    if (existingUser) {
        console.log('❌ User with this email already exists');
        return;
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const newAdmin = await models_1.User.create({
        email,
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
        availabilityStatus: 'available'
    });
    console.log(`✅ New admin user created successfully:`);
    console.log(`   ID: ${newAdmin.id}`);
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Role: Admin`);
    console.log(`   Previous admins have been deactivated`);
}
transferAdminRole()
    .then(() => {
    console.log('Admin role transfer completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('Admin role transfer failed:', error);
    process.exit(1);
});
