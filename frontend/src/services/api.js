import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  timeout: 10000, // 10 saniye timeout
});

// Token ekleme interceptor'u
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor'u - başarılı işlemler için
api.interceptors.response.use(
  (response) => {
    // Başarılı işlemler için toast göster (PDF indirme hariç)
    if (
      response.config.method !== "get" &&
      response.config.responseType !== "blob"
    ) {
      const message = response.data?.message || "İşlem başarıyla tamamlandı";
      toast.success(message);
    }
    return response;
  },
  (error) => {
    // Hata durumları için gelişmiş yönetim
    if (error.config?.responseType !== "blob") {
      let message = "Bir hata oluştu";

      if (error.response) {
        // Sunucu yanıt verdi
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 401:
            message = "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.";
            // Token'ı temizle ve login sayfasına yönlendir
            localStorage.removeItem("token");
            window.location.href = "/login";
            break;
          case 403:
            message = "Bu işlem için yetkiniz bulunmuyor.";
            break;
          case 404:
            message = "İstenen kaynak bulunamadı.";
            break;
          case 422:
            message = data?.message || "Girilen veriler geçersiz.";
            break;
          case 500:
            message = "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";
            break;
          default:
            message = data?.message || `Hata: ${status}`;
        }
      } else if (error.request) {
        // İstek gönderildi ama yanıt alınamadı
        message =
          "Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.";
      } else if (error.code === "ECONNABORTED") {
        message = "İstek zaman aşımına uğradı. Lütfen tekrar deneyin.";
      }

      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
