import React, { useEffect, useState } from "react";
import Sidebar from "../components/sidebar.jsx";
import Card from "../components/card.jsx";
import Table from "../components/table.jsx";
import { testApi } from "../api/placeholder_api.jsx";

const Dashboard = () => {
  const [overview, setOverview] = useState({
    chapels: 0,
    clients: 0,
    orders: 0,
    fnb: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    // Mock data, replace with API calls
    setOverview({ chapels: 5, clients: 12, orders: 34, fnb: 50 });
    setRecentOrders([
      { orderID: 101, clientName: "John Doe", total: "$20", status: "Pending" },
      { orderID: 102, clientName: "Jane Smith", total: "$35", status: "Completed" },
      { orderID: 103, clientName: "Bob Lee", total: "$15", status: "Pending" }
    ]);
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "220px", padding: "2rem", width: "100%" }}>
        <h1>Dashboard</h1>
        <div style={{ display: "flex" }}>
          <Card title="Chapels" value={overview.chapels} />
          <Card title="Clients" value={overview.clients} />
          <Card title="Orders" value={overview.orders} />
          <Card title="Food and Beverages" value={overview.fnb} />
        </div>
        <h2>Recent Orders</h2>
        <Table data={recentOrders} />
      </div>
    </div>
  );
};

export default Dashboard;
