import { poolPromise, sql } from "../config/db_config.js";

const ReportsModel = {
  getOrderStatistics: async ({ chapelID, startDate, endDate }) => {
    const pool = await poolPromise;
    const request = pool.request();
    let whereClause = "WHERE 1=1";

    // 🔹 Filters
    if (chapelID) {
      whereClause += " AND c.chapelID = @chapelID";
      request.input("chapelID", sql.Int, chapelID);
    }

    if (startDate && endDate) {
      whereClause += " AND o.createdAt BETWEEN @startDate AND @endDate";
      request.input("startDate", sql.DateTime, startDate);
      request.input("endDate", sql.DateTime, endDate);
    }

    // 🔹 Main query
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

    // 🔹 Group by chapel
    const groupedByChapel = {};
    for (const row of rows) {
      if (!groupedByChapel[row.chapelName]) groupedByChapel[row.chapelName] = [];
      groupedByChapel[row.chapelName].push(row);
    }

    // 🔹 Top 3 products per chapel
    const top3PerChapel = Object.entries(groupedByChapel).map(([chapelName, items]) => ({
      chapelName,
      topProducts: items.slice(0, 3).map(p => ({
        productName: p.productName,
        totalQuantity: p.totalQuantity,
        totalSales: p.totalSales,
      })),
    }));

    // 🔹 Overall best and least ordered products
    const sorted = [...rows].sort((a, b) => b.totalQuantity - a.totalQuantity);
    const overallMost = sorted[0] || null;
    const overallLeast = sorted.length ? sorted[sorted.length - 1] : null;

    return {
      perChapel: top3PerChapel,
      overallMost,
      overallLeast,
    };
  },
};

export default ReportsModel;
