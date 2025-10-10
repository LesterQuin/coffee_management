export default function Unauthorized() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
      <p className="text-gray-700">You do not have permission to view this page.</p>
    </div>
  );
}
