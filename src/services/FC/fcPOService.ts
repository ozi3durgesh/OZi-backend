import { Transaction, QueryTypes } from 'sequelize';
import sequelize from '../../config/database';
import FCPurchaseOrder from '../../models/FCPurchaseOrder';
import FCPOProduct from '../../models/FCPOProduct';
import FCPOApproval from '../../models/FCPOApproval';
import FCPOSkuMatrix from '../../models/FCPOSkuMatrix';
import ParentProductMasterDC from '../../models/ParentProductMasterDC';
import User from '../../models/User';
import FulfillmentCenter from '../../models/FulfillmentCenter';
import DistributionCenter from '../../models/DistributionCenter';
import { FC_PO_CONSTANTS } from '../../constants/fcPOConstants';
import { Op } from 'sequelize';

export class FCPOService {
  /**
   * Create a new FC Purchase Order
   */
  static async createFCPO(data: {
    fcId: number;
    dcId: number;
    products: any[];
    description?: string;
    notes?: string;
    priority?: string;
    createdBy: number;
  }): Promise<FCPurchaseOrder> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      // Generate PO ID
      const latestPO = await FCPurchaseOrder.findOne({
        order: [['id', 'DESC']],
        transaction,
      });

      let nextPoId = 'FCPO1';
      if (latestPO && latestPO.poId) {
        const lastPoNumber = parseInt(latestPO.poId.replace('FCPO', '')) || 0;
        nextPoId = `FCPO${lastPoNumber + 1}`;
      }

      // Calculate total amount
      const totalAmount = data.products.reduce((sum, product) => {
        return sum + (product.totalPrice || 0);
      }, 0);

      // Create FC Purchase Order
      const fcPO = await FCPurchaseOrder.create(
        {
          poId: nextPoId,
          fcId: data.fcId,
          dcId: data.dcId,
          totalAmount,
          status: 'DRAFT',
          priority: (data.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM',
          description: data.description,
          notes: data.notes,
          createdBy: data.createdBy,
        },
        { transaction }
      );

      // Process products
      const productRecords: any[] = [];
      const skuMatrixRecords: any[] = [];

      for (const product of data.products) {
        // Find the product by catalogue_id
        const parentProduct = await ParentProductMasterDC.findOne({
          where: { catalogue_id: product.catelogue_id },
          transaction,
        });

        if (!parentProduct) {
          throw new Error(`Product with catalogue_id ${product.catelogue_id} not found`);
        }

        // Create main product record
        const productRecord = {
          fcPOId: fcPO.id,
          productId: parentProduct.id,
          catalogueId: product.catelogue_id.toString(),
          productName: product.product_name || parentProduct.name,
          description: product.description || parentProduct.description,
          quantity: product.total_quantity,
          unitPrice: product.totalPrice / product.total_quantity, // Calculate unit price
          totalAmount: product.totalPrice,
          mrp: product.mrp || parentProduct.mrp,
          cost: product.totalPrice / product.total_quantity, // Use unit price as cost
          notes: product.notes || '',
          hsn: product.hsn || parentProduct.hsn || '00000000',
          eanUpc: product.ean_upc || parentProduct.ean_upc || '00000000000000',
          weight: product.weight || parentProduct.weight || 0,
          length: product.length || parentProduct.length || 0,
          height: product.height || parentProduct.height || 0,
          width: product.width || parentProduct.width || 0,
          inventoryThreshold: 0,
          gst: product.gst || parentProduct.gst || 0,
          cess: product.cess || parentProduct.cess || 0,
          imageUrl: product.image_url || parentProduct.image_url || '',
          brandId: product.brand_id || parentProduct.brand_id || 1,
          categoryId: product.category_id || parentProduct.category_id || 1,
          status: 1,
        };

        productRecords.push(productRecord);
      }

      const createdProducts = await FCPOProduct.bulkCreate(productRecords, { transaction });
      
      // Process SKU matrix and store in fc_po_sku_matrix table
      for (let i = 0; i < data.products.length; i++) {
        const product = data.products[i];
        const createdProduct = createdProducts[i];
        
        if (product.sku_matrix_on_catelogue_id && Array.isArray(product.sku_matrix_on_catelogue_id)) {
          for (const skuItem of product.sku_matrix_on_catelogue_id) {
            const skuMatrixRecord = {
              fcPOId: fcPO.id,
              fcPOProductId: createdProduct.id,
              catalogueId: skuItem.catalogue_id || product.catelogue_id,
              sku: skuItem.sku,
              productName: skuItem.product_name,
              hsn: skuItem.hsn,
              mrp: parseFloat(skuItem.mrp) || 0,
              eanUpc: skuItem.ean_upc,
              brand: skuItem.brand,
              weight: skuItem.weight || 0,
              length: skuItem.length || 0,
              height: skuItem.height || 0,
              width: skuItem.width || 0,
              gst: parseFloat(skuItem.gst) || 0,
              cess: parseFloat(skuItem.cess) || 0,
              sellingPrice: parseFloat(skuItem.selling_price) || 0,
              rlp: parseFloat(skuItem.rlp) || 0,
              rlpWithoutTax: parseFloat(skuItem.rlp_w_o_tax) || 0,
              gstType: skuItem.gstType as 'SGST+CGST' | 'IGST' | 'NONE' || 'NONE',
              quantity: skuItem.quantity || 0,
              totalAmount: (parseFloat(skuItem.selling_price) || 0) * (skuItem.quantity || 0),
              status: 'PENDING' as 'PENDING' | 'READY_FOR_GRN' | 'PROCESSED',
              createdBy: data.createdBy,
            };
            skuMatrixRecords.push(skuMatrixRecord);
          }
          
          // Update the FCPOProduct with the SKU matrix JSON data
          await createdProduct.update({
            skuMatrixOnCatalogueId: JSON.stringify(product.sku_matrix_on_catelogue_id)
          }, { transaction });
        }
      }

      // Create SKU matrix records using raw SQL to bypass Sequelize caching issues
      if (skuMatrixRecords.length > 0) {
        for (const record of skuMatrixRecords) {
          await sequelize.query(
            `INSERT INTO fc_po_sku_matrix (
              fc_po_id, fc_po_product_id, catalogue_id, sku, product_name, hsn, mrp, ean_upc, 
              brand, weight, length, height, width, gst, cess, selling_price, rlp, rlp_without_tax, 
              gst_type, quantity, total_amount, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: [
                record.fcPOId, record.fcPOProductId, record.catalogueId, record.sku, record.productName,
                record.hsn, record.mrp, record.eanUpc, record.brand, record.weight, record.length,
                record.height, record.width, record.gst, record.cess, record.sellingPrice, record.rlp,
                record.rlpWithoutTax, record.gstType, record.quantity, record.totalAmount, record.status,
                record.createdBy
              ],
              transaction,
              type: QueryTypes.INSERT
            }
          );
        }
      }

      // Create initial approval record for the creator
      await FCPOApproval.create({
        fcPOId: fcPO.id,
        approverId: data.createdBy,
        status: 'PENDING',
        comments: 'Initial creation - pending approval',
      }, { transaction });

      await transaction.commit();

      // Return the created PO with products (outside transaction)
      try {
        const result = await FCPurchaseOrder.findByPk(fcPO.id, {
        include: [
          {
            model: FCPOProduct,
            as: 'Products',
            include: [
              {
                model: ParentProductMasterDC,
                as: 'Product',
                attributes: ['id', 'catalogue_id', 'name', 'description', 'mrp'],
              },
            ],
          },
          {
            model: FCPOApproval,
            as: 'Approvals',
            include: [
              {
                model: User,
                as: 'Approver',
                attributes: ['id', 'email', 'name'],
              },
            ],
          },
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'email', 'name'],
          },
          {
            model: FulfillmentCenter,
            as: 'FulfillmentCenter',
            attributes: ['id', 'name', 'address'],
          },
          {
            model: DistributionCenter,
            as: 'DistributionCenter',
            attributes: ['id', 'name', 'address'],
          },
        ],
      });
      
      if (!result) {
        throw new Error('Failed to retrieve created FC Purchase Order');
      }
      
      // Fetch SKU matrix data separately
      const skuMatrixData = await FCPOSkuMatrix.findAll({
        where: { fcPOId: fcPO.id },
        attributes: [
          'id', 'fcPOProductId', 'catalogueId', 'sku', 'productName', 'hsn', 'mrp', 'eanUpc', 
          'brand', 'weight', 'length', 'height', 'width', 'gst', 'cess',
          'sellingPrice', 'rlp', 'rlpWithoutTax', 'gstType', 'quantity', 
          'totalAmount', 'status', 'createdAt', 'updatedAt'
        ],
      });
      
        // Attach SKU matrix data to result
        (result as any).SkuMatrix = skuMatrixData;
        
        return result;
      } catch (fetchError) {
        // If fetch fails, return minimal data
        console.error('Failed to fetch complete PO data:', fetchError);
        return {
          id: fcPO.id,
          poId: fcPO.poId,
          fcId: fcPO.fcId,
          dcId: fcPO.dcId,
          totalAmount: fcPO.totalAmount,
          status: fcPO.status,
          priority: fcPO.priority,
          description: fcPO.description,
          notes: fcPO.notes,
          createdBy: fcPO.createdBy,
          createdAt: fcPO.createdAt,
          updatedAt: fcPO.updatedAt,
        } as any;
      }
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Submit FC Purchase Order for approval
   */
  static async submitForApproval(fcPOId: number, userId: number): Promise<FCPurchaseOrder> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const fcPO = await FCPurchaseOrder.findByPk(fcPOId, { transaction });

      if (!fcPO) {
        throw new Error(FC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND);
      }

      if (fcPO.status !== 'DRAFT') {
        throw new Error('Only draft FC Purchase Orders can be submitted for approval');
      }

      // Update status to pending approval
      fcPO.status = 'PENDING_APPROVAL';
      fcPO.updatedBy = userId;
      await fcPO.save({ transaction });

      // Create approval record
      await FCPOApproval.create(
        {
          fcPOId: fcPO.id,
          approverId: userId, // Use the user who submitted for approval
          status: 'PENDING',
        },
        { transaction }
      );

      await transaction.commit();

      const result = await FCPurchaseOrder.findByPk(fcPO.id, {
        include: [
          {
            model: FCPOProduct,
            as: 'Products',
          },
          {
            model: FCPOApproval,
            as: 'Approvals',
          },
        ],
      });
      
      if (!result) {
        throw new Error('Failed to retrieve FC Purchase Order');
      }
      
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Process approval/rejection
   */
  static async processApproval(
    fcPOId: number,
    action: 'APPROVED' | 'REJECTED',
    approverId: number,
    approverRole: string,
    comments?: string
  ): Promise<FCPurchaseOrder> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const fcPO = await FCPurchaseOrder.findByPk(fcPOId, { transaction });

      if (!fcPO) {
        throw new Error(FC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND);
      }

      if (!['DRAFT', 'PENDING_APPROVAL'].includes(fcPO.status)) {
        throw new Error('Only draft or pending FC Purchase Orders can be approved/rejected');
      }

      // Update FC PO status
      if (action === 'APPROVED') {
        fcPO.status = 'APPROVED';
        fcPO.approvedBy = approverId;
        fcPO.approvedAt = new Date();
      } else {
        fcPO.status = 'REJECTED';
        fcPO.rejectedBy = approverId;
        fcPO.rejectedAt = new Date();
        fcPO.rejectionReason = comments;
      }

      fcPO.updatedBy = approverId;
      await fcPO.save({ transaction });

      // Update approval record
      const approval = await FCPOApproval.findOne({
        where: { fcPOId: fcPO.id },
        transaction,
      });

      if (approval) {
        approval.status = action;
        approval.approverId = approverId;
        approval.comments = comments;
        approval.approvedAt = action === 'APPROVED' ? new Date() : undefined;
        await approval.save({ transaction });
      }

      await transaction.commit();

      const result = await FCPurchaseOrder.findByPk(fcPO.id, {
        include: [
          {
            model: FCPOProduct,
            as: 'Products',
          },
          {
            model: FCPOApproval,
            as: 'Approvals',
          },
        ],
      });
      
      if (!result) {
        throw new Error('Failed to retrieve FC Purchase Order');
      }

      // Parse skuMatrixOnCatalogueId JSON strings for each product
      const processedResult = {
        ...result.toJSON(),
        Products: result.Products?.map((product: any) => ({
          ...product.toJSON(),
          skuMatrixOnCatalogueId: product.skuMatrixOnCatalogueId 
            ? JSON.parse(product.skuMatrixOnCatalogueId) 
            : null
        }))
      };
      
      return processedResult as any;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get FC Purchase Orders with filters
   */
  static async getFCPOs(
    filters: {
      search?: string;
      status?: string;
      fcId?: number;
      dcId?: number;
      priority?: string;
    },
    page: number,
    limit: number
  ): Promise<{ data: any[]; total: number; page: number; pages: number }> {
    const whereClause: any = {};

    if (filters.search) {
      whereClause[Op.or] = [
        { poId: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } },
        { notes: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.fcId) {
      whereClause.fcId = filters.fcId;
    }

    if (filters.dcId) {
      whereClause.dcId = filters.dcId;
    }

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    const { count, rows } = await FCPurchaseOrder.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: FCPOProduct,
          as: 'Products',
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: User,
          as: 'ApprovedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: User,
          as: 'RejectedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: FulfillmentCenter,
          as: 'FulfillmentCenter',
          attributes: ['id', 'name'],
        },
        {
          model: DistributionCenter,
          as: 'DistributionCenter',
          attributes: ['id', 'name'],
        },
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });

    // Parse skuMatrixOnCatalogueId JSON strings for each product
    const processedRows = rows.map(po => ({
      ...po.toJSON(),
      Products: po.Products?.map((product: any) => ({
        ...product.toJSON(),
        skuMatrixOnCatalogueId: product.skuMatrixOnCatalogueId 
          ? JSON.parse(product.skuMatrixOnCatalogueId) 
          : null
      }))
    }));

    return {
      data: processedRows,
      total: count,
      page,
      pages: Math.ceil(count / limit),
    };
  }

  /**
   * Get FC Purchase Order by ID
   */
  static async getFCPOById(fcPOId: number): Promise<FCPurchaseOrder | null> {
    const fcPO = await FCPurchaseOrder.findByPk(fcPOId, {
      include: [
        {
          model: FCPOProduct,
          as: 'Products',
          include: [
            {
              model: ParentProductMasterDC,
              as: 'Product',
              attributes: ['id', 'catalogue_id', 'name', 'description', 'mrp'],
            },
          ],
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: User,
          as: 'ApprovedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: User,
          as: 'RejectedBy',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: FulfillmentCenter,
          as: 'FulfillmentCenter',
          attributes: ['id', 'name', 'address'],
        },
        {
          model: DistributionCenter,
          as: 'DistributionCenter',
          attributes: ['id', 'name', 'address'],
        },
        {
          model: FCPOApproval,
          as: 'Approvals',
          include: [
            {
              model: User,
              as: 'Approver',
              attributes: ['id', 'email', 'name'],
            },
          ],
        },
      ],
    });

    if (!fcPO) {
      return null;
    }

    // Parse skuMatrixOnCatalogueId JSON strings for each product
    const processedFCPO = {
      ...fcPO.toJSON(),
      Products: fcPO.Products?.map((product: any) => ({
        ...product.toJSON(),
        skuMatrixOnCatalogueId: product.skuMatrixOnCatalogueId 
          ? JSON.parse(product.skuMatrixOnCatalogueId) 
          : null
      }))
    };

    return processedFCPO as any;
  }

  /**
   * Update FC Purchase Order
   */
  static async updateFCPO(
    fcPOId: number,
    updateData: any,
    userId: number
  ): Promise<FCPurchaseOrder> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const fcPO = await FCPurchaseOrder.findByPk(fcPOId, { transaction });

      if (!fcPO) {
        throw new Error(FC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND);
      }

      if (fcPO.status !== 'DRAFT') {
        throw new Error('Only draft FC Purchase Orders can be updated');
      }

      // Update FC PO
      Object.assign(fcPO, updateData);
      fcPO.updatedBy = userId;
      await fcPO.save({ transaction });

      // Update products if provided
      if (updateData.products && Array.isArray(updateData.products)) {
        // Delete existing products
        await FCPOProduct.destroy({
          where: { fcPOId: fcPO.id },
          transaction,
        });

        // Create new products
        const productRecords = updateData.products.map((product: any) => ({
          fcPOId: fcPO.id,
          productId: product.productId,
          catalogueId: product.catalogueId,
          productName: product.productName,
          description: product.description,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          totalAmount: product.totalAmount,
          mrp: product.mrp,
          notes: product.notes,
        }));

        await FCPOProduct.bulkCreate(productRecords, { transaction });

        // Recalculate total amount
        const totalAmount = updateData.products.reduce((sum: number, product: any) => {
          return sum + (product.totalAmount || 0);
        }, 0);

        fcPO.totalAmount = totalAmount;
        await fcPO.save({ transaction });
      }

      await transaction.commit();

      const result = await FCPurchaseOrder.findByPk(fcPO.id, {
        include: [
          {
            model: FCPOProduct,
            as: 'Products',
          },
        ],
      });
      
      if (!result) {
        throw new Error('Failed to retrieve FC Purchase Order');
      }
      
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete FC Purchase Order
   */
  static async deleteFCPO(fcPOId: number): Promise<void> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const fcPO = await FCPurchaseOrder.findByPk(fcPOId, { transaction });

      if (!fcPO) {
        throw new Error(FC_PO_CONSTANTS.ERRORS.PO_NOT_FOUND);
      }

      if (fcPO.status !== 'DRAFT') {
        throw new Error('Only draft FC Purchase Orders can be deleted');
      }

      // Delete related records
      await FCPOProduct.destroy({
        where: { fcPOId: fcPO.id },
        transaction,
      });

      await FCPOApproval.destroy({
        where: { fcPOId: fcPO.id },
        transaction,
      });

      // Delete FC PO
      await fcPO.destroy({ transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get available products for FC PO (products that have been GRN'd from DC)
   */
  static async getAvailableProductsForFCPO(dcId: number): Promise<any[]> {
    // This would typically query products that have been received via GRN from DC
    // For now, we'll return all products from the DC
    return await ParentProductMasterDC.findAll({
      where: {
        // Add any filters for products available for FC PO
        status: 'ACTIVE',
      },
      attributes: ['id', 'catalogue_id', 'name', 'description', 'mrp'],
      order: [['name', 'ASC']],
    });
  }
}
