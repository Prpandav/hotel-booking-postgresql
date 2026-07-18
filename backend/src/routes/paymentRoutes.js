import { Router } from "express";

import {
  addPayment,
  addRefund,
  getBookingPaymentSummary,
  getPaymentById,
  getPayments,
  getRefunds,
} from "../controllers/paymentController.js";


const router =
  Router();


router.get(
  "/booking/:bookingId/summary",
  getBookingPaymentSummary
);


router.get(
  "/",
  getPayments
);


router.post(
  "/",
  addPayment
);


router.get(
  "/:id/refunds",
  getRefunds
);


router.post(
  "/:id/refunds",
  addRefund
);


router.get(
  "/:id",
  getPaymentById
);


export default router;