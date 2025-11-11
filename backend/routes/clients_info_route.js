// routes/clients_info_route.js
import express from "express";
import * as Controller from "../controllers/clients_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();
// ----------------------GET-------------------------
// Get all clients
router.get("/", staffAuth, Controller.getAllClients);
// Get client by PIN (put first)
router.get("/pin/:pin", staffAuth, Controller.getClientByPin);
// Get client by ID (after PIN route)
router.get("/:clientID", Controller.getClientByIdController);
// ----------------------POST-------------------------
// Register a new client
router.post("/register", Controller.registerClient);
// Client login
router.post("/login", Controller.clientLogin);
// Generate new PIN manually
router.post("/:clientID/generatePin", staffAuth, Controller.generatePin);
// ----------------------PUT-------------------------
// Update client information
router.put("/:clientID", staffAuth, Controller.update);
// Raise client balance
router.put("/:clientID/balance", staffAuth, Controller.raiseBalance);
// ----------------------DELETE-------------------------
// Delete client by ID
router.delete("/:clientID", staffAuth, Controller.deleteClient);
// ----------------------Summary-------------------------
// Client dashboard with package items & summary
router.get("/:clientID/dashboard", staffAuth, Controller.getClientDashboard);
// add after dashboard route
router.get("/:clientID/pin/today", staffAuth, Controller.getTodayPinForCashier);
// Get client package summary
router.get("/:clientID/package/summary", Controller.getClientPackageSummaryController);
// Get client all product summary
router.get("/:clientID/product/summary", Controller.getClientProductSummary)

export default router;
