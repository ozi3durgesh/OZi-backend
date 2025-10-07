// app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import grnRoutes from './routes/grnRoutes';
import easyEcomWebhookRoutes from './routes/easyEcomWebhookRoutes';
import { errorHandler } from './middleware/errorHandler';
import vendorRoutes from './routes/vendorRoutes';
import productRoutes from './routes/productRoutes';
import purchaOrderRoutes from './routes/purchaseOrderRoutes';
import putawayRoutes from './routes/putawayRoutes';
import returnRoutes from './routes/returnRoutes';
import returnRequestItemRoutes from './routes/returnRequestItemRoutes';
import pickerRoutes from './routes/pickerRoutes';
import { rawRiderRouter } from './routes/rawRiderRoutes';
import { rawPickerRouter } from './routes/rawPickerRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import deliveryManRoutes from './routes/deliveryManRoutes';
// Removed: FC/DC routes (tables dropped - per user request 2025-10-07)
// import fcSelectionRoutes from './routes/fcSelectionRoutes';
// import fulfillmentCenterRoutes from './routes/fulfillmentCenterRoutes';
// import distributionCenterRoutes from './routes/distributionCenterRoutes';
// import userFulfillmentCenterRoutes from './routes/userFulfillmentCenterRoutes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());


// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
app.use('/api/grn', grnRoutes);

// Removed: FC/DC routes (tables dropped - per user request 2025-10-07)
// app.use('/api/fc-selection', fcSelectionRoutes);
// app.use('/api/distribution-centers', distributionCenterRoutes);
// app.use('/api/fulfillment-centers', fulfillmentCenterRoutes);
// app.use('/api/user-fulfillment-centers', userFulfillmentCenterRoutes);

app.use('/api', vendorRoutes);
app.use('/api', productRoutes);
app.use('/api/purchase-orders', purchaOrderRoutes);
app.use('/api/putaway', putawayRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/return-request-items', returnRequestItemRoutes);
app.use("/api/picker", pickerRoutes);

app.use('/api/raw-riders', rawRiderRouter);
app.use('/api/raw-pickers', rawPickerRouter);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/delivery-man', deliveryManRoutes);

// PHP Production Compatible Routes
app.use('/api/v1/customer/order', orderRoutes);

// Ecommerce integration routes
app.use('/api/ecommerce', easyEcomWebhookRoutes);


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