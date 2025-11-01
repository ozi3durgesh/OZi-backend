import { Router } from 'express';
import { ProductMasterController } from '../controllers/productMasterController';
import { authenticate, hasPermission } from '../middleware/auth';

const router = Router();
const productMasterController = new ProductMasterController();

// Apply authentication to all product master routes
router.use(authenticate);

// Product Master Routes - Specific routes first to avoid conflicts
router.post('/product-master', hasPermission('products_master-create'), productMasterController.createProduct.bind(productMasterController));
router.post('/product-master/add-variants', hasPermission('products_master-edit'), productMasterController.addVariantsToProduct.bind(productMasterController));
router.get('/product-master/catalogue/:catalogueId', hasPermission('products_master-view'), productMasterController.getProductsByCatalogueId.bind(productMasterController));
router.get('/product-master', hasPermission('products_master-view'), productMasterController.getAllProducts.bind(productMasterController));

// Bulk Operations Routes - Specific routes before parameterized routes
router.post('/product-master/bulk-update', hasPermission('products_master-edit'), productMasterController.bulkUpdateSKUs.bind(productMasterController));
router.post('/product-master/bulk-update-individual', hasPermission('products_master-edit'), productMasterController.bulkUpdateSKUsIndividual.bind(productMasterController));
router.post('/product-master/revert/:batchId', hasPermission('products_master-edit'), productMasterController.revertBulkChanges.bind(productMasterController));
router.get('/product-master/history/:batchId', hasPermission('products_master-view'), productMasterController.getChangeHistory.bind(productMasterController));
router.get('/product-master/batch-history', hasPermission('products_master-view'), productMasterController.getBatchHistory.bind(productMasterController));

// Parameterized routes last to avoid conflicts
router.put('/product-master/:skuId', hasPermission('products_master-edit'), productMasterController.updateProduct.bind(productMasterController));
router.get('/product-master/:skuId', hasPermission('products_master-view'), productMasterController.getProductBySkuId.bind(productMasterController));
router.patch('/product-master/:skuId/avg-cost', hasPermission('products_master-edit'), productMasterController.updateAverageCost.bind(productMasterController));


export default router;
