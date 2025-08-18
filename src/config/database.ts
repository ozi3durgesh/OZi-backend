import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'ozi_backend',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || '127.0.0.1', // Use IPv4 instead of localhost
  port: parseInt(process.env.DB_PORT || '3306'),
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    // Force IPv4 connection
    host: '127.0.0.1',
    // Additional options for better connection handling
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
  },
});

export default sequelize;

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log('Attempting to connect to database...');
    console.log(`Host: ${process.env.DB_HOST || '127.0.0.1'}`);
    console.log(`Database: ${process.env.DB_NAME || 'ozi_backend'}`);
    console.log(`User: ${process.env.DB_USER || 'root'}`);
    
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.error('Please check your database configuration and ensure MySQL is running.');
    throw error;
  }
};