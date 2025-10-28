import { ProductMaster, ProductMasterCreationAttributes, ProductMasterUpdateAttributes } from '../models/NewProductMaster';
import { ProductMasterAudit } from '../models';
import { User } from '../models';
import sequelize from '../config/database';
import { QueryTypes, Op } from 'sequelize';

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
      portfolio_category: productData.portfolio_category,
      category: productData.category,
      sub_category: productData.sub_category,
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
      console.log(`🔍 [ProductMasterService] Creating ${totalProducts} products with smart ID generation...`);
      
      // Generate a single catalogue_id for all variants of this product
      const catalogueId = await this.generateCatalogueId();
      console.log(`✅ [ProductMasterService] Generated single catalogue_id: ${catalogueId}`);
      
      // Create products for each color and age/size combination
      for (let colorIndex = 0; colorIndex < colors.length; colorIndex++) {
        const color = colors[colorIndex];
        
        console.log(`🎨 [ProductMasterService] Processing color ${colorIndex + 1}/${colors.length}: ${color}`);
        
        // Generate product_id based on color (same catalogue_id, different product_id per color)
        const productId = await this.generateProductId(catalogueId, colorIndex);
        console.log(`📝 [ProductMasterService] Generated product_id for color ${color}: ${productId}`);
        
        for (let ageSizeIndex = 0; ageSizeIndex < ageSizes.length; ageSizeIndex++) {
          const ageSize = ageSizes[ageSizeIndex];
          
          // Generate sku_id based on size (same product_id, different sku_id per size)
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
            name: productData.name,
            portfolio_category: productData.portfolio_category,
            category: productData.category,
            sub_category: productData.sub_category
          });

          console.log(`🔍 [ProductMasterService] Full productData object:`, JSON.stringify(productData, null, 2));

          const newProduct = await ProductMaster.create({
            ...productData,
            color: color || undefined,
            age_size: ageSize || undefined,
            catelogue_id: catalogueId,
            product_id: productId,
            sku_id: skuId,
            created_by: userId
          }, { transaction });
          
          // Create audit record for product creation
          await ProductMasterAudit.create({
            productMasterId: newProduct.id,
            fieldName: 'product_creation',
            oldValue: null,
            newValue: 'CREATED',
            operationType: 'CREATE',
            batchId: null,
            userId,
              action: 'CREATE',
            description: `Product created with SKU ${skuId}`,
            metadata: JSON.stringify({
              timestamp: new Date().toISOString(),
              skuId: skuId,
              catalogueId: catalogueId,
              productId: productId,
              color: color || undefined,
              ageSize: ageSize || undefined,
              createdData: {
                  ...productData,
                  color: color || undefined,
                  age_size: ageSize || undefined
                }
            })
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
      
      // Create audit records for each changed field
      const auditRecords: Array<{
        productMasterId: number;
        fieldName: string;
        oldValue: string | null;
        newValue: string | null;
        operationType: 'UPDATE';
        batchId: string | null;
        userId: number;
        action: string;
        description: string;
        metadata: string;
      }> = [];
      for (const [fieldName, newValue] of Object.entries(updateData)) {
        const oldValue = originalData[fieldName];
        if (oldValue !== newValue) {
          auditRecords.push({
            productMasterId: product.id,
            fieldName,
            oldValue: oldValue?.toString() || null,
            newValue: newValue?.toString() || null,
            operationType: 'UPDATE' as const,
            batchId: null,
            userId,
        action: 'UPDATE',
            description: `Updated ${fieldName} from "${oldValue}" to "${newValue}"`,
            metadata: JSON.stringify({
        timestamp: new Date().toISOString(),
              skuId: skuId,
              changes: { before: originalData, after: updateData }
            })
          });
        }
      }
      
      // Create audit records
      if (auditRecords.length > 0) {
        for (const auditRecord of auditRecords) {
          await ProductMasterAudit.create(auditRecord, { transaction });
        }
        console.log(`📝 [ProductMasterService] Created ${auditRecords.length} audit records`);
      }

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
        avg_cost_to_ozi: parseFloat(newAverageCost.toFixed(2))
      }, { transaction });

      // Create audit record for average cost update
      await ProductMasterAudit.create({
        productMasterId: product.id,
        fieldName: 'avg_cost_to_ozi',
        oldValue: originalCost.toString(),
        newValue: parseFloat(newAverageCost.toFixed(2)).toString(),
        operationType: 'UPDATE',
        batchId: null,
        userId,
        action: 'AVERAGE_COST_UPDATE',
        description: `Average cost updated from ${originalCost} to ${parseFloat(newAverageCost.toFixed(2))}`,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          previous_cost: originalCost,
          new_cost: parseFloat(newAverageCost.toFixed(2)),
          calculation_details: {
            total_cost: totalCost,
            total_quantity: totalQuantity,
            grn_entries_count: grnLines.length,
            calculation_method: 'weighted_average'
          }
        })
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
    
    // Apply search filter
    if (filters.search) {
      whereClause[Op.or] = [
        { sku_id: { [Op.like]: `%${filters.search}%` } },
        { name: { [Op.like]: `%${filters.search}%` } },
        { catelogue_id: { [Op.like]: `%${filters.search}%` } },
        { product_id: { [Op.like]: `%${filters.search}%` } },
        { category: { [Op.like]: `%${filters.search}%` } },
        { ean_upc: { [Op.like]: `%${filters.search}%` } },
        { hsn: { [Op.like]: `%${filters.search}%` } }
      ];
    }
    
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
   * Get the next available product ID for a given catalogue and color
   */
  private async getNextProductId(catalogueId: string, existingProducts: ProductMaster[]): Promise<string> {
    // Extract existing product ID suffixes (last 2 digits)
    const existingSuffixes = existingProducts
      .map(p => p.product_id)
      .filter(pid => pid && typeof pid === 'string' && pid.startsWith(catalogueId))
      .map(pid => parseInt(pid.slice(-2)))
      .filter(suffix => !isNaN(suffix))
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
      .filter(sid => sid && typeof sid === 'string' && sid.startsWith(productId))
      .map(sid => parseInt(sid.slice(-3)))
      .filter(suffix => !isNaN(suffix))
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
            portfolio_category: baseProduct.portfolio_category,
            category: baseProduct.category,
            sub_category: baseProduct.sub_category,
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
            created_by: userId
          }, { transaction });

          // Create audit record for variant creation
          await ProductMasterAudit.create({
            productMasterId: newProduct.id,
            fieldName: 'variant_creation',
            oldValue: null,
            newValue: 'VARIANT_CREATED',
            operationType: 'CREATE',
            batchId: null,
            userId,
            action: 'ADD_VARIANT',
            description: `Added variant with color: ${color || 'N/A'}, size: ${ageSize || 'N/A'}`,
            metadata: JSON.stringify({
              timestamp: new Date().toISOString(),
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
            })
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
  async bulkUpdateSKUs(
    skuIds: string[],
    updates: Record<string, any>,
    userId: number,
    batchId?: string
  ): Promise<{ success: boolean; message: string; updatedCount: number; batchId: string }> {
    const transaction = await sequelize.transaction();
    const actualBatchId = batchId || `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`🔄 [ProductMasterService] Starting bulk update for ${skuIds.length} SKUs`);
      console.log(`📝 [ProductMasterService] Updates:`, updates);
      console.log(`🏷️ [ProductMasterService] Batch ID: ${actualBatchId}`);

      // Get existing products to track changes
      const existingProducts = await ProductMaster.findAll({
        where: { sku_id: { [Op.in]: skuIds } },
        transaction,
      });

      if (existingProducts.length !== skuIds.length) {
        throw new Error(`Some SKUs not found. Requested: ${skuIds.length}, Found: ${existingProducts.length}`);
      }

      // Create audit records for changes
      const auditRecords: Array<{
        productMasterId: number;
        fieldName: string;
        oldValue: string | null;
        newValue: string | null;
        operationType: 'BULK_UPDATE';
        batchId: string;
        userId: number;
        action: string;
        description: string;
        metadata: string | null;
      }> = [];
      
      for (const product of existingProducts) {
        for (const [fieldName, newValue] of Object.entries(updates)) {
          const oldValue = (product as any).getDataValue(fieldName);
          if (oldValue !== newValue) {
            auditRecords.push({
              productMasterId: product.id,
              fieldName,
              oldValue: oldValue?.toString() || null,
              newValue: newValue?.toString() || null,
              operationType: 'BULK_UPDATE' as const,
              batchId: actualBatchId,
              userId,
              action: 'BULK_UPDATE',
              description: `Bulk updated ${fieldName} from "${oldValue}" to "${newValue}"`,
              metadata: JSON.stringify({
                timestamp: new Date().toISOString(),
                batchId: actualBatchId,
                skuId: product.sku_id
              })
            });
          }
        }
      }

      // Perform bulk update
      const [updatedCount] = await ProductMaster.update(updates, {
        where: { sku_id: { [Op.in]: skuIds } },
        transaction,
      });

      // Create audit records
      if (auditRecords.length > 0) {
        for (const record of auditRecords) {
          await ProductMasterAudit.create({
            productMasterId: record.productMasterId,
            fieldName: record.fieldName,
            oldValue: record.oldValue,
            newValue: record.newValue,
            operationType: record.operationType,
            batchId: record.batchId,
            userId: record.userId,
            action: record.action,
            description: record.description,
            metadata: record.metadata,
          }, { transaction });
        }
      }

      await transaction.commit();
      console.log(`✅ [ProductMasterService] Bulk update completed. Updated ${updatedCount} SKUs`);

      return {
        success: true,
        message: `Successfully updated ${updatedCount} SKUs`,
        updatedCount,
        batchId: actualBatchId,
      };

    } catch (error) {
      console.error('❌ [ProductMasterService] Bulk update failed:', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Bulk update SKUs with individual updates per SKU
   */
  async bulkUpdateSKUsIndividual(
    skuUpdates: Array<{ skuId: string; updates: Record<string, any> }>,
    userId: number,
    batchId?: string
  ): Promise<{ success: boolean; message: string; updatedCount: number; batchId: string }> {
    const transaction = await sequelize.transaction();
    const actualBatchId = batchId || `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`🔄 [ProductMasterService] Starting individual bulk update for ${skuUpdates.length} SKUs`);
      console.log(`🏷️ [ProductMasterService] Batch ID: ${actualBatchId}`);

      // Get all SKU IDs
      const skuIds = skuUpdates.map(sku => sku.skuId);
      
      // Get existing products to track changes
      const existingProducts = await ProductMaster.findAll({
        where: { sku_id: { [Op.in]: skuIds } },
        transaction,
      });

      if (existingProducts.length !== skuIds.length) {
        throw new Error(`Some SKUs not found. Requested: ${skuIds.length}, Found: ${existingProducts.length}`);
      }

      // Create audit records for changes
      const auditRecords: Array<{
        productMasterId: number;
        fieldName: string;
        oldValue: string | null;
        newValue: string | null;
        operationType: 'BULK_UPDATE';
        batchId: string;
        userId: number;
        action: string;
        description: string;
        metadata: string | null;
      }> = [];
      
      // Process each SKU individually
      for (const skuUpdate of skuUpdates) {
        const product = existingProducts.find(p => p.sku_id === skuUpdate.skuId);
        if (!product) continue;

        for (const [fieldName, newValue] of Object.entries(skuUpdate.updates)) {
          const oldValue = (product as any).getDataValue(fieldName);
          if (oldValue !== newValue) {
            auditRecords.push({
              productMasterId: product.id,
              fieldName,
              oldValue: oldValue?.toString() || null,
              newValue: newValue?.toString() || null,
              operationType: 'BULK_UPDATE' as const,
              batchId: actualBatchId,
              userId,
              action: 'BULK_UPDATE',
              description: `Bulk updated ${fieldName} from "${oldValue}" to "${newValue}"`,
              metadata: JSON.stringify({
                timestamp: new Date().toISOString(),
                batchId: actualBatchId,
                skuId: product.sku_id
              })
            });
          }
        }
      }

      // Update products individually
      let updatedCount = 0;
      for (const skuUpdate of skuUpdates) {
        const product = existingProducts.find(p => p.sku_id === skuUpdate.skuId);
        if (!product) continue;

        await ProductMaster.update(skuUpdate.updates, {
          where: { sku_id: skuUpdate.skuId },
          transaction,
        });
        updatedCount++;
      }

      // Create audit records
      for (const auditRecord of auditRecords) {
        await ProductMasterAudit.create(auditRecord, { transaction });
      }

      await transaction.commit();
      
      console.log(`✅ [ProductMasterService] Individual bulk update completed: ${updatedCount} SKUs updated`);
      
      return {
        success: true,
        message: `Successfully updated ${updatedCount} SKUs`,
        updatedCount,
        batchId: actualBatchId,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Revert changes by batch ID
   */
  async revertBulkChanges(
    batchId: string,
    userId: number
  ): Promise<{ success: boolean; message: string; revertedCount: number }> {
    const transaction = await sequelize.transaction();
    
    try {
      console.log(`🔄 [ProductMasterService] Starting revert for batch: ${batchId}`);

      // Get all audit records for this batch
      const auditRecords = await ProductMasterAudit.findAll({
        where: { batchId, operationType: 'BULK_UPDATE' },
        order: [['createdAt', 'DESC']],
        transaction,
      });

      if (auditRecords.length === 0) {
        throw new Error(`No changes found for batch ID: ${batchId}`);
      }

      // Group changes by product ID
      const changesByProduct: Record<number, Record<string, string | null>> = {};
      for (const record of auditRecords) {
        if (!changesByProduct[record.productMasterId]) {
          changesByProduct[record.productMasterId] = {};
        }
        changesByProduct[record.productMasterId][record.fieldName] = record.oldValue;
      }

      // Revert changes
      let revertedCount = 0;
      const revertAuditRecords: Array<{
        productMasterId: number;
        fieldName: string;
        oldValue: string | null;
        newValue: string | null;
        operationType: 'REVERT';
        batchId: string;
        userId: number;
        action: string;
        description: string;
        metadata: string | null;
      }> = [];
      
      for (const [productId, fieldChanges] of Object.entries(changesByProduct)) {
        const [updatedCount] = await ProductMaster.update(fieldChanges, {
          where: { id: parseInt(productId) },
          transaction,
        });

        if (updatedCount > 0) {
          revertedCount++;
          
          // Create audit records for revert operation
          for (const [fieldName, oldValue] of Object.entries(fieldChanges)) {
            revertAuditRecords.push({
              productMasterId: parseInt(productId),
              fieldName,
              oldValue: fieldChanges[fieldName],
              newValue: oldValue,
              operationType: 'REVERT' as const,
              batchId: `revert_${batchId}`,
              userId,
              action: 'REVERT',
              description: `Reverted ${fieldName} from "${fieldChanges[fieldName]}" back to "${oldValue}"`,
              metadata: JSON.stringify({
                timestamp: new Date().toISOString(),
                originalBatchId: batchId,
                revertReason: 'User requested revert'
              })
            });
          }
        }
      }

      // Create revert audit records
      if (revertAuditRecords.length > 0) {
        for (const record of revertAuditRecords) {
          await ProductMasterAudit.create({
            productMasterId: record.productMasterId,
            fieldName: record.fieldName,
            oldValue: record.oldValue,
            newValue: record.newValue,
            operationType: record.operationType,
            batchId: record.batchId,
            userId: record.userId,
            action: record.action,
            description: record.description,
            metadata: record.metadata,
          }, { transaction });
        }
      }

      await transaction.commit();
      console.log(`✅ [ProductMasterService] Revert completed. Reverted ${revertedCount} products`);

      return {
        success: true,
        message: `Successfully reverted changes for ${revertedCount} products`,
        revertedCount,
      };

    } catch (error) {
      console.error('❌ [ProductMasterService] Revert failed:', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get change history for a batch
   */
  async getChangeHistory(batchId: string): Promise<any[]> {
    try {
      const auditRecords = await ProductMasterAudit.findAll({
        where: { batchId },
        order: [['createdAt', 'DESC']],
      });

      // Get product and user details separately
      const productIds = [...new Set(auditRecords.map(r => r.productMasterId))];
      const userIds = [...new Set(auditRecords.map(r => r.userId))];

      const products = await ProductMaster.findAll({
        where: { id: { [Op.in]: productIds } },
        attributes: ['id', 'name', 'sku_id', 'product_id', 'catelogue_id'],
      });

      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ['id', 'name', 'email'],
      });

      const productMap = new Map(products.map(p => [p.id, p]));
      const userMap = new Map(users.map(u => [u.id, u]));

      return auditRecords.map(record => ({
        id: record.id,
        productId: record.productMasterId,
        productName: productMap.get(record.productMasterId)?.name || 'Unknown',
        skuId: productMap.get(record.productMasterId)?.sku_id || '',
        productIdValue: productMap.get(record.productMasterId)?.product_id || '',
        catalogueId: productMap.get(record.productMasterId)?.catelogue_id || '',
        fieldName: record.fieldName,
        oldValue: record.oldValue,
        newValue: record.newValue,
        operationType: record.operationType,
        batchId: record.batchId,
        userId: record.userId,
        userName: userMap.get(record.userId)?.name || 'Unknown',
        userEmail: userMap.get(record.userId)?.email || '',
        createdAt: record.createdAt,
      }));

    } catch (error) {
      console.error('❌ [ProductMasterService] Get change history failed:', error);
      throw error;
    }
  }

  /**
   * Get all batch IDs with their summary
   */
  async getBatchHistory(): Promise<any[]> {
    try {
      console.log('🔍 [ProductMasterService] getBatchHistory called');
      
      const batches = await ProductMasterAudit.findAll({
        attributes: [
          'batchId',
          'operationType',
          'userId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'changeCount'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('product_master_id'))), 'productCount'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('field_name'))), 'fieldCount'],
          [sequelize.fn('MIN', sequelize.col('created_at')), 'createdAt'],
          [sequelize.fn('MAX', sequelize.col('created_at')), 'lastUpdated'],
        ],
        group: ['batchId', 'operationType', 'userId'],
        order: [['createdAt', 'DESC']],
      });

      console.log(`📊 [ProductMasterService] Found ${batches.length} batches`);

      if (batches.length === 0) {
        console.log('📊 [ProductMasterService] No batches found, returning empty array');
        return [];
      }

      // Get user details separately
      const userIds = [...new Set(batches.map(b => b.userId))];
      console.log(`👥 [ProductMasterService] Getting user details for IDs: ${userIds.join(', ')}`);
      
      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ['id', 'name', 'email'],
      });

      console.log(`👥 [ProductMasterService] Found ${users.length} users`);

      const userMap = new Map(users.map(u => [u.id, u]));

      const result = batches.map(batch => ({
        batchId: batch.batchId,
        operationType: batch.operationType,
        changeCount: (batch as any).getDataValue('changeCount'),
        productCount: (batch as any).getDataValue('productCount'),
        fieldCount: (batch as any).getDataValue('fieldCount'),
        createdAt: (batch as any).getDataValue('createdAt'),
        lastUpdated: (batch as any).getDataValue('lastUpdated'),
        userId: batch.userId,
        userName: userMap.get(batch.userId)?.name || 'Unknown',
        userEmail: userMap.get(batch.userId)?.email || '',
      }));

      console.log(`✅ [ProductMasterService] Returning ${result.length} batch records`);
      return result;

    } catch (error) {
      console.error('❌ [ProductMasterService] Get batch history failed:', error);
      throw error;
    }
  }
}

export default ProductMasterService;
