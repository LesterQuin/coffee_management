import { poolPromise, sql } from "../config/db_config.js";

// ----------------------GET-------------------------
// Get active session
export const getActiveSession = async (userName) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("userName", sql.NVarChar, userName)
    .query(`
      SELECT TOP 1 *
      FROM sg.LQ_CSS_sessions_info
      WHERE userName = @userName AND expires_at > GETDATE()
      ORDER BY createdAt DESC
    `);
  return res.recordset[0] || null;
};

// ----------------------POST-------------------------
// Create a new session
export const createSession = async ({ clientID, userName, pin, qrDataUrl, expiresAt }) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("userName", sql.NVarChar(150), userName ?? null)
    .input("pin", sql.NVarChar(10), pin ?? null)
    .input("qrDataUrl", sql.NVarChar(sql.MAX), qrDataUrl)
    .input("expires_at", sql.DateTime, expiresAt)
    .query(`
      INSERT INTO sg.LQ_CSS_sessions_info (clientID, userName, pin, qrDataUrl, expires_at, createdAt)
      VALUES (@clientID, @userName, @pin, @qrDataUrl, @expires_at, GETDATE());
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS sessionID;
    `);
  return res.recordset?.[0]?.sessionID ?? null;
};

// ----------------------PUT-------------------------

// ----------------------DELETE-------------------------

