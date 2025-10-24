import { Router } from 'express';
import { ProductMasterController } from '../controllers/productMasterController';
import { authenticate } from '../middleware/auth';

const router = Router();
const productMasterController = new ProductMasterController();

// Apply authentication to all product master routes
router.use(authenticate);

// Product Master Routes - Specific routes first to avoid conflicts
router.post('/product-master', productMasterController.createProduct.bind(productMasterController));
router.post('/product-master/add-variants', productMasterController.addVariantsToProduct.bind(productMasterController));
router.get('/product-master/catalogue/:catalogueId', productMasterController.getProductsByCatalogueId.bind(productMasterController));
router.get('/product-master', productMasterController.getAllProducts.bind(productMasterController));

// Bulk Operations Routes - Specific routes before parameterized routes
router.post('/product-master/bulk-update', productMasterController.bulkUpdateSKUs.bind(productMasterController));
router.post('/product-master/bulk-update-individual', productMasterController.bulkUpdateSKUsIndividual.bind(productMasterController));
router.post('/product-master/revert/:batchId', productMasterController.revertBulkChanges.bind(productMasterController));
router.get('/product-master/history/:batchId', productMasterController.getChangeHistory.bind(productMasterController));
router.get('/product-master/batch-history', productMasterController.getBatchHistory.bind(productMasterController));

// Parameterized routes last to avoid conflicts
router.put('/product-master/:skuId', productMasterController.updateProduct.bind(productMasterController));
router.get('/product-master/:skuId', productMasterController.getProductBySkuId.bind(productMasterController));
router.patch('/product-master/:skuId/avg-cost', productMasterController.updateAverageCost.bind(productMasterController));


export default router;
