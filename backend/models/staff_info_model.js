import { poolPromise, sql } from "../config/db_config.js";

// Get all staff members
export const getAllStaff = async () => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .query(`
      SELECT staffID, firstName, middleInitial, lastName, email, phone, role, status, createdAt, updatedAt
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
    .query("SELECT * FROM sg.LQ_CSS_staff_accounts WHERE email = @email AND status = 'Active'");
  return result.recordset[0];
};

// Create a new staff member with status Active
export const createStaff = async ({ firstName, middleInitial, lastName, email, phone, roleId, statusId, passwordHash }) => {
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

  await pool.request()
    .input("firstName", sql.NVarChar, firstName)
    .input("middleInitial", sql.NVarChar, middleInitial)
    .input("lastName", sql.NVarChar, lastName)
    .input("email", sql.NVarChar, email)
    .input("phone", sql.NVarChar, phone)
    .input("roleId", sql.Int, roleId)
    .input("statusId", sql.Int, statusId)
    .input("passwordHash", sql.NVarChar, passwordHash)
    .query(`
      INSERT INTO sg.LQ_CSS_staff_accounts
      (firstName, middleInitial, lastName, email, phone, roleId, statusId, passwordHash, createdAt, updatedAt)
      VALUES
      (@firstName, @middleInitial, @lastName, @email, @phone, @roleId, @statusId, @passwordHash, GETDATE(), GETDATE())
    `);
};

// Get staff by ID
export const getStaffByID = async (staffID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("staffID", sql.Int, staffID)
    .query("SELECT * FROM sg.LQ_CSS_staff_accounts WHERE staffID = @staffID");
  return res.recordset[0];
};

// Delete staff
export const deleteStaffModel = async (staffID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("staffID", sql.Int, staffID)
    .query("DELETE FROM sg.LQ_CSS_staff_accounts WHERE staffID = @staffID");
  return res.rowsAffected[0] > 0;
};

// Update staff with role-based validation
export const updateStaff = async (staff, currentUserRole) => {
  if (!staff.staffID) throw new Error("staffID is required");

  const pool = await poolPromise;

  // Fetch target staff
  const targetRes = await pool.request()
    .input("staffID", sql.Int, staff.staffID)
    .query("SELECT role FROM sg.LQ_CSS_staff_accounts WHERE staffID = @staffID");

  if (!targetRes.recordset[0]) throw new Error("Target staff not found");
  const targetRole = targetRes.recordset[0].role;

  // Role-based restrictions
  if (staff.role || staff.status) {
    if (currentUserRole === "Cashier") {
      throw new Error("Cashier cannot update role or status");
    } else if (currentUserRole === "Admin") {
      if (targetRole !== "Cashier") throw new Error("Admin can only update staff with role Cashier");
      if (staff.role) throw new Error("Admin cannot change role of staff");
    }
    // Super Admin: can update anything
  }

  const request = pool.request().input("staffID", sql.Int, staff.staffID);
  const fields = [];

  // Dynamic updates
  if (staff.role !== undefined) {
    // Validate role exists
    const rolesResult = await pool.request().query("SELECT role FROM sg.LQ_CSS_roles");
    const validRoles = rolesResult.recordset.map(r => r.role);
    if (!validRoles.includes(staff.role)) throw new Error(`Invalid role: ${staff.role}`);
    fields.push("role = @role");
    request.input("role", sql.NVarChar, staff.role);
  }

  if (staff.status !== undefined) {
    fields.push("status = @status");
    request.input("status", sql.NVarChar, staff.status);
  }

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

  if (staff.phone !== undefined) {
    fields.push("phone = @phone");
    request.input("phone", sql.NVarChar, staff.phone);
  }

  if (fields.length === 0) throw new Error("No fields to update");

  fields.push("updatedAt = GETDATE()");
  const query = `UPDATE sg.LQ_CSS_staff_accounts SET ${fields.join(", ")} WHERE staffID = @staffID`;

  const result = await request.query(query);
  return result.rowsAffected[0] > 0;
};
