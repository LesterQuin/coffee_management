// routes/orders_info_route.js
import express from "express";
import * as Controller from "../controllers/orders_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();

router.post("/place", Controller.placeOrder);
router.put("/status", staffAuth, Controller.updateStatus);

export default router;
