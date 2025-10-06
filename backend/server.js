import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sql, poolPromise } from "./config/db_config.js"; // adjust path

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello world! it's working" });
});

// DB version test
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

const PORT = process.env.LOCAL_SERVER_PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
