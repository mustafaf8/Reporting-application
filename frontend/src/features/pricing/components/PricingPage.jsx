import React from "react";
import { useTranslation } from "react-i18next";
import api from "../../../services/api";

const PricingPage = () => {
  const { t } = useTranslation();

  const startCheckout = async (priceId) => {
    try {
      const { data } = await api.post("/api/billing/create-checkout-session", {
        priceId,
      });
      if (data?.url) window.location.href = data.url;
    } catch (_) {}
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{t("pricing")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border">
          <h2 className="text-xl font-semibold mb-2">Ücretsiz</h2>
          <ul className="text-sm text-slate-600 space-y-2 mb-4">
            <li>Temel şablonlar</li>
            <li>PDF oluşturma (standart)</li>
          </ul>
          <button className="px-4 py-2 bg-slate-200 rounded" disabled>
            {t("subscribe")}
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-indigo-200">
          <h2 className="text-xl font-semibold mb-2">Profesyonel</h2>
          <ul className="text-sm text-slate-600 space-y-2 mb-4">
            <li>Gelişmiş şablonlar</li>
            <li>Öncelikli PDF kuyruğu</li>
            <li>Yüksek çözünürlüklü çıktı</li>
          </ul>
          <button
            onClick={() => startCheckout(import.meta.env.VITE_STRIPE_PRICE_PRO)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {t("subscribe")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
