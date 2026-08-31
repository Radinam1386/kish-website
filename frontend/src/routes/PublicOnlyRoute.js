import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { rolePanelPath } from "../services/api";

export default function PublicOnlyRoute() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          direction: "rtl",
          color: "#666",
        }}
      >
        در حال بررسی...
      </div>
    );
  }

  if (isAuthenticated && role) {
    return <Navigate to={rolePanelPath(role)} replace />;
  }

  return <Outlet />;
}