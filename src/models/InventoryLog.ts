import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { INVENTORY_OPERATIONS } from '../config/inventoryConstants';

interface InventoryLogAttributes {
  id: number;
  sku: string;
  operation_type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reference_id: string | null;
  operation_details: any;
  performed_by: number | null;
  created_at: Date;
}

interface InventoryLogCreationAttributes extends Optional<InventoryLogAttributes, 'id' | 'created_at'> {}

class InventoryLog extends Model<InventoryLogAttributes, InventoryLogCreationAttributes> implements InventoryLogAttributes {
  public id!: number;
  public sku!: string;
  public operation_type!: string;
  public quantity_change!: number;
  public previous_quantity!: number;
  public new_quantity!: number;
  public reference_id!: string | null;
  public operation_details!: any;
  public performed_by!: number | null;
  public created_at!: Date;
}

InventoryLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50],
      },
    },
    operation_type: {
      type: DataTypes.ENUM(...Object.values(INVENTORY_OPERATIONS) as string[]),
      allowNull: false,
      validate: {
        isIn: [Object.values(INVENTORY_OPERATIONS)],
      },
    },
    quantity_change: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: true,
      },
    },
    previous_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    new_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    reference_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    operation_details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    performed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'inventory_logs',
    timestamps: false,
    indexes: [
      {
        fields: ['sku'],
      },
      {
        fields: ['operation_type'],
      },
      {
        fields: ['reference_id'],
      },
      {
        fields: ['performed_by'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['sku', 'operation_type'],
      },
      {
        fields: ['sku', 'created_at'],
      },
    ],
  }
);

export default InventoryLog;
