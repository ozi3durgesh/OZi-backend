import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database.js';

class DCInventory1 extends Model<
  InferAttributes<DCInventory1>,
  InferCreationAttributes<DCInventory1>
> {
  declare sku_id: string;
  declare dc_id: number;
  declare po_raise_quantity: number;
  declare po_approve_quantity: number;
  declare grn_done: number;
  declare total_available_quantity: number;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

DCInventory1.init(
  {
    sku_id: {
      type: DataTypes.STRING(13),
      allowNull: false,
      primaryKey: true,
      validate: {
        len: [12, 13],
      },
    },
    dc_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      validate: {
        min: 1,
      },
    },
    po_raise_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    po_approve_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    grn_done: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    total_available_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Calculated as: grn_done - inventory.fc_po_raise_quantity for matching dc_id'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    },
  },
  {
    sequelize,
    tableName: 'dc_inventory_1',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['sku_id'] },
      { fields: ['dc_id'] },
      { fields: ['po_raise_quantity'] },
      { fields: ['po_approve_quantity'] },
      { fields: ['grn_done'] },
      { fields: ['total_available_quantity'] },
    ],
  }
);

export default DCInventory1;
