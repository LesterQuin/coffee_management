// routes/clients_info_route.js
import express from "express";
import * as Controller from "../controllers/clients_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();

router.post("/register", staffAuth, Controller.register);
router.put("/update", staffAuth, Controller.update);
router.post("/raise-balance", staffAuth, Controller.raiseBalance);
router.post("/login", Controller.clientLogin);

export default router;
