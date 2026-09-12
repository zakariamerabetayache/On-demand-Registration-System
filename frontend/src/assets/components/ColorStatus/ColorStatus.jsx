import { useState, useEffect } from "react";
import HoverableDiv from "../../components/HoverableDiv/HoverableDiv";
import statusColors from "../../components/HoverableDiv/statusColors";
import { useStateContext } from "../../contexts/ContextProvider";

export default function ColorStatus({ onButtonClick, config }) {
  const [countItem, setCountItem] = useState({});
  const { user } = useStateContext();


  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const counts = await config.loadCount(user?.etablissement_id);
        setCountItem(counts);
        console.log("counts", JSON.stringify(counts));
      } catch (error) {
        console.error("Error loading counts:", error);
      }
    };

    fetchCounts();
  }, [config]);

  return (
    <div
      style={{
        width: "100%",
        padding: "6px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "end",
        gap: "16px",
        backgroundColor: "#fafafa",
        borderRadius: "6px",
        marginBottom: "6px",
      }}
    >
      {config.statusOptions.map((status, index) => (
        <div key={`status-${status.label}-${index}`} style={{ display: 'contents' }}>
          <div style={{ width: "140px" }}>
            <HoverableDiv
              key={`${status.label}-${index}`}
              count={countItem[status.label]}
              percent={`${countItem["all"] > 0
                ? (Number(countItem[status.label] || 0) * 100) /
                Number(countItem["all"])
                : 0
                }%`}
              no_percentage_count={status.no_percentage_count}
              no_clicking={status.no_clicking}
              label={status.label}
              initialColor={status.initialColor}
              hoverColor={status.hoverColor}
              onChange={() => !status.no_clicking && onButtonClick(status.filter, status.filterValue ? status.filterValue : status.label)}
              labelFontSize="12px"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
