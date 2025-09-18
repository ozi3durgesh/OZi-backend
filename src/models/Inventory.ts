import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface InventoryAttributes {
  id: number;
  sku: string;
  po_quantity: number;
  grn_quantity: number;
  putaway_quantity: number;
  picklist_quantity: number;
  return_try_and_buy_quantity: number;
  return_other_quantity: number;
  total_available_quantity: number;
  created_at: Date;
  updated_at: Date;
}

interface InventoryCreationAttributes extends Optional<InventoryAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes> implements InventoryAttributes {
  public id!: number;
  public sku!: string;
  public po_quantity!: number;
  public grn_quantity!: number;
  public putaway_quantity!: number;
  public picklist_quantity!: number;
  public return_try_and_buy_quantity!: number;
  public return_other_quantity!: number;
  public total_available_quantity!: number;
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual field for available quantity (putaway - picklist)
  public get availableQuantity(): number {
    return this.putaway_quantity - this.picklist_quantity;
  }

  // Virtual field for total inventory
  public get totalInventory(): number {
    return this.po_quantity + this.grn_quantity + this.putaway_quantity + 
           this.return_try_and_buy_quantity + this.return_other_quantity;
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
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 50],
      },
    },
    po_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    grn_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    putaway_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    picklist_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    return_try_and_buy_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    return_other_quantity: {
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
      // Removed min: 0 constraint to allow negative values (overallocated items)
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
        fields: ['sku'],
      },
      {
        fields: ['sku', 'po_quantity'],
      },
      {
        fields: ['sku', 'putaway_quantity'],
      },
      {
        fields: ['sku', 'picklist_quantity'],
      },
      {
        fields: ['total_available_quantity'],
      },
    ],
    hooks: {
      beforeUpdate: (instance: Inventory) => {
        // Automatically calculate total_available_quantity
        instance.total_available_quantity = instance.putaway_quantity - instance.picklist_quantity;
      },
      beforeCreate: (instance: Inventory) => {
        // Automatically calculate total_available_quantity
        instance.total_available_quantity = instance.putaway_quantity - instance.picklist_quantity;
      },
    },
  }
);

export default Inventory;
