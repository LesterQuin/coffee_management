// routes/chapel_info_route.js
import express from "express";
import * as Controller from "../controllers/chapel_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();

// ----------------------GET-------------------------
// Get all chapels
router.get("/", staffAuth, Controller.getAllChapels);
// Get all available chapels
router.get("/active", staffAuth ,Controller.listAvailable);
// get packages for a specific chapel
router.get("/:chapelID/packages", staffAuth, Controller.listPackagesByChapel);

// ----------------------POST-------------------------
// Create a new chapel room
router.post("/", staffAuth, Controller.create);

// ----------------------PUT-------------------------
// Set the status of a chapel room
router.put("/status/:chapelID", staffAuth, Controller.setStatus);
// update 
router.put("/:chapelID", staffAuth, Controller.updateChapel)

// ----------------------DELETE-------------------------
// Delete
router.delete("/:chapelID", staffAuth, Controller.deleteChapel);


export default router;
