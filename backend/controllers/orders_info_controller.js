// controllers/orders_info_controller.js
import * as Model from "../models/orders_info_model.js";
import { success, error } from "../utils/response_helper.js";

export const placeOrder = async (req, res) => {
  try {
    const { clientID, products } = req.body;
    const productListJson = JSON.stringify(products);
    const result = await Model.placeOrder(clientID, productListJson);
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
