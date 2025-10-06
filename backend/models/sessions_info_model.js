// models/sessions_info_model.js
import { getPool, sql } from "../config/db_config.js";

export const createSession = async ({ clientID, userName, pin, qrDataUrl, expiresAt }) => {
  const pool = await getPool();
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("userName", sql.NVarChar, userName)
    .input("pin", sql.NVarChar, pin)
    .input("qr_code", sql.NVarChar, qrDataUrl ?? null)
    .input("expires_at", sql.DateTime, expiresAt)
    .query(`INSERT INTO sg.LQ_CSS_sessions_info (client_id, user_name, pin, qr_code, is_active, expires_at)
            VALUES (@clientID, @userName, @pin, @qr_code, 1, @expires_at);
            SELECT SCOPE_IDENTITY() AS sessionID;`);
  return res.recordset?.[0]?.sessionID ?? null;
};

export const getActiveSession = async (userName, pin) => {
  const pool = await getPool();
  const res = await pool.request()
    .input("userName", sql.NVarChar, userName)
    .input("pin", sql.NVarChar, pin)
    .query("SELECT TOP 1 * FROM sg.LQ_CSS_sessions_info WHERE user_name = @userName AND pin = @pin AND is_active = 1 AND expires_at > GETDATE() ORDER BY created_at DESC");
  return res.recordset[0];
};
