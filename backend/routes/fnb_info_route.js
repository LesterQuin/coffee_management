import express from "express";
import * as Controller from "../controllers/fnb_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
import { requireRole } from "../middleware/role_guard.js";

const router = express.Router();

// get Categories
router.get("/categories", staffAuth, Controller.listCategories);
// Create a new category
router.post("/categories", staffAuth, requireRole("admin"), Controller.createCategory);
// get Products
router.get("/products", staffAuth, Controller.listProducts);
// Add a new product
router.post("/products", staffAuth, requireRole("admin"), Controller.createProduct);
// get Packages
router.get("/packages", staffAuth, Controller.listPackages);
// Create a new package
router.post("/packages", staffAuth, requireRole("admin"), Controller.createPackage);
// Add items to a package
router.post("/packages/items", staffAuth, requireRole("admin"), Controller.addPackageItem);

export default router;
