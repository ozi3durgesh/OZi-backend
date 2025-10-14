import { Op } from 'sequelize';
import VendorDC from '../../models/VendorDC';
import { DistributionCenter, User } from '../../models';
import { VENDOR_CONSTANTS } from '../../constants/vendorConstants';
import { EmailService } from '../emailService';

interface VendorFilters {
  search?: string;
  dcId?: number;
  vendorType?: string;
}

export class VendorDCService {
  /**
   * Generate unique vendor ID
   */
  static async generateVendorId(): Promise<string> {
    const { VENDOR_ID_PREFIX, VENDOR_ID_START_NUMBER } = VENDOR_CONSTANTS;

    // Find the latest vendor
    const lastVendor = await VendorDC.findOne({
      order: [['createdAt', 'DESC']],
    });

    let newVendorId = `${VENDOR_ID_PREFIX}${VENDOR_ID_START_NUMBER}`;

    if (lastVendor && lastVendor.vendorId) {
      // Extract the number from the vendor ID
      const lastNumber = parseInt(
        lastVendor.vendorId.replace(VENDOR_ID_PREFIX, ''),
        10
      );
      const nextNumber = lastNumber + 1;
      newVendorId = `${VENDOR_ID_PREFIX}${nextNumber}`;
    }

    // Ensure uniqueness
    let vendorExists = await VendorDC.findOne({
      where: { vendorId: newVendorId },
    });

    while (vendorExists) {
      const lastNumber = parseInt(newVendorId.replace(VENDOR_ID_PREFIX, ''), 10);
      const nextNumber = lastNumber + 1;
      newVendorId = `${VENDOR_ID_PREFIX}${nextNumber}`;
      vendorExists = await VendorDC.findOne({ where: { vendorId: newVendorId } });
    }

    return newVendorId;
  }

  /**
   * Create a new vendor
   */
  static async createVendor(vendorData: any) {
    // Check if GST number already exists
    const existingVendor = await VendorDC.findOne({
      where: { gstNumber: vendorData.gstNumber },
    });

    if (existingVendor) {
      const error: any = new Error(VENDOR_CONSTANTS.ERRORS.DUPLICATE_GST);
      error.statusCode = 409;
      throw error;
    }

    // Validate DC exists
    const dc = await DistributionCenter.findByPk(vendorData.dcId);
    if (!dc) {
      const error: any = new Error(VENDOR_CONSTANTS.ERRORS.INVALID_DC);
      error.statusCode = 400;
      throw error;
    }

    // Generate unique vendor ID
    const vendorId = await this.generateVendorId();

    // Create vendor
    const newVendor = await VendorDC.create({
      vendorId,
      dcId: vendorData.dcId,
      tradeName: vendorData.tradeName,
      businessAddress: vendorData.businessAddress,
      city: vendorData.city,
      state: vendorData.state,
      country: vendorData.country || VENDOR_CONSTANTS.DEFAULTS.COUNTRY,
      pincode: vendorData.pincode,
      pocName: vendorData.pocName,
      pocNumber: vendorData.pocNumber,
      pocEmail: vendorData.pocEmail,
      gstNumber: vendorData.gstNumber,
      panNumber: vendorData.panNumber,
      vendorType: vendorData.vendorType || VENDOR_CONSTANTS.DEFAULTS.VENDOR_TYPE,
      brandName: vendorData.brandName,
      model: vendorData.model,
      vrf: vendorData.vrf,
      paymentTerms: vendorData.paymentTerms,
      createdBy: vendorData.createdBy,
    });

    // Fetch the created vendor with associations
    const vendor = await VendorDC.findByPk(newVendor.id, {
      include: [
        {
          model: DistributionCenter,
          as: 'DistributionCenter',
          attributes: ['id', 'dc_code', 'name', 'city', 'state'],
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['id', 'email', 'name'],
        },
      ],
    });

    // Send onboarding email ONLY to vendor's POC email
    console.log('🚀 ===== VENDOR EMAIL PROCESS STARTED =====');
    console.log('🔍 Vendor exists:', !!vendor);
    console.log('🔍 POC email exists:', !!vendor?.pocEmail);
    console.log('🔍 POC email value:', vendor?.pocEmail);
    console.log('🔍 Full vendor object:', JSON.stringify(vendor, null, 2));
    console.log('🔍 EmailService import check:', typeof EmailService);
    console.log('🔍 EmailService.sendVendorOnboardingEmail check:', typeof EmailService.sendVendorOnboardingEmail);
    
    const pocEmail = vendor?.pocEmail || vendor?.dataValues?.pocEmail;
    if (vendor && pocEmail) {
      try {
        console.log('📧 ===== SENDING EMAIL TO POC =====');
        console.log('📧 Recipient:', pocEmail);
        console.log('📧 Vendor Name:', vendor?.tradeName || vendor?.dataValues?.tradeName);
        console.log('📧 Vendor ID:', vendor?.vendorId || vendor?.dataValues?.vendorId);
        
        const tradeName = vendor?.tradeName || vendor?.dataValues?.tradeName;
        const vendorId = vendor?.vendorId || vendor?.dataValues?.vendorId;
        const pocName = vendor?.pocName || vendor?.dataValues?.pocName;
        const businessAddress = vendor?.businessAddress || vendor?.dataValues?.businessAddress;
        const city = vendor?.city || vendor?.dataValues?.city;
        const state = vendor?.state || vendor?.dataValues?.state;
        const pincode = vendor?.pincode || vendor?.dataValues?.pincode;
        const gstNumber = vendor?.gstNumber || vendor?.dataValues?.gstNumber;
        const panNumber = vendor?.panNumber || vendor?.dataValues?.panNumber;
        const vendorType = vendor?.vendorType || vendor?.dataValues?.vendorType;
        const brandName = vendor?.brandName || vendor?.dataValues?.brandName;
        const model = vendor?.model || vendor?.dataValues?.model;
        const vrf = vendor?.vrf || vendor?.dataValues?.vrf;
        const paymentTerms = vendor?.paymentTerms || vendor?.dataValues?.paymentTerms;
        
        const emailResult = await EmailService.sendVendorOnboardingEmail(
          [pocEmail], // Only send to the POC email from the request
          tradeName,
          vendorId,
          (vendor as any).DistributionCenter?.name || 'N/A',
          pocName || 'Vendor',
          pocEmail,
          businessAddress || '',
          city || '',
          state || '',
          pincode || '',
          gstNumber,
          panNumber || '',
          vendorType,
          brandName,
          model,
          vrf,
          paymentTerms
        );
        
        console.log('✅ ===== EMAIL SENT SUCCESSFULLY =====');
        console.log('✅ Email result:', emailResult);
        console.log('✅ Sent to:', pocEmail);
        console.log('✅ Subject: Welcome to OZI - ' + tradeName + ' Successfully Onboarded!');
      } catch (emailError) {
        console.error('❌ ===== EMAIL SENDING FAILED =====');
        console.error('❌ Error:', emailError);
        console.error('❌ Error details:', (emailError as Error).message);
        // Don't throw error - vendor creation should still succeed
      }
    } else {
      console.log('⚠️ ===== NO EMAIL SENT =====');
      console.log('⚠️ Reason: No POC email provided');
      console.log('⚠️ Vendor exists:', !!vendor);
      console.log('⚠️ POC Email exists:', !!vendor?.pocEmail);
    }

    return vendor;
  }

  /**
   * Get vendors with filters and pagination
   */
  static async getVendors(filters: VendorFilters, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    // Apply filters
    if (filters.search) {
      whereClause[Op.or] = [
        { vendorId: { [Op.like]: `%${filters.search}%` } },
        { tradeName: { [Op.like]: `%${filters.search}%` } },
        { pocName: { [Op.like]: `%${filters.search}%` } },
        { gstNumber: { [Op.like]: `%${filters.search}%` } },
      ];
    }


    if (filters.dcId) {
      whereClause.dcId = filters.dcId;
    }

    if (filters.vendorType) {
      whereClause.vendorType = filters.vendorType;
    }

    const { count, rows } = await VendorDC.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: DistributionCenter,
          as: 'DistributionCenter',
          attributes: ['id', 'dc_code', 'name', 'city', 'state'],
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: User,
          as: 'UpdatedBy',
          attributes: ['id', 'email', 'name'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      vendors: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get vendor by primary ID
   */
  static async getVendorById(id: number) {
    return await VendorDC.findByPk(id, {
      include: [
        {
          model: DistributionCenter,
          as: 'DistributionCenter',
          attributes: ['id', 'dc_code', 'name', 'city', 'state', 'address'],
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: User,
          as: 'UpdatedBy',
          attributes: ['id', 'email', 'name'],
        },
      ],
    });
  }

  /**
   * Get vendor by vendor ID (OZIVID format)
   */
  static async getVendorByVendorId(vendorId: string) {
    return await VendorDC.findOne({
      where: { vendorId },
      include: [
        {
          model: DistributionCenter,
          as: 'DistributionCenter',
          attributes: ['id', 'dc_code', 'name', 'city', 'state', 'address'],
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: User,
          as: 'UpdatedBy',
          attributes: ['id', 'email', 'name'],
        },
      ],
    });
  }

  /**
   * Update vendor
   */
  static async updateVendor(id: number, updateData: any) {
    const vendor = await VendorDC.findByPk(id);

    if (!vendor) {
      const error: any = new Error(VENDOR_CONSTANTS.ERRORS.VENDOR_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    // Check if GST number is being updated and if it already exists
    if (updateData.gstNumber && updateData.gstNumber !== vendor.gstNumber) {
      const existingVendor = await VendorDC.findOne({
        where: {
          gstNumber: updateData.gstNumber,
          id: { [Op.ne]: id },
        },
      });

      if (existingVendor) {
        const error: any = new Error(VENDOR_CONSTANTS.ERRORS.DUPLICATE_GST);
        error.statusCode = 409;
        throw error;
      }
    }

    // If DC is being updated, validate it exists
    if (updateData.dcId && updateData.dcId !== vendor.dcId) {
      const dc = await DistributionCenter.findByPk(updateData.dcId);
      if (!dc) {
        const error: any = new Error(VENDOR_CONSTANTS.ERRORS.INVALID_DC);
        error.statusCode = 400;
        throw error;
      }
    }

    await vendor.update(updateData);

    // Return updated vendor with associations
    return await this.getVendorById(id);
  }

  /**
   * Delete vendor
   */
  static async deleteVendor(id: number) {
    const vendor = await VendorDC.findByPk(id);

    if (!vendor) {
      const error: any = new Error(VENDOR_CONSTANTS.ERRORS.VENDOR_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await vendor.destroy();
    return true;
  }
}

