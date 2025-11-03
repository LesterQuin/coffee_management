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

// Checkout cart → create order
// export const checkout = async (clientID, paymentType, staffID) => {
//   const pool = await poolPromise;

//   const res = await pool.request()
//     .input("clientID", sql.Int, clientID)
//     .input("paymentType", sql.NVarChar(20), paymentType)
//     .execute("sg.LQ_CSS_fnb_cart_checkout");

//   const { orderID, totalAmount } = res.recordset[0];

//   const clientRes = await pool.request()
//     .input("clientID", sql.Int, clientID)
//     .query(`
//       SELECT c.deceasedName, 
//             c.registeredBy AS customerName, 
//             c.mobileNo AS customerNumber,
//             cr.chapelName,
//             fp.packageName
//       FROM sg.LQ_CSS_client_info c
//       LEFT JOIN sg.LQ_CSS_chapel_rooms cr ON c.chapelID = cr.chapelID
//       LEFT JOIN sg.LQ_CSS_fnb_packages fp ON c.packageNo = fp.packageID
//       WHERE c.clientID = @clientID
//   `);

//   const client = clientRes.recordset[0];

//   const itemsRes = await pool.request()
//     .input("orderID", sql.Int, orderID)
//     .query(`
//       SELECT p.productName AS description, 
//               i.quantity AS qty, 
//               p.price AS amount, 
//               i.sizeId
//       FROM sg.LQ_CSS_fnb_order_items i
//       INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
//       WHERE i.orderID = @orderID
//     `);

//   const items = itemsRes.recordset;

//   const receipt = {
//     orderID: orderID,
//     deceasedName: client.deceasedName,
//     chapel: client.chapelName,
//     package: client.packageName,
//     orderDateTime: new Date().toISOString(),
//     customerName: client.customerName,
//     customerNumber: client.customerNumber,
//     status: "Pending",
//     items,
//     total: totalAmount,
//     handleByStaffID: staffID // optional only this
//   };

//   return receipt; // { orderID, totalAmount }
// };
export const checkout = async (clientID, paymentType, staffID) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1️⃣ Get the total quantity of items in the client's cart
    const cartRes = await transaction.request()
      .input("clientID", sql.Int, clientID)
      .query(`
        SELECT SUM(i.quantity) AS totalCartQty
        FROM sg.LQ_CSS_fnb_cart_items i
        INNER JOIN sg.LQ_CSS_fnb_cart c ON i.cartID = c.cartID
        WHERE c.clientID = @clientID
      `);

    const totalCartQty = cartRes.recordset[0]?.totalCartQty || 0;
    if (totalCartQty <= 0) {
      throw new Error("Cart is empty or invalid");
    }

    // 2️⃣ Get the client's remaining package quantity
    const pkgRes = await transaction.request()
      .input("clientID", sql.Int, clientID)
      .query(`
        SELECT quantity
        FROM sg.LQ_CSS_client_packages
        WHERE clientId = @clientID
      `);

    const remainingQty = pkgRes.recordset[0]?.quantity;
    if (remainingQty == null) {
      throw new Error("Client package not found");
    }

    // 3️⃣ Check if package has enough remaining quantity
    if (remainingQty < totalCartQty) {
      throw new Error("Insufficient package balance");
    }

    // 4️⃣ Deduct totalCartQty from client's package quantity
    await transaction.request()
      .input("clientID", sql.Int, clientID)
      .input("deductQty", sql.Int, totalCartQty)
      .query(`
        UPDATE sg.LQ_CSS_client_packages
        SET quantity = quantity - @deductQty
        WHERE clientId = @clientID
      `);

    // 5️⃣ Execute the checkout stored procedure (creates order + moves items)
    const orderRes = await transaction.request()
      .input("clientID", sql.Int, clientID)
      .input("paymentType", sql.NVarChar(20), paymentType)
      .execute("sg.LQ_CSS_fnb_cart_checkout");

    const { orderID, totalAmount } = orderRes.recordset[0];

    // 6️⃣ Commit the transaction
    await transaction.commit();

    // 7️⃣ Fetch receipt info
    const clientRes = await pool.request()
      .input("clientID", sql.Int, clientID)
      .query(`
        SELECT c.deceasedName, 
              c.registeredBy AS customerName, 
              c.mobileNo AS customerNumber,
              cr.chapelName,
              fp.packageName
        FROM sg.LQ_CSS_client_info c
        LEFT JOIN sg.LQ_CSS_chapel_rooms cr ON c.chapelID = cr.chapelID
        LEFT JOIN sg.LQ_CSS_fnb_packages fp ON c.packageNo = fp.packageID
        WHERE c.clientID = @clientID
    `);

    const client = clientRes.recordset[0];

    const itemsRes = await pool.request()
      .input("orderID", sql.Int, orderID)
      .query(`
        SELECT p.productName AS description, 
                i.quantity AS qty, 
                p.price AS amount
        FROM sg.LQ_CSS_fnb_order_items i
        INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
        WHERE i.orderID = @orderID
      `);

    const items = itemsRes.recordset;

    return {
      orderID,
      deceasedName: client.deceasedName,
      chapel: client.chapelName,
      package: client.packageName,
      orderDateTime: new Date().toISOString(),
      customerName: client.customerName,
      customerNumber: client.customerNumber,
      status: "Pending",
      items,
      total: totalAmount,
      handledByStaffID: staffID
    };
  } catch (err) {
    await transaction.rollback();
    throw new Error(err.message);
  }
};

// ----------------------PUT-------------------------
// Update item quantity in cart
export const updateItem = async (clientID, productID, quantity, sizeId) => {
  const pool = await poolPromise;
  
  try {
    const resCart = await pool.request()
      .input("clientID", sql.Int, clientID)
      .query("SELECT cartID FROM sg.LQ_CSS_fnb_cart WHERE clientID = @clientID");

    const cartID = resCart.recordset[0]?.cartID;
    if (!cartID){
      throw new Error("Cart not found for this client");      
    }

    const resItem = await pool.request()
      .input("cartID", sql.Int, cartID)
      .input("productID", sql.Int, productID)
      .input("sizeId", sql.Int, sizeId)
      .query(`
        SELECT cartItemID
        FROM sg.LQ_CSS_fnb_cart_items
        WHERE cartID = @cartID and productID = @productID AND sizeId = @sizeId
        `);

      if (resItem.recordset.length === 0) {
        throw new Error("Item not found in cart");
      }

      await pool.request()
        .input("cartID", sql.Int, cartID)
        .input("productID", sql.Int, productID)
        .input("quantity", sql.Int, quantity)
        .input("sizeId", sql.Int, sizeId)
        .query(`
          UPDATE sg.LQ_CSS_fnb_cart_items
          SET quantity = @quantity
          WHERE cartID = @cartID AND productID = @productID AND sizeId = @sizeId
          `);

      return { message: "Cart item updated successfully" };
  } catch (error) {
    throw new Error(error.message);
  }
};

// ----------------------DELETE-------------------------
// Remove item from cart
export const removeItem = async (clientID, productID) => {
  const pool = await poolPromise;
  await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("productID", sql.Int, productID)
    .query(`
      DELETE FROM sg.LQ_CSS_fnb_cart_items
      WHERE cartID = (SELECT cartID FROM sg.LQ_CSS_fnb_cart WHERE clientID = @clientID)
        AND productID = @productID
    `);
  return true;
};
