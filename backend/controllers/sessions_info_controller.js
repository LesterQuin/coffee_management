// controllers/sessions_info_controller.js
import * as Sessions from "../models/sessions_info_model.js";
import * as Clients from "../models/clients_info_model.js";
import { success, error } from "../utils/response_helper.js";
import { generateQrDataUrl } from "../utils/qr_generator.js";

// ----------------------GET-------------------------

// ----------------------POST-------------------------
// Client login
// export const clientLogin = async (req, res) => {
//   try {
//     // Accept clientID from query (QR) or body
//     const clientID = req.query.clientID
//       ? parseInt(req.query.clientID, 10)
//       : req.body.clientID
//       ? parseInt(req.body.clientID, 10)
//       : null;

//     const { pin, userName } = req.body;

//     if (!clientID || isNaN(clientID)) return error(res, "clientID is required", 400);
//     if (!pin) return error(res, "PIN is required", 400);

//     // Fetch client info
//     const client = await Clients.getClientById(clientID);
//     if (!client) return error(res, "Client not found", 404);
//     if (client.status !== "Active") return error(res, "Client inactive", 400);

//     // Generate today’s PIN
//     const todayPin = Clients.generateDailyPin(clientID);
//     if (pin !== todayPin) return error(res, "Invalid PIN", 400);

//     // Create a new session (allow multiple sessions)
//     const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours
//     const qrDataUrl = await generateQrDataUrl({ clientID });

//     const sessionId = await Sessions.createSession({
//       clientID,
//       userName: userName || client.deceasedName || `client-${clientID}`,
//       pin: todayPin,
//       qrDataUrl,
//       expiresAt,
//     });

//     // Return full info
//     return success(res, {
//       sessionId,
//       clientID: client.clientID,
//       deceasedName: client.deceasedName,
//       chapelID: client.chapelID,
//       chapelName: client.chapelName,
//       packageNo: client.packageNo,
//       packageName: client.packageName,
//       expiresAt,
//     }, "Login success");

//   } catch (e) {
//     console.error("❌ ClientLogin Error:", e);
//     return error(res, e.message || "Server error");
//   }
// };

export const clientLogin = async (req, res) => {
  try {
    const { token, userName, pin } = req.body;

    // Validate input
    if (!token) return error(res, "Token is required", 400);
    if (!pin) return error(res, "PIN is required", 400);

    // Find client by tokenQr instead of clientSecret
    const client = await Clients.getClientByTokenQr(token);
    if (!client) return error(res, "Invalid token", 404);
    if (client.status !== "Active") return error(res, "Client inactive", 400);

    // Validate daily PIN
    //const todayPin = Clients.generateDailyPin(client.clientID);
    if (pin !== client.pin) return error(res, "Invalid PIN", 400);

    // Create new session (always create new one)
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // expires in 6 hours
    const qrDataUrl = await generateQrDataUrl({ clientID: client.clientID });

    const sessionId = await Sessions.createSession({
      clientID: client.clientID,
      userName: userName || client.deceasedName || `client-${client.clientID}`,
      pin: client.pin,
      qrDataUrl,
      expiresAt
    });

    // Assign default role for client login
    const role = "User";

    // Respond with session info
    return success(res, {
      sessionId,
      clientID: client.clientID,
      userName: userName || client.deceasedName || `client-${client.clientID}`,
      deceasedName: client.deceasedName,
      chapelID: client.chapelID,
      chapelName: client.chapelName,
      role,
      packageNo: client.packageNo,
      packageName: client.packageName,
      token, // the tokenQr value used for login
      expiresAt
    }, "Login successful");

  } catch (e) {
    console.error("❌ ClientLogin Error:", e);
    return error(res, e.message || "Server error");
  }
};

// ----------------------PUT-------------------------

// ----------------------DELETE-------------------------

