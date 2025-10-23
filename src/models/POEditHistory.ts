import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class POEditHistory extends Model {}

POEditHistory.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    po_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: true },
    field: { type: DataTypes.STRING(100), allowNull: false },
    old_value: { type: DataTypes.TEXT, allowNull: true },
    new_value: { type: DataTypes.TEXT, allowNull: true },
    change_type: {
      type: DataTypes.ENUM('PRODUCT_ADDED', 'PRODUCT_EDITED', 'HEADER_EDITED'),
      allowNull: false,
    },
    changed_by: { type: DataTypes.INTEGER, allowNull: false },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'POEditHistory',
    tableName: 'po_edit_history',
    timestamps: false,
  }
);

export default POEditHistory;
