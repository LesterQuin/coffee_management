// routes/fnb_cart_route.js
import express from "express";
import * as Cart from "../controllers/fnb_cart_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
import { verifyRoles } from "../middleware/verify_roles.js";
import { ROLES_LIST } from "../config/role_list.js";

const router = express.Router();

// ----------------------GET-------------------------
// view all carts
router.get("/", staffAuth, verifyRoles(ROLES_LIST.CASHIER),  Cart.viewAllCarts);
// view cart items for a client
router.get("/view/:clientID", staffAuth, verifyRoles(ROLES_LIST.CASHIER), Cart.viewCart);
// view cart items for a sessionID
router.get("/view/session/:sessionID", staffAuth, verifyRoles(ROLES_LIST.CASHIER), Cart.viewCartSession);

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
