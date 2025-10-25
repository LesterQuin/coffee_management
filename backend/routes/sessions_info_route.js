// routes/sessions_info_route.js
import express from "express";
import * as Controller from "../controllers/sessions_info_controller.js";
const router = express.Router();

// ----------------------GET-------------------------

// ----------------------POST-------------------------
// Client login
router.post("/user-login", Controller.clientLogin);

// ----------------------PUT-------------------------

// ----------------------DELETE-------------------------
export default router;

