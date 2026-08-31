import { createContext, useContext, useState } from "react";
import { storage } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => {
    const token = storage.getToken();
    const user = storage.getUser();

    if (!token || !user) {
      return null;
    }

    return {
      token,
      user,
    };
  });

  const login = (newSession) => {
    storage.setSession(newSession);
    setSessionState(newSession);
  };

  const logout = () => {
    storage.clearSession();
    setSessionState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        token: session?.token || null,
        isAuthenticated: !!session?.token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth باید داخل AuthProvider استفاده شود.");
  }

  return context;
}