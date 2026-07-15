import { Router } from "express";
import { getPayments } from "../controllers/paymentController.js";

const router = Router();
router.get("/", getPayments);

export default router;
