import axios from "axios";

const API_BASE = "http://localhost:3000/api"; // replace with your backend URL

// src/api/placeholder_api.js
export const testApi = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("This is a placeholder API");
    }, 500);
  });
};
