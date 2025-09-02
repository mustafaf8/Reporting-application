import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import LoadingSpinner from "../ui/LoadingSpinner";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, bootstrapping } = useAuth();
  const location = useLocation();

  // Authentication durumu yükleniyor
  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Yükleniyor..." />
          <p className="text-gray-600 mt-4">Güvenlik kontrolü yapılıyor...</p>
        </div>
      </div>
    );
  }

  // Kullanıcı giriş yapmamış
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Belirli bir rol gerekiyorsa kontrol et
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Erişim Engellendi
          </h2>
          <p className="text-gray-600 mb-6">
            Bu sayfaya erişim yetkiniz yok. Sadece{" "}
            {requiredRole === "admin" ? "yöneticiler" : "belirli kullanıcılar"}{" "}
            bu sayfaya erişebilir.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
