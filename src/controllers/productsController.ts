import { Request, Response } from 'express';
import Product from '../models/productModel';
import { ResponseHandler } from '../middleware/responseHandler';  // ✅ adjust path if needed

// Create a new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      CPId, Status, ModelNum, Category, SKU, ParentSKU, IS_MPS, ProductName, Description,
      ManufacturerDescription, ProductTaxCode, ImageURL, MRP, COST, EAN_UPC, Color, Size,
      Brand, Weight, Length, Height, Width, AccountingSKU, AccountingUnit, SPThreshold,
      InventoryThreshold, ERPSystemId, SyncTally, ShelfLife, ShelfLifePercentage,
      ProductExpiryInDays, ReverseWeight, ReverseLength, ReverseHeight, ReverseWidth,
      ProductTaxRule, CESS, CreatedDate, LastUpdatedDate, SKUType, MaterialType
    } = req.body;

    // ✅ Check if SKU already exists
    const existingProduct = await Product.findOne({ where: { SKU } });
    if (existingProduct) {
      return ResponseHandler.error(res, `Product with SKU ${SKU} already exists`, 400);
    }

    // ✅ Create new product
    const product = await Product.create({
      CPId, Status, ModelNum, Category, SKU, ParentSKU, IS_MPS, ProductName, Description,
      ManufacturerDescription, ProductTaxCode, ImageURL, MRP, COST, EAN_UPC, Color, Size,
      Brand, Weight, Length, Height, Width, AccountingSKU, AccountingUnit, SPThreshold,
      InventoryThreshold, ERPSystemId, SyncTally, ShelfLife, ShelfLifePercentage,
      ProductExpiryInDays, ReverseWeight, ReverseLength, ReverseHeight, ReverseWidth,
      ProductTaxRule, CESS, CreatedDate, LastUpdatedDate, SKUType, MaterialType
    });

    return ResponseHandler.success(res, product, 201);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error creating product', 500);
  }
};

// Update an existing product
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    CPId, Status, ModelNum, Category, SKU, ParentSKU, IS_MPS, ProductName, Description,
    ManufacturerDescription, ProductTaxCode, ImageURL, MRP, COST, EAN_UPC, Color, Size,
    Brand, Weight, Length, Height, Width, AccountingSKU, AccountingUnit, SPThreshold,
    InventoryThreshold, ERPSystemId, SyncTally, ShelfLife, ShelfLifePercentage,
    ProductExpiryInDays, ReverseWeight, ReverseLength, ReverseHeight, ReverseWidth,
    ProductTaxRule, CESS, CreatedDate, LastUpdatedDate, SKUType, MaterialType
  } = req.body;

  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return ResponseHandler.error(res, 'Product not found', 404);
    }

    await product.update({
      CPId, Status, ModelNum, Category, SKU, ParentSKU, IS_MPS, ProductName, Description,
      ManufacturerDescription, ProductTaxCode, ImageURL, MRP, COST, EAN_UPC, Color, Size,
      Brand, Weight, Length, Height, Width, AccountingSKU, AccountingUnit, SPThreshold,
      InventoryThreshold, ERPSystemId, SyncTally, ShelfLife, ShelfLifePercentage,
      ProductExpiryInDays, ReverseWeight, ReverseLength, ReverseHeight, ReverseWidth,
      ProductTaxRule, CESS, CreatedDate, LastUpdatedDate, SKUType, MaterialType
    });

    return ResponseHandler.success(res, product);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error updating product', 500);
  }
};

// Get a product by SKU (with pagination)
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

// Get list of products with pagination
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const whereClause: any = {};
    if (status) {
      whereClause.Status = status; // ✅ Optional filter by status
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
