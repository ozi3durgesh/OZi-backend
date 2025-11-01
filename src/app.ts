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
import fcGrnRoutes from './routes/FCGrnRoutes';
import easyEcomWebhookRoutes from './routes/easyEcomWebhookRoutes';
import { errorHandler } from './middleware/errorHandler';
import vendorRoutes from './routes/vendorRoutes';
import productRoutes from './routes/productRoutes';
import purchaOrderRoutes from './routes/purchaseOrderRoutes';
import fcPutawayRoutes from './routes/fcPutawayRoutes';
import returnRoutes from './routes/returnRoutes';
import returnRequestItemRoutes from './routes/returnRequestItemRoutes';
import pickerRoutes from './routes/pickerRoutes';
import { rawRiderRouter } from './routes/rawRiderRoutes';
import { rawPickerRouter } from './routes/rawPickerRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import deliveryManRoutes from './routes/deliveryManRoutes';
import fcSelectionRoutes from './routes/fcSelectionRoutes';
import fulfillmentCenterRoutes from './routes/fulfillmentCenterRoutes';
import distributionCenterRoutes from './routes/distributionCenterRoutes';
import userFulfillmentCenterRoutes from './routes/userFulfillmentCenterRoutes';
import parentProductRoutesDC from './routes/DC/parentProductRoutesDC';
import dcVendorRoutes from './routes/DC/vendorRoutes';
import dcPORoutes from './routes/DC/dcPORoutes';
import dcGrnRoutes from './routes/DC/dcGrnRoutes';
import dcInventory1Routes from './routes/DC/dcInventory1Routes';
import fcPORoutes from './routes/fcPORoutes';
import fcSKURoutes from './routes/fcSKURoutes';
import dcFCPORoutes from './routes/dcFCPORoutes';
import fcPOStatusRoutes from './routes/fcPOStatusRoutes';
import pdfUploadRoutes from './routes/pdfUploadRoutes';
import brandRoutes from './routes/brandRoutes';
import productMasterRoutes from './routes/productMasterRoutes';
import { userTimelineMiddleware } from './middleware/userTimeline';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());


// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// User timeline logging middleware (must be after body parsing, before routes)
app.use(userTimelineMiddleware);

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
app.use('/api/fc/grn', fcGrnRoutes);
// Add alias route for /api/grn to point to FC GRN routes
app.use('/api/grn', fcGrnRoutes);

// FC Selection routes must come BEFORE vendor/product routes to avoid FC filtering middleware
app.use('/api/fc-selection', fcSelectionRoutes);

// FC and DC Management routes (no FC filtering middleware applied)
app.use('/api/distribution-centers', distributionCenterRoutes);
app.use('/api/fulfillment-centers', fulfillmentCenterRoutes);
app.use('/api/user-fulfillment-centers', userFulfillmentCenterRoutes);

// DC-specific routes (Distribution Center context)
app.use('/api/dc', dcVendorRoutes);
app.use('/api/dc', parentProductRoutesDC);
app.use('/api/dc', dcPORoutes);
app.use('/api/dc/grn', dcGrnRoutes);
app.use('/api/dc/inventory-1', dcInventory1Routes);

// FC-specific routes (Fulfillment Center context)
app.use('/api/fc-po', fcPOStatusRoutes);
app.use('/api/fc-po', fcPORoutes);
app.use('/api/fc/skus', fcSKURoutes);

// DC-specific FC-PO routes (Distribution Center context)
app.use('/api/dc/fc-pos', dcFCPORoutes);

// Ecommerce integration routes - MUST COME BEFORE routes that apply auth to all /api
app.use('/api/ecommerce', easyEcomWebhookRoutes);

app.use('/api', vendorRoutes);
app.use('/api', productRoutes);
app.use('/api/purchase-orders', purchaOrderRoutes);
app.use('/api/fc/putaway', fcPutawayRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/return-request-items', returnRequestItemRoutes);
app.use("/api/picker", pickerRoutes);

app.use('/api/raw-riders', rawRiderRouter);
app.use('/api/raw-pickers', rawPickerRouter);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/delivery-man', deliveryManRoutes);

// PHP Production Compatible Routes
app.use('/api/v1/customer/order', orderRoutes);

// PDF upload routes
app.use('/api/upload', pdfUploadRoutes);

// Brand routes
app.use('/api/brands', brandRoutes);

// New Product Master routes
app.use('/api', productMasterRoutes);


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