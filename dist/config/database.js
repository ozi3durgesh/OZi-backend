"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getDatabaseConfig = () => {
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        return {
            database: url.pathname.slice(1),
            username: url.username,
            password: url.password,
            host: url.hostname,
            port: parseInt(url.port),
            dialect: 'mysql',
            logging: false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000,
            },
            dialectOptions: {
                connectTimeout: 60000,
                ssl: {
                    rejectUnauthorized: false
                }
            },
        };
    }
    return {
        database: process.env.DB_NAME || 'ozi_backend',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        host: process.env.DB_HOST || '127.0.0.1',
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
            connectTimeout: 60000,
        },
    };
};
const sequelize = new sequelize_1.Sequelize(getDatabaseConfig());
exports.default = sequelize;
const connectDatabase = async () => {
    try {
        console.log('Attempting to connect to database...');
        if (process.env.DATABASE_URL) {
            console.log('Using DATABASE_URL configuration');
            const url = new URL(process.env.DATABASE_URL);
            console.log(`Host: ${url.hostname}`);
            console.log(`Database: ${url.pathname.slice(1)}`);
            console.log(`User: ${url.username}`);
        }
        else {
            console.log(`Host: ${process.env.DB_HOST || '127.0.0.1'}`);
            console.log(`Database: ${process.env.DB_NAME || 'ozi_backend'}`);
            console.log(`User: ${process.env.DB_USER || 'root'}`);
        }
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        console.log('Importing models...');
        await import('../models/index.js');
        console.log('Models imported successfully.');
        await sequelize.sync({ force: false, alter: false });
        console.log('Database synchronized successfully.');
        const { isRBACInitialized, autoInitializeRBAC, createInitialAdmin } = await import('./autoInit.js');
        const rbacInitialized = await isRBACInitialized();
        if (!rbacInitialized) {
            console.log('🔧 RBAC system not initialized, auto-initializing...');
            await autoInitializeRBAC();
        }
        else {
            console.log('✅ RBAC system already initialized');
        }
        await createInitialAdmin();
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        console.error('Please check your database configuration and ensure MySQL is running.');
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
