// routes/payment_route.js
import express from "express";
import * as Payment from "../controllers/payment_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

router.get("/client/:clientID", staffAuth, Payment.getTransactions);

export default router;
