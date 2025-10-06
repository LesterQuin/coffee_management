// controllers/fnb_cart_controller.js
import * as Cart from "../models/fnb_cart_model.js";
import { success, error } from "../utils/response_helper.js";

export const addItem = async (req, res) => {
  try {
    const { clientID, productID, quantity, size } = req.body;
    await Cart.addItem(clientID, productID, quantity, size);
    return success(res, null, "Item added to cart");
  } catch (e) {
    return error(res, e.message);
  }
};

export const removeItem = async (req, res) => {
  try {
    const { clientID, productID } = req.body;
    await Cart.removeItem(clientID, productID);
    return success(res, null, "Item removed from cart");
  } catch (e) {
    return error(res, e.message);
  }
};

export const viewCart = async (req, res) => {
  try {
    const { clientID } = req.params;
    const cart = await Cart.viewCart(clientID);
    return success(res, cart, "Cart items retrieved");
  } catch (e) {
    return error(res, e.message);
  }
};

export const checkout = async (req, res) => {
  try {
    const { clientID, paymentType } = req.body;
    const result = await Cart.checkout(clientID, paymentType);
    return success(res, result, "Checkout successful");
  } catch (e) {
    return error(res, e.message);
  }
};
