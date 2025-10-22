import { Router } from 'express';
import { ProductMasterController } from '../controllers/productMasterController';
import { authenticate } from '../middleware/auth';

const router = Router();
const productMasterController = new ProductMasterController();

// Apply authentication to all product master routes
router.use(authenticate);

// Product Master Routes
router.post('/product-master', productMasterController.createProduct.bind(productMasterController));
router.post('/product-master/add-variants', productMasterController.addVariantsToProduct.bind(productMasterController));
router.put('/product-master/:skuId', productMasterController.updateProduct.bind(productMasterController));
router.get('/product-master/:skuId', productMasterController.getProductBySkuId.bind(productMasterController));
router.get('/product-master/catalogue/:catalogueId', productMasterController.getProductsByCatalogueId.bind(productMasterController));
router.get('/product-master', productMasterController.getAllProducts.bind(productMasterController));
router.patch('/product-master/:skuId/avg-cost', productMasterController.updateAverageCost.bind(productMasterController));


export default router;
