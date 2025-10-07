// models/fnb_cart_model.js
import { poolPromise, sql } from "../config/db_config.js";

// Add item to cart
export const addItem = async (clientID, productID, quantity, size) => {
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
    .input("size", sql.NVarChar(50), size)
    .query(`
      IF EXISTS (SELECT 1 FROM sg.LQ_CSS_fnb_cart_items WHERE cartID = @cartID AND productID = @productID AND size = @size)
        UPDATE sg.LQ_CSS_fnb_cart_items SET quantity = quantity + @quantity WHERE cartID = @cartID AND productID = @productID AND size = @size
      ELSE
        INSERT INTO sg.LQ_CSS_fnb_cart_items (cartID, productID, quantity, size) VALUES (@cartID, @productID, @quantity, @size)
    `);

  return true;
};

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

// View cart
export const viewCart = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`
      SELECT i.cartItemID, i.productID, i.quantity, i.size, p.productName, p.price, (i.quantity * p.price) AS total
      FROM sg.LQ_CSS_fnb_cart_items i
      INNER JOIN sg.LQ_CSS_fnb_cart c ON i.cartID = c.cartID
      INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
      WHERE c.clientID = @clientID
    `);
  return res.recordset;
};

// Checkout cart → create order
export const checkout = async (clientID, paymentType) => {
  const pool = await poolPromise;

  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("paymentType", sql.NVarChar(20), paymentType)
    .execute("sg.LQ_CSS_fnb_cart_checkout");

  return res.recordset[0]; // { orderID, totalAmount }
};
