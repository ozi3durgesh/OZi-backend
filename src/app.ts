// app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import { errorHandler } from './middleware/errorHandler';

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupon', couponRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/picking', pickingRoutes);
app.use('/api/packing', packingRoutes);
app.use('/api/handover', handoverRoutes);
app.use('/api/warehouses', warehouseRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    statusCode: 200,
    success: true,
    data: { message: 'Server is running' },
    error: null,
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;