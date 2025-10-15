import { Request, Response } from 'express';
import Product from '../../models/productModel';
import { ResponseHandler } from '../../middleware/responseHandler';
import { Op } from 'sequelize';

// DC Auth validation helper
const validateDCAccess = (req: any): boolean => {
  const user = req.user;
  if (!user) return false;
  
  // Check if user has DC access - either through role or currentDcId
  return (user.role && user.role.toLowerCase().includes('dc')) || 
         (user.currentDcId && user.currentDcId > 0) ||
         (user.role && user.role.toLowerCase() === 'admin'); // Admin users have DC access
};

// Get SKUs by catalogue_id with pagination
export const fetchSKUByCatalogueId = async (req: Request, res: Response) => {
  try {
    // Check DC access
    if (!validateDCAccess(req)) {
      return ResponseHandler.error(res, 'Access denied. DC access required.', 403);
    }

    const { catalogue_id } = req.params;
    const { page = 1, limit = 20, search, status } = req.query;

    // Validate catalogue_id
    if (!catalogue_id) {
      return ResponseHandler.error(res, 'Catalogue ID is required', 400);
    }

    // Validate catalogue_id format (7 numeric digits)
    if (!/^\d{7}$/.test(catalogue_id)) {
      return ResponseHandler.error(res, 'Catalogue ID must be exactly 7 numeric digits', 400);
    }

    const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    // Build where clause
    const whereClause: any = {};

    // Query product_master table directly by catelogue_id
    // Add catelogue_id filter (note: typo in database column name)
    whereClause.catelogue_id = catalogue_id;

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    // Add search filter if provided
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { hsn: { [Op.like]: `%${search}%` } },
        { ean_upc: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { catelogue_id: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      attributes: [
        'id',
        'catelogue_id',
        'name',
        'description',
        'hsn',
        'image_url',
        'mrp',
        'ean_upc',
        'weight',
        'length',
        'height',
        'width',
        'inventory_thresshold',
        'gst',
        'cess',
        'status',
        'category',
        'brand_id',
        'sku',
        'item_code',
        'cost',
        'dc_id',
        'created_by'
      ],
      limit: parseInt(limit.toString()),
      offset,
      order: [['id', 'DESC']]
    });

    if (count === 0) {
      return ResponseHandler.error(res, 'No products found for the given catalogue ID', 404);
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
    console.error('Fetch SKU by catalogue ID error:', error);
    return ResponseHandler.error(res, error.message || 'Error fetching SKUs', 500);
  }
};
