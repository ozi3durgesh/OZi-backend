import { Request, Response } from 'express';
import { ResponseHandler } from '../../middleware/responseHandler';
import sequelize from '../../config/database';
import { FCPurchaseOrder, FCPOSkuMatrix, FCGrn, FCGrnLine, DCPurchaseOrder, DCPOSkuMatrix, DCGrn, DCGrnLine, ProductMaster } from '../../models';
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
      const { fcId, dcId, page = 1, limit = 20, search, dcPoId } = req.query;

      if (!fcId) {
        return ResponseHandler.error(res, 'FC ID is required', 400);
      }

      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

      // Get all DC GRN lines with completed, partial, or rejected status
      const dcPoWhere: any = { status: 'approved' };
      if (dcPoId) {
        dcPoWhere.id = Number(dcPoId);
      }
      const dcGrnLines = await DCGrnLine.findAll({
        where: {
          line_status: {
            [Op.in]: ['completed', 'partial', 'rejected']
          }
        },
        include: [
          {
            model: DCGrn,
            as: 'DCGrn',
            required: true,
            include: [
              {
                model: DCPurchaseOrder,
                as: 'DCPO',
                required: true,
                where: dcPoWhere
              }
            ]
          }
        ]
      });

      // Get all FC GRN lines with completed, partial, or rejected status
      const fcGrnLines = await FCGrnLine.findAll({
        where: {
          line_status: {
            [Op.in]: ['completed', 'partial', 'rejected']
          }
        },
        include: [
          {
            model: FCGrn,
            as: 'FCGrn',
            required: true,
            include: [
              {
                model: FCPurchaseOrder,
                as: 'FCPO',
                required: true,
                where: {
                  fcId: fcId,
                  status: 'APPROVED'
                }
              }
            ]
          }
        ]
      });

      // Precompute raised FC-PO quantity per SKU for this FC and optional DC PO
      const fcIdNum = Number(fcId);
      const dcPoIdNum = dcPoId ? Number(dcPoId) : null;
      const raisedRows: any[] = await sequelize.query(
        `SELECT m.sku AS sku, SUM(m.quantity) AS raisedQuantity
         FROM fc_po_sku_matrix m
         INNER JOIN fc_purchase_orders p ON p.id = m.fc_po_id
         WHERE p.fc_id = :fcId
           ${dcPoId ? 'AND p.dc_po_id = :dcPoId' : ''}
         GROUP BY m.sku`,
        { type: (sequelize as any).QueryTypes?.SELECT || require('sequelize').QueryTypes.SELECT, replacements: { fcId: fcIdNum, dcPoId: dcPoIdNum } }
      );
      const raisedBySku = new Map<string, number>(raisedRows.map((r: any) => [String(r.sku), Number(r.raisedQuantity || 0)]));

      // Process DC GRN lines
      const dcData = new Map();
      dcGrnLines.forEach((line: any) => {
        const po = line.DCGrn.DCPO;
        const skuId = line.sku_id;
        
        if (!dcData.has(po.id)) {
          dcData.set(po.id, {
            po: {
              id: po.id,
              poCode: po.poId,
              poType: 'DC',
              status: po.status,
              priority: po.priority,
              totalAmount: po.totalAmount,
              createdAt: po.createdAt
            },
            products: new Map()
          });
        }

        const poData = dcData.get(po.id);
        if (!poData.products.has(skuId)) {
          poData.products.set(skuId, {
            sku_id: skuId,
            ordered_qty: line.ordered_qty,
            received_qty: line.received_qty,
            qc_pass_qty: line.qc_pass_qty,
            line_status: line.line_status,
            grnDetails: []
          });
        }

        const product = poData.products.get(skuId);
        product.grnDetails.push({
          grnId: line.DCGrn.id,
          grnStatus: line.DCGrn.status,
          lineStatus: line.line_status,
          orderedQuantity: line.ordered_qty,
          receivedQuantity: line.received_qty,
          qcPassQuantity: line.qc_pass_qty,
          sku: line.sku_id,
          varianceReason: line.variance_reason,
          grnType: 'DC'
        });
      });

      // Process FC GRN lines
      const fcData = new Map();
      fcGrnLines.forEach((line: any) => {
        const po = line.FCGrn.FCPO;
        const skuId = line.sku_id;
        
        if (!fcData.has(po.id)) {
          fcData.set(po.id, {
            po: {
              id: po.id,
              poCode: po.fcPOCode,
              poType: 'FC',
              status: po.status,
              priority: po.priority,
              totalAmount: po.totalAmount,
              createdAt: po.createdAt
            },
            products: new Map()
          });
        }

        const poData = fcData.get(po.id);
        if (!poData.products.has(skuId)) {
          poData.products.set(skuId, {
            sku_id: skuId,
            ordered_qty: line.ordered_qty,
            received_qty: line.received_qty,
            qc_pass_qty: line.qc_pass_qty,
            line_status: line.line_status,
            grnDetails: []
          });
        }

        const product = poData.products.get(skuId);
        product.grnDetails.push({
          grnId: line.FCGrn.id,
          grnStatus: line.FCGrn.status,
          lineStatus: line.line_status,
          orderedQuantity: line.ordered_qty,
          receivedQuantity: line.received_qty,
          qcPassQuantity: line.qc_pass_qty,
          sku: line.sku_id,
          varianceReason: line.variance_reason,
          grnType: 'FC'
        });
      });

      // Combine and process data
      let allData = [...Array.from(dcData.values()), ...Array.from(fcData.values())];
      // If dcPoId is provided, restrict to the specific DC PO only
      if (dcPoId) {
        allData = Array.from(dcData.values()).filter((entry: any) => entry.po.id === Number(dcPoId));
      }
      
      const processedData = await Promise.all(allData.map(async (poData: any) => {
        const products: any[] = [];
        let poLevelGstType: string | null = null;
        if (poData.po.poType === 'DC') {
          const anySku = await DCPOSkuMatrix.findOne({
            where: { dcPOId: poData.po.id },
            attributes: ['gstType']
          });
          poLevelGstType = anySku ? (anySku as any).gstType : null;
        }
        
        for (const [skuId, productData] of poData.products) {
          // Prefer product details from DCPOSkuMatrix for DC POs; fallback to ProductMaster otherwise
          if (poData.po.poType === 'DC') {
            const dcSku = await DCPOSkuMatrix.findOne({
              where: { dcPOId: poData.po.id, sku: skuId }
            });

            if (dcSku) {
              products.push({
                // id: dcSku.id,
                // status: null,
                catelogue_id: dcSku.catalogue_id,
                // product_id: null,
                sku_id: dcSku.sku,
                color: dcSku.color,
                age_size: dcSku.size,
                name: dcSku.product_name,
                category: dcSku.category,
                description: dcSku.description,
                image_url: dcSku.image_url,
                mrp: dcSku.mrp,
                // avg_cost_to_ozi: null,
                ean_upc: dcSku.ean_upc,
                brand_name: dcSku.brand,
                weight: dcSku.weight,
                length: dcSku.length,
                height: dcSku.height,
                width: dcSku.width,
                inventory_threshold: dcSku.inventory_threshold,
                gst: dcSku.gst,
                cess: dcSku.cess,
                hsn: dcSku.hsn,
                // created_by: null,
                created_at: dcSku.createdAt,
                updated_at: dcSku.updatedAt,
                // Extra DC PO SKU matrix fields for completeness
                dcPOProductId: dcSku.dcPOProductId,
                // quantity: dcSku.quantity,
                rlp: dcSku.rlp,
                rlp_w_o_tax: dcSku.rlp_w_o_tax,
                // gstType: dcSku.gstType,
                selling_price: dcSku.selling_price,
                margin: dcSku.margin,
                poId: poData.po.id,
                poCode: poData.po.poCode,
                poType: poData.po.poType,
                totalOrderedQuantity: productData.ordered_qty,
                totalReceivedQuantity: productData.received_qty,
                availableQuantity: Math.max(0, (productData.qc_pass_qty || 0) - (raisedBySku.get(String(dcSku.sku)) || 0)),
                grnStatus: productData.line_status.toUpperCase(),
                grnDetails: productData.grnDetails,
                poStatus: poData.po.status,
                priority: poData.po.priority,
                totalAmount: poData.po.totalAmount,
                createdAt: poData.po.createdAt
              });
              continue;
            }
          }

          // Fallback to ProductMaster
          const productMaster = await ProductMaster.findOne({
            where: { sku_id: skuId }
          });

          if (productMaster) {
            products.push({
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
              updated_at: productMaster.updated_at,
              poId: poData.po.id,
              poCode: poData.po.poCode,
              poType: poData.po.poType,
              totalOrderedQuantity: productData.ordered_qty,
              totalReceivedQuantity: productData.received_qty,
              availableQuantity: Math.max(0, (productData.qc_pass_qty || 0) - (raisedBySku.get(String(productMaster.sku_id)) || 0)),
              grnStatus: productData.line_status.toUpperCase(),
              grnDetails: productData.grnDetails,
              poStatus: poData.po.status,
              priority: poData.po.priority,
              totalAmount: poData.po.totalAmount,
              createdAt: poData.po.createdAt
            });
          }
        }

        return {
          po: {
            ...poData.po,
            ...(poLevelGstType ? { gstType: poLevelGstType } : {})
          },
          products: products
        };
      }));

      return ResponseHandler.success(res, {
        message: 'Approved POs ready for GRN retrieved successfully',
        data: processedData,
        pagination: {
          currentPage: parseInt(page.toString()),
          totalPages: Math.ceil(processedData.length / parseInt(limit.toString())),
          totalItems: processedData.length,
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
            model: FCPOSkuMatrix,
            as: 'SkuMatrix',
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
            model: FCPOSkuMatrix,
            as: 'SkuMatrix',
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
