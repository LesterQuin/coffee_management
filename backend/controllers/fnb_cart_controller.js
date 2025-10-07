// controllers/fnb_cart_controller.js
import * as Model from "../models/fnb_cart_model.js";
import { success, error } from "../utils/response_helper.js";

// Add item to cart
export const addItem = async (req, res) => {
  try {
    const { clientID, productID, quantity, size } = req.body;
    await Model.addItem(clientID, productID, quantity, size);
    return success(res, null, "Item added to cart");
  } catch (e) {
    return error(res, e.message);
  }
};

// Remove item from cart
export const removeItem = async (req, res) => {
  try {
    const { clientID, productID } = req.body;
    await Model.removeItem(clientID, productID);
    return success(res, null, "Item removed from cart");
  } catch (e) {
    return error(res, e.message);
  }
};

// View cart
export const viewCart = async (req, res) => {
  try {
    const { clientID } = req.params;
    const cart = await Model.viewCart(clientID);
    return success(res, cart, "Cart retrieved");
  } catch (e) {
    return error(res, e.message);
  }
};

// Checkout cart
export const checkout = async (req, res) => {
  try {
    const { clientID, paymentType } = req.body;
    const result = await Model.checkout(clientID, paymentType);
    return success(res, result, "Cart checked out and order created");
  } catch (e) {
    return error(res, e.message);
  }
};
