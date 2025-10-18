import { Request, Response } from 'express';
import { ResponseHandler } from '../../middleware/responseHandler';
import { ParentProductMasterDC, DCGrn, DCGrnLine, DCPOProduct, DCPurchaseOrder } from '../../models';
import { Op } from 'sequelize';

interface AuthRequest extends Request {
  user?: any;
}

export class FCSKUController {
  /**
   * Get all SKUs with GRN status (done, rejected, pending) with complete details
   * GET /api/fc/skus/grn-status
   */
  static async getSKUsWithGRNStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { dcId, page = 1, limit = 20, search } = req.query;

      if (!dcId) {
        return ResponseHandler.error(res, 'DC ID is required', 400);
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

      // Get all products with their GRN status
      const { count, rows } = await ParentProductMasterDC.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: DCPOProduct,
            as: 'POProducts',
            required: false,
            include: [
              {
                model: DCPurchaseOrder,
                as: 'PurchaseOrder',
                where: {
                  dcId: dcId
                },
                required: false,
                include: [
                  {
                    model: DCGrn,
                    as: 'DCGrns',
                    required: false,
                    include: [
                      {
                        model: DCGrnLine,
                        as: 'Lines',
                        attributes: ['ordered_qty', 'received_qty', 'line_status', 'sku_id', 'variance_reason']
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        attributes: [
          'id',
          'catalogue_id',
          'name',
          'description',
          'mrp',
          'ean_upc',
          'weight',
          'length',
          'height',
          'width',
          'gst',
          'cess',
          'status',
          'category_id',
          'brand_id',
          'hsn',
          'image_url',
          'inventory_threshold'
        ],
        limit: parseInt(limit.toString()),
        offset,
        order: [['name', 'ASC']],
        distinct: true
      });

      // Process the data to include GRN status and quantities
      const processedData = rows.map((product: any) => {
        const poProducts = product.POProducts || [];
        
        // Calculate GRN status and quantities
        let grnStatus = 'NO_GRN';
        let totalOrderedQuantity = 0;
        let totalReceivedQuantity = 0;
        let grnDetails: any[] = [];

        // Collect all GRNs from all PO products
        const allGrns: any[] = [];
        poProducts.forEach((poProduct: any) => {
          const purchaseOrder = poProduct.PurchaseOrder;
          if (purchaseOrder && purchaseOrder.DCGrns) {
            allGrns.push(...purchaseOrder.DCGrns);
          }
        });

        if (allGrns.length > 0) {
          allGrns.forEach((grn: any) => {
            const lines = grn.Lines || [];
            lines.forEach((line: any) => {
              totalOrderedQuantity += line.ordered_qty || 0;
              totalReceivedQuantity += line.received_qty || 0;
              
              grnDetails.push({
                grnId: grn.id,
                grnStatus: grn.status,
                lineStatus: line.line_status,
                orderedQuantity: line.ordered_qty,
                receivedQuantity: line.received_qty,
                sku: line.sku_id,
                varianceReason: line.variance_reason
              });
            });
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

        return {
          ...product.toJSON(),
          grnStatus,
          totalOrderedQuantity,
          totalReceivedQuantity,
          availableQuantity: totalReceivedQuantity, // Available for FC-PO
          grnDetails
        };
      });

      return ResponseHandler.success(res, {
        message: 'SKUs with GRN status retrieved successfully',
        data: processedData,
        pagination: {
          total: count,
          page: parseInt(page.toString()),
          pages: Math.ceil(count / parseInt(limit.toString())),
          limit: parseInt(limit.toString()),
        },
      });

    } catch (error: any) {
      console.error('Get SKUs with GRN status error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch SKUs with GRN status', 500);
    }
  }

  /**
   * Get all SKUs that have been GRN done (available for FC-PO)
   * GET /api/fc/skus/grn-completed
   */
  static async getGRNCompletedSKUs(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { dcId, page = 1, limit = 20, search } = req.query;

      if (!dcId) {
        return ResponseHandler.error(res, 'DC ID is required', 400);
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

      // Get products that have been GRN'd from the specified DC
      const { count, rows } = await ParentProductMasterDC.findAndCountAll({
        where: {
          ...whereClause,
          // Add condition to check if product has been GRN'd
          // This is a simplified approach - you might need to adjust based on your GRN logic
        },
        include: [
          {
            model: DCGrn,
            as: 'DCGrns',
            where: {
              dc_id: dcId,
              status: { [Op.in]: ['completed', 'partial'] } // GRN completed or partially completed
            },
            required: true, // Inner join - only products with GRN
            include: [
              {
                model: DCGrnLine,
                as: 'Lines',
                attributes: ['quantity', 'received_quantity', 'status']
              }
            ]
          }
        ],
        attributes: [
          'id',
          'catalogue_id',
          'name',
          'description',
          'mrp',
          'ean_upc',
          'weight',
          'length',
          'height',
          'width',
          'gst',
          'cess',
          'status',
          'category_id',
          'brand_id',
          'hsn',
          'image_url',
          'inventory_threshold'
        ],
        limit: parseInt(limit.toString()),
        offset,
        order: [['name', 'ASC']],
        distinct: true
      });

      return ResponseHandler.success(res, {
        message: 'GRN completed SKUs retrieved successfully',
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page.toString()),
          pages: Math.ceil(count / parseInt(limit.toString())),
          limit: parseInt(limit.toString()),
        },
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

      const sku = await ParentProductMasterDC.findOne({
        where: { catalogue_id: catalogueId },
        attributes: [
          'id',
          'catalogue_id',
          'name',
          'description',
          'mrp',
          'ean_upc',
          'weight',
          'length',
          'height',
          'width',
          'gst',
          'cess',
          'status',
          'category_id',
          'brand_id',
          'hsn',
          'image_url',
          'inventory_threshold'
        ]
      });

      if (!sku) {
        return ResponseHandler.error(res, 'SKU not found', 404);
      }

      return ResponseHandler.success(res, {
        message: 'SKU details retrieved successfully',
        data: sku,
      });

    } catch (error: any) {
      console.error('Get SKU by catalogue ID error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch SKU details', 500);
    }
  }
}
