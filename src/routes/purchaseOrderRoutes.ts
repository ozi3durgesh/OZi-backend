import { Router } from "express";
import {
  createPurchaseOrder, // handles draft or final creation
  updateDraftPO,       // update draft PO
  submitDraftPO,       // submit draft PO
  approvePO,
  savePI,              // save PI and delivery date
  getAllPOs,
  getPOById,
  getPOByToken
} from "../controllers/purchaseOrderController";

const router = Router();

/**
 * Routes
 */

// Create a new Purchase Order (draft or final)
router.post("/", createPurchaseOrder);

// Update a draft PO
router.put("/:id/draft", updateDraftPO);

// Submit a draft PO
router.post("/:id/submit", submitDraftPO);

// Approve / Reject PO (category_head → admin → creator)
router.post("/:id/approve", approvePO);

// Save PI & final delivery (creator)
router.post("/:id/pi", savePI);

// Get all POs
router.get("/", getAllPOs);

// Get PO by ID
router.get("/:id", getPOById);

// Get PO by token (for frontend approval link)
router.get("/approval/:token", getPOByToken);

export default router;
