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
          cr.chapelName,
          s.userName
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
          userName: row.userName || null,
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

export const getAllOrders = async () => {
  const pool = await poolPromise;

  const res = await pool.request().query(`
    SELECT 
    o.orderID,
    o.status AS orderStatus,
    o.createdAt,
    o.clientID,
    ci.deceasedName,
    cr.chapelName,
    i.productID,
    p.productName,
    p.categoryID,
    cat.categoryName,
    i.quantity AS qty,
    p.price AS amount,
    (i.quantity * p.price) AS total,
    i.sizeId,
    ps.size,
    ISNULL(s.userName, 'unknown') AS userName
FROM sg.LQ_CSS_fnb_orders o
INNER JOIN sg.LQ_CSS_fnb_order_items i ON i.orderID = o.orderID
INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
LEFT JOIN sg.LQ_CSS_fnb_categories cat ON p.categoryID = cat.categoryID
LEFT JOIN sg.LQ_CSS_product_sizes ps ON p.sizeId = ps.sizeId
LEFT JOIN sg.LQ_CSS_sessions_info s ON o.sessionID = s.sessionID   -- ✅ FIXED JOIN
LEFT JOIN sg.LQ_CSS_client_info ci ON s.clientID = ci.clientID     -- ✅ use session link
LEFT JOIN sg.LQ_CSS_chapel_rooms cr ON ci.chapelID = cr.chapelID
ORDER BY o.createdAt DESC, o.orderID, i.orderItemID;
  `);

  // Group items by orderID
  const ordersMap = {};
  res.recordset.forEach(item => {
    if (!ordersMap[item.orderID]) {
      ordersMap[item.orderID] = {
        orderID: item.orderID,
        orderStatus: item.orderStatus,
        createdAt: item.createdAt,
        clientID: item.clientID,
        userName: item.userName,
        deceasedName: item.deceasedName,
        chapelName: item.chapelName,
        items: []
      };
    }
    ordersMap[item.orderID].items.push({
      productID: item.productID,
      categoryID: item.categoryID,
      categoryName: item.categoryName,
      productName: item.productName,
      qty: item.qty,
      amount: item.amount,
      size: item.size,
      total: item.total
    });
  });

  return Object.values(ordersMap);
};

export const getOrderByIdModel = async (orderID) => {
  const pool = await poolPromise;

  const res = await pool.request()
    .input("orderID", sql.Int, orderID)
    .query(`
      SELECT 
        o.orderID, 
        o.status, 
        o.createdAt, 
        o.updatedAt,
        i.productID, 
        i.quantity, 
        ps.size,  
        cat.categoryName,  
        p.productName, 
        p.price,
        c.deceasedName,
        cr.chapelName,
        s.userName
      FROM sg.LQ_CSS_fnb_orders o
      INNER JOIN sg.LQ_CSS_fnb_order_items i ON o.orderID = i.orderID
      INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
      LEFT JOIN sg.LQ_CSS_fnb_categories cat ON p.categoryID = cat.categoryID
      LEFT JOIN sg.LQ_CSS_product_sizes ps ON p.sizeId = ps.sizeId
      LEFT JOIN sg.LQ_CSS_sessions_info s ON o.sessionID = s.sessionID
      LEFT JOIN sg.LQ_CSS_client_info c ON s.clientID = c.clientID
      LEFT JOIN sg.LQ_CSS_chapel_rooms cr ON c.chapelID = cr.chapelID
      WHERE o.orderID = @orderID;
    `);

  const rows = res.recordset;
  if (!rows || rows.length === 0) return null;

  const order = {
    orderID: rows[0].orderID,
    orderStatus: rows[0].status,
    createdAt: rows[0].createdAt,
    updatedAt: rows[0].updatedAt,
    userName: rows[0].userName || null,
    deceasedName: rows[0].deceasedName || null,
    chapelName: rows[0].chapelName || null,
    items: rows.map(item => ({
      productID: item.productID,
      categoryName: item.categoryName || null,
      productName: item.productName,
      qty: item.quantity || 0,
      size: item.size || null,
      price: item.price || 0,
      total: (item.quantity || 0) * (item.price || 0)
    }))
  };

  return order;
};

export const getOrderStatusLogs = async (orderID = null, clientID = null) => {
  const pool = await poolPromise;
  const request = pool.request();

  if (orderID) request.input("orderID", sql.Int, orderID);
  if (clientID) request.input("clientID", sql.Int, clientID);

  const res = await request.query(`
    SELECT 
      log.logID, 
      log.orderID, 
      log.clientID, 
      log.previousStatus, 
      log.newStatus, 
      log.changedBy, 
      log.changedAt, 
      log.timeSpentInPreviousStatus,
      o.sessionID
    FROM sg.LQ_CSS_fnb_order_status_log AS log
    LEFT JOIN sg.LQ_CSS_fnb_orders AS o
      ON log.orderID = o.orderID
    WHERE ${orderID ? "log.orderID = @orderID" : "1=1"}
      AND ${clientID ? "log.clientID = @clientID" : "1=1"}
    ORDER BY log.changedAt DESC
  `);

  return res.recordset;
};

export const getStatusBySession = async (sessionID) => {
  const pool = await poolPromise;
  const request = pool.request();

  request.input("sessionID", sql.Int, sessionID);

  const res = await request.query(`
    SELECT 
        log.logID,
        log.orderID,
        log.clientID,
        o.sessionID,
        log.previousStatus,
        log.newStatus,
        log.changedBy,
        log.changedAt,
        log.timeSpentInPreviousStatus
    FROM sg.LQ_CSS_fnb_order_status_log AS log
    INNER JOIN sg.LQ_CSS_fnb_orders AS o
      ON log.orderID = o.orderID
    WHERE o.sessionID = @sessionID
    ORDER BY log.changedAt DESC
  `);

  return res.recordset;
}

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
// export const updateOrderStatus = async (orderID, status) => {
//   const pool = await poolPromise;

//   // Step 1: Verify that the order has at least one item in category 3–6
//   const check = await pool.request()
//     .input("orderID", sql.Int, orderID)
//     .query(`
//       SELECT COUNT(*) AS count
//       FROM sg.LQ_CSS_fnb_order_items i
//       INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
//       WHERE i.orderID = @orderID
//         AND p.categoryID BETWEEN 3 AND 6
//     `);

//   if (check.recordset[0].count === 0) {
//     throw new Error("Order does not contain any products from categories 3–6.");
//   }

//   // Step 2: Update the order status if the check passed
//   const res = await pool.request()
//     .input("orderID", sql.Int, orderID)
//     .input("status", sql.NVarChar, status)
//     .query(`
//       UPDATE sg.LQ_CSS_fnb_orders
//       SET status = @status, updatedAt = GETDATE()
//       OUTPUT inserted.orderID,
//               inserted.clientID,
//               inserted.status,
//               inserted.createdAt,
//               inserted.updatedAt,
//               inserted.sessionID
//       WHERE orderID = @orderID
//     `);

//   return res.recordset?.[0];
// };
export const updateOrderStatus = async (orderID, status, changeBy = "System") => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // Step 0️⃣: Fetch current order
    const orderRes = await transaction.request()
      .input("orderID", sql.Int, orderID)
      .query(`
        SELECT orderID, clientID, status, updatedAt
        FROM sg.LQ_CSS_fnb_orders
        WHERE orderID = @orderID
      `);

    if (!orderRes.recordset.length) throw new Error(`Order ${orderID} not found`);

    const { clientID, status: currentStatus, updatedAt } = orderRes.recordset[0];

    console.log("Fetched order:", orderRes.recordset[0]);

    // Step 1️⃣: Verify order has at least one product in category 3–6
    const check = await transaction.request()
      .input("orderID", sql.Int, orderID)
      .query(`
        SELECT COUNT(*) AS count
        FROM sg.LQ_CSS_fnb_order_items i
        INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
        WHERE i.orderID = @orderID AND p.categoryID BETWEEN 3 AND 6
      `);

    if (check.recordset[0].count === 0) {
      console.warn(`Order ${orderID} has no products in categories 3–6. Skipping category check.`);
    }

    // Step 2️⃣: If cancelling, restore package quantities
    if (status.toLowerCase() === "cancelled" && currentStatus.toLowerCase() !== "cancelled") {

      // Fetch all consumption logs for this order
      const logsRes = await transaction.request()
        .input("orderID", sql.Int, orderID)
        .query(`
          SELECT productID, packageID, quantity
          FROM sg.LQ_CSS_client_consumption_log
          WHERE consumedFrom = 'checkout' AND orderID = @orderID
        `);

      for (const log of logsRes.recordset) {
        const { productID, packageID, quantity } = log;

        if (!packageID) {
          console.warn(`No package found for product ${productID}, skipping restore`);
          continue;
        }

        const req = transaction.request()
          .input("clientID", sql.Int, clientID)
          .input("productID", sql.Int, productID)
          .input("packageID", sql.Int, packageID)
          .input("quantity", sql.Int, quantity);

        // Restore package item quantity
        await req.query(`
          UPDATE sg.LQ_CSS_client_package_items
          SET quantity = quantity + @quantity
          WHERE clientID = @clientID AND productID = @productID AND packageID = @packageID
        `);

        // Restore package remainingQty
        await req.query(`
          UPDATE sg.LQ_CSS_client_packages
          SET remainingQty = remainingQty + @quantity
          WHERE clientID = @clientID AND packageID = @packageID
        `);

        // Log negative consumption
        await req.query(`
          INSERT INTO sg.LQ_CSS_client_consumption_log
          (clientID, productID, packageID, quantity, consumedFrom, createdAt)
          VALUES (@clientID, @productID, @packageID, -@quantity, 'cancelOrder', GETDATE())
        `);

        console.log("Restored item:", { productID, packageID, quantity });
      }
    }

    // Step 3️⃣: Update order status
    console.log("Updating order status...", { orderID, currentStatus, newStatus: status });
    await transaction.request()
      .input("orderID", sql.Int, orderID)
      .input("status", sql.NVarChar, status)
      .query(`
        UPDATE sg.LQ_CSS_fnb_orders
        SET status = @status, updatedAt = GETDATE()
        WHERE orderID = @orderID
      `);

    // Step 4️⃣: Fetch updated order
    const res = await transaction.request()
      .input("orderID", sql.Int, orderID)
      .query(`
        SELECT orderID, clientID, status, createdAt, updatedAt, sessionID
        FROM sg.LQ_CSS_fnb_orders
        WHERE orderID = @orderID
      `);

    console.log("Updated order:", res.recordset[0]);

    // Step 5️⃣: Log status change
    const now = new Date();
    const previousUpdate = new Date(updatedAt);
    const timeSpentInPreviousStatus = Math.floor((now - previousUpdate) / 1000);

    await transaction.request()
      .input("orderID", sql.Int, orderID)
      .input("clientID", sql.Int, clientID)
      .input("previousStatus", sql.NVarChar, currentStatus)
      .input("newStatus", sql.NVarChar, status)
      .input("changedBy", sql.NVarChar, changeBy)
      .input("changedAt", sql.DateTime, now)
      .input("timeSpentInPreviousStatus", sql.Int, timeSpentInPreviousStatus)
      .query(`
        INSERT INTO sg.LQ_CSS_fnb_order_status_log
        (orderID, clientID, previousStatus, newStatus, changedBy, changedAt, timeSpentInPreviousStatus)
        VALUES (@orderID, @clientID, @previousStatus, @newStatus, @changedBy, @changedAt, @timeSpentInPreviousStatus)
      `);

    await transaction.commit();
    return res.recordset?.[0];

  } catch (err) {
    await transaction.rollback();
    console.error("Transaction failed:", err.message);
    throw new Error(err.message);
  }
};


// Update order status
// export const cancelOrderBySession = async (orderID) => {
//   const pool = await poolPromise;
//   const transaction = new sql.Transaction(pool);

//   try {
//     await transaction.begin();

//     // Step 1: Check if order exists and is Pending
//     const check = await transaction.request()
//       .input("orderID", sql.Int, orderID)
//       .query(`
//         SELECT o.orderID, o.clientID, o.status
//         FROM sg.LQ_CSS_fnb_orders o
//         WHERE o.orderID = @orderID
//       `);

//     if (check.recordset.length === 0) throw new Error(`Order ${orderID} not found.`);

//     const { clientID, status: currentStatus } = check.recordset[0];
//     if (currentStatus !== "Pending") throw new Error(`Order ${orderID} cannot be cancelled — current status is '${currentStatus}'.`);

//     // Step 2: Ensure order has at least one product in category 3–6
//     const hasAllowedCategory = await transaction.request()
//       .input("orderID", sql.Int, orderID)
//       .query(`
//         SELECT COUNT(*) AS count
//         FROM sg.LQ_CSS_fnb_order_items i
//         INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
//         WHERE i.orderID = @orderID
//           AND p.categoryID BETWEEN 3 AND 6
//       `);

//     if (hasAllowedCategory.recordset[0].count === 0) {
//       throw new Error(`Order ${orderID} cannot be cancelled — it has no items from categories 3–6.`);
//     }

//     // Step 3: Restore quantities for each order item
//     const itemsRes = await transaction.request()
//       .input("orderID", sql.Int, orderID)
//       .query(`
//         SELECT productID, quantity
//         FROM sg.LQ_CSS_fnb_order_items
//         WHERE orderID = @orderID
//       `);

//     for (const item of itemsRes.recordset) {
//       const { productID, quantity } = item;

//       // Restore package items quantity
//       await transaction.request()
//         .input("clientID", sql.Int, clientID)
//         .input("productID", sql.Int, productID)
//         .input("quantity", sql.Int, quantity)
//         .query(`
//           UPDATE sg.LQ_CSS_client_package_items
//           SET quantity = quantity + @quantity
//           WHERE clientID = @clientID AND productID = @productID
//         `);

//       // Restore package summary remainingQty
//       await transaction.request()
//         .input("clientID", sql.Int, clientID)
//         .input("productID", sql.Int, productID)
//         .input("quantity", sql.Int, quantity)
//         .query(`
//           UPDATE sg.LQ_CSS_client_packages
//           SET remainingQty = remainingQty + @quantity
//           WHERE clientID = @clientID
//             AND packageID IN (
//               SELECT packageID
//               FROM sg.LQ_CSS_client_package_items
//               WHERE clientID = @clientID AND productID = @productID
//             )
//         `);

//       // Optional: log negative consumption
//       await transaction.request()
//         .input("clientID", sql.Int, clientID)
//         .input("productID", sql.Int, productID)
//         .input("quantity", sql.Int, quantity)
//         .query(`
//           INSERT INTO sg.LQ_CSS_client_consumption_log
//           (clientID, productID, quantity, consumedFrom, createdAt)
//           VALUES (@clientID, @productID, -@quantity, 'cancelOrder', GETDATE())
//         `);
//     }

//     // Step 4: Cancel the order
//     const res = await transaction.request()
//       .input("orderID", sql.Int, orderID)
//       .query(`
//         UPDATE sg.LQ_CSS_fnb_orders
//         SET status = 'Cancelled',
//             updatedAt = GETDATE()
//         OUTPUT inserted.orderID, inserted.clientID, inserted.sessionID, inserted.status, inserted.updatedAt
//         WHERE orderID = @orderID;
//       `);

//     await transaction.commit();
//     return res.recordset?.[0] || null;

//   } catch (err) {
//     await transaction.rollback();
//     throw new Error(err.message);
//   }
// }; old code

export const cancelOrderBySession = async (orderID) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // Step 1: Check if order exists and is Pending
    const orderRes = await transaction.request()
      .input("orderID", sql.Int, orderID)
      .query(`
        SELECT orderID, clientID, status
        FROM sg.LQ_CSS_fnb_orders
        WHERE orderID = @orderID
      `);

    if (!orderRes.recordset.length) throw new Error(`Order ${orderID} not found.`);
    const { clientID, status: currentStatus } = orderRes.recordset[0];
    if (currentStatus !== "Pending") throw new Error(`Order ${orderID} cannot be cancelled — current status is '${currentStatus}'.`);

    // Step 2: Get all order items with their packageID
    const itemsRes = await transaction.request()
      .input("orderID", sql.Int, orderID)
      .query(`
        SELECT productID, quantity, packageID
        FROM sg.LQ_CSS_fnb_order_items
        WHERE orderID = @orderID
      `);

    if (!itemsRes.recordset.length) throw new Error(`Order ${orderID} has no items.`);

    for (const item of itemsRes.recordset) {
      const { productID, quantity, packageID } = item;
      if (!packageID) continue; // safety check

      // 2a: Restore quantity in the specific package item
      await transaction.request()
        .input("clientID", sql.Int, clientID)
        .input("productID", sql.Int, productID)
        .input("packageID", sql.Int, packageID)
        .input("quantity", sql.Int, quantity)
        .query(`
          UPDATE sg.LQ_CSS_client_package_items
          SET quantity = quantity + @quantity
          WHERE clientID = @clientID AND productID = @productID AND packageID = @packageID
        `);

      // 2b: Restore remainingQty for that package
      await transaction.request()
        .input("clientID", sql.Int, clientID)
        .input("packageID", sql.Int, packageID)
        .input("quantity", sql.Int, quantity)
        .query(`
          UPDATE sg.LQ_CSS_client_packages
          SET remainingQty = remainingQty + @quantity
          WHERE clientID = @clientID AND packageID = @packageID
        `);

      // 2c: Log negative consumption for audit
      await transaction.request()
        .input("clientID", sql.Int, clientID)
        .input("productID", sql.Int, productID)
        .input("packageID", sql.Int, packageID)
        .input("quantity", sql.Int, quantity)
        .query(`
          INSERT INTO sg.LQ_CSS_client_consumption_log
            (clientID, productID, packageID, quantity, consumedFrom, createdAt)
          VALUES
            (@clientID, @productID, @packageID, -@quantity, 'cancelOrder', GETDATE())
        `);
    }

    // Step 3: Update order status to Cancelled
    const res = await transaction.request()
      .input("orderID", sql.Int, orderID)
      .query(`
        UPDATE sg.LQ_CSS_fnb_orders
        SET status = 'Cancelled', updatedAt = GETDATE()
        OUTPUT inserted.orderID, inserted.clientID, inserted.sessionID, inserted.status, inserted.updatedAt
        WHERE orderID = @orderID
      `);

    await transaction.commit();
    return res.recordset?.[0] || null;

  } catch (err) {
    await transaction.rollback();
    throw new Error(err.message);
  }
};

// export const cancelOrderBySession = async (orderID) => {
//   const pool = await poolPromise;
//   const transaction = new sql.Transaction(pool);

//   try {
//     await transaction.begin();

//     // Step 1: Check order exists and status
//     const check = await transaction.request()
//       .input("orderID", sql.Int, orderID)
//       .query(`SELECT orderID, clientID, status FROM sg.LQ_CSS_fnb_orders WHERE orderID = @orderID`);

//     if (!check.recordset.length) throw new Error(`Order ${orderID} not found.`);
//     const { clientID, status: currentStatus } = check.recordset[0];
//     if (currentStatus !== "Pending") throw new Error(`Order cannot be cancelled — current status is '${currentStatus}'.`);

//     // Step 2: Get all consumed packages for this order
//     const logRes = await transaction.request()
//       .input("orderID", sql.Int, orderID)
//       .query(`
//         SELECT packageID, SUM(quantity) AS totalConsumed
//         FROM sg.LQ_CSS_client_consumption_log
//         WHERE orderID = @orderID AND consumedFrom = 'checkout'
//         GROUP BY packageID
//       `);

//     // Step 3: Restore package remainingQty
//     for (const pkg of logRes.recordset) {
//       await transaction.request()
//         .input("clientID", sql.Int, clientID)
//         .input("packageID", sql.Int, pkg.packageID)
//         .input("quantity", sql.Int, pkg.totalConsumed)
//         .query(`
//           UPDATE sg.LQ_CSS_client_packages
//           SET remainingQty = remainingQty + @quantity
//           WHERE clientID = @clientID AND packageID = @packageID
//         `);
//     }

//     // Step 4: Optional: log negative consumption for audit
//     for (const pkg of logRes.recordset) {
//       await transaction.request()
//         .input("clientID", sql.Int, clientID)
//         .input("packageID", sql.Int, pkg.packageID)
//         .input("quantity", sql.Int, pkg.totalConsumed)
//         .query(`
//           INSERT INTO sg.LQ_CSS_client_consumption_log
//           (clientID, packageID, quantity, consumedFrom, createdAt, orderID)
//           VALUES (@clientID, @packageID, -@quantity, 'cancelOrder', GETDATE(), @orderID)
//         `);
//     }

//     // Step 5: Update order status
//     const res = await transaction.request()
//       .input("orderID", sql.Int, orderID)
//       .query(`
//         UPDATE sg.LQ_CSS_fnb_orders
//         SET status = 'Cancelled', updatedAt = GETDATE()
//         OUTPUT inserted.*
//         WHERE orderID = @orderID
//       `);

//     await transaction.commit();
//     return res.recordset?.[0];

//   } catch (err) {
//     await transaction.rollback();
//     throw new Error(err.message);
//   }
// };

// ----------------------DELETE-------------------------
export const cancelOrder = async (orderID) => {
  const pool = await poolPromise;

  // Check current status
  const res = await pool.request()
    .input("orderID", sql.Int, orderID)
    .query(`SELECT status FROM sg.LQ_CSS_fnb_orders WHERE orderID = @orderID`);

  if (res.recordset.length === 0) throw new Error("Order not found");
  const currentStatus = res.recordset[0].status;

  if (currentStatus !== "Pending") {
    throw new Error("Only pending orders can be cancelled");
  }

  const updateRes = await pool.request()
    .input("orderID", sql.Int, orderID)
    .query(`
      UPDATE sg.LQ_CSS_fnb_orders
      SET status = 'Cancelled', updatedAt = GETDATE()
      OUTPUT inserted.orderID,
              inserted.clientID,
              inserted.status,
              inserted.createdAt,
              inserted.updatedAt,
              inserted.sessionID
      WHERE orderID = @orderID
    `);

  return updateRes.recordset?.[0];
};

