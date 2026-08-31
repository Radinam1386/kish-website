import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (
    allowedRoles &&
    (!user?.role || !allowedRoles.includes(user.role))
  ) {
    const rolePaths = {
      student: "/panel/student",
      teacher: "/panel/teacher",
      secretary: "/panel/secretary",
      admin: "/panel/admin",
    };

    return (
      <Navigate
        to={rolePaths[user.role] || "/login"}
        replace
      />
    );
  }

  return <Outlet />;
}