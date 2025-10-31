import { Request, Response } from 'express';
import ProductMaster, { ProductMasterCreationAttributes } from '../models/NewProductMaster';
import { ResponseHandler } from '../middleware/responseHandler';
import { FCQueryBuilder, FCValidator, FCContextHelper } from '../middleware/fcFilter';
import sequelize from '../config/database';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { Op, QueryTypes } from 'sequelize';
import csv from 'csv-parser';
import ProductMasterBulkValidationService, { ValidationError } from '../services/productBulkValidationService';
import ProductMasterCSVProcessingService from '../services/productCSVProcessingService';

// AWS S3 Configuration - COMMENTED OUT (No longer using AWS S3)
// const s3 = new AWS.S3();
// const BUCKET_NAME = 'oms-stage-storage'; // Your S3 bucket name
// const FOLDER_NAME = 'product-images'; // Folder inside S3

// ✅ Helper function: clean URL
const cleanUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  return url.replace(/`/g, '').trim();
};

// ✅ Helper function: upload image to S3 with SKU as filename - COMMENTED OUT (No longer using AWS S3)
// const uploadImageToS3 = async (imageUrl: string, sku: string) => {
//   try {
//     const cleanImageUrl = cleanUrl(imageUrl);
//     if (!cleanImageUrl) throw new Error('Empty image URL');
//
//     // Skip example.com URLs as they're not real images
//     if (cleanImageUrl.includes('example.com')) {
//       console.log(`⚠️ Skipping example.com URL for SKU ${sku}: ${cleanImageUrl}`);
//       return null;
//     }
//
//     let fileExtension = '.jpg';
//     try {
//       const pathname = new URL(cleanImageUrl).pathname;
//       fileExtension = path.extname(pathname) || '.jpg';
//     } catch {
//       fileExtension = '.jpg';
//     }
//
//     const fileName = `${sku}${fileExtension}`;
//
//     // Download image
//     const response = await fetch(cleanImageUrl);
//     if (!response.ok) {
//       throw new Error(`Failed to fetch image: ${cleanImageUrl}`);
//     }
//     const buffer = await response.buffer();
//
//     // Upload to S3
//     const params = {
//       Bucket: BUCKET_NAME,
//       Key: `${FOLDER_NAME}/${fileName}`,
//       Body: buffer,
//       ContentType: response.headers.get('content-type') || 'image/jpeg',
//     };
//
//     const s3Response = await s3.upload(params).promise();
//     return s3Response.Location;
//   } catch (err: any) {
//     console.error(`❌ Image upload failed for ${imageUrl}`, err.message);
//     return null;
//   }
// };

// ✅ Parse CSV into JSON
const parseCSV = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

// --------------------- CRUD Controllers ---------------------

// Create product
export const createProductMaster = async (req: Request, res: Response) => {
  try {
    const { sku, image_url, ...rest } = req.body;

    // Validation errors array
    const validationErrors: string[] = [];

    // Required fields validation
    const requiredFields = [
      'sku', 'mrp', 'cost', 'weight', 'length', 'height', 'width', 
      'hsn', 'ean_upc', 'name', 'image_url', 'status', 'category', 'brand_id', 'gst'
    ];

    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        validationErrors.push(`${field} is required`);
      }
    }

    // SKU format validation (exactly 12 digits)
    if (sku && !/^\d{12}$/.test(sku.toString())) {
      validationErrors.push('SKU must be exactly 12 digits');
    }

    // HSN format validation (4-8 digits)
    if (req.body.hsn && !/^\d{4,8}$/.test(req.body.hsn.toString())) {
      validationErrors.push('HSN must be 4-8 digits');
    }

    // EAN/UPC format validation (8-14 digits)
    if (req.body.ean_upc && !/^\d{8,14}$/.test(req.body.ean_upc.toString())) {
      validationErrors.push('EAN/UPC must be 8-14 digits');
    }

    // ImageURL format validation
    if (image_url) {
      const urlPattern = /^https?:\/\/.+/i;
      const imageExtensionPattern = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;
      
      if (!urlPattern.test(image_url)) {
        validationErrors.push('ImageURL must be a valid HTTP/HTTPS URL');
      } else if (!imageExtensionPattern.test(image_url)) {
        validationErrors.push('ImageURL must have a valid image extension (jpg, jpeg, png, gif, bmp, webp, svg)');
      }
    }

    // status validation (now integer: 0=inactive, 1=active)
    if (req.body.status !== undefined && ![0, 1].includes(parseInt(req.body.status))) {
      validationErrors.push('status must be 0 (inactive) or 1 (active)');
    }

    // GST format validation
    if (req.body.gst) {
      const gstPattern = /^(\d+(?:\.\d+)?)%?$/;
      if (!gstPattern.test(req.body.gst.toString())) {
        validationErrors.push('GST must be a valid percentage (e.g., 18 or 18%)');
      } else {
        const numericValue = parseFloat(req.body.gst.toString().replace('%', ''));
        if (numericValue < 0 || numericValue > 100) {
          validationErrors.push('GST must be between 0 and 100');
        }
      }
    }

    // Numeric fields validation
    const numericFields = ['mrp', 'cost', 'weight', 'length', 'height', 'width'];
    for (const field of numericFields) {
      if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
        const value = Number(req.body[field]);
        if (isNaN(value) || value < 0) {
          validationErrors.push(`${field} must be a valid positive number`);
        }
      }
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return ResponseHandler.error(res, `Validation failed: ${validationErrors.join(', ')}`, 400);
    }

    const existingProductMaster = await ProductMaster.findOne({ where: { sku_id: sku } });
    if (existingProductMaster) {
      return ResponseHandler.error(res, `ProductMaster with SKU ${sku} already exists`, 400);
    }

    // Use image_url directly from request (no AWS S3 upload)
    const imageUrl = cleanUrl(image_url);

    const product = await ProductMaster.create({
      sku,
      image_url: imageUrl,
      ...rest,
    } as ProductMasterCreationAttributes);

    return ResponseHandler.success(res, product, 201);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error creating product', 500);
  }
};

// Update product
export const updateProductMaster = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { SKU, ImageURL, ...rest } = req.body;

  try {
    const product = await ProductMaster.findByPk(id);
    if (!product) {
      return ResponseHandler.error(res, 'ProductMaster not found', 404);
    }

    let updatedImageURL = product.image_url;
    if (ImageURL) {
      // Use ImageURL directly from request (no AWS S3 upload)
      updatedImageURL = cleanUrl(ImageURL) || undefined;
    }

    await product.update({
      SKU,
      ImageURL: updatedImageURL,
      ...rest,
    });

    return ResponseHandler.success(res, product);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error updating product', 500);
  }
};

// Get product by SKU
export const getProductMasterBySKU = async (req: Request, res: Response) => {
  const { sku } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

  try {
    const { count, rows } = await ProductMaster.findAndCountAll({
      where: { sku_id: sku },
      limit: parseInt(limit.toString()),
      offset,
    });

    if (count === 0) {
      return ResponseHandler.error(res, 'ProductMaster not found', 404);
    }

    return ResponseHandler.success(res, {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page.toString()),
        pages: Math.ceil(count / parseInt(limit.toString())),
        limit: parseInt(limit.toString()),
      },
    });
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error fetching product', 500);
  }
};

// Get products (pagination + filters)
export const getProductMasters = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause[Op.or] = [
        { sku_id: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { catelogue_id: { [Op.like]: `%${search}%` } },
        { product_id: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await ProductMaster.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit.toString()),
      offset,
      order: [['id', 'DESC']]
    });

    return ResponseHandler.success(res, {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page.toString()),
        pages: Math.ceil(count / parseInt(limit.toString())),
        limit: parseInt(limit.toString()),
      },
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    return ResponseHandler.error(res, error.message || 'Error fetching products', 500);
  }
};

// Bulk upload from CSV
export const bulkUploadProductMasters = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return ResponseHandler.error(res, 'No file uploaded', 400);
    }

    const records = await parseCSV(req.file.path);
    const productsToCreate: ProductMasterCreationAttributes[] = [];

    for (const record of records) {
      // Use ImageURL directly from CSV (no AWS S3 upload)
      const s3Url = record.ImageURL ? cleanUrl(record.ImageURL) : null;

      const productData: ProductMasterCreationAttributes = {
        ...record,
        ImageURL: s3Url,
        MRP: Number(record.MRP) || 0,
        COST: Number(record.COST) || 0,
        Weight: Number(record.Weight) || 0,
        Length: Number(record.Length) || 0,
        Height: Number(record.Height) || 0,
        Width: Number(record.Width) || 0,
      };

      productsToCreate.push(productData);
    }

    if (productsToCreate.length > 0) {
      await ProductMaster.bulkCreate(productsToCreate);
    }

    return ResponseHandler.success(res, 'ProductMasters uploaded successfully', 200);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error uploading products', 500);
  }
};

// Bulk import/update from CSV with mode-based processing
export const bulkUpdateProductMasters = async (req: Request, res: Response) => {
  const validationService = new ProductMasterBulkValidationService();
  
  try {
    // 1. Check if file is uploaded
    if (!req.file) {
      return ResponseHandler.error(res, 'No file uploaded', 400);
    }

    // 2. Get processing mode and user from request body
    const { isCreateNew } = req.body;
    const createNewMode = isCreateNew === 'true' || isCreateNew === true;
    const createdBy = req.body.createdBy || 'system'; // Get user from request or default to 'system'
    
    console.log('📁 Processing CSV file:', req.file.filename);
    console.log('🔄 Processing mode:', createNewMode ? 'CREATE NEW ONLY' : 'UPDATE EXISTING ONLY');
    console.log('👤 Created by:', createdBy);

    // 2. Parse CSV file
    const records = await parseCSV(req.file.path);
    
    if (!records || records.length === 0) {
      return ResponseHandler.error(res, 'CSV file is empty or invalid', 400);
    }

    console.log(`📊 Parsed ${records.length} records from CSV`);

    // 3. Validate CSV headers
    const headers = Object.keys(records[0]);
    const headerValidation = validationService.validateHeaders(headers);
    
    if (!headerValidation.isValid) {
      console.log('❌ Header validation failed:', headerValidation.errors);
      return ResponseHandler.error(res, JSON.stringify({
        message: 'CSV validation failed',
        errors: headerValidation.errors,
        errorType: 'HEADER_VALIDATION_FAILED'
      }), 400);
    }

    console.log('✅ Headers validation passed');

    // 4. Comprehensive record validation
    const validationResult = await validationService.validateAllRecords(records);
    
    if (!validationResult.isValid) {
      console.log('❌ Record validation failed:', validationResult.errors.length, 'errors found');
      
      // Log detailed errors for debugging
      validationResult.errors.forEach((error: ValidationError) => {
        console.log(`Row ${error.row}, Column ${error.column}: ${error.error} - ${error.description}`);
      });

      return ResponseHandler.error(res, JSON.stringify({
        message: 'CSV validation failed',
        errors: validationResult.errors,
        errorType: 'RECORD_VALIDATION_FAILED',
        summary: {
        totalRecords: records.length,
          errorCount: validationResult.errors.length,
          warningCount: validationResult.warnings.length
        }
      }), 400);
    }

    console.log('✅ All records validation passed');

    // 5. Process records for database operations
    const processedRecords = await validationService.processRecords(records);
    
    // 6. Mode-specific validation
    if (createNewMode) {
      // CREATE NEW MODE: Check for existing SKUs and reject them
      const existingSKUs = processedRecords.filter(r => r.isUpdate).map(r => r.data.SKU);
      if (existingSKUs.length > 0) {
        // Log errors for existing SKUs
        console.log('❌ Found existing SKUs in CREATE NEW mode:', existingSKUs);
        
        return ResponseHandler.error(res, JSON.stringify({
          message: 'CREATE NEW mode: Found existing SKUs in database',
          errors: existingSKUs.map(sku => ({
            row: 0,
            column: 'SKU',
            value: sku,
            error: 'SKU_ALREADY_EXISTS',
            description: `SKU ${sku} already exists in database. Use UPDATE mode to modify existing products.`
          })),
          errorType: 'EXISTING_SKU_FOUND',
          summary: {
            totalRecords: records.length,
            errorCount: existingSKUs.length,
            existingSKUs: existingSKUs
          }
        }), 400);
      }
    } else {
      // UPDATE MODE: Check for non-existing SKUs and reject them
      const nonExistingSKUs = processedRecords.filter(r => !r.isUpdate).map(r => r.data.SKU);
      if (nonExistingSKUs.length > 0) {
        // Log errors for non-existing SKUs
        console.log('❌ Found non-existing SKUs in UPDATE mode:', nonExistingSKUs);
        
        return ResponseHandler.error(res, JSON.stringify({
          message: 'UPDATE mode: Found SKUs not in database',
          errors: nonExistingSKUs.map(sku => ({
            row: 0,
            column: 'SKU',
            value: sku,
            error: 'SKU_NOT_FOUND',
            description: `SKU ${sku} not found in database. Use CREATE NEW mode to add new products.`
          })),
          errorType: 'SKU_NOT_FOUND',
          summary: {
            totalRecords: records.length,
            errorCount: nonExistingSKUs.length,
            nonExistingSKUs: nonExistingSKUs
          }
        }), 400);
      }
    }
    
    // 7. Start database transaction
    const transaction = await sequelize.transaction();
    
    try {
        const productsToCreate: any[] = [];
        const productsToUpdate: { id: number; data: any }[] = [];
      let successCount = 0;
      let updateCount = 0;
      let createCount = 0;

      // 8. Process each record based on mode
      for (const record of processedRecords) {
        const { data, isUpdate, existingProduct } = record;
        
        // Use ImageURL directly from CSV (no AWS S3 upload)
        let imageUrl = data.ImageURL;
        if (data.ImageURL && data.ImageURL.trim() !== '') {
          imageUrl = cleanUrl(data.ImageURL);
        }

        // Prepare product data with proper data types
        const productData = {
          SKU: data.SKU,
          ProductMasterName: data.ProductMasterName,
          Description: data.Description || null,
          Category: data.Category,
          Brand: data.Brand,
          ModelName: data.ModelName || null,
          ModelNum: data.ModelNum,
          MRP: data.MRP ? parseFloat(data.MRP.toString()) : null,
          COST: data.COST ? parseFloat(data.COST.toString()) : null,
          EAN_UPC: data.EAN_UPC || null,
          Color: data.Color || null,
          Size: data.Size || null,
          Weight: data.Weight ? parseInt(data.Weight.toString()) : null,
          Length: data.Length ? parseInt(data.Length.toString()) : null,
          Height: data.Height ? parseInt(data.Height.toString()) : null,
          Width: data.Width ? parseInt(data.Width.toString()) : null,
          ImageURL: imageUrl,
          status: data.status || 'active',
          CPId: data.CPId || null,
          ParentSKU: data.ParentSKU || null,
          hsn: data.hsn || null,
          AccountingSKU: data.AccountingSKU || null,
          AccountingUnit: data.AccountingUnit || null,
          Flammable: data.Flammable || 'No',
          SPThreshold: data.SPThreshold ? parseInt(data.SPThreshold.toString()) : null,
          InventoryThreshold: data.InventoryThreshold ? parseInt(data.InventoryThreshold.toString()) : null,
          ERPSystemId: data.ERPSystemId ? parseInt(data.ERPSystemId.toString()) : null,
          SyncTally: data.SyncTally ? parseInt(data.SyncTally.toString()) : null,
          ShelfLife: data.ShelfLife || null,
          ShelfLifePercentage: data.ShelfLifePercentage ? parseInt(data.ShelfLifePercentage.toString()) : null,
          ProductMasterExpiryInDays: data.ProductMasterExpiryInDays ? parseInt(data.ProductMasterExpiryInDays.toString()) : null,
          ReverseWeight: data.ReverseWeight ? parseInt(data.ReverseWeight.toString()) : null,
          ReverseLength: data.ReverseLength ? parseInt(data.ReverseLength.toString()) : null,
          ReverseHeight: data.ReverseHeight ? parseInt(data.ReverseHeight.toString()) : null,
          ReverseWidth: data.ReverseWidth ? parseInt(data.ReverseWidth.toString()) : null,
          gst: data.gst,
          CESS: data.CESS ? parseFloat(data.CESS.toString()) : null,
          CreatedDate: new Date().toISOString(),
          updated_at: new Date(),
          SKUType: data.SKUType || null,
          MaterialType: data.MaterialType
        };

        if (createNewMode) {
          // CREATE NEW MODE: Only create new products
          productsToCreate.push(productData);
          createCount++;
        } else {
          // UPDATE MODE: Only update existing products (SKU remains unchanged)
          if (isUpdate && existingProduct) {
            // Remove SKU from update data to prevent changing it
            const { SKU, ...updateData } = productData;
            productsToUpdate.push({
              id: existingProduct.id,
              data: updateData
            });
            updateCount++;
          }
        }
      }

      // 8. Execute database operations
      if (productsToCreate.length > 0) {
        await ProductMaster.bulkCreate(productsToCreate, { transaction });
        console.log(`✅ Created ${productsToCreate.length} new products`);
      }

      if (productsToUpdate.length > 0) {
        for (const updateItem of productsToUpdate) {
          await ProductMaster.update(updateItem.data, {
            where: { id: updateItem.id },
            transaction
          });
        }
        console.log(`✅ Updated ${productsToUpdate.length} existing products`);
      }

      // 9. Commit transaction
      await transaction.commit();
      successCount = createCount + updateCount;

      console.log(`🎉 Bulk ${createNewMode ? 'CREATE' : 'UPDATE'} completed successfully: ${successCount} products processed`);

      // 10. Log successful operations
      console.log(`✅ Successfully processed ${successCount} products`);

      // 11. Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // 12. Return success response
      return ResponseHandler.success(res, {
        message: createNewMode ? 'ProductMasters created successfully' : 'ProductMasters updated successfully',
        data: {
          mode: createNewMode ? 'CREATE_NEW' : 'UPDATE_EXISTING',
          totalProcessed: successCount,
          created: createCount,
          updated: updateCount,
          warnings: validationResult.warnings.length
        }
      }, 200);

    } catch (dbError: any) {
      // Rollback transaction on database error
      await transaction.rollback();
      console.error('❌ Database operation failed:', dbError);
      
      // Log database errors
      console.error('❌ Database operation failed for all records:', dbError.message);
      
      return ResponseHandler.error(res, JSON.stringify({
        message: 'Database operation failed',
        error: dbError.message,
        errorType: 'DATABASE_ERROR'
      }), 500);
    }

  } catch (error: any) {
    console.error('❌ Bulk import failed:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return ResponseHandler.error(res, JSON.stringify({
      message: 'Bulk import failed',
      error: error.message,
      errorType: 'PROCESSING_ERROR'
    }), 500);
  }
};

// Update EAN/UPC for product and related GRN lines - SUPER SIMPLE VERSION
export const updateProductMasterEAN = async (req: Request, res: Response) => {
  try {
    console.log('🔍 EAN Update API called with:', req.body);
    
    const { SKU, EAN_UPC } = req.body;

    // Basic validation
    if (!SKU) {
      return ResponseHandler.error(res, 'SKU is required', 400);
    }

    if (!EAN_UPC) {
      return ResponseHandler.error(res, 'EAN_UPC is required', 400);
    }

    console.log(`🔍 Looking for product with SKU: ${SKU}`);

    // Find the product by SKU
    const product = await ProductMaster.findOne({ 
      where: { sku_id: SKU } 
    });

    if (!product) {
      console.log(`❌ ProductMaster not found for SKU: ${SKU}`);
      return ResponseHandler.error(res, 'ProductMaster not found', 404);
    }

    console.log(`✅ Found product:`, {
      SKU: product.sku_id,
      EAN_UPC: product.ean_upc,
      ProductMasterName: product.name
    });

    // Case 1: EAN_UPC is empty/null - Update both product_master and grn_lines
    if (!product.ean_upc || product.ean_upc.trim() === '') {
      console.log('📝 Case 1: Empty EAN_UPC - Updating both tables');
      
      try {
        // Update product_master
        await product.update({ 
          ean_upc: EAN_UPC,
          updated_at: new Date()
        });

        // Update grn_lines - handle unique constraint by clearing existing EANs first
        await sequelize.query(
          'UPDATE grn_lines SET ean = NULL WHERE sku_id = ?',
          {
            replacements: [SKU],
            type: QueryTypes.UPDATE
          }
        );

        // Now update with the new EAN
        const [updatedGrnLines] = await sequelize.query(
          'UPDATE grn_lines SET ean = ? WHERE sku_id = ?',
          {
            replacements: [EAN_UPC, SKU],
            type: QueryTypes.UPDATE
          }
        );

        console.log(`✅ Updated product_master and ${updatedGrnLines} GRN lines`);

        return ResponseHandler.success(res, {
          message: 'EAN/UPC updated successfully',
          data: {
            SKU: SKU,
            ean_upc: EAN_UPC,
            updated_tables: ['product_master', 'grn_lines'],
            grn_lines_updated: updatedGrnLines
          }
        }, 200);
      } catch (dbError: any) {
        console.error('❌ Database update error:', dbError);
        return ResponseHandler.error(res, `Database update failed: ${dbError.message}`, 500);
      }
    }

    // Case 2: EAN_UPC already exists and matches the provided value
    if (product.ean_upc === EAN_UPC) {
      console.log('📝 Case 2: Matching EAN_UPC - Updating only GRN lines');
      
      try {
        // Update grn_lines - handle unique constraint by clearing existing EANs first
        await sequelize.query(
          'UPDATE grn_lines SET ean = NULL WHERE sku_id = ?',
          {
            replacements: [SKU],
            type: QueryTypes.UPDATE
          }
        );

        // Now update with the matching EAN
        const [updatedGrnLines] = await sequelize.query(
          'UPDATE grn_lines SET ean = ? WHERE sku_id = ?',
          {
            replacements: [EAN_UPC, SKU],
            type: QueryTypes.UPDATE
          }
        );

        console.log(`✅ Updated ${updatedGrnLines} GRN lines`);

        return ResponseHandler.success(res, {
          message: 'EAN/UPC updated successfully',
          data: {
            SKU: SKU,
            ean_upc: EAN_UPC,
            updated_tables: ['grn_lines'],
            grn_lines_updated: updatedGrnLines
          }
        }, 200);
      } catch (dbError: any) {
        console.error('❌ Database update error:', dbError);
        return ResponseHandler.error(res, `Database update failed: ${dbError.message}`, 500);
      }
    }

    // Case 3: EAN_UPC already exists but doesn't match - Return error with suggested EAN
    console.log(`📝 Case 3: Non-matching EAN_UPC - Current: ${product.ean_upc}, Provided: ${EAN_UPC}`);
    
    return ResponseHandler.error(res, `EAN/UPC already exists with different value. Suggested EAN: ${product.ean_upc}`, 409);

  } catch (error: any) {
    console.error('❌ Error updating EAN/UPC:', error);
    return ResponseHandler.error(res, error.message || 'Internal server error', 500);
  }
};

// Get bulk import logs by user
export const getBulkImportLogsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    // Bulk import logging has been removed - return empty result
    const logs = [];
    
    return ResponseHandler.success(res, {
      message: 'Bulk import logs retrieved successfully',
      data: {
        logs: logs,
        count: logs.length
      }
    }, 200);
  } catch (error: any) {
    console.error('❌ Error fetching bulk import logs by user:', error);
    return ResponseHandler.error(res, error.message || 'Internal server error', 500);
  }
};

// Get bulk import logs by status
export const getBulkImportLogsBystatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const { limit = 50 } = req.query;
    // Bulk import logging has been removed - return empty result
    const logs = [];
    
    return ResponseHandler.success(res, {
      message: 'Bulk import logs retrieved successfully',
      data: {
        logs: logs,
        count: logs.length,
        status
      }
    }, 200);
  } catch (error: any) {
    console.error('❌ Error fetching bulk import logs by status:', error);
    return ResponseHandler.error(res, error.message || 'Internal server error', 500);
  }
};

// Get specific bulk import log by ID
export const getBulkImportLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Bulk import logging has been removed - return empty result
    return ResponseHandler.success(res, {
      message: 'Bulk import log feature has been removed',
      data: null
    }, 200);
  } catch (error: any) {
    console.error('❌ Error fetching bulk import log by ID:', error);
    return ResponseHandler.error(res, error.message || 'Internal server error', 500);
  }
};

// Process CSV for PO creation - Get enriched product data
export const processCSVForPO = async (req: Request, res: Response) => {
  const csvProcessingService = new ProductMasterCSVProcessingService();
  
  try {
    // 1. Check if file is uploaded
    if (!req.file) {
      return ResponseHandler.error(res, 'No CSV file uploaded', 400);
    }

    // 2. Get user information from request body
    const createdBy = req.body.createdBy || 'system';
    
    console.log('📁 Processing CSV file for PO creation:', req.file.filename);
    console.log('👤 Processed by:', createdBy);

    // 3. Parse CSV file
    const records = await parseCSV(req.file.path);
    
    if (!records || records.length === 0) {
      return ResponseHandler.error(res, 'CSV file is empty or invalid', 400);
    }

    console.log(`📊 Parsed ${records.length} records from CSV`);

    // 4. Process CSV using the service
    const result = await csvProcessingService.processCSVFile(records);

    // 5. Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // 6. Return clean structured response
    console.log(`📊 CSV processing completed: ${result.summary.successCount} successful, ${result.summary.errorCount} errors`);
    
    return ResponseHandler.success(res, {
      success: true,
      message: result.summary.errorCount === 0 
        ? 'All products processed successfully' 
        : `${result.summary.successCount} products processed successfully, ${result.summary.errorCount} errors found`,
      data: result.data,
      errors: result.errors.length > 0 ? result.errors : undefined,
      summary: {
        totalRows: result.summary.totalRows,
        successCount: result.summary.successCount,
        errorCount: result.summary.errorCount,
        processedAt: result.summary.processedAt
      }
    }, 200);

  } catch (error: any) {
    console.error('❌ CSV processing failed:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return ResponseHandler.error(res, JSON.stringify({
      message: 'CSV processing failed',
      error: error.message,
      errorType: 'PROCESSING_ERROR'
    }), 500);
  }
};

// FC-based product methods
export const getProductMastersByFC = async (req: Request, res: Response) => {
  try {
    const fcId = FCContextHelper.getCurrentFCId(req);
    const { page = 1, limit = 50, search, status } = req.query;

    let whereClause: any = {};
    if (search) {
      whereClause[Op.or] = [
        { ProductMasterName: { [Op.like]: `%${search}%` } },
        { SKU: { [Op.like]: `%${search}%` } },
        { EAN_UPC: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) {
      whereClause.status = status;
    }

    const fcFilteredWhere = FCQueryBuilder.addProductFCFilter(whereClause, fcId);

    const offset = (Number(page) - 1) * Number(limit);
    const products = await ProductMaster.findAndCountAll({
      where: fcFilteredWhere,
      limit: Number(limit),
      offset,
      order: [['id', 'DESC']]
    });

    return ResponseHandler.success(res, {
      message: 'ProductMasters retrieved successfully',
      data: products.rows,
      pagination: {
        total: products.count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(products.count / Number(limit))
      },
      created_by: req.user.id
    });
  } catch (error) {
    console.error('Get products by FC error:', error);
    return ResponseHandler.error(res, 'Internal server error', 500);
  }
};

export const getProductMasterByIdAndFC = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fcId = FCContextHelper.getCurrentFCId(req);

    if (!id) {
      return ResponseHandler.error(res, 'ProductMaster ID is required', 400);
    }

    const fcFilteredWhere = FCQueryBuilder.addProductFCFilter({ id: parseInt(id) }, fcId);
    const product = await ProductMaster.findOne({
      where: fcFilteredWhere
    });

    if (!product) {
      return ResponseHandler.error(res, 'ProductMaster not found or access denied', 404);
    }

    return ResponseHandler.success(res, {
      message: 'ProductMaster retrieved successfully',
      data: product,
      created_by: req.user.id
    });
  } catch (error) {
    console.error('Get product by ID and FC error:', error);
    return ResponseHandler.error(res, 'Internal server error', 500);
  }
};

export const updateProductMasterByFC = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fcId = FCContextHelper.getCurrentFCId(req);
    const updateData = req.body;

    if (!id) {
      return ResponseHandler.error(res, 'ProductMaster ID is required', 400);
    }

    // Validate that product belongs to FC
    const isValidFC = await FCValidator.validateProductFC(parseInt(id), fcId);
    if (!isValidFC) {
      return ResponseHandler.error(res, 'ProductMaster not found or access denied', 404);
    }

    // Update product with FC context
    const [updatedRowsCount] = await ProductMaster.update(
      { ...updateData, created_by: req.user.id },
      { where: { id: parseInt(id) } }
    );

    if (updatedRowsCount === 0) {
      return ResponseHandler.error(res, 'ProductMaster not found or no changes made', 404);
    }

    const updatedProductMaster = await ProductMaster.findOne({
      where: { id: parseInt(id) }
    });

    return ResponseHandler.success(res, {
      message: 'ProductMaster updated successfully',
      data: updatedProductMaster,
      created_by: req.user.id
    });
  } catch (error) {
    console.error('Update product by FC error:', error);
    return ResponseHandler.error(res, 'Internal server error', 500);
  }
};

export const createProductMasterByFC = async (req: Request, res: Response) => {
  try {
    const fcId = FCContextHelper.getCurrentFCId(req);
    const productData = req.body;

    // Add FC context to product data
    const productWithFC = {
      ...productData,
      created_by: req.user.id
    };

    const product = await ProductMaster.create(productWithFC);

    return ResponseHandler.success(res, {
      message: 'ProductMaster created successfully',
      data: product,
      created_by: req.user.id
    }, 201);
  } catch (error) {
    console.error('Create product by FC error:', error);
    return ResponseHandler.error(res, 'Internal server error', 500);
  }
};
