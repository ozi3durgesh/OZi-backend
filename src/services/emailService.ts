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
      console.log('📧 EMAIL SERVICE DEBUG: sendEmail called');
      console.log('📧 EMAIL SERVICE DEBUG: To:', to);
      console.log('📧 EMAIL SERVICE DEBUG: Subject:', subject);
      
      // For vendor onboarding emails, allow any domain
      // For other emails, validate ozi.in domain
      let validRecipients = to;
      
      // Check if this is a vendor onboarding email by looking at the subject
      const isVendorOnboarding = subject.includes('Successfully Onboarded') || subject.includes('Welcome to OZI');
      console.log('📧 EMAIL SERVICE DEBUG: Is vendor onboarding:', isVendorOnboarding);
      
      if (!isVendorOnboarding) {
        // Validate that all recipients are from ozi.in domain for non-vendor emails
        validRecipients = to.filter(email => {
          const domain = email.split('@')[1];
          return domain === 'ozi.in';
        });

        if (validRecipients.length === 0) {
          throw new Error('No valid recipients found. All recipients must be from ozi.in domain');
        }
      }
      
      console.log('📧 EMAIL SERVICE DEBUG: Valid recipients:', validRecipients);

      const emailData: EmailData = {
        service: 'send_email',
        source: this.SOURCE_EMAIL,
        to: validRecipients,
        subject,
        html
      };

      console.log('📧 EMAIL SERVICE DEBUG: Sending to AWS API Gateway...');
      const response = await axios.post(this.API_URL, emailData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📧 EMAIL SERVICE DEBUG: AWS response:', response.data);
      return true;
    } catch (error) {
      console.error('📧 EMAIL SERVICE DEBUG: Failed to send email:', error);
      console.error('📧 EMAIL SERVICE DEBUG: Error details:', (error as any).response?.data || (error as Error).message);
      return false;
    }
  }

  /**
   * Send vendor onboarding email
   */
  static async sendVendorOnboardingEmail(
    to: string[], 
    vendorName: string, 
    vendorId: string,
    dcName: string,
    pocName: string,
    pocEmail: string,
    businessAddress: string,
    city: string,
    state: string,
    pincode: string,
    gstNumber: string,
    panNumber: string,
    vendorType: string,
    brandName?: string,
    model?: string,
    vrf?: string,
    paymentTerms?: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vendor Onboarding - OZI</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .vendor-info { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-label { font-weight: bold; color: #555; }
          .info-value { color: #333; }
          .success-badge { background: #4CAF50; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { background: #e8f5e8; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to OZI!</h1>
            <p>Vendor Onboarding Successful</p>
          </div>
          
          <div class="content">
            <div class="success-badge">✅ Vendor Successfully Onboarded</div>
            
            <div class="highlight">
              <h3>Dear ${pocName},</h3>
              <p>Congratulations! <strong>${vendorName}</strong> has been successfully onboarded as a vendor with OZI. We're excited to work with you!</p>
            </div>

            <div class="vendor-info">
              <h3>📋 Vendor Details</h3>
              <div class="info-row">
                <span class="info-label">Vendor ID:</span>
                <span class="info-value"><strong>${vendorId}</strong></span>
              </div>
              <div class="info-row">
                <span class="info-label">Business Name:</span>
                <span class="info-value">${vendorName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vendor Type:</span>
                <span class="info-value">${vendorType}</span>
              </div>
              ${brandName ? `
              <div class="info-row">
                <span class="info-label">Brand Name:</span>
                <span class="info-value">${brandName}</span>
              </div>
              ` : ''}
              ${model ? `
              <div class="info-row">
                <span class="info-label">Model:</span>
                <span class="info-value">${model}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Distribution Center:</span>
                <span class="info-value">${dcName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Business Address:</span>
                <span class="info-value">${businessAddress}, ${city}, ${state} - ${pincode}</span>
              </div>
              <div class="info-row">
                <span class="info-label">GST Number:</span>
                <span class="info-value">${gstNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">PAN Number:</span>
                <span class="info-value">${panNumber}</span>
              </div>
              ${paymentTerms ? `
              <div class="info-row">
                <span class="info-label">Payment Terms:</span>
                <span class="info-value">${paymentTerms}</span>
              </div>
              ` : ''}
              ${vrf ? `
              <div class="info-row">
                <span class="info-label">VRF Link:</span>
                <span class="info-value"><a href="${vrf}" target="_blank">View VRF Document</a></span>
              </div>
              ` : ''}
            </div>

            <div class="vendor-info">
              <h3>👤 Point of Contact</h3>
              <div class="info-row">
                <span class="info-label">Contact Person:</span>
                <span class="info-value">${pocName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${pocEmail}</span>
              </div>
            </div>

            <div class="highlight">
              <h3>🚀 Next Steps</h3>
              <ul>
                <li>Your vendor account is now active and ready for business</li>
                <li>You can start receiving purchase orders from our system</li>
                <li>Our team will be in touch with you shortly for further onboarding</li>
                <li>If you have any questions, please don't hesitate to contact us</li>
              </ul>
            </div>

            <div class="footer">
              <p>Thank you for choosing OZI as your business partner!</p>
              <p><strong>OZI Team</strong></p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(to, `Welcome to OZI - ${vendorName} Successfully Onboarded!`, html);
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
    let productIndex = 1;
    
    for (const product of products) {
      // Handle both direct product objects and Sequelize model instances
      const productName = product.productName || product.dataValues?.productName || 'N/A';
      const catalogueId = product.catalogue_id || product.dataValues?.catalogue_id || product.Product?.catalogue_id || 'N/A';
      const quantity = product.quantity || product.dataValues?.quantity || 'N/A';
      const unitPrice = product.unitPrice || product.dataValues?.unitPrice || 'N/A';
      const totalAmount = product.totalAmount || product.dataValues?.totalAmount || 'N/A';
      const hsn = product.hsn || product.dataValues?.hsn || product.Product?.hsn || 'N/A';
      const eanUpc = product.ean_upc || product.dataValues?.ean_upc || product.Product?.ean_upc || 'N/A';
      const weight = product.weight || product.dataValues?.weight || product.Product?.weight || 'N/A';
      const dimensions = `${product.length || product.dataValues?.length || product.Product?.length || 'N/A'} x ${product.width || product.dataValues?.width || product.Product?.width || 'N/A'} x ${product.height || product.dataValues?.height || product.Product?.height || 'N/A'}`;
      const mrp = product.mrp || product.dataValues?.mrp || product.Product?.mrp || 'N/A';
      const cost = product.unitPrice || product.dataValues?.unitPrice || product.Product?.unitPrice || 'N/A';
      const gst = product.gst || product.dataValues?.gst || product.Product?.gst || 'N/A';
      
      // New fields for pricing and tax - these are now at SKU level
      const rlp = 'N/A'; // Will be shown in SKU details
      const rlpWoTax = 'N/A'; // Will be shown in SKU details
      const sgst = 'N/A'; // Will be shown in SKU details
      const cgst = 'N/A'; // Will be shown in SKU details
      
      // Check if product has SKU matrix
      const skuMatrix = product.SkuMatrix || product.dataValues?.SkuMatrix || product.skuMatrix || [];
      
      // Create compact Google Sheets-style table format for product summary
      productLines += `
        <table class="compact-table">
          <tr>
            <td>S.No</td>
            <td>Cat ID</td>
            <td>Product Name</td>
            <td>Qty</td>
            <td>Unit Price</td>
            <td>Total</td>
            <td>HSN</td>
            <td>MRP</td>
            <td>GST</td>
          </tr>
          <tr>
            <td>${productIndex}</td>
            <td>${catalogueId}</td>
            <td>${productName}</td>
            <td>${quantity}</td>
            <td>₹${unitPrice}</td>
            <td>₹${totalAmount}</td>
            <td>${hsn}</td>
            <td>₹${mrp}</td>
            <td>${gst}%</td>
          </tr>
      `;
      
      // Add SKU details if available
      if (skuMatrix && skuMatrix.length > 0) {
        productLines += `
          <tr>
            <td></td>
            <td>SKU</td>
            <td>Product Name</td>
            <td>Quantity</td>
            <td>HSN</td>
            <td>EAN/UPC</td>
            <td>MRP</td>
            <td>Weight</td>
            <td>Dimensions</td>
            <td>Brand</td>
            <td>RLP</td>
            <td>RLP w/o Tax</td>
            <td>GST Type</td>
            <td>Selling Price</td>
            <td>GST</td>
            <td>CESS</td>
          </tr>
        `;
        
        for (const sku of skuMatrix) {
          const skuProductName = sku.product_name || sku.dataValues?.product_name || 'N/A';
          const skuQuantity = sku.quantity || sku.dataValues?.quantity || 'N/A';
          const skuHsn = sku.hsn || sku.dataValues?.hsn || hsn;
          const skuEanUpc = sku.ean_upc || sku.dataValues?.ean_upc || eanUpc;
          const skuWeight = sku.weight || sku.dataValues?.weight || 'N/A';
          const skuDimensions = `${sku.length || sku.dataValues?.length || 'N/A'} x ${sku.width || sku.dataValues?.width || 'N/A'} x ${sku.height || sku.dataValues?.height || 'N/A'}`;
          const skuMrp = sku.mrp || sku.dataValues?.mrp || 'N/A';
          const skuGst = sku.gst || sku.dataValues?.gst || gst;
          const skuBrand = sku.brand || sku.dataValues?.brand || 'N/A';
          const skuSku = sku.sku || sku.dataValues?.sku || 'N/A';
          
          // New SKU-level fields
          const skuRlp = sku.rlp || sku.dataValues?.rlp || 'N/A';
          const skuRlpWoTax = sku.rlp_w_o_tax || sku.dataValues?.rlp_w_o_tax || 'N/A';
          const skuGstType = sku.gstType || sku.dataValues?.gstType || 'N/A';
          const skuSellingPrice = sku.selling_price || sku.dataValues?.selling_price || 'N/A';
          const skuCess = sku.cess || sku.dataValues?.cess || 'N/A';
          
          productLines += `
            <tr>
              <td></td>
              <td>${skuSku}</td>
              <td>${skuProductName}</td>
              <td>${skuQuantity}</td>
              <td>${skuHsn}</td>
              <td>${skuEanUpc}</td>
              <td>₹${skuMrp}</td>
              <td>${skuWeight} kg</td>
              <td>${skuDimensions}</td>
              <td>${skuBrand}</td>
              <td>₹${skuRlp}</td>
              <td>₹${skuRlpWoTax}</td>
              <td>${skuGstType}</td>
              <td>₹${skuSellingPrice}</td>
              <td>${skuGst}%</td>
              <td>${skuCess}%</td>
            </tr>
          `;
        }
      }
      
      productLines += `</table>`;
      
      productIndex++;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #1E2939; 
            background-color: #F9FAFB;
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background-color: #FFFFFF;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #B15177 0%, #C77398 100%);
            padding: 30px 20px; 
            text-align: center; 
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content { 
            padding: 30px; 
          }
          .po-details { 
            background: linear-gradient(135deg, #FAF5F8 0%, #F7ECF1 100%);
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px; 
            border-left: 4px solid #B15177;
          }
          .po-details h3 {
            color: #B15177;
            margin-top: 0;
            font-size: 18px;
          }
          .po-details p {
            margin: 8px 0;
            font-size: 14px;
          }
          .product-row { 
            border: 1px solid #E5E7EB; 
            margin: 15px 0; 
            padding: 0; 
            border-radius: 6px; 
            background-color: #FFFFFF;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          .product-header { 
            background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
            padding: 10px 15px; 
            font-weight: 600; 
            border-bottom: 1px solid #E5E7EB; 
            color: #1E2939;
            font-size: 14px;
          }
          .product-details-table {
            padding: 15px;
          }
          .main-product-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin: 10px 0;
            background-color: #FFFFFF;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .main-product-table th {
            background: linear-gradient(135deg, #B15177 0%, #C77398 100%);
            color: white;
            padding: 8px 4px;
            font-weight: 600;
            text-align: center;
            font-size: 9px;
            border: 1px solid #973F5F;
            white-space: nowrap;
          }
          .main-product-table td {
            background-color: #FFFFFF;
            padding: 8px 4px;
            text-align: center;
            color: #1E2939;
            font-size: 9px;
            border: 1px solid #E5E7EB;
            word-wrap: break-word;
            white-space: nowrap;
          }
          .main-product-table tr:nth-child(even) td {
            background-color: #F9FAFB;
          }
          .sku-details-section {
            padding: 0 15px 15px 15px;
          }
          .sku-details-header {
            background: linear-gradient(135deg, #B15177 0%, #C77398 100%);
            color: white;
            padding: 8px 15px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            text-align: center;
            margin: 10px 0;
          }
          .sku-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 8px 0; 
            font-size: 10px;
            background-color: #FFFFFF;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .sku-table th, .sku-table td { 
            border: 1px solid #E5E7EB; 
            padding: 6px 4px; 
            text-align: left; 
          }
          .sku-table th { 
            background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
            font-weight: 600; 
            color: #4A5565;
            font-size: 9px;
            white-space: nowrap;
          }
          .sku-table td { 
            word-wrap: break-word; 
            color: #1E2939;
            font-size: 9px;
            white-space: nowrap;
          }
          .sku-table tr:nth-child(even) {
            background-color: #F9FAFB;
          }
          .approval-link { 
            background: linear-gradient(135deg, #B15177 0%, #C77398 100%);
            color: white; 
            padding: 12px 25px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block; 
            margin: 15px 0;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          .approval-link:hover {
            background: linear-gradient(135deg, #973F5F 0%, #B15177 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(177, 81, 119, 0.3);
          }
          .footer { 
            margin-top: 30px; 
            padding: 20px 30px; 
            border-top: 1px solid #E5E7EB; 
            background-color: #F9FAFB;
            color: #6A7282;
            font-size: 14px;
          }
          .priority-high {
            background: linear-gradient(135deg, #FEF3F2 0%, #FEE2E1 100%);
            color: #DC2626;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }
          .priority-medium {
            background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
            color: #D97706;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }
          .priority-low {
            background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
            color: #16A34A;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }
          .compact-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin: 15px 0;
            background-color: #FFFFFF;
            border: 1px solid #E5E7EB;
          }
          .compact-table td {
            padding: 6px 4px;
            border: 1px solid #E5E7EB;
            text-align: left;
            color: #1E2939;
            white-space: nowrap;
          }
          .compact-table tr:nth-child(even) {
            background-color: #F9FAFB;
          }
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
              <p><strong>Priority:</strong> <span class="priority-${priority.toLowerCase()}">${priority}</span></p>
            </div>

            <h3 style="color: #B15177; margin-top: 30px;">Products:</h3>
            ${productLines}

            ${role !== 'creator' ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${approvalLink}" class="approval-link">Approve/Reject Purchase Order</a>
              </div>
            ` : `
              <div style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #B15177;">
                <h3 style="color: #B15177; margin-top: 0;">Next Steps for Creator:</h3>
                <p>Please upload the Proforma Invoice (PI) and set the expected delivery date:</p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${process.env.APP_BASE_URL_FRONTEND}/dc-po/${poId}/upload-pi" class="approval-link">Upload PI & Set Delivery Date</a>
                </div>
                <p style="font-size: 13px; color: #6A7282; margin-top: 15px;">
                  <strong>Note:</strong> Upload the PI document and provide the expected delivery date to complete the purchase order process.
                </p>
              </div>
            `}
          </div>
          
          <div class="footer">
            <p>Thanks,<br><strong>Ozi Technologies</strong></p>
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
    let productIndex = 1;
    
    for (const product of products) {
      // Handle both direct product objects and Sequelize model instances
      const productName = product.productName || product.dataValues?.productName || 'N/A';
      const catalogueId = product.catalogue_id || product.dataValues?.catalogue_id || product.Product?.catalogue_id || 'N/A';
      const quantity = product.quantity || product.dataValues?.quantity || 'N/A';
      const unitPrice = product.unitPrice || product.dataValues?.unitPrice || 'N/A';
      const totalAmount = product.totalAmount || product.dataValues?.totalAmount || 'N/A';
      const hsn = product.hsn || product.dataValues?.hsn || product.Product?.hsn || 'N/A';
      const eanUpc = product.ean_upc || product.dataValues?.ean_upc || product.Product?.ean_upc || 'N/A';
      const weight = product.weight || product.dataValues?.weight || product.Product?.weight || 'N/A';
      const dimensions = `${product.length || product.dataValues?.length || product.Product?.length || 'N/A'} x ${product.width || product.dataValues?.width || product.Product?.width || 'N/A'} x ${product.height || product.dataValues?.height || product.Product?.height || 'N/A'}`;
      const mrp = product.mrp || product.dataValues?.mrp || product.Product?.mrp || 'N/A';
      const cost = product.unitPrice || product.dataValues?.unitPrice || product.Product?.unitPrice || 'N/A';
      const gst = product.gst || product.dataValues?.gst || product.Product?.gst || 'N/A';
      
      // New fields for pricing and tax - these are now at SKU level
      const rlp = 'N/A'; // Will be shown in SKU details
      const rlpWoTax = 'N/A'; // Will be shown in SKU details
      const sgst = 'N/A'; // Will be shown in SKU details
      const cgst = 'N/A'; // Will be shown in SKU details
      
      // Check if product has SKU matrix
      const skuMatrix = product.SkuMatrix || product.dataValues?.SkuMatrix || product.skuMatrix || [];
      
      // Create compact Google Sheets-style table format for product summary
      productLines += `
        <table class="compact-table">
          <tr>
            <td>S.No</td>
            <td>Cat ID</td>
            <td>Product Name</td>
            <td>Qty</td>
            <td>Unit Price</td>
            <td>Total</td>
            <td>HSN</td>
            <td>MRP</td>
            <td>GST</td>
          </tr>
          <tr>
            <td>${productIndex}</td>
            <td>${catalogueId}</td>
            <td>${productName}</td>
            <td>${quantity}</td>
            <td>₹${unitPrice}</td>
            <td>₹${totalAmount}</td>
            <td>${hsn}</td>
            <td>₹${mrp}</td>
            <td>${gst}%</td>
          </tr>
      `;
      
      // Add SKU details if available
      if (skuMatrix && skuMatrix.length > 0) {
        productLines += `
          <tr>
            <td></td>
            <td>SKU</td>
            <td>Product Name</td>
            <td>Quantity</td>
            <td>HSN</td>
            <td>EAN/UPC</td>
            <td>MRP</td>
            <td>Weight</td>
            <td>Dimensions</td>
            <td>Brand</td>
            <td>RLP</td>
            <td>RLP w/o Tax</td>
            <td>GST Type</td>
            <td>Selling Price</td>
            <td>GST</td>
            <td>CESS</td>
          </tr>
        `;
        
        for (const sku of skuMatrix) {
          const skuProductName = sku.product_name || sku.dataValues?.product_name || 'N/A';
          const skuQuantity = sku.quantity || sku.dataValues?.quantity || 'N/A';
          const skuHsn = sku.hsn || sku.dataValues?.hsn || hsn;
          const skuEanUpc = sku.ean_upc || sku.dataValues?.ean_upc || eanUpc;
          const skuWeight = sku.weight || sku.dataValues?.weight || 'N/A';
          const skuDimensions = `${sku.length || sku.dataValues?.length || 'N/A'} x ${sku.width || sku.dataValues?.width || 'N/A'} x ${sku.height || sku.dataValues?.height || 'N/A'}`;
          const skuMrp = sku.mrp || sku.dataValues?.mrp || 'N/A';
          const skuGst = sku.gst || sku.dataValues?.gst || gst;
          const skuBrand = sku.brand || sku.dataValues?.brand || 'N/A';
          const skuSku = sku.sku || sku.dataValues?.sku || 'N/A';
          
          // New SKU-level fields
          const skuRlp = sku.rlp || sku.dataValues?.rlp || 'N/A';
          const skuRlpWoTax = sku.rlp_w_o_tax || sku.dataValues?.rlp_w_o_tax || 'N/A';
          const skuGstType = sku.gstType || sku.dataValues?.gstType || 'N/A';
          const skuSellingPrice = sku.selling_price || sku.dataValues?.selling_price || 'N/A';
          const skuCess = sku.cess || sku.dataValues?.cess || 'N/A';
          
          productLines += `
            <tr>
              <td></td>
              <td>${skuSku}</td>
              <td>${skuProductName}</td>
              <td>${skuQuantity}</td>
              <td>${skuHsn}</td>
              <td>${skuEanUpc}</td>
              <td>₹${skuMrp}</td>
              <td>${skuWeight} kg</td>
              <td>${skuDimensions}</td>
              <td>${skuBrand}</td>
              <td>₹${skuRlp}</td>
              <td>₹${skuRlpWoTax}</td>
              <td>${skuGstType}</td>
              <td>₹${skuSellingPrice}</td>
              <td>${skuGst}%</td>
              <td>${skuCess}%</td>
            </tr>
          `;
        }
      }
      
      productLines += `</table>`;
      productIndex++;
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
          .product-row { border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 5px; }
          .product-header { background-color: #f8f9fa; padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd; margin-bottom: 10px; }
          .product-content { display: flex; gap: 20px; }
          .product-details-column { flex: 1; }
          .sku-details-column { flex: 1; }
          .sku-details { background-color: #f9f9f9; padding: 10px; margin-top: 10px; border-radius: 3px; }
          .sku-item { border-bottom: 1px solid #eee; padding: 8px 0; }
          .sku-item:last-child { border-bottom: none; }
          .sku-header { font-weight: bold; color: #333; margin-bottom: 10px; }
          .sku-details-row { font-size: 12px; color: #666; margin-top: 5px; }
          .product-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
          .product-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .product-table td:nth-child(odd) { background-color: #f8f9fa; font-weight: bold; width: 40%; }
          .product-table td:nth-child(even) { background-color: #ffffff; width: 60%; }
          .sku-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
          .sku-table th, .sku-table td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          .sku-table th { background-color: #f2f2f2; font-weight: bold; }
          .sku-table td { word-wrap: break-word; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          .success-badge { background-color: #28a745; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
          .compact-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin: 15px 0;
            background-color: #FFFFFF;
            border: 1px solid #E5E7EB;
          }
          .compact-table td {
            padding: 6px 4px;
            border: 1px solid #E5E7EB;
            text-align: left;
            color: #1E2939;
            white-space: nowrap;
          }
          .compact-table tr:nth-child(even) {
            background-color: #F9FAFB;
          }
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
            ${productLines}

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
