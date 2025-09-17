import { Router } from "express";
import { registerDevice } from "../controllers/pickerController";

const router = Router();

router.post("/register-device", registerDevice);

export default router;
