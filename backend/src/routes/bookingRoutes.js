import { Router } from "express";

import {
  addBooking,
  checkIn,
  checkOut,
  editBooking,
  getAvailability,
  getBookingById,
  getBookingHistory,
  getBookings,
  removeBooking,
} from "../controllers/bookingController.js";

const router = Router();

router.get("/availability", getAvailability);

router.get("/", getBookings);

router.post("/", addBooking);

router.post("/:id/check-in", checkIn);

router.post("/:id/check-out", checkOut);

router.get("/:id/history", getBookingHistory);

router.get("/:id", getBookingById);

router.patch("/:id", editBooking);

router.delete("/:id", removeBooking);

export default router;