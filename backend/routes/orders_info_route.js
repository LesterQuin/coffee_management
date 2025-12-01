// routes/orders_info_route.js
import express from "express";
import * as Controller from "../controllers/orders_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
import { verifyRoles } from "../middleware/verify_roles.js";
import { ROLES_LIST } from "../config/role_list.js";
const router = express.Router();

// ----------------------GET-------------------------
// Get all orders for a client
router.get("/client/:clientID", Controller.getOrders);
// Get all orders for a session
router.get("/session/:sessionID", Controller.getOrdersBySession);
// Optional: unified endpoint for flexibility (clientID or sessionID via query)
// Example: GET /api/orders?clientID=12 or /api/orders?sessionID=30
router.get("/", Controller.getOrders);
//get all order 
router.get("/all", Controller.getAllOrders);
// get order by orderID
router.get("/order/:orderID", Controller.getOrderById);
// Get order status logs (optionally by orderID or clientID)
router.get("/status-logs", staffAuth, verifyRoles(ROLES_LIST.CASHIER), Controller.getOrderStatusLogs);
// Get order by SessionID
router.get("/:sessionID/status-logs", staffAuth, verifyRoles(ROLES_LIST.CASHIER), Controller.getStatusBySession);
//get all order with processesing and pending  
router.get("/all/pending-processing", staffAuth, verifyRoles(ROLES_LIST.CASHIER), Controller.getAllActiveOrders);

// ----------------------POST-------------------------
// Order routes
router.post("/place", staffAuth, Controller.placeOrder);

// ----------------------PUT-------------------------
// Update order status
router.put("/status/:orderID", staffAuth, verifyRoles(ROLES_LIST.CASHIER), Controller.updateOrderStatus);
// Canceled order by orderID
router.put("/cancel/session/:orderID", staffAuth, verifyRoles(ROLES_LIST.CASHIER), Controller.cancelOrderBySession);
// Update order status
router.put("/status", staffAuth, verifyRoles(ROLES_LIST.CASHIER), Controller.updateStatus);

// ----------------------DELETE-------------------------
// Cancel order (only if pending)
router.delete("/cancel/:orderID", staffAuth, verifyRoles(ROLES_LIST.CASHIER), Controller.cancelOrder);

export default router;
