import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={{ padding: "1rem", backgroundColor: "#333", color: "#fff" }}>
      <Link to="/dashboard" style={{ color: "#fff", marginRight: "1rem" }}>
        Dashboard
      </Link>
      <Link to="/" style={{ color: "#fff" }}>
        Logout
      </Link>
    </nav>
  );
};

export default Navbar;
