// routes/fnb_cart_route.js
import express from "express";
import * as Cart from "../controllers/fnb_cart_controller.js";
//import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

// add Cart item
router.post("/add", Cart.addItem);
// remove item from cart
router.post("/remove", Cart.removeItem);
// view cart items for a client
router.get("/view/:clientID", Cart.viewCart);
// checkout cart
router.post("/checkout", Cart.checkout);

export default router;
