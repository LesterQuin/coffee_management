// routes/fnb_cart_route.js
import express from "express";
import * as Cart from "../controllers/fnb_cart_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

router.post("/add", staffAuth, Cart.addItem);
router.post("/remove", staffAuth, Cart.removeItem);
router.get("/view/:clientID", staffAuth, Cart.viewCart);
router.post("/checkout", staffAuth, Cart.checkout);

export default router;
