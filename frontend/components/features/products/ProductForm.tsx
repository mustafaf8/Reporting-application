"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Product, CreateProductRequest, UpdateProductRequest } from "@/types";

interface ProductFormProps {
  productId?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ productId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!productId);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    isActive: true,
  });

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoadingData(true);
      const { data } = await api.get(`/api/products/${productId}`);
      setFormData({
        name: data.product.name,
        description: data.product.description,
        price: data.product.price,
        category: data.product.category,
        isActive: data.product.isActive,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ürün yüklenemedi");
      router.push("/products");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (productId) {
        const updateData = {
          ...formData,
        };
        await api.put(`/api/products/${productId}`, updateData);
        toast.success("Ürün başarıyla güncellendi");
      } else {
        const createData: CreateProductRequest = {
          name: formData.name,
          description: formData.description,
          unit: "adet",
          unitPrice: formData.price,
          category: formData.category,
          isActive: formData.isActive,
        };
        await api.post("/api/products", createData);
        toast.success("Ürün başarıyla oluşturuldu");
      }
      router.push("/products");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "İşlem başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  if (loadingData) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Ürün yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {productId ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
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
              placeholder="Ürün adını girin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ürün açıklamasını girin"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiyat (₺) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Kategori seçin</option>
                <option value="solar-panel">Güneş Paneli</option>
                <option value="inverter">İnverter</option>
                <option value="battery">Batarya</option>
                <option value="mounting">Montaj</option>
                <option value="other">Diğer</option>
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Ürün aktif (stokta mevcut)
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Kaydediliyor..." : productId ? "Güncelle" : "Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
