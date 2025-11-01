// services/paymentProcessing.service.js
import sequelize from "../config/database.js";
import DCPurchaseOrder from "../models/DCPurchaseOrder.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import CreditNote from "../models/CreditNote.js";
import { Transaction } from "sequelize";
import DCGrn from "../models/DCGrn.model.js";


interface CreditInfo {
    success: boolean;
    poId: number;
    vendorId: number;
    totalAmount: number;
    totalPaid: number;
    totalCredit: number;
    remaining: number;
    paymentDueDate: Date | null;
    remainingDays: number | null;
    paymentStatus: string;
}


interface CreateCreditNoteInput {
  grnId?: number;
  dcPurchaseOrderId?: number;
  vendorId: number;
  creditAmount: number;
  reason: string;
  createdBy: number;
}

export interface PaymentTransactionSummary {
    id: number;
    amount: number;
    utrNumber: string | null;
    receiptUrl: string | null;
    paymentMode: string;
    status: string;
    remarks: string | null;
    createdAt: Date;
}

interface ProcessPaymentResult {
    success: boolean;
    message: string;
    purchaseOrderId: number;
    paymentStatus: string;
    totalPaid: number;
    totalCredit: number;
    remaining: number;
    overpaid: number;
    paymentTransaction: PaymentTransaction; // ✅ allow model instance
}

// 🧠 Helper: Create Credit Note when overpaid
async function createCreditNote(po, paymentTx, amount, reason, transaction, createdBy) {
    const creditNoteNumber = `CN-${Date.now()}-${po.id}`;

    return await CreditNote.create(
        {
            vendorId: po.vendorId,
            purchaseOrderId: po.id,
            paymentTransactionId: paymentTx.id,
            creditNoteNumber,
            amount,
            reason,
            status: "APPROVED",
            createdBy,
            approvedBy: createdBy,
        },
        { transaction }
    );
}

// 🧮 Helper: Compute live totals
async function getPaymentAggregates(dcPurchaseOrderId, transaction?: Transaction | null) {
    const [paid, credit] = await Promise.all([
        PaymentTransaction.sum("amount", {
            where: { dcPurchaseOrderId, status: "SUCCESS" },
            transaction,
        }),
        CreditNote.sum("creditAmount", {
            where: { dcPurchaseOrderId, status: "APPROVED" },
            transaction,
        }),
    ]);


    return {
        totalPaid: Number(paid || 0),
        totalCredit: Number(credit || 0),
    };
}

// 💳 Process Payment
export async function processPayment({
    purchaseOrderId,
    amount,
    paymentMode,
    receiptUrl,
    utrNumber = null,
    remarks = null,
    createdBy = null,
}): Promise<ProcessPaymentResult> {
    if (!purchaseOrderId) throw new Error("purchaseOrderId is required");
    if (!amount || amount <= 0) throw new Error("Amount must be > 0");

    return await sequelize.transaction(async (tx) => {
        // 1️⃣ Fetch PO
        const po = await DCPurchaseOrder.findByPk(purchaseOrderId, { transaction: tx });

        if (!po) throw new Error("Purchase Order not found");

        // 2️⃣ Create Payment Transaction

        const paymentTx = await PaymentTransaction.create(
            {
                dcPurchaseOrderId: purchaseOrderId,
                vendorId: po.vendorId,
                paymentMode,
                amount,
                utrNumber,
                receiptUrl,
                remarks,
                status: "SUCCESS",
                createdBy,
            },
            { transaction: tx }
        );



        // 3️⃣ Aggregate totals at runtime
        const { totalPaid, totalCredit } = await getPaymentAggregates(po.id, tx);
        const payable = Number(po.totalAmount) - totalCredit;
        const remaining = payable - totalPaid;
        const overpaid = totalPaid > payable ? totalPaid - payable : 0;

        // 4️⃣ Determine new paymentStatus
        let newStatus = po.paymentStatus;

        switch (po.paymentType) {
            case "ADVANCE":
                if (overpaid > 0) {
                    newStatus = "ADVANCE_PAID";
                    await createCreditNote(po, paymentTx, overpaid, "Excess advance payment", tx, createdBy);
                } else if (remaining > 0 && totalPaid > 0) {
                    newStatus = "PARTIALLY_PAID";
                } else if (remaining <= 0) {
                    newStatus = "ADVANCE_PAID";
                } else {
                    newStatus = "UNPAID";
                }
                break;

            case "CREDIT":
                if (remaining > 0 && totalPaid > 0) newStatus = "CREDIT_DUE";
                else if (remaining <= 0) newStatus = "CREDIT_CLEARED";
                else newStatus = "UNPAID";

                if (!po.paymentDueDate && po.creditPeriodDays) {
                    const due = new Date();
                    due.setDate(due.getDate() + po.creditPeriodDays);
                    po.paymentDueDate = due;
                }


                break;

            case "SELL_OR_RETURN":
                newStatus = remaining <= 0 ? "RECONCILED" : "PENDING_RECONCILIATION";
                break;

            default:
                if (remaining <= 0) newStatus = "PAID";
                else if (totalPaid > 0) newStatus = "PARTIALLY_PAID";
                else newStatus = "UNPAID";
        }

        // 5️⃣ Update PO paymentStatus only
        po.paymentStatus = newStatus;

        await po.save({ transaction: tx });


        // 6️⃣ Return summary
        return {
            success: true,
            message: "Payment processed successfully",
            purchaseOrderId: po.id,
            paymentStatus: po.paymentStatus,
            totalPaid,
            totalCredit,
            remaining: remaining > 0 ? remaining : 0,
            overpaid,
            paymentTransaction: paymentTx,
        };
    });
}

// 📊 Get Credit Info
export async function getCreditDueInfo(purchaseOrderId): Promise<CreditInfo> {
    const po = await DCPurchaseOrder.findByPk(purchaseOrderId);
    if (!po) throw new Error("Purchase Order not found");
    if (po.paymentType !== "CREDIT") throw new Error("Not a credit-type purchase order");

    const { totalPaid, totalCredit } = await getPaymentAggregates(po.id);
    const payable = Number(po.totalAmount) - totalCredit;
    const remaining = Math.max(payable - totalPaid, 0);

    let remainingDays: number | null;
    if (po.paymentDueDate) {
        const diffMs = new Date(po.paymentDueDate).getTime() - Date.now();
        remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } else {
        remainingDays = null;
    }

    return {
        success: true,
        poId: po.id,
        vendorId: po.vendorId,
        totalAmount: Number(po.totalAmount),
        totalPaid,
        totalCredit,
        remaining,
        paymentDueDate: po.paymentDueDate,
        remainingDays,
        paymentStatus: po.paymentStatus,
    };
}

export async function getPaymentsByPurchaseOrderId(dcPurchaseOrderId: number) {
    if (!dcPurchaseOrderId) {
        throw new Error("purchaseOrderId is required");
    }

    // 1️⃣ Validate PO exists
    const po = await DCPurchaseOrder.findByPk(dcPurchaseOrderId);
    if (!po) {
        throw new Error(`Purchase Order with ID ${dcPurchaseOrderId} not found`);
    }

    // 2️⃣ Fetch all payments linked to this PO
    const payments = await PaymentTransaction.findAll({
        where: { dcPurchaseOrderId: dcPurchaseOrderId },
        order: [["created_at", "DESC"]],
    });

    // 3️⃣ Convert to plain objects for clean JSON output
    const paymentList = payments.map((p) => p.get({ plain: true }));

    return {
        success: true,
        dcPurchaseOrderId,
        count: paymentList.length,
        payments: paymentList,
    };
}

export async function createManualCreditNote(data: CreateCreditNoteInput) {
    const { grnId, dcPurchaseOrderId, vendorId, creditAmount, reason, createdBy } = data;

    if (!vendorId || !creditAmount || !reason || !createdBy) {
      throw new Error("Missing required fields: vendorId, creditAmount, reason, createdBy");
    }

    // 🔹 Determine linked PO if GRN provided
    let linkedPOId = dcPurchaseOrderId || null;
    if (grnId) {
      const grn = await DCGrn.findByPk(grnId);
      if (!grn) throw new Error("GRN not found");
      linkedPOId = grn.dc_po_id;
    }

    // 🔹 Validate PO if directly passed
    if (linkedPOId) {
      const po = await DCPurchaseOrder.findByPk(linkedPOId);
      if (!po) throw new Error("DC Purchase Order not found");
    }

    // 🔹 Generate unique CN number
    const creditNoteNumber = `CN-${linkedPOId ?? "MANUAL"}-${Date.now()}`;

    // 🔹 Create CN entry
    const creditNote = await CreditNote.create({
      vendorId,
      dcPurchaseOrderId: linkedPOId,
      grnId: grnId ?? null,
      paymentTransactionId: null,
      creditAmount,
      reason,
      status: "PENDING",
      createdBy,
    });

    return creditNote;
  }

  export async function approveCreditNote(id: number, approvedBy: number) {
    const creditNote = await CreditNote.findByPk(id);
    if (!creditNote) throw new Error("Credit Note not found");

    if (creditNote.status !== "PENDING") {
      throw new Error(`Credit Note is already ${creditNote.status}`);
    }

    await creditNote.update({
      status: "APPROVED",
      approvedBy,
    });

    return creditNote;
  }
