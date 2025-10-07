// routes/staff_info_route.js
import express from "express";
import { staffRegister, staffLogin,  } from "../controllers/staff_info_controller.js";
import * as Controller from "../controllers/staff_info_controller.js";

const router = express.Router();

// GET /api/staff
router.get("/", Controller.getAllStaff);

// POST /api/staff/register
router.post("/register", staffRegister);

// POST /api/staff/login
router.post("/login", staffLogin);

export default router;
