import { Request, Response } from 'express';
import { ResponseHandler } from '../../middleware/responseHandler';
import { FCPurchaseOrder, FCPOProduct, FCGrn, FCGrnLine, DCPurchaseOrder, DCPOProduct, DCGrn, DCGrnLine, ProductMaster } from '../../models';
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
      const { fcId, dcId, page = 1, limit = 20, search } = req.query;

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
      const { count: fcCount, rows: fcRows } = await FCPurchaseOrder.findAndCountAll({
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
                model: ProductMaster,
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

      // Get completed DC GRNs that are ready for FC processing
      const dcWhereClause: any = {
        status: 'completed'
      };
      
      // Note: dcId filter is optional for now to show all completed DC GRNs
      // if (dcId) {
      //   dcWhereClause.dc_id = dcId;
      // }

      const { count: dcCount, rows: dcRows } = await DCPurchaseOrder.findAndCountAll({
        where: {
          status: 'APPROVED',
          ...whereClause
        },
        include: [
          {
            model: DCPOProduct,
            as: 'Products',
            required: false,
            include: [
              {
                model: ProductMaster,
                as: 'Product',
                required: true
              }
            ]
          },
          {
            model: DCGrn,
            as: 'DCGrns',
            where: dcWhereClause,
            required: true,
            include: [
              {
                model: DCGrnLine,
                as: 'Lines',
                required: true
              }
            ]
          }
        ],
        limit: parseInt(limit.toString()),
        offset: offset,
        order: [['createdAt', 'DESC']],
        distinct: true
      });

      // Combine FC and DC data
      const allRows = [...fcRows, ...dcRows];
      const totalCount = fcCount + dcCount;

      // Process the data to include GRN status and quantities
      const processedData = allRows.map((po: any) => {
        const products = po.Products || [];
        const isDCPO = po.DCGrns && po.DCGrns.length > 0;
        const grns = isDCPO ? po.DCGrns : (po.FCGrns || []);
        
        // Calculate GRN status and quantities for each product
        const processedProducts = products.map((product: any) => {
          const productInfo = product.Product;
          let grnStatus = 'NO_GRN';
          let totalOrderedQuantity = product.total_quantity || product.quantity || 0;
          let totalReceivedQuantity = 0;
          let grnDetails: any[] = [];

          // Check if GRN exists for this PO and product
          if (grns.length > 0) {
            grns.forEach((grn: any) => {
              const lines = isDCPO ? grn.Lines : (grn.Line || []);
              // For DC, match by sku_id, for FC match by sku
              const productLine = lines.find((line: any) => 
                isDCPO ? line.sku_id === productInfo.sku_id : line.sku_id === productInfo.sku
              );
              
              if (productLine) {
                totalReceivedQuantity += productLine.received_qty || 0;
                
                grnDetails.push({
                  grnId: grn.id,
                  grnStatus: grn.status,
                  lineStatus: productLine.line_status,
                  orderedQuantity: productLine.ordered_qty,
                  receivedQuantity: productLine.received_qty,
                  sku: productLine.sku_id,
                  varianceReason: productLine.variance_reason,
                  grnType: isDCPO ? 'DC' : 'FC'
                });

                // Use the actual line_status from DC GRN data
                // If multiple GRN lines exist, use the most recent status
                if (grnStatus === 'NO_GRN' || productLine.line_status === 'completed') {
                  grnStatus = productLine.line_status.toUpperCase();
                }
              }
            });
          }

          // Handle different product model structures
          const productData = isDCPO ? {
            id: productInfo.id,
            name: productInfo.name,
            description: productInfo.description,
            mrp: productInfo.mrp,
            ean_upc: productInfo.ean_upc,
            image_url: productInfo.image_url,
            weight: productInfo.weight,
            length: productInfo.length,
            height: productInfo.height,
            width: productInfo.width,
            gst: productInfo.gst,
            cess: productInfo.cess,
            hsn: productInfo.hsn,
            sku: productInfo.sku_id, // Use sku_id from ProductMaster table
            catelogue_id: productInfo.catelogue_id, // Add catalogue_id
            category_id: productInfo.category_id,
            brand_id: productInfo.brand_id
          } : productInfo.toJSON();

          return {
            ...productData,
            poId: po.id,
            poCode: isDCPO ? po.poId : po.fcPOCode,
            poType: isDCPO ? 'DC' : 'FC',
            totalOrderedQuantity,
            totalReceivedQuantity,
            availableQuantity: totalReceivedQuantity, // Available for FC operations
            grnStatus,
            grnDetails,
            poStatus: po.status,
            priority: po.priority,
            totalAmount: po.totalAmount,
            createdAt: po.createdAt
          };
        });

        return {
          po: {
            id: po.id,
            poCode: isDCPO ? po.poId : po.fcPOCode,
            poType: isDCPO ? 'DC' : 'FC',
            status: po.status,
            priority: po.priority,
            totalAmount: po.totalAmount,
            createdAt: po.createdAt
          },
          products: processedProducts
        };
      });

      return ResponseHandler.success(res, {
        message: 'Approved POs ready for GRN retrieved successfully',
        data: processedData,
        pagination: {
          currentPage: parseInt(page.toString()),
          totalPages: Math.ceil(totalCount / parseInt(limit.toString())),
          totalItems: totalCount,
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
                model: ProductMaster,
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
   * Get all products from ProductMaster with pagination
   * GET /api/dc/fetchSKU/All
   */
  static async getAllProducts(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 20, search, status, category, brand_id } = req.query;

      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

      // Build search conditions
      const whereClause: any = {};
      
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { sku_id: { [Op.like]: `%${search}%` } },
          { catelogue_id: { [Op.like]: `%${search}%` } },
          { product_id: { [Op.like]: `%${search}%` } },
          { ean_upc: { [Op.like]: `%${search}%` } },
          { hsn: { [Op.like]: `%${search}%` } }
        ];
      }

      if (status !== undefined) {
        whereClause.status = status;
      }

      if (category) {
        whereClause.category = { [Op.like]: `%${category}%` };
      }

      if (brand_id) {
        whereClause.brand_id = brand_id;
      }

      const { count, rows } = await ProductMaster.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit.toString()),
        offset: offset,
        order: [['created_at', 'DESC']]
      });

      return ResponseHandler.success(res, {
        message: 'All products retrieved successfully',
        data: rows,
        pagination: {
          currentPage: parseInt(page.toString()),
          totalPages: Math.ceil(count / parseInt(limit.toString())),
          totalItems: count,
          itemsPerPage: parseInt(limit.toString())
        }
      });

    } catch (error: any) {
      console.error('Get all products error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to fetch all products', 500);
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

      const product = await ProductMaster.findOne({
        where: { catelogue_id: catalogueId },
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
