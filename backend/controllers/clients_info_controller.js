// controllers/clients_info_controller.js
import * as Model from "../models/clients_info_model.js";
import { success, error } from "../utils/response_helper.js";

// ----------------------GET-------------------------
// Get all clients
export const getAllClients = async (req, res) => {
  try {
    const data = await Model.getAllClient();
    return success(res, data, "Clients list fetched successfully");
  } catch (e) {
    console.error("❌ GetAllClients Error:", e);
    return error(res, e.message);
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

// ----------------------POST-------------------------
// Register a new client
export const registerClient = async (req, res) => {
  try {
    const userName = req.user?.name || "unknown";
    
    // Register client and assign default package
    const result = await Model.registerClientWithQR(req.body, userName);

    const { clientID, assignedPackageID } = result;

    // Fetch assigned package items
    let packageItems = [];
    if (assignedPackageID) {
      packageItems = await Model.getClientPackageItems(clientID);
    }

    return res.json({
      success: true,
      message: "Client registered successfully with default package",
      data: {
        client: result,
        assignedPackageID,
        packageItems,
        qrDataUrl: result.qrDataUrl,
        sessionID: result.sessionID,
        pin: result.pin
      }
    });
  } catch (e) {
    console.error("❌ Register Error:", e);
    return res.status(500).json({ success: false, message: e.message });
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

export const consumeItem = async (req, res) => {
  try {
    const clientID = parseInt(req.params.clientID, 10);
    if (isNaN(clientID)) return error(res, "Invalid clientID", 400);

    const { productID, qty } = req.body;
    if (!productID || isNaN(Number(productID))) return error(res, "productID is required", 400);
    if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) return error(res, "qty must be a positive number", 400);

    const result = await Model.consumeClientItem(clientID, Number(productID), Number(qty));

    if (!result || result.success === false) {
      return error(res, result?.message || "Consume failed", 400);
    }

    return success(res, result, "Consumed successfully");
  } catch (e) {
    console.error("❌ ConsumeItem Error:", e);
    return error(res, e.message || "Server error");
  }
};

export const addPackage = async (req, res) => {
  try {
    const clientID = parseInt(req.params.clientID, 10);
    if (isNaN(clientID)) return error(res, "Invalid clientID", 400);

    const { packageID } = req.body;
    if (!packageID || isNaN(Number(packageID))) return error(res, "packageID is required", 400);

    const result = await Model.addPackageToClient(clientID, Number(packageID));
    return success(res, result, "Package added successfully");
  } catch (e) {
    console.error("❌ AddPackage Error:", e);
    return error(res, e.message || "Server error");
  }
};

// ----------------------PUT-------------------------
// Update client information
export const update = async (req, res) => {
  try {
    const clientID = req.params.clientID;
    const fieldsToUpdate = req.body || {};

    if (!clientID){
      return res.status(400).json({success: false, message: "ClientID is required in params" });
    }

    if (Object.keys(fieldsToUpdate).length === 0){
      return res.status(400).json({success: false, message: "No fields provided to update"});
    }

    const updated = await Model.updateClient({ clientID, ...fieldsToUpdate});

    if(!updated){
      return res.status(400).json({success: false, message: "Client not found or no changes applied"});
    }

    return res.json({success: true, message: "Client updated successfully"});
  } catch (e) {
    console.error("❌ Update Client Error:", e);
    return res.status(500).json({success: false, message: e.message || "Server error"});
  }
};

// Raise client balance
export const raiseBalance = async (req, res) => {
  try {
    const clientID = req.params.clientID;
    const { amount, type } = req.body;

    if (!clientID) return error(res, "ClientID is required in params", 404);
    if (!amount) return error(res, "Aomunt is required", 400);

    await Model.raiseBalance(clientID, amount, type);
    return success(res, null, "Balance updated successfully");
  } catch (e) {
    console.error("❌ Raise Balance Error:", e);
    return error(res, e.message);
  }
};

// ----------------------DELETE-------------------------
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
    console.error("❌ Error deleting client:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
