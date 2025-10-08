// models/payment_model.js
import { poolPromise, sql } from "../config/db_config.js";

// Get all transactions by client
export const getTransactionsByClient = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query("SELECT * FROM sg.LQ_CSS_payment_transactions WHERE clientID = @clientID ORDER BY createdAt DESC");
  return res.recordset;
};

// Create a new payment transaction
export const createTransaction = async ({ clientID, orderID, amount, paymentType }) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("orderID", sql.Int, orderID ?? null)
    .input("amount", sql.Decimal(18,2), amount)
    .input("paymentType", sql.NVarChar(20), paymentType)
    .query(`
      INSERT INTO sg.LQ_CSS_payment_transactions (clientID, orderID, amount, paymentType, createdAt)
      VALUES (@clientID, @orderID, @amount, @paymentType, GETDATE());
      SELECT SCOPE_IDENTITY() AS transactionID;
    `);
  return res.recordset?.[0]?.transactionID ?? null;
};
