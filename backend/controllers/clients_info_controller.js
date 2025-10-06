// controllers/clients_info_controller.js
import * as Model from "../models/clients_info_model.js";
import { generatePin } from "../utils/pin_generator.js";
import { generateQrDataUrl } from "../utils/qr_generator.js";
import * as Sessions from "../models/sessions_info_model.js";
import { success, error } from "../utils/response_helper.js";

export const register = async (req, res) => {
  try {
    const data = req.body;
    const pin = data.pin || generatePin();
    await Model.registerClient({ ...data, pin });
    const qr = await generateQrDataUrl({ chapelID: data.chapelID, packageNo: data.packageNo, pin });
    return success(res, { pin, qr }, "Client registered");
  } catch (e) {
    return error(res, e.message);
  }
};

export const update = async (req, res) => {
  try {
    await Model.updateClient(req.body);
    return success(res, null, "Client updated");
  } catch (e) {
    return error(res, e.message);
  }
};

export const raiseBalance = async (req, res) => {
  try {
    const { clientID, amount, type } = req.body;
    await Model.raiseBalance(clientID, amount, type);
    return success(res, null, "Balance updated");
  } catch (e) {
    return error(res, e.message);
  }
};

export const clientLogin = async (req, res) => {
  try {
    const { userName, pin } = req.body;
    const client = await Model.getClientByPin(pin);
    if (!client) return error(res, "Invalid PIN or inactive", 400);
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const qr = await generateQrDataUrl({ chapelID: client.chapelID, packageNo: client.packageNo, pin });
    const sessionId = await Sessions.createSession({ clientID: client.clientID, userName, pin, qrDataUrl: qr, expiresAt });
    return success(res, { sessionId, clientID: client.clientID, expiresAt }, "Login successful");
  } catch (e) {
    return error(res, e.message);
  }
};
