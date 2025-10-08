// backend/config/db_config.js
import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // e.g., "192.5.5.20"
  database: process.env.DB_NAME,
  port: 1433,
  options: {
    encrypt: false,               
    trustServerCertificate: true, 
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

export const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log(" Connected to SQL Server");
    return pool;
  })
  .catch(err => {
    console.error(" DB connection failed:", err);
  });

export { sql };
