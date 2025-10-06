// controllers/payment_controller.js
import * as Payment from "../models/payment_model.js";
import { success, error } from "../utils/response_helper.js";

export const getTransactions = async (req, res) => {
  try {
    const { clientID } = req.params;
    const transactions = await Payment.getTransactionsByClient(clientID);
    return success(res, transactions, "Transactions retrieved");
  } catch (e) {
    return error(res, e.message);
  }
};
