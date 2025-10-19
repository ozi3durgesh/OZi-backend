import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database';
import POProductEdit from './POProductEdit';

class PurchaseOrderEdit extends Model<
  InferAttributes<PurchaseOrderEdit>,
  InferCreationAttributes<PurchaseOrderEdit>
> {
  declare id: CreationOptional<number>;
  declare purchase_order_id: number;
  declare vendor_id: number;
  declare dc_id: number;
  declare priority: string;
  declare description: string | null;
  declare final_delivery_date: Date | null;
  declare pi_url: string | null;
  declare products?: POProductEdit[];
}

PurchaseOrderEdit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchase_order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'dc_purchase_orders', key: 'id' },
      onDelete: 'CASCADE',
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dc_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    final_delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pi_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'purchase_order_edits',
    timestamps: false,
  }
);

export default PurchaseOrderEdit;
