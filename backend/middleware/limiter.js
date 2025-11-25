// middleware/limiter.js
import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per IP
  message: { success: false, message: "Too many requests, try again later" },
});

/**
 * Login-specific rate limiter (stricter)
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 login attempts per IP
  message: { success: false, message: "Too many login attempts, try again later" },
});
