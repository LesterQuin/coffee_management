import express from "express";
import * as Controller from "../controllers/default_package_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

// Public: get currently-active default package id (uses latest row)
router.get("/", Controller.getDefaultPackage);

// Public: get default package details + items (uses latest row)
router.get("/items", Controller.getDefaultPackageItems);

// Protected: change (set) default package (inserts a new default row)
router.put("/:packageID", staffAuth, Controller.setDefaultPackage);

export default router;

//http://localhost:5000/api/defaultpackage/
//http://localhost:5000/api/defaultpackage/items
//http://localhost:5000/api/defaultpackage/:id of the package you want to set in default