import React from "react";

const Card = ({ title, value }) => {
  return (
    <div style={{
      flex: "1",
      margin: "1rem",
      padding: "1rem",
      backgroundColor: "#fff",
      borderRadius: "0.5rem",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h3>{title}</h3>
      <p style={{ fontSize: "2rem", marginTop: "0.5rem" }}>{value}</p>
    </div>
  );
};

export default Card;
