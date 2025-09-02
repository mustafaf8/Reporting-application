import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // Uygulama ilk açıldığında kullanıcıyı hydrate et
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!token) return;
        const { data } = await api.get("/api/auth/me");
        if (!mounted) return;
        setUser(data.data?.user || data.user);
      } catch (err) {
        // Geçersiz token veya onay bekleyen kullanıcı ise temizle
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

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      const userData = data.data?.user || data.user;
      setToken(data.data?.token || data.token);
      setUser(userData);
      toast.success("Başarıyla giriş yapıldı!");
      return { ok: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || "Giriş başarısız";
      toast.error(message);
      return { ok: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      await api.post("/api/auth/register", { name, email, password });
      toast.success("Kullanıcı başarıyla kayıt edildi!");
      return login(email, password);
    } catch (err) {
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
    // Çıkış yapıldıktan sonra login sayfasına yönlendir
    window.location.href = "/login";
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const refreshUser = useCallback(async () => {
    try {
      if (!token) return;
      const { data } = await api.get("/api/auth/me");
      setUser(data.data?.user || data.user);
    } catch (err) {
      console.error("User refresh error:", err);
    }
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateUser,
      refreshUser,
      bootstrapping,
    }),
    [user, token, loading, bootstrapping]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
