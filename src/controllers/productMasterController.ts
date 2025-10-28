import { Request, Response } from 'express';
import ProductMasterService from '../services/productMasterService';
import { ProductMasterCreationAttributes } from '../models/NewProductMaster';

export class ProductMasterController {
  private productMasterService: ProductMasterService;

  constructor() {
    this.productMasterService = new ProductMasterService();
  }
  
  /**
   * Create a new product
   */
  async createProduct(req: Request, res: Response): Promise<void> {
    console.log('🚀 [ProductMasterController] createProduct called');
    console.log('📋 [ProductMasterController] Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const userId = (req as any).user?.id;
      console.log(`👤 [ProductMasterController] User ID: ${userId}`);
      
      if (!userId) {
        console.log('❌ [ProductMasterController] User not authenticated');
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Validate mandatory fields
      const mandatoryFields = ['name', 'portfolio_category', 'category', 'sub_category', 'description', 'mrp', 'brand_id', 'gst', 'cess', 'hsn'];
      const missingFields = mandatoryFields.filter(field => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
      
      console.log(`🔍 [ProductMasterController] Mandatory fields check: missing=${missingFields.join(', ')}`);
      
      if (missingFields.length > 0) {
        console.log('❌ [ProductMasterController] Missing mandatory fields:', missingFields);
        res.status(400).json({
          success: false,
          message: 'Missing mandatory fields',
          missingFields
        });
        return;
      }

      // Validate data types and ranges
      const validationErrors = this.validateProductData(req.body);
      console.log(`🔍 [ProductMasterController] Validation errors: ${validationErrors.length}`);
      
      if (validationErrors.length > 0) {
        console.log('❌ [ProductMasterController] Validation errors:', validationErrors);
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: validationErrors
        });
        return;
      }

      const productData: ProductMasterCreationAttributes & {
        colors?: string[];
        ageSizes?: string[];
      } = {
        colors: req.body.colors || undefined,
        ageSizes: req.body.ageSizes || undefined,
        name: req.body.name,
        portfolio_category: req.body.portfolio_category,
        category: req.body.category,
        sub_category: req.body.sub_category,
        description: req.body.description,
        mrp: parseFloat(req.body.mrp),
        brand_id: parseInt(req.body.brand_id),
        gst: parseFloat(req.body.gst),
        cess: parseFloat(req.body.cess),
        hsn: req.body.hsn,
        status: req.body.status || 1,
        // Optional fields
        image_url: req.body.image_url,
        ean_upc: req.body.ean_upc,
        weight: req.body.weight ? parseFloat(req.body.weight) : undefined,
        length: req.body.length ? parseFloat(req.body.length) : undefined,
        height: req.body.height ? parseFloat(req.body.height) : undefined,
        width: req.body.width ? parseFloat(req.body.width) : undefined,
        inventory_threshold: req.body.inventory_threshold ? parseInt(req.body.inventory_threshold) : undefined,
      };

      console.log('📦 [ProductMasterController] Prepared product data:', {
        colors: productData.colors,
        ageSizes: productData.ageSizes,
        name: productData.name,
        portfolio_category: productData.portfolio_category,
        category: productData.category,
        sub_category: productData.sub_category,
        mrp: productData.mrp,
        brand_id: productData.brand_id
      });

      console.log('🔄 [ProductMasterController] Calling ProductMasterService.createProduct...');
      const newProducts = await this.productMasterService.createProduct(productData, userId);
      console.log(`✅ [ProductMasterController] Service returned ${newProducts.length} products`);

      const responseData = newProducts.map(product => ({
        id: product.id,
        catelogue_id: product.catelogue_id,
        product_id: product.product_id,
        sku_id: product.sku_id,
        name: product.name,
        color: product.color,
        age_size: product.age_size,
        portfolio_category: product.portfolio_category,
        category: product.category,
        sub_category: product.sub_category,
        mrp: product.mrp,
        brand_id: product.brand_id,
        created_at: product.created_at
      }));

      console.log('📤 [ProductMasterController] Sending response:', {
        success: true,
        message: `Successfully created ${newProducts.length} product(s)`,
        productCount: newProducts.length
      });

      res.status(201).json({
        success: true,
        message: `Successfully created ${newProducts.length} product(s)`,
        data: responseData
      });

    } catch (error: any) {
      console.error('❌ [ProductMasterController] Error creating product:', error);
      console.error('❌ [ProductMasterController] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error.message
      });
    }
  }

  /**
   * Update a product
   */
  async updateProduct(req: Request, res: Response): Promise<void> {
    console.log('🚀 [ProductMasterController] updateProduct called');
    console.log('📋 [ProductMasterController] Request params:', req.params);
    console.log('📋 [ProductMasterController] Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const userId = (req as any).user?.id;
      console.log(`👤 [ProductMasterController] User ID: ${userId}`);
      
      if (!userId) {
        console.log('❌ [ProductMasterController] User not authenticated');
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { skuId } = req.params;
      if (!skuId) {
        res.status(400).json({
          success: false,
          message: 'SKU ID is required'
        });
        return;
      }

      // Validate data if provided
      if (Object.keys(req.body).length > 0) {
        const validationErrors = this.validateProductData(req.body, true);
        if (validationErrors.length > 0) {
          res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: validationErrors
          });
          return;
        }
      }

      const updateData: any = {};
      
      // Map request body to update data
      if (req.body.color) updateData.color = req.body.color;
      if (req.body.age_size) updateData.age_size = req.body.age_size;
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.portfolio_category) updateData.portfolio_category = req.body.portfolio_category;
      if (req.body.category) updateData.category = req.body.category;
      if (req.body.sub_category) updateData.sub_category = req.body.sub_category;
      if (req.body.description) updateData.description = req.body.description;
      if (req.body.mrp) updateData.mrp = parseFloat(req.body.mrp);
      if (req.body.brand_id) updateData.brand_id = parseInt(req.body.brand_id);
      if (req.body.gst) updateData.gst = parseFloat(req.body.gst);
      if (req.body.cess) updateData.cess = parseFloat(req.body.cess);
      if (req.body.hsn) updateData.hsn = req.body.hsn;
      if (req.body.status !== undefined) updateData.status = parseInt(req.body.status);
      
      // Optional fields
      if (req.body.image_url !== undefined) updateData.image_url = req.body.image_url;
      if (req.body.ean_upc !== undefined) updateData.ean_upc = req.body.ean_upc;
      if (req.body.weight !== undefined) updateData.weight = req.body.weight ? parseFloat(req.body.weight) : null;
      if (req.body.length !== undefined) updateData.length = req.body.length ? parseFloat(req.body.length) : null;
      if (req.body.height !== undefined) updateData.height = req.body.height ? parseFloat(req.body.height) : null;
      if (req.body.width !== undefined) updateData.width = req.body.width ? parseFloat(req.body.width) : null;
      if (req.body.inventory_threshold !== undefined) updateData.inventory_threshold = req.body.inventory_threshold ? parseInt(req.body.inventory_threshold) : null;

      console.log(`🔍 [ProductMasterController] Calling ProductMasterService.updateProduct with skuId=${skuId}, userId=${userId}`);
      const updatedProduct = await this.productMasterService.updateProduct(skuId, updateData, userId);
      console.log(`✅ [ProductMasterController] ProductMasterService.updateProduct completed successfully`);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: {
          id: updatedProduct.id,
          catelogue_id: updatedProduct.catelogue_id,
          product_id: updatedProduct.product_id,
          sku_id: updatedProduct.sku_id,
          name: updatedProduct.name,
          color: updatedProduct.color,
          age_size: updatedProduct.age_size,
          category: updatedProduct.category,
          mrp: updatedProduct.mrp,
          brand_id: updatedProduct.brand_id,
          updated_at: updatedProduct.updated_at
        }
      });

    } catch (error: any) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error.message
      });
    }
  }


  /**
   * Get product by SKU ID
   */
  async getProductBySkuId(req: Request, res: Response): Promise<void> {
    try {
      const { skuId } = req.params;
      
      if (!skuId) {
        res.status(400).json({
          success: false,
          message: 'SKU ID is required'
        });
        return;
      }

      const product = await this.productMasterService.getProductBySkuId(skuId);
      
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: product
      });

    } catch (error: any) {
      console.error('Error getting product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product',
        error: error.message
      });
    }
  }

  /**
   * Get products by catalogue ID
   */
  async getProductsByCatalogueId(req: Request, res: Response): Promise<void> {
    try {
      const { catalogueId } = req.params;
      
      if (!catalogueId) {
        res.status(400).json({
          success: false,
          message: 'Catalogue ID is required'
        });
        return;
      }

      const products = await this.productMasterService.getProductsByCatalogueId(catalogueId);

      res.status(200).json({
        success: true,
        data: products
      });

    } catch (error: any) {
      console.error('Error getting products by catalogue ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get products',
        error: error.message
      });
    }
  }

  /**
   * Get all products with pagination and filters
   */
  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters: any = {};
      if (req.query.status) filters.status = parseInt(req.query.status as string);
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.brand_id) filters.brand_id = parseInt(req.query.brand_id as string);
      if (req.query.color) filters.color = req.query.color as string;
      if (req.query.age_size) filters.age_size = req.query.age_size as string;
      if (req.query.search) filters.search = req.query.search as string;

      const result = await this.productMasterService.getAllProducts(page, limit, filters);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Error getting all products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get products',
        error: error.message
      });
    }
  }

  /**
   * Update average cost to OZI
   */
  async updateAverageCost(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { skuId } = req.params;
      const { avg_cost_to_ozi } = req.body;
      
      if (!skuId) {
        res.status(400).json({
          success: false,
          message: 'SKU ID is required'
        });
        return;
      }

      if (avg_cost_to_ozi === undefined || avg_cost_to_ozi === null) {
        res.status(400).json({
          success: false,
          message: 'Average cost to OZI is required'
        });
        return;
      }

      if (isNaN(parseFloat(avg_cost_to_ozi)) || parseFloat(avg_cost_to_ozi) < 0) {
        res.status(400).json({
          success: false,
          message: 'Average cost to OZI must be a valid positive number'
        });
        return;
      }

      const updatedProduct = await this.productMasterService.updateAverageCost(skuId, parseFloat(avg_cost_to_ozi), userId);

      res.status(200).json({
        success: true,
        message: 'Average cost updated successfully',
        data: {
          sku_id: updatedProduct.sku_id,
          avg_cost_to_ozi: updatedProduct.avg_cost_to_ozi,
          updated_at: updatedProduct.updated_at
        }
      });

    } catch (error: any) {
      console.error('Error updating average cost:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update average cost',
        error: error.message
      });
    }
  }

  /**
   * Validate product data
   */
  private validateProductData(data: any, isUpdate: boolean = false): string[] {
    const errors: string[] = [];

    // Validate mandatory fields for creation
    if (!isUpdate) {
      const mandatoryFields = ['name', 'portfolio_category', 'category', 'sub_category', 'description', 'mrp', 'brand_id', 'gst', 'cess', 'hsn'];
      mandatoryFields.forEach(field => {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          errors.push(`${field} is required`);
        }
      });
    }

    // Validate data types and ranges
    if (data.mrp !== undefined) {
      const mrp = parseFloat(data.mrp);
      if (isNaN(mrp) || mrp < 0) {
        errors.push('MRP must be a valid positive number');
      }
    }

    if (data.brand_id !== undefined) {
      const brandId = parseInt(data.brand_id);
      if (isNaN(brandId) || brandId <= 0) {
        errors.push('Brand ID must be a valid positive integer');
      }
    }

    if (data.gst !== undefined) {
      const gst = parseFloat(data.gst);
      if (isNaN(gst) || gst < 0 || gst > 100) {
        errors.push('GST must be a valid number between 0 and 100');
      }
    }

    if (data.cess !== undefined) {
      const cess = parseFloat(data.cess);
      if (isNaN(cess) || cess < 0 || cess > 100) {
        errors.push('CESS must be a valid number between 0 and 100');
      }
    }

    if (data.hsn !== undefined) {
      if (!/^\d{4,8}$/.test(data.hsn)) {
        errors.push('HSN must be 4-8 digits');
      }
    }

    if (data.ean_upc !== undefined && data.ean_upc) {
      if (!/^\d{8,14}$/.test(data.ean_upc)) {
        errors.push('EAN/UPC must be 8-14 digits');
      }
    }

    if (data.status !== undefined) {
      const status = parseInt(data.status);
      if (isNaN(status) || ![0, 1].includes(status)) {
        errors.push('Status must be 0 (inactive) or 1 (active)');
      }
    }

    return errors;
  }

  /**
   * Add variants to an existing product catalog
   */
  async addVariantsToProduct(req: Request, res: Response): Promise<void> {
    console.log('🚀 [ProductMasterController] addVariantsToProduct called');
    console.log('📋 [ProductMasterController] Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const userId = (req as any).user?.id;
      console.log(`👤 [ProductMasterController] User ID: ${userId}`);
      
      if (!userId) {
        console.log('❌ [ProductMasterController] User not authenticated');
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Validate required fields
      const { catalogueId, colors, ageSizes } = req.body;
      
      if (!catalogueId) {
        console.log('❌ [ProductMasterController] Missing catalogue ID');
        res.status(400).json({
          success: false,
          message: 'Catalogue ID is required'
        });
        return;
      }

      if ((!colors || colors.length === 0) && (!ageSizes || ageSizes.length === 0)) {
        console.log('❌ [ProductMasterController] No variants provided');
        res.status(400).json({
          success: false,
          message: 'At least one color or age/size must be provided'
        });
        return;
      }

      // Validate catalogue ID format
      if (!/^4\d{6}$/.test(catalogueId)) {
        console.log('❌ [ProductMasterController] Invalid catalogue ID format');
        res.status(400).json({
          success: false,
          message: 'Catalogue ID must be 7 digits starting with 4'
        });
        return;
      }

      const newVariants = {
        colors: colors || undefined,
        ageSizes: ageSizes || undefined
      };

      console.log('📦 [ProductMasterController] Prepared variant data:', {
        catalogueId,
        newVariants
      });

      console.log('🔄 [ProductMasterController] Calling ProductMasterService.addVariantsToProduct...');
      const newProducts = await this.productMasterService.addVariantsToProduct(catalogueId, newVariants, userId);
      console.log(`✅ [ProductMasterController] Service returned ${newProducts.length} new variants`);

      const responseData = newProducts.map(product => ({
        id: product.id,
        catelogue_id: product.catelogue_id,
        product_id: product.product_id,
        sku_id: product.sku_id,
        name: product.name,
        color: product.color,
        age_size: product.age_size,
        portfolio_category: product.portfolio_category,
        category: product.category,
        sub_category: product.sub_category,
        mrp: product.mrp,
        brand_id: product.brand_id,
        created_at: product.created_at
      }));

      console.log('📤 [ProductMasterController] Sending response:', {
        success: true,
        message: `Successfully added ${newProducts.length} variant(s) to catalogue ${catalogueId}`,
        variantCount: newProducts.length
      });

      res.status(201).json({
        success: true,
        message: `Successfully added ${newProducts.length} variant(s) to catalogue ${catalogueId}`,
        data: responseData,
        catalogueId,
        addedVariants: newProducts.length
      });

    } catch (error: any) {
      console.error('❌ [ProductMasterController] Error adding variants:', error);
      console.error('❌ [ProductMasterController] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({
        success: false,
        message: 'Failed to add variants to product',
        error: error.message
      });
    }
  }

  /**
   * Bulk update SKUs
   */
  async bulkUpdateSKUs(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const { skuIds, updates, batchId } = req.body;

      if (!skuIds || !Array.isArray(skuIds) || skuIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'SKU IDs array is required'
        });
      }

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Updates object is required'
        });
      }

      const result = await this.productMasterService.bulkUpdateSKUs(skuIds, updates, userId, batchId);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          updatedCount: result.updatedCount,
          batchId: result.batchId
        }
      });

    } catch (error: any) {
      console.error('Bulk update SKUs error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to bulk update SKUs',
        error: error.message
      });
    }
  }

  /**
   * Bulk update SKUs with individual updates per SKU
   */
  async bulkUpdateSKUsIndividual(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const { skuUpdates } = req.body;

      if (!skuUpdates || !Array.isArray(skuUpdates) || skuUpdates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'SKU updates array is required'
        });
      }

      // Validate each SKU update
      for (const skuUpdate of skuUpdates) {
        if (!skuUpdate.skuId || !skuUpdate.updates || typeof skuUpdate.updates !== 'object') {
          return res.status(400).json({
            success: false,
            message: 'Each SKU update must have skuId and updates object'
          });
        }
      }

      const result = await this.productMasterService.bulkUpdateSKUsIndividual(skuUpdates, userId);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          updatedCount: result.updatedCount,
          batchId: result.batchId
        }
      });

    } catch (error: any) {
      console.error('Individual bulk update SKUs error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to bulk update SKUs',
        error: error.message
      });
    }
  }

  /**
   * Revert bulk changes
   */
  async revertBulkChanges(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const { batchId } = req.params;

      if (!batchId) {
        return res.status(400).json({
          success: false,
          message: 'Batch ID is required'
        });
      }

      const result = await this.productMasterService.revertBulkChanges(batchId, userId);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          revertedCount: result.revertedCount
        }
      });

    } catch (error: any) {
      console.error('Revert bulk changes error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to revert bulk changes',
        error: error.message
      });
    }
  }

  /**
   * Get change history for a batch
   */
  async getChangeHistory(req: Request, res: Response): Promise<Response> {
    try {
      const { batchId } = req.params;

      if (!batchId) {
        return res.status(400).json({
          success: false,
          message: 'Batch ID is required'
        });
      }

      const history = await this.productMasterService.getChangeHistory(batchId);

      return res.status(200).json({
        success: true,
        message: 'Change history retrieved successfully',
        data: history
      });

    } catch (error: any) {
      console.error('Get change history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get change history',
        error: error.message
      });
    }
  }

  /**
   * Get batch history
   */
  async getBatchHistory(req: Request, res: Response): Promise<Response> {
    try {
      const history = await this.productMasterService.getBatchHistory();

      return res.status(200).json({
        success: true,
        message: 'Batch history retrieved successfully',
        data: history
      });

    } catch (error: any) {
      console.error('Get batch history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get batch history',
        error: error.message
      });
    }
  }
}

export default new ProductMasterController();
