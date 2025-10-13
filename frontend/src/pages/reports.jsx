// src/pages/Reports.jsx
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Reports() {
  const [chapel, setChapel] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // 📊 Placeholder stats (to replace with API data later)
  const stats = {
    perChapel: {
      mostOrdered: "Brewed Coffee",
      leastOrdered: "Iced Mocha",
    },
    overall: {
      mostOrdered: "Cappuccino",
      leastOrdered: "Espresso",
    },
  };

  // 📊 Placeholder graph data (example order counts)
  const chartData = [
    { name: "Brewed Coffee", orders: 45 },
    { name: "Latte", orders: 30 },
    { name: "Cappuccino", orders: 25 },
    { name: "Espresso", orders: 10 },
    { name: "Iced Mocha", orders: 5 },
  ];

  const handleFilter = () => {
    console.log("Filtering reports for:", chapel, dateRange);
    // Later we'll fetch API data here
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-semibold">📊 Reports</h1>

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <div>
          <label>Chapel:</label><br />
          <select
            value={chapel}
            onChange={(e) => setChapel(e.target.value)}
            className="p-1"
          >
            <option value="">All Chapels</option>
            <option value="1">Chapel A</option>
            <option value="2">Chapel B</option>
            <option value="3">Chapel C</option>
          </select>
        </div>

        <div>
          <label>From:</label><br />
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) =>
              setDateRange({ ...dateRange, from: e.target.value })
            }
            className="p-1"
          />
        </div>

        <div>
          <label>To:</label><br />
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) =>
              setDateRange({ ...dateRange, to: e.target.value })
            }
            className="p-1"
          />
        </div>

        <button onClick={handleFilter}>Filter</button>
      </div>

      {/* Results */}
      <div>
        <h2 className="text-lg font-semibold mt-4">Per Chapel</h2>
        <p>Most Ordered: {stats.perChapel.mostOrdered}</p>
        <p>Least Ordered: {stats.perChapel.leastOrdered}</p>

        <h2 className="text-lg font-semibold mt-4">Overall</h2>
        <p>Most Ordered: {stats.overall.mostOrdered}</p>
        <p>Least Ordered: {stats.overall.leastOrdered}</p>
      </div>

      {/* Bar Chart */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Orders Overview</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
