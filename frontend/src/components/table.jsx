import React from "react";

const Table = ({ data }) => {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
      <thead>
        <tr style={{ backgroundColor: "#f3f4f6" }}>
          {Object.keys(data[0] || {}).map((key) => (
            <th key={key} style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{key}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {Object.values(row).map((val, idx) => (
              <td key={idx} style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{val}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
