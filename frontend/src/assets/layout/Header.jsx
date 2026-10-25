import { useEffect, useState } from "react";
import { Select, Typography, Tag, Dropdown } from "antd";
import { useNavigate } from "react-router-dom";
import {
  LogoutOutlined,
  KeyOutlined,
  UserOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useLanguage } from "../locale/LanguageContext";
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../../axios-client";
import ErrorHandling from "../components/ErrorHandling";
import digitToDesignation from "../utils/digitToDesignation";
import logo from "../img/algeria.jpg";
import LogoDisplay from "./LogoDisplay";

export default function Header({ isMobile }) {
  const { isRTL, translate, changeLanguage, currentLanguage } = useLanguage();
  const [currentLang, setCurrentLang] = useState(currentLanguage);
  const { user, setUser, setToken } = useStateContext();
  const navigate = useNavigate();

  useEffect(() => {
    changeLanguage(currentLang);
  }, [currentLang]);

  const initials = `${user?.nom_fr?.charAt(0) || ""}${user?.prenom_fr?.charAt(0) || ""}`.toUpperCase() || "U";
  const fullName = isRTL
    ? `${user?.nom_ar || ""} ${user?.prenom_ar || ""}`.trim() || user?.email
    : `${user?.nom_fr || ""} ${user?.prenom_fr || ""}`.trim() || user?.email;

  const items = [
    {
      key: "profileHeader",
      label: (
        <div
          onClick={() => navigate("/profile")}
          className="p-2 flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors"
        >
          <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm ring-2 ring-emerald-100">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-slate-800 leading-tight">
              {fullName}
            </span>
            <span className="text-xs text-slate-500 truncate max-w-[180px]">
              {user?.email}
            </span>
            <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.5 w-fit">
              {digitToDesignation("role_id", user?.role_id)}
            </span>
          </div>
        </div>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "personalToken",
      label: (
        <div className="px-2 py-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <KeyOutlined className="text-slate-400" />
            <span>{translate("personal_token") || "الرمز الخاص"}</span>
          </div>
          <Tag color="cyan" className="font-mono text-xs font-semibold px-2 py-0.5 rounded">
            {user?.personal_token || "—"}
          </Tag>
        </div>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: translate("profile") || "الملف الشخصي",
      onClick: () => navigate("/profile"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined className="text-rose-500" />,
      danger: true,
      label: translate("logout") || "تسجيل الخروج",
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
    <header className="h-20 w-full fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] transition-all">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Logo & Organization Info */}
        <div className="flex items-center gap-3">
          <LogoDisplay user={user} defaultLogo={logo} />
        </div>

        {/* Right: Controls (Language + User Menu) */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Language Switcher */}
          <div className="relative">
            <Select
              value={currentLang}
              onChange={(e) => setCurrentLang(e)}
              className="w-28 text-xs font-medium"
              bordered={false}
              style={{
                backgroundColor: "rgba(241, 245, 249, 0.8)",
                borderRadius: "9999px",
                padding: "2px 4px",
              }}
              options={[
                { value: "ar", label: <span>🇩🇿 العربية</span> },
                { value: "fr", label: <span>🇫🇷 Français</span> },
                { value: "en", label: <span>🇺🇸 English</span> },
              ]}
            />
          </div>

          {/* User Profile Pill / Trigger */}
          <Dropdown
            menu={{ items }}
            trigger={["click"]}
            placement={isRTL ? "bottomLeft" : "bottomRight"}
            arrow
          >
            <button
              type="button"
              className="flex items-center gap-2.5 p-1.5 ltr:pr-3.5 rtl:pl-3.5 rounded-full bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/90 transition-all cursor-pointer shadow-xs group focus:outline-hidden"
            >
              <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm ring-2 ring-white">
                {initials}
              </div>

              <div className="hidden sm:flex flex-col text-left rtl:text-right">
                <span className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors max-w-[120px] truncate">
                  {fullName}
                </span>
                <span className="text-[10px] font-medium text-slate-500 leading-tight">
                  {digitToDesignation("role_id", user?.role_id)}
                </span>
              </div>

              <DownOutlined className="text-[10px] text-slate-400 group-hover:text-slate-600 transition-transform duration-200 group-hover:translate-y-0.5" />
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

