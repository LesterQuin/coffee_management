import axios from "axios";

const BASE_URL = "/api/sessions";

export const clientLogin = async (userName, pin) => {
  const res = await axios.post(`${BASE_URL}/client-login`, { userName, pin });
  return res.data;
};
