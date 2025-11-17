// models/tables_model.js
import { poolPromise, sql } from "../config/db_config.js";

// ----------------------SIZES-------------------------
export const getAllSizes = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT sizeId, size, CreatedAt
    FROM sg.LQ_CSS_product_sizes
    ORDER BY CreatedAt DESC
  `);
  return result.recordset;
};

export const addSize = async (size) => {
  if (!size || size.trim() === "") throw new Error("Size is required");
  const pool = await poolPromise;
  const result = await pool.request()
    .input("size", sql.NVarChar(50), size.trim())
    .query(`
      INSERT INTO sg.LQ_CSS_product_sizes (size, CreatedAt)
      VALUES (@size, GETDATE());
      SELECT SCOPE_IDENTITY() AS sizeId;
    `);
  return result.recordset[0];
};

export const updateSize = async (sizeId, size) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("sizeId", sql.Int, sizeId)
    .input("size", sql.NVarChar(50), size)
    .query(`
      UPDATE sg.LQ_CSS_product_sizes
      SET size = @size
      WHERE sizeId = @sizeId
    `);
  return result.rowsAffected[0] > 0;
};

export const deleteSize = async (sizeId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("sizeId", sql.Int, sizeId)
    .query(`
      DELETE FROM sg.LQ_CSS_product_sizes
      WHERE sizeId = @sizeId
    `);
  return result.rowsAffected[0] > 0;
};

// ----------------------ROLES-------------------------
export const getAllRoles = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT roledId AS roleId, role, CreatedAt
    FROM sg.LQ_CSS_roles
    ORDER BY CreatedAt DESC
  `);
  return result.recordset;
};

export const addRole = async (role) => {
  if (!role || role.trim() === "") throw new Error("Role is required");
  const pool = await poolPromise;
  const result = await pool.request()
    .input("role", sql.NVarChar(50), role.trim())
    .query(`
      INSERT INTO sg.LQ_CSS_roles (role, CreatedAt)
      VALUES (@role, GETDATE());
      SELECT SCOPE_IDENTITY() AS roleId;
    `);
  return result.recordset[0];
};

export const updateRole = async (roleId, role) => {
  if (!role || role.trim() === "") throw new Error("Role is required");
  const pool = await poolPromise;
  const result = await pool.request()
    .input("roleId", sql.Int, roleId)
    .input("role", sql.NVarChar(50), role.trim())
    .query(`
      UPDATE sg.LQ_CSS_roles
      SET role = @role
      WHERE roledId = @roleId
    `);
  return result.rowsAffected[0] > 0;
};

export const deleteRole = async (roleId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("roleId", sql.Int, roleId)
    .query(`
      DELETE FROM sg.LQ_CSS_roles
      WHERE roledId = @roleId
    `);
  return result.rowsAffected[0] > 0;
};

// ----------------------STATUS-------------------------
export const getAllStatus = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT statusId, status, CreatedAt
    FROM sg.LQ_CSS_status
    ORDER BY CreatedAt DESC
  `);
  return result.recordset;
};

export const addStatus = async (status) => {
  if (!status || status.trim() === "") throw new Error("Status is required");
  const pool = await poolPromise;
  const result = await pool.request()
    .input("status", sql.NVarChar(50), status.trim())
    .query(`
      INSERT INTO sg.LQ_CSS_status (status, CreatedAt)
      VALUES (@status, GETDATE());
      SELECT SCOPE_IDENTITY() AS statusId;
    `);
  return result.recordset[0];
};

export const updateStatus = async (statusId, status) => {
  if (!status || status.trim() === "") throw new Error("Status is required");
  const pool = await poolPromise;
  const result = await pool.request()
    .input("statusId", sql.Int, statusId)
    .input("status", sql.NVarChar(50), status.trim())
    .query(`
      UPDATE sg.LQ_CSS_status
      SET status = @status
      WHERE statusId = @statusId
    `);
  return result.rowsAffected[0] > 0;
};

export const deleteStatus = async (statusId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("statusId", sql.Int, statusId)
    .query(`
      DELETE FROM sg.LQ_CSS_status
      WHERE statusId = @statusId
    `);
  return result.rowsAffected[0] > 0;
};
