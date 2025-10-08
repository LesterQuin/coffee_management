// routes/payment_route.js
import express from "express";
import * as Payment from "../controllers/payment_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

// Get all transactions for a client
router.get("/client/:clientID", staffAuth, Payment.getTransactions);

// Create a new payment transaction
router.post("/create", staffAuth, Payment.createTransaction);

export default router;
