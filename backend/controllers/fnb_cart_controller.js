// controllers/fnb_cart_controller.js
import { group } from "console";
import * as Model from "../models/fnb_cart_model.js";
import { success, error } from "../utils/response_helper.js";

// view all carts
export const viewAllCarts = async (req, res) => {
  try {
    const carts = await Model.viewAllCarts();

    // Group items by cartID
    const grouped = carts.reduce((acc, item) => {
      if (!acc[item.cartID]) {
        acc[item.cartID] = {
          cartID: item.cartID,
          clientID: item.clientID,
          deceasedName: item.deceasedName,
          customerName: item.customerName,
          customerNumber: item.customerNumber,
          items: [],
          totalAmount: 0
        };
      }
      acc[item.cartID].items.push({
        cartItemID: item.cartItemID,
        productID: item.productID,
        description: item.productName,
        qty: item.quantity,
        size: item.size,
        amount: item.price,
        total: item.total
      });
      acc[item.cartID].totalAmount += item.total;
      return acc;
    }, {});

    return success(res, Object.values(grouped), "All carts retrieved successfully");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

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
    const staffID = req.user.staffID;

    if (!clientID || !paymentType) {
      return error(res, "Missing required fields: clientID, paymentType", 400);
    }

    const result = await Model.checkout(clientID, paymentType, staffID);
    
    const receipt = await Model.getOrderReceipt(result.orderID);

    return success(res, receipt, "Cart checked out and order created successfully");
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
