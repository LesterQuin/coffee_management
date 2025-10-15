import React from "react";
import ReactDOM from "react-dom/client";
import CashierDashboard from "./pages/CashierDashboard";
import { AuthProvider } from "../../context/auth_context"; // adjust relative path
import "./styles/cashier.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <CashierDashboard />
  </AuthProvider>
);
