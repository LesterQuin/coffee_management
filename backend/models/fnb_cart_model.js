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

// View all
export const viewAllCarts = async () => {
  const pool = await poolPromise;
  const res = await pool.request()
    .query(`
      SELECT c.cartID, c.clientID, ci.deceasedName, ci.registeredBy AS customerName,
             ci.mobileNo AS customerNumber,
             i.cartItemID, i.productID, i.quantity, i.sizeId, p.productName, p.price,
             (i.quantity * p.price) AS total
      FROM sg.LQ_CSS_fnb_cart c
      INNER JOIN sg.LQ_CSS_client_info ci ON c.clientID = ci.clientID
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
// Add item to cart
export const addItem = async (clientID, productID, quantity, sizeId) => {
  const pool = await poolPromise;

  let res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query("SELECT cartID FROM sg.LQ_CSS_fnb_cart WHERE clientID = @clientID");

  let cartID = res.recordset[0]?.cartID;
  if (!cartID) {
    res = await pool.request()
      .input("clientID", sql.Int, clientID)
      .query("INSERT INTO sg.LQ_CSS_fnb_cart (clientID) VALUES (@clientID); SELECT SCOPE_IDENTITY() AS cartID");
    cartID = res.recordset[0].cartID;
  }

  await pool.request()
    .input("cartID", sql.Int, cartID)
    .input("productID", sql.Int, productID)
    .input("quantity", sql.Int, quantity)
    .input("sizeId", sql.Int, sizeId)
    .query(`
      IF EXISTS (SELECT 1 FROM sg.LQ_CSS_fnb_cart_items WHERE cartID = @cartID AND productID = @productID AND sizeId = @sizeId)
        UPDATE sg.LQ_CSS_fnb_cart_items SET quantity = quantity + @quantity WHERE cartID = @cartID AND productID = @productID AND sizeId = @sizeId
      ELSE
        INSERT INTO sg.LQ_CSS_fnb_cart_items (cartID, productID, quantity, sizeId) VALUES (@cartID, @productID, @quantity, @sizeId)
    `);

  return true;
};

// Checkout cart → create order
export const checkout = async (clientID, paymentType, staffID) => {
  const pool = await poolPromise;

  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("paymentType", sql.NVarChar(20), paymentType)
    .execute("sg.LQ_CSS_fnb_cart_checkout");

  const { orderID, totalAmount } = res.recordset[0];

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
              p.price AS amount, 
              i.sizeId
      FROM sg.LQ_CSS_fnb_order_items i
      INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
      WHERE i.orderID = @orderID
    `);

  const items = itemsRes.recordset;

  const receipt = {
    orderID: orderID,
    deceasedName: client.deceasedName,
    chapel: client.chapelName,
    package: client.packageName,
    orderDateTime: new Date().toISOString(),
    customerName: client.customerName,
    customerNumber: client.customerNumber,
    status: "Pending",
    items,
    total: totalAmount,
    handleByStaffID: staffID // optional only this
  };

  return receipt; // { orderID, totalAmount }
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
