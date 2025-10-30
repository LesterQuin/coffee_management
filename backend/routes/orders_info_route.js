// routes/orders_info_route.js
import express from "express";
import * as Controller from "../controllers/orders_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();

// ----------------------GET-------------------------
// Get all orders for a client
router.get("/client/:clientID", Controller.getOrders);

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
