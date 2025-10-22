// models/chapel_info_model.js
import { poolPromise, sql } from "../config/db_config.js";

// ----------------------GET-------------------------
// Get all chapel rooms
export const getAllChapels = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT chapelID, chapelName, statusId, description, createdAt, updatedAt 
    FROM sg.LQ_CSS_chapel_rooms
  `);
  return result.recordset;
};

// Get available chapel rooms only
export const getAvailableChapels = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT chapelID, chapelName, statusId, description 
    FROM sg.LQ_CSS_chapel_rooms 
    WHERE statusId = 'Active'
  `);
  return result.recordset;
};

// Get ID chapel by packages
export const getPackageByChapel = async (chapelID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("chapelID", sql.Int, chapelID)
    .query("SELECT * FROM sg.LQ_CSS_packages WHERE chapelID = @chapelID");
  return result.recordset;
};
// ----------------------POST-------------------------
// Create a new chapel room
export const createChapel = async (chapelName, description, statusId= "Available") => {
  const pool = await poolPromise;
  await pool.request()
    .input("chapelName", sql.NVarChar, chapelName)
    .input("description", sql.NVarChar, description ?? null)
    .input("statusId", sql.NVarChar, statusId)
    .query(`
      INSERT INTO sg.LQ_CSS_chapel_rooms (chapelName, description, statusId, createdAt, updatedAt)
      VALUES (@chapelName, @description, @statusId, GETDATE(), GETDATE())
    `);
  return true;
};

// ----------------------PUT-------------------------
// Update chapel room status via stored procedure
export const setChapelStatus = async (chapelID, statusId) => {
  const pool = await poolPromise;
  await pool.request()
    .input("chapelID", sql.Int, chapelID)
    .input("statusId", sql.NVarChar, statusId)
    .execute("sg.LQ_CSS_chapel_set_statusId");
  return true;
};

// Update chapel
export const updateChapel = async (chapelID, chapelName, description, statusId) => {
  const pool = await poolPromise;

  const updates =[];
  if ( chapelName !== undefined) updates.push("chapelName = @chapelName");
  if ( description !== undefined) updates.push("description = @description");
  if ( statusId !== undefined) updates.push("statusId = @statusId");

  if (updates.length === 0) return false;

  const query = `
    UPDATE sg.LQ_CSS_chapel_rooms
    SET ${updates.join(", ")}, updatedAt = GETDATE()
    WHERE chapelID = @chapelID
  `;

  const request = pool.request().input("chapelID", sql.Int, chapelID);

  if (chapelName !== undefined) request.input("chapelName", sql.NVarChar, chapelName);
  if (description !== undefined) request.input("description", sql.NVarChar, description);
  if (statusId !== undefined) request.input("statusId", sql.NVarChar, statusId);  

  try {
  const result = await request.query(query);
  return result.rowsAffected[0] > 0;
  } catch (err) {      
    console.error("DB update error:", err);
    throw err;
  }
};
// ----------------------DELETE-------------------------
// Delete chapel
export const deleteChapel = async (chapelID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("chapelID", sql.Int, chapelID)
    .query("DELETE FROM sg.LQ_CSS_chapel_rooms WHERE chapelID = @chapelID");
  return res.rowsAffected[0] > 0;
};
