// models/orders_info_model.js
import { getPool, sql } from "../config/db_config.js";

export const placeOrder = async (clientID, productListJson) => {
  const pool = await getPool();
  const request = pool.request()
    .input("clientID", sql.Int, clientID)
    .input("productList", sql.NVarChar, productListJson);

  const res = await request.execute("sg.LQ_CSS_fnb_place_order");
  return res.recordset?.[0] || { orderID: null };
};

export const updateOrderStatus = async (orderID, status) => {
  const pool = await getPool();
  await pool.request()
    .input("orderID", sql.Int, orderID)
    .input("status", sql.NVarChar, status)
    .execute("sg.LQ_CSS_fnb_update_order_status");
  return true;
};
