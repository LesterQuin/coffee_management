import { poolPromise, sql } from "../config/db_config.js"; // path relative to scripts
import bcrypt from "bcryptjs";

const createSuperAdmin = async () => {
  try {
    const pool = await poolPromise;

    const email = "superadmin@gmail.com";
    const password = "SuperAdmin";
    const firstName = "Super";
    const middleInitial = "A";
    const lastName = "Admin";
    const phone = "09170000000";
    const role = "Super Admin";

    // Check if Super Admin already exists
    const existing = await pool.request()
      .input("email", sql.NVarChar, email)
      .query("SELECT * FROM sg.LQ_CSS_staff_accounts WHERE email = @email");

    if (existing.recordset.length > 0) {
      console.log("ℹ️ Super Admin already exists, skipping creation.");
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.request()
      .input("email", sql.NVarChar, email)
      .input("passwordHash", sql.NVarChar, passwordHash)
      .input("firstName", sql.NVarChar, firstName)
      .input("middleInitial", sql.NVarChar, middleInitial)
      .input("lastName", sql.NVarChar, lastName)
      .input("phone", sql.NVarChar, phone)
      .input("role", sql.NVarChar, role)
      .query(`
        INSERT INTO sg.LQ_CSS_staff_accounts 
        (email, passwordHash, firstName, middleInitial, lastName, phone, role, status, createdAt, updatedAt)
        VALUES 
        (@email, @passwordHash, @firstName, @middleInitial, @lastName, @phone, @role, 'Active', GETDATE(), GETDATE())
      `);

    console.log("✅ Super Admin created successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating Super Admin:", err);
    process.exit(1);
  }
};

createSuperAdmin();
