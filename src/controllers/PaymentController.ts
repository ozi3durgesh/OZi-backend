import { processPayment, getCreditDueInfo, getPaymentsByPurchaseOrderId } from "../services/PaymentProcessingService";

class PaymentController {
  async submitPayment(req, res) {
    try {
      // multer puts file in req.file (receipt)
      const receiptUrl = req.file ? `/uploads/receipts/${req.file.filename}` : null;

      const result = await processPayment({
        purchaseOrderId: Number(req.body.purchaseOrderId),
        amount: Number(req.body.amount),
        paymentMode: req.body.paymentMode,
        receiptUrl,
        utrNumber: req.body.utrNumber,
        remarks: req.body.remarks,
        createdBy: req.user?.id || null,
      });


      res.json(result);
    } catch (err) {
      const error = err as Error
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async creditInfo(req, res) {
    try {
      const result = await getCreditDueInfo(Number(req.params.id));
      res.json(result);
    } catch (err) {
      const error = err as Error
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async listPaymentsByPO(req, res) {
    try {
      const { purchaseOrderId } = req.params;

      const result = await getPaymentsByPurchaseOrderId(Number(purchaseOrderId));
      return res.status(200).json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch payment transactions",
      });
    }
  }

}



export default new PaymentController();
