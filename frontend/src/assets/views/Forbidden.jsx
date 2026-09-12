import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../locale/LanguageContext";

const Forbidden = () => {
  const navigate = useNavigate();
  const { translate } = useLanguage();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
      }}
    >
      <Result
        status="403"
        title="403"
        subTitle={translate("forbidden_message") || "Sorry, you are not authorized to access this page."}
        extra={
          <Button type="primary" onClick={() => navigate("/")}>
            {translate("home") || "Back Home"}
          </Button>
        }
      />
    </div>
  );
};

export default Forbidden;
