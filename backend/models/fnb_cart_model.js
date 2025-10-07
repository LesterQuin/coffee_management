// models/fnb_cart_model.js
import { poolPromise, sql } from "../config/db_config.js";

export const addItem = async (clientID, productID, quantity, size) => {
  const pool = await poolPromise;
  await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("productID", sql.Int, productID)
    .input("quantity", sql.Int, quantity)
    .input("size", sql.NVarChar, size)
    .execute("sg.LQ_CSS_fnb_cart_add_item");
  return true;
};

export const removeItem = async (clientID, productID) => {
  const pool = await poolPromise;
  await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("productID", sql.Int, productID)
    .execute("sg.LQ_CSS_fnb_cart_remove_item");
  return true;
};

export const viewCart = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .execute("sg.LQ_CSS_fnb_cart_view");
  return res.recordset;
};

export const checkout = async (clientID, paymentType) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("paymentType", sql.NVarChar, paymentType)
    .execute("sg.LQ_CSS_fnb_cart_checkout");
  return res.recordset?.[0];
};
