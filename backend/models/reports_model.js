import { poolPromise, sql } from "../config/db_config.js";

const ReportsModel = {
  getOrderStatistics: async ({ chapelID, startDate, endDate }) => {
    const pool = await poolPromise;
    let whereClause = "";

    if (chapelID) {
      whereClause += " AND c.chapelID = @chapelID";
    }
    if (startDate && endDate) {
      whereClause += " AND o.createdAt BETWEEN @startDate AND @endDate";
    }

    const request = pool.request();

    if (chapelID) request.input("chapelID", sql.Int, chapelID);
    if (startDate && endDate) {
      request.input("startDate", sql.DateTime, startDate);
      request.input("endDate", sql.DateTime, endDate);
    }

    const query = `
      SELECT 
        c.chapelID,
        c.chapelName,
        p.productName,
        SUM(oi.quantity) AS totalOrders
      FROM sg.LQ_CSS_fnb_order_items oi
      JOIN sg.LQ_CSS_fnb_orders o ON oi.orderID = o.orderID
      JOIN sg.LQ_CSS_client_info ci ON o.clientID = ci.clientID
      JOIN sg.LQ_CSS_chapel_rooms c ON ci.chapelID = c.chapelID
      JOIN sg.LQ_CSS_fnb_products p ON oi.productID = p.productID
      WHERE 1=1 ${whereClause}
      GROUP BY c.chapelID, c.chapelName, p.productName
      ORDER BY c.chapelName, totalOrders DESC;
    `;

    const result = await request.query(query);
    const rows = result.recordset;

    // ✅ Group by chapel
    const groupedByChapel = {};
    for (const row of rows) {
      if (!groupedByChapel[row.chapelName]) groupedByChapel[row.chapelName] = [];
      groupedByChapel[row.chapelName].push(row);
    }

    // ✅ Get top 3 products for each chapel
    const top3PerChapel = Object.entries(groupedByChapel).map(([chapel, items]) => ({
      chapelName: chapel,
      topProducts: items.slice(0, 3),
    }));

    // ✅ Compute overall most & least ordered
    const sorted = [...rows].sort((a, b) => b.totalOrders - a.totalOrders);
    const overallMost = sorted[0] || null;
    const overallLeast = sorted[sorted.length - 1] || null;

    return {
      perChapel: top3PerChapel,
      overallMost,
      overallLeast,
    };
  },
};

export default ReportsModel;
