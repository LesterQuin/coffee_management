import { poolPromise, sql } from "../config/db_config.js";

export const getAllStaff = async () => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .query("SELECT * FROM sg.LQ_CSS_staff_accounts");
  return result.recordset;
};

export const getStaffByEmail = async (email) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("email", sql.NVarChar, email)
    .query("SELECT * FROM sg.LQ_CSS_staff_accounts WHERE email = @email AND status = 'Active'");
  return result.recordset[0];
};

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
