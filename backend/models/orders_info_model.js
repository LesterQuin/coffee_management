// models/orders_info_model.js
import { poolPromise, sql } from "../config/db_config.js";

// Place an order (optional, you can skip if using cart checkout)
export const placeOrder = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .execute("sg.LQ_CSS_fnb_place_order");
  return res.recordset?.[0] || { orderID: null };
};

// Update order status
export const updateOrderStatus = async (orderID, status) => {
  const pool = await poolPromise;
  await pool.request()
    .input("orderID", sql.Int, orderID)
    .input("status", sql.NVarChar, status)
    .execute("sg.LQ_CSS_fnb_update_order_status");
  return true;
};

// Get all orders for a client (nested items)
export const getClientOrders = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`
      SELECT o.orderID, o.status, o.createdAt, o.updatedAt,
             i.productID, i.quantity, i.size, p.productName, p.price
      FROM sg.LQ_CSS_fnb_orders o
      INNER JOIN sg.LQ_CSS_fnb_order_items i ON o.orderID = i.orderID
      INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
      WHERE o.clientID = @clientID
      ORDER BY o.createdAt DESC
    `);

  const nestedOrders = [];
  const map = {};
  for (const row of res.recordset) {
    if (!map[row.orderID]) {
      map[row.orderID] = {
        orderID: row.orderID,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        items: []
      };
      nestedOrders.push(map[row.orderID]);
    }
    map[row.orderID].items.push({
      productID: row.productID,
      productName: row.productName,
      quantity: row.quantity,
      size: row.size,
      price: row.price,
      total: row.quantity * row.price
    });
  }

  return nestedOrders;
};
