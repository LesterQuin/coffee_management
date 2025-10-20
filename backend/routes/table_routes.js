// routes/tables_route.js
import express from "express";
import * as Controller from "../controllers/tables_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

// Sizes
router.get("/sizes", staffAuth, Controller.getSizes);

// Roles
router.get("/roles", staffAuth, Controller.getRoles);

// Status
router.get("/status", staffAuth, Controller.getStatus);

export default router;
