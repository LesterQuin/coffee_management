import { poolPromise, sql } from "../config/db_config.js";

const ReportsModel = {
  // Statistics
  getOrderStatistics: async ({ chapelID, startDate, endDate }) => {
    const pool = await poolPromise;
    const request = pool.request();
    let whereClause = "WHERE 1=1";

    if (chapelID) {
      whereClause += " AND c.chapelID = @chapelID";
      request.input("chapelID", sql.Int, chapelID);
    }

    if (startDate && endDate) {
      whereClause += " AND o.createdAt BETWEEN @startDate AND @endDate";
      request.input("startDate", sql.DateTime, startDate);
      request.input("endDate", sql.DateTime, endDate);
    }

    const query = `
      SELECT 
          c.chapelID,
          c.chapelName,
          p.productID,
          p.productName,
          SUM(oi.quantity) AS totalQuantity,
          SUM(oi.quantity * p.price) AS totalSales
      FROM sg.LQ_CSS_chapel_rooms AS c
      LEFT JOIN sg.LQ_CSS_client_info AS ci ON ci.chapelID = c.chapelID
      LEFT JOIN sg.LQ_CSS_fnb_orders AS o ON o.clientID = ci.clientID
      LEFT JOIN sg.LQ_CSS_fnb_order_items AS oi ON oi.orderID = o.orderID
      LEFT JOIN sg.LQ_CSS_fnb_products AS p ON p.productID = oi.productID
      ${whereClause}
      GROUP BY c.chapelID, c.chapelName, p.productID, p.productName
      ORDER BY c.chapelName, totalQuantity DESC;
    `;

    const result = await request.query(query);
    const rows = result.recordset || [];

    const groupedByChapel = {};
    for (const row of rows) {
      if (!groupedByChapel[row.chapelName]) groupedByChapel[row.chapelName] = [];
      groupedByChapel[row.chapelName].push(row);
    }

    const top3PerChapel = Object.entries(groupedByChapel).map(([chapelName, items]) => ({
      chapelName,
      topProducts: items.slice(0, 3).map(p => ({
        productName: p.productName,
        totalQuantity: p.totalQuantity,
        totalSales: p.totalSales,
      })),
    }));

    const sorted = [...rows].sort((a, b) => b.totalQuantity - a.totalQuantity);
    const overallMost = sorted[0] || null;
    const overallLeast = sorted.length ? sorted[sorted.length - 1] : null;

    return { perChapel: top3PerChapel, overallMost, overallLeast };
  },

  // Session Orders Report
  getSessionOrderReports: async () => {
    const pool = await poolPromise;
    const res = await pool.request().query(`
      SELECT 
          s.sessionID,
          s.clientID,
          s.userName,
          s.role,
          s.createdAt AS sessionCreated,
          o.orderID,
          o.status AS orderStatus,
          o.createdAt AS orderCreated,
          oi.orderItemID,
          p.productName,
          ps.size AS productSize,
          oi.quantity,
          p.price,
          (oi.quantity * p.price) AS totalPrice
      FROM sg.LQ_CSS_sessions_info AS s
      LEFT JOIN sg.LQ_CSS_fnb_orders AS o ON o.sessionID = s.sessionID
      LEFT JOIN sg.LQ_CSS_fnb_order_items AS oi ON oi.orderID = o.orderID
      LEFT JOIN sg.LQ_CSS_fnb_products AS p ON p.productID = oi.productID
      LEFT JOIN sg.LQ_CSS_product_sizes AS ps ON ps.sizeId = p.sizeId
      ORDER BY s.userName, o.createdAt, oi.orderItemID
    `);

    const rows = res.recordset || [];
    const sessionsMap = {};

    for (const row of rows) {
      if (!sessionsMap[row.sessionID]) {
        sessionsMap[row.sessionID] = {
          sessionID: row.sessionID,
          clientID: row.clientID,
          userName: row.userName,
          role: row.role,
          sessionCreated: row.sessionCreated,
          orders: {}
        };
      }

      if (row.orderID) {
        if (!sessionsMap[row.sessionID].orders[row.orderID]) {
          sessionsMap[row.sessionID].orders[row.orderID] = {
            orderID: row.orderID,
            orderStatus: row.orderStatus,
            orderCreated: row.orderCreated,
            items: []
          };
        }

        if (row.orderItemID) {
          sessionsMap[row.sessionID].orders[row.orderID].items.push({
            orderItemID: row.orderItemID,
            productName: row.productName,
            productSize: row.productSize,
            quantity: row.quantity,
            price: row.price,
            totalPrice: row.totalPrice
          });
        }
      }
    }

    return Object.values(sessionsMap).map(session => ({
      ...session,
      orders: Object.values(session.orders)
    }));
  },
};

export default ReportsModel;
