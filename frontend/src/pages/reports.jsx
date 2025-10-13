import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/auth_context";
import { jsPDF } from "jspdf";

export default function Reports() {
  const { token } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedChapel, setSelectedChapel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        "http://localhost:5000/api/reports/statistics",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
        }
      );
      setReport(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [token]);

  const downloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("📈 F&B Report", 10, 10);
    doc.setFontSize(12);

    // Overall
    doc.text(
      `Most Ordered Overall: ${report.overallMost?.productName || "-"} — ${report.overallMost?.totalOrders || 0} orders`,
      10,
      20
    );
    doc.text(
      `Least Ordered Overall: ${report.overallLeast?.productName || "-"} — ${report.overallLeast?.totalOrders || 0} orders`,
      10,
      30
    );

    let y = 40;
    const filteredChapel =
      selectedChapel && report.perChapel.length
        ? report.perChapel.filter((c) => c.chapelName === selectedChapel)
        : report.perChapel;

    filteredChapel.forEach((c) => {
      doc.setFontSize(14);
      doc.text(c.chapelName, 10, y);
      y += 6;
      doc.setFontSize(12);

      if (c.topProducts && c.topProducts.length > 0) {
        c.topProducts.forEach((p) => {
          doc.text(`${p.productName} — ${p.totalOrders}`, 12, y);
          y += 6;
        });
      } else {
        doc.text("No orders for this chapel", 12, y);
        y += 6;
      }
      y += 4;
    });

    doc.save("FNB_Report.pdf");
  };

  if (loading) return <p>Loading report...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!report) return <p>No data available</p>;

  const filteredChapel =
    selectedChapel && report.perChapel.length
      ? report.perChapel.filter((c) => c.chapelName === selectedChapel)
      : report.perChapel;

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-semibold mb-4">📈 Reports Overview</h2>

      {/* Overall stats */}
      <div className="space-y-1">
        <h3>
          Most Ordered Overall:{" "}
          <span className="font-bold text-green-600">
            {report.overallMost?.productName || "-"} — {report.overallMost?.totalOrders || 0} orders
          </span>
        </h3>
        <h3>
          Least Ordered Overall:{" "}
          <span className="font-bold text-red-600">
            {report.overallLeast?.productName || "-"} — {report.overallLeast?.totalOrders || 0} orders
          </span>
        </h3>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center mb-4">
        <label>
          Chapel:{" "}
          <select
            value={selectedChapel}
            onChange={(e) => setSelectedChapel(e.target.value)}
            className="border-[1px] p-1 rounded"
          >
            <option value="">All Chapels</option>
            {report.perChapel.map((c) => (
              <option key={c.chapelName} value={c.chapelName}>
                {c.chapelName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Start Date: 
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border-[1px] p-1 rounded"
          />
        </label>

        <label>
          End Date: 
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border-[1px] p-1 rounded"
          />
        </label>

        <button
          onClick={fetchReport}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Filter
        </button>

        <button
          onClick={downloadPDF}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          Download PDF
        </button>
      </div>

      {/* Per chapel stats */}
      <div className="space-y-4">
        {filteredChapel.map((c) => (
          <div key={c.chapelName}>
            <h4 className="font-semibold text-lg mb-1">{c.chapelName}</h4>
            {c.topProducts && c.topProducts.length > 0 ? (
              <table className="min-w-full border-collapse border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-1 text-left">Product</th>
                    <th className="border px-3 py-1 text-left">Total Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {c.topProducts.map((p) => (
                    <tr key={p.productName} className="hover:bg-gray-50">
                      <td className="border px-3 py-1">{p.productName}</td>
                      <td className="border px-3 py-1">{p.totalOrders?.toLocaleString() || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No orders for this chapel</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
