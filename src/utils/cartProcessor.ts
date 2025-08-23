import { Transaction, Op } from 'sequelize';
import Product from '../models/Product';
import ProductVariant from '../models/ProductVariant';
import Coupon from '../models/Coupon';
import sequelize from '../config/database';

export interface ProcessedCartItem {
  sku: number;
  amount: number;
  quantity: number;
  item_type: string;
  price: number;
  variant: any[];
  variation: any[];
  add_on_ids: number[];
  add_on_qtys: number[];
  add_ons: any[];
  
  // Processed fields
  product_id: number;
  product_name: string;
  base_price: number;
  final_price: number;
  stock_available: number;
  stock_validated: boolean;
  variants_processed: boolean;
  price_calculated: boolean;
  validation_errors?: string[];
}

export interface CartProcessingResult {
  success: boolean;
  processedItems: ProcessedCartItem[];
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  couponDiscountAmount: number;
  deliveryCharge: number;
  finalAmount: number;
  stockValidationPassed: boolean;
  priceValidationPassed: boolean;
  errors: string[];
  warnings: string[];
}

export interface CouponValidationResult {
  isValid: boolean;
  discount: number;
  coupon?: any;
  message?: string;
}

export class CartProcessor {
  
  /**
   * Process cart items with product lookup, variant processing, and stock validation
   */
  static async processCart(
    cart: any[],
    storeId: number,
    couponCode?: string,
    transaction?: Transaction
  ): Promise<CartProcessingResult> {
    const result: CartProcessingResult = {
      success: false,
      processedItems: [],
      totalAmount: 0,
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      couponDiscountAmount: 0,
      deliveryCharge: 0,
      finalAmount: 0,
      stockValidationPassed: false,
      priceValidationPassed: false,
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Process each cart item
      for (const cartItem of cart) {
        const processedItem = await this.processCartItem(cartItem, storeId, transaction);
        result.processedItems.push(processedItem);
        
        // Check for validation errors
        if (processedItem.validation_errors && processedItem.validation_errors.length > 0) {
          result.errors.push(...processedItem.validation_errors);
        }
      }

      // Step 2: Calculate totals
      result.subtotal = this.calculateSubtotal(result.processedItems);
      
      // Step 3: Process coupon if provided
      if (couponCode) {
        const couponResult = await this.validateAndApplyCoupon(
          couponCode,
          storeId,
          result.subtotal,
          transaction
        );
        
        if (couponResult.isValid) {
          result.couponDiscountAmount = couponResult.discount;
          result.discountAmount += couponResult.discount;
        } else {
          result.warnings.push(`Coupon validation failed: ${couponResult.message}`);
        }
      }

      // Step 4: Calculate final amounts
      result.totalAmount = result.subtotal;
      result.finalAmount = result.totalAmount - result.discountAmount;

      // Step 5: Validate overall results
      result.stockValidationPassed = result.processedItems.every(item => item.stock_validated);
      result.priceValidationPassed = result.processedItems.every(item => item.price_calculated);
      
      result.success = result.errors.length === 0 && result.stockValidationPassed && result.priceValidationPassed;

    } catch (error) {
      console.error('Cart processing error:', error);
      result.errors.push(`Cart processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Process individual cart item with product lookup and validation
   */
  private static async processCartItem(
    cartItem: any,
    storeId: number,
    transaction?: Transaction
  ): Promise<ProcessedCartItem> {
    const processedItem: ProcessedCartItem = {
      ...cartItem,
      product_id: 0,
      product_name: '',
      base_price: 0,
      final_price: 0,
      stock_available: 0,
      stock_validated: false,
      variants_processed: false,
      price_calculated: false,
      validation_errors: []
    };

    try {
      // Step 1: Product lookup by SKU
      const product = await Product.findOne({
        where: { 
          sku: cartItem.sku,
          store_id: storeId,
          status: 'active'
        },
        transaction
      });

      if (!product) {
        processedItem.validation_errors!.push(`Product with SKU ${cartItem.sku} not found or inactive`);
        return processedItem;
      }

      processedItem.product_id = product.id;
      processedItem.product_name = product.name;
      processedItem.base_price = parseFloat(product.base_price.toString());

      // Step 2: Variant processing
      if (cartItem.variant && cartItem.variant.length > 0) {
        const variantResult = await this.processVariants(
          product.id,
          cartItem.variant,
          transaction
        );
        
        if (variantResult.success) {
          processedItem.final_price = variantResult.finalPrice;
          processedItem.variants_processed = true;
        } else {
          processedItem.validation_errors!.push(`Variant processing failed: ${variantResult.message}`);
        }
      } else {
        // No variants, use base price
        processedItem.final_price = processedItem.base_price;
        processedItem.variants_processed = true;
      }

      // Step 3: Stock validation
      const stockResult = await this.validateStock(
        product.id,
        cartItem.quantity || 1,
        cartItem.variant,
        transaction
      );

      if (stockResult.available) {
        processedItem.stock_available = stockResult.availableQuantity;
        processedItem.stock_validated = true;
      } else {
        processedItem.validation_errors!.push(`Insufficient stock for SKU ${cartItem.sku}. Available: ${stockResult.availableQuantity}, Requested: ${cartItem.quantity || 1}`);
      }

      // Step 4: Price calculation
      processedItem.final_price = processedItem.final_price * (cartItem.quantity || 1);
      processedItem.price_calculated = true;

      // Step 5: Validate amount consistency
      if (Math.abs(processedItem.final_price - cartItem.amount) > 0.01) {
        processedItem.validation_errors!.push(
          `Price mismatch for SKU ${cartItem.sku}. Calculated: ${processedItem.final_price}, Provided: ${cartItem.amount}`
        );
      }

    } catch (error) {
      console.error(`Error processing cart item ${cartItem.sku}:`, error);
      processedItem.validation_errors!.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return processedItem;
  }

  /**
   * Process product variants and calculate final price
   */
  private static async processVariants(
    productId: number,
    variants: any[],
    transaction?: Transaction
  ): Promise<{ success: boolean; finalPrice: number; message?: string }> {
    try {
      let finalPrice = 0;
      
      for (const variant of variants) {
        const variantRecord = await ProductVariant.findOne({
          where: {
            product_id: productId,
            variant_name: variant.name,
            variant_value: variant.value,
            status: 'active'
          },
          transaction
        });

        if (variantRecord) {
          finalPrice += parseFloat(variantRecord.price_modifier.toString());
        } else {
          return {
            success: false,
            finalPrice: 0,
            message: `Variant not found: ${variant.name} = ${variant.value}`
          };
        }
      }

      return { success: true, finalPrice };
    } catch (error) {
      return {
        success: false,
        finalPrice: 0,
        message: `Variant processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate stock availability for product and variants
   */
  private static async validateStock(
    productId: number,
    requestedQuantity: number,
    variants: any[],
    transaction?: Transaction
  ): Promise<{ available: boolean; availableQuantity: number; message?: string }> {
    try {
      // Get base product stock
      const product = await Product.findByPk(productId, { transaction });
      if (!product) {
        return { available: false, availableQuantity: 0, message: 'Product not found' };
      }

      let availableQuantity = product.stock_quantity;

      // Check variant stock if variants exist
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const variantRecord = await ProductVariant.findOne({
            where: {
              product_id: productId,
              variant_name: variant.name,
              variant_value: variant.value,
              status: 'active'
            },
            transaction
          });

          if (variantRecord) {
            // Use the lower of product stock or variant stock
            availableQuantity = Math.min(availableQuantity, variantRecord.stock_quantity);
          }
        }
      }

      return {
        available: availableQuantity >= requestedQuantity,
        availableQuantity
      };
    } catch (error) {
      return {
        available: false,
        availableQuantity: 0,
        message: `Stock validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate subtotal from processed items
   */
  private static calculateSubtotal(processedItems: ProcessedCartItem[]): number {
    return processedItems.reduce((total, item) => {
      return total + (item.final_price || 0);
    }, 0);
  }

  /**
   * Validate and apply coupon
   */
  private static async validateAndApplyCoupon(
    couponCode: string,
    storeId: number,
    subtotal: number,
    transaction?: Transaction
  ): Promise<CouponValidationResult> {
    try {
      const coupon = await Coupon.findOne({
        where: {
          code: couponCode,
          store_id: storeId,
          status: 1, // Active status
          expire_date: {
            [Op.gte]: new Date()
          }
        },
        transaction
      });

      if (!coupon) {
        return { isValid: false, discount: 0, message: 'Coupon not found or expired' };
      }

      // Check minimum purchase requirement
      if (subtotal < coupon.min_purchase) {
        return {
          isValid: false,
          discount: 0,
          message: `Minimum purchase amount of ${coupon.min_purchase} required`
        };
      }

      // Check usage limit
      if (coupon.total_uses >= coupon.limit) {
        return {
          isValid: false,
          discount: 0,
          message: 'Coupon usage limit exceeded'
        };
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (subtotal * coupon.discount) / 100;
        // Apply max discount limit
        if (coupon.max_discount > 0) {
          discount = Math.min(discount, coupon.max_discount);
        }
      } else {
        discount = coupon.discount;
      }

      return {
        isValid: true,
        discount,
        coupon
      };
    } catch (error) {
      return {
        isValid: false,
        discount: 0,
        message: `Coupon validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
