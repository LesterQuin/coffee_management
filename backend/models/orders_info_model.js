import { poolPromise, sql } from "../config/db_config.js";

/**
 * Get nested orders for a client (existing)
 */
export const getClientOrders = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`
      SELECT o.orderID, o.status, o.createdAt, o.updatedAt,
             i.productID, i.quantity, i.sizeId, p.productName, p.price
      FROM sg.LQ_CSS_fnb_orders o
      INNER JOIN sg.LQ_CSS_fnb_order_items i ON o.orderID = i.orderID
      LEFT JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
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
      sizeId: row.sizeId,
      price: row.price,
      total: (row.quantity || 0) * (row.price || 0)
    });
  }

  return nestedOrders;
};

/**
 * Place an order (STRICT package-only deduction).
 * Input:
 *   clientID: int
 *   items: [{ productID: int, quantity: int, sizeId: int }]
 *   staffID: optional int (who created the order)
 *
 * Returns { success: true, orderID } or throws / returns { success:false, message }
 */
export const placeOrder = async (clientID, items = [], staffID = null) => {
  if (!clientID) throw new Error("clientID is required");
  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, message: "No items provided" };
  }

  const pool = await poolPromise;
  const trx = pool.transaction();

  try {
    await trx.begin();
    const tReq = trx.request();

    // 1) VALIDATION: ensure each ordered item has enough total quantity in client_package_items
    for (const it of items) {
      const productID = Number(it.productID);
      const qty = Number(it.quantity);

      if (!productID || isNaN(qty) || qty <= 0) {
        await trx.rollback();
        return { success: false, message: "Invalid productID or quantity" };
      }

      const totalRes = await tReq
        .input("clientID", sql.Int, clientID)
        .input("productID", sql.Int, productID)
        .query(`
          SELECT SUM(quantity) AS totalQty
          FROM sg.LQ_CSS_client_package_items
          WHERE clientID = @clientID AND productID = @productID AND quantity > 0
        `);

      const totalQty = (totalRes.recordset[0] && Number(totalRes.recordset[0].totalQty)) || 0;
      if (totalQty < qty) {
        await trx.rollback();
        return { success: false, message: `Not enough package quantity for productID ${productID}` };
      }
    }

    // 2) All validations passed; create order header with status = 3 (Pending)
    const insertOrder = await tReq
      .input("clientID", sql.Int, clientID)
      .input("status", sql.Int, 3) // Pending
      .input("staffID", sql.Int, staffID ?? null)
      .query(`
        INSERT INTO sg.LQ_CSS_fnb_orders (clientID, status, createdAt, updatedAt, staffID)
        VALUES (@clientID, @status, GETDATE(), GETDATE(), @staffID);
        SELECT SCOPE_IDENTITY() AS orderID;
      `);

    const orderID = insertOrder.recordset?.[0]?.orderID;
    if (!orderID) {
      await trx.rollback();
      return { success: false, message: "Failed to create order" };
    }

    // 3) Insert order items and deduct quantities from client_package_items (consume default first)
    for (const it of items) {
      const productID = Number(it.productID);
      const qtyNeeded = Number(it.quantity);
      const sizeId = it.sizeId !== undefined ? Number(it.sizeId) : null;

      // Insert order item
      await tReq
        .input("orderID", sql.Int, orderID)
        .input("productID", sql.Int, productID)
        .input("qty", sql.Decimal(18,2), qtyNeeded)
        .input("sizeId", sql.Int, sizeId)
        .query(`
          INSERT INTO sg.LQ_CSS_fnb_order_items
            (orderID, productID, quantity, sizeId, createdAt)
          VALUES
            (@orderID, @productID, @qty, @sizeId, GETDATE())
        `);

      // Deduct from client_package_items rows (consume isDefault = 1 first then additional)
      let remainingToConsume = qtyNeeded;

      const rowsRes = await tReq
        .input("clientID", sql.Int, clientID)
        .input("productID", sql.Int, productID)
        .query(`
          SELECT clientPackageItemID, quantity
          FROM sg.LQ_CSS_client_package_items
          WHERE clientID = @clientID AND productID = @productID AND quantity > 0
          ORDER BY isDefault DESC, createdAt ASC
        `);

      for (const row of rowsRes.recordset) {
        if (remainingToConsume <= 0) break;

        const available = Number(row.quantity || 0);
        if (available <= 0) continue;

        const take = Math.min(available, remainingToConsume);
        const newQty = available - take;

        // update the client row
        await tReq
          .input("clientPackageItemID", sql.Int, row.clientPackageItemID)
          .input("newQty", sql.Decimal(18,2), newQty)
          .query(`
            UPDATE sg.LQ_CSS_client_package_items
            SET quantity = @newQty
            WHERE clientPackageItemID = @clientPackageItemID
          `);

        remainingToConsume -= take;
      }

      // Sanity check - should be 0 because we validated totals earlier
      if (remainingToConsume > 0) {
        await trx.rollback();
        return { success: false, message: `Unexpected error: could not deduct full quantity for productID ${productID}` };
      }
    }

    // 4) Commit transaction
    await trx.commit();

    return { success: true, orderID };
  } catch (err) {
    try { await trx.rollback(); } catch (e) {}
    console.error("placeOrder transaction failed:", err);
    throw err;
  }
};

/**
 * Update order status (simple)
 */
export const updateOrderStatus = async (orderID, statusId) => {
  const pool = await poolPromise;
  await pool.request()
    .input("orderID", sql.Int, orderID)
    .input("status", sql.Int, statusId)
    .query(`
      UPDATE sg.LQ_CSS_fnb_orders
      SET status = @status, updatedAt = GETDATE()
      WHERE orderID = @orderID
    `);
};
