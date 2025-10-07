// models/payment_model.js
import { poolPromise, sql } from "../config/db_config.js";

export const getTransactionsByClient = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query("SELECT * FROM sg.LQ_CSS_payment_transactions WHERE clientID = @clientID ORDER BY createdAt DESC");
  return res.recordset;
};
