import { Router } from "express";

import {
  addRoom,
  editRoom,
  getRoomById,
  getRooms,
  removeRoom,
} from "../controllers/roomController.js";

const router = Router();

router.get("/", getRooms);
router.get("/:id", getRoomById);
router.post("/", addRoom);
router.patch("/:id", editRoom);
router.delete("/:id", removeRoom);

export default router;
