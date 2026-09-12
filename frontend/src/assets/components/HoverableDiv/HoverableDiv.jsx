import React, { useState } from "react";
import { useLanguage } from "../../locale/LanguageContext";

export default function HoverableDiv({
  count,
  label,
  initialColor,
  hoverColor,
  onChange,
  labelFontSize,
  percent,
  active,
  no_percentage_count = true,
}) {
  const { translate } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  // Format count to have only one number after the decimal if it's a number or contains a percentage
  let displayPercent = percent;
  if (typeof percent === "string" && percent.includes("%")) {
    // Extract the number before % and format it
    displayPercent = percent.replace(
      /(\d+\.?\d*)%?/,
      (match, num) => `${parseFloat(num).toFixed(1)}%`
    );
  } else if (!isNaN(percent) && percent !== null && percent !== undefined) {
    displayPercent = `${parseFloat(percent).toFixed(1)}%`;
  }

  return (
    <div
      style={{
        backgroundColor: (isHovered || active) ? hoverColor : initialColor,
        color: "white",
        width: 140,
        textAlign: "center",
        height: 40,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 5px",
        fontWeight: "bold",
        cursor: "pointer",
        padding: "25px 0",
        transition: "all 0.3s ease",
        position: "relative",
        boxShadow: active ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
        transform: active ? "scale(1.05)" : "scale(1)",
        border: active ? "2px solid white" : "2px solid transparent",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onChange}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onChange()}
    >
      <div
        style={{
          padding: "0 5px",
          fontSize: labelFontSize || "13px",
          width: "80px",
          textAlign: "center",
          lineHeight: "1.2",
        }}
      >
        {translate(label)}
      </div>
      <div
        style={{
          fontSize: 10,
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderRadius: 50,
          padding: "8px 5px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "45px",
          height: "45px",
          textAlign: "center",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: "800" }}>{count || 0}</span>
        {displayPercent && !no_percentage_count && (
          <span style={{ fontSize: 9, opacity: 0.9 }}>{displayPercent}</span>
        )}
      </div>
    </div>
  );
}
