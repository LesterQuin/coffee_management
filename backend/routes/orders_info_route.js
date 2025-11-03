// routes/orders_info_route.js
import express from "express";
import * as Controller from "../controllers/orders_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
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

// ----------------------POST-------------------------
// Order routes
router.post("/place", Controller.placeOrder);

// ----------------------PUT-------------------------
// Update order status
router.put("/status/:orderID", Controller.updateOrderStatus);
// Update order status
router.put("/status", Controller.updateStatus);

// ----------------------DELETE-------------------------
// Cancel order (only if pending)
router.delete("/cancel/:orderID", staffAuth, Controller.cancelOrder);


export default router;
