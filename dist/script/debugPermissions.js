"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const database_1 = require("../config/database");
async function debugPermissions() {
    try {
        console.log('Debugging permission creation...\n');
        await (0, database_1.connectDatabase)();
        console.log('✅ Database connection established');
        console.log('\nTesting single permission creation...');
        const testPermission = await models_1.Permission.create({
            module: 'test',
            action: 'test',
            description: 'Test permission'
        });
        console.log('Created permission:', {
            id: testPermission.id,
            module: testPermission.module,
            action: testPermission.action,
            description: testPermission.description
        });
        const retrievedPermission = await models_1.Permission.findByPk(testPermission.id);
        console.log('Retrieved permission:', {
            id: retrievedPermission?.id,
            module: retrievedPermission?.module,
            action: retrievedPermission?.action,
            description: retrievedPermission?.description
        });
        console.log('\nTesting bulk create...');
        const testPermissions = [
            { module: 'bulk_test', action: 'action1', description: 'Bulk test 1' },
            { module: 'bulk_test', action: 'action2', description: 'Bulk test 2' }
        ];
        const createdPermissions = await models_1.Permission.bulkCreate(testPermissions);
        console.log('Bulk created permissions:');
        createdPermissions.forEach((p, index) => {
            console.log(`${index + 1}:`, {
                id: p.id,
                module: p.module,
                action: p.action,
                description: p.description
            });
        });
        await models_1.Permission.destroy({ where: { module: 'test' } });
        await models_1.Permission.destroy({ where: { module: 'bulk_test' } });
        console.log('\n✅ Test data cleaned up');
    }
    catch (error) {
        console.error('❌ Debug failed:', error);
        throw error;
    }
}
debugPermissions()
    .then(() => {
    console.log('Debug completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('Debug failed:', error);
    process.exit(1);
});
