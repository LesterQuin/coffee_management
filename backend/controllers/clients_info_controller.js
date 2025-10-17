// controllers/clients_info_controller.js
import * as Model from "../models/clients_info_model.js";
import { success, error } from "../utils/response_helper.js";

// Get all clients
export const getAllClients = async (req, res) => {
  try {
    const data = await Model.getAllClient();
    return success(res, data, "Clients list fetched successfully");
  } catch (e) {
    console.error("GetAllClients Error:", e);
    return error(res, e.message);
  }
};

// Register a new client
export const registerClient = async (req, res) => {
  try {
    const userName = req.user?.name || "unknown"; // assuming auth middleware sets req.user
    const clientData = req.body;

    // Call the updated model function
    const result = await Model.registerClientWithQR(clientData, userName);

    return success(res, result, "Client registered successfully");
  } catch (e) {
    console.error("Error registering client:", e);
    return error(res, e.message || "Failed to register client");
  }
};

// Update client information
export const update = async (req, res) => {
  try {
    await Model.updateClient(req.body);
    return success(res, null, "Client updated");
  } catch (e) {
    return error(res, e.message);
  }
};

// Raise client balance
export const raiseBalance = async (req, res) => {
  try {
    const { clientID, amount, type } = req.body;
    await Model.raiseBalance(clientID, amount, type);
    return success(res, null, "Balance updated");
  } catch (e) {
    return error(res, e.message);
  }
};

// Client login
export const clientLogin = async (req, res) => {
  try {
    const { userName, pin } = req.body;
    const client = await Model.getClientByPin(pin);

    if (!client || client.status !== "Active") {
      return error(res, "Invalid PIN or inactive", 400);
    }

    const qr = await Model.generateQrDataUrl({
      chapelID: client.chapelID,
      packageNo: client.packageNo,
      pin,
    });

    const sessionId = await Model.createSession({
      clientID: client.clientID,
      userName,
      pin,
      qrDataUrl: qr,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
    });

    return success(res, { sessionId, clientID: client.clientID, expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) }, "Login successful");
  } catch (e) {
    return error(res, e.message);
  }
};

// Get client by ID
export const getClientById = async (req, res) => {
  try {
    const { clientID } = req.params;

    if (!clientID || isNaN(clientID)) {
      return error(res, "Invalid or missing clientID", 400);
    }

    const data = await Model.getClientById(parseInt(clientID));

    if (!data) {
      return error(res, "Client not found", 404);
    }

    return success(res, data, "Client fetched successfully");
  } catch (e) {
    console.error("❌ getClientById error:", e);
    return error(res, e.message || "Internal server error");
  }
};


// Get client by PIN
export const getClientByPin = async (req, res) => {
  try {
    const pin = req.params.pin;
    const client = await Model.getClientByPin(pin);
    if (!client) return error(res, "Client not found", 404);
    return success(res, client, "Client fetched successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

// Delete client
export const deleteClient = async (req, res) => {
  try {
    const clientID = parseInt(req.params.clientID, 10);

    if (isNaN(clientID)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }

    const deleted = await Model.deleteClient(clientID);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    return res.json({ success: true, message: "Client deleted successfully" });
  } catch (err) {
    console.error("Error deleting client:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
