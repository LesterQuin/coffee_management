// routes/staff_info_route.js
import express from "express";
import { staffRegister, staffLogin } from "../controllers/staff_info_controller.js";

const router = express.Router();

// POST /api/staff/register
router.post("/register", staffRegister);

// POST /api/staff/login
router.post("/login", staffLogin);

export default router;
