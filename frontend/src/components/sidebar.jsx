import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div style={{
      width: "220px",
      height: "100vh",
      backgroundColor: "#1f2937",
      color: "#fff",
      padding: "1rem",
      position: "fixed"
    }}>
      <h2>Coffee Shop</h2>
      <nav style={{ marginTop: "2rem" }}>
        <Link to="/dashboard" style={{ display: "block", margin: "1rem 0", color: "#fff" }}>Dashboard</Link>
        <Link to="/dashboard/chapels" style={{ display: "block", margin: "1rem 0", color: "#fff" }}>Chapels</Link>
        <Link to="/dashboard/clients" style={{ display: "block", margin: "1rem 0", color: "#fff" }}>Clients</Link>
        <Link to="/dashboard/orders" style={{ display: "block", margin: "1rem 0", color: "#fff" }}>Orders</Link>
        <Link to="/dashboard/fnb" style={{ display: "block", margin: "1rem 0", color: "#fff" }}>Food and Beverages</Link>
      </nav>
    </div>
  );
};

export default Sidebar;
