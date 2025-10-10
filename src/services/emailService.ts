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
      // Handle both direct product objects and Sequelize model instances
      const productName = product.productName || product.dataValues?.productName || 'N/A';
      const catalogueId = product.sku || product.dataValues?.sku || product.Product?.catalogue_id || 'N/A';
      const quantity = product.quantity || product.dataValues?.quantity || 'N/A';
      const unitPrice = product.unitPrice || product.dataValues?.unitPrice || 'N/A';
      const totalAmount = product.totalAmount || product.dataValues?.totalAmount || 'N/A';
      const hsn = product.hsn || product.dataValues?.hsn || product.Product?.hsn || 'N/A';
      const eanUpc = product.ean_upc || product.dataValues?.ean_upc || product.Product?.ean_upc || 'N/A';
      const weight = product.weight || product.dataValues?.weight || product.Product?.weight || 'N/A';
      const dimensions = `${product.length || product.dataValues?.length || product.Product?.length || 'N/A'} x ${product.width || product.dataValues?.width || product.Product?.width || 'N/A'} x ${product.height || product.dataValues?.height || product.Product?.height || 'N/A'}`;
      const mrp = product.mrp || product.dataValues?.mrp || product.Product?.mrp || 'N/A';
      const cost = product.cost || product.dataValues?.cost || product.Product?.cost || 'N/A';
      const gst = product.gst || product.dataValues?.gst || product.Product?.gst || 'N/A';
      const description = product.description || product.dataValues?.description || product.Product?.description || 'N/A';
      
      productLines += `
        <tr>
          <td>${productName}</td>
          <td>${catalogueId}</td>
          <td>${quantity}</td>
          <td>₹${unitPrice}</td>
          <td>₹${totalAmount}</td>
          <td>${hsn}</td>
          <td>${eanUpc}</td>
          <td>${weight} kg</td>
          <td>${dimensions}</td>
          <td>₹${mrp}</td>
          <td>₹${cost}</td>
          <td>${gst}%</td>
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
          .products-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
          .products-table th, .products-table td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          .products-table th { background-color: #f2f2f2; font-weight: bold; }
          .products-table td { word-wrap: break-word; }
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
                  <th>Catalogue ID</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>HSN</th>
                  <th>EAN/UPC</th>
                  <th>Weight</th>
                  <th>Dimensions (L×W×H)</th>
                  <th>MRP</th>
                  <th>Cost</th>
                  <th>GST%</th>
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
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3>Next Steps for Creator:</h3>
                <p>Please upload the Proforma Invoice (PI) and set the expected delivery date:</p>
                <div style="text-align: center; margin: 15px 0;">
                  <a href="${process.env.APP_BASE_URL_FRONTEND}/dc-po/${poId}/upload-pi" class="approval-link">Upload PI & Set Delivery Date</a>
                </div>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                  <strong>Note:</strong> Upload the PI document and provide the expected delivery date to complete the purchase order process.
                </p>
              </div>
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

  /**
   * Send DC-PO final notification email to all stakeholders
   */
  static async sendDCFinalNotificationEmail(
    to: string[], 
    poId: string, 
    vendorName: string, 
    dcName: string, 
    totalAmount: number, 
    priority: string,
    deliveryDate: Date | null,
    piNotes: string | null,
    piFileUrl: string | null,
    products: any[]
  ): Promise<boolean> {
    let productLines = '';
    for (const product of products) {
      // Handle both direct product objects and Sequelize model instances
      const productName = product.productName || product.dataValues?.productName || 'N/A';
      const catalogueId = product.sku || product.dataValues?.sku || product.Product?.catalogue_id || 'N/A';
      const quantity = product.quantity || product.dataValues?.quantity || 'N/A';
      const unitPrice = product.unitPrice || product.dataValues?.unitPrice || 'N/A';
      const totalAmount = product.totalAmount || product.dataValues?.totalAmount || 'N/A';
      const hsn = product.hsn || product.dataValues?.hsn || product.Product?.hsn || 'N/A';
      const eanUpc = product.ean_upc || product.dataValues?.ean_upc || product.Product?.ean_upc || 'N/A';
      const weight = product.weight || product.dataValues?.weight || product.Product?.weight || 'N/A';
      const dimensions = `${product.length || product.dataValues?.length || product.Product?.length || 'N/A'} x ${product.width || product.dataValues?.width || product.Product?.width || 'N/A'} x ${product.height || product.dataValues?.height || product.Product?.height || 'N/A'}`;
      const mrp = product.mrp || product.dataValues?.mrp || product.Product?.mrp || 'N/A';
      const cost = product.cost || product.dataValues?.cost || product.Product?.cost || 'N/A';
      const gst = product.gst || product.dataValues?.gst || product.Product?.gst || 'N/A';
      
      productLines += `
        <tr>
          <td>${productName}</td>
          <td>${catalogueId}</td>
          <td>${quantity}</td>
          <td>₹${unitPrice}</td>
          <td>₹${totalAmount}</td>
          <td>${hsn}</td>
          <td>${eanUpc}</td>
          <td>${weight} kg</td>
          <td>${dimensions}</td>
          <td>₹${mrp}</td>
          <td>₹${cost}</td>
          <td>${gst}%</td>
        </tr>
      `;
    }

    const deliveryDateFormatted = deliveryDate ? new Date(deliveryDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'Not specified';

    const piFileLink = piFileUrl ? `<a href="${piFileUrl}" target="_blank" style="color: #007bff; text-decoration: none;">Download PI Document</a>` : 'No PI document uploaded';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; padding: 20px; text-align: center; color: white; }
          .content { padding: 20px; }
          .po-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .delivery-info { background-color: #e8f5e8; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #28a745; }
          .products-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
          .products-table th, .products-table td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          .products-table th { background-color: #f2f2f2; font-weight: bold; }
          .products-table td { word-wrap: break-word; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          .success-badge { background-color: #28a745; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 DC Purchase Order Completed</h1>
            <p>Purchase Order has been successfully approved and PI uploaded</p>
          </div>
          
          <div class="content">
            <p>Dear Team,</p>
            
            <div class="po-details">
              <h3>Purchase Order Details:</h3>
              <p><strong>PO ID:</strong> ${poId}</p>
              <p><strong>Vendor:</strong> ${vendorName}</p>
              <p><strong>Distribution Center:</strong> ${dcName}</p>
              <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
              <p><strong>Priority:</strong> ${priority}</p>
              <p><strong>Status:</strong> <span class="success-badge">APPROVED</span></p>
            </div>

            <div class="delivery-info">
              <h3>📦 Delivery Information:</h3>
              <p><strong>Expected Delivery Date:</strong> ${deliveryDateFormatted}</p>
              <p><strong>PI Notes:</strong> ${piNotes || 'No additional notes provided'}</p>
              <p><strong>PI Document:</strong> ${piFileLink}</p>
            </div>

            <h3>Products:</h3>
            <table class="products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Catalogue ID</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>HSN</th>
                  <th>EAN/UPC</th>
                  <th>Weight</th>
                  <th>Dimensions (L×W×H)</th>
                  <th>MRP</th>
                  <th>Cost</th>
                  <th>GST%</th>
                </tr>
              </thead>
              <tbody>
                ${productLines}
              </tbody>
            </table>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>✅ Next Steps:</h3>
              <ul>
                <li>Vendor will prepare the products for delivery</li>
                <li>Expected delivery date: <strong>${deliveryDateFormatted}</strong></li>
                <li>Distribution Center will receive and process the delivery</li>
                <li>Inventory will be updated upon delivery confirmation</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>Thanks,<br>Ozi Technologies</p>
            <p style="font-size: 12px; color: #666;">This is a system-generated email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(to, `DC-PO ${poId} - Purchase Order Completed & PI Uploaded`, html);
  }
}
