// controllers/clients_info_controller.js
import * as Model from "../models/clients_info_model.js";
import { generatePin } from "../utils/pin_generator.js";
import { generateQrDataUrl } from "../utils/qr_generator.js";
import * as Sessions from "../models/sessions_info_model.js";
import { success, error } from "../utils/response_helper.js";

// Get all clients
export const getAllClients = async (req, res) => {
  try {
    const data = await Model.getAllClient(); // fixed function name
    return success(res, data, "Clients list fetched successfully");
  } catch (e) {
    return error(res, e.message);
  }
};
// Register a new client
export const register = async (req, res) => {
  try {
    const data = req.body;
    const pin = data.pin || generatePin();

    // Optional: auto-fill registeredBy from logged-in staff
    const registeredBy = req.user ? req.user.fullName : data.registeredBy;

    await Model.registerClient({ ...data, pin, registeredBy });
    const qr = await generateQrDataUrl({ chapelID: data.chapelID, packageNo: data.packageNo, pin });

    return success(res, { pin, qr: qr.toString() }, "Client registered");
  } catch (e) {
    return error(res, e.message);
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

    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours
    const qr = await generateQrDataUrl({
      chapelID: client.chapelID,
      packageNo: client.packageNo,
      pin,
    });

    const sessionId = await Sessions.createSession({
      clientID: client.clientID,
      userName,
      pin,
      qrDataUrl: qr,
      expiresAt,
    });

    return success(res, { sessionId, clientID: client.clientID, expiresAt }, "Login successful");
  } catch (e) {
    return error(res, e.message);
  }
};

// Get client by ID
export const getClientById = async (req, res) => {
  try {
    const clientID = parseInt(req.params.clientID);
    const data = await Model.getClientById(clientID);
    if (!data) return error(res, "Client not found", 404);
    return success(res, data, "Client fetched successfully");
  } catch (e) {
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
