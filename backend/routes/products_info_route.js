// routes/products_info_route.js
import express from "express";
import * as Controller from "../controllers/products_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();

// get all categories
router.get("/categories", Controller.listCategories);
// Create a new category
router.post("/categories", staffAuth, Controller.createCategory);
// get all products
router.get("/", Controller.listProducts);
// Add a new product
router.post("/", staffAuth, Controller.createProduct);

export default router;
