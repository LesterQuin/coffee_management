// controllers/sessions_info_controller.js
import * as Sessions from "../models/sessions_info_model.js";
import * as Clients from "../models/clients_info_model.js";
import { success, error } from "../utils/response_helper.js";
import { generateQrDataUrl } from "../utils/qr_generator.js";

// ----------------------GET-------------------------

// ----------------------POST-------------------------
// Client login
export const clientLogin = async (req, res) => {
  try {
    const { userName, pin } = req.body;

    const client = await Clients.getClientByPin(pin);
    if (!client) return error(res, "Invalid PIN or no active booking", 400);

    const existingSession = await Sessions.getActiveSession(userName, pin);
    if (existingSession) {
      return success(res, {
        sessionId: existingSession.sessionID,
        expiresAt: existingSession.expires_at,
        clientID: client.clientID,
        deceasedName: client.deceasedName,
        chapelID: client.chapelID,
        chapelName: client.chapelname,
        packageNo: client.packageNo,
        packageName: client.packageName
      }, "Session active");
    }

    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const qrDataUrl = await generateQrDataUrl({
      chapelID: client.chapelID,
      packageNo: client.packageNo,
      pin,
      deceasedName: client.deceasedName,
      chapelName: client.chapelName,
      packageName: client.packageName
    });

    const sessionId = await Sessions.createSession({
        clientID: client.clientID,
        userName,
        pin,
        qrDataUrl,
        expiresAt
    });

    const packageInfo = await Sessions.getPackageById(client.packageNo);

    return success(res, {
      sessionId,
      expiresAt,
      clientID: client.clientID,
      deceasedName: client.deceasedName,
      chapelID: client.chapelID,
      chapelName: client.chapelName,
      packageNo: client.packageNo,
      packageName: client.packageName,
      package: packageInfo
    }, "Logged in successfully");
  } catch (e) {
    console.error("❌ ClientLogin error", e);
    return error(res, e.message);
  }
};
// ----------------------PUT-------------------------

// ----------------------DELETE-------------------------

