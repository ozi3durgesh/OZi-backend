import { Request, Response } from 'express';
import { ResponseHandler } from '../middleware/responseHandler';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import FCGrnLine from '../models/FCGrnLine';
import FCGrnBatch from '../models/FCGrnBatch';
import { User, FCPurchaseOrder, FCPOProduct } from '../models';
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

export class FCGrnController {
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

  static async createFCGrn(req: AuthRequest, res: Response): Promise<void> {
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
  static async createFullFCFCGrn(req: AuthRequest, res: Response) {
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
        const fcPOProduct = await FCPOProduct.findOne({
          where: { fcPOId: input.poId, catalogueId: line.skuId },
          transaction: t,
        });
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
        if (line.photos) {
          if (!FCGrnController.isValidS3Url(line.photos)) {
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
            line_status:
              newTotalReceived === 0
                ? 'pending'
                : newTotalReceived < line.orderedQty
                  ? 'partial'
                  : 'completed',
          },
          { transaction: t }
        );

        // Create FCGrnPhoto record for the S3 URL
        if (line.photos) {
          try {
            // Create FCGrnPhoto record for the S3 URL (already uploaded via photo upload API)
            await FCGrnPhoto.create(
              {
                sku_id: line.skuId,
                grn_id: fcGrn.id,
                po_id: input.poId,
                url: line.photos,
                reason: 'sku-level-photo',
              },
              { transaction: t }
            );
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

  static async getFCGrnDetails(req: Request, res: Response): Promise<void> {
    try {
      const {
        status,
        po_id,
        page = 1,
        limit = 10,
        search,
        startDate,
        endDate,
      } = req.query as GRNFilters;

      const offset: number = (page - 1) * limit;
      const whereClause: any = {};

      if (status) whereClause.status = status;

      if (po_id) whereClause.po_id = po_id;
      if (startDate && endDate) {
        whereClause.created_at = {
          [Op.between]: [
            new Date(startDate as string),
            new Date(endDate as string),
          ],
        };
      }

      const { count, rows } = await FCGrn.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: FCPurchaseOrder,
            as: 'FCPO',
            attributes: ['id', 'po_id', 'status'],
            where: search ? { po_id: { [Op.like]: `%${search}%` } } : {},
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
          },
          { model: User, as: 'GrnCreatedBy', attributes: ['id', 'email'] },
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      const totalPages = Math.ceil(count / limit);

      const response = {
        grn: rows,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: count,
          totalPages,
        },
      };

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: response,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching warehouses:', error);
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

  static async updateFCGrnStatus(req: AuthRequest, res: Response): Promise<void> {
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
