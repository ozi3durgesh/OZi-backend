import { ProductMaster, ProductMasterCreationAttributes, ProductMasterUpdateAttributes } from '../models/NewProductMaster';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

export class ProductMasterService {
  
  /**
   * Generate catalogue_id (7 characters starting from 4000001)
   */
  private async generateCatalogueId(): Promise<string> {
    console.log('🔍 [ProductMasterService] generateCatalogueId called');
    const result = await sequelize.query(
      'SELECT MAX(CAST(catelogue_id AS UNSIGNED)) as max_id FROM product_master WHERE catelogue_id REGEXP "^4[0-9]{6}$"',
      { type: QueryTypes.SELECT }
    ) as any[];
    
    const maxId = result[0]?.max_id || 4000000;
    const nextId = maxId + 1;
    
    console.log(`📊 [ProductMasterService] generateCatalogueId result: maxId=${maxId}, nextId=${nextId}`);
    return nextId.toString();
  }

  /**
   * Generate multiple catalogue_ids for a batch of products using atomic database operations
   */
  private async generateCatalogueIds(count: number, transaction: any): Promise<string[]> {
    try {
      console.log(`🔍 [ProductMasterService] generateCatalogueIds called with count=${count}`);
      
      // Use a more robust approach with database-level locking
      const result = await sequelize.query(
        'SELECT MAX(CAST(catelogue_id AS UNSIGNED)) as max_id FROM product_master WHERE catelogue_id REGEXP "^4[0-9]{6}$" FOR UPDATE',
        { 
          type: QueryTypes.SELECT,
          transaction 
        }
      ) as any[];
      
      const maxId = result[0]?.max_id || 4000000;
      const catalogueIds: string[] = [];
      
      console.log(`📊 [ProductMasterService] generateCatalogueIds: maxId=${maxId}, generating ${count} IDs`);
      
      // Generate IDs with a larger gap to avoid conflicts
      for (let i = 0; i < count; i++) {
        const newId = (maxId + 10 + i).toString();
        catalogueIds.push(newId);
        console.log(`📝 [ProductMasterService] Generated catalogue_id ${i + 1}/${count}: ${newId}`);
      }
      
      console.log(`✅ [ProductMasterService] generateCatalogueIds completed: [${catalogueIds.join(', ')}]`);
      return catalogueIds;
      
    } catch (error) {
      console.error('❌ [ProductMasterService] generateCatalogueIds error:', error);
      throw error;
    }
  }

  /**
   * Generate product_id (9 characters: catalogue_id + 2 digits for color variants)
   */
  private async generateProductId(catalogueId: string, colorIndex: number): Promise<string> {
    const colorSuffix = (colorIndex + 1).toString().padStart(2, '0');
    const productId = `${catalogueId}${colorSuffix}`;
    console.log(`🔍 [ProductMasterService] generateProductId: catalogueId=${catalogueId}, colorIndex=${colorIndex}, productId=${productId}`);
    return productId;
  }

  /**
   * Generate sku_id (12 characters: product_id + 3 digits for age_size variants)
   */
  private async generateSkuId(productId: string, ageSizeIndex: number): Promise<string> {
    const ageSizeSuffix = (ageSizeIndex + 1).toString().padStart(3, '0');
    const skuId = `${productId}${ageSizeSuffix}`;
    console.log(`🔍 [ProductMasterService] generateSkuId: productId=${productId}, ageSizeIndex=${ageSizeIndex}, skuId=${skuId}`);
    return skuId;
  }

  /**
   * Create multiple products with auto-generated IDs for all color and age/size combinations
   */
  async createProduct(productData: ProductMasterCreationAttributes & {
    colors?: string[];
    ageSizes?: string[];
  }, userId: number): Promise<ProductMaster[]> {
    console.log('🚀 [ProductMasterService] createProduct called');
    console.log('📋 [ProductMasterService] Input data:', {
      colors: productData.colors,
      ageSizes: productData.ageSizes,
      name: productData.name,
      category: productData.category,
      userId
    });

    const transaction = await sequelize.transaction();
    
    try {
      // Default to single values if arrays not provided
      const colors = productData.colors || (productData.color ? [productData.color] : ['']);
      const ageSizes = productData.ageSizes || (productData.age_size ? [productData.age_size] : ['']);
      
      console.log(`📊 [ProductMasterService] Processing: ${colors.length} colors, ${ageSizes.length} age/sizes`);
      console.log(`🎨 [ProductMasterService] Colors: [${colors.join(', ')}]`);
      console.log(`📏 [ProductMasterService] Age/Sizes: [${ageSizes.join(', ')}]`);
      
      const createdProducts: ProductMaster[] = [];
      
      // Calculate total number of products to create (colors * age/sizes)
      const totalProducts = colors.length * ageSizes.length;
      console.log(`🔍 [ProductMasterService] Generating ${totalProducts} catalogue_ids for all combinations...`);
      
      // Generate all catalogue_ids upfront to avoid race conditions
      const catalogueIds = await this.generateCatalogueIds(totalProducts, transaction);
      console.log(`✅ [ProductMasterService] Generated catalogue_ids: [${catalogueIds.join(', ')}]`);
      
      let catalogueIndex = 0;
      
      // Create products for each color and age/size combination
      for (let colorIndex = 0; colorIndex < colors.length; colorIndex++) {
        const color = colors[colorIndex];
        
        console.log(`🎨 [ProductMasterService] Processing color ${colorIndex + 1}/${colors.length}: ${color}`);
        
        for (let ageSizeIndex = 0; ageSizeIndex < ageSizes.length; ageSizeIndex++) {
          const ageSize = ageSizes[ageSizeIndex];
          const catalogueId = catalogueIds[catalogueIndex];
          const productId = await this.generateProductId(catalogueId, colorIndex);
          const skuId = await this.generateSkuId(productId, ageSizeIndex);
          
          console.log(`📏 [ProductMasterService] Processing age/size ${ageSizeIndex + 1}/${ageSizes.length}: ${ageSize}`);
          console.log(`📝 [ProductMasterService] Using catalogue_id: ${catalogueId}, product_id: ${productId}, sku_id: ${skuId}`);
          
          // Create the product
          console.log(`💾 [ProductMasterService] Creating product with:`, {
            catelogue_id: catalogueId,
            product_id: productId,
            sku_id: skuId,
            color: color || undefined,
            age_size: ageSize || undefined,
            name: productData.name
          });

          const newProduct = await ProductMaster.create({
            ...productData,
            color: color || undefined,
            age_size: ageSize || undefined,
            catelogue_id: catalogueId,
            product_id: productId,
            sku_id: skuId,
            created_by: userId,
            logs: [{
              action: 'CREATE',
              timestamp: new Date().toISOString(),
              user_id: userId,
              changes: {
                created: {
                  ...productData,
                  color: color || undefined,
                  age_size: ageSize || undefined
                }
              }
            }]
          }, { transaction });
          
          console.log(`✅ [ProductMasterService] Successfully created product:`, {
            id: newProduct.id,
            catelogue_id: newProduct.catelogue_id,
            product_id: newProduct.product_id,
            sku_id: newProduct.sku_id
          });
          
          createdProducts.push(newProduct);
          catalogueIndex++;
        }
      }

      console.log(`🎉 [ProductMasterService] All products created successfully. Total: ${createdProducts.length}`);
      await transaction.commit();
      console.log('✅ [ProductMasterService] Transaction committed');
      
      return createdProducts;
      
    } catch (error) {
      console.error('❌ [ProductMasterService] createProduct error:', error);
      console.error('❌ [ProductMasterService] Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      await transaction.rollback();
      console.log('🔄 [ProductMasterService] Transaction rolled back');
      throw error;
    }
  }

  /**
   * Update a product and log the changes
   */
  async updateProduct(skuId: string, updateData: ProductMasterUpdateAttributes, userId: number): Promise<ProductMaster> {
    console.log(`🔍 [ProductMasterService] updateProduct called with skuId=${skuId}, userId=${userId}`);
    console.log(`📋 [ProductMasterService] updateData:`, JSON.stringify(updateData, null, 2));
    
    const transaction = await sequelize.transaction();
    
    try {
      const product = await ProductMaster.findOne({
        where: { sku_id: skuId }
      });

      if (!product) {
        console.log(`❌ [ProductMasterService] Product with SKU ID ${skuId} not found`);
        throw new Error(`Product with SKU ID ${skuId} not found`);
      }

      console.log(`✅ [ProductMasterService] Found product:`, product.id, product.name);

      // Get the original data for logging
      const originalData = { ...product.toJSON() };
      
      // Update the product
      await product.update(updateData, { transaction });
      
      // Add log entry
      const newLog = {
        action: 'UPDATE',
        timestamp: new Date().toISOString(),
        user_id: userId,
        changes: {
          before: originalData,
          after: updateData
        }
      };
      
      // Ensure logs is an array (handle case where it might be null or undefined)
      const currentLogs = product.logs || [];
      console.log(`📝 [ProductMasterService] Current logs:`, currentLogs);
      const updatedLogs = [...currentLogs, newLog];
      console.log(`📝 [ProductMasterService] Updated logs:`, updatedLogs);
      await product.update({ logs: updatedLogs }, { transaction });

      await transaction.commit();
      return product;
      
    } catch (error) {
      console.error(`❌ [ProductMasterService] Error updating product:`, error);
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get product by SKU ID
   */
  async getProductBySkuId(skuId: string): Promise<ProductMaster | null> {
    return await ProductMaster.findOne({
      where: { sku_id: skuId }
    });
  }

  /**
   * Get products by catalogue ID
   */
  async getProductsByCatalogueId(catalogueId: string): Promise<ProductMaster[]> {
    return await ProductMaster.findAll({
      where: { catelogue_id: catalogueId }
    });
  }

  /**
   * Get products by product ID
   */
  async getProductsByProductId(productId: string): Promise<ProductMaster[]> {
    return await ProductMaster.findAll({
      where: { product_id: productId }
    });
  }

  /**
   * Update average cost to OZI
   */
  async updateAverageCost(skuId: string, newCost: number, userId: number): Promise<ProductMaster> {
    return await this.updateProduct(skuId, { 
      avg_cost_to_ozi: newCost 
    }, userId);
  }

  /**
   * Get all products with pagination
   */
  async getAllProducts(page: number = 1, limit: number = 10, filters: any = {}): Promise<{
    products: ProductMaster[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    const whereClause: any = {};
    
    // Apply filters
    if (filters.status !== undefined) whereClause.status = filters.status;
    if (filters.category) whereClause.category = filters.category;
    if (filters.brand_id) whereClause.brand_id = filters.brand_id;
    if (filters.color) whereClause.color = filters.color;
    if (filters.age_size) whereClause.age_size = filters.age_size;
    
    const { count, rows } = await ProductMaster.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      products: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }
}

export default new ProductMasterService();
