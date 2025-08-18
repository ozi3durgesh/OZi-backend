import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Parse Railway MySQL connection URL
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    // Parse the DATABASE_URL format: mysql://root:password@host:port/database
    const url = new URL(process.env.DATABASE_URL);
    return {
      database: url.pathname.slice(1), // Remove leading slash
      username: url.username,
      password: url.password,
      host: url.hostname,
      port: parseInt(url.port),
      dialect: 'mysql' as const,
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000,
        ssl: {
          rejectUnauthorized: false
        }
      },
    };
  }

  // Fallback to individual environment variables
  return {
    database: process.env.DB_NAME || 'ozi_backend',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql' as const,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
    },
  };
};

const sequelize = new Sequelize(getDatabaseConfig());

export default sequelize;

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log('Attempting to connect to database...');
    
    if (process.env.DATABASE_URL) {
      console.log('Using DATABASE_URL configuration');
      const url = new URL(process.env.DATABASE_URL);
      console.log(`Host: ${url.hostname}`);
      console.log(`Database: ${url.pathname.slice(1)}`);
      console.log(`User: ${url.username}`);
    } else {
      console.log(`Host: ${process.env.DB_HOST || '127.0.0.1'}`);
      console.log(`Database: ${process.env.DB_NAME || 'ozi_backend'}`);
      console.log(`User: ${process.env.DB_USER || 'root'}`);
    }
    
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