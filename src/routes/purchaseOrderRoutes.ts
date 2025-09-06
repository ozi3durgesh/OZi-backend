import { Router } from "express";
import {
  createPurchaseOrder,
  approvePO,
  getAllPOs,
  getPOById,
  getPOByToken
} from "../controllers/purchaseOrderController";

const router = Router();

/**
 * Routes
 */

// Create a new Purchase Order
router.post("/", createPurchaseOrder);

// Approve / Reject PO (category_head → admin only)
router.post("/:id/approve", approvePO);

// Get all POs with pagination + optional status filter
router.get("/", getAllPOs);

// Get PO by ID
router.get("/:id", getPOById);

// Get PO by token (for frontend approval link)
router.get("/approval/:token", getPOByToken);

export default router;
