import express from "express";
import * as Controller from "../controllers/fnb_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

// Get all categories
router.get("/categories", staffAuth, Controller.listCategories);
// Create a new category
router.post("/categories", staffAuth, Controller.createCategory);

// Get all products
router.get("/products", staffAuth, Controller.listProducts);
// Create a new product
router.post("/products", staffAuth, Controller.createProduct);

// Get all packages
router.get("/packages", staffAuth, Controller.listPackages);
// Create a new package
router.post("/packages", staffAuth, Controller.createPackage);

// Get all items under a specific package
router.get("/packages/:packageID/items", staffAuth, Controller.listPackageItems);

// Add an item to a specific package
router.post("/packages/:packageID/items", staffAuth, Controller.addPackageItem);

// Delete a specific item from a specific package
router.delete("/packages/:packageID/items/:itemId", staffAuth, Controller.deletePackageItem);

export default router;
