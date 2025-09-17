import { RawRider } from '../models/RawRider';
import { RawPicker } from '../models/RawPicker';
import sequelize from '../config/database'; // Adjust the path as necessary

async function syncDatabase() {
    try {
        // Create the RawRider and RawPicker tables (force: true will drop and recreate them)
        await RawRider.sync({ force: true }); // Use force: true only if you're fine with the tables being recreated
        await RawPicker.sync({ force: true }); // This will create the tables if they don't exist

        console.log('RawRider and RawPicker tables created successfully!');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
}

syncDatabase();
