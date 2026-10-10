import "./index.css";
import { useNavigate } from "react-router-dom";
import { useStateContext } from "./assets/contexts/ContextProvider";
import { useEffect } from "react";
import axiosClient from "./axios-client";
import { Spin } from "antd";
import { Navigate, createBrowserRouter } from "react-router-dom";
import MainLayout from "./assets/layout/MainLayout";
import Users from "./assets/views/Users";
import Wilayas from "./assets/views/Wilayas";
import Communes from "./assets/views/Communes";
import Etablissements from "./assets/views/Etablissements";
import Dashboard from './assets/views/Dashboard';
import GuestLayout from "./assets/auth/GuestLayout";
import Login from "./assets/auth/Login";
import Forbidden from "./assets/views/Forbidden";
import Landing from "./assets/views/Landing";
import PartyMemberSignup from "./assets/views/PartyMemberSignup";
import PartyMembers from "./assets/views/PartyMembers";
import EtablissementParameters from "./assets/views/EtablissementParameters";
import WelcomePartyMember from "./assets/views/WelcomePartyMember";
import WaitingPage from "./assets/views/WaitingPage";
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, setUser, token, setToken } = useStateContext();
  const navigate = useNavigate();
  useEffect(() => {
    axiosClient.get("/user").then(({ data }) => {
      setUser(data);
    })
  }, []);
  // If there's no token, redirect to login immediately
  if (!token) {
    return <Navigate to="/login" />;
  }
  // If there's a token but no user ID yet, show loading (user is being fetched)
  if (!user?.id) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" />
      </div>
    );
  }
  // Check if user's role is in the allowed roles array
  if (!allowedRoles.includes(user?.role_id)) {
    setUser(null);
    setToken(null);
    navigate("/forbidden")
  }
  return children;
};
const DefaultRedirect = () => {
  const { user, setUser, token, setToken } = useStateContext();
  if (!user?.id || !user?.role_id) {
    return <Navigate to="/login" />;
  }
  if (user.id) {
    if (user?.role_id === "admin") {
      return <Navigate to="/mainLayout/users" />;
    }
    if (user.id && user?.etablissement) {
      if (user?.role_id === "wilaya_admin" || user?.role_id === "national_admin") {
        return <Navigate to="/mainLayout/party-members" />;
      }
      else if ((user?.role_id === "party_member" && user?.etablissement?.verificationby == 0) || user.state === "joined") {
        return <Navigate to="/mainLayout/welcome-partymembers" />;
      } else if (user?.role_id === "party_member" && user?.etablissement?.verificationby == 1) {
        return <Navigate to="/mainLayout/waiting-page" />;
      }
      else {
        return <Navigate to="/forbidden" />;
      }
    }
  }
};
const Routes = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/party-signup",
    element: <PartyMemberSignup />,
  },
  {
    path: "/mainLayout",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <DefaultRedirect />,
      },
      {
        path: "users",
        element: (
          <ProtectedRoute allowedRoles={["admin", "national_admin", "wilaya_admin"]}>
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: "wilayas",
        element: (
          <ProtectedRoute allowedRoles={["admin", "national_admin"]}>
            <Wilayas />
          </ProtectedRoute>
        ),
      },
      {
        path: "communes",
        element: (
          <ProtectedRoute allowedRoles={["admin", "national_admin"]}>
            <Communes />
          </ProtectedRoute>
        ),
      },
      {
        path: "etablissements",
        element: (
          <ProtectedRoute allowedRoles={["admin", "national_admin"]}>
            <Etablissements />
          </ProtectedRoute>
        ),
      },
      {
        path: "party-members",
        element: (
          <ProtectedRoute allowedRoles={["admin", "national_admin", "wilaya_admin"]}>
            <PartyMembers />
          </ProtectedRoute>
        ),
      },
      {
        path: "welcome-partymembers",
        element: (
          <ProtectedRoute allowedRoles={["party_member"]}>
            <WelcomePartyMember />
          </ProtectedRoute>
        ),
      },
      {
        path: "waiting-page",
        element: (
          <ProtectedRoute allowedRoles={["party_member"]}>
            <WaitingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute allowedRoles={["admin", "national_admin", "wilaya_admin"]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "parameters",
        element: (
          <ProtectedRoute allowedRoles={["national_admin"]}>
            <EtablissementParameters />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/",
    element: <GuestLayout />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
    ],
  },
  {
    path: "/forbidden",
    element: <Forbidden />,
  },
  {
    path: "*",
    element: <Navigate to="/" />,
  },
]);

export default Routes;
