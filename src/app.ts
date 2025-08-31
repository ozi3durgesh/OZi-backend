// app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import couponRoutes from './routes/couponRoutes';
import orderRoutes from './routes/orderRoutes';
import roleRoutes from './routes/roleRoutes';
import permissionRoutes from './routes/permissionRoutes';
import pickingRoutes from './routes/pickingRoutes';
import packingRoutes from './routes/packingRoutes';
import handoverRoutes from './routes/handoverRoutes';
import warehouseRoutes from './routes/warehouseRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { errorHandler } from './middleware/errorHandler';
import poRoutes from './routes/purchaseOrder.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploads folder so EC2 can access files
const uploadDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupon', couponRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/picklist', pickingRoutes);
app.use('/api/packing', packingRoutes);
app.use('/api/handover', handoverRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/po', poRoutes);

// PHP Production Compatible Routes
app.use('/api/v1/customer/order', orderRoutes);

// Payment routes
app.use('/payment', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    statusCode: 200,
    success: true,
    data: { message: 'Server is running' },
    error: null,
  });
});

// Debug endpoint to check JWT configuration
app.get('/debug/jwt', (req, res) => {
  res.json({
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ? 'Set' : 'Not set',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ? 'Set' : 'Not set',
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    nodeEnv: process.env.NODE_ENV,
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;
