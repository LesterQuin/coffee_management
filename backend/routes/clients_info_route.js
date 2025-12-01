// routes/clients_info_route.js
import express from "express";
import * as Controller from "../controllers/clients_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
import { verifyRoles } from "../middleware/verify_roles.js";
import { ROLES_LIST } from "../config/role_list.js";
const router = express.Router();
// ----------------------GET-------------------------
// Get all clients
router.get("/", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.getAllClients);
// Get client by PIN (put first)
router.get("/pin/:pin", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.getClientByPin);
// Get client by ID (after PIN route)
router.get("/:clientID", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.getClientByIdController);
// ----------------------POST-------------------------
// Register a new client
router.post("/register", verifyRoles(ROLES_LIST.CASHIER), Controller.registerClient);
// Client login
router.post("/login", Controller.clientLogin);
// Generate new PIN manually
router.post("/:clientID/generatePin", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.generatePin);
// ----------------------PUT-------------------------
// Update client information
router.put("/:clientID", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.update);
// Raise client balance
router.put("/:clientID/balance", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.raiseBalance);
// ----------------------DELETE-------------------------
// Delete client by ID
router.delete("/:clientID", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.deleteClient);
// ----------------------Summary-------------------------
// Client dashboard with package items & summary
router.get("/:clientID/dashboard", staffAuth,  verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.getClientDashboard);
// add after dashboard route
router.get("/:clientID/pin/today", staffAuth,  verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.getTodayPinForCashier);
// Get client package summary
router.get("/:clientID/package/summary", staffAuth,  verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN),  Controller.getClientPackageSummaryController);
// Get client all product summary
router.get("/:clientID/product/summary", staffAuth,  verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.getClientProductSummary)
// Get package product by date
router.get("/:clientID/product/date", staffAuth,  verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.getClientProductDate);
// Get Client session information
router.post("/session/info", staffAuth,  verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.getClientSessionInfo);

export default router;
