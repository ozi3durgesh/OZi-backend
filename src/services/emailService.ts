import axios from 'axios';

interface EmailData {
  service: string;
  source: string;
  to: string[];
  subject: string;
  html: string;
}

export class EmailService {
  private static readonly API_URL = 'https://643ujvuida.execute-api.ap-south-1.amazonaws.com/';
  private static readonly SOURCE_EMAIL = 'autobot@ozi.in';

  /**
   * Send email via AWS API Gateway
   */
  static async sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
    try {
      // Validate that all recipients are from ozi.in domain
      const validRecipients = to.filter(email => {
        const domain = email.split('@')[1];
        return domain === 'ozi.in';
      });

      if (validRecipients.length === 0) {
        throw new Error('No valid recipients found. All recipients must be from ozi.in domain');
      }

      const emailData: EmailData = {
        service: 'send_email',
        source: this.SOURCE_EMAIL,
        to: validRecipients,
        subject,
        html
      };

      const response = await axios.post(this.API_URL, emailData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Email sent successfully:', response.data);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send DC-PO approval email
   */
  static async sendDCApprovalEmail(
    to: string[], 
    poId: string, 
    vendorName: string, 
    dcName: string, 
    totalAmount: number, 
    priority: string,
    products: any[],
    approvalLink: string,
    role: 'category_head' | 'admin' | 'creator'
  ): Promise<boolean> {
    let productLines = '';
    for (const product of products) {
      productLines += `
        <tr>
          <td>${product.productName || product.product}</td>
          <td>${product.sku || product.sku_id}</td>
          <td>${product.quantity || product.units}</td>
          <td>₹${product.unitPrice || product.mrp}</td>
          <td>₹${product.totalAmount || product.amount}</td>
        </tr>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .po-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .products-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .products-table th, .products-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .products-table th { background-color: #f2f2f2; }
          .approval-link { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DC Purchase Order ${role === 'creator' ? 'Created' : 'Approval Request'}</h1>
          </div>
          
          <div class="content">
            <p>Dear ${role.replace('_', ' ').toUpperCase()},</p>
            
            <div class="po-details">
              <h3>Purchase Order Details:</h3>
              <p><strong>PO ID:</strong> ${poId}</p>
              <p><strong>Vendor:</strong> ${vendorName}</p>
              <p><strong>Distribution Center:</strong> ${dcName}</p>
              <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
              <p><strong>Priority:</strong> ${priority}</p>
            </div>

            <h3>Products:</h3>
            <table class="products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${productLines}
              </tbody>
            </table>

            ${role !== 'creator' ? `
              <div style="text-align: center; margin: 20px 0;">
                <a href="${approvalLink}" class="approval-link">Approve/Reject Purchase Order</a>
              </div>
            ` : `
              <p>Please check the PO and submit PI details.</p>
            `}
          </div>
          
          <div class="footer">
            <p>Thanks,<br>Ozi Technologies</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(to, `DC-PO ${poId} - ${role === 'creator' ? 'Purchase Order Created' : 'Approval Request'}`, html);
  }
}
