// controllers/orders_info_controller.js
import * as Model from "../models/orders_info_model.js";
import { success, error } from "../utils/response_helper.js";

export const placeOrder = async (req, res) => {
  try {
    const { clientID } = req.body;
    const result = await Model.placeOrder(clientID);
    return success(res, result, "Order created");
  } catch (e) {
    return error(res, e.message);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { orderID, status } = req.body;
    await Model.updateOrderStatus(orderID, status);
    return success(res, null, "Order updated");
  } catch (e) {
    return error(res, e.message);
  }
};

export const getOrders = async (req, res) => {
  try {
    const { clientID } = req.params;
    const orders = await Model.getClientOrders(clientID);
    return success(res, orders, "Client orders retrieved");
  } catch (e) {
    return error(res, e.message);
  }
};
