import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { RETURN_CONSTANTS } from '../config/returnConstants';

interface ReturnRejectGrnAttributes {
  id: number;
  
  // Return Request References
  return_order_id: string;
  return_request_item_id: number;
  original_order_id: string;
  customer_id: number;
  
  // Product Details
  item_id: number;
  sku_id: string;
  product_name: string | null;
  product_category: string | null;
  product_brand: string | null;
  product_mrp: number | null;
  product_cost: number | null;
  
  // Return Details
  return_type: string;
  return_reason: string;
  original_quantity: number;
  rejected_quantity: number;
  original_price: number;
  
  // Rejection Details
  rejection_reason: string;
  rejection_notes: string | null;
  rejection_category: string;
  rejection_severity: string;
  
  // Photo References
  photo_urls: string[] | null;
  photo_count: number;
  
  // GRN Details
  grn_id: string;
  grn_notes: string | null;
  grn_status: string;
  
  // Processing Details
  processed_by: number;
  processed_at: Date | null;
  
  // Try and Buy Specific
  is_try_and_buy: boolean;
  try_and_buy_feedback: string | null;
  try_and_buy_rating: number | null;
  
  // Additional Metadata
  item_details: string | null;
  variation: string | null;
  customer_feedback: string | null;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

interface ReturnRejectGrnCreationAttributes {
  return_order_id: string;
  return_request_item_id: number;
  original_order_id: string;
  customer_id: number;
  item_id: number;
  sku_id: string;
  product_name?: string | null;
  product_category?: string | null;
  product_brand?: string | null;
  product_mrp?: number | null;
  product_cost?: number | null;
  return_type: string;
  return_reason: string;
  original_quantity: number;
  rejected_quantity: number;
  original_price: number;
  rejection_reason: string;
  rejection_notes?: string | null;
  rejection_category: string;
  rejection_severity?: string;
  photo_urls?: string[] | null;
  photo_count?: number;
  grn_id: string;
  grn_notes?: string | null;
  grn_status?: string;
  processed_by: number;
  processed_at?: Date | null;
  is_try_and_buy?: boolean;
  try_and_buy_feedback?: string | null;
  try_and_buy_rating?: number | null;
  item_details?: string | null;
  variation?: string | null;
  customer_feedback?: string | null;
}

class ReturnRejectGrn extends Model<ReturnRejectGrnAttributes, ReturnRejectGrnCreationAttributes> 
  implements ReturnRejectGrnAttributes {
  
  public id!: number;
  public return_order_id!: string;
  public return_request_item_id!: number;
  public original_order_id!: string;
  public customer_id!: number;
  public item_id!: number;
  public sku_id!: string;
  public product_name!: string | null;
  public product_category!: string | null;
  public product_brand!: string | null;
  public product_mrp!: number | null;
  public product_cost!: number | null;
  public return_type!: string;
  public return_reason!: string;
  public original_quantity!: number;
  public rejected_quantity!: number;
  public original_price!: number;
  public rejection_reason!: string;
  public rejection_notes!: string | null;
  public rejection_category!: string;
  public rejection_severity!: string;
  public photo_urls!: string[] | null;
  public photo_count!: number;
  public grn_id!: string;
  public grn_notes!: string | null;
  public grn_status!: string;
  public processed_by!: number;
  public processed_at!: Date | null;
  public is_try_and_buy!: boolean;
  public try_and_buy_feedback!: string | null;
  public try_and_buy_rating!: number | null;
  public item_details!: string | null;
  public variation!: string | null;
  public customer_feedback!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
}

ReturnRejectGrn.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    return_order_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    return_request_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    original_order_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sku_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    product_category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    product_brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    product_mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    product_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    return_type: {
      type: DataTypes.ENUM('full_return', 'partial_return', 'exchange', 'try_and_buy_return'),
      allowNull: false,
    },
    return_reason: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    original_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rejected_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    original_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    rejection_reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rejection_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejection_category: {
      type: DataTypes.ENUM('damaged', 'defective', 'wrong_item', 'quality_issue', 'expired', 'other'),
      allowNull: false,
    },
    rejection_severity: {
      type: DataTypes.ENUM('minor', 'major', 'critical'),
      allowNull: false,
      defaultValue: 'minor',
    },
    photo_urls: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    photo_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    grn_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    grn_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    grn_status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    processed_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_try_and_buy: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    try_and_buy_feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    try_and_buy_rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    item_details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    variation: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    customer_feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'return_reject_grn',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['return_order_id'] },
      { fields: ['return_request_item_id'] },
      { fields: ['original_order_id'] },
      { fields: ['customer_id'] },
      { fields: ['item_id'] },
      { fields: ['sku_id'] },
      { fields: ['grn_id'] },
      { fields: ['rejection_category'] },
      { fields: ['grn_status'] },
      { fields: ['processed_by'] },
      { fields: ['created_at'] },
      { fields: ['is_try_and_buy'] },
    ],
  }
);

export default ReturnRejectGrn;
