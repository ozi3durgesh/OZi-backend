import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
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

// Helper function to convert product detail keys to camelCase
const convertProductDetailKeys = (productData: any) => {
  return {
    id: productData.id,
    cpId: productData.CPId,
    status: productData.Status,
    modelNum: productData.ModelNum,
    category: productData.Category,
    sku: productData.SKU,
    parentSku: productData.ParentSKU,
    isMps: productData.IS_MPS,
    productName: productData.ProductName,
    description: productData.Description,
    manufacturerDescription: productData.ManufacturerDescription,
    productTaxCode: productData.ProductTaxCode,
    imageUrl: productData.ImageURL,
    mrp: productData.MRP,
    cost: productData.COST,
    eanUpc: productData.EAN_UPC,
    color: productData.Color,
    size: productData.Size,
    brand: productData.Brand,
    weight: productData.Weight,
    length: productData.Length,
    height: productData.Height,
    width: productData.Width,
    accountingSku: productData.AccountingSKU,
    accountingUnit: productData.AccountingUnit,
    spThreshold: productData.SPThreshold,
    inventoryThreshold: productData.InventoryThreshold,
    erpSystemId: productData.ERPSystemId,
    syncTally: productData.SyncTally,
    shelfLife: productData.ShelfLife,
    shelfLifePercentage: productData.ShelfLifePercentage,
    productExpiryInDays: productData.ProductExpiryInDays,
    reverseWeight: productData.ReverseWeight,
    reverseLength: productData.ReverseLength,
    reverseHeight: productData.ReverseHeight,
    reverseWidth: productData.ReverseWidth,
    productTaxRule: productData.ProductTaxRule,
    cess: productData.CESS,
    createdDate: productData.CreatedDate,
    lastUpdatedDate: productData.LastUpdatedDate,
    skuType: productData.SKUType,
    materialType: productData.MaterialType,
  };
};

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

      // Group GRN lines by GRN ID to get unique GRNs with detailed SKU information
      const grnMap = new Map();
      
      allGrnLines.forEach((grnLine: any) => {
        const grnId = grnLine.grn_id;
        const grn = grnLine.Grn;
        
        if (!grnMap.has(grnId)) {
          grnMap.set(grnId, {
            grn: grnId,
            poId: grn?.po_id || 'N/A',
            skuIds: new Set(), // Store individual SKU IDs
            quantity: 0,
            grnDate: grn?.created_at ? grn.created_at.toLocaleDateString() : 'N/A',
            status: grn?.status || 'pending', // Add GRN status
          });
        }
        
        const grnData = grnMap.get(grnId);
        grnData.skuIds.add(grnLine.sku_id);
        grnData.quantity += grnLine.ordered_qty;
      });

      // Convert Map to Array and format the response
      const allPutawayList = Array.from(grnMap.values()).map(grnData => ({
        grn: grnData.grn,
        poId: grnData.poId,
        sku: grnData.skuIds.size, // Count of unique SKUs
        sku_id: Array.from(grnData.skuIds), // Array of SKU IDs
        quantity: grnData.quantity,
        grnDate: grnData.grnDate,
        status: grnData.status, // GRN status
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
          skuId: sku_id,
          grnId: grnLine.grn_id,
          poId: (grnLine as any).Grn?.po_id || 'N/A',
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
              return record.sku.some((item: any) => item.skuId === sku_id);
            } else if (typeof record.sku === 'string') {
              try {
                const parsedSku = JSON.parse(record.sku);
                if (Array.isArray(parsedSku)) {
                  return parsedSku.some((item: any) => item.skuId === sku_id);
                }
              } catch {
                return record.sku === sku_id;
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
        const productCategory = product.Category?.toLowerCase().trim();
        console.log('🔍 Case 2: SKU not found in scanner_sku');
        console.log('📦 Product Category:', productCategory);
  
        // Error Case 1: Product category is missing
        if (!productCategory) {
          binError = 'Product category is missing from product_master table';
          console.log('❌ Error: Product category is missing');
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
            
            console.log('📊 Total active bins found:', allBinsRaw.length);

            // Error Case 2: No active bins found
            if (allBinsRaw.length === 0) {
              binError = 'No active bins found in bin_locations table';
              console.log('❌ Error: No active bins found');
            } else {
              // Log first few bins for debugging
              console.log('📋 Sample bins:', allBinsRaw.slice(0, 3).map((bin: any) => ({
                bin_code: bin.bin_code,
                preferred_product_category: bin.preferred_product_category,
                category_mapping: bin.category_mapping,
                capacity: bin.capacity,
                current_quantity: bin.current_quantity
              })));
              // Priority 1: Find bin with exact preferred_product_category match
              suggestedBin = allBinsRaw.find((bin: any) => {
                if (bin.preferred_product_category) {
                  const preferred = bin.preferred_product_category.toLowerCase().trim();
                  if (preferred === productCategory) {
                    matchType = 'exact_preferred';
                    console.log('✅ Found exact preferred match:', bin.bin_code);
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
                      console.log('✅ Found exact category mapping match:', bin.bin_code);
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
                      console.log('✅ Found partial category mapping match:', bin.bin_code);
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
                  console.log('✅ Found bin with available capacity:', suggestedBin.bin_code);
                }
              }

              // Priority 5: Use first available bin as last resort
              if (!suggestedBin && allBinsRaw.length > 0) {
                suggestedBin = allBinsRaw[0];
                matchType = 'fallback';
                console.log('⚠️ Using fallback bin:', suggestedBin.bin_code);
              }

              // Error Case 3: No suitable bins found
              if (!suggestedBin) {
                binError = `No suitable bins found for product category: ${productCategory}`;
                console.log('❌ Error: No suitable bins found');
              }
            }
          } catch (error: any) {
            // Error Case 4: Database error while searching bins
            binError = `Database error while searching bins: ${error.message || error}`;
            console.log('❌ Database error:', error);
          }
  
          // Validate suggested bin data
          if (suggestedBin && !binError) {
            console.log('🔍 Validating suggested bin:', {
              bin_code: suggestedBin.bin_code,
              capacity: suggestedBin.capacity,
              current_quantity: suggestedBin.current_quantity,
              status: suggestedBin.status
            });
            
            // Check for invalid capacity or quantity data
            if (!suggestedBin.capacity || 
                suggestedBin.current_quantity === undefined || 
                suggestedBin.current_quantity === null ||
                suggestedBin.capacity < 0 ||
                suggestedBin.current_quantity < 0 ||
                suggestedBin.current_quantity > suggestedBin.capacity) {
              binError = 'Suggested bin has invalid capacity or quantity data';
              console.log('❌ Error: Invalid bin data - capacity:', suggestedBin.capacity, 'current_quantity:', suggestedBin.current_quantity);
            } else {
              const availableCapacity = suggestedBin.capacity - suggestedBin.current_quantity;
              const utilizationPercentage = Math.round((suggestedBin.current_quantity / suggestedBin.capacity) * 100);
              
              console.log('✅ Creating binSuggested object with:', {
                availableCapacity,
                utilizationPercentage,
                hasCapacity: availableCapacity > 0,
                matchType
              });
            
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
              
              console.log('✅ binSuggested created successfully:', binSuggested);
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
            poId: (grnLine as any).Grn?.po_id || 'N/A',
            availableQuantity: grnLine.qc_pass_qty,
            scannedProductDetail: convertProductDetailKeys(product.dataValues),
            vendorName: (grnLine as any).Grn?.PO?.vendor_name || '',
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
          skuScannedId: sku_id, // This is what gets stored in scanned_sku table
          grnId: grnLine.grn_id,
          poId: (grnLine as any).Grn?.po_id || 'N/A',
          availableQuantity: grnLine.qc_pass_qty,
          scannedProductDetail: convertProductDetailKeys(product.dataValues),
          vendorName: (grnLine as any).Grn?.PO?.vendor_name || '',
          binLocation: binLocation,
          binSuggested: binSuggested
        },
        error: null,
      });
  
    } catch (error: any) {
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
        scannedProductDetail: convertProductDetailKeys(product.dataValues), // Return all product fields from product_master table
        poId: (grn as any).PO?.po_id || '',
        grn: grn.id,
        vendorName: (grn as any).PO?.vendor_name || '',
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
          error: 'SKU ID, GRN ID, quantity, and bin location are required',
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

      // Start transaction for data consistency
      const transaction = await sequelize.transaction();

      try {
        // Update GRN line - reduce the QC passed quantity (this represents available quantity for putaway)
        await grnLine.update(
          { 
            qc_pass_qty: grnLine.qc_pass_qty - quantity,
            line_status: grnLine.qc_pass_qty - quantity === 0 ? 'completed' : 'partial'
          },
          { transaction }
        );

        // Update bin location current quantity
        await binLocation.update(
          { current_quantity: binLocation.current_quantity + quantity },
          { transaction }
        );

        // Update or create ScannerBin entry
        let scannerBin = await ScannerBin.findOne({
          where: { binLocationScanId: bin_location },
          transaction
        });

        if (scannerBin) {
          // Update existing scanner bin - add SKU if not already present
          const existingSkus = Array.isArray(scannerBin.sku) ? scannerBin.sku : [];
          if (!existingSkus.includes(sku_id)) {
            existingSkus.push(sku_id);
            await scannerBin.update({ sku: existingSkus }, { transaction });
          }
        } else {
          // Create new scanner bin entry
          await ScannerBin.create({
            binLocationScanId: bin_location,
            sku: [sku_id]
          }, { transaction });
        }

        // Update or create ScannerSku entry
        const skuScanId = `${sku_id}_${bin_location}_${Date.now()}`;
        await ScannerSku.create({
          skuScanId: skuScanId,
          sku: [{ skuId: sku_id, quantity: quantity }],
          binLocationScanId: bin_location
        }, { transaction });

        // Commit transaction
        await transaction.commit();

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
            updated_grn_line: {
              qc_pass_qty: grnLine.qc_pass_qty - quantity,
              remaining_qty: grnLine.qc_pass_qty - quantity,
              line_status: grnLine.qc_pass_qty - quantity === 0 ? 'completed' : 'partial'
            },
            updated_bin_location: {
              bin_code: bin_location,
              current_quantity: binLocation.current_quantity + quantity,
              capacity: binLocation.capacity
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
            poId: sampleGrn.get('po_id'),
            status: sampleGrn.get('status'),
            createdAt: sampleGrn.get('created_at'),
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
