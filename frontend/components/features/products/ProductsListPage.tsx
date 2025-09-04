"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api/index";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import { Product } from "@/types/index";

const ProductsListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("q", searchTerm);
      if (categoryFilter) params.append("category", categoryFilter);

      const { data } = await api.get(`/api/products?${params.toString()}`);
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Ürünler yüklenemedi");
      toast.error("Ürünler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Ürünler yükleniyor..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ürün Kataloğu</h2>

        {/* Filtreler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ürün Adı ile Ara
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün adı girin..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori Filtresi
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tüm Kategoriler</option>
              <option value="solar-panel">Güneş Paneli</option>
              <option value="inverter">İnverter</option>
              <option value="battery">Batarya</option>
              <option value="mounting">Montaj</option>
              <option value="other">Diğer</option>
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            }
            title="Henüz ürün bulunmuyor"
            description="Katalogda ürün bulunmuyor."
            action={
              <Link
                href="/products/create"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <span className="mr-2">+</span>
                Ürün Ekle
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {product.name}
                    </h3>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {product.description}
                  </p>

                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-indigo-600">
                      {product.price.toLocaleString("tr-TR")} ₺
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.isActive ? "Stokta" : "Stokta Yok"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsListPage;
