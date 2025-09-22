import { Request, Response } from 'express';
import Product, { ProductCreationAttributes } from '../models/productModel';
import { ResponseHandler } from '../middleware/responseHandler';
import sequelize from '../config/database';
import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import { Op, QueryTypes } from 'sequelize';
import csv from 'csv-parser';
import ProductBulkValidationService, { ValidationError } from '../services/productBulkValidationService';
import { BulkImportLoggerClass } from '../services/BulkImportLogger';

// AWS S3 Configuration
const s3 = new AWS.S3();
const BUCKET_NAME = 'oms-stage-storage'; // Your S3 bucket name
const FOLDER_NAME = 'product-images'; // Folder inside S3

// ✅ Helper function: clean URL
const cleanUrl = (url: string | undefined) => {
  if (!url) return null;
  return url.replace(/`/g, '').trim();
};

// ✅ Helper function: upload image to S3 with SKU as filename
const uploadImageToS3 = async (imageUrl: string, sku: string) => {
  try {
    const cleanImageUrl = cleanUrl(imageUrl);
    if (!cleanImageUrl) throw new Error('Empty image URL');

    // Skip example.com URLs as they're not real images
    if (cleanImageUrl.includes('example.com')) {
      console.log(`⚠️ Skipping example.com URL for SKU ${sku}: ${cleanImageUrl}`);
      return null;
    }

    let fileExtension = '.jpg';
    try {
      const pathname = new URL(cleanImageUrl).pathname;
      fileExtension = path.extname(pathname) || '.jpg';
    } catch {
      fileExtension = '.jpg';
    }

    const fileName = `${sku}${fileExtension}`;

    // Download image
    const response = await fetch(cleanImageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${cleanImageUrl}`);
    }
    const buffer = await response.buffer();

    // Upload to S3
    const params = {
      Bucket: BUCKET_NAME,
      Key: `${FOLDER_NAME}/${fileName}`,
      Body: buffer,
      ContentType: response.headers.get('content-type') || 'image/jpeg',
    };

    const s3Response = await s3.upload(params).promise();
    return s3Response.Location;
  } catch (err: any) {
    console.error(`❌ Image upload failed for ${imageUrl}`, err.message);
    return null;
  }
};

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
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { SKU, ImageURL, ...rest } = req.body;

    const existingProduct = await Product.findOne({ where: { SKU } });
    if (existingProduct) {
      return ResponseHandler.error(res, `Product with SKU ${SKU} already exists`, 400);
    }

    const imageUrl = await uploadImageToS3(ImageURL, SKU);

    const product = await Product.create({
      SKU,
      ImageURL: imageUrl,
      ...rest,
    } as ProductCreationAttributes);

    return ResponseHandler.success(res, product, 201);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error creating product', 500);
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { SKU, ImageURL, ...rest } = req.body;

  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return ResponseHandler.error(res, 'Product not found', 404);
    }

    let updatedImageURL = product.ImageURL;
    if (ImageURL) {
      updatedImageURL = await uploadImageToS3(ImageURL, SKU || product.SKU);
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
export const getProductBySKU = async (req: Request, res: Response) => {
  const { sku } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

  try {
    const { count, rows } = await Product.findAndCountAll({
      where: { SKU: sku },
      limit: parseInt(limit.toString()),
      offset,
    });

    if (count === 0) {
      return ResponseHandler.error(res, 'Product not found', 404);
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
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const whereClause: any = {};
    if (status) {
      whereClause.Status = status;
    }
    if (search) {
      whereClause[Op.or] = [
        { SKU: { [Op.like]: `%${search}%` } },
        { ProductName: { [Op.like]: `%${search}%` } },
        { ModelNum: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit.toString()),
      offset,
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
    return ResponseHandler.error(res, error.message || 'Error fetching products', 500);
  }
};

// Bulk upload from CSV
export const bulkUploadProducts = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return ResponseHandler.error(res, 'No file uploaded', 400);
    }

    const records = await parseCSV(req.file.path);
    const productsToCreate: ProductCreationAttributes[] = [];

    for (const record of records) {
      const s3Url = record.ImageURL
        ? await uploadImageToS3(record.ImageURL, record.SKU)
        : null;

      const productData: ProductCreationAttributes = {
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
      await Product.bulkCreate(productsToCreate);
    }

    return ResponseHandler.success(res, 'Products uploaded successfully', 200);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error uploading products', 500);
  }
};

// Bulk import/update from CSV with mode-based processing
export const bulkUpdateProducts = async (req: Request, res: Response) => {
  const validationService = new ProductBulkValidationService();
  const bulkImportLogger = new BulkImportLoggerClass();
  
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

      // Create logs for each failed record
      for (const error of validationResult.errors) {
        const record = records[error.row - 1]; // Convert to 0-based index
        if (record) {
          const logId = await bulkImportLogger.createLog(createdBy, record, 'FAILED');
          bulkImportLogger.addColumnError(
            logId,
            error.column,
            error.value,
            error.error,
            error.description,
            error.row
          );
        }
      }

      // Save all logs to database
      await bulkImportLogger.saveLogs();

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
        for (const sku of existingSKUs) {
          const record = records.find(r => r.SKU === sku);
          if (record) {
            const logId = await bulkImportLogger.createLog(createdBy, record, 'FAILED');
            bulkImportLogger.addColumnError(
              logId,
              'SKU',
              sku,
              'SKU_ALREADY_EXISTS',
              `SKU ${sku} already exists in database. Use UPDATE mode to modify existing products.`,
              0
            );
          }
        }
        
        // Save logs
        await bulkImportLogger.saveLogs();
        
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
        for (const sku of nonExistingSKUs) {
          const record = records.find(r => r.SKU === sku);
          if (record) {
            const logId = await bulkImportLogger.createLog(createdBy, record, 'FAILED');
            bulkImportLogger.addColumnError(
              logId,
              'SKU',
              sku,
              'SKU_NOT_FOUND',
              `SKU ${sku} not found in database. Use CREATE NEW mode to add new products.`,
              0
            );
          }
        }
        
        // Save logs
        await bulkImportLogger.saveLogs();
        
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
        
        // Upload image to S3 if provided
        let imageUrl = data.ImageURL;
        if (data.ImageURL && data.ImageURL.trim() !== '') {
          imageUrl = await uploadImageToS3(data.ImageURL, data.SKU);
        }

        // Prepare product data with proper data types
        const productData = {
          SKU: data.SKU,
          ProductName: data.ProductName,
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
          Weight: data.Weight ? parseFloat(data.Weight.toString()) : null,
          Length: data.Length ? parseFloat(data.Length.toString()) : null,
          Height: data.Height ? parseFloat(data.Height.toString()) : null,
          Width: data.Width ? parseFloat(data.Width.toString()) : null,
          ImageURL: imageUrl,
          Status: data.Status || 'Active',
          CPId: data.CPId || null,
          ParentSKU: data.ParentSKU || null,
          IS_MPS: data.IS_MPS || null,
          ProductTaxCode: data.ProductTaxCode || null,
          ManufacturerDescription: data.ManufacturerDescription || null,
          AccountingSKU: data.AccountingSKU || null,
          AccountingUnit: data.AccountingUnit || null,
          Flammable: data.Flammable || 'No',
          SPThreshold: data.SPThreshold ? parseInt(data.SPThreshold.toString()) : null,
          InventoryThreshold: data.InventoryThreshold ? parseInt(data.InventoryThreshold.toString()) : null,
          ERPSystemId: data.ERPSystemId ? parseInt(data.ERPSystemId.toString()) : null,
          SyncTally: data.SyncTally ? parseInt(data.SyncTally.toString()) : null,
          ShelfLife: data.ShelfLife || null,
          ShelfLifePercentage: data.ShelfLifePercentage ? parseInt(data.ShelfLifePercentage.toString()) : null,
          ProductExpiryInDays: data.ProductExpiryInDays ? parseInt(data.ProductExpiryInDays.toString()) : null,
          ReverseWeight: data.ReverseWeight ? parseFloat(data.ReverseWeight.toString()) : null,
          ReverseLength: data.ReverseLength ? parseFloat(data.ReverseLength.toString()) : null,
          ReverseHeight: data.ReverseHeight ? parseFloat(data.ReverseHeight.toString()) : null,
          ReverseWidth: data.ReverseWidth ? parseFloat(data.ReverseWidth.toString()) : null,
          ProductTaxRule: data.ProductTaxRule,
          CESS: data.CESS ? parseFloat(data.CESS.toString()) : null,
          CreatedDate: new Date().toISOString(),
          LastUpdatedDate: new Date().toISOString(),
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
        await Product.bulkCreate(productsToCreate, { transaction });
        console.log(`✅ Created ${productsToCreate.length} new products`);
      }

      if (productsToUpdate.length > 0) {
        for (const updateItem of productsToUpdate) {
          await Product.update(updateItem.data, {
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
      for (const record of processedRecords) {
        const logId = await bulkImportLogger.createLog(createdBy, record.data, 'SUCCESS');
        // No column errors for successful operations
      }
      
      // Save success logs
      await bulkImportLogger.saveLogs();

      // 11. Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // 12. Return success response
      return ResponseHandler.success(res, {
        message: createNewMode ? 'Products created successfully' : 'Products updated successfully',
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
      
      // Log database errors for all records
      for (const record of processedRecords) {
        const logId = await bulkImportLogger.createLog(createdBy, record.data, 'FAILED');
        bulkImportLogger.addColumnError(
          logId,
          'DATABASE',
          null,
          'DATABASE_ERROR',
          `Database operation failed: ${dbError.message}`,
          0
        );
      }
      
      // Save error logs
      await bulkImportLogger.saveLogs();
      
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
export const updateProductEAN = async (req: Request, res: Response) => {
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
    const product = await Product.findOne({ 
      where: { SKU: SKU } 
    });

    if (!product) {
      console.log(`❌ Product not found for SKU: ${SKU}`);
      return ResponseHandler.error(res, 'Product not found', 404);
    }

    console.log(`✅ Found product:`, {
      SKU: product.SKU,
      EAN_UPC: product.EAN_UPC,
      ProductName: product.ProductName
    });

    // Case 1: EAN_UPC is empty/null - Update both product_master and grn_lines
    if (!product.EAN_UPC || product.EAN_UPC.trim() === '') {
      console.log('📝 Case 1: Empty EAN_UPC - Updating both tables');
      
      try {
        // Update product_master
        await product.update({ 
          EAN_UPC: EAN_UPC,
          LastUpdatedDate: new Date().toISOString()
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
            EAN_UPC: EAN_UPC,
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
    if (product.EAN_UPC === EAN_UPC) {
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
            EAN_UPC: EAN_UPC,
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
    console.log(`📝 Case 3: Non-matching EAN_UPC - Current: ${product.EAN_UPC}, Provided: ${EAN_UPC}`);
    
    return ResponseHandler.error(res, `EAN/UPC already exists with different value. Suggested EAN: ${product.EAN_UPC}`, 409);

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
    const bulkImportLogger = new BulkImportLoggerClass();
    
    const logs = await bulkImportLogger.getLogsByUser(userId, Number(limit));
    
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
export const getBulkImportLogsByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const { limit = 50 } = req.query;
    const bulkImportLogger = new BulkImportLoggerClass();
    
    if (status !== 'SUCCESS' && status !== 'FAILED') {
      return ResponseHandler.error(res, 'Invalid status. Must be SUCCESS or FAILED', 400);
    }
    
    const logs = await bulkImportLogger.getLogsByStatus(status as 'SUCCESS' | 'FAILED', Number(limit));
    
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
    const bulkImportLogger = new BulkImportLoggerClass();
    
    const log = await bulkImportLogger.getLogById(Number(id));
    
    if (!log) {
      return ResponseHandler.error(res, 'Bulk import log not found', 404);
    }
    
    return ResponseHandler.success(res, {
      message: 'Bulk import log retrieved successfully',
      data: log
    }, 200);
  } catch (error: any) {
    console.error('❌ Error fetching bulk import log by ID:', error);
    return ResponseHandler.error(res, error.message || 'Internal server error', 500);
  }
};
