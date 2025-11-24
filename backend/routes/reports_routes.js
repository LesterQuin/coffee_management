import express from "express";
import { staffAuth } from "../middleware/auth_middleware.js";
//import ReportsController from "../controllers/reports_controller.js";
import { getStatistics, getSessionOrder } from "../controllers/reports_controller.js";
import * as Controller from "../controllers/orders_info_controller.js";

const router = express.Router();

// ----------------------GET-------------------------
// Fetch order statistics
router.get("/statistics", staffAuth, getStatistics);
// Get reports order
//router.get("/session-orders", Controller, getSessionOrder);
router.get("/session-orders", staffAuth, getSessionOrder);

// ----------------------POST-------------------------

// ----------------------PUT-------------------------

// ----------------------DELETE-------------------------

export default router;
