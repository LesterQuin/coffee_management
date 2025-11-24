// routes/fnb_cart_route.js
import express from "express";
import * as Cart from "../controllers/fnb_cart_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

// ----------------------GET-------------------------
// view all carts
router.get("/", staffAuth, Cart.viewAllCarts);
// view cart items for a client
router.get("/view/:clientID", staffAuth, Cart.viewCart);
// view cart items for a sessionID
router.get("/view/session/:sessionID", staffAuth, Cart.viewCartSession);

// ----------------------POST-------------------------
// add Cart item
router.post("/add", Cart.addItems);
// checkout cart
router.post("/checkout", Cart.checkout);

// ----------------------PUT-------------------------
// Update item quantity or details in cart
router.put("/update", Cart.updateItem);

// ----------------------DELETE-------------------------
// remove item from cart
router.delete("/remove", Cart.removeItem);


export default router;
