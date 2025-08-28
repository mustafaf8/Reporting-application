import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:5000',
});

// Token ekleme interceptor'u
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor'u - başarılı işlemler için
api.interceptors.response.use(
  (response) => {
    // Başarılı işlemler için toast göster (PDF indirme hariç)
    if (response.config.method !== 'get' && response.config.responseType !== 'blob') {
      const message = response.data?.message || 'İşlem başarıyla tamamlandı';
      toast.success(message);
    }
    return response;
  },
  (error) => {
    // Hata durumları için toast göster (PDF indirme hariç)
    if (error.config?.responseType !== 'blob') {
      const message = error.response?.data?.message || 'Bir hata oluştu';
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;


