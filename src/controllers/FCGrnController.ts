import { Request, Response } from 'express';
import { ResponseHandler } from '../middleware/responseHandler';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import FCGrnLine from '../models/FCGrnLine';
import FCGrnBatch from '../models/FCGrnBatch';
import { User, FCPurchaseOrder, FCPOProduct, ProductMaster } from '../models';
import FCGrn from '../models/FCGrn.model';
import FCGrnPhoto from '../models/FCGrnPhoto';
import {
  AuthRequest,
  CreateGRNPhotoRequest,
  GRNFilters,
  GRNRequest,
  CreateFullGRNInput,
} from '../types';
import { Op } from 'sequelize';
import { rejects } from 'assert';
import { S3Service } from '../services/s3Service';
import DirectInventoryService from '../services/DirectInventoryService';
import { INVENTORY_OPERATIONS } from '../config/inventoryConstants';
import ProductMasterService from '../services/productMasterService';

export class FCGrnController {
  private productMasterService: ProductMasterService;

  constructor() {
    this.productMasterService = new ProductMasterService();
  }

  /**
   * Validate if the provided string is a valid S3 URL
   * @param url - URL to validate
   * @returns boolean - Whether the URL is a valid S3 URL
   */
  private static isValidS3Url(url: string): boolean {
    try {
      const s3UrlPattern = /^https:\/\/[a-zA-Z0-9-]+\.s3\.[a-zA-Z0-9-]+\.amazonaws\.com\/.+/;
      return s3UrlPattern.test(url);
    } catch (error) {
      return false;
    }
  }

  async createFCGrn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: GRNRequest = req.body;
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
      const existingFCGrn = await FCGrn.findOne({
        where: { po_id: data.po_id },
      });

      if (existingFCGrn) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'FC FCGrn code already exists',
        });
        return;
      }

      const fcGrn = await FCGrn.create({
        ...data,
        status: data.status || 'partial',
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const createdFCGrn = await FCGrn.findByPk(fcGrn.id, {
        include: [
          { model: User, as: 'GrnCreatedBy', attributes: ['id', 'email'] },
        ],
      });
      res.status(201).json({
        statusCode: 201,
        success: true,
        data: createdFCGrn,
        error: null,
      });
    } catch (error: any) {
      console.error('Error creating FC FCGrn:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: error.message,
        error: 'Internal server error',
      });
    }
  }
  async createFullFCFCGrn(req: AuthRequest, res: Response) {
    const input: CreateFullGRNInput = req.body;
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

    const t = await sequelize.transaction();
    try {
      const fcGrn = await FCGrn.create(
        {
          po_id: input.poId,
          status: input.status || 'partial',
          close_reason: input.close_reason || null,
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t }
      );

      for (const line of input.lines) {
        // First, get all FC PO products for this PO
        const fcPOProducts = await FCPOProduct.findAll({
          where: { fcPOId: input.poId },
          transaction: t,
        });

        // Find the product that contains the SKU in its SKU matrix
        let fcPOProduct: any = null;
        for (const product of fcPOProducts) {
          try {
            const skuMatrix = product.skuMatrixOnCatalogueId 
              ? (typeof product.skuMatrixOnCatalogueId === 'string' 
                  ? JSON.parse(product.skuMatrixOnCatalogueId)
                  : product.skuMatrixOnCatalogueId)
              : [];
            
            if (Array.isArray(skuMatrix) && skuMatrix.some((item: any) => item.sku === line.skuId)) {
              fcPOProduct = product;
              break;
            }
          } catch (error) {
            console.error('Error parsing SKU matrix:', error);
          }
        }

        if (!fcPOProduct) {
          await t.rollback();
          res.status(400).json({
            statusCode: 400,
            success: false,
            data: null,
            error: `FC PO Product not found for FC PO ${input.poId} and SKU ${line.skuId}`,
          });
          return;
        }

        if (fcPOProduct.get('grnStatus') === 'completed') {
          await t.rollback();
          res.status(400).json({
            statusCode: 400,
            success: false,
            data: null,
            error: `FC FCGrn already completed for SKU ${line.skuId}`,
          });
          return;
        }

        const [result] = await sequelize.query(
          `
          SELECT COALESCE(SUM(gl.received_qty), 0) as totalReceived
          FROM fc_grn_lines gl
          INNER JOIN fc_grns g ON g.id = gl.grn_id
          WHERE g.po_id = :poId AND gl.sku_id = :skuId
        `,
          {
            replacements: { poId: input.poId, skuId: line.skuId },
            type: QueryTypes.SELECT,
            transaction: t,
          }
        );

        const receivedSoFar = Number((result as any).totalReceived || 0);
        const newTotalReceived = receivedSoFar + (line.receivedQty || 0);
        const totalRejected = line.rejectedQty || 0;
        const maxReceivable = line.orderedQty - totalRejected;

        if (newTotalReceived > maxReceivable) {
          await t.rollback();
          res.status(400).json({
            statusCode: 400,
            success: false,
            data: null,
            error: `Received and Rejected qty cannot exceed Ordered qty for SKU ${line.skuId}`,
          });
          return;
        }

        if (
          line.rejectedQty > 0 &&
          (line.remarks === undefined || line.remarks?.trim() === '')
        ) {
          await t.rollback();
          res.status(400).json({
            statusCode: 400,
            success: false,
            data: null,
            error: `Remarks required for rejected items for SKU ${line.skuId}`,
          });
          return;
        }

        // Validate S3 URL if provided
        if (line.photos && line.photos.length > 0) {
          // Handle both string and array formats
          const photoUrls = Array.isArray(line.photos) ? line.photos : [line.photos];
          for (const photoUrl of photoUrls) {
            if (photoUrl && !FCGrnController.isValidS3Url(photoUrl)) {
              await t.rollback();
              res.status(400).json({
                statusCode: 400,
                success: false,
                data: null,
                error: `Invalid S3 URL format for SKU ${line.skuId}. Please upload images first using the photo upload API.`,
              });
              return;
            }
          }
        }

        // Calculate line status using the same logic as DC GRN
        const calculatedLineStatus = FCGrnController.calculateLineStatus(
          line.orderedQty,
          line.rejectedQty || 0,
          line.qcPassQty ?? line.receivedQty
        );

        const grnLine = await FCGrnLine.create(
          {
            grn_id: fcGrn.id,
            sku_id: line.skuId,
            ordered_qty: line.orderedQty,
            received_qty: line.receivedQty,
            pending_qty: line.orderedQty - newTotalReceived,
            rejected_qty: line.rejectedQty || 0,
            qc_pass_qty: line.qcPassQty ?? line.receivedQty,
            qc_fail_qty: line.rejectedQty ?? 0,
            held_qty: line.heldQty ?? 0,
            rtv_qty: line.rtvQty ?? 0,
            line_status: calculatedLineStatus,
          },
          { transaction: t }
        );

        // Create FCGrnPhoto record for the S3 URL
        if (line.photos && line.photos.length > 0) {
          try {
            // Handle both string and array formats for photos
            const photoUrls = Array.isArray(line.photos) ? line.photos : [line.photos];
            
            for (const photoUrl of photoUrls) {
              if (photoUrl && typeof photoUrl === 'string') {
                await FCGrnPhoto.create(
                  {
                    sku_id: line.skuId,
                    grn_id: fcGrn.id,
                    po_id: input.poId,
                    url: photoUrl,
                    reason: 'sku-level-photo',
                  },
                  { transaction: t }
                );
              }
            }
          } catch (photoError) {
            await t.rollback();
            console.error('FCGrn Photo creation error:', photoError);
            res.status(500).json({
              statusCode: 500,
              success: false,
              data: null,
              error: `Failed to create photo record for SKU ${line.skuId}: ${photoError}`,
            });
            return;
          }
        }

        // Update FC PO Product status
        // await FCPOProduct.update(
        //   {
        //     pending_qty: line.orderedQty - newTotalReceived,
        //   },
        //   { where: { fcPOId: input.poId, productId: line.skuId }, transaction: t }
        // );

        // Handle batches (without photos since they're now at SKU level)
        if (line.batches && line.batches.length > 0) {
          for (const batch of line.batches) {
            await FCGrnBatch.create(
              {
                grn_line_id: grnLine.id,
                batch_no: batch.batchNo,
                expiry_date: batch.expiry,
                qty: batch.qty,
              },
              { transaction: t }
            );
          }
        }
      }

      // Check if all products are completed
      // const allProducts = await FCPOProduct.findAll({
      //   where: { fcPOId: input.poId },
      //   transaction: t,
      // });

      // const allCompleted = allProducts.every(
      //   (p) => p.get('grnStatus') === 'completed'
      // );

      if (false) { // allCompleted
        // Update FC Purchase Order status
        // await FCPurchaseOrder.update(
        //   { approval_status: 'completed' },
        //   { where: { id: input.poId }, transaction: t }
        // );
      }

      await t.commit();

      // Update inventory for each FCGrn line item
      const inventoryUpdates: Array<{
        sku: string;
        status: 'success' | 'failed' | 'error';
        quantity: number;
        message: string;
      }> = [];
      for (const line of input.lines) {
        if (line.receivedQty > 0) {
          try {
            const inventoryResult = await DirectInventoryService.updateInventory({
              sku: line.skuId,
              operation: INVENTORY_OPERATIONS.GRN,
              quantity: line.receivedQty,
              referenceId: `FCGrn-${fcGrn.id}`,
              operationDetails: {
                grnId: fcGrn.id,
                poId: input.poId,
                receivedQty: line.receivedQty,
                rejectedQty: line.rejectedQty || 0,
                qcPassQty: line.qcPassQty || line.receivedQty,
                remarks: line.remarks || 'FCGrn received'
              },
              performedBy: userId
            });

            if (inventoryResult.success) {
              console.log(`✅ Inventory updated for SKU ${line.skuId}: +${line.receivedQty} units`);
              inventoryUpdates.push({
                sku: line.skuId,
                status: 'success',
                quantity: line.receivedQty,
                message: inventoryResult.message
              });
            } else {
              console.error(`❌ Inventory update failed for SKU ${line.skuId}: ${inventoryResult.message}`);
              inventoryUpdates.push({
                sku: line.skuId,
                status: 'failed',
                quantity: line.receivedQty,
                message: inventoryResult.message
              });
            }
          } catch (inventoryError: any) {
            console.error(`❌ Inventory update error for SKU ${line.skuId}:`, inventoryError.message);
            inventoryUpdates.push({
              sku: line.skuId,
              status: 'error',
              quantity: line.receivedQty,
              message: inventoryError.message
            });
          }
        }
      }

// Update average cost to OZI for all SKUs in this FCGrn
console.log('💰 Updating average cost to OZI for FCGrn SKUs...');
const costUpdates: Array<{
  sku: string;
  status: 'success' | 'failed' | 'error';
  message: string;
  previous_cost?: number;
  new_cost?: number;
}> = [];

for (const line of input.lines) {
  if (line.receivedQty > 0) {
    try {
      const costResult = await this.productMasterService.calculateAndUpdateAverageCost(line.skuId, userId);
      costUpdates.push({
        sku: line.skuId,
        status: 'success',
        message: `Average cost updated successfully`,
        previous_cost: costResult.avg_cost_to_ozi,
        new_cost: costResult.avg_cost_to_ozi
      });
      console.log(`✅ Average cost updated for SKU ${line.skuId}`);
    } catch (costError: any) {
      console.error(`❌ Average cost update failed for SKU ${line.skuId}:`, costError.message);
      costUpdates.push({
        sku: line.skuId,
        status: 'failed',
        message: costError.message
      });
    }
  }
}

const createdGrn = await FCGrn.findByPk(fcGrn.id, {
        include: [
          { model: User, as: 'GrnCreatedBy', attributes: ['id', 'email'] },
        ],
      });

      if (!createdGrn) {
        res.status(500).json({
          statusCode: 500,
          success: false,
          data: null,
          error: 'Failed to retrieve created FCGrn',
        });
        return;
      }

      res.status(201).json({
        statusCode: 201,
        success: true,
        data: {
          ...createdGrn.toJSON(),
          inventoryUpdates: {
            total_updates: inventoryUpdates.length,
            successful_updates: inventoryUpdates.filter(u => u.status === 'success').length,
            failed_updates: inventoryUpdates.filter(u => u.status === 'failed').length,
            error_updates: inventoryUpdates.filter(u => u.status === 'error').length,
            updates: inventoryUpdates
          },
          costUpdates: {
            total_updates: costUpdates.length,
            successful_updates: costUpdates.filter(u => u.status === 'success').length,
            failed_updates: costUpdates.filter(u => u.status === 'failed').length,
            updates: costUpdates
          }
        },
        error: null,
      });
    } catch (err: any) {
      await t.rollback();
      console.error('Error creating FCGrn:', err);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: err.message,
        error: 'Internal server error',
      });
    }
  }

  // static async getGrnByPoId(req: Request, res: Response): Promise<void> {
  //   try {
  //     const { poId } = req.params;

  //     const grn = await FCGrn.findOne({
  //       where: { po_id: poId },
  //       include: [
  //         { model: User, as: 'CreatedBy', attributes: ['id', 'email'] },
  //         { model: User, as: 'ApprovedBy', attributes: ['id', 'email'] },
  //       ],
  //     });

  //     if (!grn) {
  //       res.status(404).json({
  //         statusCode: 404,
  //         success: false,
  //         data: null,
  //         error: `No FCGrn found for PO ID ${poId}`,
  //       });
  //       return;
  //     }
  //     const grlLines = await FCGrnLine.findAll({
  //       where: { grn_id: fcGrn.id },
  //     });
  //     const batches = await FCGrnBatch.findAll({
  //       where: { grn_line_id: grlLines.map((line) => line.id) },
  //     });
  //     res.status(200).json({
  //       statusCode: 200,
  //       success: true,
  //       data: grn,
  //       error: null,
  //     });
  //   } catch (error: any) {
  //     console.error('Error fetching FCGrn by PO ID:', error);
  //     res.status(500).json({
  //       statusCode: 500,
  //       success: false,
  //       data: null,
  //       error: error.message,
  //     });
  //   }
  // }
  static async getGrnsByPoIdWithDetails(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { poId } = req.params;

      const grns = await FCGrn.findAll({
        where: { po_id: poId },
        include: [
          {
            model: FCPurchaseOrder,
            as: 'FCPO',
            attributes: ['id', 'po_id', 'status'],
          },
          { model: User, as: 'GrnCreatedBy', attributes: ['id', 'email'] },
          { model: User, as: 'ApprovedBy', attributes: ['id', 'email'] },
          {
            model: FCGrnLine,
            as: 'Line',
            include: [
              {
                model: FCGrnBatch,
                as: 'Batches',
              },
            ],
          },
          {
            model: FCGrnPhoto,
            as: 'Photos',
            attributes: ['id', 'sku_id', 'url', 'reason', 'created_at'],
          },
        ],
        order: [
          ['created_at', 'DESC'],
          [{ model: FCGrnLine, as: 'Line' }, 'id', 'ASC'],
          [
            { model: FCGrnLine, as: 'Line' },
            { model: FCGrnBatch, as: 'Batches' },
            'id',
            'ASC',
          ],
          [{ model: FCGrnPhoto, as: 'Photos' }, 'created_at', 'DESC'],
        ],
      });

      if (!grns || grns.length === 0) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: `No FCGrns found for PO ID ${poId}`,
        });
        return;
      }

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: grns,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching FCGrns with details:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }
  static async getFCGrnStats(req: Request, res: Response): Promise<void> {
    try {
      // 1. Total FCGrns
      const totalGrns = await FCGrn.count();

      const grnsWithVariance = await FCGrn.count({
        where: {
          status: 'partial',
        },
      });

      const pendingQc = await FCGrn.count({
        where: { status: 'pending-qc' },
      });

      const rtvInitiated = await FCGrn.count({
        where: { status: 'rtv-initiated' },
      });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          totalGrns,
          grnsWithVariance,
          pendingQc,
          rtvInitiated,
        },
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching FCGrn stats:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  /**
   * Calculate line status based on business logic (same as DC GRN)
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

  static async getFCGrnDetails(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Validate pagination parameters
      if (page < 1) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'Page number must be greater than 0',
        });
        return;
      }
      if (limit < 1 || limit > 100) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'Limit must be between 1 and 100',
        });
        return;
      }

      const offset = (page - 1) * limit;

      // Get FC Purchase Orders with APPROVED, REJECTED, or PENDING_CATEGORY_HEAD status
      // PENDING_CATEGORY_HEAD means the PO was approved but then edited
      const { count, rows: purchaseOrders } = await FCPurchaseOrder.findAndCountAll({
        where: {
          status: ['APPROVED', 'REJECTED', 'PENDING_CATEGORY_HEAD']
        },
        include: [
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'email', 'name']
          },
          {
            model: FCPOProduct,
            as: 'Products',
            attributes: [
              'id', 'catalogueId', 'productName', 'quantity', 'unitPrice', 
              'totalAmount', 'mrp', 'description', 'hsn', 'ean_upc',
              'weight', 'length', 'height', 'width', 'gst', 'cess', 'image_url',
              'brand_id', 'category_id', 'skuMatrixOnCatalogueId'
            ]
          },
          {
            model: FCGrn,
            as: 'FCGrns',
            include: [
              {
            model: FCGrnLine,
            as: 'Line',
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
      const grnList = await Promise.all(purchaseOrders.map(async (po: any) => {
        // Check if GRN exists for this PO
        const hasGrn = po.FCGrns && po.FCGrns.length > 0;
        const grnData = hasGrn ? po.FCGrns[0] : null;
        
        const lines = await Promise.all((po.Products || []).map(async (product: any) => {
          // Parse SKU matrix to get actual SKUs
          let skuMatrix: any[] = [];
          try {
            if (product.skuMatrixOnCatalogueId) {
              skuMatrix = typeof product.skuMatrixOnCatalogueId === 'string' 
                ? JSON.parse(product.skuMatrixOnCatalogueId)
                : product.skuMatrixOnCatalogueId;
            }
          } catch (error) {
            console.error('Error parsing SKU matrix:', error);
            skuMatrix = [];
          }

          // Get the first SKU from the matrix (or fallback to catalogueId)
          const actualSku = skuMatrix.length > 0 ? skuMatrix[0].sku : product.catalogueId;
          
          // Find corresponding GRN line for this product using the actual SKU
          const grnLine = grnData?.Line?.find((line: any) => line.sku_id === actualSku);
          
          // Fetch product details from ProductMaster
          let productDetails: any = {
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
          };

          // Try to fetch from ProductMaster if we have a proper SKU
          if (actualSku && actualSku.length >= 12) {
            try {
              const productMaster = await ProductMaster.findOne({
                where: { sku_id: actualSku },
                attributes: [
                  'id', 'status', 'catelogue_id', 'product_id', 'sku_id', 'color', 'age_size',
                  'name', 'category', 'description', 'image_url', 'mrp', 'avg_cost_to_ozi',
                  'ean_upc', 'brand_id', 'weight', 'length', 'height', 'width', 
                  'inventory_threshold', 'gst', 'cess', 'hsn', 'created_by', 'created_at', 'updated_at'
                ]
              });
              
              if (productMaster) {
                productDetails = {
                  id: productMaster.id,
                  status: productMaster.status,
                  catelogue_id: productMaster.catelogue_id,
                  product_id: productMaster.product_id,
                  sku_id: productMaster.sku_id,
                  color: productMaster.color,
                  age_size: productMaster.age_size,
                  name: productMaster.name,
                  category: productMaster.category,
                  description: productMaster.description,
                  image_url: productMaster.image_url,
                  mrp: productMaster.mrp,
                  avg_cost_to_ozi: productMaster.avg_cost_to_ozi,
                  ean_upc: productMaster.ean_upc,
                  brand_id: productMaster.brand_id,
                  weight: productMaster.weight,
                  length: productMaster.length,
                  height: productMaster.height,
                  width: productMaster.width,
                  inventory_threshold: productMaster.inventory_threshold,
                  gst: productMaster.gst,
                  cess: productMaster.cess,
                  hsn: productMaster.hsn,
                  created_by: productMaster.created_by,
                  created_at: productMaster.created_at,
                  updated_at: productMaster.updated_at
                };
              }
            } catch (error) {
              console.error('Error fetching product details from ProductMaster:', error);
              // Fall back to PO product details
            }
          }
          
          if (grnLine) {
            // Calculate line status based on business logic
            const calculatedLineStatus = FCGrnController.calculateLineStatus(
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
              product_details: productDetails
            };
          } else {
            // Fall back to PO data if no GRN line exists
            // Calculate line status for fallback case (all quantities are 0 except ordered_qty)
            const calculatedLineStatus = FCGrnController.calculateLineStatus(
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
              product_details: productDetails
            };
          }
        }));
        
        // Calculate overall GRN status based on line statuses
        const lineStatuses = lines.map((line: any) => line.line_status);
        const calculatedGrnStatus = hasGrn ? FCGrnController.calculateGrnStatus(lineStatuses) : po.status.toLowerCase();
        
        return {
          id: hasGrn ? grnData.id : po.id,
          po_id: po.id,
          status: calculatedGrnStatus,
          closeReason: hasGrn ? grnData.closeReason : (po.status === 'REJECTED' ? po.rejectionReason : null),
          created_by: hasGrn ? grnData.created_by : (po.CreatedBy?.id || null),
          created_at: hasGrn ? grnData.created_at : po.createdAt,
          updated_at: hasGrn ? grnData.updated_at : po.updatedAt,
          FCPO: {
            id: po.id,
            po_id: po.poId,
            vendor_name: `FC-${po.fcId}`,
            approval_status: po.status.toLowerCase()
          },
          Line: lines
        };
      }));

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          message: 'FC GRN list retrieved successfully',
          data: {
            grn: grnList,
            pagination: {
              page: page,
              limit: limit,
              total: count,
              totalPages: totalPages
            }
          }
        },
        error: null,
      });
    } catch (error) {
      console.error('Error fetching FC GRN list:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error',
      });
    }
  }

  static async getFCGrnById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const grn = await FCGrn.findByPk(id, {
        include: [
          {
            model: FCPurchaseOrder,
            as: 'FCPO',
            attributes: ['id', 'po_id', 'status'],
          },
          {
            model: FCGrnLine,
            as: 'Line',
            attributes: [
              'id',
              'sku_id',
              'ordered_qty',
              'received_qty',
              'qc_pass_qty',
              'qc_fail_qty',
              'rtv_qty',
              'held_qty',
            ],
            include: [
              {
                model: FCGrnBatch,
                as: 'Batches',
              },
            ],
          },
          { model: User, as: 'GrnCreatedBy', attributes: ['id', 'email'] },
          { model: User, as: 'ApprovedBy', attributes: ['id', 'email'] },
          {
            model: FCGrnPhoto,
            as: 'Photos',
            attributes: ['id', 'sku_id', 'url', 'reason', 'created_at'],
          },
        ],
        order: [
          [{ model: FCGrnLine, as: 'Line' }, 'id', 'ASC'],
          [
            { model: FCGrnLine, as: 'Line' },
            { model: FCGrnBatch, as: 'Batches' },
            'id',
            'ASC',
          ],
          [{ model: FCGrnPhoto, as: 'Photos' }, 'created_at', 'DESC'],
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

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: grn,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching FCGrn:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async updateFCGrn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const fcGrn = await FCGrn.findByPk(id);
      if (!fcGrn) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'FCGrn not found',
        });
        return;
      }

      await fcGrn.update({ ...updates, updated_at: new Date() });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: fcGrn,
        error: null,
      });
    } catch (error: any) {
      console.error('Error updating FCGrn:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  async updateFCGrnStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const fcGrn = await FCGrn.findByPk(id);
      if (!fcGrn) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'FCGrn not found',
        });
        return;
      }

      await fcGrn.update({ status, updated_at: new Date() });

      // If GRN is being marked as completed, update average costs
      if (status === 'completed') {
        console.log('💰 GRN marked as completed, updating average costs...');
        const userId = req.user?.id || 1; // Default to user ID 1 if not available
        
        try {
          // Get all GRN lines for this GRN
          const grnLines = await FCGrnLine.findAll({
            where: { grn_id: id }
          });

          const costUpdates: Array<{
            sku: string;
            status: 'success' | 'failed' | 'error';
            message: string;
            previous_cost?: number;
            new_cost?: number;
          }> = [];

          for (const line of grnLines) {
            if (line.received_qty > 0) {
              try {
                const costResult = await this.productMasterService.calculateAndUpdateAverageCost(line.sku_id, userId);
                costUpdates.push({
                  sku: line.sku_id,
                  status: 'success',
                  message: `Average cost updated successfully`,
                  previous_cost: costResult.avg_cost_to_ozi,
                  new_cost: costResult.avg_cost_to_ozi
                });
                console.log(`✅ Average cost updated for SKU ${line.sku_id}`);
              } catch (costError: any) {
                console.error(`❌ Average cost update failed for SKU ${line.sku_id}:`, costError.message);
                costUpdates.push({
                  sku: line.sku_id,
                  status: 'failed',
                  message: costError.message
                });
              }
            }
          }

          console.log(`💰 Average cost updates completed: ${costUpdates.filter(u => u.status === 'success').length}/${costUpdates.length} successful`);
        } catch (error) {
          console.error('❌ Error updating average costs on GRN completion:', error);
        }
      }

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: fcGrn,
        error: null,
      });
    } catch (error: any) {
      console.error('Error updating FCGrn status:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async deleteFCGrn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const fcGrn = await FCGrn.findByPk(id);
      if (!fcGrn) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'FCGrn not found',
        });
        return;
      }

      await fcGrn.destroy();

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: `FCGrn ${id} deleted successfully`,
        error: null,
      });
    } catch (error: any) {
      console.error('Error deleting FCGrn:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async getFCGrnsByPoIdWithDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { poId } = req.params;

      const fcGrns = await FCGrn.findAll({
        where: { po_id: poId },
        include: [
          {
            model: FCGrnLine,
            as: 'Line',
            include: [
              {
                model: FCGrnBatch,
                as: 'Batches'
              }
            ]
          },
          {
            model: FCGrnPhoto,
            as: 'Photos'
          },
          {
            model: User,
            as: 'GrnCreatedBy',
            attributes: ['id', 'email', 'name']
          },
          {
            model: User,
            as: 'ApprovedBy',
            attributes: ['id', 'email', 'name']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: fcGrns,
        error: null,
      });
    } catch (error: any) {
      console.error('Error getting FC FCGrns by PO ID:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  // Temporary endpoint to fix foreign key constraints
  static async fixConstraints(req: Request, res: Response): Promise<Response> {
    try {
      const sequelize = (FCGrn as any).sequelize;
      
      // Drop existing constraints
      try {
        await sequelize.query(`ALTER TABLE fc_grns DROP FOREIGN KEY fc_grns_ibfk_1;`);
        console.log('✅ Dropped fc_grns constraint');
      } catch (error) {
        console.log('ℹ️  fc_grns constraint not found');
      }

      try {
        await sequelize.query(`ALTER TABLE fc_grn_photos DROP FOREIGN KEY fc_grn_photos_ibfk_1;`);
        console.log('✅ Dropped fc_grn_photos constraint');
      } catch (error) {
        console.log('ℹ️  fc_grn_photos constraint not found');
      }

      // Add correct constraints
      await sequelize.query(`
        ALTER TABLE fc_grns 
        ADD CONSTRAINT fc_grns_po_fk 
        FOREIGN KEY (po_id) REFERENCES fc_purchase_orders(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('✅ Added fc_grns constraint');

      await sequelize.query(`
        ALTER TABLE fc_grn_photos 
        ADD CONSTRAINT fc_grn_photos_po_fk 
        FOREIGN KEY (po_id) REFERENCES fc_purchase_orders(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('✅ Added fc_grn_photos constraint');

      return ResponseHandler.success(res, { message: 'Foreign key constraints fixed successfully' });
    } catch (error) {
      console.error('❌ Error fixing constraints:', error);
      return ResponseHandler.error(res, 'Failed to fix constraints', 500);
    }
  }
}

export default FCGrnController;
