import ReportsModel from "../models/reports_model.js";

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

// ----------------------POST-------------------------

// ----------------------PUT-------------------------

// ----------------------DELETE-------------------------
