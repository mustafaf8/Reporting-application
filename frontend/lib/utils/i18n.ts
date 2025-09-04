"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  tr: {
    translation: {
      welcome: "Hoş Geldiniz",
      login: "Giriş Yap",
      register: "Kayıt Ol",
      logout: "Çıkış Yap",
      email: "E-posta",
      password: "Şifre",
      name: "Ad",
      surname: "Soyad",
      phone: "Telefon",
      address: "Adres",
      company: "Şirket",
      proposals: "Teklifler",
      products: "Ürünler",
      templates: "Şablonlar",
      profile: "Profil",
      admin: "Yönetici",
      dashboard: "Ana Sayfa",
      create: "Oluştur",
      edit: "Düzenle",
      delete: "Sil",
      save: "Kaydet",
      cancel: "İptal",
      search: "Ara",
      filter: "Filtrele",
      loading: "Yükleniyor...",
      error: "Hata",
      success: "Başarılı",
      warning: "Uyarı",
      info: "Bilgi",
    },
  },
  en: {
    translation: {
      welcome: "Welcome",
      login: "Login",
      register: "Register",
      logout: "Logout",
      email: "Email",
      password: "Password",
      name: "Name",
      surname: "Surname",
      phone: "Phone",
      address: "Address",
      company: "Company",
      proposals: "Proposals",
      products: "Products",
      templates: "Templates",
      profile: "Profile",
      admin: "Admin",
      dashboard: "Dashboard",
      create: "Create",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      search: "Search",
      filter: "Filter",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      warning: "Warning",
      info: "Info",
    },
  },
};

// i18n'i sadece client-side'da initialize et
if (typeof window !== "undefined") {
  i18n.use(initReactI18next).init({
    resources,
    lng: localStorage.getItem("lang") || "tr",
    fallbackLng: "tr",
    interpolation: { escapeValue: false },
  });
}

export default i18n;
