// routes/packages_info_route.js
import express from "express";
import * as Controller from "../controllers/packages_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();

// Create a new package
router.post("/", staffAuth, Controller.createPackage);
// Add items to a package
router.post("/items", staffAuth, Controller.addPackageItem);

export default router;
