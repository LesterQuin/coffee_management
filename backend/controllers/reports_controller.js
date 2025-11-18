import ReportsModel from "../models/reports_model.js";
import { success } from "../utils/response_helper.js";

// ----------------------GET-------------------------
export const getStatistics = async (req, res) => {
  try {
    const data = await ReportsModel.getOrderStatistics({});
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ Error fetching reports:", err);
    res.status(500).json({ success: false, message: "Failed to load report" });
  }
};

export const getSessionOrder = async (req, res) => {
  try {
    const data = await ReportsModel.getSessionOrderReports();
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ Error fetching session orders:", err);
    res.status(500).json({ success: false, message: "Failed to load report" });
  }
};

// ----------------------POST-------------------------

// ----------------------PUT-------------------------

// ----------------------DELETE-------------------------
