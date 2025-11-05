// models/fnb_cart_model.js
import { poolPromise, sql } from "../config/db_config.js";

// ----------------------GET-------------------------
// View cart
export const viewCart = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`
      SELECT i.cartItemID, i.productID, i.quantity, i.sizeId, p.productName, p.price, (i.quantity * p.price) AS total
      FROM sg.LQ_CSS_fnb_cart_items i
      INNER JOIN sg.LQ_CSS_fnb_cart c ON i.cartID = c.cartID
      INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
      WHERE c.clientID = @clientID
    `);
  return res.recordset;
};

export const viewCartBySession = async (sessionID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("sessionID", sql.Int, sessionID)
    .query(`
      SELECT 
          i.cartItemID, 
          i.productID, 
          p.categoryID,
          categoryInfo.categoryName, 
          p.productName, 
          i.quantity AS qty,
          p.price,
          producSize.size,
          (i.quantity * p.price) AS total
      FROM sg.LQ_CSS_fnb_cart_items i
      INNER JOIN sg.LQ_CSS_fnb_cart c ON i.cartID = c.cartID
      INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
      LEFT JOIN sg.LQ_CSS_fnb_categories AS categoryInfo
          ON p.categoryID = categoryInfo.categoryID
      LEFT JOIN sg.LQ_CSS_product_sizes AS producSize
          ON p.sizeId = producSize.sizeId
      WHERE c.sessionID = @sessionID
    `);
  return res.recordset;
};


// View all
export const viewAllCarts = async () => {
  const pool = await poolPromise;
  const res = await pool.request()
    .query(`
      SELECT 
        c.cartID, 
        c.clientID, 
        c.sessionID,
        ci.deceasedName, 
        ci.registeredBy AS customerName,
        ci.mobileNo AS customerNumber,
        i.cartItemID, 
        i.productID, 
        i.quantity, 
        i.sizeId, 
        p.productName, 
        p.price,
        (i.quantity * p.price) AS total
      FROM sg.LQ_CSS_fnb_cart c
      LEFT JOIN sg.LQ_CSS_client_info ci ON c.clientID = ci.clientID
      INNER JOIN sg.LQ_CSS_fnb_cart_items i ON i.cartID = c.cartID
      INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
      ORDER BY c.cartID, i.cartItemID
    `);

  return res.recordset;
};

// get order
export const getOrderReceipt = async (orderID) => {
  const pool = await poolPromise;

  // 1️⃣ Fetch main order info + client + chapel + package
  const orderRes = await pool.request()
    .input("orderID", sql.Int, orderID)
    .query(`
      SELECT 
        o.orderID,
        c.deceasedName,
        cr.chapelName AS chapel,
        fp.packageName AS package,
        c.registeredBy AS customerName,
        c.mobileNo AS customerNumber,
        o.status,
        o.createdAt AS orderDateTime
      FROM sg.LQ_CSS_fnb_orders o
      INNER JOIN sg.LQ_CSS_client_info c ON o.clientID = c.clientID
      LEFT JOIN sg.LQ_CSS_chapel_rooms cr ON c.chapelID = cr.chapelID
      LEFT JOIN sg.LQ_CSS_fnb_packages fp ON c.packageNo = fp.packageID
      WHERE o.orderID = @orderID
    `);

  const order = orderRes.recordset?.[0];
  if (!order) return null;

  // 2️⃣ Fetch order items
  const itemsRes = await pool.request()
    .input("orderID", sql.Int, orderID)
    .query(`
      SELECT p.productName AS description, oi.quantity AS qty, p.price AS amount, oi.sizeId
      FROM sg.LQ_CSS_fnb_order_items oi
      INNER JOIN sg.LQ_CSS_fnb_products p ON oi.productID = p.productID
      WHERE oi.orderID = @orderID
    `);

  const items = itemsRes.recordset || [];
  const total = items.reduce((sum, i) => sum + i.qty * i.amount, 0);

  return { ...order, items, total };
};

// ----------------------POST-------------------------
// export const addItem = async (clientID, productID, quantity, sizeId) => {
//   const pool = await poolPromise;

//   let res = await pool.request()
//     .input("clientID", sql.Int, clientID)
//     .query("SELECT cartID FROM sg.LQ_CSS_fnb_cart WHERE clientID = @clientID");

//   let cartID = res.recordset[0]?.cartID;
//   if (!cartID) {
//     res = await pool.request()
//       .input("clientID", sql.Int, clientID)
//       .query("INSERT INTO sg.LQ_CSS_fnb_cart (clientID) VALUES (@clientID); SELECT SCOPE_IDENTITY() AS cartID");
//     cartID = res.recordset[0].cartID;
//   }

//   await pool.request()
//     .input("cartID", sql.Int, cartID)
//     .input("productID", sql.Int, productID)
//     .input("quantity", sql.Int, quantity)
//     .input("sizeId", sql.Int, sizeId)
//     .query(`
//       IF EXISTS (SELECT 1 FROM sg.LQ_CSS_fnb_cart_items WHERE cartID = @cartID AND productID = @productID AND sizeId = @sizeId)
//         UPDATE sg.LQ_CSS_fnb_cart_items SET quantity = quantity + @quantity WHERE cartID = @cartID AND productID = @productID AND sizeId = @sizeId
//       ELSE
//         INSERT INTO sg.LQ_CSS_fnb_cart_items (cartID, productID, quantity, sizeId) VALUES (@cartID, @productID, @quantity, @sizeId)
//     `);

//   return true;
// }; 10/30

export const addItems = async (clientID, items, sessionID) => {
  if (!Array.isArray(items) || items.length === 0) throw new Error("Items array is required");

  const pool = await poolPromise;

  // Get or create cartID using clientID or sessionID
  let res;
  let cartID;

  if (sessionID) {
    // Find cart by sessionID
    res = await pool.request()
      .input("sessionID", sql.Int, sessionID)
      .query("SELECT cartID FROM sg.LQ_CSS_fnb_cart WHERE sessionID = @sessionID");

    cartID = res.recordset[0]?.cartID;

    if (!cartID) {
      res = await pool.request()
        .input("clientID", sql.Int, clientID || null)
        .input("sessionID", sql.Int, sessionID)
        .query("INSERT INTO sg.LQ_CSS_fnb_cart (clientID, sessionID) VALUES (@clientID, @sessionID); SELECT SCOPE_IDENTITY() AS cartID");
      cartID = res.recordset[0].cartID;
    }
  } else {
    // Fallback: find or create by clientID
    res = await pool.request()
      .input("clientID", sql.Int, clientID)
      .query("SELECT cartID FROM sg.LQ_CSS_fnb_cart WHERE clientID = @clientID");

    cartID = res.recordset[0]?.cartID;

    if (!cartID) {
      res = await pool.request()
        .input("clientID", sql.Int, clientID)
        .query("INSERT INTO sg.LQ_CSS_fnb_cart (clientID) VALUES (@clientID); SELECT SCOPE_IDENTITY() AS cartID");
      cartID = res.recordset[0].cartID;
    }
  }

  // Loop through items
  for (const item of items) {
    const { productID, quantity, sizeId } = item; // <-- include sizeId
    if (!productID || !quantity) continue;

    await pool.request()
      .input("cartID", sql.Int, cartID)
      .input("productID", sql.Int, productID)
      .input("quantity", sql.Int, quantity)
      .input("sizeId", sql.Int, sizeId || null) // store sizeId
      .query(`
        IF EXISTS (SELECT 1 FROM sg.LQ_CSS_fnb_cart_items 
                   WHERE cartID = @cartID AND productID = @productID AND sizeId = @sizeId)
          UPDATE sg.LQ_CSS_fnb_cart_items 
          SET quantity = quantity + @quantity 
          WHERE cartID = @cartID AND productID = @productID AND sizeId = @sizeId
        ELSE
          INSERT INTO sg.LQ_CSS_fnb_cart_items (cartID, productID, quantity, sizeId) 
          VALUES (@cartID, @productID, @quantity, @sizeId)
      `);
  }

  return true;
};

// export const checkout = async (clientID = null, sessionID = null, staffID = null) => {
//   const pool = await poolPromise;
//   const transaction = new sql.Transaction(pool);

//   try {
//     await transaction.begin();

//     // Resolve clientID via sessionID if needed
//     if (!clientID && sessionID) {
//       const clientRes = await transaction.request()
//         .input("sessionID", sql.Int, sessionID)
//         .query(`
//           SELECT clientID
//           FROM sg.LQ_CSS_sessions_info
//           WHERE sessionID = @sessionID
//         `);
//       clientID = clientRes.recordset[0]?.clientID || null;
//     }

//     if (!clientID && !sessionID) throw new Error("Cannot resolve clientID or sessionID");

//     // Check cart items
//     const cartRes = await transaction.request()
//       .input("clientID", sql.Int, clientID)
//       .input("sessionID", sql.Int, sessionID)
//       .query(`
//         SELECT i.cartItemID, i.productID, i.quantity, i.sizeId
//         FROM sg.LQ_CSS_fnb_cart_items i
//         INNER JOIN sg.LQ_CSS_fnb_cart c ON i.cartID = c.cartID
//         WHERE c.clientID = @clientID OR c.sessionID = @sessionID
//       `);

//     const cartItems = cartRes.recordset;
//     if (!cartItems || cartItems.length === 0) throw new Error("Cart is empty");

//     // Create new order
//     const orderInsert = await transaction.request()
//       .input("clientID", sql.Int, clientID)
//       .input("sessionID", sql.Int, sessionID)
//       .input("staffID", sql.Int, staffID)
//       .query(`
//         INSERT INTO sg.LQ_CSS_fnb_orders (clientID, status, createdAt, updatedAt, staffID, sessionID)
//         OUTPUT INSERTED.orderID
//         VALUES (@clientID, 'Pending', GETDATE(), GETDATE(), @staffID, @sessionID)
//       `);

//     const orderID = orderInsert.recordset[0].orderID;

//     // Insert order items with sessionID
//     for (const item of cartItems) {
//       await transaction.request()
//         .input("orderID", sql.Int, orderID)
//         .input("productID", sql.Int, item.productID)
//         .input("quantity", sql.Int, item.quantity)
//         .input("sizeId", sql.Int, item.sizeId || null)
//         .input("sessionID", sql.Int, sessionID)
//         .query(`
//           INSERT INTO sg.LQ_CSS_fnb_order_items (orderID, productID, quantity, sizeId, sessionID)
//           VALUES (@orderID, @productID, @quantity, @sizeId, @sessionID)
//         `);
//     }

//     // Clear cart after checkout
//     await transaction.request()
//       .input("clientID", sql.Int, clientID)
//       .input("sessionID", sql.Int, sessionID)
//       .query(`
//         DELETE i
//         FROM sg.LQ_CSS_fnb_cart_items i
//         INNER JOIN sg.LQ_CSS_fnb_cart c ON i.cartID = c.cartID
//         WHERE c.clientID = @clientID OR c.sessionID = @sessionID
//       `);

//     await transaction.commit();

//     // Fetch order items for response
//     const itemsRes = await pool.request()
//       .input("orderID", sql.Int, orderID)
//       .query(`
//         SELECT p.productID,
//                p.productName AS description,
//                i.quantity AS qty,
//                p.price AS amount,
//                (i.quantity * p.price) AS total
//         FROM sg.LQ_CSS_fnb_order_items i
//         INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
//         WHERE i.orderID = @orderID
//       `);

//     const items = itemsRes.recordset;

//     // Fetch session info (chapelName + deceasedName)
//     const sessionRes = await pool.request()
//       .input("sessionID", sql.Int, sessionID)
//       .query(`
//         SELECT 
//         c.deceasedName,
//         cr.chapelName
//       FROM sg.LQ_CSS_sessions_info s
//       LEFT JOIN sg.LQ_CSS_client_info c ON s.clientID = c.clientID
//       LEFT JOIN sg.LQ_CSS_chapel_rooms cr ON c.chapelID = cr.chapelID
//       WHERE s.sessionID = @sessionID
//       `);

//     const sessionInfo = sessionRes.recordset?.[0] || {};

//     // Build final receipt
//     const totalAmount = items.reduce((sum, i) => sum + i.total, 0);
//     return {
//       orderID,
//       orderStatus: "Pending",
//       chapelName: sessionInfo.chapelName || null,
//       deceasedName: sessionInfo.deceasedName || null,
//       items,
//       totalAmount,
//       handledByStaffID: staffID
//     };

//   } catch (err) {
//     await transaction.rollback();
//     throw new Error(err.message);
//   }
// };

// export const checkout = async (clientID = null, sessionID = null, staffID = null) => {
//   const pool = await poolPromise;
//   const transaction = new sql.Transaction(pool);

//   try {
//     await transaction.begin();

//     // 1️⃣ Resolve clientID from sessionID if needed
//     if (!clientID && sessionID) {
//       const clientRes = await transaction.request()
//         .input("sessionID", sql.Int, sessionID)
//         .query(`
//           SELECT clientID
//           FROM sg.LQ_CSS_sessions_info
//           WHERE sessionID = @sessionID
//         `);
//       clientID = clientRes.recordset[0]?.clientID || null;
//     }

//     if (!clientID && !sessionID) throw new Error("Cannot resolve clientID or sessionID");

//     // 2️⃣ Fetch cart items
//     const cartRes = await transaction.request()
//       .input("clientID", sql.Int, clientID)
//       .input("sessionID", sql.Int, sessionID)
//       .query(`
//         SELECT i.cartItemID, i.productID, i.quantity, i.sizeId
//         FROM sg.LQ_CSS_fnb_cart_items i
//         INNER JOIN sg.LQ_CSS_fnb_cart c ON i.cartID = c.cartID
//         WHERE c.clientID = @clientID OR c.sessionID = @sessionID
//       `);

//     const cartItems = cartRes.recordset;
//     if (!cartItems || cartItems.length === 0) throw new Error("Cart is empty");

//     // 3️⃣ Create new order
//     const orderInsert = await transaction.request()
//       .input("clientID", sql.Int, clientID)
//       .input("sessionID", sql.Int, sessionID)
//       .input("staffID", sql.Int, staffID)
//       .query(`
//         INSERT INTO sg.LQ_CSS_fnb_orders (clientID, status, createdAt, updatedAt, staffID, sessionID)
//         OUTPUT INSERTED.orderID
//         VALUES (@clientID, 'Pending', GETDATE(), GETDATE(), @staffID, @sessionID)
//       `);

//     const orderID = orderInsert.recordset[0].orderID;

//     // 4️⃣ Insert order items
//     for (const item of cartItems) {
//       await transaction.request()
//         .input("orderID", sql.Int, orderID)
//         .input("productID", sql.Int, item.productID)
//         .input("quantity", sql.Int, item.quantity)
//         .input("sizeId", sql.Int, item.sizeId || null)
//         .input("sessionID", sql.Int, sessionID)
//         .query(`
//           INSERT INTO sg.LQ_CSS_fnb_order_items (orderID, productID, quantity, sizeId, sessionID)
//           VALUES (@orderID, @productID, @quantity, @sizeId, @sessionID)
//         `);
//     }

//     // 5️⃣ Deduct quantities and log consumption
//     for (const item of cartItems) {
//       // Find a package with enough quantity for this product
//       const { recordset: pkgRow } = await transaction.request()
//         .input("clientID", sql.Int, clientID)
//         .input("productID", sql.Int, item.productID)
//         .input("neededQty", sql.Int, item.quantity)
//         .query(`
//           SELECT TOP 1 packageID, quantity
//           FROM sg.LQ_CSS_client_package_items
//           WHERE clientID = @clientID
//             AND productID = @productID
//             AND quantity >= @neededQty
//           ORDER BY createdAt ASC;
//         `);

//       if (pkgRow.length === 0)
//         throw new Error(`Not enough stock`);

//       const { packageID } = pkgRow[0];

//       // Initialize remaining QTY
//       await transaction.request()
//         .input("clientID", sql.Int, clientID)
//         .input("packageID", sql.Int, packageID)
//         .query(`
//           UPDATE sg.LQ_CSS_client_packages
//           SET remainingQty = quantity
//           WHERE clientID = @clientID AND packageID = @packageID AND (remainingQty IS NULL OR remainingQty = 0)
//         `);

//       // Deduct from package items
//       await transaction.request()
//         .input("clientID", sql.Int, clientID)
//         .input("productID", sql.Int, item.productID)
//         .input("packageID", sql.Int, packageID)
//         .input("quantity", sql.Int, item.quantity)
//         .query(`
//           UPDATE sg.LQ_CSS_client_package_items
//           SET quantity = quantity - @quantity
//           WHERE clientID = @clientID AND productID = @productID AND packageID = @packageID;
//         `);

//       // Deduct from package summary
//       await transaction.request()
//         .input("clientID", sql.Int, clientID)
//         .input("packageID", sql.Int, packageID)
//         .input("quantity", sql.Int, item.quantity)
//         .query(`
//           UPDATE sg.LQ_CSS_client_packages
//           SET remainingQty = CASE 
//               WHEN remainingQty - @quantity < 0 THEN 0 
//               ELSE remainingQty - @quantity 
//           END
//           WHERE clientID = @clientID AND packageID = @packageID;
//           `);

//       // Log consumption
//       await transaction.request()
//         .input("clientID", sql.Int, clientID)
//         .input("packageID", sql.Int, packageID)
//         .input("productID", sql.Int, item.productID)
//         .input("quantity", sql.Int, item.quantity)
//         .query(`
//           INSERT INTO sg.LQ_CSS_client_consumption_log
//           (clientID, packageID, productID, quantity, consumedFrom, createdAt)
//           VALUES (@clientID, @packageID, @productID, @quantity, 'checkout', GETDATE());
//         `);
//     }

//     // 6️⃣ Clear cart
//     await transaction.request()
//       .input("clientID", sql.Int, clientID)
//       .input("sessionID", sql.Int, sessionID)
//       .query(`
//         DELETE i
//         FROM sg.LQ_CSS_fnb_cart_items i
//         INNER JOIN sg.LQ_CSS_fnb_cart c ON i.cartID = c.cartID
//         WHERE c.clientID = @clientID OR c.sessionID = @sessionID
//       `);

//     await transaction.commit();

//     // 7️⃣ Build receipt response
//     const itemsRes = await pool.request()
//       .input("orderID", sql.Int, orderID)
//       .query(`
//         SELECT p.productID,
//               p.productName AS description,
//               i.quantity AS qty,
//               p.price AS amount,
//                (i.quantity * p.price) AS total
//         FROM sg.LQ_CSS_fnb_order_items i
//         INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
//         WHERE i.orderID = @orderID
//       `);

//     const items = itemsRes.recordset;
//     const totalAmount = items.reduce((sum, i) => sum + i.total, 0);

//     const sessionRes = await pool.request()
//       .input("sessionID", sql.Int, sessionID)
//       .query(`
//         SELECT 
//           c.deceasedName,
//           cr.chapelName
//         FROM sg.LQ_CSS_sessions_info s
//         LEFT JOIN sg.LQ_CSS_client_info c ON s.clientID = c.clientID
//         LEFT JOIN sg.LQ_CSS_chapel_rooms cr ON c.chapelID = cr.chapelID
//         WHERE s.sessionID = @sessionID
//       `);

//     const sessionInfo = sessionRes.recordset?.[0] || {};

//     return {
//       orderID,
//       orderStatus: "Pending",
//       chapelName: sessionInfo.chapelName || null,
//       deceasedName: sessionInfo.deceasedName || null,
//       items,
//       totalAmount,
//       handledByStaffID: staffID
//     };

//   } catch (err) {
//     await transaction.rollback();
//     throw new Error(err.message);
//   }
// };

export const checkout = async (clientID = null, sessionID = null, staffID = null) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1️⃣ Resolve clientID from sessionID
    if (!clientID && sessionID) {
      const clientRes = await transaction.request()
        .input("sessionID", sql.Int, sessionID)
        .query(`SELECT clientID FROM sg.LQ_CSS_sessions_info WHERE sessionID = @sessionID`);
      clientID = clientRes.recordset[0]?.clientID || null;
    }
    if (!clientID) throw new Error("Cannot resolve clientID or sessionID");

    // 2️⃣ Fetch cart items
    const cartRes = await transaction.request()
      .input("clientID", sql.Int, clientID)
      .input("sessionID", sql.Int, sessionID)
      .query(`
        SELECT i.cartItemID, i.productID, i.quantity, i.sizeId
        FROM sg.LQ_CSS_fnb_cart_items i
        INNER JOIN sg.LQ_CSS_fnb_cart c ON i.cartID = c.cartID
        WHERE c.clientID = @clientID OR c.sessionID = @sessionID
      `);
    const cartItems = cartRes.recordset;
    if (!cartItems.length) throw new Error("Cart is empty");

    // 3️⃣ Create new order
    const orderInsert = await transaction.request()
      .input("clientID", sql.Int, clientID)
      .input("sessionID", sql.Int, sessionID)
      .input("staffID", sql.Int, staffID)
      .query(`
        INSERT INTO sg.LQ_CSS_fnb_orders (clientID, status, createdAt, updatedAt, staffID, sessionID)
        OUTPUT INSERTED.orderID
        VALUES (@clientID, 'Pending', GETDATE(), GETDATE(), @staffID, @sessionID)
      `);
    const orderID = orderInsert.recordset[0].orderID;

    // 4️⃣ Deduct from package pool (remainingQty) for all items
    for (const item of cartItems) {
      // Find a package with enough remainingQty
      const { recordset: pkgRow } = await transaction.request()
        .input("clientID", sql.Int, clientID)
        .input("neededQty", sql.Int, item.quantity)
        .query(`
          SELECT TOP 1 packageID, remainingQty
          FROM sg.LQ_CSS_client_packages
          WHERE clientID = @clientID AND remainingQty >= @neededQty
          ORDER BY createdAt ASC
        `);

      if (!pkgRow.length) throw new Error(`Already Exceed the Limit of the Package.`);
      const { packageID } = pkgRow[0];

      // Deduct from package pool
      await transaction.request()
        .input("clientID", sql.Int, clientID)
        .input("packageID", sql.Int, packageID)
        .input("quantity", sql.Int, item.quantity)
        .query(`
          UPDATE sg.LQ_CSS_client_packages
          SET remainingQty = remainingQty - @quantity
          WHERE clientID = @clientID AND packageID = @packageID
        `);

      // Log consumption
      await transaction.request()
        .input("clientID", sql.Int, clientID)
        .input("packageID", sql.Int, packageID)
        .input("productID", sql.Int, item.productID)
        .input("quantity", sql.Int, item.quantity)
        .query(`
          INSERT INTO sg.LQ_CSS_client_consumption_log
          (clientID, packageID, productID, quantity, consumedFrom, createdAt)
          VALUES (@clientID, @packageID, @productID, @quantity, 'checkout', GETDATE())
        `);

      // Insert into order items
      await transaction.request()
        .input("orderID", sql.Int, orderID)
        .input("productID", sql.Int, item.productID)
        .input("quantity", sql.Int, item.quantity)
        .input("sizeId", sql.Int, item.sizeId || null)
        .query(`
          INSERT INTO sg.LQ_CSS_fnb_order_items (orderID, productID, quantity, sizeId)
          VALUES (@orderID, @productID, @quantity, @sizeId)
        `);
    }

    // 5️⃣ Clear cart
    await transaction.request()
      .input("clientID", sql.Int, clientID)
      .input("sessionID", sql.Int, sessionID)
      .query(`
        DELETE i
        FROM sg.LQ_CSS_fnb_cart_items i
        INNER JOIN sg.LQ_CSS_fnb_cart c ON i.cartID = c.cartID
        WHERE c.clientID = @clientID OR c.sessionID = @sessionID
      `);

    await transaction.commit();

    // 6️⃣ Build receipt
    const itemsRes = await pool.request()
      .input("orderID", sql.Int, orderID)
      .query(`
        SELECT p.productID,
              p.productName AS description,
              i.quantity AS qty,
              p.price AS amount,
              (i.quantity * p.price) AS total
        FROM sg.LQ_CSS_fnb_order_items i
        INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
        WHERE i.orderID = @orderID
      `);

    const totalAmount = itemsRes.recordset.reduce((sum, i) => sum + i.total, 0);

    return {
      orderID,
      orderStatus: "Pending",
      items: itemsRes.recordset,
      totalAmount,
      handledByStaffID: staffID
    };

  } catch (err) {
    await transaction.rollback();
    throw new Error(err.message);
  }
};


// ----------------------PUT-------------------------
// Update item quantity in cart
export const updateItem = async (clientID, sessionID, productID, quantity, sizeId = null) => {
  const pool = await poolPromise;

  try {
    let resCart;
    if (sessionID) {
      resCart = await pool.request()
        .input("sessionID", sql.Int, sessionID)
        .query("SELECT cartID FROM sg.LQ_CSS_fnb_cart WHERE sessionID = @sessionID");
    } else if (clientID) {
      resCart = await pool.request()
        .input("clientID", sql.Int, clientID)
        .query("SELECT cartID FROM sg.LQ_CSS_fnb_cart WHERE clientID = @clientID");
    } else {
      throw new Error("clientID or sessionID is required");
    }

    const cartID = resCart.recordset[0]?.cartID;
    if (!cartID) throw new Error("Cart not found");

    // Check if the item exists
    const resItem = await pool.request()
      .input("cartID", sql.Int, cartID)
      .input("productID", sql.Int, productID)
      .input("sizeId", sql.Int, sizeId)
      .query(`
        SELECT cartItemID
        FROM sg.LQ_CSS_fnb_cart_items
        WHERE cartID = @cartID AND productID = @productID
          ${sizeId !== null ? "AND sizeId = @sizeId" : "AND sizeId IS NULL"}
      `);

    if (resItem.recordset.length === 0) throw new Error("Item not found in cart");

    // Update quantity
    await pool.request()
      .input("cartID", sql.Int, cartID)
      .input("productID", sql.Int, productID)
      .input("quantity", sql.Int, quantity)
      .input("sizeId", sql.Int, sizeId)
      .query(`
        UPDATE sg.LQ_CSS_fnb_cart_items
        SET quantity = @quantity
        WHERE cartID = @cartID AND productID = @productID
          ${sizeId !== null ? "AND sizeId = @sizeId" : "AND sizeId IS NULL"}
      `);

    return { message: "Cart item updated successfully" };
  } catch (error) {
    throw new Error(error.message);
  }
};


// ----------------------DELETE-------------------------
// Remove item from cart
export const removeItem = async (clientID, productID, sessionID) => {
  const pool = await poolPromise;

  let query = `
    DELETE FROM sg.LQ_CSS_fnb_cart_items
    WHERE productID = @productID AND cartID = (
      SELECT cartID FROM sg.LQ_CSS_fnb_cart WHERE ${sessionID ? "sessionID = @sessionID" : "clientID = @clientID"}
    )
  `;

  const request = pool.request()
    .input("productID", sql.Int, productID);

  if (sessionID) request.input("sessionID", sql.Int, sessionID);
  else request.input("clientID", sql.Int, clientID);

  await request.query(query);
  return true;
};
