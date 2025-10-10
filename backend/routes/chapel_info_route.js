// routes/chapel_info_route.js
import express from "express";
import * as Controller from "../controllers/chapel_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();

// Get all chapels
router.get("/", staffAuth, Controller.getAllChapels);
// Get all available chapels
router.get("/available", staffAuth ,Controller.listAvailable);
// Create a new chapel room
router.post("/", staffAuth, Controller.create);
// Set the status of a chapel room
router.put("/status/:chapelID", staffAuth, Controller.setStatus);
// Delete
router.delete("/:chapelID", Controller.deleteChapel);

export default router;
