import React, { useEffect, useState, useRef } from "react";
import { Navigate, Outlet, useNavigate ,Link } from "react-router-dom";
import { useStateContext } from "../contexts/ContextProvider";
import { useLanguage } from "../locale/LanguageContext";
import axiosClient from "../../axios-client";
import { Spin ,Button, } from "antd";
import Header from "./Header";
import Navigation from "./Navigation";
import useResponsive from "../hooks/useResponsive";

const ParentLayout = () => {
  const navigate = useNavigate();
  const { token, setUser, user, setToken } = useStateContext();
  const { translate, changeLanguage, currentLanguage, isRTL } = useLanguage();
  const { isMobile } = useResponsive();

  // useEffect(() => {
  //   if (!token) {
  //     navigate("/login");
  //   }
  // }, [token, navigate]);

 



  const contentStyle = {
    minHeight: "calc(100vh - 80px)",
    marginTop: "80px",
    direction: isRTL ? "rtl" : "ltr",
    marginLeft: !isMobile && !isRTL ? "256px" : "0",
    marginRight: !isMobile && isRTL ? "256px" : "0",
    padding: "5px 10px 5px",
    width: isMobile ? "100%" : "calc(100% - 256px)",
  };

  // At this point, user is guaranteed to exist and be a parent (checked by ProtectedRoute)

  // Check if parent account is approved
  if (user.state === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Floating background elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          animation: 'float 4s ease-in-out infinite reverse'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '20%',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          animation: 'float 5s ease-in-out infinite'
        }} />
        
        {/* Main content card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '60px 40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V19C3 20.1 3.9 21 5 21H11V19H5V3H13V9H21ZM14 15.5C14 14.12 15.12 13 16.5 13S19 14.12 19 15.5 17.88 18 16.5 18 14 16.88 14 15.5ZM16.5 19C18.43 19 20 17.43 20 15.5S18.43 12 16.5 12 13 13.57 13 15.5 14.57 19 16.5 19Z" fill="white"/>
            </svg>
          </div>
          
          {/* Title */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#2d3748',
            marginBottom: '16px',
            letterSpacing: '-0.5px'
          }}>
            {translate("account_pending_approval")}
          </h1>
          
          {/* Description */}
          <p style={{
            fontSize: '16px',
            color: '#718096',
            lineHeight: '1.6',
            marginBottom: '40px',
            maxWidth: '400px',
            margin: '0 auto 40px'
          }}>
            {translate("we_will_review_your_request")}
          </p>
          
          {/* Status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #fef5e7, #fed7aa)',
            borderRadius: '12px',
            border: '1px solid #fed7aa'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#f59e0b',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#92400e'
            }}>
              {translate("status_under_review") || "Under Review"}
            </span>
          </div>
          
          {/* Contact info */}
          
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
            e.target.style.borderColor = "#3b82f6";
            e.target.style.color = "#3b82f6";
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
        </div>
      
        
        {/* CSS animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Header isMobile={isMobile} />
      <div
        style={{
          display: "flex",
          direction: isRTL ? "rtl" : "ltr",
        }}
      >
        <Navigation />
        <main style={contentStyle}>
          <Outlet />
        </main>
      </div>
    </>
  );


  
};

export default ParentLayout;
