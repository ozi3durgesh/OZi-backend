"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const couponRoutes_1 = __importDefault(require("./routes/couponRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const roleRoutes_1 = __importDefault(require("./routes/roleRoutes"));
const permissionRoutes_1 = __importDefault(require("./routes/permissionRoutes"));
const pickingRoutes_1 = __importDefault(require("./routes/pickingRoutes"));
const packingRoutes_1 = __importDefault(require("./routes/packingRoutes"));
const handoverRoutes_1 = __importDefault(require("./routes/handoverRoutes"));
const warehouseRoutes_1 = __importDefault(require("./routes/warehouseRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/coupon', couponRoutes_1.default);
app.use('/api/roles', roleRoutes_1.default);
app.use('/api/permissions', permissionRoutes_1.default);
app.use('/api/picking', pickingRoutes_1.default);
app.use('/api/packing', packingRoutes_1.default);
app.use('/api/handover', handoverRoutes_1.default);
app.use('/api/warehouses', warehouseRoutes_1.default);
app.get('/health', (req, res) => {
    res.json({
        statusCode: 200,
        success: true,
        data: { message: 'Server is running' },
        error: null,
    });
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
