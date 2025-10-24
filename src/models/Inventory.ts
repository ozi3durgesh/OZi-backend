import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface InventoryAttributes {
  id: number;
  sku: string;
  fc_po_raise_quantity: number;
  fc_po_approve_quantity: number;
  fc_grn_quantity: number;
  fc_putaway_quantity: number;
  fc_picklist_quantity: number;
  fc_return_try_and_buy_quantity: number;
  fc_return_other_quantity: number;
  fc_total_available_quantity: number;
  fc_id?: number;
  created_at: Date;
  updated_at: Date;
}

interface InventoryCreationAttributes extends Optional<InventoryAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes> implements InventoryAttributes {
  public id!: number;
  public sku!: string;
  public fc_po_raise_quantity!: number;
  public fc_po_approve_quantity!: number;
  public fc_grn_quantity!: number;
  public fc_putaway_quantity!: number;
  public fc_picklist_quantity!: number;
  public fc_return_try_and_buy_quantity!: number;
  public fc_return_other_quantity!: number;
  public fc_total_available_quantity!: number;
  public fc_id?: number;
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual field for available quantity (putaway - picklist)
  public get availableQuantity(): number {
    return this.fc_putaway_quantity - this.fc_picklist_quantity;
  }

  // Virtual field for total inventory
  public get totalInventory(): number {
    return this.fc_putaway_quantity + this.fc_return_try_and_buy_quantity + this.fc_return_other_quantity;
  }
}

Inventory.init(
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
    fc_po_raise_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    fc_po_approve_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    fc_grn_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    fc_putaway_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    fc_picklist_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    fc_return_try_and_buy_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    fc_return_other_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    fc_total_available_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      // Removed min: 0 constraint to allow negative values (overallocated items)
    },
    fc_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'fulfillment_centers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'inventory',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['fc_id', 'sku'],
        name: 'inventory_fc_id_sku_unique'
      },
      {
        fields: ['sku', 'fc_po_raise_quantity'],
      },
      {
        fields: ['sku', 'fc_putaway_quantity'],
      },
      {
        fields: ['sku', 'fc_picklist_quantity'],
      },
      {
        fields: ['fc_total_available_quantity'],
      },
    ],
    hooks: {
      beforeUpdate: (instance: Inventory) => {
        // Automatically calculate fc_total_available_quantity
        instance.fc_total_available_quantity = instance.fc_putaway_quantity - instance.fc_picklist_quantity;
      },
      beforeCreate: (instance: Inventory) => {
        // Automatically calculate fc_total_available_quantity
        instance.fc_total_available_quantity = instance.fc_putaway_quantity - instance.fc_picklist_quantity;
      },
    },
  }
);

export default Inventory;
