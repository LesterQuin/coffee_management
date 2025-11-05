// controllers/clients_info_controller.js
import * as Model from "../models/clients_info_model.js";
import { createSession } from "../models/sessions_info_model.js";
import { success, error } from "../utils/response_helper.js";

// GET all clients
export const getAllClients = async (req, res) => {
  try {
    const data = await Model.getAllClient();
    return success(res, data, "Clients list fetched successfully");
  } catch (e) {
    console.error("❌ GetAllClients Error:", e);
    return error(res, e.message);
  }
};

// Get client by PIN (staff)
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

// Get client by ID (staff)
export const getClientById = async (req, res) => {
  try {
    const clientID = parseInt(req.params.clientID, 10);
    if (isNaN(clientID)) return error(res, "Invalid clientID", 400);

    const raw = await Model.getClientById(clientID);
    if (!raw) return error(res, "Client not found", 404);
    const client = (raw && Model.mapClientRow) ? Model.mapClientRow(raw) : raw;

    const packageSummary = await Model.getClientPackageSummary(clientID);
    return success(res, { ...client, packageSummary }, "Client fetched successfully");
  } catch (e) {
    console.error("❌ getClientById error:", e);
    return error(res, e.message || "Internal server error");
  }
};

// Manually generate or refresh a PIN for a client
export const generatePin = async (req, res) => {
  try {
    const clientID = parseInt(req.params.clientID, 10);
    if (isNaN(clientID)) return error(res, "Invalid clientID", 400);

    const newPin = Model.generateDailyPin(clientID); // reuse existing logic
    await Model.updateClientPin(clientID, newPin);

    return success(res, { clientID, newPin }, "New PIN generated successfully");
  } catch (e) {
    console.error("❌ GeneratePin Error:", e);
    return error(res, e.message || "Server error");
  }
};

// Register client (staff)
// export const registerClient = async (req, res) => {
//   try {
//     const userName = req.user?.name || "unknown";
//     // Note: req.body should match the final payload (no packageNo required)
//     const result = await Model.registerClientWithQR(req.body, userName);
//     // Return the 'data' object (friendly response)
//     return success(res, result.data, result.message);
//   } catch (e) {
//     console.error("❌ Register Error:", e);
//     return error(res, e.message);
//   }
// };

// Register client (staff)
export const registerClient = async (req, res) => {
  try {
    const userName = req.user?.name || "unknown";

    // Register client
    const result = await Model.registerClientWithQR(req.body, userName);

    // Extract the new client ID from the result
    const newClientID = result?.data?.client?.clientID;
    if (!newClientID) return error(res, "Failed to register client ID");

    // // ✅ Generate and save today's PIN immediately
    // const todayPin = Model.generateDailyPin(newClientID);
    // await Model.updateClientPin(newClientID, todayPin); // Generate daily new PIN
    
    // Optional: use provided PIN or skip generation
    if (req.body.generatePin === true) {
      const newPin = Model.generateDailyPin(newClientID);
      await Model.updateClientPin(newClientID, newPin);
    }

    // Return success with today’s PIN for immediate login
    return success(
      res,
      { ...result.data, todayPin },
      "Client registered successfully. PIN generated for today."
    );
  } catch (e) {
    console.error("❌ Register Error:", e);
    return error(res, e.message);
  }
};

// Client login (QR or clientID + pin). Public route.
export const clientLogin = async (req, res) => {
  try {
    const clientSecret = req.query.secret;
    const { userName, pin } = req.body;

    if (!clientSecret || !pin) return error(res, "Invalid PIN");

    const client = await Model.getClientBySecret(clientSecret);
    if (!client) return error(res, "Invalid PIN");
    if (client.status !== "Active") return error(res, "Invalid PIN");

    const now = new Date();
    const start = new Date(client.schedule_from);
    const end = new Date(client.schedule_to);

    if (now < start || now > end) {
      return error(res, "Your session schedule has expired or not yet started");
    }

    // const todayPin = Model.generateDailyPin(client.clientID);
    // if (pin !== todayPin) return error(res, "Invalid PIN"); // Pin generate daily
    
    // Fetch stored PIN from DB
    const storedPin = client.pin;
    if (pin !== storedPin) return error(res, "Invalid PIN");

    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours
    const sessionId = await createSession({
      clientID: client.clientID,
      userName: userName || client.deceasedName || `client-${client.clientID}`,
      pin: todayPin,
      qrDataUrl: null,
      expiresAt
    });

    return success(res, {
      sessionId,
      clientID: client.clientID,
      deceasedName: client.deceasedName,
      chapelID: client.chapelID,
      chapelName: client.chapelName,
      packageNo: client.packageNo,
      packageName: client.packageName,
      expiresAt
    }, "Login success");
  } catch (e) {
    console.error("❌ ClientLogin error", e);
    return error(res, e.message || "Server error");
  }
};

// Consume item (staff/cashier or kiosk with session)
export const consumeItem = async (req, res) => {
  try {
    const clientID = parseInt(req.params.clientID || req.body.clientID, 10);
    if (isNaN(clientID)) return error(res, "Invalid clientID", 400);

    const { productID, qty } = req.body;
    if (!productID || isNaN(Number(productID))) return error(res, "productID is required", 400);
    if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) return error(res, "qty must be a positive number", 400);

    const result = await Model.consumeClientItem(clientID, Number(productID), Number(qty));
    if (!result || result.success === false) return error(res, result?.message || "Consume failed", 400);

    return success(res, result, "Consumed successfully");
  } catch (e) {
    console.error("❌ ConsumeItem Error:", e);
    return error(res, e.message || "Server error");
  }
};

// Add package (staff)
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

// Update client (staff)
export const update = async (req, res) => {
  try {
    const clientID = req.params.clientID;
    const fieldsToUpdate = req.body || {};
    if (!clientID) return error(res, "ClientID is required", 400);
    if (Object.keys(fieldsToUpdate).length === 0) return error(res, "No fields provided to update", 400);

    const updated = await Model.updateClient({ clientID, ...fieldsToUpdate });
    if (!updated) return error(res, "Client not found or no changes applied", 400);
    return success(res, null, "Client updated successfully");
  } catch (e) {
    console.error("❌ Update Client Error:", e);
    return error(res, e.message || "Server error");
  }
};

// Raise balance (staff)
export const raiseBalance = async (req, res) => {
  try {
    const clientID = req.params.clientID;
    const { amount, type } = req.body;
    if (!clientID) return error(res, "ClientID is required", 404);
    if (!amount) return error(res, "Amount is required", 400);

    await Model.raiseBalance(clientID, amount, type);
    return success(res, null, "Balance updated successfully");
  } catch (e) {
    console.error("❌ Raise Balance Error:", e);
    return error(res, e.message);
  }
};

// Delete client (staff)
export const deleteClient = async (req, res) => {
  try {
    const clientID = parseInt(req.params.clientID, 10);
    if (isNaN(clientID)) return error(res, "Invalid client ID", 400);

    const deleted = await Model.deleteClient(clientID);
    if (!deleted) return error(res, "Client not found", 404);
    return success(res, null, "Client deleted successfully");
  } catch (err) {
    console.error("❌ Error deleting client:", err);
    return error(res, "Server error");
  }
};

// GET client dashboard (package items + summary)
export const getClientDashboard = async (req, res) => {
  try {
    const clientID = parseInt(req.params.clientID, 10);
    if (isNaN(clientID)) return error(res, "Invalid clientID", 400);

    const dashboard = await Model.getClientWithPackageSummary(clientID);
    if (!dashboard) return error(res, "Client not found", 404);

    // Return exactly the structure you requested
    return success(res, dashboard, "Client dashboard loaded");
  } catch (e) {
    console.error("❌ getClientDashboard Error:", e);
    return error(res, e.message || "Server error");
  }
};

// GET today's PIN for cashier (staff)
export const getTodayPinForCashier = async (req, res) => {
  try {
    const clientID = parseInt(req.params.clientID, 10);
    if (isNaN(clientID)) return error(res, "Invalid clientID", 400);

    const auth = await Model.getClientAuthData(clientID);
    if (!auth) return error(res, "Client not found", 404);

    const todayPin = Model.generateDailyPin(auth.clientID);
    const defaultAllowed = await Model.isDefaultPackageAllowed(clientID);

    return success(res, { todayPin, defaultAllowed, scheduleFrom: auth.schedule_from, scheduleTo: auth.schedule_to }, "Today's PIN fetched");
  } catch (e) {
    console.error("❌ getTodayPinForCashier Error:", e);
    return error(res, e.message || "Server error");
  }
};

export const getClientPackageSummaryController = async (req, res) => {
  try {
    const clientID = parseInt(req.params.clientID, 10);
    if (isNaN(clientID)) return error(res, "Invalid clientID", 400);

    const summary = await Model.getClientWithPackageSummaryTest(clientID);
    if (!summary) return error(res, "Client not found", 404);

    return success(res, summary, "Client package summary loaded");
  } catch (e) {
    console.error("❌ getClientPackageSummaryController Error:", e);
    return error(res, e.message || "Server error");
  }
};

// Assign default package to client
export const assignDefaultPackageToClientController = async (req, res) => {
  const clientID = parseInt(req.params.clientID, 10);
  if (isNaN(clientID)) return error(res, "Invalid clientID", 400);

  try {
    const packageID = await Model.assignDefaultPackageToClient(clientID);
    if (!packageID) return error(res, "No default package found", 404);

    return success(res, { packageID }, "Default package assigned successfully");
  } catch (e) {
    console.error("❌ Assign default package error:", e);
    return error(res, e.message || "Internal server error");
  }
};