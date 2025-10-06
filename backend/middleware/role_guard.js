// middleware/role_guard.js

/**
 * Role guard middleware
 * Example: requireRole('manager')
 * Admin always has access
 */
export const requireRole = (role) => (req, res, next) => {
  const user = req.staff;
  if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

  if (user.role !== role && user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden: insufficient role" });
  }
  next();
};
