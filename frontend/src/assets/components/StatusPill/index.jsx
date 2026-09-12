import React from "react";
import { useLanguage } from "../../locale/LanguageContext";
const StatusPill = ({ text, icon, color = "#27ae60", bg = "rgba(46, 204, 113, 0.15)" }) => {
  const { translate } = useLanguage();
  return (
    <span
      style={{
        padding: "2px 14px",
        borderRadius: "50px",
        background: bg,
        color: color,
        fontWeight: 600,
        fontSize: "0.95em",
        display: "inline-flex",
        minWidth: 60,
        textAlign: "center",
        border: `2px solid ${color}`,
        height: 35,
        alignItems: "center",
        justifyContent: "center",
        cursor: "default",
      }}
    >
      {icon && <span style={{ marginRight: 5 }}>{icon}</span>}
      {translate(text)}
    </span>
  );
};

export default StatusPill;
