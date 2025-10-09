import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const menu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Staff", path: "/staff" },
    { name: "Chapel", path: "/chapel" },
    { name: "F&B", path: "/fnb" },
    { name: "Reports", path: "/reports" },
  ];

  return (
    <div className="w-64 h-screen bg-gray-900 text-white flex flex-col">
      <h2 className="text-2xl font-bold p-4 border-b border-gray-700">Admin</h2>
      <nav className="flex-1 p-4">
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `block py-2 px-3 rounded hover:bg-gray-700 ${
                isActive ? "bg-gray-700 font-semibold" : ""
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
