// models/products_info_model.js
import { poolPromise, sql } from "../config/db_config.js";

export const getCategories = async () => {
  const pool = await poolPromise;
  const res = await pool.request().query("SELECT * FROM sg.LQ_CSS_fnb_categories");
  return res.recordset;
};

export const createCategory = async (name, description, image) => {
  const pool = await poolPromise;
  await pool.request()
    .input("name", sql.NVarChar, name)
    .input("description", sql.NVarChar, description ?? null)
    .input("image", sql.NVarChar, image ?? null)
    .query("INSERT INTO sg.LQ_CSS_fnb_categories (categoryName, description, image) VALUES (@name,@description,@image)");
  return true;
};

export const createProduct = async (p) => {
  const pool = await poolPromise;
  await pool.request()
    .input("categoryID", sql.Int, p.categoryID)
    .input("productName", sql.NVarChar, p.productName)
    .input("description", sql.NVarChar, p.description ?? null)
    .input("price", sql.Decimal(18,2), p.price)
    .input("size", sql.NVarChar, p.size ?? null)
    .input("image", sql.NVarChar, p.image ?? null)
    .input("isAvailable", sql.Bit, p.isAvailable ?? 1)
    .query(`INSERT INTO sg.LQ_CSS_fnb_products
            (categoryID, productName, description, price, size, image, isAvailable)
            VALUES (@categoryID,@productName,@description,@price,@size,@image,@isAvailable)`);
  return true;
};

export const getProducts = async () => {
  const pool = await poolPromise;
  const res = await pool.request().query("SELECT * FROM sg.LQ_CSS_fnb_products");
  return res.recordset;
};
