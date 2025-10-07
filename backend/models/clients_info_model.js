// models/clients_info_model.js
import { poolPromise, sql } from "../config/db_config.js";

// Get all client information
export const getAllClient = async () => {
  const pool = await poolPromise;
  const result = await pool.request()
    .query(`
      SELECT clientID, deceasedName, registeredBy, mobileNo, email, address,
             schedule_from, schedule_to, chapelID, packageNo, pin,
             packageBalance, additionalBalance, status, createdAt, updatedAt
      FROM sg.LQ_CSS_client_info
      ORDER BY createdAt DESC
    `);
  return result.recordset;
}

// Register a new client
export const registerClient = async (client) => {
  const pool = await poolPromise;
  const request = pool.request()
    .input("deceasedName", sql.NVarChar(150), client.deceasedName)
    .input("registeredBy", sql.NVarChar(150), client.registeredBy)
    .input("mobileNo", sql.NVarChar(20), client.mobileNo)
    .input("email", sql.NVarChar(150), client.email ?? null)
    .input("address", sql.NVarChar(250), client.address ?? null)
    .input("scheduleFrom", sql.DateTime, client.scheduleFrom)
    .input("scheduleTo", sql.DateTime, client.scheduleTo)
    .input("chapelID", sql.Int, client.chapelID)
    .input("packageNo", sql.Int, client.packageNo ?? null)
    .input("pin", sql.NVarChar(10), client.pin)
    .input("packageBalance", sql.Decimal(18,2), client.packageBalance ?? 0)
    .input("additionalBalance", sql.Decimal(18,2), client.additionalBalance ?? 0);

  await request.execute("sg.LQ_CSS_client_register");
  return true;
};
// Update client information
export const updateClient = async (data) => {
  const pool = await poolPromise;
  await pool.request()
    .input("clientID", sql.Int, data.clientID)
    .input("mobileNo", sql.NVarChar(20), data.mobileNo)
    .input("email", sql.NVarChar(150), data.email)
    .input("address", sql.NVarChar(250), data.address)
    .input("scheduleFrom", sql.DateTime, data.scheduleFrom)
    .input("scheduleTo", sql.DateTime, data.scheduleTo)
    .input("packageBalance", sql.Decimal(18,2), data.packageBalance)
    .input("additionalBalance", sql.Decimal(18,2), data.additionalBalance)
    .execute("sg.LQ_CSS_client_update");
  return true;
};
// Raise client balance
export const raiseBalance = async (clientID, amount, type) => {
  const pool = await poolPromise;
  await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("amount", sql.Decimal(18,2), amount)
    .input("type", sql.NVarChar(20), type)
    .execute("sg.LQ_CSS_client_raise_balance");
  return true;
};
// Get client information by PIN
export const getClientByPin = async (pin) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("pin", sql.NVarChar, pin)
    .query("SELECT * FROM sg.LQ_CSS_client_info WHERE pin = @pin AND status = 'Active'");
  return res.recordset[0];
};
// Get client information by ID
export const getClientById = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query("SELECT * FROM sg.LQ_CSS_client_info WHERE clientID = @clientID");
  return res.recordset[0];
};
