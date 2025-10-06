// routes/chapel_info_route.js
import express from "express";
import * as Controller from "../controllers/chapel_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();

router.get("/available", Controller.listAvailable);
router.post("/", staffAuth, Controller.create);
router.put("/status", staffAuth, Controller.setStatus);

export default router;
