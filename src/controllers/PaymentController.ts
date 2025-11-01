import { processPayment, getCreditDueInfo, getPaymentsByPurchaseOrderId, createManualCreditNote, approveCreditNote } from "../services/PaymentProcessingService";

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

  async createCreditNoteManually(req, res) {
    try {
      const creditNote = await createManualCreditNote(req.body);
      return res.status(201).json({
        message: "Credit Note created successfully (Pending approval)",
        data: creditNote,
      });
    } catch (error: any) {
      console.error("Error creating Credit Note:", error);
      return res.status(400).json({ message: error.message });
    }
  };

  async approveCreditNote(req, res) {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;

      const creditNote = await approveCreditNote(Number(id), approvedBy);

      return res.status(200).json({
        message: "Credit Note approved successfully",
        data: creditNote,
      });
    } catch (error: any) {
      console.error("Error approving Credit Note:", error);
      return res.status(400).json({ message: error.message });
    }

  }
}


export default new PaymentController();
