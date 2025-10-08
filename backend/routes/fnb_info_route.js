import express from "express";
import * as Controller from "../controllers/fnb_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();

// get Categories
router.get("/categories", staffAuth, Controller.listCategories);
// Create a new category
router.post("/categories", staffAuth, Controller.createCategory);
// get Products
router.get("/products", staffAuth, Controller.listProducts);
// Add a new product
router.post("/products", staffAuth, Controller.createProduct);
// get Packages
router.get("/packages", staffAuth, Controller.listPackages);
// Create a new package
router.post("/packages", staffAuth, Controller.createPackage);
// Add items to a package
router.post("/packages/items", staffAuth, Controller.addPackageItem);

export default router;
