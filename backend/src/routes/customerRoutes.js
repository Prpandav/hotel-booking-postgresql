import { Router } from "express";

import {
  addCustomer,
  editCustomer,
  getCustomerById,
  getCustomers,
  removeCustomer,
} from "../controllers/customerController.js";

const router = Router();

router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.post("/", addCustomer);
router.patch("/:id", editCustomer);
router.delete("/:id", removeCustomer);

export default router;