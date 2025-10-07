// routes/clients_info_route.js
import express from "express";
import * as Controller from "../controllers/clients_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();

// Get all clients
router.get("/", staffAuth, Controller.getAllClients);
// Register a new client
router.post("/register", staffAuth, Controller.register);
// Update client information
router.put("/update", staffAuth, Controller.update);
// Raise client balance
router.put("/raise-balance", staffAuth, Controller.raiseBalance);
// Client login
router.post("/login", Controller.clientLogin);
// Get client by ID
router.get("/:clientID", staffAuth, Controller.getClientById);
// Get client by PIN
router.get("/pin/:pin", staffAuth, Controller.getClientByPin);

export default router;
