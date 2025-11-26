import { poolPromise, sql } from "../config/db_config.js";

// ----------------------GET-------------------------
// Get active session
export const getActiveSession = async (userName) => {
  try {
    const pool = await poolPromise;
    const res = await pool.request()
      .input("userName", sql.NVarChar(150), userName)
      .query(`
        SELECT TOP 1 *
        FROM sg.LQ_CSS_sessions_info
        WHERE userName = @userName 
          AND expires_at > GETDATE()
        ORDER BY createdAt DESC
      `);
    return res.recordset[0] || null;
  } catch (err) {
    console.error("❌ getActiveSession error:", err);
    throw err;
  }
};

// ----------------------POST-------------------------
// Create a new session
export const createSession = async ({ clientID, userName, pin, qrDataUrl, expiresAt, role = "User" }) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("clientID", sql.Int, clientID)
      .input("userName", sql.NVarChar(150), userName ?? null)
      .input("pin", sql.NVarChar(10), pin ?? null)
      .input("qrDataUrl", sql.NVarChar(sql.MAX), qrDataUrl ?? null)
      .input("expires_at", sql.DateTime, expiresAt)
      .input("role", sql.NVarChar(50), role)
      .query(`
        INSERT INTO sg.LQ_CSS_sessions_info (
          clientID, userName, pin, qrDataUrl, expires_at, createdAt, updatedAt, role
        )
        VALUES (@clientID, @userName, @pin, @qrDataUrl, @expires_at, GETDATE(), GETDATE(), @role);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS sessionID;
      `);
    return result.recordset?.[0]?.sessionID ?? null;
  } catch (err) {
    console.error("❌ createSession error:", err);
    throw err;
  }
};

export const updateGuestToken = async (sessionID, newAccessToken, newRefreshToken) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("sessionID", sql.Int, sessionID)
    .input("newAccessToken", sql.NVarChar, newAccessToken)
    .input("newRefreshToken", sql.NVarChar, newRefreshToken)
    .query(`
      UPDATE sg.LQ_CSS_sessions_info
      SET accessToken = @newAccessToken,
          refreshToken = @newRefreshToken
      WHERE sessionID = @sessionID;
    `);


  // Join role and status names
  const joinedResult = await pool.request()
  .input("sessionID", sql.Int, sessionID)
  .query(`
    SELECT TOP 1
       s.sessionID,
       s.clientID,
       s.userName,
       s.pin,
       s.qrDataUrl,
       s.expires_at,
       s.createdAt,
       s.updatedAt,
       s.role,
       s.accessToken,
       s.refreshToken,
       c.tokenQr
    FROM [DHUB].[sg].[LQ_CSS_sessions_info] s
    LEFT JOIN [DHUB].[sg].[LQ_CSS_client_info] c
        ON s.clientID = c.clientID
    WHERE s.sessionID = @sessionID
  `);

  if (!joinedResult.recordset || joinedResult.recordset.length === 0) {
    throw new Error("Session not found");
  }
  
  return joinedResult.recordset[0];
};

// ----------------------PUT-------------------------

// ----------------------DELETE-------------------------

