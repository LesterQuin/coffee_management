// server.js
import dotenv from "dotenv";
import app from "./app.js"; //  Import your main app with all routes and middleware
import { sql, poolPromise } from "./config/db_config.js"; // optional if you still want to test DB connection

dotenv.config();

const PORT = process.env.LOCAL_SERVER_PORT || 5000;

// Health check for the server (kept simple)
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello world! it's working" });
  res.send(JSON.stringify({ message: "Hello world! it's working" }));
});

// Optional: Quick DB version test route
app.get("/api/db-version", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT @@VERSION AS version");
    res.json({ version: result.recordset[0].version });
  } catch (err) {
    console.error("❌ Error fetching DB version:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT,  '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
