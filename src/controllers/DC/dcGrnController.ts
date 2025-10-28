import { Request, Response } from 'express';
import { ResponseHandler } from '../../middleware/responseHandler';
import { DCGrn, DCGrnLine, DCGrnBatch, DCGrnPhoto, DCPurchaseOrder, User, DistributionCenter, DCPOProduct, ProductMaster, DCSkuSplitted } from '../../models';
import { Transaction } from 'sequelize';
import sequelize from '../../config/database';

interface AuthRequest extends Request {
  user?: any;
}

export class DCGrnController {
  /**
   * Calculate line status based on business logic
   * @param orderedQty - Ordered quantity
   * @param rejectedQty - Rejected quantity  
   * @param qcPassQty - QC passed quantity
   * @returns line_status: 'pending' | 'partial' | 'rejected' | 'completed'
   */
  private static calculateLineStatus(orderedQty: number, rejectedQty: number, qcPassQty: number): string {
    // Handle edge case where ordered_qty is 0
    if (orderedQty === 0) {
      return 'pending';
    }
    
    // 1. if "ordered_qty" == "rejected_qty" then "line_status" = rejected
    if (orderedQty === rejectedQty) {
      return 'rejected';
    }
    
    // 2. if "ordered_qty" == "qc_pass_qty" then "line_status" = completed
    if (orderedQty === qcPassQty) {
      return 'completed';
    }
    
    // 3. if "ordered_qty" == "rejected_qty" + "qc_pass_qty" then "line_status" = partial
    if (orderedQty === (rejectedQty + qcPassQty)) {
      return 'partial';
    }
    
    // 4. if "ordered_qty" > "rejected_qty" (but not 0 < ordered_qty) OR "qc_pass_qty" (but not 0 < ordered_qty) then "line_status" = partial
    if ((orderedQty > rejectedQty && rejectedQty > 0) || (qcPassQty > 0 && qcPassQty < orderedQty)) {
      return 'partial';
    }
    
    // 5. if "ordered_qty" > "rejected_qty" == 0 and "qc_pass_qty" == 0 then "line_status" = pending
    if (orderedQty > rejectedQty && rejectedQty === 0 && qcPassQty === 0) {
      return 'pending';
    }
    
    // Default fallback - if none of the above conditions match, return pending
    return 'pending';
  }

  /**
   * Calculate overall GRN status based on line statuses
   * @param lineStatuses - Array of line statuses
   * @returns grn_status: 'pending' | 'partial' | 'completed' | 'rejected'
   */
  private static calculateGrnStatus(lineStatuses: string[]): string {
    if (!lineStatuses || lineStatuses.length === 0) {
      return 'pending';
    }

    // If all lines are completed, GRN is completed
    if (lineStatuses.every(status => status === 'completed')) {
      return 'completed';
    }

    // If all lines are rejected, GRN is rejected
    if (lineStatuses.every(status => status === 'rejected')) {
      return 'rejected';
    }

    // If all lines are pending, GRN is pending
    if (lineStatuses.every(status => status === 'pending')) {
      return 'pending';
    }

    // If there's a mix of statuses (some completed, some pending, etc.), GRN is partial
    return 'partial';
  }

  /**
   * Get DC PO products for GRN creation
   */
  static async getDCPOProductsForGRN(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { dcPoId } = req.params;

      // Get DC PO with products
      const dcPO = await DCPurchaseOrder.findByPk(dcPoId, {
        include: [
          {
            model: DCPOProduct,
            as: 'Products',
            include: [
              {
                model: ProductMaster,
                as: 'Product',
                attributes: ['id', 'catalogue_id', 'name', 'description', 'mrp', 'ean_upc']
              }
            ]
          },
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'email', 'name']
          }
        ]
      });

      if (!dcPO) {
        return ResponseHandler.error(res, 'DC Purchase Order not found', 404);
      }

      if (dcPO.status !== 'APPROVED') {
        return ResponseHandler.error(res, 'DC Purchase Order must be approved to create GRN', 400);
      }

      // Check if GRN already exists
      const existingGrn = await DCGrn.findOne({
        where: { dc_po_id: dcPoId }
      });

      if (existingGrn) {
        return ResponseHandler.error(res, 'GRN already exists for this DC Purchase Order', 400);
      }

      // Format products for GRN creation
      const productsForGRN = (dcPO as any).Products?.map((product: any) => ({
        product_id: product.id,
        sku_id: product.catalogue_id,
        product_name: product.productName,
        ordered_qty: product.quantity,
        unit_price: product.unitPrice,
        total_amount: product.totalAmount,
        mrp: product.mrp,
        cost: product.unitPrice, // Use unitPrice as cost since cost column is removed
        description: product.description,
        notes: product.notes,
        product_details: product.Product
      })) || [];

      return ResponseHandler.success(res, {
        message: 'DC PO products retrieved successfully for GRN creation',
        data: {
          dc_po: {
            id: dcPO.id,
            poId: dcPO.poId,
            status: dcPO.status,
            totalAmount: dcPO.totalAmount,
            description: dcPO.description,
            notes: dcPO.notes,
            createdBy: (dcPO as any).CreatedBy
          },
          products: productsForGRN,
          summary: {
            totalProducts: productsForGRN.length,
            totalQuantity: productsForGRN.reduce((sum, p) => sum + p.ordered_qty, 0),
            totalAmount: dcPO.totalAmount
          }
        }
      });

    } catch (error: any) {
      console.error('Error fetching DC PO products for GRN:', error);
      return ResponseHandler.error(res, error.message || 'Internal Server Error', 500);
    }
  }

  /**
   * Create a new DC-GRN
   */
  static async createDCGrn(req: AuthRequest, res: Response): Promise<Response> {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      const { dc_po_id, lines } = req.body;

      // Validation
      if (!dc_po_id || !lines || !Array.isArray(lines) || lines.length === 0) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'DC PO ID and lines are required', 400);
      }

      // Check if DC PO exists and is approved
      const dcPO = await DCPurchaseOrder.findByPk(dc_po_id, { transaction });
      if (!dcPO) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'DC Purchase Order not found', 404);
      }

      if (dcPO.status !== 'APPROVED') {
        await transaction.rollback();
        return ResponseHandler.error(res, 'DC Purchase Order must be approved to create GRN', 400);
      }

      // Check if GRN already exists for this DC PO
      const existingGrn = await DCGrn.findOne({
        where: { dc_po_id },
        transaction
      });

      if (existingGrn) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'GRN already exists for this DC Purchase Order', 400);
      }

      // Create DC-GRN
      const dcGrn = await DCGrn.create({
        dc_po_id,
        status: 'partial',
        created_by: userId,
        dc_id: dcPO.dcId
      }, { transaction });

      const createdLines = [];

      // Create GRN lines
      for (const line of lines) {
        const {
          sku_id,
          ean,
          ordered_qty,
          received_qty,
          qc_pass_qty = 0,
          qc_fail_qty = 0,
          rejected_qty = 0,
          held_qty = 0,
          rtv_qty = 0,
          variance_reason,
          remarks,
          batches = [],
          photos = []
        } = line;

        // Calculate pending quantity
        const pending_qty = ordered_qty - received_qty;

        const dcGrnLine = await DCGrnLine.create({
          dc_grn_id: dcGrn.id,
          sku_id,
          ean,
          ordered_qty,
          received_qty,
          pending_qty,
          rejected_qty,
          qc_pass_qty,
          qc_fail_qty,
          held_qty,
          rtv_qty,
          line_status: pending_qty === 0 ? 'completed' : pending_qty < ordered_qty ? 'partial' : 'pending',
          putaway_status: 'pending',
          variance_reason,
          remarks
        }, { transaction });

        // Create batches if provided
        if (batches && batches.length > 0) {
          for (const batch of batches) {
            await DCGrnBatch.create({
              dc_grn_line_id: dcGrnLine.id,
              batch_no: batch.batchNo,
              expiry_date: batch.expiry,
              qty: batch.qty
            }, { transaction });
          }
        }

        // Create photos if provided
        if (photos && photos.length > 0) {
          for (const photo of photos) {
            await DCGrnPhoto.create({
              sku_id,
              dc_grn_id: dcGrn.id,
              dc_po_id,
              url: photo.url,
              reason: photo.reason || 'sku-level-photo'
            }, { transaction });
          }
        }

        createdLines.push(dcGrnLine.toJSON());
      }

      await transaction.commit();

      return ResponseHandler.success(res, {
        message: 'DC-GRN created successfully',
        data: {
          grn: dcGrn,
          lines: createdLines
        }
      }, 201);

    } catch (error: any) {
      await transaction.rollback();
      console.error('Error creating DC-GRN:', error);
      return ResponseHandler.error(res, error.message || 'Internal Server Error', 500);
    }
  }

  /**
   * Get DC-GRN by ID with full details
   */
  static async getDCGrnById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

        const dcGrn = await DCGrn.findByPk(id, {
        include: [
          {
            model: DCPurchaseOrder,
            as: 'DCPO',
            attributes: ['id', 'poId', 'vendorId', 'status', 'totalAmount']
          },
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'email', 'name']
          },
          {
            model: User,
            as: 'ApprovedBy',
            attributes: ['id', 'email', 'name']
          },
          {
            model: DistributionCenter,
            as: 'DistributionCenter',
            attributes: ['id', 'name', 'address', 'city', 'state', 'country']
          },
          {
            model: DCGrnLine,
            as: 'Lines',
            include: [
              {
                model: DCGrnBatch,
                as: 'Batches'
              }
            ]
          },
          {
            model: DCGrnPhoto,
            as: 'Photos',
            attributes: ['id', 'sku_id', 'url', 'reason', 'created_at']
          }
        ]
      });

      if (!dcGrn) {
        return ResponseHandler.error(res, 'DC-GRN not found', 404);
      }

      return ResponseHandler.success(res, {
        message: 'DC-GRN retrieved successfully',
        data: dcGrn
      });

    } catch (error: any) {
      console.error('Error fetching DC-GRN:', error);
      return ResponseHandler.error(res, error.message || 'Internal Server Error', 500);
    }
  }

  /**
   * Get DC-GRNs by DC PO ID
   */
  static async getDCGrnsByDCPOId(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { dcPoId } = req.params;

      const dcGrns = await DCGrn.findAll({
        where: { dc_po_id: dcPoId },
        include: [
          {
            model: DCPurchaseOrder,
            as: 'DCPO',
            attributes: ['id', 'poId', 'vendorId', 'status']
          },
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'email', 'name']
          },
          {
            model: User,
            as: 'ApprovedBy',
            attributes: ['id', 'email', 'name']
          },
          {
            model: DCGrnLine,
            as: 'Lines',
            include: [
              {
                model: DCGrnBatch,
                as: 'Batches'
              }
            ]
          },
          {
            model: DCGrnPhoto,
            as: 'Photos',
            attributes: ['id', 'sku_id', 'url', 'reason', 'created_at']
          }
        ],
        order: [
          ['created_at', 'DESC'],
          [{ model: DCGrnLine, as: 'Lines' }, 'id', 'ASC'],
          [
            { model: DCGrnLine, as: 'Lines' },
            { model: DCGrnBatch, as: 'Batches' },
            'id',
            'ASC'
          ],
          [{ model: DCGrnPhoto, as: 'Photos' }, 'created_at', 'DESC']
        ]
      });

      if (!dcGrns || dcGrns.length === 0) {
        return ResponseHandler.error(res, `No DC-GRNs found for DC PO ID ${dcPoId}`, 404);
      }

      return ResponseHandler.success(res, {
        message: 'DC-GRNs retrieved successfully',
        data: dcGrns
      });

    } catch (error: any) {
      console.error('Error fetching DC-GRNs:', error);
      return ResponseHandler.error(res, error.message || 'Internal Server Error', 500);
    }
  }

  /**
   * Update DC-GRN status
   */
  static async updateDCGrnStatus(req: AuthRequest, res: Response): Promise<Response> {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { status, closeReason, approved_by } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'User authentication required', 401);
      }

      const dcGrn = await DCGrn.findByPk(id, { transaction });
      if (!dcGrn) {
        await transaction.rollback();
        return ResponseHandler.error(res, 'DC-GRN not found', 404);
      }

      // Update GRN status
      await dcGrn.update({
        status,
        closeReason,
        approved_by: approved_by || userId
      }, { transaction });

      await transaction.commit();

      return ResponseHandler.success(res, {
        message: 'DC-GRN status updated successfully',
        data: dcGrn
      });

    } catch (error: any) {
      await transaction.rollback();
      console.error('Error updating DC-GRN status:', error);
      return ResponseHandler.error(res, error.message || 'Internal Server Error', 500);
    }
  }

  /**
   * Get products ready for product-master insertion (completed GRNs)
   */
  static async getProductsReadyForProductMaster(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      // Get completed DC-GRNs
      const completedGrns = await DCGrn.findAll({
        where: { status: 'completed' },
        include: [
          {
            model: DCPurchaseOrder,
            as: 'DCPO',
            attributes: ['id', 'poId', 'vendorId', 'totalAmount']
          },
          {
            model: DCGrnLine,
            as: 'Lines',
            where: { line_status: 'completed' },
            include: [
              {
                model: DCGrnBatch,
                as: 'Batches'
              }
            ]
          },
          {
            model: DCGrnPhoto,
            as: 'Photos',
            attributes: ['id', 'sku_id', 'url', 'reason']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Format data for product-master insertion
      const productsReadyForMaster = completedGrns.map(grn => {
        const grnData = grn.toJSON() as any;
        return {
          grn_id: grnData.id,
          dc_po_id: grnData.dc_po_id,
          po_number: grnData.DCPO?.poId,
          vendor_id: grnData.DCPO?.vendorId,
          total_amount: grnData.DCPO?.totalAmount,
          created_at: grnData.created_at,
          products: grnData.Lines?.map((line: any) => ({
            sku_id: line.sku_id,
            ean: line.ean,
            ordered_qty: line.ordered_qty,
            received_qty: line.received_qty,
            qc_pass_qty: line.qc_pass_qty,
            batches: line.Batches?.map((batch: any) => ({
              batch_no: batch.batch_no,
              expiry_date: batch.expiry_date,
              qty: batch.qty
            })) || [],
            photos: grnData.Photos?.filter((photo: any) => photo.sku_id === line.sku_id).map((photo: any) => ({
              url: photo.url,
              reason: photo.reason
            })) || []
          })) || []
        };
      });

      return ResponseHandler.success(res, {
        message: 'Products ready for product-master insertion retrieved successfully',
        data: {
          total_grns: completedGrns.length,
          products: productsReadyForMaster
        }
      });

    } catch (error: any) {
      console.error('Error fetching products ready for product-master:', error);
      return ResponseHandler.error(res, error.message || 'Internal Server Error', 500);
    }
  }

  /**
   * Get DC-GRN statistics
   */
  static async getDCGrnStats(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      const stats = await DCGrn.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const totalGrns = await DCGrn.count();
      const completedGrns = await DCGrn.count({ where: { status: 'completed' } });

      return ResponseHandler.success(res, {
        message: 'DC-GRN statistics retrieved successfully',
        data: {
          total_grns: totalGrns,
          completed_grns: completedGrns,
          status_breakdown: stats
        }
      });

    } catch (error: any) {
      console.error('Error fetching DC-GRN statistics:', error);
      return ResponseHandler.error(res, error.message || 'Internal Server Error', 500);
    }
  }

  /**
   * Get actual DC GRN records (not POs)
   * GET /api/dc/grn/actual?page=1&limit=10
   */
  static async getActualDCGrnList(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Validate pagination parameters
      if (page < 1) {
        return ResponseHandler.error(res, 'Page number must be greater than 0', 400);
      }
      if (limit < 1 || limit > 100) {
        return ResponseHandler.error(res, 'Limit must be between 1 and 100', 400);
      }

      const offset = (page - 1) * limit;

      // Get actual DC GRN records
      const { count, rows: grns } = await DCGrn.findAndCountAll({
        include: [
          {
            model: DCPurchaseOrder,
            as: 'DCPO',
            attributes: ['id', 'poId', 'vendorId', 'status', 'createdAt'],
            include: [
              {
                model: User,
                as: 'CreatedBy',
                attributes: ['id', 'email', 'name']
              }
            ]
          },
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'email', 'name']
          },
          {
            model: DCGrnLine,
            as: 'Lines',
            attributes: [
              'id', 'sku_id', 'ordered_qty', 'received_qty', 'qc_pass_qty',
              'qc_fail_qty', 'rtv_qty', 'held_qty', 'line_status'
            ]
          }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(count / limit);

      const response = {
        grn: grns,
        pagination: {
          page: page,
          limit: limit,
          total: count,
          totalPages: totalPages
        }
      };

      return ResponseHandler.success(res, {
        message: 'Actual DC GRN list retrieved successfully',
        data: response
      });

    } catch (error: any) {
      console.error('Error fetching actual DC GRN list:', error);
      return ResponseHandler.error(res, error.message || 'Internal Server Error', 500);
    }
  }

  /**
   * Get DC GRN list with SKU splits grouped by PO
   * GET /api/dc/grn/list?page=1&limit=10
   */
  static async getDCGrnList(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const statusFilter = req.query.status as string;

      // Validate pagination parameters
      if (page < 1) {
        return ResponseHandler.error(res, 'Page number must be greater than 0', 400);
      }
      if (limit < 1 || limit > 100) {
        return ResponseHandler.error(res, 'Limit must be between 1 and 100', 400);
      }

      // Validate status filter if provided
      const validStatuses = ['DRAFT', 'PENDING_CATEGORY_HEAD', 'PENDING_ADMIN', 'PENDING_CREATOR_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'];
      if (statusFilter && !validStatuses.includes(statusFilter.toUpperCase())) {
        return ResponseHandler.error(res, `Invalid status. Valid statuses: ${validStatuses.join(', ')}`, 400);
      }

      const offset = (page - 1) * limit;

      // Build where clause based on status filter
      let whereClause: any = {};
      if (statusFilter) {
        whereClause.status = statusFilter.toUpperCase();
      } else {
        // Default behavior: Get DC Purchase Orders with APPROVED, REJECTED, or PENDING_CATEGORY_HEAD status
        // PENDING_CATEGORY_HEAD means the PO was approved but then edited
        whereClause.status = ['APPROVED', 'REJECTED', 'PENDING_CATEGORY_HEAD'];
      }

      const { count, rows: purchaseOrders } = await DCPurchaseOrder.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'email', 'name']
          },
          {
            model: DCPOProduct,
            as: 'Products',
            attributes: [
              'id', 'catalogue_id', 'productName', 'quantity', 'unitPrice', 
              'totalAmount', 'mrp', 'cost', 'description', 'hsn', 'ean_upc',
              'weight', 'length', 'height', 'width', 'gst', 'cess', 'image_url',
              'brand_id', 'category_id', 'sku_matrix_on_catelogue_id'
            ]
          },
          {
            model: DCGrn,
            as: 'DCGrns',
            include: [
              {
                model: DCGrnLine,
                as: 'Lines',
                attributes: [
                  'id', 'sku_id', 'ordered_qty', 'received_qty', 'pending_qty',
                  'rejected_qty', 'qc_pass_qty', 'qc_fail_qty', 'rtv_qty', 'held_qty',
                  'line_status', 'variance_reason', 'remarks'
                ]
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      // Transform the data to match the expected GRN format
      const grnList = purchaseOrders.map((po: any) => {
        // Check if GRN exists for this PO
        const hasGrn = po.DCGrns && po.DCGrns.length > 0;
        const grnData = hasGrn ? po.DCGrns[0] : null;
        
        // Process products to get line statuses first
        const processedLines = po.Products?.map((product: any) => {
            // Parse SKU matrix to get actual SKUs
            let skuMatrix: any[] = [];
            try {
              if (product.sku_matrix_on_catelogue_id) {
                skuMatrix = typeof product.sku_matrix_on_catelogue_id === 'string' 
                  ? JSON.parse(product.sku_matrix_on_catelogue_id)
                  : product.sku_matrix_on_catelogue_id;
              }
            } catch (error) {
              console.error('Error parsing SKU matrix:', error);
              skuMatrix = [];
            }

            // Get the first SKU from the matrix (or fallback to catalogue_id)
            const actualSku = skuMatrix.length > 0 ? skuMatrix[0].sku : product.catalogue_id;
            
            // Find corresponding GRN line for this product using the actual SKU
            const grnLine = grnData?.Lines?.find((line: any) => line.sku_id === actualSku);
            
            if (grnLine) {
              // Calculate line status based on business logic
              const calculatedLineStatus = DCGrnController.calculateLineStatus(
                grnLine.ordered_qty,
                grnLine.rejected_qty,
                grnLine.qc_pass_qty
              );
              
              // Use actual GRN line data
              return {
                id: grnLine.id,
                sku_id: grnLine.sku_id,
                ordered_qty: grnLine.ordered_qty,
                received_qty: grnLine.received_qty,
                pending_qty: grnLine.pending_qty,
                rejected_qty: grnLine.rejected_qty,
                qc_pass_qty: grnLine.qc_pass_qty,
                qc_fail_qty: grnLine.qc_fail_qty,
                rtv_qty: grnLine.rtv_qty,
                held_qty: grnLine.held_qty,
                line_status: calculatedLineStatus,
                product_details: {
                  name: product.productName,
                  description: product.description,
                  mrp: product.mrp,
                  ean_upc: product.ean_upc,
                  image_url: product.image_url,
                  weight: product.weight,
                  length: product.length,
                  height: product.height,
                  width: product.width,
                  gst: product.gst,
                  cess: product.cess
                }
              };
            } else {
              // Fall back to PO data if no GRN line exists
              // Calculate line status for fallback case (all quantities are 0 except ordered_qty)
              const calculatedLineStatus = DCGrnController.calculateLineStatus(
                product.quantity, // ordered_qty
                0, // rejected_qty
                0  // qc_pass_qty
              );
              
              return {
                id: product.id,
                sku_id: actualSku,
                ordered_qty: product.quantity,
                received_qty: 0,
                pending_qty: product.quantity,
                rejected_qty: 0,
                qc_pass_qty: 0,
                qc_fail_qty: 0,
                rtv_qty: 0,
                held_qty: 0,
                line_status: calculatedLineStatus,
                product_details: {
                  name: product.productName,
                  description: product.description,
                  mrp: product.mrp,
                  ean_upc: product.ean_upc,
                  image_url: product.image_url,
                  weight: product.weight,
                  length: product.length,
                  height: product.height,
                  width: product.width,
                  gst: product.gst,
                  cess: product.cess
                }
              };
            }
          }) || [];

        // Calculate overall GRN status based on line statuses
        const lineStatuses = processedLines.map((line: any) => line.line_status);
        const calculatedGrnStatus = hasGrn ? DCGrnController.calculateGrnStatus(lineStatuses) : po.status.toLowerCase();
        
        return {
          id: hasGrn ? grnData.id : po.id,
          po_id: po.id,
          status: calculatedGrnStatus,
          closeReason: hasGrn ? grnData.closeReason : (po.status === 'REJECTED' ? po.rejectionReason : null),
          created_by: hasGrn ? grnData.created_by : (po.CreatedBy?.id || null),
          created_at: hasGrn ? grnData.created_at : po.createdAt,
          updated_at: hasGrn ? grnData.updated_at : po.updatedAt,
          PO: {
            id: po.id,
            po_id: po.poId,
            vendor_name: `Vendor-${po.vendorId}`,
            approval_status: po.status.toLowerCase()
          },
          Line: processedLines
        };
      });

      const totalPages = Math.ceil(count / limit);

      const response = {
        grn: grnList,
        pagination: {
          page: page,
          limit: limit,
          total: count,
          totalPages: totalPages
        }
      };

      return ResponseHandler.success(res, {
        message: 'DC GRN list retrieved successfully',
        data: response
      });

    } catch (error: any) {
      console.error('Error fetching DC GRN list:', error);
      return ResponseHandler.error(res, error.message || 'Internal Server Error', 500);
    }
  }
}
