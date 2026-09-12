import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../locale/LanguageContext";
import Navigation from "./Navigation";
import { Outlet, useNavigate } from "react-router-dom";
import { Select, Spin } from "antd";
import Header from "./Header";
import useResponsive from "../hooks/useResponsive";
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../../axios-client";
export default function MainLayout() {
  const navigate = useNavigate();
  const { token, setUser, user, setToken } = useStateContext();
  const { translate, changeLanguage, currentLanguage, isRTL } = useLanguage();
  const { isMobile } = useResponsive();
  const userFetched = useRef(false);

  useEffect(() => {
    axiosClient.get("/user").then((response) => {
      setUser(response.data);
      userFetched.current = true;
    })
  }, []);
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);




  // Show fullscreen loading spinner while user data is loading
  // if (!user) {
  //   return (
  //     <div
  //       style={{
  //         position: "fixed",
  //         top: 0,
  //         left: 0,
  //         width: "100vw",
  //         height: "100vh",
  //         display: "flex",
  //         justifyContent: "center",
  //         alignItems: "center",
  //         backgroundColor: "#f0f2f5",
  //         zIndex: 9999,
  //       }}
  //     >
  //       <Spin size="large" fullscreen />
  //     </div>
  //   );
  // }

  const showSidebar = !isMobile && user?.role_id !== 'party_member';

  const contentStyle = {
    minHeight: "calc(100vh - 80px)",
    marginTop: "80px",
    direction: isRTL ? "rtl" : "ltr",
    marginLeft: showSidebar && !isRTL ? "256px" : "0",
    marginRight: showSidebar && isRTL ? "256px" : "0",
    padding: "5px 10px 5px",
    width: showSidebar ? "calc(100% - 256px)" : "100%",
  };



  return (
    <>
      {!user?.id ? (<Spin fullscreen />) : (
        <>
          <Header isMobile={isMobile} />
          <div
            style={{
              display: "flex",
              direction: isRTL ? "rtl" : "ltr",
            }}
          >
            {user?.role_id !== 'party_member' && <Navigation />}
            <main style={contentStyle}>
              <Outlet />
            </main>
          </div>
        </>)}
    </>
  );
}
