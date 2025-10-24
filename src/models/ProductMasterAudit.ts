import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database.js';

class ProductMasterAudit extends Model<
  InferAttributes<ProductMasterAudit>,
  InferCreationAttributes<ProductMasterAudit>
> {
  declare id: CreationOptional<number>;
  declare productMasterId: number;
  declare fieldName: string;
  declare oldValue: string | null;
  declare newValue: string | null;
  declare operationType: 'BULK_UPDATE' | 'INDIVIDUAL_UPDATE' | 'REVERT' | 'CREATE' | 'UPDATE' | 'DELETE';
  declare batchId: string | null; // For grouping bulk operations
  declare userId: number;
  declare action: string; // e.g., 'UPDATE', 'CREATE', 'DELETE'
  declare description: string | null; // Human-readable description of the change
  declare metadata: string | null; // Additional metadata as JSON string (avoid JSON column type)
  declare createdAt: CreationOptional<Date>;
}

ProductMasterAudit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productMasterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_master_id',
      references: {
        model: 'product_master',
        key: 'id',
      },
    },
    fieldName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'field_name',
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'old_value',
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'new_value',
    },
    operationType: {
      type: DataTypes.ENUM('BULK_UPDATE', 'INDIVIDUAL_UPDATE', 'REVERT', 'CREATE', 'UPDATE', 'DELETE'),
      allowNull: false,
      field: 'operation_type',
    },
    batchId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'batch_id',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'action',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description',
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'metadata',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    modelName: 'ProductMasterAudit',
    tableName: 'product_master_audit',
    timestamps: false,
  }
);

export default ProductMasterAudit;
