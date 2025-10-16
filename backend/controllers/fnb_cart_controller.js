// controllers/fnb_cart_controller.js
import * as Model from "../models/fnb_cart_model.js";
import { success, error } from "../utils/response_helper.js";

// Add item to cart
export const addItem = async (req, res) => {
  try {
    const { clientID, productID, quantity, size } = req.body;

    if (!clientID || !productID || !quantity || !size) {
      return error(res, "Missing required fields: clientID, productID, quantity, size", 400);
    }

    await Model.addItem(clientID, productID, quantity, size);
    return success(res, null, "Item added to cart");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// Remove item from cart
export const removeItem = async (req, res) => {
  try {
    const { clientID, productID } = req.body;

    if (!clientID || !productID) {
      return error(res, "Missing required fields: clientID, productID", 400);
    }

    await Model.removeItem(clientID, productID);
    return success(res, null, "Item removed from cart");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// View cart
export const viewCart = async (req, res) => {
  try {
    const { clientID } = req.params;

    if (!clientID) {
      return error(res, "Missing required parameter: clientID", 400);
    }

    const cart = await Model.viewCart(clientID);

    // Compute total cart amount
    const totalAmount = cart.reduce((sum, item) => sum + (item.total || 0), 0);

    return success(res, { items: cart, totalAmount }, "Cart retrieved successfully");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// Checkout cart
export const checkout = async (req, res) => {
  try {
    const { clientID, paymentType } = req.body;

    if (!clientID || !paymentType) {
      return error(res, "Missing required fields: clientID, paymentType", 400);
    }

    const result = await Model.checkout(clientID, paymentType);
    return success(res, result, "Cart checked out and order created");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// Update item quantity or size
export const updateItem = async (req, res) => {
  try {
    const { clientID, productID, quantity, size } = req.body;

    if (!clientID || !productID || !quantity || !size) {
      return error(res, "Missing required fields: clientID, productID, quantity, size", 400);
    }
    
    const result = await Model.updateItem(clientID, productID, quantity, size);
    return success(res, null, "Cart item updated successfully");
  } catch (e) {
    return error(res, e.message, 500);
  }
};
