import { Request, Response } from 'express';
import ParentProductMasterDC, { ParentProductMasterDCCreationAttributes } from '../../models/ParentProductMasterDC';
import { ResponseHandler } from '../../middleware/responseHandler';
import { Op } from 'sequelize';
import {
  PARENT_PRODUCT_REQUIRED_FIELDS,
  PARENT_PRODUCT_NUMERIC_FIELDS,
  PARENT_PRODUCT_VALIDATION_PATTERNS,
  PARENT_PRODUCT_ERROR_MESSAGES,
  PARENT_PRODUCT_SUCCESS_MESSAGES,
  PARENT_PRODUCT_STATUS,
  PARENT_PRODUCT_FLAMMABLE_OPTIONS,
  PARENT_PRODUCT_PAGINATION,
} from '../../constants/parentProductConstants';

// Helper function: clean URL
const cleanUrl = (url: string | undefined) => {
  if (!url) return null;
  return url.replace(/`/g, '').trim();
};

// Validation helper function
const validateParentProduct = (data: any): string[] => {
  const validationErrors: string[] = [];

  // Required fields validation
  for (const field of PARENT_PRODUCT_REQUIRED_FIELDS) {
    if (!data[field] || data[field].toString().trim() === '') {
      validationErrors.push(PARENT_PRODUCT_ERROR_MESSAGES.REQUIRED_FIELD(field));
    }
  }

  // SKU format validation (exactly 12 digits)
  if (data.SKU && !PARENT_PRODUCT_VALIDATION_PATTERNS.SKU.test(data.SKU.toString())) {
    validationErrors.push(PARENT_PRODUCT_ERROR_MESSAGES.INVALID_SKU_FORMAT);
  }

  // HSN format validation (4-8 digits)
  if (data.hsn && !PARENT_PRODUCT_VALIDATION_PATTERNS.HSN.test(data.hsn.toString())) {
    validationErrors.push(PARENT_PRODUCT_ERROR_MESSAGES.INVALID_HSN_FORMAT);
  }

  // EAN/UPC format validation (8-14 digits)
  if (data.EAN_UPC && !PARENT_PRODUCT_VALIDATION_PATTERNS.EAN_UPC.test(data.EAN_UPC.toString())) {
    validationErrors.push(PARENT_PRODUCT_ERROR_MESSAGES.INVALID_EAN_FORMAT);
  }

  // ImageURL format validation
  if (data.ImageURL) {
    if (!PARENT_PRODUCT_VALIDATION_PATTERNS.IMAGE_URL.test(data.ImageURL)) {
      validationErrors.push(PARENT_PRODUCT_ERROR_MESSAGES.INVALID_IMAGE_URL);
    } else if (!PARENT_PRODUCT_VALIDATION_PATTERNS.IMAGE_EXTENSION.test(data.ImageURL)) {
      validationErrors.push(PARENT_PRODUCT_ERROR_MESSAGES.INVALID_IMAGE_EXTENSION);
    }
  }

  // Status validation
  const validStatuses = Object.values(PARENT_PRODUCT_STATUS);
  if (data.Status && !validStatuses.includes(data.Status)) {
    validationErrors.push(PARENT_PRODUCT_ERROR_MESSAGES.INVALID_STATUS);
  }

  // GST format validation
  if (data.gst) {
    if (!PARENT_PRODUCT_VALIDATION_PATTERNS.GST.test(data.gst.toString())) {
      validationErrors.push(PARENT_PRODUCT_ERROR_MESSAGES.INVALID_GST_FORMAT);
    } else {
      const numericValue = parseFloat(data.gst.toString().replace('%', ''));
      if (numericValue < 0 || numericValue > 100) {
        validationErrors.push(PARENT_PRODUCT_ERROR_MESSAGES.INVALID_GST_RANGE);
      }
    }
  }

  // Numeric fields validation
  for (const field of PARENT_PRODUCT_NUMERIC_FIELDS) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      const value = Number(data[field]);
      if (isNaN(value) || value < 0) {
        validationErrors.push(PARENT_PRODUCT_ERROR_MESSAGES.INVALID_NUMERIC_FIELD(field));
      }
    }
  }

  // Flammable validation
  const validFlammableOptions = Object.values(PARENT_PRODUCT_FLAMMABLE_OPTIONS);
  if (data.Flammable && !validFlammableOptions.includes(data.Flammable)) {
    validationErrors.push(PARENT_PRODUCT_ERROR_MESSAGES.INVALID_FLAMMABLE);
  }

  return validationErrors;
};

// Create parent product
export const createParentProduct = async (req: Request, res: Response) => {
  try {
    const { SKU, ImageURL, ...rest } = req.body;

    // Validation errors array
    const validationErrors = validateParentProduct(req.body);

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return ResponseHandler.error(
        res,
        `${PARENT_PRODUCT_ERROR_MESSAGES.VALIDATION_FAILED}: ${validationErrors.join(', ')}`,
        400
      );
    }

    // Check if parent product with same SKU already exists
    const existingProduct = await ParentProductMasterDC.findOne({ where: { SKU } });
    if (existingProduct) {
      return ResponseHandler.error(
        res,
        PARENT_PRODUCT_ERROR_MESSAGES.SKU_ALREADY_EXISTS(SKU),
        400
      );
    }

    // Clean and use ImageURL directly from request
    const imageUrl = cleanUrl(ImageURL);

    // Create parent product
    const parentProduct = await ParentProductMasterDC.create({
      SKU,
      ImageURL: imageUrl,
      CreatedDate: new Date().toISOString(),
      LastUpdatedDate: new Date().toISOString(),
      ...rest,
    } as ParentProductMasterDCCreationAttributes);

    return ResponseHandler.success(res, parentProduct, 201);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error creating parent product', 500);
  }
};

// Update parent product
export const updateParentProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { SKU, ImageURL, ...rest } = req.body;

  try {
    const parentProduct = await ParentProductMasterDC.findByPk(id);
    if (!parentProduct) {
      return ResponseHandler.error(res, PARENT_PRODUCT_ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
    }

    let updatedImageURL = parentProduct.ImageURL;
    if (ImageURL) {
      updatedImageURL = cleanUrl(ImageURL);
    }

    await parentProduct.update({
      SKU,
      ImageURL: updatedImageURL,
      LastUpdatedDate: new Date().toISOString(),
      ...rest,
    });

    return ResponseHandler.success(res, parentProduct);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error updating parent product', 500);
  }
};

// Get parent product by SKU
export const getParentProductBySKU = async (req: Request, res: Response) => {
  const { sku } = req.params;
  const { page = PARENT_PRODUCT_PAGINATION.DEFAULT_PAGE, limit = PARENT_PRODUCT_PAGINATION.DEFAULT_LIMIT } = req.query;
  const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

  try {
    const { count, rows } = await ParentProductMasterDC.findAndCountAll({
      where: { SKU: sku },
      limit: parseInt(limit.toString()),
      offset,
    });

    if (count === 0) {
      return ResponseHandler.error(res, PARENT_PRODUCT_ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
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
    const { page = PARENT_PRODUCT_PAGINATION.DEFAULT_PAGE, limit = PARENT_PRODUCT_PAGINATION.DEFAULT_LIMIT, Status, search } = req.query;
    const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const whereClause: any = {};
    if (Status) {
      whereClause.Status = Status;
    }
    if (search) {
      whereClause[Op.or] = [
        { SKU: { [Op.like]: `%${search}%` } },
        { ProductName: { [Op.like]: `%${search}%` } },
        { ModelNum: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await ParentProductMasterDC.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit.toString()),
      offset,
      order: [['id', 'DESC']],
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

    const parentProduct = await ParentProductMasterDC.findByPk(id);

    if (!parentProduct) {
      return ResponseHandler.error(res, PARENT_PRODUCT_ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
    }

    return ResponseHandler.success(res, {
      message: PARENT_PRODUCT_SUCCESS_MESSAGES.RETRIEVED,
      data: parentProduct,
    });
  } catch (error: any) {
    console.error('Get parent product by ID error:', error);
    return ResponseHandler.error(res, error.message || 'Internal server error', 500);
  }
};

// Delete parent product
export const deleteParentProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return ResponseHandler.error(res, 'Parent product ID is required', 400);
    }

    const parentProduct = await ParentProductMasterDC.findByPk(id);

    if (!parentProduct) {
      return ResponseHandler.error(res, PARENT_PRODUCT_ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
    }

    await parentProduct.destroy();

    return ResponseHandler.success(res, {
      message: PARENT_PRODUCT_SUCCESS_MESSAGES.DELETED,
    });
  } catch (error: any) {
    console.error('Delete parent product error:', error);
    return ResponseHandler.error(res, error.message || 'Internal server error', 500);
  }
};

