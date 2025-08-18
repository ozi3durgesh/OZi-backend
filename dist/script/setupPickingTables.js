"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const models_1 = require("../models");
async function setupPickingTables() {
    try {
        console.log('Setting up picking tables...');
        await database_1.default.sync({ force: false });
        console.log('Picking tables setup completed successfully!');
        console.log('Tables created:');
        console.log('- picking_waves');
        console.log('- picklist_items');
        console.log('- picking_exceptions');
        const waveCount = await models_1.PickingWave.count();
        const itemCount = await models_1.PicklistItem.count();
        const exceptionCount = await models_1.PickingException.count();
        console.log('\nTable status:');
        console.log(`- PickingWaves: ${waveCount} records`);
        console.log(`- PicklistItems: ${itemCount} records`);
        console.log(`- PickingExceptions: ${exceptionCount} records`);
    }
    catch (error) {
        console.error('Error setting up picking tables:', error);
        throw error;
    }
}
setupPickingTables()
    .then(() => {
    console.log('Picking tables setup completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('Picking tables setup failed:', error);
    process.exit(1);
});
