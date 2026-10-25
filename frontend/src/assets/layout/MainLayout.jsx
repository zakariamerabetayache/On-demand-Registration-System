import React, { useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Navigation from "./Navigation";
import Header from "./Header";
import useResponsive from "../hooks/useResponsive";
import { useStateContext } from "../contexts/ContextProvider";
import { useLanguage } from "../locale/LanguageContext";
import axiosClient from "../../axios-client";

export default function MainLayout() {
  const navigate = useNavigate();
  const { token, setUser, user } = useStateContext();
  const { isRTL, translate } = useLanguage();
  const { isMobile } = useResponsive();
  const userFetched = useRef(false);

  useEffect(() => {
    axiosClient
      .get("/user")
      .then((response) => {
        setUser(response.data);
        userFetched.current = true;
      })
      .catch(() => {
        // Fallback or handle auth failure if needed
      });
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Modern branded loading screen while user session is verifying
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xs">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white shadow-lg border border-slate-200/80">
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 36, color: "#059669" }} spin />}
          />
          <div className="flex flex-col items-center text-center">
            <span className="text-sm font-semibold text-slate-800">
              {translate("loading") || "جاري التحميل..."}
            </span>
            <span className="text-xs text-slate-400 mt-0.5">
              On-Demand Registration System
            </span>
          </div>
        </div>
      </div>
    );
  }

  const showSidebar = !isMobile && user?.role_id !== "party_member";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col"
    >
      <Header isMobile={isMobile} />

      <div className="flex flex-1 w-full relative">
        {user?.role_id !== "party_member" && <Navigation />}

        <main
          className={`flex-1 pt-20 transition-all duration-300 min-h-screen flex flex-col ${
            showSidebar
              ? isRTL
                ? "mr-64 w-[calc(100%-16rem)]"
                : "ml-64 w-[calc(100%-16rem)]"
              : "w-full"
          }`}
        >
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

