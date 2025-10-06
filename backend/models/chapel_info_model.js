// models/chapel_info_model.js
import { getPool, sql } from "../config/db_config.js";

export const getAvailableChapels = async () => {
  const pool = await getPool();
  const res = await pool.request()
    .query("SELECT chapelID, chapelName, status, description FROM sg.LQ_CSS_chapel_rooms WHERE status = 'Available'");
  return res.recordset;
};

export const createChapel = async (chapelName, description) => {
  const pool = await getPool();
  await pool.request()
    .input("chapelName", sql.NVarChar, chapelName)
    .input("description", sql.NVarChar, description ?? null)
    .query("INSERT INTO sg.LQ_CSS_chapel_rooms (chapelName, description) VALUES (@chapelName,@description)");
  return true;
};

export const setChapelStatus = async (chapelID, status) => {
  const pool = await getPool();
  await pool.request()
    .input("chapelID", sql.Int, chapelID)
    .input("status", sql.NVarChar, status)
    .execute("sg.LQ_CSS_chapel_set_status");
  return true;
};
