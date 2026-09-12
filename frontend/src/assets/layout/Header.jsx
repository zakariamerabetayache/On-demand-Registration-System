import { useEffect, useState } from "react";

import { Select, Badge, Button, Modal, List, Typography, Tag, Upload, message } from "antd";
import { useNavigate, Link } from "react-router-dom";
import { Avatar, Dropdown } from "antd";
import { UserOutlined, ToolOutlined, LogoutOutlined, BellOutlined, FileTextOutlined, UploadOutlined, CheckCircleOutlined, CalendarOutlined } from "@ant-design/icons";
import { useLanguage } from "../locale/LanguageContext";
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../../axios-client";
import ErrorHandling from "../components/ErrorHandling";
import digitToDesignation from "../utils/digitToDesignation";
import logo from "../img/algeria.jpg"
import LogoDisplay from "./LogoDisplay";
import UploadFile from "../components/uploadComponent/UploadFile";

export default function Header({ isMobile }) {
  const { isRTL, translate, changeLanguage, currentLanguage } = useLanguage();
  const [currentLang, setCurrentLang] = useState(currentLanguage);
  const { user, setUser, setToken } = useStateContext();



  useEffect(() => {
    changeLanguage(currentLang);
  }, [currentLang]);

  const headerStyle = {
    height: 80,
    backgroundColor: "#f8f9fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    borderBottom: "1px solid #e9ecef",
    width: "100%",
    float: isRTL ? "left" : "right",
    position: "fixed",
    zIndex: 99,
  };


  const ProfileDropdown = () => {
    const navigate = useNavigate();

    return (
      <div
        style={{
          cursor: "pointer",
          display: "flex",
          minWidth: "200px",
          fontWeight: "600",
        }}
        onClick={() => navigate("/profile")}
      >
        <Avatar
          size="large"
          src={undefined}
          style={{
            color: "#f56a00",
            backgroundColor: "#fde3cf",
            boxShadow: "rgba(150, 190, 238, 0.35) 0px 0px 6px 1px",
            marginRight: 30,
          }}
        >
          {user?.nom_fr?.charAt(0).toUpperCase()}
          {user?.prenom_fr?.charAt(0).toUpperCase()}
        </Avatar>
        <div style={{ float: "left", display: "inline", paddingLeft: "15px" }}>
          <p>
            {isRTL
              ? `${user?.nom_ar?.toUpperCase()} ${user?.prenom_ar?.toUpperCase()}`
              : `${user?.nom_fr?.toUpperCase()} ${user?.prenom_fr?.toUpperCase()}`}
          </p>
          <p> {user?.email}</p>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "10px",
              color: "#2e7d32", // green text
              backgroundColor: "#fff9d5", // light yellow background
              border: "1px solid #fbc02d", // stronger yellow border
              padding: "2px 5px",
              borderRadius: "5px",
              marginTop: "6px",
              marginBottom: "6px",
              display: "inline-block",
              minWidth: "100px",
              textAlign: "center",
            }}
          >
            {digitToDesignation("role_id", user?.role_id)}
          </span>
        </div>
      </div>
    );
  };

  ;

  const items = [
    {
      label: <ProfileDropdown />,
      key: "ProfileDropdown",
    },
    {
      type: "divider",
    },
    {
      key: "personalToken",
      label: (
        <div style={{ padding: '4px 12px' }}>
          <Typography.Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            {translate('personal_token') || 'الرمز الخاص'}
          </Typography.Text>
          <Tag color="blue" style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {user?.personal_token}
          </Tag>
        </div>
      ),
    },
    {
      type: "divider",
    },

    {
      icon: <LogoutOutlined />,
      key: "logout",
      label: translate("logout"),
      onClick: () => {
        axiosClient
          .post(`/logout`)
          .then(() => {
            setUser(null);
            setToken(null);
          })
          .catch((err) => {
            ErrorHandling(err);
          });
      },
    },
  ];

  return (
    <header style={headerStyle}>
      <div>
        <LogoDisplay user={user} defaultLogo={logo} />
      </div>

      <div
        style={{
          minWidth: user?.role_id === 'parent' ? "280px" : "220px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          position: "relative",
        }}
      >
        <div>
          <Select
            value={currentLang}
            defaultValue="ar"
            style={{ width: "100px", fontSize: "12px" }}
            options={[
              {
                value: "ar",
                label: <span>🇸🇦 العربية</span>,
              },
              {
                value: "en",
                label: <span>🇺🇸 English</span>,
              },
              {
                value: "fr",
                label: <span>🇫🇷 Français</span>,
              },
            ]}
            onChange={(e) => setCurrentLang(e)}
          ></Select>
        </div>

        <Dropdown
          menu={{
            items,
          }}
          trigger={["click"]}
          placement="bottomRight"
          style={{
            width: "280px",
            // float: "right",
            fontWeight: "bold",
          }}
        >
          {/* <Badge dot> */}
          <Avatar
            src={undefined}
            style={{
              fontWeight: "bold",
              color: "#f56a00",
              backgroundColor: "#fde3cf",
              boxShadow: "rgba(150, 190, 238, 0.35) 0px 0px 10px 2px",
              //   float: "right",
              cursor: "pointer",
              position: "absolute",
              ...(!isRTL ? { right: 0 } : { left: 0 }),
            }}
            size="large"
          >
            {user?.nom_fr?.charAt(0).toUpperCase()}
            {user?.prenom_fr?.charAt(0).toUpperCase()}
          </Avatar>
          {/* </Badge> */}
        </Dropdown>
      </div>

    </header>
  );
}
