// routes/fnb_package_route.js
import express from "express";
import * as Package from "../controllers/fnb_package_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

// ----------------------GET-------------------------
// Scan QR (get client package + allowed menu)
router.get("/scan/:pin", Package.getClientPackageByPin);
// Get menu items by package ID
router.get("/menu/:packageID", Package.getMenuByPackage);

// ----------------------POST-------------------------

// ----------------------PUT-------------------------

// ----------------------DELETE-------------------------

export default router;
