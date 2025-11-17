// routes/tables_route.js
import express from "express";
import * as Controller from "../controllers/tables_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

// ----------------------SIZES-------------------------
router.get("/sizes", staffAuth, Controller.getSizes);
router.post("/sizes", staffAuth, Controller.createSize);
router.put("/sizes/:sizeId", staffAuth, Controller.updateSize);
router.delete("/sizes/:sizeId", staffAuth, Controller.deleteSize);

// ----------------------ROLES-------------------------
router.get("/roles", staffAuth, Controller.getRoles);
router.post("/roles", staffAuth, Controller.createRole);
router.put("/roles/:roleId", staffAuth, Controller.updateRole);
router.delete("/roles/:roleId", staffAuth, Controller.deleteRole);

// ----------------------STATUS-------------------------
router.get("/status", staffAuth, Controller.getStatus);
router.post("/status", staffAuth, Controller.createStatus);
router.put("/status/:statusId", staffAuth, Controller.updateStatus);
router.delete("/status/:statusId", staffAuth, Controller.deleteStatus);

export default router;
