import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/hooks/useAuth";

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  // Admin kontrolü
  useEffect(() => {
    if (user && user.role !== "admin") {
      toast.error("Bu sayfaya erişim yetkiniz yok");
      navigate("/");
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    unit: "adet",
    unitPrice: "",
    category: "",
    description: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const units = [
    { value: "adet", label: "Adet" },
    { value: "kg", label: "Kilogram" },
    { value: "m", label: "Metre" },
    { value: "m²", label: "Metrekare" },
    { value: "m³", label: "Metreküp" },
    { value: "lt", label: "Litre" },
    { value: "paket", label: "Paket" },
    { value: "set", label: "Set" },
  ];

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchProduct();
    }
  }, [id, isEdit]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/products/${id}`);
      setFormData({
        name: data.name || "",
        unit: data.unit || "adet",
        unitPrice: data.unitPrice || "",
        category: data.category || "",
        description: data.description || "",
        isActive: data.isActive !== undefined ? data.isActive : true,
      });
    } catch (err) {
      toast.error("Ürün bilgileri yüklenemedi");
      console.error("Product fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/api/products/categories/list");
      setCategories(data);
    } catch (err) {
      console.error("Categories fetch error:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Ürün adı zorunludur");
      return;
    }

    if (!formData.unitPrice || formData.unitPrice <= 0) {
      toast.error("Geçerli bir fiyat giriniz");
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        unitPrice: parseFloat(formData.unitPrice),
      };

      if (isEdit) {
        await api.put(`/api/products/${id}`, submitData);
        toast.success("Ürün başarıyla güncellendi");
      } else {
        await api.post("/api/products", submitData);
        toast.success("Ürün başarıyla oluşturuldu");
      }

      navigate("/products");
    } catch (err) {
      toast.error(
        isEdit
          ? "Ürün güncellenirken hata oluştu"
          : "Ürün oluşturulurken hata oluştu"
      );
      console.error("Product submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Admin değilse erişim engellendi mesajı
  if (user && user.role !== "admin") {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Erişim Engellendi
          </h2>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz yok.</p>
        </div>
      </div>
    );
  }

  if (loading && isEdit) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ürün Adı *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ürün adını giriniz"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birim *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {units.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birim Fiyat (₺) *
              </label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              list="categories"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Kategori giriniz"
            />
            <datalist id="categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ürün açıklaması"
            />
          </div>

          {isEdit && (
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Ürün aktif
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
