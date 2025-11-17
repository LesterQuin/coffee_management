// models/chapel_info_model.js
import { poolPromise, sql } from "../config/db_config.js";
import { getPackageByID, getPackageItems } from "./fnb_info_model.js";

// ----------------------GET-------------------------
// Get all chapel rooms
export const getAllChapels = async () => {
  const pool = await poolPromise;
  const chapelsRes = await pool.request().query(`
    SELECT chapelID, chapelName, description, statusId, packageID, createdAt, updatedAt
    FROM sg.LQ_CSS_chapel_rooms
  `);

  const chapels = chapelsRes.recordset;

  for (const chapel of chapels) {
    if (chapel.packageID) {
      const pkg = await getPackageByID(chapel.packageID);
      const items = await getPackageItems(chapel.packageID);
      chapel.package = { ...pkg, items };
    } else {
      chapel.package = null;
    }
  }

  return chapels;
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
// export const getPackageByChapel = async (chapelID) => {
//   const pool = await poolPromise;

//   // 1. Get packageID from chapel
//   const chapelRes = await pool.request()
//     .input("chapelID", sql.Int, chapelID)
//     .query(`
//       SELECT packageID 
//       FROM sg.LQ_CSS_chapel_rooms 
//       WHERE chapelID = @chapelID
//     `);

//   if (chapelRes.recordset.length === 0) return [];

//   const packageID = chapelRes.recordset[0].packageID;

//   // 2. Get default package using packageID
//   const defaultRes = await pool.request()
//     .input("packageID", sql.Int, packageID)
//     .query(`
//       SELECT defaultID, packageID, createdAt
//       FROM sg.LQ_CSS_default_package
//       WHERE packageID = @packageID
//     `);

//   return defaultRes.recordset;
// };

export const listPackagesByChapel = async (chapelID) => {
  const pool = await poolPromise;

  // Step 1: Get the chapel's assigned packageID
  const chapelRes = await pool
    .request()
    .input("chapelID", sql.Int, chapelID)
    .query("SELECT packageID FROM sg.LQ_CSS_chapel_rooms WHERE chapelID = @chapelID");

  if (chapelRes.recordset.length === 0) return [];

  const packageID = chapelRes.recordset[0].packageID;

  // Step 2: Get package info and default info
  const packagesRes = await pool
    .request()
    .input("packageID", sql.Int, packageID)
    .query(`
      SELECT 
        p.packageID,
        p.packageName,
        p.totalValue,
        p.quantity,
        dp.defaultID,
        dp.createdAt
      FROM sg.LQ_CSS_fnb_packages p
      LEFT JOIN sg.LQ_CSS_default_package dp
        ON p.packageID = dp.packageID
      WHERE p.packageID = @packageID
    `);

  return packagesRes.recordset;
};

// ----------------------POST-------------------------
// Create a new chapel room
export const createChapelWithPackage = async (chapelName, description, packageID , statusId) => {
  const pool = await poolPromise;

  let pkg = null;
  let items = [];

  if (packageID) {
    // Verify package exists
    pkg = await getPackageByID(packageID);
    if (!pkg) throw new Error("Package not found");

    // Fetch package items
    items = await getPackageItems(packageID);
  }

  // Insert chapel with packageID
  const res = await pool.request()
    .input("chapelName", sql.NVarChar, chapelName)
    .input("description", sql.NVarChar, description ?? null)
    .input("packageID", sql.Int, packageID ?? null)
    .input("statusId", sql.NVarChar, statusId ?? null)
    .query(`
      INSERT INTO sg.LQ_CSS_chapel_rooms 
        (chapelName, description, createdAt, updatedAt, packageID, statusId)
      VALUES 
        (@chapelName, @description, GETDATE(), GETDATE(), @packageID, @statusId);
      SELECT SCOPE_IDENTITY() AS chapelID;
    `);

  const chapelID = res.recordset[0].chapelID;

  return {
    chapelID,
    chapelName,
    description,
    statusId: statusId ?? null,
    package: pkg ? { ...pkg, items } : null
  };
};

// ----------------------PUT-------------------------
// // Update chapel
export const updateChapel = async (chapelID, chapelName, description, statusId, packageID) => {
  if (!chapelID) throw new Error("chapelID is required");

  const pool = await poolPromise;
  const updates = [];

  if (chapelName !== undefined && chapelName !== "") updates.push("chapelName = @chapelName");
  if (description !== undefined ) updates.push("description = @description");
  if (statusId !== undefined && statusId !== "") updates.push("statusId = @statusId");
  if (packageID !== undefined) updates.push("packageID = @packageID");

  if (updates.length === 0) return false;

  const query = `
    UPDATE sg.LQ_CSS_chapel_rooms
    SET ${updates.join(", ")}, updatedAt = GETDATE()
    WHERE chapelID = @chapelID
  `;

  const request = pool.request().input("chapelID", sql.Int, chapelID);

  if (chapelName !== undefined && chapelName !== "") request.input("chapelName", sql.NVarChar, chapelName);
  if (description !== undefined ) request.input("description", sql.NVarChar, description);
  if (statusId !== undefined && statusId !== "") request.input("statusId", sql.Int, statusId);
  if (packageID !== undefined) request.input("packageID", sql.Int, packageID);

  const result = await request.query(query);
  return result.rowsAffected[0] > 0;
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
