import { Router } from "express";

import {
  addBooking,
  editBooking,
  getAvailability,
  getBookingById,
  getBookings,
  removeBooking,
} from "../controllers/bookingController.js";

const router = Router();

router.get("/availability", getAvailability);

router.get("/", getBookings);

router.get("/:id", getBookingById);

router.post("/", addBooking);

router.patch("/:id", editBooking);

router.delete("/:id", removeBooking);

export default router;
