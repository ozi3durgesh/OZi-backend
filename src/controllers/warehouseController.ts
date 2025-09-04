import { Request, Response } from 'express';
import { Warehouse, WarehouseZone, WarehouseStaffAssignment, User } from '../models';
import { 
  CreateWarehouseRequest, 
  UpdateWarehouseRequest, 
  WarehouseStatusUpdateRequest,
  CreateZoneRequest,
  UpdateZoneRequest,
  AssignStaffRequest,
  WarehouseFilters,
  WarehouseListResponse,
  ZoneListResponse,
  StaffListResponse,
  WarehouseDetailResponse,
  ApiResponse
} from '../types';
import { AuthRequest } from '../types';

export class WarehouseController {
  // Create new warehouse
  static async createWarehouse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const warehouseData: CreateWarehouseRequest = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          statusCode: 401,
          success: false,
          data: null,
          error: 'User not authenticated'
        });
        return;
      }

      // Check if warehouse code already exists
      const existingWarehouse = await Warehouse.findOne({
        where: { warehouse_code: warehouseData.warehouse_code }
      });

      if (existingWarehouse) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'Warehouse code already exists'
        });
        return;
      }

      // Create warehouse with audit fields
      const warehouse = await Warehouse.create({
        ...warehouseData,
        created_by: userId,
        updated_by: userId,
        current_utilization_percentage: 0.00,
        integration_status: 'PENDING',
        status: 'ACTIVE',
        country: warehouseData.country || 'India',
        is_auto_assignment_enabled: warehouseData.is_auto_assignment_enabled ?? true,
        max_orders_per_day: warehouseData.max_orders_per_day || 1000,
        sla_hours: warehouseData.sla_hours || 24
      });

      // Fetch created warehouse with associations
      const createdWarehouse = await Warehouse.findByPk(warehouse.id, {
        include: [
          { model: User, as: 'WarehouseCreatedBy', attributes: ['id', 'email'] },
          { model: User, as: 'UpdatedBy', attributes: ['id', 'email'] }
        ]
      });

      res.status(201).json({
        statusCode: 201,
        success: true,
        data: createdWarehouse,
        error: null
      });
    } catch (error) {
      console.error('Error creating warehouse:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  // Get warehouses with pagination and filters
  static async getWarehouses(req: Request, res: Response): Promise<void> {
    try {
      const {
        status,
        type,
        city,
        state,
        country,
        has_capacity,
        page = 1,
        limit = 10,
        search
      } = req.query as WarehouseFilters;

      const offset = (page - 1) * limit;
      const whereClause: any = {};

      // Apply filters
      if (status) whereClause.status = status;
      if (type) whereClause.type = type;
      if (city) whereClause.city = city;
      if (state) whereClause.state = state;
      if (country) whereClause.country = country;
      if (has_capacity === 'true') {
        whereClause.current_utilization_percentage = { [require('sequelize').Op.lt]: 100 };
      }

      // Search functionality
      if (search) {
        whereClause[require('sequelize').Op.or] = [
          { name: { [require('sequelize').Op.like]: `%${search}%` } },
          { warehouse_code: { [require('sequelize').Op.like]: `%${search}%` } },
          { city: { [require('sequelize').Op.like]: `%${search}%` } },
          { state: { [require('sequelize').Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Warehouse.findAndCountAll({
        where: whereClause,
        include: [
          { model: User, as: 'WarehouseCreatedBy', attributes: ['id', 'email'] },
          { model: User, as: 'UpdatedBy', attributes: ['id', 'email'] }
        ],
        limit: parseInt(limit.toString()),
        offset,
        order: [['created_at', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      const response: WarehouseListResponse = {
        warehouses: rows,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: count,
          totalPages
        }
      };

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: response,
        error: null
      });
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  // Get warehouse by ID
  static async getWarehouseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        zonesPage = 1, 
        zonesLimit = 10, 
        staffPage = 1, 
        staffLimit = 10 
      } = req.query;

      const warehouse = await Warehouse.findByPk(parseInt(id), {
        include: [
          { model: User, as: 'WarehouseCreatedBy', attributes: ['id', 'email'] },
          { model: User, as: 'UpdatedBy', attributes: ['id', 'email'] }
        ]
      });

      if (!warehouse) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Warehouse not found'
        });
        return;
      }

      // Get zones with pagination
      const zonesOffset = (parseInt(zonesPage.toString()) - 1) * parseInt(zonesLimit.toString());
      const { count: zonesCount, rows: zones } = await WarehouseZone.findAndCountAll({
        where: { 
          warehouse_id: parseInt(id),
          is_active: true 
        },
        limit: parseInt(zonesLimit.toString()),
        offset: zonesOffset,
        order: [['zone_code', 'ASC']]
      });

      // Get staff assignments with pagination
      const staffOffset = (parseInt(staffPage.toString()) - 1) * parseInt(staffLimit.toString());
      const { count: staffCount, rows: staffAssignments } = await WarehouseStaffAssignment.findAndCountAll({
        where: { 
          warehouse_id: parseInt(id),
          is_active: true 
        },
        include: [
          { model: User, as: 'User', attributes: ['id', 'email'] }
        ],
        limit: parseInt(staffLimit.toString()),
        offset: staffOffset,
        order: [['role', 'ASC'], ['assigned_date', 'DESC']]
      });

      const response: WarehouseDetailResponse = {
        warehouse: warehouse.toJSON(),
        zones: {
          data: zones,
          pagination: {
            page: parseInt(zonesPage.toString()),
            limit: parseInt(zonesLimit.toString()),
            total: zonesCount,
            totalPages: Math.ceil(zonesCount / parseInt(zonesLimit.toString()))
          }
        },
        staff: {
          data: staffAssignments,
          pagination: {
            page: parseInt(staffPage.toString()),
            limit: parseInt(staffLimit.toString()),
            total: staffCount,
            totalPages: Math.ceil(staffCount / parseInt(staffLimit.toString()))
          }
        }
      };

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: response,
        error: null
      });
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  // Update warehouse
  static async updateWarehouse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateWarehouseRequest = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          statusCode: 401,
          success: false,
          data: null,
          error: 'User not authenticated'
        });
        return;
      }

      const warehouse = await Warehouse.findByPk(parseInt(id));

      if (!warehouse) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Warehouse not found'
        });
        return;
      }

      // Check if warehouse code is being changed and if it already exists
      if (updateData.warehouse_code && updateData.warehouse_code !== warehouse.warehouse_code) {
        const existingWarehouse = await Warehouse.findOne({
          where: { warehouse_code: updateData.warehouse_code }
        });

        if (existingWarehouse) {
          res.status(400).json({
            statusCode: 400,
            success: false,
            data: null,
            error: 'Warehouse code already exists'
          });
          return;
        }
      }

      // Update warehouse
      await warehouse.update({
        ...updateData,
        updated_by: userId
      });

      // Fetch updated warehouse with associations
      const updatedWarehouse = await Warehouse.findByPk(parseInt(id), {
        include: [
          { model: User, as: 'WarehouseCreatedBy', attributes: ['id', 'email'] },
          { model: User, as: 'UpdatedBy', attributes: ['id', 'email'] }
        ]
      });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: updatedWarehouse,
        error: null
      });
    } catch (error) {
      console.error('Error updating warehouse:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  // Update warehouse status
  static async updateWarehouseStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status }: WarehouseStatusUpdateRequest = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          statusCode: 401,
          success: false,
          data: null,
          error: 'User not authenticated'
        });
        return;
      }

      const warehouse = await Warehouse.findByPk(parseInt(id));

      if (!warehouse) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Warehouse not found'
        });
        return;
      }

      // Update status
      await warehouse.update({
        status,
        updated_by: userId
      });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: { message: 'Warehouse status updated successfully' },
        error: null
      });
    } catch (error) {
      console.error('Error updating warehouse status:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  // Delete warehouse (soft delete by setting status to INACTIVE)
  static async deleteWarehouse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          statusCode: 401,
          success: false,
          data: null,
          error: 'User not authenticated'
        });
        return;
      }

      const warehouse = await Warehouse.findByPk(parseInt(id));

      if (!warehouse) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Warehouse not found'
        });
        return;
      }

      // Soft delete by setting status to INACTIVE
      await warehouse.update({
        status: 'INACTIVE',
        updated_by: userId
      });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: { message: 'Warehouse deactivated successfully' },
        error: null
      });
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  // Create warehouse zone
  static async createZone(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { warehouseId } = req.params;
      const zoneData: CreateZoneRequest = req.body;

      // Check if warehouse exists
      const warehouse = await Warehouse.findByPk(parseInt(warehouseId));

      if (!warehouse) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Warehouse not found'
        });
        return;
      }

      // Check if zone code already exists for this warehouse
      const existingZone = await WarehouseZone.findOne({
        where: {
          warehouse_id: parseInt(warehouseId),
          zone_code: zoneData.zone_code
        }
      });

      if (existingZone) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'Zone code already exists for this warehouse'
        });
        return;
      }

      // Create zone
      const zone = await WarehouseZone.create({
        ...zoneData,
        warehouse_id: parseInt(warehouseId),
        current_utilization: 0,
        is_active: true,
        temperature_zone: zoneData.temperature_zone || 'AMBIENT'
      });

      // Fetch created zone with warehouse info
      const createdZone = await WarehouseZone.findByPk(zone.id, {
        include: [
          { model: Warehouse, as: 'Warehouse', attributes: ['id', 'name', 'warehouse_code'] }
        ]
      });

      res.status(201).json({
        statusCode: 201,
        success: true,
        data: createdZone,
        error: null
      });
    } catch (error) {
      console.error('Error creating zone:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  // Get warehouse zones
  static async getWarehouseZones(req: Request, res: Response): Promise<void> {
    try {
      const { warehouseId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Check if warehouse exists
      const warehouse = await Warehouse.findByPk(parseInt(warehouseId));

      if (!warehouse) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Warehouse not found'
        });
        return;
      }

      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());
      const { count, rows } = await WarehouseZone.findAndCountAll({
        where: { warehouse_id: parseInt(warehouseId) },
        include: [
          { model: Warehouse, as: 'Warehouse', attributes: ['id', 'name', 'warehouse_code'] }
        ],
        limit: parseInt(limit.toString()),
        offset,
        order: [['zone_code', 'ASC']]
      });

      const totalPages = Math.ceil(count / parseInt(limit.toString()));

      const response: ZoneListResponse = {
        zones: rows,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: count,
          totalPages
        }
      };

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: response,
        error: null
      });
    } catch (error) {
      console.error('Error fetching zones:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  // Update zone
  static async updateZone(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { zoneId } = req.params;
      const updateData: UpdateZoneRequest = req.body;

      const zone = await WarehouseZone.findByPk(parseInt(zoneId));

      if (!zone) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Zone not found'
        });
        return;
      }

      // Check if zone code is being changed and if it already exists
      if (updateData.zone_code && updateData.zone_code !== zone.zone_code) {
        const existingZone = await WarehouseZone.findOne({
          where: {
            warehouse_id: zone.warehouse_id,
            zone_code: updateData.zone_code
          }
        });

        if (existingZone) {
          res.status(400).json({
            statusCode: 400,
            success: false,
            data: null,
            error: 'Zone code already exists for this warehouse'
          });
          return;
        }
      }

      // Update zone
      await zone.update(updateData);

      // Fetch updated zone with warehouse info
      const updatedZone = await WarehouseZone.findByPk(parseInt(zoneId), {
        include: [
          { model: Warehouse, as: 'Warehouse', attributes: ['id', 'name', 'warehouse_code'] }
        ]
      });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: updatedZone,
        error: null
      });
    } catch (error) {
      console.error('Error updating zone:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  // Delete zone
  static async deleteZone(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { zoneId } = req.params;

      const zone = await WarehouseZone.findByPk(parseInt(zoneId));

      if (!zone) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Zone not found'
        });
        return;
      }

      // Check if zone has utilization
      if (zone.current_utilization > 0) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'Cannot delete zone with active utilization'
        });
        return;
      }

      // Delete zone
      await zone.destroy();

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: { message: 'Zone deleted successfully' },
        error: null
      });
    } catch (error) {
      console.error('Error deleting zone:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  // Assign staff to warehouse
  static async assignStaff(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { warehouseId } = req.params;
      const staffData: AssignStaffRequest = req.body;

      // Check if warehouse exists
      const warehouse = await Warehouse.findByPk(parseInt(warehouseId));

      if (!warehouse) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Warehouse not found'
        });
        return;
      }

      // Check if user exists
      const user = await User.findByPk(staffData.user_id);

      if (!user) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'User not found'
        });
        return;
      }

      // Check if assignment already exists
      const existingAssignment = await WarehouseStaffAssignment.findOne({
        where: {
          warehouse_id: parseInt(warehouseId),
          user_id: staffData.user_id,
          role: staffData.role
        }
      });

      if (existingAssignment) {
        res.status(400).json({
          statusCode: 400,
          success: false,
          data: null,
          error: 'Staff assignment already exists'
        });
        return;
      }

      // Create assignment
      const assignment = await WarehouseStaffAssignment.create({
        ...staffData,
        warehouse_id: parseInt(warehouseId),
        is_active: true
      });

      // Fetch created assignment with associations
      const createdAssignment = await WarehouseStaffAssignment.findByPk(assignment.id, {
        include: [
          { model: Warehouse, as: 'Warehouse', attributes: ['id', 'name', 'warehouse_code'] },
          { model: User, as: 'User', attributes: ['id', 'email'] }
        ]
      });

      res.status(201).json({
        statusCode: 201,
        success: true,
        data: createdAssignment,
        error: null
      });
    } catch (error) {
      console.error('Error assigning staff:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  // Get warehouse staff
  static async getWarehouseStaff(req: Request, res: Response): Promise<void> {
    try {
      const { warehouseId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Check if warehouse exists
      const warehouse = await Warehouse.findByPk(parseInt(warehouseId));

      if (!warehouse) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Warehouse not found'
        });
        return;
      }

      const offset = (parseInt(page.toString()) - 1) * parseInt(limit.toString());
      const { count, rows } = await WarehouseStaffAssignment.findAndCountAll({
        where: { 
          warehouse_id: parseInt(warehouseId),
          is_active: true
        },
        include: [
          { model: Warehouse, as: 'Warehouse', attributes: ['id', 'name', 'warehouse_code'] },
          { model: User, as: 'User', attributes: ['id', 'email'] }
        ],
        limit: parseInt(limit.toString()),
        offset,
        order: [['role', 'ASC'], ['assigned_date', 'DESC']]
      });

      const totalPages = Math.ceil(count / parseInt(limit.toString()));

      const response: StaffListResponse = {
        staff: rows,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: count,
          totalPages
        }
      };

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: response,
        error: null
      });
    } catch (error) {
      console.error('Error fetching warehouse staff:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }

  // Remove staff assignment
  static async removeStaffAssignment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;

      const assignment = await WarehouseStaffAssignment.findByPk(parseInt(assignmentId));

      if (!assignment) {
        res.status(404).json({
          statusCode: 404,
          success: false,
          data: null,
          error: 'Staff assignment not found'
        });
        return;
      }

      // Soft delete by setting is_active to false
      await assignment.update({ is_active: false });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: { message: 'Staff assignment removed successfully' },
        error: null
      });
    } catch (error) {
      console.error('Error removing staff assignment:', error);
      res.status(500).json({
        statusCode: 500,
        success: false,
        data: null,
        error: 'Internal server error'
      });
    }
  }
}
