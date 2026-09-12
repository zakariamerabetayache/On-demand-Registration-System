import React, { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useStateContext } from "../contexts/ContextProvider";
import { useLanguage } from "../locale/LanguageContext";
import { QRCode, Typography, Card, Space, Divider } from "antd";
import {
  SafetyOutlined,
  TeamOutlined,
  BookOutlined,
  SmileOutlined,
  FileTextOutlined,
  BankOutlined,
  EnvironmentOutlined,
  BuildOutlined,
  UserOutlined,
  FileDoneOutlined,
  SettingOutlined,
  LinkOutlined,
  IdcardOutlined,
  FolderOutlined,
  GlobalOutlined
} from "@ant-design/icons";
import useResponsive from "../hooks/useResponsive";

const { Title, Paragraph, Text } = Typography;
export default function GuestLayout() {
  const { translate } = useLanguage();
  const { isMobile: isSmallScreen } = useResponsive();
  const handleAppModeChange = () => {
    const appmode = localStorage.getItem("appmode");
    switch (appmode) {
      case "0":
        return {
          title: translate("general_data") || "General Data",
          subtitle: translate("administration") || "Administration",
          icon: <GlobalOutlined />,
          color: "#0284c7",
          bgGradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
          description: translate("admin_card_desc") || "Manage national data, establishments, and system users",
          features: [
            { icon: <EnvironmentOutlined />, text: translate("wilayas_communes") || "Wilayas & Communes" },
            { icon: <BuildOutlined />, text: translate("establishments") || "Establishments" },
            { icon: <UserOutlined />, text: translate("users_management") || "Users Management" }
          ]
        };
      case "1":
        return {
          title: translate("party_management") || "Party Management",
          subtitle: translate("national_wilaya_admin") || "National & Wilaya Admin",
          icon: <TeamOutlined />,
          color: "#1F6F3A",
          bgGradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          description: translate("party_admin_desc") || "Approve new members and manage party operations",
          features: [
            { icon: <FileDoneOutlined />, text: translate("member_approval") || "Member Approval" },
            { icon: <SettingOutlined />, text: translate("wilaya_management") || "Wilaya Management" },
            { icon: <LinkOutlined />, text: translate("referral_tracking") || "Referral Tracking" }
          ]
        };
      case "2":
        return {
          title: translate("member_portal") || "Member Portal",
          subtitle: translate("party_members") || "Party Members",
          icon: <IdcardOutlined />,
          color: "#C81D18",
          bgGradient: "linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)",
          description: translate("member_portal_desc") || "Access your member dashboard and invite others",
          features: [
            { icon: <UserOutlined />, text: translate("member_profile") || "Member Profile" },
            { icon: <LinkOutlined />, text: translate("referral_link") || "Referral Link" },
            { icon: <FolderOutlined />, text: translate("member_resources") || "Resources" }
          ]
        };
      default:
        return {
          title: translate("welcome_to_party") || "Welcome to the Party",
          subtitle: translate("party_name") || "National Algerian Party",
          icon: <GlobalOutlined />,
          color: "#0284c7",
          bgGradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
          description: translate("party_hero_description") || "Join us and be part of the positive change in Algeria.",
          features: []
        };
    }
  };

  const { token } = useStateContext();

  if (token) {
    const appmode = localStorage.getItem("appmode");
    // All authenticated users go to the main layout
    // The actual content will be controlled by their permissions
    return <Navigate to={"/mainLayout"} />;
  }

  const appModeData = handleAppModeChange();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: !isSmallScreen ? "row" : "column-reverse",
        backgroundColor: "#f9f9f9",
        minHeight: "100vh",
      }}
    >
      {/* Login Form Section */}
      <div
        style={{
          flexBasis: !isSmallScreen ? "50%" : "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          backgroundColor: "#fff",
        }}
      >
        <div style={{ maxWidth: "400px", width: "100%" }}>
          <Outlet />
          {/* {isSmallScreen && (
            <div style={{ padding: "0 70px" }}>
              <QRCode
                value={window.location.href}
                style={{
                  width: "100px",
                  height: "100px",
                  margin: "40px auto 20px",
                }}
              />
              <p
                style={{
                  fontSize: "0.9rem",
                  textAlign: "center",
                  margin: "0px auto 20px",
                }}
              >
                {translate("scan_to_visit")} {window.location.href}
              </p>
            </div>
          )} */}
        </div>
      </div>

      {/* Info and Image Section */}
      <div
        style={{
          flexBasis: !isSmallScreen ? "50%" : "100%",
          padding: "40px 30px",
          background: appModeData?.bgGradient || "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "200px",
            height: "200px",
            background: `${appModeData?.color}1a` || "rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            zIndex: 0
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30px",
            left: "-30px",
            width: "150px",
            height: "150px",
            background: `${appModeData?.color}0d` || "rgba(255, 255, 255, 0.05)",
            borderRadius: "50%",
            zIndex: 0
          }}
        />

        {appModeData && (
          <div style={{ zIndex: 1, textAlign: "center", maxWidth: "90%" }}>
            {/* Logo/Icon */}
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "rgba(255, 255, 255, 0.9)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                fontSize: "32px",
                color: appModeData.color
              }}
            >
              {appModeData.icon}
            </div>

            {/* Title */}
            <Title
              level={1}
              style={{
                color: appModeData.color,
                fontSize: "2.5rem",
                fontWeight: "700",
                marginBottom: "8px",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
              }}
            >
              {appModeData.title}
            </Title>

            {/* Subtitle */}
            <Text
              style={{
                fontSize: "1.1rem",
                color: "rgba(0, 0, 0, 0.7)",
                fontWeight: "500",
                display: "block",
                marginBottom: "24px"
              }}
            >
              {appModeData.subtitle}
            </Text>

            {/* Description */}
            <Paragraph
              style={{
                fontSize: "1rem",
                color: "rgba(0, 0, 0, 0.8)",
                lineHeight: "1.6",
                marginBottom: "32px",
                textAlign: "center"
              }}
            >
              {appModeData.description}
            </Paragraph>

            {/* Features */}
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {appModeData.features.map((feature, index) => (
                <Card
                  key={index}
                  size="small"
                  style={{
                    background: "rgba(255, 255, 255, 0.8)",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                    backdropFilter: "blur(10px)"
                  }}
                  bodyStyle={{ padding: "16px" }}
                >
                  <Space align="center">
                    <div
                      style={{
                        color: appModeData.color,
                        fontSize: "18px",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      {feature.icon}
                    </div>
                    <Text
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: "500",
                        color: "rgba(0, 0, 0, 0.8)"
                      }}
                    >
                      {feature.text}
                    </Text>
                  </Space>
                </Card>
              ))}
            </Space>

            {/* QR Code Section */}
            {!isSmallScreen && (
              <>
                <Divider style={{ margin: "32px 0 24px", borderColor: "rgba(255, 255, 255, 0.3)" }} />
                {/* <div
                  style={{
                    background: "rgba(255, 255, 255, 0.9)",
                    padding: "20px",
                    borderRadius: "16px",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)"
                  }}
                >
                  <QRCode
                    value={window.location.href}
                    size={100}
                    style={{ margin: "0 auto 12px" }}
                  />
                  <Text
                    style={{
                      fontSize: "0.85rem",
                      color: "rgba(0, 0, 0, 0.6)",
                      display: "block",
                      textAlign: "center"
                    }}
                  >
                    {translate("scan_to_access_mobile")}
                  </Text>
                </div> */}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
