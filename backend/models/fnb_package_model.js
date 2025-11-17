// models/fnb_package_model.js
import { poolPromise, sql } from "../config/db_config.js";

// -------------------- Fetch Client + Package by PIN --------------------
export const getClientPackageByPin = async (pin) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("pin", sql.NVarChar(50), pin)
    .query(`
      SELECT 
          c.clientID,
          c.deceasedName,
          c.registeredBy,
          c.mobileNo,
          c.email,
          c.address,
          c.schedule_from,
          c.schedule_to,
          c.packageNo,
          c.pin,
          s.sessionID,
          s.qrDataUrl,
          s.expires_at,
          p.packageName,
          p.description AS packageDescription,
          p.totalValue
      FROM sg.LQ_CSS_client_info c
      LEFT JOIN sg.LQ_CSS_sessions_info s ON c.clientID = s.clientID
      LEFT JOIN sg.LQ_CSS_fnb_packages p ON c.packageNo = p.packageID
      WHERE c.pin = @pin
    `);

  return result.recordset[0] || null;
};

// -------------------- Fetch Menu Items for a Package --------------------
// export const getMenuByPackage = async (packageID) => {
//   const pool = await poolPromise;

//   const result = await pool.request()
//     .input("packageID", sql.Int, packageID)
//     .query(`
//       SELECT 
//           i.packageItemID,
//           i.packageID,
//           i.productID,
//           i.quantity,
//           p.productName,
//           p.price,
//           c.categoryName
//       FROM sg.LQ_CSS_fnb_package_items i
//       INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
//       LEFT JOIN sg.LQ_CSS_fnb_categories c ON p.categoryID = c.categoryID
//       WHERE i.packageID = @packageID
//     `);

//   return result.recordset;
// };
export const getMenuByPackage = async (packageID) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`
      SELECT 
          i.packageItemID,
          i.packageID,
          i.productID,
          i.quantity,
          p.productName,
          p.price,
          p.sizeId,
          c.categoryName
      FROM sg.LQ_CSS_fnb_package_items i
      INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
      LEFT JOIN sg.LQ_CSS_product_sizes s ON p.sizeId = s.sizeId
      LEFT JOIN sg.LQ_CSS_fnb_categories c ON p.categoryID = c.categoryID
      WHERE i.packageID = @packageID
    `);

  const formatted = result.recordset.map(item => ({
    packageItemID: item.packageItemID,
    packageID: item.packageID,
    quantity: item.quantity,
    productInfo: {
      productID: item.productID,
      productName: item.productName,
      price: item.price,
      sizeInfo: {
        size: item.size,
        sizeId: item.sizeId
      },
      categoryInfo: {
        categoryName: item.categoryName
      }
    }
  }));

  return formatted;
};
