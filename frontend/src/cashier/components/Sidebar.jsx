import React from "react";

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 text-xl font-bold border-b border-gray-700">
        Cashier Panel
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {/* Chapel Dashboard */}
        <button
          onClick={() => setActiveTab("chapel")}
          className={`w-full text-left px-4 py-2 rounded-lg ${
            activeTab === "chapel"
              ? "bg-blue-600"
              : "hover:bg-gray-700 transition"
          }`}
        >
          Chapel Dashboard
        </button>

        {/* F&B Dashboard */}
        <button
          onClick={() => setActiveTab("fnb")}
          className={`w-full text-left px-4 py-2 rounded-lg ${
            activeTab === "fnb"
              ? "bg-green-600"
              : "hover:bg-gray-700 transition"
          }`}
        >
          F&B Dashboard
        </button>

        {/* Account Register */}
        <button
          onClick={() => setActiveTab("account")}
          className={`w-full text-left px-4 py-2 rounded-lg ${
            activeTab === "account"
              ? "bg-yellow-600"
              : "hover:bg-gray-700 transition"
          }`}
        >
          Account Register
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
