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
   * Get the next available product ID for a given catalogue and color
   */
  private async getNextProductId(catalogueId: string, existingProducts: ProductMaster[]): Promise<string> {
    // Extract existing product ID suffixes (last 2 digits)
    const existingSuffixes = existingProducts
      .map(p => p.product_id)
      .filter(pid => pid.startsWith(catalogueId))
      .map(pid => parseInt(pid.slice(-2)))
      .sort((a, b) => a - b);

    // Find the next available suffix
    let nextSuffix = 1;
    for (const suffix of existingSuffixes) {
      if (suffix === nextSuffix) {
        nextSuffix++;
      } else {
        break;
      }
    }

    // If we've used all suffixes up to the max, increment from the highest
    if (existingSuffixes.length > 0 && nextSuffix <= existingSuffixes[existingSuffixes.length - 1]) {
      nextSuffix = existingSuffixes[existingSuffixes.length - 1] + 1;
    }

    const productId = `${catalogueId}${nextSuffix.toString().padStart(2, '0')}`;
    console.log(`🔍 [ProductMasterService] getNextProductId: catalogueId=${catalogueId}, existingSuffixes=[${existingSuffixes.join(', ')}], nextSuffix=${nextSuffix}, productId=${productId}`);
    return productId;
  }

  /**
   * Get the next available SKU ID for a given product ID and age/size
   */
  private async getNextSkuId(productId: string, existingProducts: ProductMaster[]): Promise<string> {
    // Extract existing SKU ID suffixes (last 3 digits) for this product ID
    const existingSuffixes = existingProducts
      .map(p => p.sku_id)
      .filter(sid => sid.startsWith(productId))
      .map(sid => parseInt(sid.slice(-3)))
      .sort((a, b) => a - b);

    // Find the next available suffix
    let nextSuffix = 1;
    for (const suffix of existingSuffixes) {
      if (suffix === nextSuffix) {
        nextSuffix++;
      } else {
        break;
      }
    }

    const skuId = `${productId}${nextSuffix.toString().padStart(3, '0')}`;
    console.log(`🔍 [ProductMasterService] getNextSkuId: productId=${productId}, existingSuffixes=[${existingSuffixes.join(', ')}], nextSuffix=${nextSuffix}, skuId=${skuId}`);
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
      console.log(`🔍 [ProductMasterService] Generating 1 catalogue_id for product "${productData.name}" with ${totalProducts} variants...`);
      
      // Generate only ONE catalogue_id for the entire product (all variants share the same catalogue)
      const catalogueIds = await this.generateCatalogueIds(1, transaction);
      const baseCatalogueId = catalogueIds[0];
      console.log(`✅ [ProductMasterService] Generated base catalogue_id: ${baseCatalogueId} for all variants`);
      
      // Create products for each color and age/size combination
      for (let colorIndex = 0; colorIndex < colors.length; colorIndex++) {
        const color = colors[colorIndex];
        
        console.log(`🎨 [ProductMasterService] Processing color ${colorIndex + 1}/${colors.length}: ${color}`);
        
        for (let ageSizeIndex = 0; ageSizeIndex < ageSizes.length; ageSizeIndex++) {
          const ageSize = ageSizes[ageSizeIndex];
          // All variants use the same catalogue_id
          const catalogueId = baseCatalogueId;
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
   * Calculate and update average cost to OZI based on GRN data
   */
  async calculateAndUpdateAverageCost(skuId: string, userId: number): Promise<ProductMaster> {
    console.log(`🔍 [ProductMasterService] Calculating average cost for SKU: ${skuId}`);
    
    const transaction = await sequelize.transaction();
    
    try {
      // Get the product first
      const product = await ProductMaster.findOne({
        where: { sku_id: skuId },
        transaction
      });

      if (!product) {
        throw new Error(`Product with SKU ID ${skuId} not found`);
      }

      // Get all GRN lines for this SKU with their associated PO data
      const grnLines = await sequelize.query(`
        SELECT 
          gl.sku_id,
          gl.received_qty,
          gl.qc_pass_qty,
          po.unit_price,
          po.total_amount,
          po.quantity as ordered_qty,
          grn.status as grn_status,
          grn.created_at as grn_date
        FROM grn_lines gl
        JOIN grns grn ON gl.grn_id = grn.id
        JOIN dc_po_products po ON grn.po_id = po.dc_po_id AND gl.sku_id = po.sku_id
        WHERE gl.sku_id = :skuId 
        AND gl.received_qty > 0 
        AND gl.qc_pass_qty > 0
        AND grn.status IN ('completed', 'partial')
        ORDER BY grn.created_at ASC
      `, {
        replacements: { skuId },
        type: QueryTypes.SELECT,
        transaction
      }) as Array<{
        sku_id: string;
        received_qty: number;
        qc_pass_qty: number;
        unit_price: number;
        total_amount: number;
        ordered_qty: number;
        grn_status: string;
        grn_date: Date;
      }>;

      console.log(`📊 [ProductMasterService] Found ${grnLines.length} GRN entries for SKU ${skuId}`);

      if (grnLines.length === 0) {
        console.log(`ℹ️ [ProductMasterService] No GRN data found for SKU ${skuId}, keeping current cost`);
        await transaction.commit();
        return product;
      }

      // Calculate weighted average cost
      let totalCost = 0;
      let totalQuantity = 0;

      for (const line of grnLines) {
        const unitCost = line.unit_price;
        const quantity = line.qc_pass_qty; // Use QC passed quantity
        
        totalCost += (unitCost * quantity);
        totalQuantity += quantity;
        
        console.log(`📝 [ProductMasterService] GRN Entry: Qty=${quantity}, UnitCost=${unitCost}, TotalCost=${unitCost * quantity}`);
      }

      const newAverageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
      
      console.log(`💰 [ProductMasterService] Calculated average cost for SKU ${skuId}: ${newAverageCost.toFixed(2)}`);
      console.log(`📊 [ProductMasterService] Total Cost: ${totalCost.toFixed(2)}, Total Qty: ${totalQuantity}`);

      // Update the product with new average cost
      const originalCost = product.avg_cost_to_ozi || 0;
      
      await product.update({
        avg_cost_to_ozi: parseFloat(newAverageCost.toFixed(2)),
        logs: [
          ...(product.logs || []),
          {
            action: 'AVERAGE_COST_UPDATE',
            timestamp: new Date().toISOString(),
            user_id: userId,
            changes: {
              previous_cost: originalCost,
              new_cost: parseFloat(newAverageCost.toFixed(2)),
              calculation_details: {
                total_cost: totalCost,
                total_quantity: totalQuantity,
                grn_entries_count: grnLines.length,
                calculation_method: 'weighted_average'
              }
            }
          }
        ]
      }, { transaction });

      console.log(`✅ [ProductMasterService] Updated average cost for SKU ${skuId}: ${originalCost} → ${newAverageCost.toFixed(2)}`);
      
      await transaction.commit();
      return product;

    } catch (error) {
      await transaction.rollback();
      console.error(`❌ [ProductMasterService] Error calculating average cost for SKU ${skuId}:`, error);
      throw error;
    }
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

  /**
   * Add new variants to an existing product catalog
   */
  async addVariantsToProduct(catalogueId: string, newVariants: {
    colors?: string[];
    ageSizes?: string[];
  }, userId: number): Promise<ProductMaster[]> {
    console.log(`🚀 [ProductMasterService] addVariantsToProduct called`);
    console.log(`📋 [ProductMasterService] Input data:`, {
      catalogueId,
      newVariants,
      userId
    });

    const transaction = await sequelize.transaction();

    try {
      // Find existing products with this catalogue ID
      const existingProducts = await ProductMaster.findAll({
        where: { catelogue_id: catalogueId }
      });

      if (existingProducts.length === 0) {
        throw new Error(`No product found with catalogue ID ${catalogueId}`);
      }

      // Get the base product data from the first existing product
      const baseProduct = existingProducts[0];
      console.log(`✅ [ProductMasterService] Found base product:`, {
        id: baseProduct.id,
        name: baseProduct.name,
        catalogueId: baseProduct.catelogue_id,
        existingVariants: existingProducts.length
      });

      // Get existing colors and age/sizes to avoid duplicates
      const existingColors = [...new Set(existingProducts.map(p => p.color).filter(Boolean))] as string[];
      const existingAgeSizes = [...new Set(existingProducts.map(p => p.age_size).filter(Boolean))] as string[];

      console.log(`📊 [ProductMasterService] Existing variants:`, {
        colors: existingColors,
        ageSizes: existingAgeSizes
      });

      // Filter out duplicates from new variants
      const newColors = (newVariants.colors || []).filter(color => !existingColors.includes(color));
      const newAgeSizes = (newVariants.ageSizes || []).filter(ageSize => !existingAgeSizes.includes(ageSize));

      console.log(`📊 [ProductMasterService] New variants to add:`, {
        newColors,
        newAgeSizes,
        filteredColors: newColors.length,
        filteredAgeSizes: newAgeSizes.length
      });

      if (newColors.length === 0 && newAgeSizes.length === 0) {
        console.log(`ℹ️ [ProductMasterService] No new variants to add (all already exist)`);
        await transaction.commit();
        return [];
      }

      // If only new colors are provided, combine with existing age/sizes
      // If only new age/sizes are provided, combine with existing colors
      // If both are provided, create all combinations
      let colorsToProcess: string[] = [];
      let ageSizesToProcess: string[] = [];

      if (newColors.length > 0 && newAgeSizes.length > 0) {
        // Both new colors and age/sizes - create all combinations
        colorsToProcess = newColors;
        ageSizesToProcess = newAgeSizes;
      } else if (newColors.length > 0) {
        // Only new colors - combine with existing age/sizes
        colorsToProcess = newColors;
        ageSizesToProcess = existingAgeSizes.length > 0 ? existingAgeSizes : [''];
      } else if (newAgeSizes.length > 0) {
        // Only new age/sizes - combine with existing colors
        colorsToProcess = existingColors.length > 0 ? existingColors : [''];
        ageSizesToProcess = newAgeSizes;
      }

      console.log(`📊 [ProductMasterService] Processing combinations:`, {
        colorsToProcess,
        ageSizesToProcess,
        totalCombinations: colorsToProcess.length * ageSizesToProcess.length
      });

      const createdProducts: ProductMaster[] = [];
      const usedProductIds = new Set<string>();

      // Create new variants
      for (let i = 0; i < colorsToProcess.length; i++) {
        const color = colorsToProcess[i];
        let currentProductId: string | null = null;

        // Determine product ID for this color
        if (newColors.length > 0) {
          // Adding new colors - each color gets a new unique product ID
          // Keep generating until we get a unique product ID
          do {
            currentProductId = await this.getNextProductId(catalogueId, [...existingProducts, ...createdProducts]);
          } while (usedProductIds.has(currentProductId));
          usedProductIds.add(currentProductId);
        } else if (newAgeSizes.length > 0 && newColors.length === 0) {
          // Adding only new sizes - reuse existing product ID for this color
          const existingProductForColor = existingProducts.find(p => p.color === color);
          if (existingProductForColor) {
            currentProductId = existingProductForColor.product_id;
          } else {
            // This shouldn't happen, but fallback to new product ID
            do {
              currentProductId = await this.getNextProductId(catalogueId, [...existingProducts, ...createdProducts]);
            } while (usedProductIds.has(currentProductId));
            usedProductIds.add(currentProductId);
          }
        }

        for (let j = 0; j < ageSizesToProcess.length; j++) {
          const ageSize = ageSizesToProcess[j];

          // Generate SKU ID using the current product ID and all existing + created products
          const skuId = await this.getNextSkuId(currentProductId!, [...existingProducts, ...createdProducts]);

          console.log(`📝 [ProductMasterService] Creating variant:`, {
            color,
            ageSize,
            catalogueId,
            productId: currentProductId,
            skuId
          });

          const newProduct = await ProductMaster.create({
            // Copy base product data
            name: baseProduct.name,
            category: baseProduct.category,
            description: baseProduct.description,
            mrp: baseProduct.mrp,
            brand_id: baseProduct.brand_id,
            gst: baseProduct.gst,
            cess: baseProduct.cess,
            hsn: baseProduct.hsn,
            status: baseProduct.status,
            image_url: baseProduct.image_url,
            ean_upc: baseProduct.ean_upc,
            weight: baseProduct.weight,
            length: baseProduct.length,
            height: baseProduct.height,
            width: baseProduct.width,
            inventory_threshold: baseProduct.inventory_threshold,
            avg_cost_to_ozi: baseProduct.avg_cost_to_ozi,
            // Set variant-specific data
            color: color || undefined,
            age_size: ageSize || undefined,
            catelogue_id: catalogueId,
            product_id: currentProductId!,
            sku_id: skuId,
            created_by: userId,
            logs: [{
              action: 'ADD_VARIANT',
              timestamp: new Date().toISOString(),
              user_id: userId,
              changes: {
                added_variant: {
                  color: color || undefined,
                  age_size: ageSize || undefined,
                  product_id: currentProductId!,
                  sku_id: skuId
                },
                base_product: {
                  catalogue_id: catalogueId,
                  name: baseProduct.name
                }
              }
            }]
          }, { transaction });

          console.log(`✅ [ProductMasterService] Successfully created variant:`, {
            id: newProduct.id,
            catelogue_id: newProduct.catelogue_id,
            product_id: newProduct.product_id,
            sku_id: newProduct.sku_id,
            color: newProduct.color,
            age_size: newProduct.age_size
          });

          createdProducts.push(newProduct);
        }
      }

      console.log(`🎉 [ProductMasterService] All variants added successfully. Total: ${createdProducts.length}`);
      await transaction.commit();
      console.log('✅ [ProductMasterService] Transaction committed');

      return createdProducts;

    } catch (error) {
      console.error('❌ [ProductMasterService] addVariantsToProduct error:', error);
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
}

export default new ProductMasterService();
