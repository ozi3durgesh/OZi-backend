// services/paymentProcessing.service.js
import sequelize from "../config/database.js";
import DCPurchaseOrder from "../models/DCPurchaseOrder.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import CreditNote from "../models/CreditNote.js";
import { promises } from "dns";


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
async function getPaymentAggregates(purchaseOrderId, transaction = null) {
    const [paid, credit] = await Promise.all([
        PaymentTransaction.sum("amount", {
            where: { purchaseOrderId, status: "SUCCESS" },
            transaction,
        }),
        CreditNote.sum("amount", {
            where: { purchaseOrderId, status: "APPROVED" },
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
    utrNumber = null,
    receiptUrl = null,
    remarks = null,
    createdBy = null,
}) {
    if (!purchaseOrderId) throw new Error("purchaseOrderId is required");
    if (!amount || amount <= 0) throw new Error("Amount must be > 0");

    return await sequelize.transaction(async (tx) => {
        // 1️⃣ Fetch PO
        const po = await DCPurchaseOrder.findByPk(purchaseOrderId, { transaction: tx });
        if (!po) throw new Error("Purchase Order not found");

        // 2️⃣ Create Payment Transaction
        const paymentTx = await PaymentTransaction.create(
            {
                purchaseOrderId,
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

                if (po.paymentDueDate && remaining > 0 && new Date(po.paymentDueDate) < new Date()) {
                    newStatus = "OVERDUE";
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
