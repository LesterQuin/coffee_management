// controllers/orders_info_controller.js
import * as Model from "../models/orders_info_model.js";
import { success, error } from "../utils/response_helper.js";

// ----------------------GET-------------------------
// Get all orders for a client
export const getOrders = async (req, res) => {
  try {
    const { clientID } = req.params;
    const orders = await Model.getClientOrders(clientID);
    return success(res, orders, "Client orders retrieved successfully");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

export const getOrdersBySession = async (req, res) => {
  try {
    const { sessionID } = req.params;
    const data = await Model.getOrdersBySession(sessionID);
    return success(res, data, "Orders fetched successfully for this session");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ----------------------POST-------------------------
// Place a new order
export const placeOrder = async (req, res) => {
  try {
    const { clientID } = req.body;
    if (!clientID) return error(res, "Missing required field: clientID", 400);

    const result = await Model.placeOrder(clientID);
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
export const updateOrderStatus = async (orderID, newStatus) => {
  const pool = await poolPromise;

  // Get current status
  const current = await pool.request()
    .input("orderID", sql.Int, orderID)
    .query(`SELECT status FROM sg.LQ_CSS_fnb_orders WHERE orderID = @orderID`);

  if (current.recordset.length === 0) {
    throw new Error("Order not found");
  }

  const currentStatus = current.recordset[0].status;

  // Restrict cancellation rules
  if (currentStatus === "Preparing" && newStatus === "Cancelled") {
    throw new Error("Cannot cancel order once it is Preparing");
  }

  await pool.request()
    .input("orderID", sql.Int, orderID)
    .input("status", sql.NVarChar, newStatus)
    .query(`
      UPDATE sg.LQ_CSS_fnb_orders
      SET status = @status, updatedAt = GETDATE()
      WHERE orderID = @orderID
    `);
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
