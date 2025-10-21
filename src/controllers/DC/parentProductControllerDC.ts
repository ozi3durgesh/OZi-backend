import { Request, Response } from 'express';
import ProductMaster, { ProductMasterCreationAttributes } from '../../models/NewProductMaster';
import Brand from '../../models/Brand';
import { ResponseHandler } from '../../middleware/responseHandler';
import { Op } from 'sequelize';
import {
  PRODUCT_MASTER_REQUIRED_FIELDS,
  PRODUCT_MASTER_NUMERIC_FIELDS,
  PRODUCT_MASTER_VALIDATION_PATTERNS,
  PRODUCT_MASTER_ERROR_MESSAGES,
  PRODUCT_MASTER_SUCCESS_MESSAGES,
  PRODUCT_MASTER_STATUS,
  PRODUCT_MASTER_PAGINATION,
} from '../../constants/productMasterConstants';

// Helper function: clean URL
const cleanUrl = (url: string | undefined) => {
  if (!url) return null;
  return url.replace(/`/g, '').trim();
};

// DC Auth validation helper
const validateDCAccess = (req: any): boolean => {
  const user = req.user;
  if (!user) return false;
  
  // Check if user has DC access - either through role or currentDcId
  return (user.role && user.role.toLowerCase().includes('dc')) || 
         (user.currentDcId && user.currentDcId > 0) ||
         (user.role && user.role.toLowerCase() === 'admin'); // Admin users have DC access
};

// Validation helper function
const validateParentProduct = (data: any): string[] => {
  const validationErrors: string[] = [];

  // Required fields validation
  for (const field of PRODUCT_MASTER_REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      validationErrors.push(PRODUCT_MASTER_ERROR_MESSAGES.REQUIRED_FIELD(field));
    }
  }

  // Catalogue ID format validation (exactly 7 digits)
  if (data.catalogue_id && !PRODUCT_MASTER_VALIDATION_PATTERNS.CATALOGUE_ID.test(data.catalogue_id.toString())) {
    validationErrors.push(PRODUCT_MASTER_ERROR_MESSAGES.INVALID_CATALOGUE_ID_FORMAT);
  }

  // HSN format validation (4-8 digits)
  if (data.hsn && !PRODUCT_MASTER_VALIDATION_PATTERNS.HSN.test(data.hsn.toString())) {
    validationErrors.push(PRODUCT_MASTER_ERROR_MESSAGES.INVALID_HSN_FORMAT);
  }

  // EAN/UPC format validation (8-14 digits)
  if (data.ean_upc && !PRODUCT_MASTER_VALIDATION_PATTERNS.EAN_UPC.test(data.ean_upc.toString())) {
    validationErrors.push(PRODUCT_MASTER_ERROR_MESSAGES.INVALID_EAN_FORMAT);
  }

  // SKU format validation
  if (data.sku && !PRODUCT_MASTER_VALIDATION_PATTERNS.SKU.test(data.sku)) {
    validationErrors.push(PRODUCT_MASTER_ERROR_MESSAGES.INVALID_SKU_FORMAT);
  }

  // Image URL format validation
  if (data.image_url) {
    if (!PRODUCT_MASTER_VALIDATION_PATTERNS.IMAGE_URL.test(data.image_url)) {
      validationErrors.push(PRODUCT_MASTER_ERROR_MESSAGES.INVALID_IMAGE_URL);
    } else if (!PRODUCT_MASTER_VALIDATION_PATTERNS.IMAGE_EXTENSION.test(data.image_url)) {
      validationErrors.push(PRODUCT_MASTER_ERROR_MESSAGES.INVALID_IMAGE_EXTENSION);
    }
  }

  // Status validation (0 or 1)
  if (data.status !== undefined && data.status !== null) {
    if (![0, 1].includes(Number(data.status))) {
      validationErrors.push(PRODUCT_MASTER_ERROR_MESSAGES.INVALID_STATUS);
    }
  }

  // GST format validation
  if (data.gst) {
    if (!PRODUCT_MASTER_VALIDATION_PATTERNS.GST.test(data.gst.toString())) {
      validationErrors.push(PRODUCT_MASTER_ERROR_MESSAGES.INVALID_GST_FORMAT);
    } else {
      const numericValue = parseFloat(data.gst.toString().replace('%', ''));
      if (numericValue < 0 || numericValue > 100) {
        validationErrors.push(PRODUCT_MASTER_ERROR_MESSAGES.INVALID_GST_RANGE);
      }
    }
  }

  // Numeric fields validation
  for (const field of PRODUCT_MASTER_NUMERIC_FIELDS) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      const value = Number(data[field]);
      if (isNaN(value) || value < 0) {
        validationErrors.push(PRODUCT_MASTER_ERROR_MESSAGES.INVALID_NUMERIC_FIELD(field));
      }
    }
  }

  // Cost validation removed since cost column is removed from parent_product_master

  return validationErrors;
};

// Create parent product
export const createParentProduct = async (req: Request, res: Response) => {
  try {
    // Check DC access
    if (!validateDCAccess(req)) {
      return ResponseHandler.error(res, PRODUCT_MASTER_ERROR_MESSAGES.DC_ACCESS_DENIED, 403);
    }

    const { image_url, ...rest } = req.body;

    // Validation errors array
    const validationErrors = validateParentProduct(req.body);

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return ResponseHandler.error(
        res,
        `${PRODUCT_MASTER_ERROR_MESSAGES.VALIDATION_FAILED}: ${validationErrors.join(', ')}`,
        400
      );
    }

    // Check if brand exists
    const brand = await Brand.findByPk(req.body.brand_id);
    if (!brand) {
      return ResponseHandler.error(res, PRODUCT_MASTER_ERROR_MESSAGES.BRAND_NOT_FOUND, 400);
    }

    // Check if product with same catalogue_id already exists
    const existingProduct = await ProductMaster.findOne({ where: { catelogue_id: req.body.catalogue_id } });
    if (existingProduct) {
      return ResponseHandler.error(
        res,
        PRODUCT_MASTER_ERROR_MESSAGES.CATALOGUE_ID_ALREADY_EXISTS(req.body.catalogue_id),
        400
      );
    }

    // Clean and use image_url directly from request
    const imageUrl = cleanUrl(image_url);

    // Generate SKU if not provided
    const sku = req.body.sku || `PM-${req.body.catalogue_id}`;

    // Create product
    const product = await ProductMaster.create({
      ...rest,
      image_url: imageUrl,
      sku: sku,
      createdBy: req.user.id,
      created_by: req.user.id,
    } as ProductMasterCreationAttributes);

    return ResponseHandler.success(res, product, 201);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error creating parent product', 500);
  }
};

// Update parent product
export const updateParentProduct = async (req: Request, res: Response) => {
  try {
    // Check DC access
    if (!validateDCAccess(req)) {
      return ResponseHandler.error(res, PRODUCT_MASTER_ERROR_MESSAGES.DC_ACCESS_DENIED, 403);
    }

    const { id } = req.params;
    const { image_url, ...rest } = req.body;

    const product = await ProductMaster.findByPk(id);
    if (!product) {
      return ResponseHandler.error(res, PRODUCT_MASTER_ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
    }

    // Validation errors array
    const validationErrors = validateParentProduct(req.body);

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return ResponseHandler.error(
        res,
        `${PRODUCT_MASTER_ERROR_MESSAGES.VALIDATION_FAILED}: ${validationErrors.join(', ')}`,
        400
      );
    }

    // Check if brand exists (if brand_id is being updated)
    if (req.body.brand_id) {
      const brand = await Brand.findByPk(req.body.brand_id);
      if (!brand) {
        return ResponseHandler.error(res, PRODUCT_MASTER_ERROR_MESSAGES.BRAND_NOT_FOUND, 400);
      }
    }

    // Check if catalogue_id already exists (if catalogue_id is being updated)
    if (req.body.catalogue_id && req.body.catalogue_id !== product.catelogue_id) {
      const existingProduct = await ProductMaster.findOne({ 
        where: { 
          catelogue_id: req.body.catalogue_id,
          id: { [Op.ne]: id }
        } 
      });
      if (existingProduct) {
        return ResponseHandler.error(
          res,
          PRODUCT_MASTER_ERROR_MESSAGES.CATALOGUE_ID_ALREADY_EXISTS(req.body.catalogue_id),
          400
        );
      }
    }

    let updatedImageUrl = product.image_url;
    if (image_url) {
      updatedImageUrl = cleanUrl(image_url) || product.image_url;
    }

    // Update the product

    await product.update({
      ...rest,
      image_url: updatedImageUrl,
    });

    return ResponseHandler.success(res, product);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error updating parent product', 500);
  }
};

// Get parent product by catalogue ID
export const getParentProductByCatalogueId = async (req: Request, res: Response) => {
  const { catalogueId } = req.params;
  const { page = PRODUCT_MASTER_PAGINATION.DEFAULT_PAGE, limit = PRODUCT_MASTER_PAGINATION.DEFAULT_LIMIT } = req.query;
  const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

  try {
    const { count, rows } = await ProductMaster.findAndCountAll({
      where: { catelogue_id: catalogueId },
      limit: parseInt(limit.toString()),
      offset,
      include: [
        {
          model: Brand,
          as: 'Brand',
          attributes: ['id', 'name', 'image']
        }
      ]
    });

    if (count === 0) {
      return ResponseHandler.error(res, PRODUCT_MASTER_ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
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
    return ResponseHandler.error(res, error.message || 'Error fetching parent product', 500);
  }
};

// Get parent products (pagination + filters)
export const getParentProducts = async (req: Request, res: Response) => {
  try {
    const { page = PRODUCT_MASTER_PAGINATION.DEFAULT_PAGE, limit = PRODUCT_MASTER_PAGINATION.DEFAULT_LIMIT, status, search } = req.query;
    const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const whereClause: any = {};
    if (status !== undefined) {
      whereClause.status = status;
    }
    if (search) {
      whereClause[Op.or] = [
        { catelogue_id: { [Op.like]: `%${search}%` } },
        { product_id: { [Op.like]: `%${search}%` } },
        { sku_id: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
        { hsn: { [Op.like]: `%${search}%` } },
        { ean_upc: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await ProductMaster.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit.toString()),
      offset,
      order: [['id', 'DESC']],
      include: [
        {
          model: Brand,
          as: 'Brand',
          attributes: ['id', 'name', 'image']
        }
      ]
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
    console.error('Get parent products error:', error);
    return ResponseHandler.error(res, error.message || 'Error fetching parent products', 500);
  }
};

// Get parent product by ID
export const getParentProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return ResponseHandler.error(res, 'Parent product ID is required', 400);
    }

    const product = await ProductMaster.findByPk(id, {
      include: [
        {
          model: Brand,
          as: 'Brand',
          attributes: ['id', 'name', 'image']
        }
      ]
    });

    if (!product) {
      return ResponseHandler.error(res, PRODUCT_MASTER_ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
    }

    return ResponseHandler.success(res, {
      message: PRODUCT_MASTER_SUCCESS_MESSAGES.RETRIEVED,
      data: product,
    });
  } catch (error: any) {
    console.error('Get parent product by ID error:', error);
    return ResponseHandler.error(res, error.message || 'Internal server error', 500);
  }
};

// Delete parent product
export const deleteParentProduct = async (req: Request, res: Response) => {
  try {
    // Check DC access
    if (!validateDCAccess(req)) {
      return ResponseHandler.error(res, PRODUCT_MASTER_ERROR_MESSAGES.DC_ACCESS_DENIED, 403);
    }

    const { id } = req.params;

    if (!id) {
      return ResponseHandler.error(res, 'Parent product ID is required', 400);
    }

    const product = await ProductMaster.findByPk(id);

    if (!product) {
      return ResponseHandler.error(res, PRODUCT_MASTER_ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
    }

    await product.destroy();

    return ResponseHandler.success(res, {
      message: PRODUCT_MASTER_SUCCESS_MESSAGES.DELETED,
    });
  } catch (error: any) {
    console.error('Delete parent product error:', error);
    return ResponseHandler.error(res, error.message || 'Internal server error', 500);
  }
};

// Bulk upload parent products via Excel
export const bulkUploadParentProducts = async (req: Request, res: Response) => {
  try {
    // Check DC access
    if (!validateDCAccess(req)) {
      return ResponseHandler.error(res, PRODUCT_MASTER_ERROR_MESSAGES.DC_ACCESS_DENIED, 403);
    }

    if (!req.file) {
      return ResponseHandler.error(res, 'Excel file is required', 400);
    }

    const multer = require('multer');
    const xlsx = require('xlsx');
    const path = require('path');

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return ResponseHandler.error(res, 'Excel file is empty', 400);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel starts from row 1 and we skip header

      try {
        // Validate required fields
        const validationErrors = validateParentProduct(row);
        if (validationErrors.length > 0) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            errors: validationErrors,
            data: row
          });
          continue;
        }

        // Check if brand exists
        const brand = await Brand.findByPk(row.brand_id);
        if (!brand) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            errors: [PRODUCT_MASTER_ERROR_MESSAGES.BRAND_NOT_FOUND],
            data: row
          });
          continue;
        }

        // Check if catalogue_id already exists
        const existingProduct = await ProductMaster.findOne({ 
          where: { catelogue_id: row.catalogue_id } 
        });
        if (existingProduct) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            errors: [PRODUCT_MASTER_ERROR_MESSAGES.CATALOGUE_ID_ALREADY_EXISTS(row.catalogue_id)],
            data: row
          });
          continue;
        }

        // Generate SKU if not provided
        const sku = row.sku || `PM-${row.catalogue_id}`;

        // Create product
        await ProductMaster.create({
          ...row,
          image_url: cleanUrl(row.image_url),
          sku: sku,
          createdBy: req.user.id,
          created_by: req.user.id,
        } as ProductMasterCreationAttributes);

        results.success++;

      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          errors: [error.message],
          data: row
        });
      }
    }

    // Clean up uploaded file
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    return ResponseHandler.success(res, {
      message: `Bulk upload completed. Success: ${results.success}, Failed: ${results.failed}`,
      results
    });

  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return ResponseHandler.error(res, error.message || 'Error during bulk upload', 500);
  }
};

