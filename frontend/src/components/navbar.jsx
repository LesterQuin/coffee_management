export default function Navbar({ onLogout }) {
  return (
    <div className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">LQ Admin Dashboard</h1>
      <button
        onClick={onLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}
