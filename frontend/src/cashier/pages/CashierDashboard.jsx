import { useState } from "react";
import { useAuth } from "../../context/auth_context";
import Sidebar from "../components/Sidebar";
import ChapelDashboard from "./ChapelDashboard";
import FnbDashboard from "./FnBDashboard";
import AccountRegister from "./AccountRegister";

export default function CashierDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("chapel"); // default tab

  return (
    <div className="flex h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Cashier Dashboard — {user?.email}
        </h1>

        {activeTab === "chapel" && <ChapelDashboard />}
        {activeTab === "fnb" && <FnbDashboard />}
        {activeTab === "account" && <AccountRegister />}
      </div>
    </div>
  );
}
