import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import GRN from '../models/Grn.model';
import GRNLine from '../models/GrnLine';
import PurchaseOrder from '../models/PurchaseOrder';
import Product from '../models/productModel';
import PutawayTask from '../models/PutawayTask';
import PutawayAudit from '../models/PutawayAudit';
import BinLocation from '../models/BinLocation';
import ScannerSku from '../models/ScannerSku';
import ScannerBin from '../models/ScannerBin';
import { AuthRequest } from '../types';

export class PutawayController {
  // 1. Get GRN Putaway List with pagination
  static async getGrnPutawayList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // First, get all GRN lines with the required line_status
      const allGrnLines = await GRNLine.findAll({
        include: [
          {
            model: GRN,
            as: 'Grn',
            include: [
              {
                model: PurchaseOrder,
                as: 'PO',
                attributes: ['id', 'po_id', 'vendor_name'],
              },
            ],
          },
        ],
        where: {
          line_status: {
            [Op.in]: ['completed', 'pending', 'partial'],
          },
        },
        order: [['created_at', 'DESC']],
      });

      // Group GRN lines by GRN ID to get unique GRNs
      const grnMap = new Map();
      
      allGrnLines.forEach((grnLine: any) => {
        const grnId = grnLine.grn_id;
        const grn = grnLine.Grn;
        
        if (!grnMap.has(grnId)) {
          grnMap.set(grnId, {
            GRN: grnId,
            'PO id': grn?.po_id || 'N/A',
            SKU: new Set(),
            Quantity: 0,
            'GRN Date': grn?.created_at ? grn.created_at.toLocaleDateString() : 'N/A',
          });
        }
        
        const grnData = grnMap.get(grnId);
        grnData.SKU.add(grnLine.sku_id);
        grnData.Quantity += grnLine.ordered_qty;
      });

      // Convert Map to Array and format SKU count
      const allPutawayList = Array.from(grnMap.values()).map(grnData => ({
        ...grnData,
        SKU: grnData.SKU.size, // Convert Set to count
      }));

      // Apply pagination to the grouped results
      const totalItems = allPutawayList.length;
      const paginatedList = allPutawayList.slice(offset, offset + limit);

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          putawayList: paginatedList,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems: totalItems,
            itemsPerPage: limit,
          },
        },
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching GRN putaway list:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error',
      });
    }
  }

  // 2. Get Return Putaway List with pagination
  static async getReturnPutawayList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // For return putaway, we'll look for GRNs with RTV or return status
      const { count, rows } = await GRN.findAndCountAll({
        include: [
          {
            model: PurchaseOrder,
            as: 'PO',
            attributes: ['id', 'po_id', 'vendor_name'],
          },
        ],
        where: {
          status: {
            [Op.in]: ['rtv-initiated', 'variance-review'],
          },
        },
        limit,
        offset,
        order: [['created_at', 'DESC']],
      });

      // Now get the GRN lines with RTV or held quantities for each GRN
      const returnPutawayList = await Promise.all(
        rows.map(async (grn: any) => {
          const grnLines = await GRNLine.findAll({
            where: {
              grn_id: grn.id,
              [Op.or]: [
                { rtv_qty: { [Op.gt]: 0 } },
                { held_qty: { [Op.gt]: 0 } },
              ],
            },
            attributes: ['id', 'sku_id', 'rtv_qty', 'held_qty'],
          });

          // Count unique SKUs for this GRN
          const uniqueSkus = new Set(grnLines.map((line: any) => line.sku_id));
          const skuCount = uniqueSkus.size;
          
          const totalRtvQty = grnLines.reduce((sum: number, line: any) => sum + line.rtv_qty, 0);
          const totalHeldQty = grnLines.reduce((sum: number, line: any) => sum + line.held_qty, 0);
          
          return {
            GRN: grn.id,
            'PO id': grn.po_id, // Direct from grns table
            SKU: skuCount, // Count of unique SKUs
            'RTV Quantity': totalRtvQty,
            'Held Quantity': totalHeldQty,
            'GRN Date': grn.created_at ? grn.created_at.toLocaleDateString() : 'N/A', // Created date from grns table
          };
        })
      );

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          returnPutawayList,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: limit,
          },
        },
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching return putaway list:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error',
      });
    }
  }

  // 3. Get GRN Details by ID
  static async getGrnDetailsById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const grnId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          statusCode: 401,
          success: false,
          data: null,
          error: 'User not authenticated',
        });
        return;
      }

      // Get the GRN data from grns table
      const grn = await GRN.findByPk(grnId);

      if (!grn) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'GRN not found',
        });
        return;
      }

      const grnDetails = {
        GRN: grn.id,
        'Created On': grn.created_at ? grn.created_at.toLocaleDateString() : 'N/A',
        'PO Number': grn.po_id,
      };

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: grnDetails,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching GRN details:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error',
      });
    }
  }

  // 4. Scan SKU API
  static async scanSku(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sku_id, grn_id } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          statusCode: 401,
          success: false,
          data: null,
          error: 'User not authenticated',
        });
        return;
      }

      if (!sku_id || !grn_id) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'SKU ID and GRN ID are required',
        });
        return;
      }

      // Find product in product_master table
      const product = await Product.findOne({
        where: { SKU: sku_id },
      });

      if (!product) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Product not found',
        });
        return;
      }

      // Check if SKU exists in the specified GRN line with QC passed quantity
      const grnLine = await GRNLine.findOne({
        where: {
          sku_id: sku_id,
          grn_id: grn_id,
          qc_pass_qty: {
            [Op.gt]: 0,
          },
        },
        include: [
          {
            model: GRN,
            as: 'Grn',
            include: [
              {
                model: PurchaseOrder,
                as: 'PO',
                attributes: ['po_id', 'vendor_name'],
              },
            ],
          },
        ],
      });

      if (!grnLine) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'No QC passed quantity found for this SKU in the specified GRN',
        });
        return;
      }

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          message: 'SKU scanned successfully',
          sku_id: sku_id,
          grn_id: grnLine.grn_id,
          po_id: (grnLine as any).Grn?.po_id || 'N/A',
          available_quantity: grnLine.qc_pass_qty,
        },
        error: null,
      });
    } catch (error: any) {
      console.error('Error scanning SKU:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error',
      });
    }
  }

  // 5. Scan SKU Product Detail API
  static async scanSkuProductDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sku_id } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          statusCode: 401,
          success: false,
          data: null,
          error: 'User not authenticated',
        });
        return;
      }

      if (!sku_id) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'SKU ID is required',
        });
        return;
      }

      // Find product in product_master table
      const product = await Product.findOne({
        where: { SKU: sku_id },
      });

      if (!product) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Product not found',
        });
        return;
      }

      // Check if SKU exists in any GRN line with QC passed quantity
      const grnLine = await GRNLine.findOne({
        where: {
          sku_id: sku_id,
          qc_pass_qty: {
            [Op.gt]: 0,
          },
        },
        include: [
          {
            model: GRN,
            as: 'Grn',
            include: [
              {
                model: PurchaseOrder,
                as: 'PO',
                attributes: ['po_id', 'vendor_name'],
              },
            ],
          },
        ],
      });

      if (!grnLine) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'No QC passed quantity found for this SKU',
        });
        return;
      }

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          message: 'SKU scanned successfully',
          sku_id: sku_id,
          grn_id: grnLine.grn_id,
          po_id: (grnLine as any).Grn?.po_id || 'N/A',
          available_quantity: grnLine.qc_pass_qty,
          'Scanned Product detail': product.dataValues, // All product fields from product_master table
          'Vendor Name': (grnLine as any).Grn?.PO?.vendor_name || '',
        },
        error: null,
      });
    } catch (error: any) {
      console.error('Error scanning SKU:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error',
      });
    }
  }

  // 5. Get Scanned Product Details
  static async getScannedProductDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sku_id, grn_id } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          statusCode: 401,
          success: false,
          data: null,
          error: 'User not authenticated',
        });
        return;
      }

      if (!sku_id || !grn_id) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'SKU ID and GRN ID are required',
        });
        return;
      }

      // Get product details
      const product = await Product.findOne({
        where: { SKU: sku_id },
      });

      if (!product) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Product not found',
        });
        return;
      }

      // Get GRN and PO details
      const grn = await GRN.findByPk(grn_id, {
        include: [
          {
            model: PurchaseOrder,
            as: 'PO',
            attributes: ['po_id', 'vendor_name'],
          },
          {
            model: GRNLine,
            as: 'Line',
            where: { sku_id: sku_id },
            attributes: ['id', 'qc_pass_qty'],
          },
        ],
      });

      if (!grn) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'GRN not found',
        });
        return;
      }

      const productDetails = {
        'Scanned Product detail': product.dataValues, // Return all product fields from product_master table
        'PO ID': (grn as any).PO?.po_id || '',
        GRN: grn.id,
        'Vendor Name': (grn as any).PO?.vendor_name || '',
        'Available Quantity': (grn as any).Line?.[0]?.qc_pass_qty || 0,
      };

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: productDetails,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching scanned product details:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error',
      });
    }
  }

  // 6. Confirm Putaway (Update quantity and bin location)
  static async confirmPutaway(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sku_id, grn_id, quantity, bin_location, remarks } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          statusCode: 401,
          success: false,
          data: null,
          error: 'User not authenticated',
        });
        return;
      }

      if (!sku_id || !grn_id || !quantity || !bin_location) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'SKU ID, GRN ID, quantity, and bin location are required',
        });
        return;
      }

      // Validate bin location or create if doesn't exist
      let binLocation = await BinLocation.findOne({
        where: { bin_code: bin_location },
      });

      if (!binLocation) {
        // Create new bin location if it doesn't exist
        binLocation = await BinLocation.create({
          bin_code: bin_location,
          zone: 'A1',
          aisle: 'B1', 
          rack: 'R1',
          shelf: 'S1',
          capacity: 100, // Default capacity
          current_quantity: 0,
          status: 'active',
        });
      } else if (binLocation.status !== 'active') {
        // Activate the bin if it's inactive
        await binLocation.update({ status: 'active' });
      }

      // Check bin capacity
      if (binLocation.current_quantity + quantity > binLocation.capacity) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'Bin capacity exceeded',
        });
        return;
      }

      // Get GRN line
      const grnLine = await GRNLine.findOne({
        where: { grn_id: grn_id, sku_id: sku_id },
      });

      if (!grnLine) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'GRN line not found',
        });
        return;
      }

      if (grnLine.qc_pass_qty < quantity) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'Quantity exceeds available QC passed quantity',
        });
        return;
      }

      // Check if SKU is already scanned and placed in a different bin
      const existingSkuScan = await ScannerSku.findOne({
        where: sequelize.literal(`JSON_CONTAINS(sku, JSON_OBJECT('skuId', '${sku_id}'))`),
        order: [['created_at', 'DESC']]
      });

      if (existingSkuScan && existingSkuScan.binLocationScanId !== bin_location) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: `SKU ${sku_id} is already placed in bin ${existingSkuScan.binLocationScanId}. Cannot place in different bin ${bin_location}`,
        });
        return;
      }

      // Check if bin already contains different SKUs
      const existingBinScan = await ScannerBin.findOne({
        where: { binLocationScanId: bin_location }
      });

      if (existingBinScan && existingBinScan.sku && existingBinScan.sku.length > 0) {
        const binSkus = existingBinScan.sku;
        // Check if SKU already exists in this bin
        const skuExists = binSkus.includes(sku_id);
        
        if (!skuExists) {
          res.status(400).json({
            statusCode: 400,
            success: false,
            data: null,
            error: `Bin ${bin_location} already contains different SKUs: ${binSkus.join(', ')}. Cannot place SKU ${sku_id} in this bin`,
          });
          return;
        }
      }

      // Start transaction
      const transaction = await sequelize.transaction();

      try {
        // Create or update putaway task
        const [putawayTask, created] = await PutawayTask.findOrCreate({
          where: {
            grn_id: grn_id,
            grn_line_id: grnLine.id,
            sku_id: sku_id,
          },
          defaults: {
            grn_id: grn_id,
            grn_line_id: grnLine.id,
            sku_id: sku_id,
            quantity: quantity,
            status: 'completed',
            assigned_to: userId,
            bin_location: bin_location,
            scanned_quantity: quantity,
            completed_at: new Date(),
            remarks: remarks,
          },
          transaction,
        });

        if (!created) {
          await putawayTask.update({
            scanned_quantity: putawayTask.scanned_quantity + quantity,
            bin_location: bin_location,
            status: putawayTask.scanned_quantity + quantity >= putawayTask.quantity ? 'completed' : 'in-progress',
            completed_at: putawayTask.scanned_quantity + quantity >= putawayTask.quantity ? new Date() : null,
            remarks: remarks,
          }, { transaction });
        }

        // Update bin location quantity
        await binLocation.update({
          current_quantity: binLocation.current_quantity + quantity,
        }, { transaction });

        // Update scanner_sku table
        await ScannerSku.create({
          skuScanId: `${sku_id}_${Date.now()}`,
          sku: [{ skuId: sku_id, quantity: quantity }],
          binLocationScanId: bin_location,
        }, { transaction });

        // Update scanner_bin table
        const existingBin = await ScannerBin.findOne({
          where: { binLocationScanId: bin_location },
        });

        if (existingBin) {
          const currentSkus = existingBin.sku || [];
          // Check if SKU already exists in this bin
          const skuExists = currentSkus.includes(sku_id);
          
          if (!skuExists) {
            // Add SKU to bin
            currentSkus.push(sku_id);
            await existingBin.update({
              sku: currentSkus,
            }, { transaction });
          }
        } else {
          // Create new bin
          await ScannerBin.create({
            binLocationScanId: bin_location,
            sku: [sku_id],
          }, { transaction });
        }

        // Create audit log
        await PutawayAudit.create({
          putaway_task_id: putawayTask.id,
          user_id: userId,
          action: 'confirm_quantity',
          sku_id: sku_id,
          bin_location: bin_location,
          quantity: quantity,
          reason: remarks,
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
          statusCode: 200,
          success: true,
          data: {
            message: 'Putaway confirmed successfully',
            putaway_task_id: putawayTask.id,
            bin_location: bin_location,
            quantity: quantity,
          },
          error: null,
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error: any) {
      console.error('Error confirming putaway:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error',
      });
    }
  }

  // 7. Get Bin Suggestions
  static async getBinSuggestions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sku_id, category } = req.query;

      if (!sku_id && !category) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'SKU ID or category is required',
        });
        return;
      }

      let whereCondition: any = {
        status: 'active',
      };

      if (sku_id) {
        whereCondition.sku_mapping = {
          [Op.contains]: [sku_id],
        };
      }

      if (category) {
        whereCondition.category_mapping = {
          [Op.contains]: [category],
        };
      }

      const binSuggestions = await BinLocation.findAll({
        where: whereCondition,
        attributes: ['bin_code', 'zone', 'aisle', 'rack', 'shelf', 'capacity', 'current_quantity'],
        order: [
          ['current_quantity', 'ASC'], // Prefer bins with less quantity
          ['zone', 'ASC'],
          ['aisle', 'ASC'],
        ],
        limit: 5,
      });

      const suggestions = binSuggestions.map((bin: any) => ({
        bin_code: bin.bin_code,
        zone: bin.zone,
        aisle: bin.aisle,
        rack: bin.rack,
        shelf: bin.shelf,
        available_capacity: bin.capacity - bin.current_quantity,
        utilization_percentage: Math.round((bin.current_quantity / bin.capacity) * 100),
      }));

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          suggestions,
        },
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching bin suggestions:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error',
      });
    }
  }

  // 8. Get Putaway Tasks by User
  static async getPutawayTasksByUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      if (!userId) {
        res.status(401).json({
          statusCode: 401,
          success: false,
          data: null,
          error: 'User not authenticated',
        });
        return;
      }

      const { count, rows } = await PutawayTask.findAndCountAll({
        where: {
          assigned_to: userId,
          status: {
            [Op.in]: ['pending', 'in-progress'],
          },
        },
        include: [
          {
            model: GRN,
            as: 'GRN',
            include: [
              {
                model: PurchaseOrder,
                as: 'PO',
                attributes: ['po_id', 'vendor_name'],
              },
            ],
          },
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']],
      });

      const tasks = rows.map((task: any) => ({
        task_id: task.id,
        grn_id: task.grn_id,
        sku_id: task.sku_id,
        quantity: task.quantity,
        scanned_quantity: task.scanned_quantity,
        status: task.status,
        bin_location: task.bin_location,
        po_id: task.GRN?.PO?.po_id,
        vendor_name: task.GRN?.PO?.vendor_name,
        created_at: task.created_at,
      }));

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          tasks,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: limit,
          },
        },
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching putaway tasks:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error',
      });
    }
  }

  // Debug endpoint to check database
  static async debugDatabase(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Check total GRNs
      const totalGrns = await GRN.count();
      
      // Check GRNs by status
      const grnsByStatus = await GRN.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
      });

      // Check total GRN lines
      const totalGrnLines = await GRNLine.count();
      
      // Check GRN lines with QC passed quantities
      const grnLinesWithQc = await GRNLine.count({
        where: {
          qc_pass_qty: {
            [Op.gt]: 0,
          },
        },
      });

      // Sample GRN data
      const sampleGrn = await GRN.findOne({
        include: [
          {
            model: PurchaseOrder,
            as: 'PO',
            attributes: ['id', 'po_id'],
          },
        ],
      });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          totalGrns,
          grnsByStatus: grnsByStatus.map((item: any) => ({
            status: item.status,
            count: item.getDataValue('count')
          })),
          totalGrnLines,
          grnLinesWithQc,
          sampleGrn: sampleGrn ? {
            id: sampleGrn.get('id'),
            po_id: sampleGrn.get('po_id'),
            status: sampleGrn.get('status'),
            created_at: sampleGrn.get('created_at'),
            purchaseOrder: (sampleGrn as any).PO
          } : null
        },
        error: null,
      });
    } catch (error: any) {
      console.error('Error in debug endpoint:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error',
      });
    }
  }
}
