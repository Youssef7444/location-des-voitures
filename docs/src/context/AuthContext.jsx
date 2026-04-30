import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, clearAuthToken, getAuthToken } from "../services/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const token = getAuthToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await authApi.me();
        setUser(profile);
      } catch {
        clearAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  async function login(credentials) {
    const payload = await authApi.login(credentials);
    setUser(payload.user || null);
    if (payload?.user?.email) {
      localStorage.setItem("known_customer_email", payload.user.email);
    }
    return payload;
  }

  async function register(newUser) {
    const payload = await authApi.register(newUser);
    setUser(payload.user || null);
    if (payload?.user?.email) {
      localStorage.setItem("known_customer_email", payload.user.email);
    }
    return payload;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clearAuthToken();
      setUser(null);
    }
  }

  async function refreshUser() {
    try {
      const profile = await authApi.me();
      setUser(profile || null);
      return profile;
    } catch {
      return null;
    }
  }

  function updateLocalUser(nextUser) {
    setUser(nextUser || null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
      updateLocalUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
