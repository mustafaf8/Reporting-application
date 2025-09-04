"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { User, AuthContextType } from "@/types";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    }
  }, [token]);

  // Uygulama ilk açıldığında kullanıcıyı hydrate et
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!token) {
          setBootstrapping(false);
          return;
        }
        const { data } = await api.get("/api/auth/me");
        if (!mounted) return;
        setUser(data.data?.user || data.user);
      } catch (err) {
        // Geçersiz token ise temizle
        setToken(null);
        setUser(null);
      } finally {
        if (mounted) setBootstrapping(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      setToken(data.data?.token || data.token);
      setUser(data.data?.user || data.user);
      toast.success("Başarıyla giriş yapıldı!");
      return { ok: true };
    } catch (err: any) {
      const message = err.response?.data?.message || "Giriş başarısız";
      toast.error(message);
      return { ok: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      await api.post("/api/auth/register", { name, email, password });
      toast.success("Kullanıcı başarıyla kayıt edildi!");
      return login(email, password);
    } catch (err: any) {
      const message = err.response?.data?.message || "Kayıt başarısız";
      toast.error(message);
      return { ok: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    toast.success("Başarıyla çıkış yapıldı");
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      bootstrapping,
    }),
    [user, token, loading, bootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
