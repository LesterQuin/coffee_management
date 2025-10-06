import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard.jsx";
import Login from "./pages/login.jsx";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
};

export default App;
