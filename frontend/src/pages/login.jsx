import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/auth_context";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/staff/login", {
        email,
        password,
      });

      if (res.data.success) {
        const token = res.data.data.token;
        let user = null;

        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          user = {
            email: payload.email,
            role: payload.role || "Admin",
            staffID: payload.staffID || null,
          };
        } catch (err) {
          console.warn("Failed to decode token payload:", err);
        }

        login(token, user);

        // Redirect based on role
        if (user?.role?.toLowerCase() === "cashier") {
          navigate("/cashier_dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(res.data.message || "Invalid credentials");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials"
      );
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-96 space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center mb-4">
          System Login
        </h2>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
