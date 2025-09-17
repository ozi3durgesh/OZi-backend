import { Sequelize, Model, DataTypes } from 'sequelize';
import sequelize from '../config/database'; // Assuming sequelize is configured in 'config/database.ts'

class RawPicker extends Model {}

RawPicker.init(
  {
    batchId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    picklistId: DataTypes.STRING,
    batchCreatedAt: DataTypes.DATE,
    batchCreatedBy: DataTypes.STRING,
    marketplace: DataTypes.STRING,
    orderNumber: DataTypes.STRING,
    suborderNumber: DataTypes.STRING,
    orderDate: DataTypes.DATE,
    orderAssignedAt: DataTypes.DATE,
    sku: DataTypes.STRING,
    serialNumber: DataTypes.STRING,
    bin: DataTypes.STRING,
    picker: DataTypes.STRING,
    pickedAt: DataTypes.DATE,
    packedAt: DataTypes.DATE,
    confirmDate: DataTypes.DATE,
    printedAt: DataTypes.DATE,
    orderPrintedByPacker: DataTypes.STRING,
    awbNumber: DataTypes.STRING,
    batchStatus: DataTypes.STRING,
    quantityPicked: DataTypes.INTEGER,
    minutesTakenByPicker: DataTypes.FLOAT,
    additionalMinutesTakenByPicker: DataTypes.FLOAT, // Added column for second "Minutes taken by picker"
  },
  {
    sequelize,
    modelName: 'RawPicker',
    tableName: 'raw_picker', // Set the table name to 'raw_picker'
    timestamps: false,  // Disable automatic creation of 'createdAt' and 'updatedAt'
  }
);

export { RawPicker };
