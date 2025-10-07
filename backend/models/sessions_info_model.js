import { poolPromise, sql } from "../config/db_config.js";

// Create a new session
export const createSession = async ({ clientID, userName, pin, qrDataUrl, expiresAt }) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("userName", sql.NVarChar, userName)
    .input("pin", sql.NVarChar, pin)
    .input("qrDataUrl", sql.NVarChar, qrDataUrl ?? null)
    .input("expires_at", sql.DateTime, expiresAt)
    .query(`
      INSERT INTO sg.LQ_CSS_sessions_info (clientID, userName, pin, qrDataUrl, expires_at)
      VALUES (@clientID, @userName, @pin, @qrDataUrl, @expires_at);
      SELECT SCOPE_IDENTITY() AS sessionID;
    `);
  return res.recordset?.[0]?.sessionID ?? null;
};

// Get active session
export const getActiveSession = async (userName, pin) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("userName", sql.NVarChar, userName)
    .input("pin", sql.NVarChar, pin)
    .query(`
      SELECT TOP 1 *
      FROM sg.LQ_CSS_sessions_info
      WHERE userName = @userName AND pin = @pin AND expires_at > GETDATE()
      ORDER BY createdAt DESC
    `);
  return res.recordset[0];
};
