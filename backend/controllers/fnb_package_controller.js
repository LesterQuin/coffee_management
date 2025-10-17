// controllers/fnb_package_controller.js
import * as Package from "../models/fnb_package_model.js";
import { success, error } from "../utils/response_helper.js";

// Get client + package info using QR PIN
export const getClientPackageByPin = async (req, res) => {
  try {
    const { pin } = req.params;
    if (!pin) return error(res, "QR PIN is required");

    const clientData = await Package.getClientPackageByPin(pin);
    if (!clientData) {
        return error(res, "Client not found or Invalid QR PIN");
    }
    const menu = await Package.getMenuByPackage(clientData.packageNo);

    return success (
        res,
        {
            client: {
                clientID: clientData.clientID,
                deceasedName: clientData.deceasedName,
                registerBy: clientData.registerBy,
                mobileNo: clientData.mobileNo,
                email: clientData.email,
                address: clientData.address,
                schedule_from: clientData.schedule_from,
                schedule_to: clientData.schedule_to,
                packageNo: clientData.packageNo,
                packageName: clientData.packageName,
                packageDescription: clientData.packageDescription,
                totalValue: clientData.totalValue,
                qrDataUrl: clientData.qrDataUrl,
                expires_at: clientData.expires_at,
            },
            menu,
        },
        "Client package and menu retrieved successfully"
    );
  } catch (e) {
    console.error("Error fetching package by PIN:", e);
    return error(res, "An error occured while fetching client package info");
  }
};
// Get all menu items for a specific package ID
export const getMenuByPackage = async (req, res) => {
  try{
    const { packageID } = req.params;

    if (!packageID) return error(res, "Package ID is required");

    const menu = await Package.getMenuByPackage(packageID);

    if (!menu || menu.length == 0) {
        return success(res, [], "No items found for this package");
    }
    return success(res, menu, "Package menu retrieved successfully");
  } catch (e){
    console.error("Error fetching package menu", e);
    return error(res, "An error occuredwhile fetching the package menu");
  }
};
