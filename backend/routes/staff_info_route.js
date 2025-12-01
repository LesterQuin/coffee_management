import express from "express";
import * as Controller from "../controllers/staff_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
import { loginLimiter } from "../middleware/limiter.js";
import { verifyRoles } from "../middleware/verify_roles.js";
import { ROLES_LIST } from "../config/role_list.js";

const router = express.Router();

// ----------------------GET-------------------------
// GET /api/staff
router.get("/", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN),  Controller.getAllStaff);
// GET /api/staff/:staffID
router.get("/:staffID", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN),  Controller.getStaffByID);

// ----------------------POST-------------------------
// POST /api/staff/register
router.post("/register", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.staffRegister);
// POST /api/staff/login
router.post("/login", loginLimiter, Controller.staffLogin);
// Refresh token
router.post("/refresh-token", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.refreshStaffToken);
// Logout
router.post("/logout", staffAuth, Controller.staffLogout);

// ----------------------PUT-------------------------
// Update staff information (role-based validation)
router.put("/:staffID", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.updateStaff);

// ----------------------DELETE-------------------------
// DELETE /api/staff/:staffID
router.delete("/:staffID", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.deleteStaff);

export default router;
