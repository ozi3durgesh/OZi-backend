import { Request, Response } from 'express';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import GRNLine from '../models/GrnLine';
import GRNBatch from '../models/GrnBatch';
import { User } from '../models';
import GRN from '../models/Grn.model';
import GRNPhoto from '../models/GrnPhoto';
import {
  AuthRequest,
  CreateGRNPhotoRequest,
  GRNFilters,
  GRNRequest,
  CreateFullGRNInput,
} from '../types';
import { Op } from 'sequelize';
import PurchaseOrder from '../models/PurchaseOrder';
import POProduct from '../models/POProduct';
import { rejects } from 'assert';
import { S3Service } from '../services/s3Service';
import DirectInventoryService from '../services/DirectInventoryService';
import { INVENTORY_OPERATIONS } from '../config/inventoryConstants';

export class GrnController {
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

  static async createGrn(req: AuthRequest, res: Response): Promise<void> {
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
      const existingGRN = await GRN.findOne({
        where: { po_id: data.po_id },
      });

      if (existingGRN) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'GRN code already exists',
        });
        return;
      }

      const grn = await GRN.create({
        ...data,
        status: data.status || 'partial',
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const createdGrn = await GRN.findByPk(grn.id, {
        include: [
          { model: User, as: 'GrnCreatedBy', attributes: ['id', 'email'] },
        ],
      });
      res.status(201).json({
        statusCode: 201,
        success: true,
        data: createdGrn,
        error: null,
      });
    } catch (error: any) {
      console.error('Error creating GRN:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: error.message,
        error: 'Internal server error',
      });
    }
  }
  static async createFullGRN(req: AuthRequest, res: Response) {
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
      const grn = await GRN.create(
        {
          po_id: input.poId,
          status: input.status || 'partial',
          closeReason: input.closeReason || null,
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t }
      );

      for (const line of input.lines) {
        const poProduct = await POProduct.findOne({
          where: { po_id: input.poId, sku_id: line.skuId },
          transaction: t,
        });
        if (!poProduct) {
          await t.rollback();
          res.status(400).json({
            statusCode: 400,
            success: false,
            data: null,
            error: `PO Product not found for PO ${input.poId} and SKU ${line.skuId}`,
          });
          return;
        }

        if (poProduct.get('grnStatus') === 'completed') {
          await t.rollback();
          res.status(400).json({
            statusCode: 400,
            success: false,
            data: null,
            error: `GRN already completed for SKU ${line.skuId}`,
          });
          return;
        }

        const [result] = await sequelize.query(
          `
          SELECT COALESCE(SUM(gl.received_qty), 0) as totalReceived
          FROM grn_lines gl
          INNER JOIN grns g ON g.id = gl.grn_id
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
          if (!GrnController.isValidS3Url(line.photos)) {
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

        const grnLine = await GRNLine.create(
          {
            grn_id: grn.id,
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

        // Create GRNPhoto record for the S3 URL
        if (line.photos) {
          try {
            // Create GRNPhoto record for the S3 URL (already uploaded via photo upload API)
            await GRNPhoto.create(
              {
                sku_id: line.skuId,
                grn_id: grn.id,
                po_id: input.poId,
                url: line.photos,
                reason: 'sku-level-photo',
              },
              { transaction: t }
            );
          } catch (photoError) {
            await t.rollback();
            console.error('GRN Photo creation error:', photoError);
            res.status(500).json({
              statusCode: 500,
              success: false,
              data: null,
              error: `Failed to create photo record for SKU ${line.skuId}: ${photoError}`,
            });
            return;
          }
        }

        await POProduct.update(
          {
            grnStatus:
              newTotalReceived === 0
                ? 'pending'
                : newTotalReceived < line.orderedQty
                  ? 'partial'
                  : 'completed',
            pending_qty: line.orderedQty - newTotalReceived,
          },
          { where: { po_id: input.poId, sku_id: line.skuId }, transaction: t }
        );

        // Handle batches (without photos since they're now at SKU level)
        if (line.batches && line.batches.length > 0) {
          for (const batch of line.batches) {
            await GRNBatch.create(
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

      const allProducts = await POProduct.findAll({
        where: { po_id: input.poId },
        transaction: t,
      });

      const allCompleted = allProducts.every(
        (p) => p.get('grnStatus') === 'completed'
      );

      if (allCompleted) {
        await PurchaseOrder.update(
          { approval_status: 'completed' },
          { where: { id: input.poId }, transaction: t }
        );
      }

      await t.commit();

      // Update inventory for each GRN line item
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
              referenceId: `GRN-${grn.id}`,
              operationDetails: {
                grnId: grn.id,
                poId: input.poId,
                receivedQty: line.receivedQty,
                rejectedQty: line.rejectedQty || 0,
                qcPassQty: line.qcPassQty || line.receivedQty,
                remarks: line.remarks || 'GRN received'
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

      const createdGrn = await GRN.findByPk(grn.id, {
        include: [
          { model: User, as: 'GrnCreatedBy', attributes: ['id', 'email'] },
        ],
      });

      if (!createdGrn) {
        res.status(500).json({
          statusCode: 500,
          success: false,
          data: null,
          error: 'Failed to retrieve created GRN',
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
      console.error('Error creating GRN:', err);
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

  //     const grn = await GRN.findOne({
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
  //         error: `No GRN found for PO ID ${poId}`,
  //       });
  //       return;
  //     }
  //     const grlLines = await GRNLine.findAll({
  //       where: { grn_id: grn.id },
  //     });
  //     const batches = await GRNBatch.findAll({
  //       where: { grn_line_id: grlLines.map((line) => line.id) },
  //     });
  //     res.status(200).json({
  //       statusCode: 200,
  //       success: true,
  //       data: grn,
  //       error: null,
  //     });
  //   } catch (error: any) {
  //     console.error('Error fetching GRN by PO ID:', error);
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

      const grns = await GRN.findAll({
        where: { po_id: poId },
        include: [
          {
            model: PurchaseOrder,
            as: 'PO',
            attributes: ['id', 'po_id', 'vendor_name', 'approval_status'],
          },
          { model: User, as: 'GrnCreatedBy', attributes: ['id', 'email'] },
          { model: User, as: 'ApprovedBy', attributes: ['id', 'email'] },
          {
            model: GRNLine,
            as: 'Line',
            include: [
              {
                model: GRNBatch,
                as: 'Batches',
              },
            ],
          },
          {
            model: GRNPhoto,
            as: 'Photos',
            attributes: ['id', 'sku_id', 'url', 'reason', 'created_at'],
          },
        ],
        order: [
          ['created_at', 'DESC'],
          [{ model: GRNLine, as: 'Line' }, 'id', 'ASC'],
          [
            { model: GRNLine, as: 'Line' },
            { model: GRNBatch, as: 'Batches' },
            'id',
            'ASC',
          ],
          [{ model: GRNPhoto, as: 'Photos' }, 'created_at', 'DESC'],
        ],
      });

      if (!grns || grns.length === 0) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: `No GRNs found for PO ID ${poId}`,
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
      console.error('Error fetching GRNs with details:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }
  static async getGrnStats(req: Request, res: Response): Promise<void> {
    try {
      // 1. Total GRNs
      const totalGrns = await GRN.count();

      const grnsWithVariance = await GRN.count({
        where: {
          status: 'partial',
        },
      });

      const pendingQc = await GRN.count({
        where: { status: 'pending-qc' },
      });

      const rtvInitiated = await GRN.count({
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
      console.error('Error fetching GRN stats:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async getGrnDetails(req: Request, res: Response): Promise<void> {
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

      const { count, rows } = await GRN.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: PurchaseOrder,
            as: 'PO',
            attributes: ['id', 'po_id', 'vendor_name', 'approval_status'],
            where: search ? { vendor_name: { [Op.like]: `%${search}%` } } : {},
          },
          {
            model: GRNLine,
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

  static async getGrnById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const grn = await GRN.findByPk(id, {
        include: [
          { model: User, as: 'GrnCreatedBy', attributes: ['id', 'email'] },
          { model: User, as: 'ApprovedBy', attributes: ['id', 'email'] },
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

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: grn,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching GRN:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async updateGrn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const grn = await GRN.findByPk(id);
      if (!grn) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'GRN not found',
        });
        return;
      }

      await grn.update({ ...updates, updated_at: new Date() });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: grn,
        error: null,
      });
    } catch (error: any) {
      console.error('Error updating GRN:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async updateGrnStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const grn = await GRN.findByPk(id);
      if (!grn) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'GRN not found',
        });
        return;
      }

      await grn.update({ status, updated_at: new Date() });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: grn,
        error: null,
      });
    } catch (error: any) {
      console.error('Error updating GRN status:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }

  static async deleteGrn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const grn = await GRN.findByPk(id);
      if (!grn) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'GRN not found',
        });
        return;
      }

      await grn.destroy();

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: `GRN ${id} deleted successfully`,
        error: null,
      });
    } catch (error: any) {
      console.error('Error deleting GRN:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: error.message,
      });
    }
  }
}
