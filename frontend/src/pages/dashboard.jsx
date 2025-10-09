import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="page-container">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
        <p>Welcome to the admin dashboard! Select a module from the sidebar.</p>
      </div>
    </div>
  );
}
