// routes/products_info_route.js
import express from "express";
import * as Controller from "../controllers/products_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();

router.get("/categories", Controller.listCategories);
router.post("/categories", staffAuth, Controller.createCategory);

router.get("/", Controller.listProducts);
router.post("/", staffAuth, Controller.createProduct);

export default router;
