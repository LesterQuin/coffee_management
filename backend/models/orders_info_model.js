// models/orders_info_model.js
import { poolPromise, sql } from "../config/db_config.js";

// ----------------------GET-------------------------
// export const getClientOrders = async (clientID) => {
//   const pool = await poolPromise;
//   const res = await pool.request()
//     .input("clientID", sql.Int, clientID)
//     .query(`
//       SELECT o.orderID, o.status, o.createdAt, o.updatedAt,
//              i.productID, i.quantity, i.sizeId, p.productName, p.price
//       FROM sg.LQ_CSS_fnb_orders o
//       INNER JOIN sg.LQ_CSS_fnb_order_items i ON o.orderID = i.orderID
//       INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
//       WHERE o.clientID = @clientID
//       ORDER BY o.createdAt DESC
//     `);

//   const nestedOrders = [];
//   const map = {};
//   for (const row of res.recordset) {
//     if (!map[row.orderID]) {
//       map[row.orderID] = {
//         orderID: row.orderID,
//         status: row.status,
//         createdAt: row.createdAt,
//         updatedAt: row.updatedAt,
//         items: []
//       };
//       nestedOrders.push(map[row.orderID]);
//     }
//     map[row.orderID].items.push({
//       productID: row.productID,
//       productName: row.productName,
//       quantity: row.quantity,
//       sizeId: row.sizeId,
//       price: row.price,
//       total: row.quantity * row.price
//     });
//   }

//   return nestedOrders;
// };
export const getClientOrders = async (clientID, sessionID = null) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    if (clientID) request.input("clientID", sql.Int, clientID);
    if (sessionID) request.input("sessionID", sql.Int, sessionID);

    const res = await request.query(`
      SELECT o.orderID, o.status, o.createdAt, o.updatedAt, o.sessionID,
            i.productID, i.quantity, i.sizeId, p.productName, p.price
      FROM sg.LQ_CSS_fnb_orders o
      INNER JOIN sg.LQ_CSS_fnb_order_items i ON o.orderID = i.orderID
      INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
      WHERE 
        (${clientID ? "o.clientID = @clientID" : "1=1"})
        AND (${sessionID ? "o.sessionID = @sessionID" : "1=1"})
      ORDER BY o.createdAt DESC
    `);

    const rows = res.recordset || [];
    const nestedOrders = [];
    const map = {};

    for (const row of rows) {
      if (!map[row.orderID]) {
        map[row.orderID] = {
          orderID: row.orderID,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          sessionID: row.sessionID,
          items: [],
        };
        nestedOrders.push(map[row.orderID]);
      }

      map[row.orderID].items.push({
        productID: row.productID,
        productName: row.productName,
        quantity: row.quantity,
        sizeId: row.sizeId,
        price: row.price,
        total: row.quantity * row.price,
      });
    }

    return nestedOrders;
  } catch (err) {
    throw new Error(
      `Failed to fetch orders for client ${clientID || "(session only)"}: ${err.message}`
    );
  }
};

export const viewCart = async (clientID, sessionID = null) => {
  const pool = await poolPromise;
  const request = pool.request();

  if (clientID) request.input("clientID", sql.Int, clientID);
  if (sessionID) request.input("sessionID", sql.Int, sessionID);

  const res = await request.query(`
    SELECT i.cartItemID, i.productID, i.quantity, p.productName, p.price,
           (i.quantity * p.price) AS total
    FROM sg.LQ_CSS_fnb_cart_items i
    INNER JOIN sg.LQ_CSS_fnb_cart c ON i.cartID = c.cartID
    INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
    WHERE 
      (${clientID ? "c.clientID = @clientID" : "1=1"})
      AND (${sessionID ? "c.sessionID = @sessionID" : "1=1"})
  `);

  return res.recordset;
};

export const getOrdersBySession = async (sessionID) => {
  try {
    const pool = await poolPromise;
    const res = await pool.request()
      .input("sessionID", sql.Int, sessionID)
      .query(`
        SELECT 
          o.orderID, 
          o.status, 
          o.createdAt, 
          o.updatedAt,
          i.productID, 
          i.quantity, 
          producSize.size,  
          cat.categoryName,  
          p.productName, 
          p.price,
          c.deceasedName,
          cr.chapelName
        FROM sg.LQ_CSS_fnb_orders o
        INNER JOIN sg.LQ_CSS_fnb_order_items i ON o.orderID = i.orderID
        INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
        LEFT JOIN sg.LQ_CSS_fnb_categories cat ON p.categoryID = cat.categoryID
        LEFT JOIN sg.LQ_CSS_product_sizes AS producSize ON p.sizeId = producSize.sizeId
        LEFT JOIN sg.LQ_CSS_sessions_info s ON o.sessionID = s.sessionID
        LEFT JOIN sg.LQ_CSS_client_info c ON s.clientID = c.clientID
        LEFT JOIN sg.LQ_CSS_chapel_rooms cr ON c.chapelID = cr.chapelID
        WHERE o.sessionID = @sessionID
        ORDER BY o.createdAt DESC;
      `);

    const rows = res.recordset || [];
    const nestedOrders = [];
    const map = {};

    for (const row of rows) {
      if (!map[row.orderID]) {
        map[row.orderID] = {
          orderID: row.orderID,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          deceasedName: row.deceasedName || null,
          chapelName: row.chapelName || null,
          items: []
        };
        nestedOrders.push(map[row.orderID]);
      }

      map[row.orderID].items.push({
        productID: row.productID,
        categoryName: row.categoryName || null,
        productName: row.productName,
        quantity: row.quantity || 0,
        size: row.size || null,
        price: row.price || 0,
        total: (row.quantity || 0) * (row.price || 0)
      });
    }

    return nestedOrders;
  } catch (err) {
    throw new Error(`Failed to fetch orders for session ${sessionID}: ${err.message}`);
  }
};

// ----------------------POST-------------------------
// Place an order (optional, you can skip if using cart checkout)
export const placeOrder = async (clientID = null, sessionID = null) => {
  const pool = await poolPromise;
  const request = pool.request();
  if (clientID) request.input("clientID", sql.Int, clientID);
  if (sessionID) request.input("sessionID", sql.Int, sessionID);

  const res = await request.query(`
    INSERT INTO sg.LQ_CSS_fnb_orders (clientID, sessionID, status, createdAt, updatedAt)
    VALUES (@clientID, @sessionID, 'Pending', GETDATE(), GETDATE());
    SELECT SCOPE_IDENTITY() AS orderID;
  `);

  return res.recordset?.[0] || { orderID: null };
};

// ----------------------PUT-------------------------
// Update order status
export const updateOrderStatus = async (orderID, status) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("orderID", sql.Int, orderID)
    .input("status", sql.NVarChar, status)
    .query(`
      UPDATE sg.LQ_CSS_fnb_orders
      SET status = @status, updatedAt = GETDATE()
      OUTPUT inserted.*
      WHERE orderID = @orderID
    `);

  return res.recordset?.[0];
};
// ----------------------DELETE-------------------------
export const cancelOrder = async (orderID, staffID = null) => {
  const pool = await poolPromise;

  // Only cancel if order is still pending
  const res = await pool.request()
    .input("orderID", sql.Int, orderID)
    .query(`
      SELECT status FROM sg.LQ_CSS_fnb_orders WHERE orderID = @orderID
    `);

  if (res.recordset.length === 0) throw new Error("Order not found");
  const status = res.recordset[0].status;

  if (status !== "Pending") {
    throw new Error("Only pending orders can be cancelled");
  }

  await pool.request()
    .input("orderID", sql.Int, orderID)
    .input("staffID", sql.Int, staffID)
    .query(`
      UPDATE sg.LQ_CSS_fnb_orders
      SET status = 'Cancelled',
          updatedAt = GETDATE(),
          cancelledBy = @staffID,
          cancelledAt = GETDATE()
      WHERE orderID = @orderID
    `);

  return { orderID, status: "Cancelled" };
};
