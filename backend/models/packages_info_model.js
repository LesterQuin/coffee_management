// models/packages_info_model.js
import { getPool, sql } from "../config/db_config.js";

export const createPackage = async (pkg) => {
  const pool = await getPool();
  await pool.request()
    .input("packageName", sql.NVarChar, pkg.packageName)
    .input("description", sql.NVarChar, pkg.description ?? null)
    .input("totalValue", sql.Decimal(18,2), pkg.totalValue)
    .query("INSERT INTO sg.LQ_CSS_fnb_packages (packageName, description, totalValue) VALUES (@packageName,@description,@totalValue)");
  return true;
};

export const addPackageItem = async (packageID, productID, quantity) => {
  const pool = await getPool();
  await pool.request()
    .input("packageID", sql.Int, packageID)
    .input("productID", sql.Int, productID)
    .input("quantity", sql.Int, quantity)
    .query("INSERT INTO sg.LQ_CSS_fnb_package_items (packageID, productID, quantity) VALUES (@packageID,@productID,@quantity)");
  return true;
};
