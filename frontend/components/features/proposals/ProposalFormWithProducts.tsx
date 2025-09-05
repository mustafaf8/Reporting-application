"use client";

import React, { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api/index";
import toast from "react-hot-toast";
import companyConfig, { buildCompanyForPdf } from "@/config/company";
import ProductSelector from "@/components/features/products/ProductSelector";
import { Product } from "@/types/index";

interface Item {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface Customer {
  fullName: string;
  companyName: string;
  phone: string;
  address: string;
  email: string;
}

interface Issuer {
  name: string;
  phone: string;
}

const ProposalFormWithProducts: React.FC = () => {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId") || "";
  const editorCacheKey = templateId
    ? `proposal_editor_customizations:${templateId}`
    : null;

  // State yönetimi
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [currentItem, setCurrentItem] = useState<Item>({
    name: "",
    quantity: 1,
    unitPrice: 0,
  });

  // KDV, iskonto, ek maliyet
  const [vatRate, setVatRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);
  const [extraCosts, setExtraCosts] = useState(0);

  // Şirket bilgileri
  const company = companyConfig;

  // Müşteri bilgileri
  const [customer, setCustomer] = useState<Customer>({
    fullName: "",
    companyName: "",
    phone: "",
    address: "",
    email: "",
  });

  // Teklifi veren kişi
  const [issuer, setIssuer] = useState<Issuer>({
    name: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);

  // Ürün seçimi işlemi
  const handleProductSelect = useCallback((products: Product[]) => {
    setSelectedProducts(products);
    const newItems = products.map((product) => ({
      name: product.name,
      quantity: 1,
      unitPrice: product.unitPrice,
    }));
    setItems(newItems);
  }, []);

  // Manuel malzeme ekleme
  const handleAddItem = () => {
    if (
      currentItem.name &&
      currentItem.quantity > 0 &&
      currentItem.unitPrice > 0
    ) {
      setItems([...items, currentItem]);
      setCurrentItem({ name: "", quantity: 1, unitPrice: 0 });
      toast.success("Malzeme başarıyla eklendi!");
    } else {
      toast.error("Lütfen tüm malzeme alanlarını doğru bir şekilde doldurun.");
    }
  };

  // Malzeme kaldırma
  const handleRemoveItem = (indexToRemove: number) => {
    setItems(items.filter((_, index) => index !== indexToRemove));
    toast.success("Malzeme kaldırıldı");
  };

  // Malzeme güncelleme
  const handleUpdateItem = (
    index: number,
    field: keyof Item,
    value: string | number
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  // PDF oluşturma
  const handleGeneratePdf = async () => {
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

    setLoading(true);

    try {
      // Önce teklifi DB'ye kaydet
      const companyForPdf = await buildCompanyForPdf();
      // Editor özelleştirmeleri (varsayılan boş)
      let customizations = {};
      if (editorCacheKey) {
        try {
          const cached = localStorage.getItem(editorCacheKey);
          if (cached) customizations = JSON.parse(cached) || {};
        } catch (_) {}
      }

      const payload = {
        customerName: customer.fullName,
        items,
        vatRate,
        discountRate,
        extraCosts,
        company: companyForPdf,
        customer,
        issuer,
        templateId,
        customizations,
      };

      try {
        await api.post("/api/proposals", payload);
      } catch (saveErr: any) {
        toast.error(
          saveErr.response?.data?.message ||
            "Teklif kaydedilemedi, PDF oluşturulacak."
        );
      }

      // PDF üretimi
      const response = await api.post("/api/generate-pdf", payload, {
        responseType: "blob",
      });

      // PDF indirme
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = `${customer.fullName.replace(/\s/g, "_")}-teklifi.pdf`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF başarıyla oluşturuldu ve indirildi!");
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      toast.error("PDF oluşturulurken sunucu hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Toplam hesaplama
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const discountAmount = (subtotal * discountRate) / 100;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = (afterDiscount * vatRate) / 100;
  const grandTotal = afterDiscount + vatAmount + extraCosts;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-gray-800">
        Yeni Teklif Detayları
      </h2>

      {/* Müşteri Bilgileri */}
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
              placeholder="Telefon"
            />
          </div>
          <div>
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
              placeholder="E-posta"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Adres
            </label>
            <textarea
              value={customer.address}
              onChange={(e) =>
                setCustomer({ ...customer, address: e.target.value })
              }
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              rows={2}
              placeholder="Adres"
            />
          </div>
        </div>
      </div>

      {/* Teklifi Veren Kişi */}
      <div className="space-y-3 p-4 border rounded-lg bg-white">
        <h3 className="text-xl font-semibold text-gray-800">
          Teklifi Veren Kişi
        </h3>
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
              placeholder="Ad Soyad"
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
              placeholder="Telefon"
            />
          </div>
        </div>
      </div>

      {/* Ürün Seçimi */}
      <div className="space-y-3 p-4 border rounded-lg bg-white">
        <h3 className="text-xl font-semibold text-gray-800">Ürün Seçimi</h3>
        <ProductSelector
          onProductSelect={handleProductSelect}
          selectedProducts={selectedProducts}
        />
      </div>

      {/* Manuel Malzeme Ekleme */}
      <div className="space-y-3 p-4 border rounded-lg bg-white">
        <h3 className="text-xl font-semibold text-gray-800">
          Manuel Malzeme Ekleme
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Malzeme Adı
            </label>
            <input
              type="text"
              value={currentItem.name}
              onChange={(e) =>
                setCurrentItem({ ...currentItem, name: e.target.value })
              }
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              placeholder="Malzeme adı"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Miktar
            </label>
            <input
              type="number"
              value={currentItem.quantity}
              onChange={(e) =>
                setCurrentItem({
                  ...currentItem,
                  quantity: Number(e.target.value),
                })
              }
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Birim Fiyat (₺)
            </label>
            <input
              type="number"
              value={currentItem.unitPrice}
              onChange={(e) =>
                setCurrentItem({
                  ...currentItem,
                  unitPrice: Number(e.target.value),
                })
              }
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Malzeme Listesi */}
      {items.length > 0 && (
        <div className="space-y-3 p-4 border rounded-lg bg-white">
          <h3 className="text-xl font-semibold text-gray-800">
            Malzeme Listesi
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Malzeme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Miktar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Birim Fiyat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          handleUpdateItem(index, "name", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-md p-1"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(
                            index,
                            "quantity",
                            Number(e.target.value)
                          )
                        }
                        className="w-full border border-gray-300 rounded-md p-1"
                        min="1"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleUpdateItem(
                            index,
                            "unitPrice",
                            Number(e.target.value)
                          )
                        }
                        className="w-full border border-gray-300 rounded-md p-1"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(item.quantity * item.unitPrice).toLocaleString("tr-TR")}{" "}
                      ₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hesaplamalar */}
      <div className="space-y-3 p-4 border rounded-lg bg-white">
        <h3 className="text-xl font-semibold text-gray-800">Hesaplamalar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              KDV Oranı (%)
            </label>
            <input
              type="number"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              İskonto Oranı (%)
            </label>
            <input
              type="number"
              value={discountRate}
              onChange={(e) => setDiscountRate(Number(e.target.value))}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              min="0"
              max="100"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Ek Maliyetler (₺)
            </label>
            <input
              type="number"
              value={extraCosts}
              onChange={(e) => setExtraCosts(Number(e.target.value))}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Toplam Hesaplama */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Ara Toplam:</span>
              <span>{subtotal.toLocaleString("tr-TR")} ₺</span>
            </div>
            {discountRate > 0 && (
              <div className="flex justify-between text-red-600">
                <span>İskonto ({discountRate}%):</span>
                <span>-{discountAmount.toLocaleString("tr-TR")} ₺</span>
              </div>
            )}
            {vatRate > 0 && (
              <div className="flex justify-between">
                <span>KDV ({vatRate}%):</span>
                <span>{vatAmount.toLocaleString("tr-TR")} ₺</span>
              </div>
            )}
            {extraCosts > 0 && (
              <div className="flex justify-between">
                <span>Ek Maliyetler:</span>
                <span>{extraCosts.toLocaleString("tr-TR")} ₺</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Genel Toplam:</span>
              <span>{grandTotal.toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Oluştur Butonu */}
      <div className="flex justify-center">
        <button
          onClick={handleGeneratePdf}
          disabled={loading}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-lg font-medium"
        >
          {loading ? "PDF Oluşturuluyor..." : "PDF Oluştur ve İndir"}
        </button>
      </div>
    </div>
  );
};

export default ProposalFormWithProducts;
