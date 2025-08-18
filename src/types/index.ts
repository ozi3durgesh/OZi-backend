export interface ApiResponse<T = any> {
  statusCode: number;
  success: boolean;
  data?: T;
  error?: string | null;
}

export interface RoleAttributes {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionAttributes {
  id: number;
  module: string;
  action: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermissionAttributes {
  id: number;
  roleId: number;
  permissionId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  permissions: string[];
}

export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  roleId: number;
  isActive: boolean;
  availabilityStatus: 'available' | 'break' | 'off-shift';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes {
  email: string;
  password: string;
  roleId?: number;
  isActive?: boolean;
  availabilityStatus?: 'available' | 'break' | 'off-shift';
}

// Add these to your existing types/index.ts file

export interface CouponAttributes {
  id: number;
  title: string;
  code: string;
  start_date: string;
  expire_date: string;
  min_purchase: number;
  max_discount: number;
  discount: number;
  discount_type: string;
  coupon_type: string;
  limit: number;
  status: number;
  created_at: string;
  updated_at: string;
  data: string;
  total_uses: number;
  module_id: number;
  created_by: string;
  customer_id: string;
  slug: string | null;
  store_id: number;
}

export interface CouponCreationAttributes {
  title: string;
  code: string;
  start_date: string;
  expire_date: string;
  min_purchase?: number;
  max_discount?: number;
  discount: number;
  discount_type?: string;
  coupon_type?: string;
  limit?: number;
  status?: number;
  data?: string;
  total_uses?: number;
  module_id: number;
  created_by: string;
  customer_id?: string;
  slug?: string | null;
  store_id: number;
}

export interface CouponTranslationAttributes {
  id: number;
  translationable_type: string;
  translationable_id: number;
  locale: string;
  key: string;
  value: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CouponTranslationCreationAttributes {
  translationable_type: string;
  translationable_id: number;
  locale: string;
  key: string;
  value: string;
  created_at?: string | null;
  updated_at?: string | null;
}

// New Order Types
export interface CartItem {
  sku: number;
  amount: number;
}

export interface OrderAttributes {
  id: number;
  user_id: number;
  cart: CartItem[];
  coupon_discount_amount: number;
  order_amount: number;
  order_type: string;
  payment_method: string;
  store_id: number;
  distance: number;
  discount_amount: number;
  tax_amount: number;
  address: string;
  latitude: number;
  longitude: number;
  contact_person_name: string;
  contact_person_number: string;
  address_type: string;
  is_scheduled: number;
  scheduled_timestamp: number;
  promised_delv_tat: string;
  created_at: number;
  updated_at: number;
}

export interface OrderCreationAttributes {
  user_id: number;
  cart: CartItem[];
  coupon_discount_amount?: number;
  order_amount: number;
  order_type: string;
  payment_method: string;
  store_id: number;
  distance?: number;
  discount_amount?: number;
  tax_amount?: number;
  address: string;
  latitude?: number;
  longitude?: number;
  contact_person_name?: string;
  contact_person_number: string;
  address_type?: string;
  is_scheduled?: number;
  scheduled_timestamp?: number;
  promised_delv_tat?: string;
  created_at?: number;  // Add this
  updated_at?: number;  // Add this
}