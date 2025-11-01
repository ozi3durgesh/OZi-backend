import { Request, Response } from 'express';
import { ResponseHandler } from '../../middleware/responseHandler';
import { DCGrn, DCGrnLine, DCGrnBatch, DCGrnPhoto, DCPurchaseOrder, User, DistributionCenter, DCPOSkuMatrix, ProductMaster, DCSkuSplitted } from '../../models';
import { Transaction } from 'sequelize';
import sequelize from '../../config/database';
import { DCPOService } from '../../services/DC/dcPOService';

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

      // Get DC PO with SKU matrix
      const dcPO = await DCPurchaseOrder.findByPk(dcPoId, {
        include: [
          {
            model: DCPOSkuMatrix,
            as: 'SkuMatrix',
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

      // Group SKU matrix by catalogue_id and format for GRN creation
      const skuMatrix = (dcPO as any).SkuMatrix || [];
      const groupedByCatalogue: any = {};
      
      skuMatrix.forEach((sku: any) => {
        const catId = sku.catalogue_id;
        if (!groupedByCatalogue[catId]) {
          groupedByCatalogue[catId] = {
            product_id: sku.id,
            sku_id: catId,
            product_name: sku.product_name || 'Unknown',
            ordered_qty: 0,
            unit_price: parseFloat(sku.rlp || sku.selling_price || '0'),
            total_amount: 0,
            mrp: parseFloat(sku.mrp || '0'),
            cost: parseFloat(sku.rlp || sku.selling_price || '0'),
            description: sku.description,
            notes: null,
            product_details: null
          };
        }
        const qty = parseInt(sku.quantity?.toString() || '0');
        groupedByCatalogue[catId].ordered_qty += qty;
        groupedByCatalogue[catId].total_amount += qty * parseFloat(sku.rlp || sku.selling_price || '0');
      });

      const productsForGRN = Object.values(groupedByCatalogue);

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
            totalQuantity: productsForGRN.reduce((sum: number, p: any) => sum + p.ordered_qty, 0),
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
      const validPOStatuses = ['DRAFT', 'PENDING_CATEGORY_HEAD', 'PENDING_ADMIN', 'PENDING_CREATOR_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'];
      const validGRNStatuses = ['partial', 'completed', 'closed', 'pending-qc', 'variance-review', 'rtv-initiated', 'pending', 'rejected', 'approved'];
      
      if (statusFilter) {
        const isPOStatus = validPOStatuses.includes(statusFilter.toUpperCase());
        const isGRNStatus = validGRNStatuses.includes(statusFilter.toLowerCase());
        
        if (!isPOStatus && !isGRNStatus) {
          return ResponseHandler.error(res, `Invalid status. Valid PO statuses: ${validPOStatuses.join(', ')}. Valid GRN statuses: ${validGRNStatuses.join(', ')}`, 400);
        }
      }

      const offset = (page - 1) * limit;

      // Build where clause based on status filter
      let whereClause: any = {};
      let grnWhereClause: any = {};
      
      if (statusFilter) {
        const isPOStatus = validPOStatuses.includes(statusFilter.toUpperCase());
        const isGRNStatus = validGRNStatuses.includes(statusFilter.toLowerCase());
        
        if (isPOStatus && statusFilter.toUpperCase() !== 'APPROVED') {
          // Filter by PO status (except APPROVED which should be treated as GRN status)
          whereClause.status = statusFilter.toUpperCase();
        } else if (isGRNStatus || statusFilter.toLowerCase() === 'approved') {
          // Filter by GRN status - keep PO filter as default but add GRN filter
          whereClause.status = ['APPROVED', 'REJECTED', 'PENDING_CATEGORY_HEAD'];
          grnWhereClause.status = statusFilter.toLowerCase();
        }
      } else {
        // Default behavior: Get DC Purchase Orders with APPROVED, REJECTED, or PENDING_CATEGORY_HEAD status
        // PENDING_CATEGORY_HEAD means the PO was approved but then edited
        whereClause.status = ['APPROVED', 'REJECTED', 'PENDING_CATEGORY_HEAD'];
      }

      // Only include edited POs
      whereClause.isEdited = true;

      // If filtering by GRN status, we need to handle counting differently
      let count: number;
      let purchaseOrders: any[];
      
      if (Object.keys(grnWhereClause).length > 0) {
        // When filtering by GRN status, get all POs first, then filter by calculated GRN status
        const allPOs = await DCPurchaseOrder.findAll({
          where: whereClause,
          include: [
            {
              model: User,
              as: 'CreatedBy',
              attributes: ['id', 'email', 'name']
            },
            {
              model: DCPOSkuMatrix,
              as: 'SkuMatrix',
              attributes: [
                'id', 'dcPOId', 'quantity', 'catalogue_id', 'category', 'sku', 'product_name', 
                'description', 'hsn', 'image_url', 'mrp', 'ean_upc', 'color', 'size', 
                'brand', 'weight', 'length', 'height', 'width', 'inventory_threshold', 
                'gst', 'cess', 'rlp', 'rlp_w_o_tax', 'gstType', 'selling_price', 'margin'
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
          order: [['createdAt', 'DESC']]
        });
        
        // Filter by calculated GRN status after processing
        const filteredPOs = allPOs.filter((po: any) => {
          const hasGrn = po.DCGrns && po.DCGrns.length > 0;
          
          // If no GRN exists, check if the PO status matches the GRN status filter
          if (!hasGrn) {
            // For rejected status, check if PO is rejected
            if (grnWhereClause.status === 'rejected' && po.status === 'REJECTED') {
              return true;
            }
            return false;
          }
          
          // Aggregate all GRN lines across all GRNs for each SKU
          const processedLines = (po.SkuMatrix || []).map((sku: any) => {
            const actualSku = sku.sku || sku.catalogue_id;
            const orderedQty = parseInt(sku.quantity?.toString() || '0');
            const allLines = (po.DCGrns || [])
              .flatMap((g: any) => (g.Lines || []))
              .filter((line: any) => line.sku_id === actualSku);

            if (allLines.length > 0) {
              const totals = allLines.reduce((acc: any, l: any) => {
                acc.ordered += l.ordered_qty || 0;
                acc.received += l.received_qty || 0;
                acc.qcPass += l.qc_pass_qty || 0;
                acc.rejected += l.rejected_qty || 0;
                return acc;
              }, { ordered: 0, received: 0, qcPass: 0, rejected: 0 });

              // Normalize to PO-ordered quantity and cap rejected so it shrinks as qcPass grows
              const totalOrdered = orderedQty;
              const totalQCPass = totals.qcPass;
              const effectiveRejected = Math.max(0, Math.min(totals.rejected, totalOrdered - totalQCPass));

              return DCGrnController.calculateLineStatus(
                totalOrdered,
                effectiveRejected,
                totalQCPass
              );
            }

            return DCGrnController.calculateLineStatus(orderedQty, 0, 0);
          });
          
          const calculatedGrnStatus = DCGrnController.calculateGrnStatus(processedLines);
          // Treat "approved" as equivalent to "completed"
          const statusToMatch = grnWhereClause.status === 'approved' ? 'completed' : grnWhereClause.status;
          return calculatedGrnStatus === statusToMatch;
        });
        
        count = filteredPOs.length;
        // Transform SkuMatrix to Products format for filtered POs
        const filteredPOsWithProducts = filteredPOs.map((po: any) => {
          const poData = po.toJSON ? po.toJSON() : po;
          if (poData.SkuMatrix && poData.SkuMatrix.length > 0) {
            poData.Products = DCPOService.transformSkuMatrixToProducts(poData.SkuMatrix);
          } else {
            poData.Products = [];
          }
          return poData;
        });
        purchaseOrders = filteredPOsWithProducts.slice(offset, offset + limit);
      } else {
        // Normal case - filter by PO status
        const result = await DCPurchaseOrder.findAndCountAll({
          where: whereClause,
          include: [
            {
              model: User,
              as: 'CreatedBy',
              attributes: ['id', 'email', 'name']
            },
            {
              model: DCPOSkuMatrix,
              as: 'SkuMatrix',
              attributes: [
                'id', 'dcPOId', 'quantity', 'catalogue_id', 'category', 'sku', 'product_name', 
                'description', 'hsn', 'image_url', 'mrp', 'ean_upc', 'color', 'size', 
                'brand', 'weight', 'length', 'height', 'width', 'inventory_threshold', 
                'gst', 'cess', 'rlp', 'rlp_w_o_tax', 'gstType', 'selling_price', 'margin'
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
        
        count = result.count;
        purchaseOrders = result.rows;
      }

      // Transform SkuMatrix to Products format for all POs
      const purchaseOrdersWithProducts = purchaseOrders.map((po: any) => {
        const poData = po.toJSON ? po.toJSON() : po;
        if (poData.SkuMatrix && poData.SkuMatrix.length > 0) {
          poData.Products = DCPOService.transformSkuMatrixToProducts(poData.SkuMatrix);
        } else {
          poData.Products = [];
        }
        return poData;
      });

      // Transform the data to match the expected GRN format
      const grnList = purchaseOrdersWithProducts.map((po: any) => {
        // Check if GRN exists for this PO
        const hasGrn = po.DCGrns && po.DCGrns.length > 0;
        const allGrns = hasGrn ? po.DCGrns : [];
        const latestGrn = hasGrn ? [...allGrns].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] : null;
        
        // Build a map of sku -> DCPOSkuMatrix for this PO
        const skuMatrixMap = new Map<string, any>();
        if (po.SkuMatrix && Array.isArray(po.SkuMatrix)) {
          po.SkuMatrix.forEach((skuMatrix: any) => {
            const sku = skuMatrix.sku || skuMatrix.catalogue_id;
            if (sku) {
              skuMatrixMap.set(sku, skuMatrix);
            }
          });
        }
        
        // Helper function to get product_details from DCPOSkuMatrix
        const getProductDetails = (sku: string) => {
          const skuMatrix = skuMatrixMap.get(sku);
          if (!skuMatrix) {
            return null;
          }
          
          return {
            dcPOId: skuMatrix.dcPOId,
            quantity: skuMatrix.quantity,
            catalogue_id: skuMatrix.catalogue_id,
            category_id: skuMatrix.category,
            sku: skuMatrix.sku,
            name: skuMatrix.product_name,
            description: skuMatrix.description,
            hsn: skuMatrix.hsn,
            image_url: skuMatrix.image_url,
            mrp: skuMatrix.mrp ? parseFloat(skuMatrix.mrp) : null,
            ean_upc: skuMatrix.ean_upc,
            color: skuMatrix.color,
            size: skuMatrix.size,
            brand_id: skuMatrix.brand,
            weight: skuMatrix.weight,
            length: skuMatrix.length,
            height: skuMatrix.height,
            width: skuMatrix.width,
            inventory_threshold: skuMatrix.inventory_threshold,
            gst: skuMatrix.gst,
            cess: skuMatrix.cess,
            createdAt: skuMatrix.createdAt,
            updatedAt: skuMatrix.updatedAt,
            rlp: skuMatrix.rlp,
            rlp_w_o_tax: skuMatrix.rlp_w_o_tax,
            gstType: skuMatrix.gstType,
            selling_price: skuMatrix.selling_price,
            margin: skuMatrix.margin
          };
        };
        
        // Process products to get line statuses per individual SKU (no grouping by catalogue)
        const processedLines = (po.Products || []).flatMap((product: any) => {
          // Normalize sku matrix array
          let skuMatrix: any[] = [];
          try {
            if (product.sku_matrix_on_catelogue_id) {
              skuMatrix = Array.isArray(product.sku_matrix_on_catelogue_id)
                ? product.sku_matrix_on_catelogue_id
                : JSON.parse(product.sku_matrix_on_catelogue_id);
            }
          } catch (error) {
            console.error('Error parsing SKU matrix:', error);
            skuMatrix = [];
          }

          // If no matrix, fall back to one line using catalogue_id
          if (!skuMatrix || skuMatrix.length === 0) {
            const fallbackSku = product.catalogue_id;
            const orderedQty = product.quantity || product.ordered_qty || 0;
            const lines = allGrns.flatMap((g: any) => (g.Lines || [])).filter((l: any) => l.sku_id === fallbackSku);
            const productDetails = getProductDetails(fallbackSku);
            
            if (lines.length > 0) {
              const totals = lines.reduce((acc: any, l: any) => {
                acc.received += l.received_qty || 0;
                acc.qcPass += l.qc_pass_qty || 0;
                acc.rejected += l.rejected_qty || 0;
                acc.qcFail += l.qc_fail_qty || 0;
                acc.rtv += l.rtv_qty || 0;
                acc.held += l.held_qty || 0;
                return acc;
              }, { received: 0, qcPass: 0, rejected: 0, qcFail: 0, rtv: 0, held: 0 });

              const totalOrdered = parseInt((product.quantity ?? 0).toString()) || 0;
              const effectiveRejected = Math.max(0, Math.min(totals.rejected, totalOrdered - totals.qcPass));
              const pendingQty = Math.max(0, totalOrdered - totals.received);
              const calculatedLineStatus = DCGrnController.calculateLineStatus(totalOrdered, effectiveRejected, totals.qcPass);

              return [{
                id: product.id,
                sku_id: fallbackSku,
                ordered_qty: totalOrdered,
                received_qty: totals.received,
                pending_qty: pendingQty,
                rejected_qty: effectiveRejected,
                qc_pass_qty: totals.qcPass,
                qc_fail_qty: totals.qcFail,
                rtv_qty: totals.rtv,
                held_qty: totals.held,
                line_status: calculatedLineStatus,
                product_details: productDetails || {
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
                  cess: product.cess,
                  hsn: product.hsn,
                  catalogue_id: product.catalogue_id,
                  category_id: product.category_id,
                  brand_id: product.brand_id,
                  inventory_threshold: product.inventory_threshold,
                  created_at: product.createdAt,
                  updated_at: product.updatedAt
                }
              }];
            }
            const calculatedLineStatus = DCGrnController.calculateLineStatus(product.quantity, 0, 0);
            return [{
              id: product.id,
              sku_id: fallbackSku,
              ordered_qty: product.quantity,
              received_qty: 0,
              pending_qty: product.quantity,
              rejected_qty: 0,
              qc_pass_qty: 0,
              qc_fail_qty: 0,
              rtv_qty: 0,
              held_qty: 0,
              line_status: calculatedLineStatus,
              product_details: productDetails || {
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
                cess: product.cess,
                hsn: product.hsn,
                catalogue_id: product.catalogue_id,
                category_id: product.category_id,
                brand_id: product.brand_id,
                inventory_threshold: product.inventory_threshold,
                created_at: product.createdAt,
                updated_at: product.updatedAt
              }
            }];
          }

          // Expand each SKU entry into its own line
          return skuMatrix.map((entry: any) => {
            const actualSku = entry.sku || product.catalogue_id;
            const entryOrderedQty = parseInt(entry.quantity?.toString() || '0');
            const lines = allGrns.flatMap((g: any) => (g.Lines || [])).filter((l: any) => l.sku_id === actualSku);
            const productDetails = getProductDetails(actualSku);

            if (lines.length > 0) {
              const totals = lines.reduce((acc: any, l: any) => {
                acc.received += l.received_qty || 0;
                acc.qcPass += l.qc_pass_qty || 0;
                acc.rejected += l.rejected_qty || 0;
                acc.qcFail += l.qc_fail_qty || 0;
                acc.rtv += l.rtv_qty || 0;
                acc.held += l.held_qty || 0;
                return acc;
              }, { received: 0, qcPass: 0, rejected: 0, qcFail: 0, rtv: 0, held: 0 });

              const totalOrdered = entryOrderedQty;
              const effectiveRejected = Math.max(0, Math.min(totals.rejected, totalOrdered - totals.qcPass));
              const pendingQty = Math.max(0, totalOrdered - totals.received);
              const calculatedLineStatus = DCGrnController.calculateLineStatus(totalOrdered, effectiveRejected, totals.qcPass);

              return {
                id: entry.id || product.id,
                sku_id: actualSku,
                ordered_qty: totalOrdered,
                received_qty: totals.received,
                pending_qty: pendingQty,
                rejected_qty: effectiveRejected,
                qc_pass_qty: totals.qcPass,
                qc_fail_qty: totals.qcFail,
                rtv_qty: totals.rtv,
                held_qty: totals.held,
                line_status: calculatedLineStatus,
                product_details: productDetails || {
                  name: entry.product_name || product.productName,
                  description: entry.description ?? product.description,
                  mrp: entry.mrp ? parseFloat(entry.mrp) : product.mrp,
                  ean_upc: entry.ean_upc ?? product.ean_upc,
                  image_url: entry.image_url ?? product.image_url,
                  weight: entry.weight ?? product.weight,
                  length: entry.length ?? product.length,
                  height: entry.height ?? product.height,
                  width: entry.width ?? product.width,
                  gst: entry.gst ?? product.gst,
                  cess: entry.cess ?? product.cess,
                  hsn: entry.hsn ?? product.hsn,
                  catalogue_id: entry.catalogue_id || product.catalogue_id,
                  category_id: entry.category ?? product.category_id,
                  brand_id: entry.brand ?? product.brand_id,
                  inventory_threshold: entry.inventory_threshold ?? product.inventory_threshold,
                  created_at: entry.createdAt || product.createdAt,
                  updated_at: entry.updatedAt || product.updatedAt
                }
              };
            }

            const calculatedLineStatus = DCGrnController.calculateLineStatus(entryOrderedQty, 0, 0);
            return {
              id: entry.id || product.id,
              sku_id: actualSku,
              ordered_qty: entryOrderedQty,
              received_qty: 0,
              pending_qty: entryOrderedQty,
              rejected_qty: 0,
              qc_pass_qty: 0,
              qc_fail_qty: 0,
              rtv_qty: 0,
              held_qty: 0,
              line_status: calculatedLineStatus,
              product_details: productDetails || {
                name: entry.product_name || product.productName,
                description: entry.description ?? product.description,
                mrp: entry.mrp ? parseFloat(entry.mrp) : product.mrp,
                ean_upc: entry.ean_upc ?? product.ean_upc,
                image_url: entry.image_url ?? product.image_url,
                weight: entry.weight ?? product.weight,
                length: entry.length ?? product.length,
                height: entry.height ?? product.height,
                width: entry.width ?? product.width,
                gst: entry.gst ?? product.gst,
                cess: entry.cess ?? product.cess,
                hsn: entry.hsn ?? product.hsn,
                catalogue_id: entry.catalogue_id || product.catalogue_id,
                category_id: entry.category ?? product.category_id,
                brand_id: entry.brand ?? product.brand_id,
                inventory_threshold: entry.inventory_threshold ?? product.inventory_threshold,
                created_at: entry.createdAt || product.createdAt,
                updated_at: entry.updatedAt || product.updatedAt
              }
            };
          });
        });

        // Calculate overall GRN status based on line statuses
        const lineStatuses = processedLines.map((line: any) => line.line_status);
        let calculatedGrnStatus;
        
        if (hasGrn) {
          calculatedGrnStatus = DCGrnController.calculateGrnStatus(lineStatuses);
        } else {
          // For POs without GRNs, use PO status
          calculatedGrnStatus = po.status.toLowerCase();
        }
        
        // If user queried for "approved" and calculated status is "completed", show "approved"
        const displayStatus = (statusFilter?.toLowerCase() === 'approved' && calculatedGrnStatus === 'completed') 
          ? 'approved' 
          : calculatedGrnStatus;

        let totalGrnAmount = 0;

        if (processedLines && processedLines.length > 0) {
          totalGrnAmount = processedLines.reduce((sum: number, line: any) => {
            const rlp = parseFloat(line?.product_details?.rlp || 0);
            const receivedQty = parseFloat(line?.received_qty || 0);
            return sum + rlp * receivedQty;
          }, 0);
        }
        console.log(po.totalAmount);
        
        return {
          id: hasGrn ? latestGrn.id : po.id,
          po_id: po.id,
          vendorId: po.vendorId,
          status: displayStatus,
          totalGrnAmount: totalGrnAmount,
          canGenerateCreditNote:po.totalAmount>totalGrnAmount,
          creditNoteAmount: po.totalAmount-totalGrnAmount,
          closeReason: hasGrn ? latestGrn.closeReason : (po.status === 'REJECTED' ? po.rejectionReason : null),
          created_by: hasGrn ? latestGrn.created_by : (po.CreatedBy?.id || null),
          created_at: hasGrn ? latestGrn.created_at : po.createdAt,
          updated_at: hasGrn ? latestGrn.updated_at : po.updatedAt,
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
