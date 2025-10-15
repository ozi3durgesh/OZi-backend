import { Request, Response } from 'express';
import Brand from '../models/Brand';
import { ResponseHandler } from '../middleware/responseHandler';
import { Op } from 'sequelize';

// Create brand
export const createBrand = async (req: Request, res: Response) => {
  try {
    const { name, slug, image, status = 1, module_id } = req.body;

    // Check if brand with same name already exists
    const existingBrand = await Brand.findOne({ where: { name } });
    if (existingBrand) {
      return ResponseHandler.error(res, 'Brand with this name already exists', 409);
    }

    // Create brand
    const brand = await Brand.create({
      name,
      slug,
      image,
      status,
      module_id,
    });

    return ResponseHandler.success(res, brand, 201);
  } catch (error: any) {
    console.error('Error creating brand:', error);
    return ResponseHandler.error(res, error.message || 'Error creating brand', 500);
  }
};

// Get all brands with pagination
export const getBrands = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status !== undefined) {
      whereClause.status = status;
    }

    // Get brands with pagination
    const { count, rows: brands } = await Brand.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    return ResponseHandler.success(res, {
      brands,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching brands:', error);
    return ResponseHandler.error(res, error.message || 'Error fetching brands', 500);
  }
};

// Get brand by ID
export const getBrandById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByPk(id);
    if (!brand) {
      return ResponseHandler.error(res, 'Brand not found', 404);
    }

    return ResponseHandler.success(res, brand);
  } catch (error: any) {
    console.error('Error fetching brand:', error);
    return ResponseHandler.error(res, error.message || 'Error fetching brand', 500);
  }
};

// Update brand
export const updateBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, image, status, module_id } = req.body;

    const brand = await Brand.findByPk(id);
    if (!brand) {
      return ResponseHandler.error(res, 'Brand not found', 404);
    }

    // Check if name is being updated and if it conflicts with existing brand
    if (name && name !== brand.name) {
      const existingBrand = await Brand.findOne({ 
        where: { 
          name, 
          id: { [Op.ne]: id } 
        } 
      });
      if (existingBrand) {
        return ResponseHandler.error(res, 'Brand with this name already exists', 409);
      }
    }

    // Update brand
    await brand.update({
      name: name || brand.name,
      slug: slug !== undefined ? slug : brand.slug,
      image: image !== undefined ? image : brand.image,
      status: status !== undefined ? status : brand.status,
      module_id: module_id !== undefined ? module_id : brand.module_id,
    });

    return ResponseHandler.success(res, brand);
  } catch (error: any) {
    console.error('Error updating brand:', error);
    return ResponseHandler.error(res, error.message || 'Error updating brand', 500);
  }
};

// Delete brand
export const deleteBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByPk(id);
    if (!brand) {
      return ResponseHandler.error(res, 'Brand not found', 404);
    }

    await brand.destroy();

    return ResponseHandler.success(res, { message: 'Brand deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting brand:', error);
    return ResponseHandler.error(res, error.message || 'Error deleting brand', 500);
  }
};
