import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Drawer } from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  BankOutlined,
  BuildOutlined,
  TeamOutlined,
  SettingOutlined,
  MenuOutlined,
  CloseOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useStateContext } from "../contexts/ContextProvider";
import { useLanguage } from "../locale/LanguageContext";
import useResponsive from "../hooks/useResponsive";
import LogoDisplay from "./LogoDisplay";
import logo from "../img/algeria.jpg";

export default function Navigation() {
  const { isMobile } = useResponsive();
  return isMobile ? <MobileSidebar /> : <Sidebar />;
}

function NavLinks({ onItemClick }) {
  const { user } = useStateContext();
  const location = useLocation();
  const { translate, isRTL } = useLanguage();

  const menuItems = [
    {
      key: "party_members",
      path: "/mainLayout/party-members",
      icon: <TeamOutlined className="text-base" />,
      label:
        user?.etablissement?.type === "party"
          ? translate("party_members")
          : translate("association_members"),
      roles: ["national_admin", "wilaya_admin"],
      category: "main",
    },
    {
      key: "users",
      path: "/mainLayout/users",
      icon: <UserOutlined className="text-base" />,
      label: translate("users"),
      roles: ["admin", "national_admin"],
      category: "administration",
    },
    {
      key: "wilayas",
      path: "/mainLayout/wilayas",
      icon: <BankOutlined className="text-base" />,
      label: translate("wilayas"),
      roles: ["admin"],
      category: "administration",
    },
    {
      key: "communes",
      path: "/mainLayout/communes",
      icon: <EnvironmentOutlined className="text-base" />,
      label: translate("communes"),
      roles: ["admin"],
      category: "administration",
    },
    {
      key: "etablissements",
      path: "/mainLayout/etablissements",
      icon: <BuildOutlined className="text-base" />,
      label: translate("etablissements"),
      roles: ["admin"],
      category: "administration",
    },
    {
      key: "parameters",
      path: "/mainLayout/parameters",
      icon: <SettingOutlined className="text-base" />,
      label: translate("establishment_parameters"),
      roles: ["national_admin"],
      category: "administration",
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.roles.includes(user?.role_id)
  );

  const categories = [
    { key: "main", label: translate("main") || "الرئيسية" },
    { key: "administration", label: translate("administration") || "الإدارة" },
  ];

  return (
    <div className="flex flex-col gap-6 p-3">
      {categories.map((cat) => {
        const catItems = filteredItems.filter((item) => item.category === cat.key);
        if (catItems.length === 0) return null;

        return (
          <div key={cat.key} className="flex flex-col gap-1">
            <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {cat.label}
            </span>
            <div className="flex flex-col gap-1 mt-1">
              {catItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    onClick={onItemClick}
                    className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-100/90 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                  >
                    {/* Active accent pill indicator */}
                    {isActive && (
                      <span
                        className={`absolute top-2 bottom-2 w-1 rounded-full bg-emerald-600 ${
                          isRTL ? "right-1" : "left-1"
                        }`}
                      />
                    )}

                    <span
                      className={`flex items-center justify-center transition-colors ${
                        isActive
                          ? "text-emerald-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    >
                      {item.icon}
                    </span>

                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Sidebar() {
  const { user } = useStateContext();
  const { isRTL, translate } = useLanguage();

  return (
    <aside
      className={`fixed top-20 bottom-0 z-40 w-64 bg-white/85 backdrop-blur-md transition-all duration-300 flex flex-col justify-between overflow-y-auto ${
        isRTL
          ? "right-0 border-l border-slate-200/80"
          : "left-0 border-r border-slate-200/80"
      }`}
    >
      <div className="flex-1 py-3">
        <NavLinks />
      </div>

      {/* Modern bottom card */}
      <div className="p-3 border-t border-slate-200/70">
        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppstoreOutlined className="text-emerald-600 text-sm" />
            <span className="text-xs font-semibold text-slate-700">
              {user?.etablissement?.nom_fr || "System"}
            </span>
          </div>
          <span className="inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
            v1.0
          </span>
        </div>
      </div>
    </aside>
  );
}

function MobileSidebar() {
  const { user } = useStateContext();
  const { isRTL } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed top-5 z-60 flex items-center justify-center h-10 w-10 rounded-xl bg-white/90 backdrop-blur-md shadow-md border border-slate-200/90 text-slate-700 hover:bg-slate-50 transition active:scale-95 focus:outline-hidden ${
          isRTL ? "right-4" : "left-4"
        }`}
        aria-label="Open Navigation"
      >
        <MenuOutlined className="text-base" />
      </button>

      <Drawer
        placement={isRTL ? "right" : "left"}
        closable={false}
        onClose={() => setOpen(false)}
        open={open}
        width={280}
        bodyStyle={{ padding: 0 }}
        style={{
          backgroundColor: "#ffffff",
        }}
      >
        <div className="h-full flex flex-col justify-between bg-white">
          <div>
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
              <LogoDisplay user={user} defaultLogo={logo} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <CloseOutlined className="text-sm" />
              </button>
            </div>
            <NavLinks onItemClick={() => setOpen(false)} />
          </div>

          <div className="p-3 border-t border-slate-200/80">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span>{user?.email}</span>
              <span className="font-mono text-[10px]">v1.0</span>
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
}

