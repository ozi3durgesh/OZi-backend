import PaymentProcessingService from "../services/PaymentProcessingService";

class PaymentController {
  async submitPayment(req, res) {
    try {
      // multer puts file in req.file (receipt)
      const receiptUrl = req.file ? `/uploads/receipts/${req.file.filename}` : null;

      const result = await PaymentProcessingService.processPayment({
        purchaseOrderId: Number(req.body.purchaseOrderId),
        amount: Number(req.body.amount),
        paymentMode: req.body.paymentMode,
        utrNumber: req.body.utrNumber,
        receiptUrl,
        remarks: req.body.remarks,
        createdBy: req.user?.id || null,
      });

      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async creditInfo(req, res) {
    try {
      const result = await PaymentProcessingService.getCreditDueInfo(Number(req.params.id));
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export default new PaymentController();
