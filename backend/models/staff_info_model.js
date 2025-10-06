// models/staff_info_model.js
import { getPool, sql } from "../config/db_config.js";

export const createStaff = async ({ fullName, email, phone, role, passwordHash }) => {
  const pool = await getPool();
  await pool.request()
    .input("fullName", sql.NVarChar, fullName)
    .input("email", sql.NVarChar, email)
    .input("phone", sql.NVarChar, phone ?? null)
    .input("role", sql.NVarChar, role)
    .input("passwordHash", sql.NVarChar, passwordHash)
    .query("INSERT INTO sg.LQ_CSS_staff_accounts (fullName, email, phone, role, passwordHash) VALUES (@fullName,@email,@phone,@role,@passwordHash)");
  return true;
};

export const getStaffByEmail = async (email) => {
  const pool = await getPool();
  const res = await pool.request()
    .input("email", sql.NVarChar, email)
    .query("SELECT * FROM sg.LQ_CSS_staff_accounts WHERE email = @email AND status = 'Active'");
  return res.recordset[0];
};
