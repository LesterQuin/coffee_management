import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:4000/api", // adjust your backend port
  headers: { "Content-Type": "application/json" },
});

// Attach token if available
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;
