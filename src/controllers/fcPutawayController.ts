import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import FCGrn from '../models/FCGrn.model';
import FCGrnLine from '../models/FCGrnLine';
import FCPurchaseOrder from '../models/FCPurchaseOrder';
import ProductMaster from '../models/NewProductMaster';
import BinLocation from '../models/BinLocation';
import ScannerSku from '../models/ScannerSku';
import ScannerBin from '../models/ScannerBin';
import { AuthRequest } from '../types';
import DirectInventoryService from '../services/DirectInventoryService';
import { INVENTORY_OPERATIONS } from '../config/inventoryConstants';

// Helper function to convert product detail keys to camelCase
const convertProductDetailKeys = (productData: any) => {
  return {
    id: productData.id,
    status: productData.status,
    catelogue_id: productData.catelogue_id,
    product_id: productData.product_id,
    sku_id: productData.sku_id,
    color: productData.color,
    age_size: productData.age_size,
    name: productData.name,
    category: productData.category,
    description: productData.description,
    image_url: productData.image_url,
    mrp: productData.mrp,
    avg_cost_to_ozi: productData.avg_cost_to_ozi,
    ean_upc: productData.ean_upc,
    brand_id: productData.brand_id,
    weight: productData.weight,
    length: productData.length,
    height: productData.height,
    width: productData.width,
    inventory_threshold: productData.inventory_threshold,
    gst: productData.gst,
    cess: productData.cess,
    hsn: productData.hsn,
    created_by: productData.created_by,
    created_at: productData.created_at,
    updated_at: productData.updated_at,
  };
};

export class FCPutawayController {
  // 1. Get FCGrn Putaway List with pagination
  static async getGrnPutawayList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const statusFilter = req.query.status as string; // Get status filter from query params

      // Get current FC ID from auth token
      const currentFcId = req.user?.currentFcId;
      if (!currentFcId) {
        res.status(403).json({
          statusCode: 403,
          success: false,
          data: null,
          error: 'No Fulfillment Center selected. Please select a FC first.',
        });
        return;
      }


      // First, get all FCGrn lines with the required line_status (temporarily without FC filtering)
      const allGrnLines = await FCGrnLine.findAll({
        include: [
          {
            model: FCGrn,
            as: 'FCGrn',
            // Temporarily remove FC filtering since fc_id is not populated in existing records
            // where: {
            //   fc_id: currentFcId, // Filter by current FC
            // },
            include: [
              {
                model: FCPurchaseOrder,
                as: 'FCPO',
                attributes: ['id', 'po_id'],
              },
            ],
          },
        ],
        where: {
          putaway_status: statusFilter 
            ? statusFilter 
            : {
                [Op.in]: ['pending', 'partial', 'completed'],
              },
        },
        order: [['created_at', 'DESC']],
      });
      

      // Group FCGrn lines by FCGrn ID to get unique FCGrns with detailed SKU information
      const grnMap = new Map();
      // Track SKU details across all FCGrns for remaining quantity calculation
      const skuPoTracker = new Map(); // Key: "poId-skuId", Value: { orderedQty, totalPutAway, totalRejected }
      
      allGrnLines.forEach((grnLine: any) => {
        const grnId = grnLine.grn_id;
        const grn = grnLine.FCGrn;
        
        
        // Include SKUs that have been processed (received_qty > 0) and have valid line_status
        // This includes: pending, partial, completed statuses
        const isValidSku = grnLine.received_qty > 0;
        
        if (!isValidSku) {
          return; // Skip this SKU
        }
        
        if (!grnMap.has(grnId)) {
          grnMap.set(grnId, {
            grn: grnId,
            grnId: grn?.id || grnId, // Use the actual GRN ID from the database
            poId: grn?.FCPO?.id || grn?.po_id || 'N/A', // Use the actual PO ID instead of po_id string
            skuIds: new Set(), // Store individual SKU IDs
            skuQcDetails: new Map(), // Store QC details for each SKU
            quantity: 0,
            grnDate: grn?.created_at ? grn.created_at.toLocaleDateString() : 'N/A',
            status: 'pending', // Default status, will be updated based on SKU statuses
            hasPartial: false, // Track if any SKU is partial
            hasCompleted: false, // Track if any SKU is completed
            hasPending: false, // Track if any SKU is pending
          });
        }
        
        const grnData = grnMap.get(grnId);
        
        // Only include SKU IDs that have gone through FCGrn create flow
        // and have not been fully rejected or ignored
        grnData.skuIds.add(grnLine.sku_id);
        
        // Store QC details for this SKU
        const orderedQty = grnLine.ordered_qty || 0;
        const receivedQty = grnLine.received_qty || 0;
        const qcPassQty = grnLine.qc_pass_qty || 0;
        const qcRejectedQty = grnLine.rejected_qty || 0;
        
        // Calculate items put away: received - qc_pass (remaining) - rejected
        const itemsPutAway = receivedQty - qcPassQty - qcRejectedQty;
        
        grnData.skuQcDetails.set(grnLine.sku_id, {
          orderedQty: orderedQty,
          receivedQty: receivedQty,
          qcPassQty: qcPassQty,
          qcRejectedQty: qcRejectedQty,
          qcFailedQty: grnLine.qc_fail_qty || 0,
          itemsPutAway: itemsPutAway >= 0 ? itemsPutAway : 0,
          poId: grn?.FCPO?.po_id
        });
        
        // Track across all FCGrns for this PO and SKU
        const poSkuKey = `${grn?.FCPO?.po_id}-${grnLine.sku_id}`;
        if (!skuPoTracker.has(poSkuKey)) {
          skuPoTracker.set(poSkuKey, {
            orderedQty: orderedQty,
            totalPutAway: 0,
            totalRejected: 0
          });
        }
        const tracker = skuPoTracker.get(poSkuKey);
        tracker.totalPutAway += itemsPutAway >= 0 ? itemsPutAway : 0;
        tracker.totalRejected += qcRejectedQty;
        
        // Only add to quantity for pending or partial items
        if (grnLine.putaway_status === 'pending' || grnLine.putaway_status === 'partial') {
          grnData.quantity += grnLine.qc_pass_qty; // Use qc_pass_qty for remaining quantity
        }
        
        // Track status types based on putaway_status
        if (grnLine.putaway_status === 'partial') {
          grnData.hasPartial = true;
        } else if (grnLine.putaway_status === 'completed') {
          grnData.hasCompleted = true;
        } else if (grnLine.putaway_status === 'pending') {
          grnData.hasPending = true;
        }
      });

      // Set the overall status for each FCGrn
      grnMap.forEach((grnData) => {
        if (grnData.hasPartial) {
          grnData.status = 'partial';
        } else if (grnData.hasCompleted && !grnData.hasPending) {
          grnData.status = 'completed';
        } else {
          grnData.status = 'pending';
        }
        delete grnData.hasPartial; // Remove helper properties
        delete grnData.hasCompleted;
        delete grnData.hasPending;
      });

      // Convert Map to Array and fetch product details
      let allPutawayList = await Promise.all(
        Array.from(grnMap.values()).map(async (grnData) => {
          // Fetch product details for all SKUs in this FCGrn
          const skuArray = Array.from(grnData.skuIds) as string[];
          const productDetails = await Promise.all(
            skuArray.map(async (skuId) => {
              const product = await ProductMaster.findOne({
                where: { sku_id: skuId }
              });
              
              const qcDetails = grnData.skuQcDetails.get(skuId) || {
                orderedQty: 0,
                qcPassQty: 0,
                qcRejectedQty: 0,
                qcFailedQty: 0,
                receivedQty: 0,
                itemsPutAway: 0,
                poId: null
              };
              
              // Calculate remaining quantity across all FCGrns for this PO-SKU combination
              const poSkuKey = `${qcDetails.poId}-${skuId}`;
              const tracker = skuPoTracker.get(poSkuKey) || {
                orderedQty: qcDetails.orderedQty,
                totalPutAway: 0,
                totalRejected: 0
              };
              
              // remainingQuantity = orderedQty - (items put away across all FCGrns + rejected across all FCGrns)
              const remainingQuantity = tracker.orderedQty - (tracker.totalPutAway + tracker.totalRejected);
              
              return {
                ...convertProductDetailKeys(product?.dataValues || {}),
                orderedQty: qcDetails.orderedQty,
                qcPassQty: qcDetails.qcPassQty,
                qcRejectedQty: qcDetails.qcRejectedQty,
                qcFailedQty: qcDetails.qcFailedQty,
                receivedQty: qcDetails.receivedQty,
                remainingQuantity: remainingQuantity >= 0 ? remainingQuantity : 0
              };
            })
          );

          return {
            grn: grnData.grn,
            grnId: grnData.grnId, // Add the actual GRN ID
            poId: grnData.poId,
            sku: grnData.skuIds.size, // Count of unique SKUs
            sku_id: skuArray, // Array of SKU IDs
            productDetails: productDetails, // Array of product details with QC info
            quantity: grnData.quantity,
            grnDate: grnData.grnDate,
            status: grnData.status, // FCGrn status
          };
        })
      );

      // Apply status filter to the grouped results if specified
      if (statusFilter) {
        allPutawayList = allPutawayList.filter(item => item.status === statusFilter);
      }

      // Apply pagination to the filtered results
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
      console.error('❌ Error fetching FCGrn putaway list:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message || 'Internal server error',
      });
    }
  }

  // 2. Get Return Putaway List with pagination
  static async getReturnPutawayList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // For return putaway, we'll look for FCGrns with RTV or return status
      const { count, rows } = await FCGrn.findAndCountAll({
        include: [
          {
            model: FCPurchaseOrder,
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

      // Now get the FCGrn lines with RTV or held quantities for each FCGrn
      const returnPutawayList = await Promise.all(
        rows.map(async (grn: any) => {
          const grnLines = await FCGrnLine.findAll({
            where: {
              grn_id: grn.id,
              [Op.or]: [
                { rtv_qty: { [Op.gt]: 0 } },
                { held_qty: { [Op.gt]: 0 } },
              ],
            },
            attributes: ['id', 'sku_id', 'rtv_qty', 'held_qty'],
          });

          // Count unique SKUs for this FCGrn
          const uniqueSkus = new Set(grnLines.map((line: any) => line.sku_id));
          const skuCount = uniqueSkus.size;
          
          const totalRtvQty = grnLines.reduce((sum: number, line: any) => sum + line.rtv_qty, 0);
          const totalHeldQty = grnLines.reduce((sum: number, line: any) => sum + line.held_qty, 0);
          
          return {
            grn: grn.id,
            poId: grn.po_id, // Direct from grns table
            sku: skuCount, // Count of unique SKUs
            rtvQuantity: totalRtvQty,
            heldQuantity: totalHeldQty,
            grnDate: grn.created_at ? grn.created_at.toLocaleDateString() : 'N/A', // Created date from grns table
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

  // 3. Get FCGrn Details by ID
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

      // Get current FC ID from auth token
      const currentFcId = req.user?.currentFcId;
      if (!currentFcId) {
        res.status(403).json({
          statusCode: 403,
          success: false,
          data: null,
          error: 'No Fulfillment Center selected. Please select a FC first.',
        });
        return;
      }

      // Get the FCGrn data from grns table with FC filtering
      // If fc_id is null, allow access (for backward compatibility)
      // If fc_id is set, filter by current FC
      const grn = await FCGrn.findOne({
        where: {
          id: grnId,
          [Op.or]: [
            { fc_id: null }, // Allow GRNs without fc_id (backward compatibility)
            { fc_id: currentFcId } // Allow GRNs with matching fc_id
          ]
        },
      } as any);

      if (!grn) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'FCGrn not found',
        });
        return;
      }

      const grnDetails = {
        grn: grn.id,
        createdOn: grn.created_at ? grn.created_at.toLocaleDateString() : 'N/A',
        poNumber: grn.po_id,
      };

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: grnDetails,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching FCGrn details:', error);
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
          error: 'SKU ID and FCGrn ID are required',
        });
        return;
      }

      // Find product in product_master table
      const product = await ProductMaster.findOne({
        where: { sku_id: sku_id },
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

      // Get current FC ID from auth token
      const currentFcId = req.user?.currentFcId;
      if (!currentFcId) {
        res.status(403).json({
          statusCode: 403,
          success: false,
          data: null,
          error: 'No Fulfillment Center selected. Please select a FC first.',
        });
        return;
      }

      // Check if SKU exists in the specified FCGrn line with QC passed quantity and FC filtering
      const grnLine = await FCGrnLine.findOne({
        where: {
          sku_id: sku_id,
          grn_id: grn_id,
          qc_pass_qty: {
            [Op.gt]: 0,
          },
        },
        include: [
          {
            model: FCGrn,
            as: 'FCGrn',
            where: {
              fc_id: currentFcId, // Filter by current FC
            },
            include: [
              {
                model: FCPurchaseOrder,
                as: 'FCPO',
                attributes: ['po_id'],
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
          error: 'No QC passed quantity found for this SKU in the specified FCGrn',
        });
        return;
      }

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          message: 'SKU scanned successfully',
          skuId: sku_id,
          grnId: grnLine.grn_id,
          poId: (grnLine as any).FCGrn?.po_id || 'N/A',
          availableQuantity: grnLine.qc_pass_qty,
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
      const { sku_id, grn_id, po_id } = req.body;
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

      if (!grn_id || !po_id) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'FCGrn ID and PO ID are required',
        });
        return;
      }
  
      // Resolve SKU from input (could be SKU or EAN)
      let resolvedSku: string;
      let foundBy: 'sku' | 'ean';
      let product: any;
      
      // First, try to find by SKU directly
      product = await ProductMaster.findOne({
        where: { sku_id: sku_id }
      });
      
      if (product) {
        resolvedSku = product.sku_id;
        foundBy = 'sku';
      } else {
        // If not found by SKU, try to find by EAN_UPC
        product = await ProductMaster.findOne({
          where: { ean_upc: sku_id }
        });
        
        if (product) {
          resolvedSku = product.sku_id;
          foundBy = 'ean';
        } else {
          // Neither SKU nor EAN found
          res.status(404).json({
            statusCode: 404,
            success: false,
            data: null,
            error: `Both SKU and EAN not found for: ${sku_id}`,
          });
          return;
        }
      }
  
      // Get current FC ID from auth token
      const currentFcId = req.user?.currentFcId;
      if (!currentFcId) {
        res.status(403).json({
          statusCode: 403,
          success: false,
          data: null,
          error: 'No Fulfillment Center selected. Please select a FC first.',
        });
        return;
      }

      // Check if SKU exists in the specific FCGrn line with QC passed quantity and FC filtering
      // If fc_id is null, allow access (for backward compatibility)
      // If fc_id is set, filter by current FC
      const grnLine = await FCGrnLine.findOne({
        where: {
          sku_id: resolvedSku,
          grn_id: grn_id,
          qc_pass_qty: {
            [Op.gt]: 0,
          },
        },
        include: [
          {
            model: FCGrn,
            as: 'FCGrn',
            where: {
              po_id: po_id,
              [Op.or]: [
                { fc_id: null }, // Allow GRNs without fc_id (backward compatibility)
                { fc_id: currentFcId } // Allow GRNs with matching fc_id
              ]
            } as any,
            include: [
              {
                model: FCPurchaseOrder,
                as: 'FCPO',
                attributes: ['po_id'],
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

      // Validation Case 1: Check if received_qty is 0 and rejected_qty > 0
      if (grnLine.received_qty === 0 && grnLine.rejected_qty > 0) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'Cannot proceed with putaway: received quantity is 0 but rejected quantity is greater than 0',
        });
        return;
      }

      // Validation Case 2: Check if received_qty < rejected_qty and rejected_qty != 0
      if (grnLine.received_qty < grnLine.rejected_qty && grnLine.rejected_qty !== 0) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'Cannot proceed with putaway: received quantity is less than rejected quantity',
        });
        return;
      }
  
      // Case 1: Check if SKU exists in scanner_sku table
      let existingSkuScan: any = null;
      try {
        const allScannerSkus = await ScannerSku.findAll({
          order: [['createdAt', 'DESC']],
          limit: 100,
        });
  
        existingSkuScan = allScannerSkus.find((record: any) => {
          if (record.sku) {
            if (Array.isArray(record.sku)) {
              return record.sku.some((item: any) => item.skuId === resolvedSku);
            } else if (typeof record.sku === 'string') {
              try {
                const parsedSku = JSON.parse(record.sku);
                if (Array.isArray(parsedSku)) {
                  return parsedSku.some((item: any) => item.skuId === resolvedSku);
                }
              } catch {
                return record.sku === resolvedSku;
              }
            }
          }
          return false;
        });
      } catch {
        existingSkuScan = null;
      }
  
      let binLocation: any = null;
      let binSuggested: any = null;
      let binError: string | null = null;
  
      if (existingSkuScan) {
        // Case 1: SKU found in scanner_sku, get bin location details
        const binLocationDetailsRaw = await sequelize.query(`
          SELECT 
            id, bin_id, bin_code, zone, aisle, rack, shelf, 
            capacity, current_quantity, sku_mapping, category_mapping, 
            status, bin_name, bin_type, zone_type, zone_name, 
            bin_dimensions, preferred_product_category, no_of_categories, 
            no_of_sku_uom, no_of_items, bin_capacity, bin_created_by, 
            bin_status, created_at, updated_at
          FROM bin_locations 
          WHERE bin_code = :binCode
        `, {
          replacements: { binCode: existingSkuScan.binLocationScanId },
          type: QueryTypes.SELECT
        });
        
        const binLocationDetails = binLocationDetailsRaw[0] as any;
  
        if (binLocationDetails) {
          const availableCapacity = binLocationDetails.capacity - binLocationDetails.current_quantity;
          const utilizationPercentage = Math.round((binLocationDetails.current_quantity / binLocationDetails.capacity) * 100);
  
          binLocation = {
            binCode: binLocationDetails.bin_code,
            zone: binLocationDetails.zone,
            aisle: binLocationDetails.aisle,
            rack: binLocationDetails.rack,
            shelf: binLocationDetails.shelf,
            capacity: binLocationDetails.capacity,
            currentQuantity: binLocationDetails.current_quantity,
            availableCapacity: availableCapacity,
            utilizationPercentage: utilizationPercentage,
            status: binLocationDetails.status,
            binName: binLocationDetails.bin_name,
            binType: binLocationDetails.bin_type,
            zoneName: binLocationDetails.zone_name,
            binDimensions: binLocationDetails.bin_dimensions,
            preferredProductCategory: binLocationDetails.preferred_product_category,
            categoryMapping: binLocationDetails.category_mapping,
            hasCapacity: availableCapacity > 0,
          };
        } else {
          binError = `Bin location '${existingSkuScan.binLocationScanId}' not found in bin_locations`;
        }
      } else {
        // Case 2: SKU not found in scanner_sku, suggest bin based on category
        const productCategory = product.category?.toLowerCase().trim();
  
        // Error Case 1: Product category is missing
        if (!productCategory) {
          binError = 'Product category is missing from product_master table';
        } else {
          let suggestedBin: any = null;
          let matchType = 'fallback';
          
          try {
            // Get all active bins from bin_locations table using raw query to avoid model issues
            const [allBinsRaw] = await sequelize.query(`
              SELECT 
                id, bin_id, bin_code, zone, aisle, rack, shelf, 
                capacity, current_quantity, sku_mapping, category_mapping, 
                status, bin_name, bin_type, zone_type, zone_name, 
                bin_dimensions, preferred_product_category, no_of_categories, 
                no_of_sku_uom, no_of_items, bin_capacity, bin_created_by, 
                bin_status, created_at, updated_at
              FROM bin_locations 
              WHERE status = 'active' 
              ORDER BY current_quantity ASC, capacity DESC 
              LIMIT 100
            `);
            

            // Error Case 2: No active bins found
            if (allBinsRaw.length === 0) {
              binError = 'No active bins found in bin_locations table';
            } else {
              // Priority 1: Find bin with exact preferred_product_category match
              suggestedBin = allBinsRaw.find((bin: any) => {
                if (bin.preferred_product_category) {
                  const preferred = bin.preferred_product_category.toLowerCase().trim();
                  if (preferred === productCategory) {
                    matchType = 'exact_preferred';
                    return true;
                  }
                }
                return false;
              });

              // Priority 2: Find bin with exact category_mapping match
              if (!suggestedBin) {
                suggestedBin = allBinsRaw.find((bin: any) => {
                  if (bin.category_mapping && Array.isArray(bin.category_mapping)) {
                    const exactMatch = bin.category_mapping.some((cat: string) =>
                      cat.toLowerCase().trim() === productCategory
                    );
                    if (exactMatch) {
                      matchType = 'exact_mapping';
                      return true;
                    }
                  }
                  return false;
                });
              }

              // Priority 3: Find bin with partial category_mapping match
              if (!suggestedBin) {
                suggestedBin = allBinsRaw.find((bin: any) => {
                  if (bin.category_mapping && Array.isArray(bin.category_mapping)) {
                    const partialMatch = bin.category_mapping.some((cat: string) =>
                      cat.toLowerCase().trim().includes(productCategory) ||
                      productCategory.includes(cat.toLowerCase().trim())
                    );
                    if (partialMatch) {
                      matchType = 'partial_mapping';
                      return true;
                    }
                  }
                  return false;
                });
              }

              // Priority 4: Find any bin with available capacity
              if (!suggestedBin) {
                suggestedBin = allBinsRaw.find((bin: any) => {
                  const availableCapacity = bin.capacity - bin.current_quantity;
                  return availableCapacity > 0;
                });
                if (suggestedBin) {
                  matchType = 'available_capacity';
                }
              }

              // Priority 5: Use first available bin as last resort
              if (!suggestedBin && allBinsRaw.length > 0) {
                suggestedBin = allBinsRaw[0];
                matchType = 'fallback';
              }

              // Error Case 3: No suitable bins found
              if (!suggestedBin) {
                binError = `No suitable bins found for product category: ${productCategory}`;
              }
            }
          } catch (error: any) {
            // Error Case 4: Database error while searching bins
            binError = `Database error while searching bins: ${error.message || error}`;
          }
  
          // Validate suggested bin data
          if (suggestedBin && !binError) {
            
            // Check for invalid capacity or quantity data
            if (!suggestedBin.capacity || 
                suggestedBin.current_quantity === undefined || 
                suggestedBin.current_quantity === null ||
                suggestedBin.capacity < 0 ||
                suggestedBin.current_quantity < 0 ||
                suggestedBin.current_quantity > suggestedBin.capacity) {
              binError = 'Suggested bin has invalid capacity or quantity data';
            } else {
              const availableCapacity = suggestedBin.capacity - suggestedBin.current_quantity;
              const utilizationPercentage = Math.round((suggestedBin.current_quantity / suggestedBin.capacity) * 100);
              
            
              binSuggested = {
                binCode: suggestedBin.bin_code,
                zone: suggestedBin.zone,
                aisle: suggestedBin.aisle,
                rack: suggestedBin.rack,
                shelf: suggestedBin.shelf,
                capacity: suggestedBin.capacity,
                currentQuantity: suggestedBin.current_quantity,
                availableCapacity: availableCapacity,
                utilizationPercentage: utilizationPercentage,
                status: suggestedBin.status,
                binName: suggestedBin.bin_name,
                binType: suggestedBin.bin_type,
                zoneName: suggestedBin.zone_name,
                binDimensions: suggestedBin.bin_dimensions,
                preferredProductCategory: suggestedBin.preferred_product_category,
                categoryMapping: suggestedBin.category_mapping,
                hasCapacity: availableCapacity > 0,
                matchType: matchType
              };
              
            }
          }
        }
      }
  
      if (!binLocation && !binSuggested && !binError) {
        binError = 'Unable to determine bin location or suggestion';
      }
  
      if (binError) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: {
            message: 'SKU scanned but bin location error occurred',
            skuId: sku_id,
            grnId: grnLine.grn_id,
            poId: (grnLine as any).FCGrn?.po_id || 'N/A',
            availableQuantity: grnLine.qc_pass_qty,
            scannedProductDetail: convertProductDetailKeys(product.dataValues),
            vendorName: 'N/A', // FCPurchaseOrder doesn't have vendor_name field
            binLocation: null,
            binSuggested: null
          },
          error: binError,
        });
        return;
      }
  
      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          message: 'SKU scanned successfully and stored in scanned_sku table',
          skuId: sku_id,
          resolvedSku: resolvedSku,
          foundBy: foundBy,
          skuScannedId: resolvedSku, // This is what gets stored in scanned_sku table
          grnId: grnLine.grn_id,
          poId: (grnLine as any).FCGrn?.po_id || 'N/A',
          availableQuantity: grnLine.qc_pass_qty,
          scannedProductDetail: convertProductDetailKeys(product.dataValues),
          vendorName: 'N/A', // FCPurchaseOrder doesn't have vendor_name field
          binLocation: binLocation,
          binSuggested: binSuggested
        },
        error: null,
      });
  
    } catch (error: any) {
      console.error('Error in scanSkuProductDetail:', error);
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
          error: 'SKU ID and FCGrn ID are required',
        });
        return;
      }

      // Get product details
      const product = await ProductMaster.findOne({
        where: { sku_id: sku_id },
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

      // Get FCGrn and PO details
      const grn = await FCGrn.findByPk(grn_id, {
        include: [
          {
            model: FCPurchaseOrder,
            as: 'FCPO',
            attributes: ['po_id', 'vendor_name'],
          },
          {
            model: FCGrnLine,
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
          error: 'FCGrn not found',
        });
        return;
      }

      const productDetails = {
        scannedProductDetail: convertProductDetailKeys(product.dataValues), // Return all product fields from product_master table
        poId: (grn as any).FCPO?.po_id || '',
        grn: grn.id,
        vendorName: 'N/A', // FCPurchaseOrder doesn't have vendor_name field
        availableQuantity: (grn as any).Line?.[0]?.qc_pass_qty || 0,
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
          error: 'SKU ID, FCGrn ID, quantity, and bin location are required',
        });
        return;
      }

      // Validate bin location
      const binLocation = await BinLocation.findOne({
        where: { bin_code: bin_location },
      });

      if (!binLocation) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'Invalid bin location',
        });
        return;
      }

      if (binLocation.status !== 'active') {
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

      // Get current FC ID from auth token
      const currentFcId = req.user?.currentFcId;
      if (!currentFcId) {
        res.status(403).json({
          statusCode: 403,
          success: false,
          data: null,
          error: 'No Fulfillment Center selected. Please select a FC first.',
        });
        return;
      }

      // Get FCGrn line with FC filtering
      // If fc_id is null, allow access (for backward compatibility)
      // If fc_id is set, filter by current FC
      const grnLine = await FCGrnLine.findOne({
        where: { grn_id: grn_id, sku_id: sku_id },
        include: [
          {
            model: FCGrn,
            as: 'FCGrn',
            where: {
              [Op.or]: [
                { fc_id: null }, // Allow GRNs without fc_id (backward compatibility)
                { fc_id: currentFcId } // Allow GRNs with matching fc_id
              ]
            } as any,
          },
        ],
      });

      if (!grnLine) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'FCGrn line not found',
        });
        return;
      }

      // Validation: Check if received_qty > 0
      if (grnLine.received_qty <= 0) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'Cannot proceed with putaway: received quantity must be greater than 0',
        });
        return;
      }

      // Validation: Check if quantity <= received_qty
      if (quantity > grnLine.received_qty) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: `Quantity exceeds received quantity. Received: ${grnLine.received_qty}, Requested: ${quantity}`,
        });
        return;
      }

      if (quantity > grnLine.qc_pass_qty) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: `Quantity exceeds available QC passed quantity. Available: ${grnLine.qc_pass_qty}, Requested: ${quantity}`,
        });
        return;
      }

      // Start transaction for data consistency
      const transaction = await sequelize.transaction();

      try {
        // Calculate new remaining quantity
        const newRemainingQty = grnLine.qc_pass_qty - quantity;
        
        // Determine status based on remaining quantity
        let putawayStatus: string;
        if (newRemainingQty <= 0) {
          putawayStatus = 'completed';
        } else {
          putawayStatus = 'partial';
        }

        // Update FCGrn line - reduce the QC passed quantity (this represents available quantity for putaway)
        await grnLine.update(
          { 
            qc_pass_qty: newRemainingQty,
            putaway_status: putawayStatus
          },
          { transaction }
        );

        // Update bin location current quantity
        await binLocation.update(
          { current_quantity: binLocation.current_quantity + quantity },
          { transaction }
        );

        // Update or create ScannerBin entry - use atomic approach
        try {
          // Use a more reliable approach: find first, then update or create
          const existingBin = await ScannerBin.findOne({
            where: { binLocationScanId: bin_location },
            transaction
          });

          if (existingBin) {
            // Update existing record - add SKU if not already present
            const existingSkus = Array.isArray(existingBin.sku) ? [...existingBin.sku] : [];
            console.log(`📦 Existing SKUs in bin ${bin_location}:`, existingSkus);
            
            if (!existingSkus.includes(sku_id)) {
              existingSkus.push(sku_id);
              console.log(`📦 Adding SKU ${sku_id} to bin ${bin_location}. New SKU list:`, existingSkus);
              await existingBin.update({ sku: existingSkus }, { transaction });
            } else {
              console.log(`📦 SKU ${sku_id} already exists in bin ${bin_location}`);
            }
          } else {
            // Create new record if none exists
            console.log(`📦 Creating new bin record for ${bin_location} with SKU ${sku_id}`);
            await ScannerBin.create({
              binLocationScanId: bin_location,
              sku: [sku_id],
              fc_id: currentFcId
            }, { transaction });
          }
        } catch (scannerBinError: any) {
          console.error(`❌ ScannerBin error for bin ${bin_location}:`, scannerBinError.message);
          
          // If it's a unique constraint error, try to find and update the existing record
          if (scannerBinError.name === 'SequelizeUniqueConstraintError' || scannerBinError.code === 'ER_DUP_ENTRY') {
            console.log(`🔄 Unique constraint violation detected, finding existing record for ${bin_location}`);
            
            // Try to find the existing record again
            const existingBin = await ScannerBin.findOne({
              where: { binLocationScanId: bin_location },
              transaction
            });
            
            if (existingBin) {
              const existingSkus = Array.isArray(existingBin.sku) ? [...existingBin.sku] : [];
              if (!existingSkus.includes(sku_id)) {
                existingSkus.push(sku_id);
                console.log(`📦 Adding SKU ${sku_id} to existing bin ${bin_location}. New SKU list:`, existingSkus);
                await existingBin.update({ sku: existingSkus }, { transaction });
              } else {
                console.log(`📦 SKU ${sku_id} already exists in existing bin ${bin_location}`);
              }
            } else {
              throw new Error(`Failed to find existing ScannerBin record for ${bin_location}`);
            }
          } else {
            throw scannerBinError;
          }
        }

        // Update or create ScannerSku entry
        // Use the actual SKU as the skuScanId instead of complex format
        const skuScanId = sku_id;
        
        // Check if ScannerSku entry already exists
        let scannerSku = await ScannerSku.findOne({
          where: { skuScanId: skuScanId },
          transaction
        });

        if (scannerSku) {
          // Update existing ScannerSku entry - add to existing quantity
          const existingSkus = Array.isArray(scannerSku.sku) ? scannerSku.sku : [];
          const existingSkuIndex = existingSkus.findIndex((item: any) => item.skuId === sku_id);
          
          if (existingSkuIndex >= 0) {
            // Update existing SKU quantity
            existingSkus[existingSkuIndex].quantity += quantity;
          } else {
            // Add new SKU to the list
            existingSkus.push({ skuId: sku_id, quantity: quantity });
          }
          
          await scannerSku.update({
            sku: existingSkus,
            binLocationScanId: bin_location
          }, { transaction });
        } else {
          // Create new ScannerSku entry
          await ScannerSku.create({
            skuScanId: skuScanId,
            sku: [{ skuId: sku_id, quantity: quantity }],
            binLocationScanId: bin_location,
            fc_id: currentFcId
          }, { transaction });
        }

        // Commit transaction
        await transaction.commit();

        // Update inventory for putaway operation
        let inventoryUpdateResult: {
          success: boolean;
          message: string;
          data?: any;
        } | null = null;
        try {
          inventoryUpdateResult = await DirectInventoryService.updateInventory({
            sku: sku_id,
            operation: INVENTORY_OPERATIONS.PUTAWAY,
            quantity: quantity,
            referenceId: `PUTAWAY-FCGrn-${grn_id}`,
            operationDetails: {
              grnId: grn_id,
              skuId: sku_id,
              quantity: quantity,
              binLocation: bin_location,
              remarks: remarks || 'Putaway completed',
              putawayStatus: putawayStatus
            },
            performedBy: userId
          });

          if (inventoryUpdateResult.success) {
            console.log(`✅ Inventory updated for putaway SKU ${sku_id}: +${quantity} units`);
          } else {
            console.error(`❌ Inventory update failed for putaway SKU ${sku_id}: ${inventoryUpdateResult.message}`);
          }
        } catch (inventoryError: any) {
          console.error(`❌ Inventory update error for putaway SKU ${sku_id}:`, inventoryError.message);
          inventoryUpdateResult = {
            success: false,
            message: inventoryError.message
          };
        }

        // Return success response
        res.status(200).json({
          statusCode: 200,
          success: true,
          data: {
            message: 'Putaway confirmed successfully',
            sku_id,
            grn_id,
            quantity,
            bin_location,
            remarks,
            status: putawayStatus, // Overall status based on remaining quantity
            updated_grn_line: {
              qc_pass_qty: newRemainingQty,
              remaining_qty: newRemainingQty, // Remaining quantity for this SKU
              putaway_status: putawayStatus
            },
            updated_bin_location: {
              bin_code: bin_location,
              current_quantity: binLocation.current_quantity + quantity,
              capacity: binLocation.capacity
            },
            inventoryUpdate: {
              success: inventoryUpdateResult?.success || false,
              message: inventoryUpdateResult?.message || 'Inventory update not attempted',
              operation: 'putaway',
              quantity: quantity,
              sku: sku_id
            }
          },
          error: null,
        });

      } catch (transactionError) {
        // Rollback transaction on error
        await transaction.rollback();
        throw transactionError;
      }

    } catch (error: any) {
      console.error('Error confirming putaway:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Internal server error';
      let statusCode = 500;
      
      if (error.name === 'SequelizeValidationError') {
        errorMessage = 'Validation error: ' + error.errors.map((e: any) => e.message).join(', ');
        statusCode = 400;
      } else if (error.name === 'SequelizeForeignKeyConstraintError') {
        errorMessage = 'Foreign key constraint error: Invalid reference';
        statusCode = 400;
      } else if (error.name === 'SequelizeUniqueConstraintError') {
        errorMessage = 'Unique constraint error: Duplicate entry';
        statusCode = 400;
      } else if (error.message && error.message.includes('transaction')) {
        errorMessage = 'Database transaction error';
        statusCode = 500;
      }
      
      res.status(statusCode).json({
        statusCode,
        success: false,
        data: null,
        error: errorMessage,
      });
    }
  }

  // Debug endpoint to check database
  static async debugDatabase(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 Debug: Starting database check...');
      
      // Check user context
      const currentFcId = req.user?.currentFcId;
      console.log('🔍 Debug: Current FC ID:', currentFcId);
      
      // Check total FCGrns
      const totalGrns = await FCGrn.count();
      console.log('🔍 Debug: Total FCGrns:', totalGrns);
      
      // Check FCGrns with fc_id
      const grnsWithFcId = await FCGrn.count({
        where: {
          fc_id: {
            [Op.ne]: null as any
          }
        }
      });
      console.log('🔍 Debug: FCGrns with fc_id:', grnsWithFcId);
      
      // Check FCGrns by status
      const grnsByStatus = await FCGrn.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
      });

      // Check total FCGrn lines
      const totalGrnLines = await FCGrnLine.count();
      console.log('🔍 Debug: Total FCGrn lines:', totalGrnLines);
      
      // Check FCGrn lines with QC passed quantities
      const grnLinesWithQc = await FCGrnLine.count({
        where: {
          qc_pass_qty: {
            [Op.gt]: 0,
          },
        },
      });

      // Sample FCGrn data
      const sampleGrn = await FCGrn.findOne({
        include: [
          {
            model: FCPurchaseOrder,
            as: 'FCPO',
            attributes: ['id', 'po_id'],
          },
        ],
      });

      // Test FC filtering
      let fcFilteredGrns = 0;
      if (currentFcId) {
        fcFilteredGrns = await FCGrn.count({
          where: {
            fc_id: currentFcId
          }
        });
        console.log('🔍 Debug: FC filtered GRNs:', fcFilteredGrns);
      }

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          userContext: {
            currentFcId,
            availableFcs: (req.user as any)?.availableFcs
          },
          totalGrns,
          grnsWithFcId,
          fcFilteredGrns,
          grnsByStatus: grnsByStatus.map((item: any) => ({
            status: item.status,
            count: item.getDataValue('count')
          })),
          totalGrnLines,
          grnLinesWithQc,
          sampleGrn: sampleGrn ? {
            id: sampleGrn.get('id'),
            poId: sampleGrn.get('po_id'),
            status: sampleGrn.get('status'),
            fcId: sampleGrn.get('fc_id'),
            createdAt: sampleGrn.get('created_at'),
            purchaseOrder: (sampleGrn as any).FCPO
          } : null
        },
        error: null,
      });
    } catch (error: any) {
      console.error('❌ Error in debug endpoint:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message || 'Internal server error',
      });
    }
  }
}
