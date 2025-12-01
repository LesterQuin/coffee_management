import express from "express";
import * as Controller from "../controllers/fnb_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
import upload from "../middleware/upload_middleware.js";
import { verifyRoles } from "../middleware/verify_roles.js";
import { ROLES_LIST } from "../config/role_list.js";

const router = express.Router();

// ------------------ Categories ------------------
// Get all categories
router.get("/categories", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.listCategories);
// Create a new category
router.post("/categories", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN),  upload.single("image"), Controller.createCategory);
// Update category
router.put("/categories/:categoryID", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), upload.single("image"), Controller.updateCategory);
// Delete category
router.delete("/categories/:categoryID", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.deleteCategory);

// ------------------ Products ------------------
// Get all products
router.get("/products", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.listProducts);
// Create a new product
router.post("/products", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), upload.single("image"), Controller.createProduct);
// Update product
router.put("/products/:productID", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), upload.single("image"), Controller.updateProduct);
// Delete product
router.delete("/products/:productID", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.deleteProduct);
// Get products ny category
router.get("/categories/:categoryID/products", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.listProductByCategory);

// ------------------ Packages ------------------
// Get all packages
router.get("/packages", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.listPackages);
// Create a new package
router.post("/packages", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.createPackage);
// Update package
router.patch("/packages/:packageID", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.updatePackage);
// Delete package
router.delete("/packages/:packageID", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.deletePackage);

// ------------------ Package Items ------------------
// Get all items under a specific package
router.get("/packages/:packageID/items", staffAuth, verifyRoles(ROLES_LIST.CASHIER, ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.listPackageItems);
// Add an item to a specific package
router.post("/packages/:packageID/items", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.addPackageItem);
// Update a specific item to a specific package
router.put("/packages/:packageID/items/:itemId", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.updatePackageItem);
// Delete a specific item from a specific package
router.delete("/packages/:packageID/items/:itemId", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.deletePackageItem);

// Add, update, or remove a product in a package
//router.post("/packages/:packageID/items/manage", Controller.managePackageItem);
router.put("/packages/items/products", staffAuth, verifyRoles(ROLES_LIST.ADMIN, ROLES_LIST.SUPER_ADMIN), Controller.updatePackageProductsController);

// Consume a product from a package (e.g., when ordered)
router.post("/packages/consume", staffAuth, Controller.consumePackageItemController);

export default router;
