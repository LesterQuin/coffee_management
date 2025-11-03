// controllers/orders_info_controller.js
import * as Model from "../models/orders_info_model.js";
import { success, error } from "../utils/response_helper.js";

// ----------------------GET-------------------------
// Get all orders for a client
export const getOrders = async (req, res) => {
  try {
    const { clientID } = req.params;
    const { sessionID } = req.query; // Allow sessionID via query param for flexibility

    if (!clientID && !sessionID) {
      return error(res, "Either clientID or sessionID is required", 400);
    }

    const orders = await Model.getClientOrders(clientID || null, sessionID || null);
    const source = clientID ? "client" : "session";

    return success(res, orders, `Orders retrieved successfully for ${source}`);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

export const getOrdersBySession = async (req, res) => {
  try {
    const { sessionID } = req.params;
    if (!sessionID) return error(res, "Missing required field: sessionID", 400);

    const data = await Model.getOrdersBySession(sessionID);
    return success(res, data, "Orders fetched successfully for this session");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Model.getAllOrders(); // Make a model function
    return res.json({
      success: true,
      message: "All orders fetched successfully",
      data: orders
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ----------------------POST-------------------------
// Place a new order
export const placeOrder = async (req, res) => {
  try {
    const { clientID, sessionID } = req.body;

    if (!clientID && !sessionID) {
      return error(res, "Either clientID or sessionID is required to place an order", 400);
    }

    const result = await Model.placeOrder(clientID || null, sessionID || null);
    return success(res, result, "Order created successfully");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ----------------------PUT-------------------------
// export const updateOrderStatus = async (req, res) => {
//   try {
//     const { orderID } = req.params;
//     const { status } = req.body;

//     if (!orderID || !status)
//       return error(res, "Missing orderID or status", 400);

//     await Model.updateOrderStatus(orderID, status);
//     return success(res, null, `Order ${orderID} status updated to ${status}`);
//   } catch (e) {
//     return error(res, e.message, 500);
//   }
// };
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderID } = req.params;
    const { status } = req.body;

    if (!orderID || !status) return error(res, "Missing orderID or status", 400);

    const updated = await Model.updateOrderStatus(orderID, status);
    if (!updated) return error(res, "Order not found or failed to update", 404);

    return success(res, updated, `Order ${orderID} status updated to ${status}`);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// Update order status
export const updateStatus = async (req, res) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders) || orders.length === 0)
      return error(res, "Orders array required", 400);

    for (const o of orders) {
      await Model.updateOrderStatus(o.orderID, o.status);
    }

    return success(res, null, "Bulk order statuses updated");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ----------------------DELETE-------------------------
export const cancelOrder = async (req, res) => {
  try {
    const { orderID } = req.params;
    const staffID = req.user?.staffID || null;

    if (!orderID) {
      return error(res, "Missing required field: orderID", 400);
    }

    const result = await Model.cancelOrder(orderID, staffID);
    return success(res, result, `Order ${orderID} has been cancelled`);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
