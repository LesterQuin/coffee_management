import * as Model from "../models/default_package_model.js";
import { success, error } from "../utils/response_helper.js";

export const getDefaultPackage = async (req, res) => {
  try {
    const row = await Model.fetchLatestDefaultPackage();
    if (!row) return success(res, null, "No default package set");
    return success(res, { packageID: row.packageID, defaultID: row.defaultID, createdAt: row.createdAt }, "Default package fetched");
  } catch (e) {
    console.error("❌ getDefaultPackage error:", e);
    return error(res, e.message || "Server error");
  }
};

export const getDefaultPackageItems = async (req, res) => {
  try {
    const row = await Model.fetchLatestDefaultPackage();
    if (!row) return success(res, null, "No default package set");

    const packageInfo = await Model.getPackageById(row.packageID);
    const items = await Model.getPackageItems(row.packageID);

    return success(res, { package: packageInfo, items }, "Default package items fetched");
  } catch (e) {
    console.error("❌ getDefaultPackageItems error:", e);
    return error(res, e.message || "Server error");
  }
};

export const setDefaultPackage = async (req, res) => {
  try {
    const packageID = parseInt(req.params.packageID, 10);
    if (isNaN(packageID)) return error(res, "Invalid packageID", 400);

    const result = await Model.insertDefaultPackageRow(packageID);
    return success(res, { newDefaultID: result.defaultID, packageID: result.packageID }, "Default package set (latest row)");
  } catch (e) {
    console.error("❌ setDefaultPackage error:", e);
    return error(res, e.message || "Server error");
  }
};
