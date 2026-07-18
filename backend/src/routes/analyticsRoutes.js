import { Router } from "express";

import {
  getCancellations,
  getCustomersRanking,
  getOccupancy,
  getOverview,
  getRevenue,
  getRoomsRanking,
  refresh,
} from "../controllers/analyticsController.js";


const router =
  Router();


router.get(
  "/overview",
  getOverview
);


router.get(
  "/occupancy",
  getOccupancy
);


router.get(
  "/revenue/monthly",
  getRevenue
);


router.get(
  "/rooms/top",
  getRoomsRanking
);


router.get(
  "/customers/top",
  getCustomersRanking
);


router.get(
  "/cancellations",
  getCancellations
);


router.post(
  "/refresh",
  refresh
);


export default router;