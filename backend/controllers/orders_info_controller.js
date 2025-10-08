// controllers/orders_info_controller.js
import * as Model from "../models/orders_info_model.js";
import { success, error } from "../utils/response_helper.js";

// Place a new order
export const placeOrder = async (req, res) => {
  try {
    const { clientID } = req.body;
    const result = await Model.placeOrder(clientID);
    return success(res, result, "Order created");
  } catch (e) {
    return error(res, e.message);
  }
};
// Update order status
export const updateStatus = async (req, res) => {
  try {
    const { orderID, status } = req.body;
    await Model.updateOrderStatus(orderID, status);
    return success(res, null, "Order updated");
  } catch (e) {
    return error(res, e.message);
  }
};
// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderID } = req.params;
    const { status } = req.body;

    if (!orderID || !status) {
      return error(res, "Missing orderID or status");
    }

    await Model.updateOrderStatus(orderID, status);
    return success(res, null, `Order ${orderID} status updated to ${status}`);
  } catch (e) {
    return error(res, e.message);
  }
};
// Get all orders for a client
export const getOrders = async (req, res) => {
  try {
    const { clientID } = req.params;
    const orders = await Model.getClientOrders(clientID);
    return success(res, orders, "Client orders retrieved");
  } catch (e) {
    return error(res, e.message);
  }
};
