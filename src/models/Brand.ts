import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../config/database.js';

class Brand extends Model<
  InferAttributes<Brand>,
  InferCreationAttributes<Brand>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare slug: string | null;
  declare image: string | null;
  declare brand_type: 'branded' | 'unbranded' | 'white_labeled';
  declare status: number; // 0 or 1
  declare module_id: number | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Brand.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    slug: { type: DataTypes.STRING(255), allowNull: true },
    image: { type: DataTypes.STRING(100), allowNull: true },
    brand_type: { 
      type: DataTypes.ENUM('branded', 'unbranded', 'white_labeled'), 
      allowNull: false, 
      defaultValue: 'branded' 
    },
    status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    module_id: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'Brand',
    tableName: 'brands',
    timestamps: true,
  }
);

// Export helper type for creation
export type BrandCreationAttributes = InferCreationAttributes<Brand>;

export default Brand;
