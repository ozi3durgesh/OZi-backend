import { Request, Response } from 'express';
import Vendor from '../models/vendor'; // ⬅️ make sure file is named Vendor.ts with capital V
import { ResponseHandler } from '../middleware/responseHandler'; // ✅ adjust path if needed
import { Op } from 'sequelize';

export const createVendor = async (req: Request, res: Response) => {
  try {
    const { businessName, businessAddress, city, state, pincode, pocName, pocNumber, gstNumber } = req.body;

    // ✅ Check duplicate gstNumber
    const existingVendor = await Vendor.findOne({ where: { gstNumber } });
    if (existingVendor) {
      return ResponseHandler.error(res, 'Vendor with this GST Number already exists.', 409);
    }

    // ✅ Find latest vendorId
    const lastVendor = await Vendor.findOne({
      order: [['createdAt', 'DESC']],
    });

    let newVendorId = 'OZIVID10001'; // default if no vendors exist
    if (lastVendor && lastVendor.vendorId) {
      // Extract the number from "OZIVID10001"
      const lastNumber = parseInt(lastVendor.vendorId.replace('OZIVID', ''), 10);
      const nextNumber = lastNumber + 1;
      newVendorId = `OZIVID${nextNumber}`;
    }

    // ✅ Ensure unique vendorId
    let vendorExists = await Vendor.findOne({ where: { vendorId: newVendorId } });
    while (vendorExists) {
      const lastNumber = parseInt(newVendorId.replace('OZIVID', ''), 10);
      const nextNumber = lastNumber + 1;
      newVendorId = `OZIVID${nextNumber}`;
      vendorExists = await Vendor.findOne({ where: { vendorId: newVendorId } });
    }

    // ✅ Create vendor with generated unique vendorId
    const newVendor = await Vendor.create({
      vendorId: newVendorId,
      businessName,
      businessAddress,
      city,
      state,
      pincode,
      pocName,
      pocNumber,
      gstNumber,
    });

    return ResponseHandler.success(res, { message: 'Vendor created successfully!', data: newVendor }, 201);
  } catch (error: any) {
    console.error(error);
    return ResponseHandler.error(res, error.message || 'Server error', 500);
  }
};

// Get a vendor by ID
export const getVendorById = async (req: Request, res: Response) => {
  const { vid } = req.params;

  try {
    const vendor = await Vendor.findOne({ where: { vendorId: vid } });

    if (!vendor) {
      return ResponseHandler.error(res, 'Vendor not found', 404);
    }

    return ResponseHandler.success(res, vendor);
  } catch (error: any) {
    return ResponseHandler.error(res, error.message || 'Error fetching vendor', 500);
  }
};

// Get vendors (with optional search by vendorId, businessName, or pocName)
export const getVendors = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    let whereClause: any = {};

    if (search) {
      whereClause = {
        [Op.or]: [
          { vendorId: { [Op.like]: `%${search}%` } },
          { businessName: { [Op.like]: `%${search}%` } },
          { pocName: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    const vendors = await Vendor.findAll({ where: whereClause });

    return ResponseHandler.success(res, { message: 'Vendors fetched successfully', data: vendors });
  } catch (error: any) {
    console.error(error);
    return ResponseHandler.error(res, error.message || 'Server error', 500);
  }
};
