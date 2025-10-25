// routes/clients_info_route.js
import express from "express";
import * as Controller from "../controllers/clients_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";
const router = express.Router();
// ----------------------GET-------------------------
// Get all clients
router.get("/", staffAuth, Controller.getAllClients);
// Get client by PIN
router.get("/pin/:pin", staffAuth, Controller.getClientByPin);
// Get client by ID
router.get("/:clientID", staffAuth, Controller.getClientById);
// ----------------------POST-------------------------
// Register a new client
router.post("/register", staffAuth, Controller.registerClient);
// Client login
router.post("/login", Controller.clientLogin);
// consume an item (strict mode)
router.post("/:clientID/consume", staffAuth, Controller.consumeItem);
// add a package to a client (merge quantities)
router.post("/:clientID/add-package", staffAuth, Controller.addPackage);
// ----------------------PUT-------------------------
// Update client information
router.put("/:clientID", staffAuth, Controller.update);
// Raise client balance
router.put("/:clientID/balance", staffAuth, Controller.raiseBalance);
// ----------------------DELETE-------------------------
// Delete client by ID
router.delete("/:clientID", staffAuth, Controller.deleteClient);

export default router;
