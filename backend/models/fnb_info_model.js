import { poolPromise, sql } from "../config/db_config.js";

// Categories
export const getAllCategories = async () => {
  const pool = await poolPromise;
  const res = await pool.request().query("SELECT * FROM sg.LQ_CSS_fnb_categories ORDER BY categoryName");
  return res.recordset;
};

// Create a new category
export const createCategory = async (category) => {
  const pool = await poolPromise;
  await pool.request()
    .input("categoryName", sql.NVarChar(100), category.categoryName)
    .input("description", sql.NVarChar(255), category.description ?? null)
    .input("image", sql.NVarChar(255), category.image ?? null)
    .query("INSERT INTO sg.LQ_CSS_fnb_categories (categoryName, description, image) VALUES (@categoryName,@description,@image)");
  return true;
};

// Products
export const getAllProducts = async () => {
  const pool = await poolPromise;
  const res = await pool.request().query(`
    SELECT p.productID, p.productName, p.description, p.price, p.size, p.image, p.isAvailable,
           c.categoryName
    FROM sg.LQ_CSS_fnb_products p
    INNER JOIN sg.LQ_CSS_fnb_categories c ON p.categoryID = c.categoryID
  `);
  return res.recordset;
};

// Create a new product
export const createProduct = async (product) => {
  const pool = await poolPromise;
  await pool.request()
    .input("categoryID", sql.Int, product.categoryID)
    .input("productName", sql.NVarChar(150), product.productName)
    .input("description", sql.NVarChar(255), product.description ?? null)
    .input("price", sql.Decimal(18,2), product.price)
    .input("size", sql.NVarChar(50), product.size ?? null)
    .input("image", sql.NVarChar(255), product.image ?? null)
    .input("isAvailable", sql.Bit, product.isAvailable ?? 1)
    .query(`
      INSERT INTO sg.LQ_CSS_fnb_products
      (categoryID, productName, description, price, size, image, isAvailable)
      VALUES (@categoryID,@productName,@description,@price,@size,@image,@isAvailable)
    `);
  return true;
};

// Packages
export const getAllPackages = async () => {
  const pool = await poolPromise;
  const res = await pool.request().query("SELECT * FROM sg.LQ_CSS_fnb_packages ORDER BY createdAt DESC");
  return res.recordset;
};

// Create a new package
export const createPackage = async (pkg) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageName", sql.NVarChar(100), pkg.packageName)
    .input("description", sql.NVarChar(255), pkg.description ?? null)
    .input("totalValue", sql.Decimal(18,2), pkg.totalValue)
    .query("INSERT INTO sg.LQ_CSS_fnb_packages (packageName, description, totalValue) VALUES (@packageName,@description,@totalValue)");
  return true;
};

// Package Items
export const addPackageItem = async (packageID, productID, quantity) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageID", sql.Int, packageID)
    .input("productID", sql.Int, productID)
    .input("quantity", sql.Int, quantity)
    .query("INSERT INTO sg.LQ_CSS_fnb_package_items (packageID, productID, quantity) VALUES (@packageID,@productID,@quantity)");
  return true;
};
