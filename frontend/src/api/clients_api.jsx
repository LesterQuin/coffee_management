import axios from "axios";

const API_BASE = "http://localhost:5000/api"; // your backend

export const clientLogin = async (userName, pin) => {
  const { data } = await axios.post(`${API_BASE}/sessions/client-login`, {
    userName,
    pin
  });
  return data;
};
