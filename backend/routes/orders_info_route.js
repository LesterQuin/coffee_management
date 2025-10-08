// routes/orders_info_route.js
import express from "express";
import * as Controller from "../controllers/orders_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();

// Order routes
router.post("/place", staffAuth, Controller.placeOrder);
// Update order status
router.put("/status", staffAuth, Controller.updateStatus);
// Update order status
router.put("/status/:orderID", staffAuth, Controller.updateOrderStatus);
// Get all orders for a client
router.get("/client/:clientID", staffAuth, Controller.getOrders);

export default router;
