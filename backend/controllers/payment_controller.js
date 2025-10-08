// controllers/payment_controller.js
import * as Payment from "../models/payment_model.js";
import { success, error } from "../utils/response_helper.js";

// Get transactions for a client
export const getTransactions = async (req, res) => {
  try {
    const { clientID } = req.params;
    const transactions = await Payment.getTransactionsByClient(clientID);
    return success(res, transactions, "Transactions retrieved");
  } catch (e) {
    return error(res, e.message);
  }
};

// Create a new payment transaction
export const createTransaction = async (req, res) => {
  try {
    const { clientID, orderID, amount, paymentType } = req.body;
    const transactionID = await Payment.createTransaction({ clientID, orderID, amount, paymentType });
    return success(res, { transactionID }, "Payment transaction created");
  } catch (e) {
    return error(res, e.message);
  }
};
