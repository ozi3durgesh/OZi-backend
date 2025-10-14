import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Order from './Order';
import Product from './productModel';
import { RETURN_CONSTANTS, ReturnStatus, ReturnReason, ReturnType, QCStatus, TimelineEvent } from '../config/returnConstants';

interface ReturnRequestItemAttributes {
  id: number;
  
  // Return Request Fields
  return_order_id: string;
  original_order_id: string;
  customer_id: number;
  return_reason: ReturnReason;
  status: ReturnStatus;
  return_type: ReturnType;
  total_items_count: number;
  total_return_amount: number;
  pidge_tracking_id: string | null;
  pickup_address: object | null;
  return_notes: string | null;
  images: string[] | null;
  
  // Return Item Fields
  item_id: number;
  quantity: number;
  item_details: string | null;
  variation: string | null;
  price: number;
  item_images: string[] | null;
  item_notes: string | null;
  
  // QC Fields
  qc_status: QCStatus;
  qc_notes: string | null;
  qc_by: number | null;
  qc_at: number | null;
  
  // Timeline Fields
  timeline_events: object[] | null; // Array of timeline events
  last_event_type: TimelineEvent;
  last_event_notes: string | null;
  last_event_metadata: object | null;
  
  // Try and Buy Specific Fields
  is_try_and_buy: number;
  customer_feedback: string | null;
  overall_rating: number | null;
  item_feedback: string | null;
  item_rating: number | null;
  try_and_buy_reason: string | null;
  
  // GRN Fields
  grn_id: string | null;
  grn_status: string | null;
  received_quantity: number | null;
  expected_quantity: number | null;
  qc_pass_qty: number | null;
  qc_fail_qty: number | null;
  
  // Putaway Fields
  putaway_status: string | null;
  bin_location_id: string | null;
  putaway_by: number | null;
  putaway_at: number | null;
  putaway_notes: string | null;
  
  // Audit Fields
  created_at: number;
  updated_at: number;
  created_by: number;
  is_active: number;
}

interface ReturnRequestItemCreationAttributes {
  return_order_id: string;
  original_order_id: string;
  customer_id: number;
  return_reason: ReturnReason;
  status?: ReturnStatus;
  return_type?: ReturnType;
  total_items_count?: number;
  total_return_amount?: number;
  pidge_tracking_id?: string | null;
  pickup_address?: object | null;
  return_notes?: string | null;
  images?: string[] | null;
  
  item_id: number;
  quantity: number;
  item_details?: string | null;
  variation?: string | null;
  price?: number;
  item_images?: string[] | null;
  item_notes?: string | null;
  
  qc_status?: QCStatus;
  qc_notes?: string | null;
  qc_by?: number | null;
  qc_at?: number | null;
  
  timeline_events?: object[] | null;
  last_event_type?: TimelineEvent;
  last_event_notes?: string | null;
  last_event_metadata?: object | null;
  
  is_try_and_buy?: number;
  customer_feedback?: string | null;
  overall_rating?: number | null;
  item_feedback?: string | null;
  item_rating?: number | null;
  try_and_buy_reason?: string | null;
  
  grn_id?: string | null;
  grn_status?: string | null;
  received_quantity?: number | null;
  expected_quantity?: number | null;
  
  putaway_status?: string | null;
  bin_location_id?: string | null;
  putaway_by?: number | null;
  putaway_at?: number | null;
  putaway_notes?: string | null;
  
  created_at?: number;
  updated_at?: number;
  created_by?: number;
  is_active?: number;
}

class ReturnRequestItem extends Model<ReturnRequestItemAttributes, ReturnRequestItemCreationAttributes> {
  declare id: number;
  
  // Return Request Fields
  declare return_order_id: string;
  declare original_order_id: string;
  declare customer_id: number;
  declare return_reason: ReturnReason;
  declare status: ReturnStatus;
  declare return_type: ReturnType;
  declare total_items_count: number;
  declare total_return_amount: number;
  declare pidge_tracking_id: string | null;
  declare pickup_address: object | null;
  declare return_notes: string | null;
  declare images: string[] | null;
  
  // Return Item Fields
  declare item_id: number;
  declare quantity: number;
  declare item_details: string | null;
  declare variation: string | null;
  declare price: number;
  declare item_images: string[] | null;
  declare item_notes: string | null;
  
  // QC Fields
  declare qc_status: QCStatus;
  declare qc_notes: string | null;
  declare qc_by: number | null;
  declare qc_at: number | null;
  
  // Timeline Fields
  declare timeline_events: object[] | null;
  declare last_event_type: TimelineEvent;
  declare last_event_notes: string | null;
  declare last_event_metadata: object | null;
  
  // Try and Buy Specific Fields
  declare is_try_and_buy: number;
  declare customer_feedback: string | null;
  declare overall_rating: number | null;
  declare item_feedback: string | null;
  declare item_rating: number | null;
  declare try_and_buy_reason: string | null;
  
  // GRN Fields
  declare grn_id: string | null;
  declare grn_status: string | null;
  declare received_quantity: number | null;
  declare expected_quantity: number | null;
  declare qc_pass_qty: number | null;
  declare qc_fail_qty: number | null;
  
  // Putaway Fields
  declare putaway_status: string | null;
  declare bin_location_id: string | null;
  declare putaway_by: number | null;
  declare putaway_at: number | null;
  declare putaway_notes: string | null;
  
  // Audit Fields
  declare created_at: number;
  declare updated_at: number;
  declare created_by: number;
  declare is_active: number;
}

ReturnRequestItem.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  
  // Return Request Fields
  return_order_id: { 
    type: DataTypes.STRING(50), 
    allowNull: false, 
    unique: true,
    comment: 'Original order_id + "-PD" suffix'
  },
  original_order_id: { 
    type: DataTypes.STRING(50), 
    allowNull: false,
    comment: 'Reference to original order'
  },
  customer_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  return_reason: { 
    type: DataTypes.ENUM(...Object.values(RETURN_CONSTANTS.REASONS)), 
    allowNull: false 
  },
  status: { 
    type: DataTypes.ENUM(...Object.values(RETURN_CONSTANTS.STATUSES)), 
    allowNull: false, 
    defaultValue: RETURN_CONSTANTS.DEFAULTS.STATUS 
  },
  return_type: { 
    type: DataTypes.ENUM(...Object.values(RETURN_CONSTANTS.TYPES)), 
    allowNull: false, 
    defaultValue: RETURN_CONSTANTS.DEFAULTS.RETURN_TYPE 
  },
  total_items_count: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    defaultValue: RETURN_CONSTANTS.DEFAULTS.TOTAL_ITEMS_COUNT 
  },
  total_return_amount: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false, 
    defaultValue: RETURN_CONSTANTS.DEFAULTS.TOTAL_RETURN_AMOUNT 
  },
  pidge_tracking_id: { 
    type: DataTypes.STRING(100), 
    allowNull: true,
    comment: 'External logistics tracking ID'
  },
  pickup_address: { 
    type: DataTypes.JSON, 
    allowNull: true,
    comment: 'Customer pickup address details'
  },
  return_notes: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    comment: 'Additional return notes'
  },
  images: { 
    type: DataTypes.JSON, 
    allowNull: true,
    comment: 'Array of image URLs'
  },
  
  // Return Item Fields
  item_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    comment: 'Reference to product/item'
  },
  quantity: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    validate: { min: 1 }
  },
  item_details: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    comment: 'Item details at time of return'
  },
  variation: { 
    type: DataTypes.STRING(255), 
    allowNull: true,
    comment: 'Item variation details'
  },
  price: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false,
    defaultValue: 0.00
  },
  item_images: { 
    type: DataTypes.JSON, 
    allowNull: true,
    comment: 'Item-specific return images'
  },
  item_notes: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    comment: 'Item-specific return notes'
  },
  
  // QC Fields
  qc_status: { 
    type: DataTypes.ENUM(...Object.values(RETURN_CONSTANTS.QC_STATUSES)), 
    allowNull: false, 
    defaultValue: RETURN_CONSTANTS.DEFAULTS.QC_STATUS 
  },
  qc_notes: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    comment: 'QC inspection notes'
  },
  qc_by: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    comment: 'User who performed QC'
  },
  qc_at: { 
    type: DataTypes.BIGINT, 
    allowNull: true,
    comment: 'QC completion timestamp'
  },
  
  // Timeline Fields
  timeline_events: { 
    type: DataTypes.JSON, 
    allowNull: true,
    comment: 'Array of timeline events'
  },
  last_event_type: { 
    type: DataTypes.ENUM(...Object.values(RETURN_CONSTANTS.TIMELINE_EVENTS)), 
    allowNull: false, 
    defaultValue: RETURN_CONSTANTS.TIMELINE_EVENTS.CREATED 
  },
  last_event_notes: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    comment: 'Last timeline event notes'
  },
  last_event_metadata: { 
    type: DataTypes.JSON, 
    allowNull: true,
    comment: 'Last timeline event metadata'
  },
  
  // Try and Buy Specific Fields
  is_try_and_buy: { 
    type: DataTypes.TINYINT, 
    allowNull: false, 
    defaultValue: 0 
  },
  customer_feedback: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    comment: 'Customer feedback for try and buy'
  },
  overall_rating: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    validate: { min: 1, max: 5 }
  },
  item_feedback: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    comment: 'Item-specific feedback'
  },
  item_rating: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    validate: { min: 1, max: 5 }
  },
  try_and_buy_reason: { 
    type: DataTypes.STRING(50), 
    allowNull: true,
    comment: 'Try and buy specific reason'
  },
  
  // GRN Fields
  grn_id: { 
    type: DataTypes.STRING(50), 
    allowNull: true,
    comment: 'Reference to GRN'
  },
  grn_status: { 
    type: DataTypes.STRING(50), 
    allowNull: true,
    comment: 'GRN status'
  },
  received_quantity: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    comment: 'Quantity received in GRN'
  },
  expected_quantity: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    comment: 'Expected quantity in GRN'
  },
  qc_pass_qty: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    comment: 'QC passed quantity for putaway'
  },
  qc_fail_qty: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    comment: 'QC failed quantity'
  },
  
  // Putaway Fields
  putaway_status: { 
    type: DataTypes.STRING(50), 
    allowNull: true,
    comment: 'Putaway status'
  },
  bin_location_id: { 
    type: DataTypes.STRING(50), 
    allowNull: true,
    comment: 'Bin location for putaway'
  },
  putaway_by: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    comment: 'User who performed putaway'
  },
  putaway_at: { 
    type: DataTypes.BIGINT, 
    allowNull: true,
    comment: 'Putaway completion timestamp'
  },
  putaway_notes: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    comment: 'Putaway notes'
  },
  
  // Audit Fields
  created_at: { type: DataTypes.BIGINT, allowNull: false },
  updated_at: { type: DataTypes.BIGINT, allowNull: false },
  created_by: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  is_active: { 
    type: DataTypes.TINYINT, 
    allowNull: false, 
    defaultValue: RETURN_CONSTANTS.DEFAULTS.IS_ACTIVE 
  }
}, {
  sequelize,
  tableName: 'return_request_items',
  timestamps: false,
  indexes: [
    { fields: ['return_order_id'], unique: true },
    { fields: ['original_order_id'] },
    { fields: ['customer_id'] },
    { fields: ['status'] },
    { fields: ['item_id'] },
    { fields: ['qc_status'] },
    { fields: ['is_try_and_buy'] },
    { fields: ['grn_id'] },
    { fields: ['putaway_status'] },
    { fields: ['created_at'] }
  ]
});

// Associations
User.hasMany(ReturnRequestItem, { foreignKey: 'customer_id', as: 'returnRequestItems' });
ReturnRequestItem.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

User.hasMany(ReturnRequestItem, { foreignKey: 'created_by', as: 'createdReturnRequestItems' });
ReturnRequestItem.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Order associations
Order.hasMany(ReturnRequestItem, { foreignKey: 'original_order_id', sourceKey: 'order_id', as: 'returnRequestItems' });
ReturnRequestItem.belongsTo(Order, { foreignKey: 'original_order_id', targetKey: 'order_id', as: 'originalOrder' });

// Product associations
Product.hasMany(ReturnRequestItem, { foreignKey: 'item_id', sourceKey: 'sku', as: 'returnRequestItems' });
ReturnRequestItem.belongsTo(Product, { foreignKey: 'item_id', targetKey: 'sku', as: 'product' });

export default ReturnRequestItem;
