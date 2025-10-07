import express from "express";
import * as Controller from "../controllers/fnb_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();

// Categories
router.get("/categories", staffAuth, Controller.listCategories);
router.post("/categories", staffAuth, Controller.createCategory);

// Products
router.get("/products", staffAuth, Controller.listProducts);
router.post("/products", staffAuth, Controller.createProduct);

// Packages
router.get("/packages", staffAuth, Controller.listPackages);
router.post("/packages", staffAuth, Controller.createPackage);
router.post("/packages/items", staffAuth, Controller.addPackageItem);

export default router;
