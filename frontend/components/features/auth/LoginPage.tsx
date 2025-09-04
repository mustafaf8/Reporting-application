"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

const LoginPage: React.FC = () => {
  const { login, register, loading, user, bootstrapping } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Zaten giriş yapmış kullanıcıları yönlendir
  useEffect(() => {
    if (!bootstrapping && user) {
      const from = searchParams.get("from") || "/";
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push(from);
      }
    }
  }, [user, bootstrapping, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        const res = await login(email, password);
        if (res.ok) {
          // Kullanıcının rolüne göre yönlendirme
          const from = searchParams.get("from") || "/";
          if (user?.role === "admin") {
            router.push("/admin");
          } else {
            router.push(from);
          }
        } else {
          setError(res.message || "Giriş başarısız");
        }
      } else {
        const res = await register(name, email, password);
        if (res.ok) {
          // Yeni akış: otomatik onay varsayımıyla kayıt sonrası otomatik giriş
          const loginRes = await login(email, password);
          if (loginRes.ok) {
            if (user?.role === "admin") {
              router.push("/admin");
            } else {
              router.push("/");
            }
          } else {
            setError(loginRes.message || "Otomatik giriş başarısız");
          }
        } else {
          setError(res.message || "Kayıt başarısız");
        }
      }
    } catch (error) {
      setError("İşlem sırasında bir hata oluştu");
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError("");
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const clearToken = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("pendingUserEmail");
      localStorage.removeItem("pendingUserPassword");
      window.location.reload();
    }
  };

  // Authentication durumu yükleniyor
  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Güvenlik kontrolü yapılıyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md w-full mx-4 bg-white p-8 rounded-lg shadow-lg">
        {/* Uygulama Başlığı ve Açıklama */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Güneş Enerjisi Teklif Sistemi
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Profesyonel güneş enerjisi teklifleri oluşturun ve yönetin
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-blue-800">
              <strong>Bu bir raporlama uygulamasıdır.</strong> Sisteme erişim
              için geçerli bir hesabınız olmalıdır.
            </p>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-gray-800 text-center">
          {isLogin ? "Hesabınıza Giriş Yapın" : "Yeni Hesap Oluşturun"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ad Soyad
              </label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              E-posta
            </label>
            <input
              type="email"
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Parola
            </label>
            <input
              type="password"
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading
              ? isLogin
                ? "Giriş yapılıyor..."
                : "Kayıt olunuyor..."
              : isLogin
              ? "Giriş Yap"
              : "Kayıt Ol"}
          </button>
        </form>

        {/* Token Temizleme Butonu */}
        <div className="mt-4 text-center">
          <button
            onClick={clearToken}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Oturum Bilgilerini Temizle
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-indigo-600 hover:underline text-sm"
          >
            {isLogin
              ? "Hesabınız yok mu? Kayıt olun"
              : "Zaten hesabınız var mı? Giriş yapın"}
          </button>
        </div>

        {/* Uygulama Özellikleri */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
            Sistem Özellikleri
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Teklif Oluşturma
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Ürün Yönetimi
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Raporlama
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Kullanıcı Yönetimi
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
