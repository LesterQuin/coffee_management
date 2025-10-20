import express from "express";
import * as Controller from "../controllers/fnb_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
import upload from "../middleware/upload_middleware.js";

const router = express.Router();

// Get all categories
router.get("/categories", staffAuth, Controller.listCategories);
// Create a new category
router.post("/categories", staffAuth, upload.single("image"), Controller.createCategory);
// Update category
router.put("/categories/:categoryID", staffAuth, upload.single("image"), Controller.updateCategory);
// Delete category
router.delete("/categories/:categoryID", staffAuth, Controller.deleteCategory);

// Get all products
router.get("/products", staffAuth, upload.single("image"), Controller.listProducts);
// Create a new product
router.post("/products", staffAuth, upload.single("image"), Controller.createProduct);
// Update product
router.put("/products/:productID", staffAuth, upload.single("image"), Controller.updateProduct);
// Delete product
router.delete("/products/:productID", staffAuth, Controller.deleteProduct);

// Get all packages
router.get("/packages", staffAuth, Controller.listPackages);
// Create a new package
router.post("/packages", staffAuth, Controller.createPackage);
// Update package
router.put("/packages/:packageID", staffAuth, Controller.updatePackage);
// Delete package
router.delete("/packages/:packageID", staffAuth, Controller.deletePackage);

// Get all items under a specific package
router.get("/packages/:packageID/items", staffAuth, Controller.listPackageItems);

// Get products ny category
router.get("/categories/:categoryID/products", staffAuth, Controller.listProductByCategory);

// Add an item to a specific package
router.post("/packages/:packageID/items", staffAuth, Controller.addPackageItem);

// Update a specific item to a specific package
router.put("/packages/:packageID/items/:itemId", staffAuth, Controller.updatePackageItem);

// Delete a specific item from a specific package
router.delete("/packages/:packageID/items/:itemId", staffAuth, Controller.deletePackageItem);

export default router;
