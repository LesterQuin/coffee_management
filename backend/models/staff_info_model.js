import { poolPromise, sql } from "../config/db_config.js";

// ----------------------GET-------------------------
// Get all staff members
export const getAllStaff = async () => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .query(`
      SELECT staffID, firstName, middleInitial, lastName, email, roleId, statusId, createdAt, updatedAt, passwordHash
      FROM sg.LQ_CSS_staff_accounts
    `);
  return result.recordset;
};

// Get staff by email
export const getStaffByEmail = async (email) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("email", sql.NVarChar, email)
    .query(`
      SELECT s.staffID, s.firstName, s.middleInitial, s.lastName, s.email, s.phone,
             r.role AS role, st.status AS status, s.passwordHash, s.createdAt, s.updatedAt
      FROM sg.LQ_CSS_staff_accounts s
      INNER JOIN sg.LQ_CSS_roles r ON s.roleId = r.roledId
      INNER JOIN sg.LQ_CSS_status st ON s.statusId = st.statusId
      WHERE s.email = @email AND st.status = 'Active'
    `);
  return result.recordset[0];
};

// Get staff by ID
export const getStaffByID = async (staffID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("staffID", sql.Int, staffID)
    .query("SELECT * FROM sg.LQ_CSS_staff_accounts WHERE staffID = @staffID");
  return res.recordset[0];
};

// ----------------------POST-------------------------
// Create a new staff member
export const createStaff = async ({
  firstName,
  middleInitial,
  lastName,
  email,
  phone,
  roleId,
  statusId,
  passwordHash,
  refreshToken
}) => {
  const pool = await poolPromise;

  // Validate roleId exists
  const roleRes = await pool.request()
    .input("roleId", sql.Int, roleId)
    .query("SELECT roledId FROM sg.LQ_CSS_roles WHERE roledId = @roleId");
  if (!roleRes.recordset[0]) throw new Error(`Invalid roleId: ${roleId}`);

  // Validate statusId exists
  const statusRes = await pool.request()
    .input("statusId", sql.Int, statusId)
    .query("SELECT statusId FROM sg.LQ_CSS_status WHERE statusId = @statusId");
  if (!statusRes.recordset[0]) throw new Error(`Invalid statusId: ${statusId}`);

  // Insert staff into database
  const result = await pool.request()
    .input("firstName", sql.NVarChar, firstName)
    .input("middleInitial", sql.NVarChar, middleInitial)
    .input("lastName", sql.NVarChar, lastName)
    .input("email", sql.NVarChar, email)
    .input("phone", sql.NVarChar, phone)
    .input("roleId", sql.Int, roleId)
    .input("statusId", sql.Int, statusId)
    .input("passwordHash", sql.NVarChar, passwordHash)
    .input("refreshToken", sql.NVarChar, refreshToken)
    .query(`
      INSERT INTO sg.LQ_CSS_staff_accounts
      (firstName, middleInitial, lastName, email, phone, roleId, statusId, passwordHash, refreshToken, createdAt, updatedAt)
      OUTPUT inserted.*
      VALUES
      (@firstName, @middleInitial, @lastName, @email, @phone, @roleId, @statusId, @passwordHash, @refreshToken, GETDATE(), GETDATE())
    `);

  return result.recordset[0]; // return inserted staff
};

// ----------------------PUT-------------------------
// Update staff dynamically
export const updateStaff = async (staff) => {
  if (!staff.staffID) throw new Error("staffID is required");

  const pool = await poolPromise;
  const request = pool.request().input("staffID", sql.Int, staff.staffID);
  const fields = [];

  // Update names, email
  if (staff.firstName !== undefined) {
    fields.push("firstName = @firstName");
    request.input("firstName", sql.NVarChar, staff.firstName);
  }
  if (staff.middleInitial !== undefined) {
    fields.push("middleInitial = @middleInitial");
    request.input("middleInitial", sql.NVarChar, staff.middleInitial);
  }
  if (staff.lastName !== undefined) {
    fields.push("lastName = @lastName");
    request.input("lastName", sql.NVarChar, staff.lastName);
  }
  if (staff.email !== undefined) {
    fields.push("email = @email");
    request.input("email", sql.NVarChar, staff.email);
  }

  // Update roleId
  if (staff.roleId !== undefined) {
    const roleRes = await pool.request()
      .input("roleId", sql.Int, staff.roleId)
      .query("SELECT roledId FROM sg.LQ_CSS_roles WHERE roledId=@roleId");
    if (!roleRes.recordset[0]) throw new Error(`Invalid roleId: ${staff.roleId}`);
    fields.push("roleId = @roleId");
    request.input("roleId", sql.Int, staff.roleId);
  }

  // Update statusId
  if (staff.statusId !== undefined) {
    const statusRes = await pool.request()
      .input("statusId", sql.Int, staff.statusId)
      .query("SELECT statusId FROM sg.LQ_CSS_status WHERE statusId=@statusId");
    if (!statusRes.recordset[0]) throw new Error(`Invalid statusId: ${staff.statusId}`);
    fields.push("statusId = @statusId");
    request.input("statusId", sql.Int, staff.statusId);
  }

  if (fields.length === 0) throw new Error("No fields to update");

  // Always update updatedAt
  fields.push("updatedAt = GETDATE()");

  const query = `UPDATE sg.LQ_CSS_staff_accounts SET ${fields.join(", ")} WHERE staffID = @staffID`;
  const result = await request.query(query);

  return result.rowsAffected[0] > 0;
};

// ----------------------DELETE-------------------------
// Delete staff
export const deleteStaffModel = async (staffID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("staffID", sql.Int, staffID)
    .query("DELETE FROM sg.LQ_CSS_staff_accounts WHERE staffID = @staffID");
  return res.rowsAffected[0] > 0;
};

export const updateStaffToken = async (staffID, newToken) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("staffID", sql.Int, staffID)
    .input("newToken", sql.NVarChar, newToken)
    .query(`
      UPDATE sg.LQ_CSS_staff_accounts
      SET refreshToken = @newToken, updatedAt = GETDATE()
      OUTPUT inserted.staffID, inserted.firstName, inserted.middleInitial, inserted.lastName,
             inserted.email, inserted.phone, inserted.roleId, inserted.statusId, inserted.refreshToken
      WHERE staffID = @staffID
    `);

  const updatedStaff = result.recordset[0];

  // Join role and status names
  const joinedResult = await pool.request()
    .input("staffID", sql.Int, staffID)
    .query(`
      SELECT s.staffID, s.firstName, s.middleInitial, s.lastName, s.email, s.phone,
             r.role AS role,
             st.status AS status,
             s.refreshToken
      FROM sg.LQ_CSS_staff_accounts s
      INNER JOIN sg.LQ_CSS_roles r ON s.roleId = r.roledId
      INNER JOIN sg.LQ_CSS_status st ON s.statusId = st.statusId
      WHERE s.staffID = @staffID
    `);

  return joinedResult.recordset[0];
};
