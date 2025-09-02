import React from "react";
import { useAuth } from "../hooks/useAuth";

const PendingApprovalPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md w-full mx-4 bg-white p-8 rounded-lg shadow-lg text-center">
        {/* Bekleme İkonu */}
        <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Başlık */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Hesap Onayı Bekleniyor
        </h1>

        {/* Açıklama */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Merhaba {user?.name}!</strong>
          </p>
          <p className="text-sm text-yellow-800 mt-2">
            Hesabınız başarıyla oluşturuldu, ancak sisteme erişim için yönetici
            onayı gerekiyor.
          </p>
        </div>

        {/* Bilgi */}
        <div className="text-left mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Sonraki Adımlar:
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <svg
                className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Yöneticiniz hesabınızı onaylayacak
            </li>
            <li className="flex items-start">
              <svg
                className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Onay sonrası e-posta ile bilgilendirileceksiniz
            </li>
            <li className="flex items-start">
              <svg
                className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Güneş Enerjisi Teklif Sistemi'ne erişebileceksiniz
            </li>
          </ul>
        </div>

        {/* İletişim Bilgileri */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Sorularınız için:
          </h4>
          <p className="text-xs text-gray-600">
            Sistem yöneticinizle iletişime geçin veya IT departmanınızla
            görüşün.
          </p>
        </div>

        {/* Çıkış Butonu */}
        <button
          onClick={logout}
          className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          Çıkış Yap
        </button>

        {/* Yenile Butonu */}
        <button
          onClick={() => window.location.reload()}
          className="w-full mt-3 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          Durumu Kontrol Et
        </button>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
