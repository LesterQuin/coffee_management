import { Link, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="w-64 h-screen bg-gray-800 text-white flex flex-col">
      <div className="p-4 text-2xl font-bold border-b border-gray-700">Admin Panel</div>
      <nav className="flex-1 p-4 space-y-2">
        <Link to="/dashboard" className="block p-2 rounded hover:bg-gray-700">Dashboard</Link>
        <Link to="/staff" className="block p-2 rounded hover:bg-gray-700">Staff</Link>
        <Link to="/chapel" className="block p-2 rounded hover:bg-gray-700">Chapel</Link>
        <Link to="/fnb" className="block p-2 rounded hover:bg-gray-700">F&B</Link>
        <Link to="/clients" className="block p-2 rounded hover:bg-gray-700">Clients</Link>
        <Link to="/reports" className="block p-2 rounded hover:bg-gray-700">Reports</Link>
      </nav>
      <button 
        onClick={handleLogout}
        className="m-4 bg-red-500 hover:bg-red-600 p-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
