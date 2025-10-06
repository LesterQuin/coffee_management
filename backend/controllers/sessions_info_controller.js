// controllers/sessions_info_controller.js
import * as Sessions from "../models/sessions_info_model.js";
import * as Clients from "../models/clients_info_model.js";
import { success, error } from "../utils/response_helper.js";
import { generateQrDataUrl } from "../utils/qr_generator.js";

export const clientLogin = async (req, res) => {
  try {
    const { userName, pin } = req.body;
    const client = await Clients.getClientByPin(pin);
    if (!client) return error(res, "Invalid PIN or no active booking", 400);

    const existing = await Sessions.getActiveSession(userName, pin);
    if (existing) return success(res, { sessionID: existing.session_id, expiresAt: existing.expires_at }, "Session active");

    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const qr = await generateQrDataUrl({ chapelID: client.chapelID, packageNo: client.packageNo, pin });

    const sessionId = await Sessions.createSession({ clientID: client.clientID, userName, pin, qrDataUrl: qr, expiresAt });
    return success(res, { sessionId, expiresAt }, "Logged in");
  } catch (e) {
    return error(res, e.message);
  }
};
