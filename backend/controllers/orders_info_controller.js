// controllers/orders_info_controller.js
import * as Model from "../models/orders_info_model.js";
import { success, error } from "../utils/response_helper.js";

// ----------------------GET-------------------------
// Get all orders for a client
export const getOrders = async (req, res) => {
  try {
    const { clientID } = req.params;
    if (!clientID || isNaN(Number(clientID))) return error(res, "Invalid clientID", 400);
    const orders = await Model.getClientOrders(Number(clientID));
    return success(res, orders, "Client orders retrieved");
  } catch (e) {
    console.error("❌ getOrders error:", e);
    return error(res, e.message || "Server error");
  }
};
// ----------------------POST-------------------------
// Place a new order
export const placeOrder = async (req, res) => {
  try {
    const { clientID, items } = req.body;

    if (!clientID || isNaN(Number(clientID))) return error(res, "clientID is required", 400);
    if (!Array.isArray(items) || items.length === 0) return error(res, "items array is required", 400);

    // Each item must have productID and quantity; sizeId is optional (we expect sizeId only)
    for (const it of items) {
      if (!it.productID || isNaN(Number(it.productID))) return error(res, "Each item must have a valid productID", 400);
      if (!it.quantity || isNaN(Number(it.quantity)) || Number(it.quantity) <= 0) return error(res, "Each item must have a valid quantity", 400);
      // sizeId is expected but optional; we accept null
    }

    // staffID can be provided by middleware or body if needed; using null for now
    const staffID = req.user?.staffID ?? null;

    const result = await Model.placeOrder(Number(clientID), items, staffID);

    if (!result) return error(res, "Order failed", 500);
    if (result.success === false) return error(res, result.message, 400);

    return success(res, { orderID: result.orderID, status: 3 }, "Order created");
  } catch (e) {
    console.error("❌ placeOrder error:", e);
    return error(res, e.message || "Server error");
  }
};

// ----------------------PUT-------------------------
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

    if (!orderID || isNaN(Number(orderID))) return error(res, "Missing or invalid orderID", 400);
    if (status === undefined || isNaN(Number(status))) return error(res, "Missing or invalid status", 400);

    await Model.updateOrderStatus(Number(orderID), Number(status));
    return success(res, null, `Order ${orderID} status updated to ${status}`);
  } catch (e) {
    console.error("❌ updateOrderStatus error:", e);
    return error(res, e.message || "Server error");
  }
};

// ----------------------DELETE-------------------------
