import { poolPromise, sql } from "../config/db_config.js";

// Return the latest default package row (Decision B: allow multiple rows but use latest)
export const fetchLatestDefaultPackage = async () => {
  const pool = await poolPromise;
  const res = await pool.request()
    .query(`
      SELECT TOP 1 defaultID, packageID, createdAt
      FROM sg.LQ_CSS_default_package
      ORDER BY createdAt DESC, defaultID DESC
    `);
  return res.recordset[0] || null;
};

// Insert a new default_package row (we don't delete old rows; latest one is used)
export const insertDefaultPackageRow = async (packageID) => {
  const pool = await poolPromise;
  const ins = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`
      INSERT INTO sg.LQ_CSS_default_package (packageID, createdAt)
      VALUES (@packageID, GETDATE());
      SELECT SCOPE_IDENTITY() AS defaultID;
    `);
  const defaultID = ins.recordset?.[0]?.defaultID;
  return { defaultID, packageID };
};

// Helper: get package header (name, desc, totalValue)
export const getPackageById = async (packageID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`
      SELECT packageID, packageName, description, totalValue, createdAt, updatedAt
      FROM sg.LQ_CSS_fnb_packages
      WHERE packageID = @packageID
    `);
  return res.recordset[0] || null;
};

// Helper: get package items with optional product details join (basic)
export const getPackageItems = async (packageID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`
      SELECT pi.packageItemID, pi.packageID, pi.productID, pi.quantity
      FROM sg.LQ_CSS_fnb_package_items pi
      WHERE pi.packageID = @packageID
      ORDER BY pi.packageItemID ASC
    `);
  return res.recordset || [];
};
