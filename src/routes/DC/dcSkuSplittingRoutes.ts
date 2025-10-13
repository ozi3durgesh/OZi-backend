import { Router } from 'express';
import { DCSkuSplittingController } from '../../controllers/DC/dcSkuSplittingController';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route POST /api/dc/purchase-orders/:poId/sku-splitting
 * @desc Create a new SKU split
 * @access Authenticated
 * @query catalogue_id - The catalogue ID of the product to split
 * @body { sku: string, sku_splitted_quantity: number }
 */
router.post('/purchase-orders/:poId/sku-splitting', DCSkuSplittingController.createSkuSplit);

/**
 * @route GET /api/dc/purchase-orders/:poId/sku-splitting/:catalogueId
 * @desc Get SKU split details for a specific PO and catalogue_id
 * @access Authenticated
 */
router.get('/purchase-orders/:poId/sku-splitting/:catalogueId', DCSkuSplittingController.getSkuSplitDetails);

/**
 * @route GET /api/dc/purchase-orders/:poId/sku-splitting-status
 * @desc Get SKU splitting status for all products in a PO
 * @access Authenticated
 */
router.get('/purchase-orders/:poId/sku-splitting-status', DCSkuSplittingController.getPOSSkuSplittingStatus);

/**
 * @route GET /api/dc/purchase-orders/:poId/sku-splits
 * @desc Get all SKU splits for a specific PO
 * @access Authenticated
 * @query page, limit - Pagination parameters
 */
router.get('/purchase-orders/:poId/sku-splits', DCSkuSplittingController.getPOSSkuSplits);

/**
 * @route GET /api/dc/sku-splitting/generate-sku/:categoryId
 * @desc Generate a unique SKU for a category
 * @access Authenticated
 */
router.get('/sku-splitting/generate-sku/:categoryId', DCSkuSplittingController.generateUniqueSku);

/**
 * @route GET /api/dc/sku-splitting/generate-sku-catalogue/:catalogueId
 * @desc Generate a unique SKU for a catalogue_id
 * @access Authenticated
 */
router.get('/sku-splitting/generate-sku-catalogue/:catalogueId', DCSkuSplittingController.generateUniqueSkuForCatalogue);

/**
 * @route POST /api/dc/sku-splitting/validate-sku
 * @desc Validate SKU format and uniqueness
 * @access Authenticated
 * @body { sku: string, category_id: number }
 */
router.post('/sku-splitting/validate-sku', DCSkuSplittingController.validateSku);

/**
 * @route GET /api/dc/purchase-orders/:poId/product-category/:catalogueId
 * @desc Get product category_id for a given catalogue_id
 * @access Authenticated
 */
router.get('/purchase-orders/:poId/product-category/:catalogueId', DCSkuSplittingController.getProductCategory);

/**
 * @route GET /api/dc/sku-splitting/ready-for-grn
 * @desc Get SKU splits ready for GRN with pagination
 * @access Authenticated
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10, max: 100)
 */
router.get('/sku-splitting/ready-for-grn', DCSkuSplittingController.getSkuSplitsReadyForGrn);

/**
 * @route POST /api/dc/grn/create-flow
 * @desc Create DC GRN from SKU splits
 * @access Authenticated
 * @body { poId: number, lines: Array, closeReason?: string, status: string }
 */
router.post('/grn/create-flow', DCSkuSplittingController.createDCGrnFlow);

export default router;
