// routes/staff_info_route.js
import express from "express";
import * as Controller from "../controllers/staff_info_controller.js";
const router = express.Router();

router.post("/register", Controller.staffRegister);
router.post("/login", Controller.staffLogin);

export default router;
