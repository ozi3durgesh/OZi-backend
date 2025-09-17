import { Sequelize, Model, DataTypes } from 'sequelize';
import sequelize from '../config/database'; // Assuming sequelize is configured in 'config/database.ts'

class RawRider extends Model {}

RawRider.init(
  {
    cdrId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    choId: DataTypes.STRING,
    referenceId: DataTypes.STRING,
    channel: DataTypes.STRING,
    creationDate: DataTypes.DATE,
    senderAddress: DataTypes.STRING,
    senderName: DataTypes.STRING,
    senderContact: DataTypes.STRING,
    customerAddress: DataTypes.STRING,
    customerName: DataTypes.STRING,
    customerContact: DataTypes.STRING,
    billAmount: DataTypes.FLOAT,
    codAmount: DataTypes.FLOAT,
    deliveryDate: DataTypes.DATE,
    deliverySlot: DataTypes.STRING,
    deliveryMasterZone: DataTypes.STRING,
    pickupMasterZone: DataTypes.STRING,
    deliveryBusinessZone: DataTypes.STRING,
    pickupBusinessZone: DataTypes.STRING,
    totalWeight: DataTypes.FLOAT,
    totalVolume: DataTypes.FLOAT,
    fulfillmentStatus: DataTypes.STRING,
    manifestedTime: DataTypes.DATE,
    outForPickupTime: DataTypes.DATE,
    reachedPickupTime: DataTypes.DATE,
    pickupTime: DataTypes.DATE,
    outForDeliveryTime: DataTypes.DATE,
    reachedDeliveryTime: DataTypes.DATE,
    terminalTime: DataTypes.DATE,
    pickupToDropDistance: DataTypes.FLOAT,
    notes: DataTypes.STRING,
    failedAttemptCount: DataTypes.INTEGER,
    lastFailedRemark: DataTypes.STRING,
    cancellationDate: DataTypes.DATE,
    status: DataTypes.STRING,
    ownerId: DataTypes.STRING,
    lekertInput: DataTypes.STRING,
    feedback: DataTypes.STRING,
    callbackRequest: DataTypes.STRING,
    submitDate: DataTypes.DATE,
    riderName: DataTypes.STRING,
    riderId: DataTypes.STRING,
    trackingLink: DataTypes.STRING,
    edt: DataTypes.DATE, // Expected Delivery Time
    adt: DataTypes.DATE, // Actual Delivery Time
    partnerName: DataTypes.STRING,
    partnerId: DataTypes.STRING,
    deliveryCharge: DataTypes.FLOAT,
    failedPartnerAllocations: DataTypes.INTEGER,
    firstAllocationRequest: DataTypes.DATE,
    fulfillmentRequestTime: DataTypes.DATE,
    creationDateTime: DataTypes.DATE,
    timeTaken: DataTypes.FLOAT,
    slaMinsPromised: DataTypes.INTEGER,
    slaBreach: DataTypes.STRING, // 'Yes' or 'No'
    calculateSlaBreachMinutes: DataTypes.INTEGER,
  },
  {
    sequelize,
    modelName: 'RawRider',
    tableName: 'raw_rider', // Set the table name to 'raw_table'
    timestamps: false,  // Disable automatic creation of 'createdAt' and 'updatedAt'
  }
);

export { RawRider };
