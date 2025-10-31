import { Transaction, QueryTypes } from 'sequelize';
import sequelize from '../../config/database';
import FCPurchaseOrder from '../../models/FCPurchaseOrder';
import FCPOApproval from '../../models/FCPOApproval';
import FCPOSkuMatrix from '../../models/FCPOSkuMatrix';
import ProductMaster from '../../models/NewProductMaster';
import User from '../../models/User';
import FulfillmentCenter from '../../models/FulfillmentCenter';
import DistributionCenter from '../../models/DistributionCenter';
import { FC_PO_CONSTANTS } from '../../constants/fcPOConstants';
import { Op } from 'sequelize';
import DirectInventoryService from '../DirectInventoryService';
import { INVENTORY_OPERATIONS } from '../../config/inventoryConstants';

export class FCPOService {
  /**
   * Helper function to transform SKU matrix entries grouped by catalogue_id into Products format
   */
  static transformSkuMatrixToProducts(skuMatrixEntries: any[]): any[] {
    // Group by catalogue_id
    const grouped = skuMatrixEntries.reduce((acc: any, sku: any) => {
      const catalogueId = sku.catalogueId || sku.catalogue_id;
      if (!acc[catalogueId]) {
        acc[catalogueId] = {
          catalogue_id: catalogueId,
          skuMatrix: [],
          totalQuantity: 0,
          totalAmount: 0,
        };
      }
      acc[catalogueId].skuMatrix.push(sku);
      acc[catalogueId].totalQuantity += parseInt(sku.quantity || 0);
      const price = parseFloat(sku.rlp || sku.rlpWithoutTax || sku.sellingPrice || sku.selling_price || 0);
      acc[catalogueId].totalAmount += price * parseInt(sku.quantity || 0);
      return acc;
    }, {});

    // Transform to Products format
    return Object.values(grouped).map((group: any) => {
      const firstSku = group.skuMatrix[0];
      const unitPrice = group.totalQuantity > 0 ? group.totalAmount / group.totalQuantity : 0;
      
      return {
        id: firstSku.id, // Use first SKU's ID as product ID
        fcPOId: firstSku.fcPOId,
        productId: 1, // Default product ID
        catalogue_id: group.catalogue_id,
        productName: firstSku.productName || firstSku.product_name || 'Unknown Product',
        quantity: group.totalQuantity,
        unitPrice: unitPrice,
        totalAmount: group.totalAmount,
        mrp: firstSku.mrp ? parseFloat(firstSku.mrp.toString()) : null,
        cost: unitPrice, // Use unit price as cost
        description: firstSku.description || null,
        notes: null,
        hsn: firstSku.hsn || null,
        ean_upc: firstSku.eanUpc || firstSku.ean_upc || null,
        weight: firstSku.weight || null,
        length: firstSku.length || null,
        height: firstSku.height || null,
        width: firstSku.width || null,
        inventory_threshold: null,
        gst: firstSku.gst ? firstSku.gst.toString() : null,
        cess: firstSku.cess ? firstSku.cess.toString() : null,
        image_url: null,
        brand_id: null,
        category_id: firstSku.brand || null,
        status: 1,
        sku_matrix_on_catelogue_id: group.skuMatrix, // Return as array, not stringified JSON
        SkuMatrix: group.skuMatrix,
        createdAt: firstSku.createdAt,
        updatedAt: firstSku.updatedAt,
      };
    });
  }

  /**
   * Create a new FC Purchase Order
   */
  static async createFCPO(data: {
    fcId: number;
    dcId: number;
    dcPoId?: number;
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
          dcPOId: data.dcPoId,
          totalAmount,
          status: 'PENDING_APPROVAL',
          priority: (data.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM',
          description: data.description,
          notes: data.notes,
          createdBy: data.createdBy,
        },
        { transaction }
      );

      // Process products and create SKU matrix entries directly
      const skuMatrixRecords: any[] = [];

      for (const product of data.products) {
        // Find the product by catalogue_id in ProductMaster table
        const parentProduct = await ProductMaster.findOne({
          where: { catelogue_id: product.catelogue_id },
          transaction,
        });

        if (!parentProduct) {
          throw new Error(`Product with catalogue_id ${product.catelogue_id} not found`);
        }
        
        // Process SKU matrix and store in fc_po_sku_matrix table directly
        if (product.sku_matrix_on_catelogue_id && Array.isArray(product.sku_matrix_on_catelogue_id)) {
          for (const skuItem of product.sku_matrix_on_catelogue_id) {
            const skuMatrixRecord = {
              fcPOId: fcPO.id,
              fcPOProductId: null, // No longer needed
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
              totalAmount: (parseFloat(skuItem.rlp || skuItem.selling_price) || 0) * (skuItem.quantity || 0),
              status: 'PENDING' as 'PENDING' | 'READY_FOR_GRN' | 'PROCESSED',
              createdBy: data.createdBy,
            };
            skuMatrixRecords.push(skuMatrixRecord);
          }
        }
      }

      // Create SKU matrix records
      if (skuMatrixRecords.length > 0) {
        await FCPOSkuMatrix.bulkCreate(skuMatrixRecords, { transaction });
      }

      // Create initial approval record for the creator
      await FCPOApproval.create({
        fcPOId: fcPO.id,
        approverId: data.createdBy,
        status: 'PENDING',
        comments: 'Initial creation - pending approval',
      }, { transaction });

      // Update inventory for FC PO raise (before transaction commit)
      console.log('🔄 Updating inventory for FC PO raise...');
      for (const product of data.products) {
        try {
          // Get the actual SKU from SKU matrix if available, otherwise use catalogue_id
          let skuId = product.catelogue_id.toString().padStart(12, '0');
          
          if (product.sku_matrix_on_catelogue_id && product.sku_matrix_on_catelogue_id.length > 0) {
            // Use the first SKU from the matrix as the primary SKU
            skuId = product.sku_matrix_on_catelogue_id[0].sku;
          }
          
          // Always update DC inventory total_available_quantity when FC PO is raised
          // This should happen regardless of FC inventory update success
          try {
            const { DCInventory1Service } = await import('../DCInventory1Service.js');
            await DCInventory1Service.updateOnFCPORaise(
              skuId,
              data.dcId,
              product.total_quantity,
              transaction
            );
            console.log(`✅ DC Inventory total_available_quantity updated for SKU ${skuId} in DC ${data.dcId}`);
          } catch (dcInventoryError: any) {
            console.error(`❌ Error updating DC Inventory for SKU ${skuId}:`, dcInventoryError.message);
          }

          // Try to update FC inventory (may fail due to foreign key constraints)
          try {
            const inventoryResult = await DirectInventoryService.updateInventory({
              sku: skuId,
              operation: INVENTORY_OPERATIONS.PO,
              quantity: product.total_quantity,
              referenceId: `FCPO-${fcPO.id}`,
              operationDetails: {
                fcPOId: fcPO.id,
                fcId: data.fcId,
                dcId: data.dcId,
                product_name: product.productName || 'Unknown',
                operation: 'fc_po_raise',
                created_date: new Date().toISOString()
              },
              performedBy: data.createdBy
            });

            if (inventoryResult.success) {
              console.log(`✅ FC Inventory updated for SKU ${skuId}: +${product.total_quantity} PO raised`);
            } else {
              console.error(`❌ FC Inventory update failed for SKU ${skuId}: ${inventoryResult.message}`);
            }
          } catch (fcInventoryError: any) {
            console.error(`❌ FC Inventory update failed for SKU ${skuId}:`, fcInventoryError.message);
          }
        } catch (error: any) {
          console.error(`❌ Error updating FC inventory for SKU ${product.catelogue_id}:`, error.message);
        }
      }

      await transaction.commit();

      // Return the created PO with products (outside transaction)
      try {
        const result = await FCPurchaseOrder.findByPk(fcPO.id, {
        include: [
          {
            model: FCPOSkuMatrix,
            as: 'SkuMatrix',
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
      
      // Transform SkuMatrix to Products format for backward compatibility
      const poData: any = result.toJSON();
      if (result.SkuMatrix && result.SkuMatrix.length > 0) {
        poData.Products = this.transformSkuMatrixToProducts(result.SkuMatrix.map((s: any) => s.toJSON ? s.toJSON() : s));
      } else {
        poData.Products = [];
      }
      
      return poData;
      } catch (fetchError: any) {
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
            model: FCPOSkuMatrix,
            as: 'SkuMatrix',
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
      
      // Transform SkuMatrix to Products format for backward compatibility
      const poData: any = result.toJSON();
      if (result.SkuMatrix && result.SkuMatrix.length > 0) {
        poData.Products = this.transformSkuMatrixToProducts(result.SkuMatrix.map((s: any) => s.toJSON ? s.toJSON() : s));
      } else {
        poData.Products = [];
      }
      
      return poData;
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

      // Update inventory for FC PO approval
      if (action === 'APPROVED') {
        console.log('🔄 Updating inventory for FC PO approval...');
        const skuMatrixEntries = await FCPOSkuMatrix.findAll({
          where: { fcPOId: fcPO.id },
          attributes: ['catalogueId', 'quantity', 'sku'],
          transaction
        });

        // Group by catalogue_id to process each product group once
        const groupedByCatalogue = skuMatrixEntries.reduce((acc: any, entry: any) => {
          const catId = entry.catalogueId || entry.catalogue_id;
          if (!acc[catId]) {
            acc[catId] = [];
          }
          acc[catId].push(entry);
          return acc;
        }, {});

        for (const [catalogueId, entries] of Object.entries(groupedByCatalogue)) {
          try {
            // Get the actual SKU from first entry
            const firstEntry = (entries as any[])[0];
            const skuId = firstEntry.sku || catalogueId.toString().padStart(12, '0');
            
            // Sum quantities for this catalogue_id
            const totalQuantity = (entries as any[]).reduce((sum, entry) => sum + (parseInt(entry.quantity) || 0), 0);
            
            // Try to update FC inventory (may fail due to foreign key constraints)
            try {
              const inventoryResult = await DirectInventoryService.updateInventory({
                sku: skuId,
                operation: INVENTORY_OPERATIONS.PO_APPROVE,
                quantity: totalQuantity,
                referenceId: `FCPO-${fcPO.id}`,
                operationDetails: {
                  fcPOId: fcPO.id,
                  fcId: fcPO.fcId,
                  dcId: fcPO.dcId,
                  product_name: firstEntry.productName || firstEntry.product_name || 'Unknown',
                  operation: 'fc_po_approval',
                  approved_date: new Date().toISOString()
                },
                performedBy: approverId
              });

              if (inventoryResult.success) {
                console.log(`✅ FC Inventory updated for SKU ${skuId}: +${totalQuantity} PO approved`);
              } else {
                console.error(`❌ FC Inventory update failed for SKU ${skuId}: ${inventoryResult.message}`);
              }
            } catch (fcInventoryError: any) {
              console.error(`❌ FC Inventory update failed for SKU ${skuId}:`, fcInventoryError.message);
            }
          } catch (error: any) {
            console.error(`❌ Error updating FC inventory for catalogue ${catalogueId}:`, error.message);
          }
        }
      }

      await transaction.commit();

      const result = await FCPurchaseOrder.findByPk(fcPO.id, {
        include: [
          {
            model: FCPOSkuMatrix,
            as: 'SkuMatrix',
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

      // Transform SkuMatrix to Products format for backward compatibility
      const poData: any = result.toJSON();
      if (result.SkuMatrix && result.SkuMatrix.length > 0) {
        poData.Products = this.transformSkuMatrixToProducts(result.SkuMatrix.map((s: any) => s.toJSON ? s.toJSON() : s));
      } else {
        poData.Products = [];
      }
      
      return poData;
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
      dcPoId?: number;
      sku?: string;
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
          model: FCPOSkuMatrix,
          as: 'SkuMatrix',
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

    // Transform SkuMatrix to Products format for all POs
    const processedRows = rows.map((po: any) => {
      const poData = po.toJSON ? po.toJSON() : po;
      if (po.SkuMatrix && po.SkuMatrix.length > 0) {
        poData.Products = this.transformSkuMatrixToProducts(po.SkuMatrix.map((s: any) => s.toJSON ? s.toJSON() : s));
      } else {
        poData.Products = [];
      }
      return poData;
    });

    // Optional raised quantity summary when fcId & dcPoId are provided
    if (filters.fcId && filters.dcPoId) {
      const summary = await sequelize.query(
        `SELECT m.sku AS sku, SUM(m.quantity) AS raisedQuantity
         FROM fc_po_sku_matrix m
         INNER JOIN fc_purchase_orders p ON p.id = m.fc_po_id
         WHERE p.fc_id = :fcId AND p.dc_po_id = :dcPoId
         GROUP BY m.sku`,
        {
          type: QueryTypes.SELECT,
          replacements: { fcId: filters.fcId, dcPoId: filters.dcPoId },
        }
      );

      const result: any = {
        data: processedRows,
        total: count,
        page,
        pages: Math.ceil(count / limit),
        raisedBySku: summary,
      };

      if (filters.sku) {
        const match = (summary as any[]).find((r) => r.sku === filters.sku);
        result.raisedQuantity = match ? Number(match.raisedQuantity) : 0;
      }

      return result;
    }

    return { data: processedRows, total: count, page, pages: Math.ceil(count / limit) };
  }

  /**
   * Get FC Purchase Order by ID
   */
  static async getFCPOById(fcPOId: number): Promise<FCPurchaseOrder | null> {
    const fcPO = await FCPurchaseOrder.findByPk(fcPOId, {
      include: [
        {
          model: FCPOSkuMatrix,
          as: 'SkuMatrix',
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

    // Transform SkuMatrix to Products format for backward compatibility
    const poData: any = fcPO.toJSON();
    if (fcPO.SkuMatrix && fcPO.SkuMatrix.length > 0) {
      poData.Products = this.transformSkuMatrixToProducts(fcPO.SkuMatrix.map((s: any) => s.toJSON ? s.toJSON() : s));
    } else {
      poData.Products = [];
    }

    return poData;
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

      // Update SKU matrix if provided
      if (updateData.products && Array.isArray(updateData.products)) {
        // Delete existing SKU matrix entries
        await FCPOSkuMatrix.destroy({
          where: { fcPOId: fcPO.id },
          transaction,
        });

        // Create new SKU matrix entries from products
        // Note: This is a simplified update - full refactoring needed for complex SKU matrix updates
        const skuMatrixRecords: any[] = [];
        for (const product of updateData.products) {
          if (product.sku_matrix_on_catelogue_id && Array.isArray(product.sku_matrix_on_catelogue_id)) {
            for (const skuItem of product.sku_matrix_on_catelogue_id) {
              skuMatrixRecords.push({
                fcPOId: fcPO.id,
                fcPOProductId: null,
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
                totalAmount: (parseFloat(skuItem.rlp || skuItem.selling_price) || 0) * (skuItem.quantity || 0),
                status: 'PENDING' as 'PENDING' | 'READY_FOR_GRN' | 'PROCESSED',
                createdBy: userId,
              });
            }
          }
        }

        if (skuMatrixRecords.length > 0) {
          await FCPOSkuMatrix.bulkCreate(skuMatrixRecords, { transaction });
        }

        // Recalculate total amount
        const totalAmount = updateData.products.reduce((sum: number, product: any) => {
          return sum + (product.totalAmount || product.totalPrice || 0);
        }, 0);

        fcPO.totalAmount = totalAmount;
        await fcPO.save({ transaction });
      }

      await transaction.commit();

      const result = await FCPurchaseOrder.findByPk(fcPO.id, {
        include: [
          {
            model: FCPOSkuMatrix,
            as: 'SkuMatrix',
          },
        ],
      });
      
      if (!result) {
        throw new Error('Failed to retrieve FC Purchase Order');
      }
      
      // Transform SkuMatrix to Products format
      const poData: any = result.toJSON();
      if (result.SkuMatrix && result.SkuMatrix.length > 0) {
        poData.Products = this.transformSkuMatrixToProducts(result.SkuMatrix.map((s: any) => s.toJSON ? s.toJSON() : s));
      } else {
        poData.Products = [];
      }
      
      return poData;
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

      // Delete related SKU matrix records
      await FCPOSkuMatrix.destroy({
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
    return await ProductMaster.findAll({
      where: {
        // Add any filters for products available for FC PO
        status: 1,
      },
      attributes: ['id', 'name', 'description', 'mrp'],
      order: [['name', 'ASC']],
    });
  }
}
