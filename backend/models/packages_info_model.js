// models/packages_info_model.js
import { poolPromise, sql } from "../config/db_config.js";

// Create Packages Item
export const createPackage = async (pkg) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageName", sql.NVarChar(100), pkg.packageName) // cannot be null
    .input("description", sql.NVarChar(255), pkg.description ?? null)
    .input("totalValue", sql.Decimal(18,2), pkg.totalValue ?? 0)
    .query(`INSERT INTO sg.LQ_CSS_fnb_packages (packageName, description, totalValue)
            VALUES (@packageName, @description, @totalValue)`);
  return true;
};

// Add Package Item
export const addPackageItem = async (packageID, productID, quantity) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageID", sql.Int, packageID)
    .input("productID", sql.Int, productID)
    .input("quantity", sql.Int, quantity)
    .query("INSERT INTO sg.LQ_CSS_fnb_package_items (packageID, productID, quantity) VALUES (@packageID,@productID,@quantity)");
  return true;
};
