import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";
import ProductSelector from "../../products/components/ProductSelector";

const EditProposalPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    name: "",
    quantity: 1,
    unitPrice: 0,
  });

  // KDV, iskonto, ek maliyet
  const [vatRate, setVatRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);
  const [extraCosts, setExtraCosts] = useState(0);

  // Müşteri bilgileri
  const [customer, setCustomer] = useState({
    fullName: "",
    companyName: "",
    phone: "",
    address: "",
    email: "",
  });

  // Teklifi veren kişi
  const [issuer, setIssuer] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    fetchProposal();
  }, [id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/proposals/${id}`);
      setProposal(data);

      // Form verilerini doldur
      setCustomer({
        fullName: data.customerName || "",
        companyName: data.customer?.companyName || "",
        phone: data.customer?.phone || "",
        address: data.customer?.address || "",
        email: data.customer?.email || "",
      });

      setIssuer({
        name: data.issuer?.name || "",
        phone: data.issuer?.phone || "",
      });

      setItems(data.items || []);
      setVatRate(data.vatRate || 0);
      setDiscountRate(data.discountRate || 0);
      setExtraCosts(data.extraCosts || 0);
    } catch (err) {
      toast.error("Teklif bilgileri yüklenemedi");
      console.error("Proposal fetch error:", err);
      navigate("/proposals");
    } finally {
      setLoading(false);
    }
  };

  // Ürün seçimi işlemi
  const handleProductSelect = (products) => {
    setSelectedProducts(products);
    // Seçilen ürünleri items listesine ekle
    const newItems = products.map((product) => ({
      name: product.name,
      quantity: 1,
      unitPrice: product.unitPrice,
    }));
    setItems(newItems);
  };

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
  const handleRemoveItem = (indexToRemove) => {
    setItems(items.filter((_, index) => index !== indexToRemove));
    toast.success("Malzeme kaldırıldı");
  };

  // Malzeme güncelleme
  const handleUpdateItem = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  // Teklif güncelleme
  const handleUpdateProposal = async () => {
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

    setSaving(true);

    try {
      const payload = {
        customerName: customer.fullName,
        items,
        vatRate,
        discountRate,
        extraCosts,
        customer,
        issuer,
      };

      await api.put(`/api/proposals/${id}`, payload);
      toast.success("Teklif başarıyla güncellendi!");
      navigate("/proposals");
    } catch (err) {
      toast.error("Teklif güncellenirken hata oluştu");
      console.error("Update error:", err);
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Teklif bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Teklif Düzenle</h2>
        <button
          onClick={() => navigate("/proposals")}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Geri Dön
        </button>
      </div>

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

      {/* Güncelle Butonu */}
      <div className="flex justify-center">
        <button
          onClick={handleUpdateProposal}
          disabled={saving}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-lg font-medium"
        >
          {saving ? "Güncelleniyor..." : "Teklifi Güncelle"}
        </button>
      </div>
    </div>
  );
};

export default EditProposalPage;
