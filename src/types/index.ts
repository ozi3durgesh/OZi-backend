export interface ApiResponse<T = any> {
  statusCode: number;
  success: boolean;
  data?: T;
  error?: string | null;
}

export interface JwtPayload {
  userId: number;
  email: string;
}

export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes {
  email: string;
  password: string;
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