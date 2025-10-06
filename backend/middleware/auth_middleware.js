// middleware/auth_middleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

/**
 * Staff authentication middleware
 * Expects Authorization header: "Bearer <token>"
 */
export const staffAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: "No token provided" });

  const token = authHeader.split(" ")[1] ?? authHeader;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.staff = decoded; // attach staff payload
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
