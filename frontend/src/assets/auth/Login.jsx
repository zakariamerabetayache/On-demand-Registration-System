import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input, Button, Alert, Typography, Space, Divider } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../../axios-client";
import ErrorHandling from "../components/ErrorHandling";

const { Title, Text } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState(null);
  const { setUser, setToken } = useStateContext();

  const onSubmit = (e) => {
    e.preventDefault();

    const payload = { email, password };

    setErrors(null);
    const appmode = localStorage.getItem("appmode");
    console.log(payload);
    axiosClient
      .post(`/login/${appmode}`, payload)
      .then(({ data }) => {
        setUser(data.user);
        setToken(data.token);
      })
      .catch((err) => {
        ErrorHandling(err);
      });
  };

  const appmode = localStorage.getItem("appmode");

  const getModeColor = () => {
    switch (appmode) {
      case "0": return "#0284c7";
      case "1": return "#1F6F3A";
      case "2": return "#C81D18";
      default: return "#0284c7";
    }
  };

  const primaryColor = getModeColor();

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "350px",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${primaryColor}1a`,
        borderRadius: "16px",
        padding: "32px 28px",
        boxShadow: `0 10px 25px ${primaryColor}15, 0 4px 10px rgba(0, 0, 0, 0.05)`,
        transition: "all 0.3s ease",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <Title
          level={2}
          style={{
            margin: 0,
            color: "#1f2937",
            fontWeight: "700",
            fontSize: "26px",
            marginBottom: "6px",
          }}
        >
          تسجيل الدخول
        </Title>
        <Text
          style={{
            color: "#6b7280",
            fontSize: "14px",
            display: "block",
          }}
        >
          أدخل بياناتك للوصول إلى حسابك
        </Text>
      </div>

      <form onSubmit={onSubmit}>
        {/* Error Alert */}
        {errors && (
          <Alert
            message="خطأ في تسجيل الدخول"
            description={Object.keys(errors)
              .map((key) => errors[key][0])
              .join(" ")}
            type="error"
            showIcon
            style={{
              marginBottom: "18px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
            }}
          />
        )}

        {/* Email Input */}
        <div style={{ marginBottom: "16px" }}>
          <Text
            style={{
              display: "block",
              marginBottom: "6px",
              color: "#374151",
              fontWeight: "600",
              fontSize: "13px",
            }}
          >
            البريد الإلكتروني
          </Text>
          <Input
            size="middle"
            prefix={
              <UserOutlined style={{ color: "#9ca3af", fontSize: "14px" }} />
            }
            type="email"
            placeholder="أدخل بريدك الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              height: "42px",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = primaryColor;
              e.target.style.boxShadow = `0 0 0 3px ${primaryColor}1a`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#d1d5db";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: "20px" }}>
          <Text
            style={{
              display: "block",
              marginBottom: "6px",
              color: "#374151",
              fontWeight: "600",
              fontSize: "13px",
            }}
          >
            كلمة المرور
          </Text>
          <Input.Password
            size="middle"
            prefix={
              <LockOutlined style={{ color: "#9ca3af", fontSize: "14px" }} />
            }
            placeholder="أدخل كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              height: "42px",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = primaryColor;
              e.target.style.boxShadow = `0 0 0 3px ${primaryColor}1a`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#d1d5db";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Login Button */}
        <Button
          type="primary"
          htmlType="submit"
          size="middle"
          block
          style={{
            height: "44px",
            borderRadius: "8px",
            background: primaryColor,
            border: "none",
            fontSize: "15px",
            fontWeight: "600",
            marginBottom: "12px",
            boxShadow: `0 2px 8px ${primaryColor}33`,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = `0 4px 12px ${primaryColor}4d`;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = `0 2px 8px ${primaryColor}33`;
          }}
        >
          تسجيل الدخول
        </Button>

        <Divider style={{ margin: "16px 0", borderColor: "#e5e7eb" }}>
          <Text style={{ color: "#9ca3af", fontSize: "12px" }}>أو</Text>
        </Divider>

        {/* Back to Home Button */}


        <Button
          type="default"
          size="middle"
          block
          style={{
            height: "44px",
            borderRadius: "8px",
            // border: "1px solid #d1d5db",
            fontSize: "14px",
            fontWeight: "500",
            color: "#6b7280",
            backgroundColor: "white",
            transition: "all 0.3s ease",
            marginTop: "20px",
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = primaryColor;
            e.target.style.color = primaryColor;
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "#d1d5db";
            e.target.style.color = "#6b7280";
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
              width: "100%",
            }}
          >
            العودة إلى الصفحة الرئيسية
          </Link>
        </Button>
      </form>
    </div>
  );
}
