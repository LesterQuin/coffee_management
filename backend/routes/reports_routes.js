import express from "express";
import { staffAuth } from "../middleware/auth_middleware.js";
//import ReportsController from "../controllers/reports_controller.js";
import { getStatistics } from "../controllers/reports_controller.js";

const router = express.Router();

// ----------------------GET-------------------------
// Fetch order statistics
router.get("/statistics", staffAuth, getStatistics);

// ----------------------POST-------------------------

// ----------------------PUT-------------------------

// ----------------------DELETE-------------------------

export default router;
