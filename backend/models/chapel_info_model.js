// models/chapel_info_model.js
import { poolPromise, sql } from "../config/db_config.js";

// ----------------------GET-------------------------
// Get all chapel rooms
export const getAllChapels = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT chapelID, chapelName, description, createdAt, updatedAt 
    FROM sg.LQ_CSS_chapel_rooms
  `);
  return result.recordset;
};

// Get available chapel rooms only
// export const getAvailableChapels = async () => {
//   const pool = await poolPromise;
//   const result = await pool.request().query(`
//     SELECT chapelID, chapelName,  description 
//     FROM sg.LQ_CSS_chapel_rooms 
//     WHERE statusId = 'Active'
//   `);
//   return result.recordset;
// };

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
export const createChapel = async (chapelName, description) => {
  const pool = await poolPromise;
  await pool.request()
    .input("chapelName", sql.NVarChar, chapelName)
    .input("description", sql.NVarChar, description ?? null)
    .query(`
      INSERT INTO sg.LQ_CSS_chapel_rooms (chapelName, description, createdAt, updatedAt)
      VALUES (@chapelName, @description, GETDATE(), GETDATE())
    `);
  return true;
};

// ----------------------PUT-------------------------
// // Update chapel
export const updateChapel = async (chapelID, chapelName, description) => {
  if (!chapelID) throw new Error("chapelID is required");

  const pool = await poolPromise;

  const updates = [];
  if (chapelName !== undefined && chapelName !== "") updates.push("chapelName = @chapelName");
  if (description !== undefined && description !== "") updates.push("description = @description");

  if (updates.length === 0) return false;

  const query = `
    UPDATE sg.LQ_CSS_chapel_rooms
    SET ${updates.join(", ")}, updatedAt = GETDATE()
    WHERE chapelID = @chapelID
  `;

  const request = pool.request().input("chapelID", sql.Int, chapelID);

  if (chapelName !== undefined && chapelName !== "") request.input("chapelName", sql.NVarChar, chapelName);
  if (description !== undefined && description !== "") request.input("description", sql.NVarChar, description);

  try {
    const result = await request.query(query);
    return result.rowsAffected[0] > 0;
  } catch (err) {
    console.error(`DB update error for chapelID ${chapelID}:`, err);
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
