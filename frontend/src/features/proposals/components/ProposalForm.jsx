import React, { useState } from "react";
import axios from "axios";
import api from "../../../services/api";
import toast from "react-hot-toast";
import companyConfig, { buildCompanyForPdf } from "../../../config/company";

// Bu bileşenin tek sorumluluğu, bir teklif formu göstermek,
// kullanıcı girdilerini yönetmek ve PDF oluşturma işlemini tetiklemektir.
const ProposalForm = () => {
  // --- STATE YÖNETİMİ ---

  // Ayrı müşteri adı alanı kaldırıldı; müşteri adı customer.fullName üzerinden alınır

  // Eklenen malzemelerin listesini (bir dizi nesne) tutan state
  const [items, setItems] = useState([]);

  // Malzeme ekleme formundaki anlık girdileri tutan state
  const [currentItem, setCurrentItem] = useState({
    name: "",
    quantity: 1,
    unitPrice: 0,
  });

  // KDV, iskonto, ek maliyet
  const [vatRate, setVatRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);
  const [extraCosts, setExtraCosts] = useState(0);

  // Şirket bilgileri: formdan kaldırıldı, merkezi konfigürasyondan geliyor
  const company = companyConfig;

  // Müşteri isteğe bağlı alanları
  const [customer, setCustomer] = useState({
    fullName: "",
    companyName: "",
    phone: "",
    address: "",
    email: "",
  });

  // Teklifi veren kişi (zorunlu)
  const [issuer, setIssuer] = useState({
    name: "",
    phone: "",
  });

  // API isteği sırasında yüklenme durumunu yöneten state (butonun deaktif olması için)
  const [loading, setLoading] = useState(false);

  // --- FONKSİYONLAR ---

  // Malzeme ekleme formundaki girdileri listeye ekleyen fonksiyon
  const handleAddItem = () => {
    // Basit bir doğrulama: Malzeme adı boş olamaz, miktar ve fiyat 0'dan büyük olmalı
    if (
      currentItem.name &&
      currentItem.quantity > 0 &&
      currentItem.unitPrice > 0
    ) {
      // Mevcut listeyi koruyarak yeni malzemeyi sona ekle (immutable state update)
      setItems([...items, currentItem]);
      // Malzeme eklendikten sonra formu temizle
      setCurrentItem({ name: "", quantity: 1, unitPrice: 0 });
      toast.success("Malzeme başarıyla eklendi!");
    } else {
      toast.error("Lütfen tüm malzeme alanlarını doğru bir şekilde doldurun.");
    }
  };

  // Listeden bir malzemeyi çıkaran fonksiyon
  const handleRemoveItem = (indexToRemove) => {
    // filter metodu ile kaldırılmak istenen index dışındaki tüm elemanlardan yeni bir dizi oluştur
    setItems(items.filter((_, index) => index !== indexToRemove));
    toast.success("Malzeme kaldırıldı");
  };

  // Backend'e istek atıp PDF'i oluşturan ve indiren ana fonksiyon
  const handleGeneratePdf = async () => {
    // Müşteri adı veya malzeme listesi boşsa işlemi başlatma
    if (
      !customer.fullName ||
      !issuer.name ||
      !issuer.phone ||
      items.length === 0
    ) {
      toast.error(
        "Lütfen müşteri adı, teklifi veren kişi ve telefon ile en az bir malzeme girin."
      );
      return;
    }

    setLoading(true); // Yüklenme durumunu başlat

    try {
      // 0) Önce teklifi DB'ye kaydet (giriş yapılmış olmalı)
      const companyForPdf = await buildCompanyForPdf();
      const payload = {
        customerName: customer.fullName,
        items,
        vatRate,
        discountRate,
        extraCosts,
        company: companyForPdf,
        customer,
        issuer,
      };
      try {
        await api.post("/api/proposals", payload);
        // Başarı tostu interceptor tarafından gösterilecek
      } catch (saveErr) {
        // Kayıt edilemese bile PDF'e devam edebiliriz; kullanıcıya bilgi ver
        toast.error(
          saveErr.response?.data?.message ||
            "Teklif kaydedilemedi, PDF oluşturulacak."
        );
      }

      // 1) PDF üretimi
      const response = await api.post("/api/generate-pdf", payload, {
        responseType: "blob",
      });

      // 2) Gelen blob verisinden geçici bir URL oluştur
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // 3) Gizli bir link ('a' tagı) oluştur
      const link = document.createElement("a");
      link.href = url;

      // 4) İndirilecek dosyanın adını belirle
      const fileName = `${customer.fullName.replace(/\s/g, "_")}-teklifi.pdf`;
      link.setAttribute("download", fileName);

      // 5) Linki DOM'a ekle ve programatik olarak tıkla
      document.body.appendChild(link);
      link.click();

      // 6) Temizlik
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF başarıyla oluşturuldu ve indirildi!");
    } catch (error) {
      console.error("PDF oluşturma ve indirme sırasında hata:", error);
      toast.error("PDF oluşturulurken sunucu hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER (JSX) ---

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-gray-800 ">
        Yeni Teklif Detayları
      </h2>

      {/* Müşteri Bilgileri (Opsiyonel) - Ad Soyad zorunlu */}
      <div className="space-y-3 p-4 border rounded-lg bg-white">
        <h3 className="text-xl font-semibold text-gray-800">
          Müşteri Bilgileri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Ad Soyad (zorunlu)
            </label>
            <input
              type="text"
              value={customer.fullName}
              onChange={(e) =>
                setCustomer({ ...customer, fullName: e.target.value })
              }
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              placeholder="Ad Soyad"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Şirket Adı
            </label>
            <input
              type="text"
              value={customer.companyName}
              onChange={(e) =>
                setCustomer({ ...customer, companyName: e.target.value })
              }
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              placeholder="Müşteri Şirketi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Telefon
            </label>
            <input
              type="text"
              value={customer.phone}
              onChange={(e) =>
                setCustomer({ ...customer, phone: e.target.value })
              }
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              placeholder="+90 5xx xxx xx xx"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Adres
            </label>
            <input
              type="text"
              value={customer.address}
              onChange={(e) =>
                setCustomer({ ...customer, address: e.target.value })
              }
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              placeholder="Adres"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              E-posta
            </label>
            <input
              type="email"
              value={customer.email}
              onChange={(e) =>
                setCustomer({ ...customer, email: e.target.value })
              }
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              placeholder="mail@ornek.com"
            />
          </div>
        </div>
      </div>

      {/* Teklifi Veren (Zorunlu) */}
      <div className="space-y-3 p-4 border rounded-lg bg-white">
        <h3 className="text-xl font-semibold text-gray-800">Teklifi Veren</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ad Soyad (zorunlu)
            </label>
            <input
              type="text"
              value={issuer.name}
              onChange={(e) => setIssuer({ ...issuer, name: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              placeholder="Örn: Mustafa Nahsan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Telefon (zorunlu)
            </label>
            <input
              type="text"
              value={issuer.phone}
              onChange={(e) => setIssuer({ ...issuer, phone: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              placeholder="+90 5xx xxx xx xx"
            />
          </div>
        </div>
      </div>

      {/* Malzeme Ekleme Formu */}
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-700">
          Malzeme Listesi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-gray-50">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Malzeme Adı
            </label>
            <input
              type="text"
              value={currentItem.name}
              onChange={(e) =>
                setCurrentItem({ ...currentItem, name: e.target.value })
              }
              placeholder="450W Monokristal Panel"
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Miktar
            </label>
            <input
              type="number"
              min="1"
              value={currentItem.quantity}
              onChange={(e) =>
                setCurrentItem({
                  ...currentItem,
                  quantity: parseInt(e.target.value) || 1,
                })
              }
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Birim Fiyat (TL)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={currentItem.unitPrice}
              onChange={(e) =>
                setCurrentItem({
                  ...currentItem,
                  unitPrice: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="Örn: 2500"
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleAddItem}
            className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ekle
          </button>
        </div>
      </div>

      {/* Vergi/İskonto/Ek Maliyet */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            KDV Oranı (%)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={vatRate}
            onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            İskonto Oranı (%)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={discountRate}
            onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ek Maliyetler (TL)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={extraCosts}
            onChange={(e) => setExtraCosts(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full border border-gray-300 rounded-md p-2"
          />
        </div>
      </div>

      {/* Eklenen Malzemeler Listesi */}
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-slate-100 p-3 rounded-md animate-fade-in"
            >
              <div>
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-600">
                  {item.quantity} adet &times; {item.unitPrice.toFixed(2)} TL
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold text-gray-900">
                  {(item.quantity * item.unitPrice).toFixed(2)} TL
                </p>
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="bg-red-500 text-white px-3 py-1 text-sm rounded-md hover:bg-red-600 transition-colors"
                >
                  Kaldır
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">
            Teklife henüz malzeme eklenmedi.
          </p>
        )}
      </div>

      {/* Toplam Tutar ve PDF Oluşturma Butonu */}
      <div className="border-t pt-4 space-y-4">
        <div className="flex justify-end items-center text-xl font-bold">
          <span className="text-gray-600 mr-4">Genel Toplam (yaklaşık):</span>
          <span className="text-indigo-600">
            {(() => {
              const subtotal = items.reduce(
                (t, it) => t + it.quantity * it.unitPrice,
                0
              );
              const discounted = subtotal * (1 - discountRate / 100);
              const withExtras = discounted + extraCosts;
              const withVat = withExtras * (1 + vatRate / 100);
              return withVat.toFixed(2);
            })()}{" "}
            TL
          </span>
        </div>
        <button
          onClick={handleGeneratePdf}
          disabled={loading || items.length === 0 || !customer.fullName}
          className="w-full bg-indigo-600 text-white font-bold py-3 px-4 text-lg rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Oluşturuluyor...
            </>
          ) : (
            "Teklif PDF'ini Oluştur ve İndir"
          )}
        </button>
      </div>
    </div>
  );
};

export default ProposalForm;
