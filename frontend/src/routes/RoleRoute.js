import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_PATHS = {
  admin: "/panel/admin",
  teacher: "/panel/teacher",
  secretary: "/panel/secretary",
  student: "/panel/student",
};

export default function RoleRoute({
  allowedRole,
}) {
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <span>در حال بررسی دسترسی...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const hasAccess = Array.isArray(allowedRole)
    ? allowedRole.includes(user?.role)
    : user?.role === allowedRole;

  if (!hasAccess) {
    const correctPanel =
      ROLE_PATHS[user?.role] || "/login";

    return (
      <Navigate
        to={correctPanel}
        replace
      />
    );
  }

  return <Outlet />;
}