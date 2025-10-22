import { Request, Response } from 'express';
import { ResponseHandler } from '../../middleware/responseHandler';
import { ParentProductMasterDC, FCPurchaseOrder, FCPOProduct, FCGrn, FCGrnLine } from '../../models';
import { Op } from 'sequelize';

interface AuthRequest extends Request {
  user?: any;
}

export class FCSKUController {
  /**
   * Get all approved FC-POs ready for GRN with complete details
   * GET /api/fc/skus/grn-status
   */
  static async getSKUsWithGRNStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { fcId, page = 1, limit = 20, search } = req.query;

      if (!fcId) {
        return ResponseHandler.error(res, 'FC ID is required', 400);
      }

      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

      // Build search conditions
      const whereClause: any = {};
      if (search) {
        whereClause[Op.or] = [
          { fcPOCode: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ];
      }

      // Get all approved FC-POs with their products ready for GRN
      const { count, rows } = await FCPurchaseOrder.findAndCountAll({
        where: {
          fcId: fcId,
          status: 'APPROVED',
          ...whereClause
        },
        include: [
          {
            model: FCPOProduct,
            as: 'Products',
            required: false,
            include: [
              {
                model: ParentProductMasterDC,
                as: 'Product',
                required: true
              }
            ]
          },
          {
            model: FCGrn,
            as: 'FCGrns',
            required: false,
            include: [
              {
                model: FCGrnLine,
                as: 'Line',
                required: false
              }
            ]
          }
        ],
        limit: parseInt(limit.toString()),
        offset: offset,
        order: [['createdAt', 'DESC']],
        distinct: true
      });

      // Process the data to include GRN status and quantities
      const processedData = rows.map((fcPO: any) => {
        const products = fcPO.Products || [];
        const fcGrns = fcPO.FCGrns || [];
        
        // Calculate GRN status and quantities for each product
        const processedProducts = products.map((product: any) => {
          const productInfo = product.Product;
          let grnStatus = 'NO_GRN';
          let totalOrderedQuantity = product.total_quantity || 0;
          let totalReceivedQuantity = 0;
          let grnDetails: any[] = [];

          // Check if GRN exists for this FC PO and product
          if (fcGrns.length > 0) {
            fcGrns.forEach((grn: any) => {
              const lines = grn.Line || [];
              const productLine = lines.find((line: any) => line.sku_id === productInfo.sku);
              
              if (productLine) {
                totalReceivedQuantity += productLine.received_qty || 0;
                
                grnDetails.push({
                  grnId: grn.id,
                  grnStatus: grn.status,
                  lineStatus: productLine.line_status,
                  orderedQuantity: productLine.ordered_qty,
                  receivedQuantity: productLine.received_qty,
                  sku: productLine.sku_id,
                  varianceReason: productLine.variance_reason
                });

                // Determine overall GRN status
                if (totalReceivedQuantity === 0) {
                  grnStatus = 'PENDING';
                } else if (totalReceivedQuantity >= totalOrderedQuantity) {
                  grnStatus = 'COMPLETED';
                } else {
                  grnStatus = 'PARTIAL';
                }
              }
            });
          }

          return {
            ...productInfo.toJSON(),
            fcPOId: fcPO.id,
            fcPOCode: fcPO.fcPOCode,
            totalOrderedQuantity,
            totalReceivedQuantity,
            availableQuantity: totalReceivedQuantity, // Available for FC operations
            grnStatus,
            grnDetails,
            fcPOStatus: fcPO.status,
            priority: fcPO.priority,
            totalAmount: fcPO.totalAmount,
            createdAt: fcPO.createdAt
          };
        });

        return {
          fcPO: {
            id: fcPO.id,
            fcPOCode: fcPO.fcPOCode,
            status: fcPO.status,
            priority: fcPO.priority,
            totalAmount: fcPO.totalAmount,
            createdAt: fcPO.createdAt
          },
          products: processedProducts
        };
      });

      return ResponseHandler.success(res, {
        message: 'Approved FC-POs ready for GRN retrieved successfully',
        data: processedData,
        pagination: {
          currentPage: parseInt(page.toString()),
          totalPages: Math.ceil(count / parseInt(limit.toString())),
          totalItems: count,
          itemsPerPage: parseInt(limit.toString())
        }
      });

    } catch (error: any) {
      console.error('Get FC-POs ready for GRN error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch approved FC-POs ready for GRN', 500);
    }
  }

  /**
   * Get all SKUs that have been GRN completed (available for FC operations)
   * GET /api/fc/skus/grn-completed
   */
  static async getGRNCompletedSKUs(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { fcId, page = 1, limit = 20, search } = req.query;

      if (!fcId) {
        return ResponseHandler.error(res, 'FC ID is required', 400);
      }

      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

      // Build search conditions
      const whereClause: any = {};
      if (search) {
        whereClause[Op.or] = [
          { catalogue_id: { [Op.like]: `%${search}%` } },
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { sku: { [Op.like]: `%${search}%` } },
        ];
      }

      // Get FC-POs with completed GRNs
      const { count, rows } = await FCPurchaseOrder.findAndCountAll({
        where: {
          fcId: fcId,
          status: 'APPROVED',
          ...whereClause
        },
        include: [
          {
            model: FCPOProduct,
            as: 'Products',
            required: false,
            include: [
              {
                model: ParentProductMasterDC,
                as: 'Product',
                required: true
              }
            ]
          },
          {
            model: FCGrn,
            as: 'FCGrns',
            required: true,
            where: {
              status: 'completed'
            },
            include: [
              {
                model: FCGrnLine,
                as: 'Line',
                required: true,
                where: {
                  line_status: 'completed'
                }
              }
            ]
          }
        ],
        limit: parseInt(limit.toString()),
        offset: offset,
        order: [['createdAt', 'DESC']],
        distinct: true
      });

      // Process the data
      const processedData = rows.map((fcPO: any) => {
        const products = fcPO.Products || [];
        const fcGrns = fcPO.FCGrns || [];
        
        const processedProducts = products.map((product: any) => {
          const productInfo = product.Product;
          let totalReceivedQuantity = 0;
          let grnDetails: any[] = [];

          // Calculate total received quantity from completed GRNs
          fcGrns.forEach((grn: any) => {
            const lines = grn.Lines || [];
            const productLine = lines.find((line: any) => line.sku_id === productInfo.sku);
            
            if (productLine) {
              totalReceivedQuantity += productLine.received_qty || 0;
              
              grnDetails.push({
                grnId: grn.id,
                grnStatus: grn.status,
                lineStatus: productLine.line_status,
                orderedQuantity: productLine.ordered_qty,
                receivedQuantity: productLine.received_qty,
                sku: productLine.sku_id,
                varianceReason: productLine.variance_reason
              });
            }
          });

          return {
            ...productInfo.toJSON(),
            fcPOId: fcPO.id,
            fcPOCode: fcPO.fcPOCode,
            totalReceivedQuantity,
            availableQuantity: totalReceivedQuantity, // Available for FC operations
            grnStatus: 'COMPLETED',
            grnDetails,
            fcPOStatus: fcPO.status,
            priority: fcPO.priority,
            totalAmount: fcPO.totalAmount,
            createdAt: fcPO.createdAt
          };
        });

        return {
          fcPO: {
            id: fcPO.id,
            fcPOCode: fcPO.fcPOCode,
            status: fcPO.status,
            priority: fcPO.priority,
            totalAmount: fcPO.totalAmount,
            createdAt: fcPO.createdAt
          },
          products: processedProducts
        };
      });

      return ResponseHandler.success(res, {
        message: 'GRN completed SKUs retrieved successfully',
        data: processedData,
        pagination: {
          currentPage: parseInt(page.toString()),
          totalPages: Math.ceil(count / parseInt(limit.toString())),
          totalItems: count,
          itemsPerPage: parseInt(limit.toString())
        }
      });

    } catch (error: any) {
      console.error('Get GRN completed SKUs error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch GRN completed SKUs', 500);
    }
  }

  /**
   * Get SKU details by catalogue ID for FC-PO
   * GET /api/fc/skus/:catalogueId
   */
  static async getSKUByCatalogueId(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { catalogueId } = req.params;

      if (!catalogueId) {
        return ResponseHandler.error(res, 'Catalogue ID is required', 400);
      }

      const product = await ParentProductMasterDC.findOne({
        where: { catalogue_id: catalogueId },
        include: [
          {
            model: FCPOProduct,
            as: 'FCPOProducts',
            required: false,
            include: [
              {
                model: FCPurchaseOrder,
                as: 'PurchaseOrder',
                required: false
              }
            ]
          }
        ]
      });

      if (!product) {
        return ResponseHandler.error(res, 'Product not found', 404);
      }

      return ResponseHandler.success(res, {
        message: 'Product details retrieved successfully',
        data: product
      });

    } catch (error: any) {
      console.error('Get SKU by catalogue ID error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch product details', 500);
    }
  }
}
