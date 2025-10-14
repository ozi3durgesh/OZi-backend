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
  declare id: CreationOptional<number>;
  declare catalogue_id: string;
  declare po_raise_quantity: number;
  declare po_approve_quantity: number;
  declare sku_split: Record<string, number> | null;
  declare grn_done: Record<string, number> | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

DCInventory1.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    catalogue_id: {
      type: DataTypes.STRING(7),
      allowNull: false,
      unique: true,
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
    sku_split: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    grn_done: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
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
      { fields: ['catalogue_id'] },
      { fields: ['po_raise_quantity'] },
      { fields: ['po_approve_quantity'] },
    ],
  }
);

export default DCInventory1;
