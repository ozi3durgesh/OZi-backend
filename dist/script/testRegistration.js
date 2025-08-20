"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
async function testRegistration() {
    try {
        console.log('Testing registration system...\n');
        const totalUsers = await models_1.User.count();
        console.log(`Total users in system: ${totalUsers}`);
        const roles = await models_1.Role.findAll();
        console.log(`Available roles: ${roles.map(r => r.name).join(', ')}`);
        const adminRole = await models_1.Role.findOne({ where: { name: 'admin' } });
        if (adminRole) {
            console.log(`Admin role found: ID ${adminRole.id}, Name: ${adminRole.name}`);
        }
        else {
            console.log('Admin role not found!');
        }
        const users = await models_1.User.findAll({
            include: [{ association: 'Role' }],
            attributes: ['id', 'email', 'roleId']
        });
        if (users.length > 0) {
            console.log('\nExisting users:');
            users.forEach(user => {
                console.log(`- ID: ${user.id}, Email: ${user.email}, Role ID: ${user.roleId}`);
            });
        }
        else {
            console.log('\nNo users found in system');
        }
        console.log('\n✅ Registration test completed!');
    }
    catch (error) {
        console.error('❌ Registration test failed:', error);
        throw error;
    }
}
testRegistration()
    .then(() => {
    console.log('Registration testing completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('Registration testing failed:', error);
    process.exit(1);
});
