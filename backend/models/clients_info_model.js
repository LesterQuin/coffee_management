// models/clients_info_model.js
import { poolPromise, sql } from "../config/db_config.js";
import QRCode from "qrcode";
import { createSession } from "./sessions_info_model.js";

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
      c.address,
      CONVERT(varchar(19), c.schedule_from, 120) AS scheduleFrom,
      CONVERT(varchar(19), c.schedule_to, 120) AS scheduleTo,
      ISNULL(cr.chapelName, 'No Chapel Assigned') AS chapelName,
      ISNULL(fp.packageName, 'No Package Assigned') AS packageName,
      c.pin,
      c.packageBalance,
      c.additionalBalance,
      c.status,
      c.createdAt,
      c.updatedAt,
      s.qrDataUrl,         -- latest session QR
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

  return result.recordset;
};

// Register a new client and generate QR + session
export const registerClientWithQR = async (client, userName) => {
  const pool = await poolPromise;

  // Generate a random 6-digit PIN
  const pin = Math.floor(100000 + Math.random() * 900000).toString();

  // Insert the client
  await pool.request()
    .input("deceasedName", sql.NVarChar(150), client.deceasedName)
    .input("registeredBy", sql.NVarChar(150), client.registeredBy)
    .input("mobileNo", sql.NVarChar(20), client.mobileNo)
    .input("email", sql.NVarChar(150), client.email ?? null)
    .input("address", sql.NVarChar(250), client.address ?? null)
    .input("scheduleFrom", sql.DateTime, client.scheduleFrom)
    .input("scheduleTo", sql.DateTime, client.scheduleTo)
    .input("chapelID", sql.Int, client.chapelID)
    .input("packageNo", sql.Int, client.packageNo ?? null)
    .input("pin", sql.NVarChar(10), pin)
    .input("packageBalance", sql.Decimal(18,2), client.packageBalance ?? 0)
    .input("additionalBalance", sql.Decimal(18,2), client.additionalBalance ?? 0)
    .query(`
      INSERT INTO sg.LQ_CSS_client_info
      (deceasedName, registeredBy, mobileNo, email, address, schedule_from, schedule_to, chapelID, packageNo, pin, packageBalance, additionalBalance, status, createdAt, updatedAt)
      VALUES
      (@deceasedName, @registeredBy, @mobileNo, @email, @address, @scheduleFrom, @scheduleTo, @chapelID, @packageNo, @pin, @packageBalance, @additionalBalance, 'Active', GETDATE(), GETDATE());
    `);

  // Get last inserted clientID
  const result = await pool.request()
    .query("SELECT TOP 1 clientID FROM sg.LQ_CSS_client_info ORDER BY clientID DESC");
  const clientID = result.recordset?.[0]?.clientID;
  if (!clientID) throw new Error("Failed to register client in database");

  // QR payload including names
  const qrPayload = {
    pin,
    chapelID: client.chapelID,
    chapelName: client.chapelName,       // send name from frontend
    packageNo: client.packageNo,
    packageName: client.packageName,     // send name from frontend
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
