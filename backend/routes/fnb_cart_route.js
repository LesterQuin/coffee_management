// routes/fnb_cart_route.js
import express from "express";
import * as Cart from "../controllers/fnb_cart_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

// ----------------------GET-------------------------
// view all carts
router.get("/", staffAuth, Cart.viewAllCarts);
// view cart items for a client
router.get("/view/:clientID",staffAuth, Cart.viewCart);

// ----------------------POST-------------------------
// add Cart item
router.post("/add",staffAuth,  Cart.addItem);
// checkout cart
router.post("/checkout",staffAuth, Cart.checkout);

// ----------------------PUT-------------------------
// Update item quantity or details in cart
router.put("/update", staffAuth, Cart.updateItem);

// ----------------------DELETE-------------------------
// remove item from cart
router.delete("/remove",staffAuth, Cart.removeItem);


export default router;
