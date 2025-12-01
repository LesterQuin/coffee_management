// routes/chapel_info_route.js
import express from "express";
import * as Controller from "../controllers/chapel_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
import { verifyRoles } from "../middleware/verify_roles.js";
import { ROLES_LIST } from "../config/role_list.js";
const router = express.Router();

// ----------------------GET-------------------------
// Get all chapels
router.get("/", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.getAllChapels);
//router.get("/", staffAuth, Controller.getAllChapels);
// Get all available chapels
router.get("/active", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN),  Controller.listAvailable);
// get packages for a specific chapel
router.get("/:chapelID/packages", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.listPackagesByChapel);

// ----------------------POST-------------------------
// Create a new chapel room
router.post("/", verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), staffAuth, Controller.create);

// ----------------------PUT-------------------------
// Set the status of a chapel room
//router.put("/status/:chapelID", staffAuth, Controller.setStatus);
// update 
router.put("/:chapelID", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN),  Controller.updateChapel)

// ----------------------DELETE-------------------------
// Delete
router.delete("/:chapelID",  verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), staffAuth, Controller.deleteChapel);


export default router;
