"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api/index";
import { Product } from "@/types/index";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ProductSelectorProps {
  onProductSelect: (products: Product[]) => void;
  selectedProducts: Product[];
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  onProductSelect,
  selectedProducts,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    selectedProducts.map((p) => p._id)
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const selected = products.filter((p) => selectedIds.includes(p._id));
    onProductSelect(selected);
  }, [selectedIds, products, onProductSelect]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/products");
      setProducts(response.data?.items || []);
    } catch (error) {
      console.error("Ürünler yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductToggle = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner size="md" text="Ürünler yükleniyor..." />;
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="Ürün ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
        {filteredProducts.map((product) => (
          <div
            key={product._id}
            className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
              selectedIds.includes(product._id) ? "bg-indigo-50" : ""
            }`}
            onClick={() => handleProductToggle(product._id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{product.name}</div>
                {product.description && (
                  <div className="text-sm text-gray-500">
                    {product.description}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  {product.unitPrice.toLocaleString("tr-TR")} ₺ / {product.unit}
                </div>
              </div>
              <div className="ml-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product._id)}
                  onChange={() => handleProductToggle(product._id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedProducts.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Seçilen Ürünler ({selectedProducts.length})
          </div>
          <div className="space-y-1">
            {selectedProducts.map((product) => (
              <div key={product._id} className="text-sm text-gray-600">
                {product.name} - {product.unitPrice.toLocaleString("tr-TR")} ₺
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSelector;
