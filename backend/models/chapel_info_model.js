// models/chapel_info_model.js
import { poolPromise, sql } from "../config/db_config.js";

// Get all chapel rooms
export const getAllChapels = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT chapelID, chapelName, status, description, createdAt, updatedAt 
    FROM sg.LQ_CSS_chapel_rooms
  `);
  return result.recordset;
};

// Get available chapel rooms only
export const getAvailableChapels = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT chapelID, chapelName, status, description 
    FROM sg.LQ_CSS_chapel_rooms 
    WHERE status = 'Active'
  `);
  return result.recordset;
};

// Create a new chapel room
export const createChapel = async (chapelName, description, status= "Available") => {
  const pool = await poolPromise;
  await pool.request()
    .input("chapelName", sql.NVarChar, chapelName)
    .input("description", sql.NVarChar, description ?? null)
    .input("status", sql.NVarChar, status)
    .query(`
      INSERT INTO sg.LQ_CSS_chapel_rooms (chapelName, description, status, createdAt, updatedAt)
      VALUES (@chapelName, @description, @status, GETDATE(), GETDATE())
    `);
  return true;
};

// Update chapel room status via stored procedure
export const setChapelStatus = async (chapelID, status) => {
  const pool = await poolPromise;
  await pool.request()
    .input("chapelID", sql.Int, chapelID)
    .input("status", sql.NVarChar, status)
    .execute("sg.LQ_CSS_chapel_set_status");
  return true;
};
//
export const updateChapel = async (chapelID, chapelName, description, status) => {
  const pool = await poolPromise;

  const updates =[];
  if ( chapelName !== undefined) updates.push("chapelName = @chapelName");
  if ( description !== undefined) updates.push("description = @description");
  if ( status !== undefined) updates.push("status = @status");

  if (updates.length === 0) return false;

  const query = `
    UPDATE sg.LQ_CSS_chapel_rooms
    SET ${updates.join(", ")}, updatedAt = GETDATE()
    WHERE chapelID = @chapelID
  `;

  const request = pool.request().input("chapelID", sql.Int, chapelID);

  if (chapelName !== undefined) request.input("chapelName", sql.NVarChar, chapelName);
  if (description !== undefined) request.input("description", sql.NVarChar, description);
  if (status !== undefined) request.input("status", sql.NVarChar, status);  

  try {
  const result = await request.query(query);
  return result.rowsAffected[0] > 0;
  } catch (err) {      
    console.error("DB update error:", err);
    throw err;
  }
};

// Delete
export const deleteChapel = async (chapelID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("chapelID", sql.Int, chapelID)
    .query("DELETE FROM sg.LQ_CSS_chapel_rooms WHERE chapelID = @chapelID");
  return res.rowsAffected[0] > 0;
};

// get id chapel by packages
export const getPackageByChapel = async (chapelID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("chapelID", sql.Int, chapelID)
    .query("SELECT * FROM sg.LQ_CSS_packages WHERE chapelID = @chapelID");
  return result.recordset;
};