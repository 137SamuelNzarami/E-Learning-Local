import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { clearSession, getStoredUser, getToken, setSession, USER_KEY } from "../api/client";

const AuthContext = createContext(null);

function normalizeUser(user) {
  if (!user) return null;
  if (user.id !== undefined) return user;
  if (user.id_utilisateur !== undefined) {
    return { ...user, id: user.id_utilisateur };
  }
  return user;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    authService
      .me()
      .then((res) => {
        if (cancelled) return;
        const normalized = normalizeUser(res.data);
        setUser(normalized);
        localStorage.setItem(USER_KEY, JSON.stringify(normalized));
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials);
    const { token, utilisateur } = res.data;
    const normalized = normalizeUser(utilisateur);
    setSession(token, normalized);
    setUser(normalized);
    return res;
  }, []);

  const register = useCallback(async (payload) => {
    return authService.register(payload);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await authService.me();
    const normalized = normalizeUser(res.data);
    setUser(normalized);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    return normalized;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit Ãªtre utilisÃ© dans un AuthProvider");
  return ctx;
}
