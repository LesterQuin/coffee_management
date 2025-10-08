// middleware/role_guard.js

/**
 * Role guard middleware
 * Example: requireRole('manager')
 * Admin always has access
 */
export const requireRole = (role) => (req, res, next) => {
  const user = req.staff;

  if (!user) 
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const rolePriority = {
    staff: 1,
    manager: 2,
    admin: 3
  };
  const requiredLevel = rolePriority[role] || 1;
  const userLevel = rolePriority[user.role] || 0;

  if(userLevel < requiredLevel){
    return res.status(403).json({ success: false, message: "Forbidden: insufficient role" });
  }

  next();
};
