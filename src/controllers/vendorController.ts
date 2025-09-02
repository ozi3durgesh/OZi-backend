import { Request, Response } from 'express';
import Vendor from '../models/vendor'; // ⬅️ make sure file is named Vendor.ts with capital V

export const createVendor = async (req: Request, res: Response) => {
  try {
    const { businessName, businessAddress, city, state, pincode, pocName, pocNumber, taxId } = req.body;

    // ✅ Check duplicate taxId
    const existingVendor = await Vendor.findOne({ where: { taxId } });
    if (existingVendor) {
      return res.status(409).json({ message: 'Vendor with this Tax ID already exists.' });
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
      taxId,
    });

    return res.status(201).json({ message: 'Vendor created successfully!', data: newVendor });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get a product by SKU
export const getVendorById = async (req: Request, res: Response) => {
  const { vid } = req.params;

  try {
    const vendor = await Vendor.findOne({ where: { vendorId: vid } });

    if (!vendor) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(vendor);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching product', error });
  }
};

export const getVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await Vendor.findAll();
    return res.status(200).json({ message: 'Vendors fetched successfully', data: vendors });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
