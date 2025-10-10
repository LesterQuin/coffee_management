import { poolPromise, sql } from "../config/db_config.js";

// Get all staff members
export const getAllStaff = async () => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .query("SELECT * FROM sg.LQ_CSS_staff_accounts");
  return result.recordset;
};

// Get staff by email
export const getStaffByEmail = async (email) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("email", sql.NVarChar, email)
    .query("SELECT * FROM sg.LQ_CSS_staff_accounts WHERE email = @email AND status = 'Active'");
  return result.recordset[0];
};

// Create a new staff member
export const createStaff = async ({ fullName, email, phone, role, passwordHash }) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("fullName", sql.NVarChar, fullName)
    .input("email", sql.NVarChar, email)
    .input("phone", sql.NVarChar, phone)
    .input("role", sql.NVarChar, role)
    .input("passwordHash", sql.NVarChar, passwordHash)
    .query(`
      INSERT INTO sg.LQ_CSS_staff_accounts (fullName, email, phone, role, passwordHash, status, createdAt, updatedAt)
      VALUES (@fullName, @email, @phone, @role, @passwordHash, 'Active', GETDATE(), GETDATE())
    `);
};

// get id
export const getStaffByID = async (staffID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("staffID", sql.Int, staffID)
    .query("SELECT * FROM sg.LQ_CSS_staff_accounts WHERE staffID = @staffID");
  return res.recordset[0];
};

export const deleteStaffModel = async (staffID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("staffID", sql.Int, staffID)
    .query("DELETE FROM sg.LQ_CSS_staff_accounts WHERE staffID = @staffID");
  return res.rowsAffected[0] > 0;
}