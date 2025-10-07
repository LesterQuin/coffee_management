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
    WHERE status = 'Available'
  `);
  return result.recordset;
};

// Create a new chapel room
export const createChapel = async (chapelName, description) => {
  const pool = await poolPromise;
  await pool.request()
    .input("chapelName", sql.NVarChar, chapelName)
    .input("description", sql.NVarChar, description ?? null)
    .query(`
      INSERT INTO sg.LQ_CSS_chapel_rooms (chapelName, description)
      VALUES (@chapelName, @description)
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
