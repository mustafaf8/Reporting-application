"use client";

import React from "react";
import Link from "next/link";

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: "Ücretsiz",
      price: 0,
      period: "aylık",
      description: "Temel özellikler için ideal",
      features: [
        "5 teklif oluşturma",
        "Temel şablonlar",
        "PDF indirme",
        "E-posta desteği",
      ],
      limitations: ["Sınırlı teklif sayısı", "Temel şablonlar"],
      buttonText: "Ücretsiz Başla",
      buttonVariant: "outline",
    },
    {
      name: "Pro",
      price: 29,
      period: "aylık",
      description: "Profesyonel kullanım için",
      features: [
        "Sınırsız teklif oluşturma",
        "Tüm şablonlar",
        "Yüksek kalite PDF",
        "Özel şablon oluşturma",
        "Öncelikli destek",
        "API erişimi",
      ],
      limitations: [],
      buttonText: "Pro'ya Geç",
      buttonVariant: "primary",
      popular: true,
    },
    {
      name: "Kurumsal",
      price: 99,
      period: "aylık",
      description: "Büyük ekipler için",
      features: [
        "Tüm Pro özellikleri",
        "Çoklu kullanıcı",
        "Özel entegrasyonlar",
        "Dedicated destek",
        "Özel branding",
        "Gelişmiş raporlama",
      ],
      limitations: [],
      buttonText: "İletişime Geç",
      buttonVariant: "outline",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Fiyatlandırma Planları
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          İhtiyacınıza uygun planı seçin ve profesyonel teklifler oluşturmaya
          başlayın.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`relative bg-white rounded-2xl shadow-lg p-8 ${
              plan.popular ? "ring-2 ring-indigo-500 scale-105" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  En Popüler
                </span>
              </div>
            )}

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price}₺
                </span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
              {plan.limitations.map((limitation, limitationIndex) => (
                <li key={limitationIndex} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-500 line-through">
                    {limitation}
                  </span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                plan.buttonVariant === "primary"
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Sık Sorulan Sorular
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Plan değişikliği yapabilir miyim?
            </h3>
            <p className="text-gray-600">
              Evet, istediğiniz zaman planınızı yükseltebilir veya
              düşürebilirsiniz. Değişiklikler bir sonraki faturalandırma
              döneminde geçerli olur.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ücretsiz deneme süresi var mı?
            </h3>
            <p className="text-gray-600">
              Tüm planlarımızda 14 günlük ücretsiz deneme süresi bulunmaktadır.
              Hiçbir kredi kartı bilgisi istemiyoruz.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              İptal ettiğimde verilerim ne olur?
            </h3>
            <p className="text-gray-600">
              Verileriniz 30 gün boyunca saklanır. Bu süre içinde tekrar abone
              olursanız tüm verilerinize erişebilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-indigo-600 rounded-2xl p-12 text-white">
        <h2 className="text-3xl font-bold mb-4">Hemen Başlayın</h2>
        <p className="text-xl mb-8 opacity-90">
          Profesyonel teklifler oluşturmaya bugün başlayın.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/login"
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Ücretsiz Başla
          </Link>
          <Link
            href="/contact"
            className="border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-indigo-600 transition-colors"
          >
            İletişime Geç
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
