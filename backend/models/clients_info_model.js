// models/clients_info_model.js
import { poolPromise, sql } from "../config/db_config.js";
import QRCode from "qrcode";
import { createSession } from "./sessions_info_model.js";

/**
 * Phone validation (Option B)
 * - Mobile PH: ^09\d{9}$  (11 digits)
 * - Landline PH: ^0\d{1,3}-\d{3,4}-\d{4}$
 * Accepts either pattern.
 */
const isValidPhone = (phone) => {
  if (typeof phone !== "string") return false;
  const trimmed = phone.trim();
  const mobileRegex = /^09\d{9}$/;
  const landlineRegex = /^0\d{1,3}-\d{3,4}-\d{4}$/;
  return mobileRegex.test(trimmed) || landlineRegex.test(trimmed);
};

// Helper to map DB row fields to camelCase (if needed later)
const mapClientRow = (r) => ({
  clientID: r.clientID,
  deceasedName: r.deceasedName,
  registeredBy: r.registeredBy,
  mobileNo: r.mobileNo,
  email: r.email,
  scheduleFrom: r.scheduleFrom,
  scheduleTo: r.scheduleTo,
  chapelName: r.chapelName,
  packageName: r.packageName,
  pin: r.pin,
  packageBalance: r.packageBalance,
  additionalBalance: r.additionalBalance,
  contactPersonName: r.contactPersonName,
  contactPersonNumber: r.contactPersonNumber,
  status: r.status,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  qrDataUrl: r.qrDataUrl,
  sessionExpires: r.sessionExpires,
});

// Get all client information
export const getAllClient = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT 
      c.clientID,
      c.deceasedName,
      c.registeredBy,
      c.mobileNo,
      c.email,
      CONVERT(varchar(19), c.schedule_from, 120) AS scheduleFrom,
      CONVERT(varchar(19), c.schedule_to, 120) AS scheduleTo,
      ISNULL(cr.chapelName, 'No Chapel Assigned') AS chapelName,
      ISNULL(fp.packageName, 'No Package Assigned') AS packageName,
      c.pin,
      c.packageBalance,
      c.additionalBalance,
      ISNULL(c.contactPersonName, '') AS contactPersonName,
      ISNULL(c.contactPersonNumber, '') AS contactPersonNumber,
      c.status,
      c.createdAt,
      c.updatedAt,
      s.qrDataUrl,
      s.expires_at AS sessionExpires
    FROM sg.LQ_CSS_client_info AS c
    LEFT JOIN sg.LQ_CSS_chapel_rooms AS cr ON c.chapelID = cr.chapelID
    LEFT JOIN sg.LQ_CSS_fnb_packages AS fp ON c.packageNo = fp.packageID
    LEFT JOIN (
      SELECT clientID, qrDataUrl, expires_at
      FROM sg.LQ_CSS_sessions_info
      WHERE expires_at > GETDATE()
    ) AS s ON c.clientID = s.clientID
    ORDER BY c.createdAt DESC;
  `);

  return result.recordset.map(mapClientRow);
};

// get client by ID
export const getClientById = async (clientID) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`
      SELECT 
        c.clientID,
        c.deceasedName,
        c.registeredBy,
        c.mobileNo,
        c.email,
        CONVERT(varchar(19), c.schedule_from, 120) AS scheduleFrom,
        CONVERT(varchar(19), c.schedule_to, 120) AS scheduleTo,
        ISNULL(cr.chapelName, 'No Chapel Assigned') AS chapelName,
        ISNULL(fp.packageName, 'No Package Assigned') AS packageName,
        c.pin,
        c.packageBalance,
        c.additionalBalance,
        ISNULL(c.contactPersonName, '') AS contactPersonName,
        ISNULL(c.contactPersonNumber, '') AS contactPersonNumber,
        c.status,
        c.createdAt,
        c.updatedAt,
        s.qrDataUrl,         
        s.expires_at AS sessionExpires
      FROM sg.LQ_CSS_client_info AS c
      LEFT JOIN sg.LQ_CSS_chapel_rooms AS cr ON c.chapelID = cr.chapelID
      LEFT JOIN sg.LQ_CSS_fnb_packages AS fp ON c.packageNo = fp.packageID
      LEFT JOIN (
        SELECT clientID, qrDataUrl, expires_at
        FROM sg.LQ_CSS_sessions_info
        WHERE expires_at > GETDATE()
      ) AS s ON c.clientID = s.clientID
      WHERE c.clientID = @clientID
    `);

  const row = result.recordset[0];
  return row ? mapClientRow(row) : null;
};

// get client by PIN (used by client login)
export const getClientByPin = async (pin) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("pin", sql.NVarChar(20), pin)
    .query(`
      SELECT TOP 1 *
      FROM sg.LQ_CSS_client_info
      WHERE pin = @pin
    `);

  return result.recordset[0] || null;
};

// Delete client by ID (hard delete chain: delete sessions then client)
export const deleteClient = async (clientID) => {
  const pool = await poolPromise;

  // Delete sessions first (to avoid FK constraint issues)
  await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`DELETE FROM sg.LQ_CSS_sessions_info WHERE clientID = @clientID`);

  // Then delete client
  const result = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`DELETE FROM sg.LQ_CSS_client_info WHERE clientID = @clientID`);

  return result.rowsAffected[0] > 0;
};

// Register a new client and generate QR + session
export const registerClientWithQR = async (client, userName) => {
  const pool = await poolPromise;

  // Required fields validation (STRICT)
  if (!client.contactPersonName || String(client.contactPersonName).trim() === "") {
    throw new Error("Contact Person is required");
  }
  if (!client.contactPersonNumber || String(client.contactPersonNumber).trim() === "") {
    throw new Error("Contact Person Number is required");
  }
  // Validate phone per Option B
  if (!isValidPhone(String(client.contactPersonNumber))) {
    throw new Error("Invalid contactPersonNumber format");
  }

  // Generate a random 6-digit PIN
  const pin = Math.floor(100000 + Math.random() * 900000).toString();

  // Insert the client (parameterized)
  await pool.request()
    .input("deceasedName", sql.NVarChar(150), client.deceasedName)
    .input("registeredBy", sql.NVarChar(150), client.registeredBy)
    .input("mobileNo", sql.NVarChar(20), client.mobileNo)
    .input("email", sql.NVarChar(150), client.email ?? null)
    .input("scheduleFrom", sql.DateTime, client.scheduleFrom)
    .input("scheduleTo", sql.DateTime, client.scheduleTo)
    .input("chapelID", sql.Int, client.chapelID)
    .input("packageNo", sql.Int, client.packageNo ?? null)
    .input("pin", sql.NVarChar(10), pin)
    .input("packageBalance", sql.Decimal(18,2), client.packageBalance ?? 0)
    .input("additionalBalance", sql.Decimal(18,2), client.additionalBalance ?? 0)
    .input("contactPersonName", sql.NVarChar(150), client.contactPersonName)
    .input("contactPersonNumber", sql.NVarChar(50), client.contactPersonNumber)
    .query(`
      INSERT INTO sg.LQ_CSS_client_info
      (deceasedName, registeredBy, mobileNo, email, schedule_from, schedule_to, chapelID, packageNo, pin, packageBalance, additionalBalance, contactPersonName, contactPersonNumber, status, createdAt, updatedAt)
      VALUES
      (@deceasedName, @registeredBy, @mobileNo, @email, @scheduleFrom, @scheduleTo, @chapelID, @packageNo, @pin, @packageBalance, @additionalBalance, @contactPersonName, @contactPersonNumber, 'Active', GETDATE(), GETDATE());
    `);

  // Get last inserted clientID
  const result = await pool.request()
    .query("SELECT TOP 1 clientID FROM sg.LQ_CSS_client_info ORDER BY clientID DESC");
  const clientID = result.recordset?.[0]?.clientID;
  if (!clientID) throw new Error("Failed to register client in database");

  // QR payload (unchanged)
  const qrPayload = {
    pin,
    chapelID: client.chapelID,
    chapelName: client.chapelName ?? null,
    packageNo: client.packageNo,
    packageName: client.packageName ?? null,
    deceasedName: client.deceasedName
  };

  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload));

  const sessionID = await createSession({
    clientID,
    userName,
    pin,
    qrDataUrl,
    expiresAt: new Date(Date.now() + 7*24*60*60*1000),
  });

  return { clientID, pin, qrDataUrl, sessionID };
};

// Update client information
export const updateClient = async (client) => {
  if (!client.clientID) throw new Error("clientID is required for update");

  const pool = await poolPromise;
  const request = pool.request().input("clientID", sql.Int, client.clientID);

  // Map of allowed fields and their SQL types
  const fieldsMap = {
    deceasedName: sql.NVarChar(150),
    registeredBy: sql.NVarChar(150),
    mobileNo: sql.NVarChar(20),
    email: sql.NVarChar(150),
    scheduleFrom: sql.DateTime,
    scheduleTo: sql.DateTime,
    chapelID: sql.Int,
    packageNo: sql.Int,
    pin: sql.NVarChar(10),
    packageBalance: sql.Decimal(18, 2),
    additionalBalance: sql.Decimal(18, 2),
    status: sql.NVarChar(50),
    contactPersonName: sql.NVarChar(150),
    contactPersonNumber: sql.NVarChar(50),
  };

  const fields = [];

  for (const [key, type] of Object.entries(fieldsMap)) {
    if (client[key] !== undefined) {
      // Optional: validate phone only if updating contactPersonNumber
      if (key === "contactPersonNumber") {
        const phonePattern = /^(\d{2}-\d{4}-\d{4}|09\d{9})$/;
        if (!phonePattern.test(client[key])) {
          throw new Error("Invalid contactPersonNumber format");
        }
      }

      const value =
        type === sql.Decimal(18, 2) ? Number(client[key]) || 0 : client[key];
      fields.push(`${key}${key === "scheduleFrom" || key === "scheduleTo" ? " = @" + key : " = @" + key}`);
      request.input(key, type, value);
    }
  }

  if (fields.length === 0) throw new Error("No fields provided to update");

  // Always update updatedAt
  fields.push("updatedAt = GETDATE()");

  const query = `
    UPDATE sg.LQ_CSS_client_info
    SET ${fields.join(", ")}
    WHERE clientID = @clientID
  `;

  const result = await request.query(query);
  return result.rowsAffected[0] > 0;
};

// Raise client balance (adds amount to either packageBalance or additionalBalance)
export const raiseBalance = async (clientID, amount, type = "package") => {
  if (!clientID || isNaN(parseInt(clientID, 10))) throw new Error("Invalid clientID");
  const pool = await poolPromise;
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) throw new Error("Invalid amount");

  const field = type === "additional" ? "additionalBalance" : "packageBalance";

  const result = await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("amount", sql.Decimal(18,2), numericAmount)
    .query(`
      UPDATE sg.LQ_CSS_client_info
      SET ${field} = ISNULL(${field}, 0) + @amount, updatedAt = GETDATE()
      WHERE clientID = @clientID
    `);

  return result.rowsAffected[0] > 0;
};
