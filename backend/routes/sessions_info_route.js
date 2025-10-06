// routes/sessions_info_route.js
import express from "express";
import * as Controller from "../controllers/sessions_info_controller.js";
const router = express.Router();

router.post("/client-login", Controller.clientLogin);

export default router;
