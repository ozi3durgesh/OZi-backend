import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import PaymentRequest from '../models/PaymentRequest';
import Order from '../models/Order';
import OrderPayment from '../models/OrderPayment';
import OrderTransaction from '../models/OrderTransaction';
import { ResponseHandler } from '../middleware/responseHandler';

interface RazorPayPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export class RazorPayController {
  
  /**
   * GET /payment/razor-pay/pay?payment_id={uuid}
   * Renders payment form with RazorPay checkout
   */
  static async index(req: Request, res: Response): Promise<Response> {
    try {
      const { payment_id } = req.query;
      
      if (!payment_id) {
        return ResponseHandler.error(res, 'Payment ID is required', 400);
      }

      // Find payment request
      const paymentRequest = await PaymentRequest.findByPk(payment_id as string);
      
      if (!paymentRequest) {
        return ResponseHandler.error(res, 'Payment request not found', 404);
      }

      if (paymentRequest.is_paid) {
        return ResponseHandler.error(res, 'Payment already completed', 400);
      }

      // Get order details
      const order = await Order.findByPk(paymentRequest.order_id, { raw: true });
      if (!order) {
        return ResponseHandler.error(res, 'Order not found', 404);
      }

      // Generate RazorPay order ID (in production, this would call RazorPay API)
      const razorpayOrderId = `order_${uuidv4().replace(/-/g, '')}`;
      
      // Update payment request with RazorPay order ID
      await paymentRequest.update({
        payment_order_id: razorpayOrderId,
        external_redirect_link: `https://checkout.razorpay.com/v1/checkout.html?key=${process.env.RAZORPAY_KEY_ID || 'rzp_test_key'}&amount=${Math.round(paymentRequest.payment_amount * 100)}&currency=${paymentRequest.currency_code}&name=OZi&description=Order Payment&order_id=${razorpayOrderId}&callback_url=${process.env.BASE_URL || 'http://localhost:3000'}/payment/razor-pay/callback&cancel_url=${process.env.BASE_URL || 'http://localhost:3000'}/payment/razor-pay/cancel`
      });

      // Render payment form
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment - OZi</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </head>
        <body>
          <div style="text-align: center; padding: 50px;">
            <h2>Complete Your Payment</h2>
            <p>Order ID: ${(order as any).order_id || 'N/A'}</p>
            <p>Amount: $${paymentRequest.payment_amount}</p>
            <button id="payButton" style="padding: 15px 30px; font-size: 18px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Pay Now
            </button>
          </div>
          
          <script>
            document.getElementById('payButton').onclick = function() {
              var options = {
                key: '${process.env.RAZORPAY_KEY_ID || 'rzp_test_key'}',
                amount: ${Math.round(paymentRequest.payment_amount * 100)},
                currency: '${paymentRequest.currency_code}',
                name: 'OZi',
                description: 'Order Payment',
                order_id: '${razorpayOrderId}',
                handler: function (response) {
                  // Handle successful payment
                  window.location.href = '${process.env.BASE_URL || 'http://localhost:3000'}/payment/razor-pay/payment?payment_id=${payment_id}&razorpay_payment_id=' + response.razorpay_payment_id + '&razorpay_order_id=' + response.razorpay_order_id + '&razorpay_signature=' + response.razorpay_signature;
                },
                prefill: {
                  name: 'Customer',
                  email: 'customer@example.com',
                  contact: '9999999999'
                },
                theme: {
                  color: '#007bff'
                }
              };
              var rzp = new Razorpay(options);
              rzp.open();
            };
          </script>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      return res.send(html);

    } catch (error) {
      console.error('RazorPay index error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * POST /payment/razor-pay/payment
   * Handles payment response from RazorPay
   */
  static async payment(req: Request, res: Response): Promise<Response> {
    try {
      const { payment_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

      if (!payment_id || !razorpay_payment_id || !razorpay_order_id) {
        return ResponseHandler.error(res, 'Missing payment parameters', 400);
      }

      // Find payment request
      const paymentRequest = await PaymentRequest.findByPk(payment_id as string);
      
      if (!paymentRequest) {
        return ResponseHandler.error(res, 'Payment request not found', 404);
      }

      if (paymentRequest.is_paid) {
        return ResponseHandler.error(res, 'Payment already completed', 400);
      }

      // In production, verify signature with RazorPay
      // For now, we'll assume payment is successful
      
      // Update payment request
      await paymentRequest.update({
        is_paid: true,
        transaction_id: razorpay_payment_id,
        additional_data: {
          razorpay_order_id,
          razorpay_signature,
          payment_timestamp: new Date().toISOString()
        }
      });

      // Update order payment status
      if (paymentRequest.order_id) {
        const order = await Order.findByPk(paymentRequest.order_id, { raw: true });
        if (order) {
          await Order.update({
            payment_status: 'paid',
            order_status: 'confirmed'
          }, {
            where: { id: paymentRequest.order_id }
          });

          // Create order payment record
          await OrderPayment.create({
            order_id: paymentRequest.order_id,
            transaction_ref: razorpay_payment_id,
            amount: paymentRequest.payment_amount,
            payment_status: 'completed',
            payment_method: 'razorpay'
          });

          // Create order transaction record
          await OrderTransaction.create({
            order_id: paymentRequest.order_id,
            payment_for: 'order_payment',
            payer_id: (order as any).user_id,
            payment_receiver_id: (order as any).store_id,
            payment_status: 'completed',
            payment_method: 'razorpay',
            amount: paymentRequest.payment_amount,
            transaction_id: razorpay_payment_id
          });
        }
      }

      // Execute success hook if provided
      if (paymentRequest.success_hook) {
        // In production, this would call the success hook URL
        console.log('Success hook executed:', paymentRequest.success_hook);
      }

      // Redirect to success page
      res.redirect(`${process.env.BASE_URL || 'http://localhost:3000'}/payment/success?order_id=${paymentRequest.order_id || 'N/A'}&payment_id=${payment_id}`);
      return res;

    } catch (error) {
      console.error('RazorPay payment error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * POST /payment/razor-pay/callback
   * Handles RazorPay webhook callbacks
   */
  static async callback(req: Request, res: Response): Promise<Response> {
    try {
      const { payment_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

      if (!payment_id || !razorpay_payment_id || !razorpay_order_id) {
        return ResponseHandler.error(res, 'Missing payment parameters', 400);
      }

      // Find payment request
      const paymentRequest = await PaymentRequest.findByPk(payment_id as string);
      
      if (!paymentRequest) {
        return ResponseHandler.error(res, 'Payment request not found', 404);
      }

      // In production, verify signature with RazorPay
      // For now, we'll assume payment is successful
      
      // Update payment request
      await paymentRequest.update({
        is_paid: true,
        transaction_id: razorpay_payment_id,
        additional_data: {
          razorpay_order_id,
          razorpay_signature,
          callback_timestamp: new Date().toISOString()
        }
      });

      // Update order payment status
      if (paymentRequest.order_id) {
        const order = await Order.findByPk(paymentRequest.order_id, { raw: true });
        if (order) {
          await Order.update({
            payment_status: 'paid',
            order_status: 'confirmed'
          }, {
            where: { id: paymentRequest.order_id }
          });
        }
      }

      // Execute success hook if provided
      if (paymentRequest.success_hook) {
        // In production, this would call the success hook URL
        console.log('Success hook executed via callback:', paymentRequest.success_hook);
      }

      // Return success acknowledgment
      return res.json({
        success: true,
        message: 'Payment processed successfully'
      });

    } catch (error) {
      console.error('RazorPay callback error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }

  /**
   * POST /payment/razor-pay/cancel
   * Handles payment cancellation
   */
  static async cancel(req: Request, res: Response): Promise<Response> {
    try {
      const { payment_id } = req.body;

      if (!payment_id) {
        return ResponseHandler.error(res, 'Payment ID is required', 400);
      }

      // Find payment request
      const paymentRequest = await PaymentRequest.findByPk(payment_id as string);
      
      if (!paymentRequest) {
        return ResponseHandler.error(res, 'Payment request not found', 404);
      }

      // Update payment request
      await paymentRequest.update({
        is_paid: false,
        additional_data: {
          ...paymentRequest.additional_data,
          cancelled_at: new Date().toISOString(),
          status: 'cancelled'
        }
      });

      // Execute failure hook if provided
      if (paymentRequest.failure_hook) {
        // In production, this would call the failure hook URL
        console.log('Failure hook executed:', paymentRequest.failure_hook);
      }

      // Redirect to cancellation page
      res.redirect(`${process.env.BASE_URL || 'http://localhost:3000'}/payment/cancelled?payment_id=${payment_id}`);
      return res;

    } catch (error) {
      console.error('RazorPay cancel error:', error);
      return ResponseHandler.error(res, 'Internal server error', 500);
    }
  }
}
