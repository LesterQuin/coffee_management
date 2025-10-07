// routes/fnb_cart_route.js
import express from "express";
import * as Cart from "../controllers/fnb_cart_controller.js";
//import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

router.post("/add", Cart.addItem);
router.post("/remove", Cart.removeItem);
router.get("/view/:clientID", Cart.viewCart);
router.post("/checkout", Cart.checkout);

export default router;
