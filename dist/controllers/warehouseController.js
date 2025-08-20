"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseController = void 0;
const models_1 = require("../models");
class WarehouseController {
    static async createWarehouse(req, res) {
        try {
            const warehouseData = req.body;
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
            const existingWarehouse = await models_1.Warehouse.findOne({
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
            const warehouse = await models_1.Warehouse.create({
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
            const createdWarehouse = await models_1.Warehouse.findByPk(warehouse.id, {
                include: [
                    { model: models_1.User, as: 'CreatedBy', attributes: ['id', 'email'] },
                    { model: models_1.User, as: 'UpdatedBy', attributes: ['id', 'email'] }
                ]
            });
            res.status(201).json({
                statusCode: 201,
                success: true,
                data: createdWarehouse,
                error: null
            });
        }
        catch (error) {
            console.error('Error creating warehouse:', error);
            res.status(500).json({
                statusCode: 500,
                success: false,
                data: null,
                error: 'Internal server error'
            });
        }
    }
    static async getWarehouses(req, res) {
        try {
            const { status, type, city, state, country, has_capacity, page = 1, limit = 10, search } = req.query;
            const offset = (page - 1) * limit;
            const whereClause = {};
            if (status)
                whereClause.status = status;
            if (type)
                whereClause.type = type;
            if (city)
                whereClause.city = city;
            if (state)
                whereClause.state = state;
            if (country)
                whereClause.country = country;
            if (has_capacity === 'true') {
                whereClause.current_utilization_percentage = { [require('sequelize').Op.lt]: 100 };
            }
            if (search) {
                whereClause[require('sequelize').Op.or] = [
                    { name: { [require('sequelize').Op.like]: `%${search}%` } },
                    { warehouse_code: { [require('sequelize').Op.like]: `%${search}%` } },
                    { city: { [require('sequelize').Op.like]: `%${search}%` } },
                    { state: { [require('sequelize').Op.like]: `%${search}%` } }
                ];
            }
            const { count, rows } = await models_1.Warehouse.findAndCountAll({
                where: whereClause,
                include: [
                    { model: models_1.User, as: 'CreatedBy', attributes: ['id', 'email'] },
                    { model: models_1.User, as: 'UpdatedBy', attributes: ['id', 'email'] }
                ],
                limit: parseInt(limit.toString()),
                offset,
                order: [['created_at', 'DESC']]
            });
            const totalPages = Math.ceil(count / limit);
            const response = {
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
        }
        catch (error) {
            console.error('Error fetching warehouses:', error);
            res.status(500).json({
                statusCode: 500,
                success: false,
                data: null,
                error: 'Internal server error'
            });
        }
    }
    static async getWarehouseById(req, res) {
        try {
            const { id } = req.params;
            const { zonesPage = 1, zonesLimit = 10, staffPage = 1, staffLimit = 10 } = req.query;
            const warehouse = await models_1.Warehouse.findByPk(parseInt(id), {
                include: [
                    { model: models_1.User, as: 'CreatedBy', attributes: ['id', 'email'] },
                    { model: models_1.User, as: 'UpdatedBy', attributes: ['id', 'email'] }
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
            const zonesOffset = (parseInt(zonesPage.toString()) - 1) * parseInt(zonesLimit.toString());
            const { count: zonesCount, rows: zones } = await models_1.WarehouseZone.findAndCountAll({
                where: {
                    warehouse_id: parseInt(id),
                    is_active: true
                },
                limit: parseInt(zonesLimit.toString()),
                offset: zonesOffset,
                order: [['zone_code', 'ASC']]
            });
            const staffOffset = (parseInt(staffPage.toString()) - 1) * parseInt(staffLimit.toString());
            const { count: staffCount, rows: staffAssignments } = await models_1.WarehouseStaffAssignment.findAndCountAll({
                where: {
                    warehouse_id: parseInt(id),
                    is_active: true
                },
                include: [
                    { model: models_1.User, as: 'User', attributes: ['id', 'email'] }
                ],
                limit: parseInt(staffLimit.toString()),
                offset: staffOffset,
                order: [['role', 'ASC'], ['assigned_date', 'DESC']]
            });
            const response = {
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
        }
        catch (error) {
            console.error('Error fetching warehouse:', error);
            res.status(500).json({
                statusCode: 500,
                success: false,
                data: null,
                error: 'Internal server error'
            });
        }
    }
    static async updateWarehouse(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
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
            const warehouse = await models_1.Warehouse.findByPk(parseInt(id));
            if (!warehouse) {
                res.status(404).json({
                    statusCode: 404,
                    success: false,
                    data: null,
                    error: 'Warehouse not found'
                });
                return;
            }
            if (updateData.warehouse_code && updateData.warehouse_code !== warehouse.warehouse_code) {
                const existingWarehouse = await models_1.Warehouse.findOne({
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
            await warehouse.update({
                ...updateData,
                updated_by: userId
            });
            const updatedWarehouse = await models_1.Warehouse.findByPk(parseInt(id), {
                include: [
                    { model: models_1.User, as: 'CreatedBy', attributes: ['id', 'email'] },
                    { model: models_1.User, as: 'UpdatedBy', attributes: ['id', 'email'] }
                ]
            });
            res.status(200).json({
                statusCode: 200,
                success: true,
                data: updatedWarehouse,
                error: null
            });
        }
        catch (error) {
            console.error('Error updating warehouse:', error);
            res.status(500).json({
                statusCode: 500,
                success: false,
                data: null,
                error: 'Internal server error'
            });
        }
    }
    static async updateWarehouseStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
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
            const warehouse = await models_1.Warehouse.findByPk(parseInt(id));
            if (!warehouse) {
                res.status(404).json({
                    statusCode: 404,
                    success: false,
                    data: null,
                    error: 'Warehouse not found'
                });
                return;
            }
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
        }
        catch (error) {
            console.error('Error updating warehouse status:', error);
            res.status(500).json({
                statusCode: 500,
                success: false,
                data: null,
                error: 'Internal server error'
            });
        }
    }
    static async deleteWarehouse(req, res) {
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
            const warehouse = await models_1.Warehouse.findByPk(parseInt(id));
            if (!warehouse) {
                res.status(404).json({
                    statusCode: 404,
                    success: false,
                    data: null,
                    error: 'Warehouse not found'
                });
                return;
            }
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
        }
        catch (error) {
            console.error('Error deleting warehouse:', error);
            res.status(500).json({
                statusCode: 500,
                success: false,
                data: null,
                error: 'Internal server error'
            });
        }
    }
    static async createZone(req, res) {
        try {
            const { warehouseId } = req.params;
            const zoneData = req.body;
            const warehouse = await models_1.Warehouse.findByPk(parseInt(warehouseId));
            if (!warehouse) {
                res.status(404).json({
                    statusCode: 404,
                    success: false,
                    data: null,
                    error: 'Warehouse not found'
                });
                return;
            }
            const existingZone = await models_1.WarehouseZone.findOne({
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
            const zone = await models_1.WarehouseZone.create({
                ...zoneData,
                warehouse_id: parseInt(warehouseId),
                current_utilization: 0,
                is_active: true,
                temperature_zone: zoneData.temperature_zone || 'AMBIENT'
            });
            const createdZone = await models_1.WarehouseZone.findByPk(zone.id, {
                include: [
                    { model: models_1.Warehouse, as: 'Warehouse', attributes: ['id', 'name', 'warehouse_code'] }
                ]
            });
            res.status(201).json({
                statusCode: 201,
                success: true,
                data: createdZone,
                error: null
            });
        }
        catch (error) {
            console.error('Error creating zone:', error);
            res.status(500).json({
                statusCode: 500,
                success: false,
                data: null,
                error: 'Internal server error'
            });
        }
    }
    static async getWarehouseZones(req, res) {
        try {
            const { warehouseId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const warehouse = await models_1.Warehouse.findByPk(parseInt(warehouseId));
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
            const { count, rows } = await models_1.WarehouseZone.findAndCountAll({
                where: { warehouse_id: parseInt(warehouseId) },
                include: [
                    { model: models_1.Warehouse, as: 'Warehouse', attributes: ['id', 'name', 'warehouse_code'] }
                ],
                limit: parseInt(limit.toString()),
                offset,
                order: [['zone_code', 'ASC']]
            });
            const totalPages = Math.ceil(count / parseInt(limit.toString()));
            const response = {
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
        }
        catch (error) {
            console.error('Error fetching zones:', error);
            res.status(500).json({
                statusCode: 500,
                success: false,
                data: null,
                error: 'Internal server error'
            });
        }
    }
    static async updateZone(req, res) {
        try {
            const { zoneId } = req.params;
            const updateData = req.body;
            const zone = await models_1.WarehouseZone.findByPk(parseInt(zoneId));
            if (!zone) {
                res.status(404).json({
                    statusCode: 404,
                    success: false,
                    data: null,
                    error: 'Zone not found'
                });
                return;
            }
            if (updateData.zone_code && updateData.zone_code !== zone.zone_code) {
                const existingZone = await models_1.WarehouseZone.findOne({
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
            await zone.update(updateData);
            const updatedZone = await models_1.WarehouseZone.findByPk(parseInt(zoneId), {
                include: [
                    { model: models_1.Warehouse, as: 'Warehouse', attributes: ['id', 'name', 'warehouse_code'] }
                ]
            });
            res.status(200).json({
                statusCode: 200,
                success: true,
                data: updatedZone,
                error: null
            });
        }
        catch (error) {
            console.error('Error updating zone:', error);
            res.status(500).json({
                statusCode: 500,
                success: false,
                data: null,
                error: 'Internal server error'
            });
        }
    }
    static async deleteZone(req, res) {
        try {
            const { zoneId } = req.params;
            const zone = await models_1.WarehouseZone.findByPk(parseInt(zoneId));
            if (!zone) {
                res.status(404).json({
                    statusCode: 404,
                    success: false,
                    data: null,
                    error: 'Zone not found'
                });
                return;
            }
            if (zone.current_utilization > 0) {
                res.status(400).json({
                    statusCode: 400,
                    success: false,
                    data: null,
                    error: 'Cannot delete zone with active utilization'
                });
                return;
            }
            await zone.destroy();
            res.status(200).json({
                statusCode: 200,
                success: true,
                data: { message: 'Zone deleted successfully' },
                error: null
            });
        }
        catch (error) {
            console.error('Error deleting zone:', error);
            res.status(500).json({
                statusCode: 500,
                success: false,
                data: null,
                error: 'Internal server error'
            });
        }
    }
    static async assignStaff(req, res) {
        try {
            const { warehouseId } = req.params;
            const staffData = req.body;
            const warehouse = await models_1.Warehouse.findByPk(parseInt(warehouseId));
            if (!warehouse) {
                res.status(404).json({
                    statusCode: 404,
                    success: false,
                    data: null,
                    error: 'Warehouse not found'
                });
                return;
            }
            const user = await models_1.User.findByPk(staffData.user_id);
            if (!user) {
                res.status(404).json({
                    statusCode: 404,
                    success: false,
                    data: null,
                    error: 'User not found'
                });
                return;
            }
            const existingAssignment = await models_1.WarehouseStaffAssignment.findOne({
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
            const assignment = await models_1.WarehouseStaffAssignment.create({
                ...staffData,
                warehouse_id: parseInt(warehouseId),
                is_active: true
            });
            const createdAssignment = await models_1.WarehouseStaffAssignment.findByPk(assignment.id, {
                include: [
                    { model: models_1.Warehouse, as: 'Warehouse', attributes: ['id', 'name', 'warehouse_code'] },
                    { model: models_1.User, as: 'User', attributes: ['id', 'email'] }
                ]
            });
            res.status(201).json({
                statusCode: 201,
                success: true,
                data: createdAssignment,
                error: null
            });
        }
        catch (error) {
            console.error('Error assigning staff:', error);
            res.status(500).json({
                statusCode: 500,
                success: false,
                data: null,
                error: 'Internal server error'
            });
        }
    }
    static async getWarehouseStaff(req, res) {
        try {
            const { warehouseId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const warehouse = await models_1.Warehouse.findByPk(parseInt(warehouseId));
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
            const { count, rows } = await models_1.WarehouseStaffAssignment.findAndCountAll({
                where: {
                    warehouse_id: parseInt(warehouseId),
                    is_active: true
                },
                include: [
                    { model: models_1.Warehouse, as: 'Warehouse', attributes: ['id', 'name', 'warehouse_code'] },
                    { model: models_1.User, as: 'User', attributes: ['id', 'email'] }
                ],
                limit: parseInt(limit.toString()),
                offset,
                order: [['role', 'ASC'], ['assigned_date', 'DESC']]
            });
            const totalPages = Math.ceil(count / parseInt(limit.toString()));
            const response = {
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
        }
        catch (error) {
            console.error('Error fetching warehouse staff:', error);
            res.status(500).json({
                statusCode: 500,
                success: false,
                data: null,
                error: 'Internal server error'
            });
        }
    }
    static async removeStaffAssignment(req, res) {
        try {
            const { assignmentId } = req.params;
            const assignment = await models_1.WarehouseStaffAssignment.findByPk(parseInt(assignmentId));
            if (!assignment) {
                res.status(404).json({
                    statusCode: 404,
                    success: false,
                    data: null,
                    error: 'Staff assignment not found'
                });
                return;
            }
            await assignment.update({ is_active: false });
            res.status(200).json({
                statusCode: 200,
                success: true,
                data: { message: 'Staff assignment removed successfully' },
                error: null
            });
        }
        catch (error) {
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
exports.WarehouseController = WarehouseController;
