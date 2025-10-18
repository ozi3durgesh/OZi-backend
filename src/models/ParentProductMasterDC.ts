import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database.js';

class ParentProductMasterDC extends Model<
  InferAttributes<ParentProductMasterDC>,
  InferCreationAttributes<ParentProductMasterDC>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare status: number; // 0 or 1
  declare category_id: number;
  declare catalogue_id: number;
  declare description: string;
  declare hsn: string;
  declare image_url: string;
  declare mrp: number;
  declare ean_upc: string;
  declare brand_id: number;
  declare weight: number;
  declare length: number;
  declare height: number;
  declare width: number;
  declare inventory_threshold: number;
  declare gst: number;
  declare cess: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare createdBy: number;
  declare updatedBy: number[];
}

ParentProductMasterDC.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { isIn: [[0, 1]] } },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    catalogue_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      field: 'catalogue_id'
    },
    description: { type: DataTypes.TEXT, allowNull: false },
    hsn: { type: DataTypes.STRING(8), allowNull: false },
    image_url: { type: DataTypes.TEXT, allowNull: false },
    mrp: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    ean_upc: { type: DataTypes.STRING(14), allowNull: false },
    brand_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Brands', key: 'id' } },
    weight: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    length: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    height: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    width: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    inventory_threshold: { type: DataTypes.INTEGER, allowNull: false },
    gst: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    cess: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
    updatedBy: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'ParentProductMasterDC',
    tableName: 'parent_product_master',
    timestamps: true,
    validate: {
      updatedByIsArray() {
        if (!Array.isArray((this as any).updatedBy)) {
          throw new Error('updatedBy must be an array');
        }
      }
    }
  }
);

// Add hooks to handle updatedBy array
ParentProductMasterDC.addHook('beforeUpdate', (instance: any) => {
  // If updatedBy is provided in the update data, append it to the existing array
  if (instance.changed('updatedBy') && instance.dataValues.updatedBy) {
    const currentUpdatedBy = instance._previousDataValues.updatedBy || [];
    if (Array.isArray(currentUpdatedBy)) {
      instance.setDataValue('updatedBy', [...currentUpdatedBy, instance.dataValues.updatedBy]);
    } else {
      instance.setDataValue('updatedBy', [instance.dataValues.updatedBy]);
    }
  }
});

// Export helper type for creation
export type ParentProductMasterDCCreationAttributes = InferCreationAttributes<ParentProductMasterDC>;

export default ParentProductMasterDC;

