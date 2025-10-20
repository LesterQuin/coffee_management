// models/tables_model.js
import { poolPromise, sql } from "../config/db_config.js";

// Get all sizes
export const getAllSizes = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT sizeId, size, CreatedAt
    FROM sg.LQ_CSS_product_sizes
    ORDER BY CreatedAt DESC
  `);
  return result.recordset;
};

// Get all roles
export const getAllRoles = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT roledId AS roleId, role, CreatedAt
    FROM sg.LQ_CSS_roles
    ORDER BY CreatedAt DESC
  `);
  return result.recordset;
};

// Get all status
export const getAllStatus = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT statusId, status, CreatedAt
    FROM sg.LQ_CSS_status
    ORDER BY CreatedAt DESC
  `);
  return result.recordset;
};
