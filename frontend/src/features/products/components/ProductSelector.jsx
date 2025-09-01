import React, { useState, useEffect } from "react";
import api from "../../../services/api";

const ProductSelector = ({ onProductSelect, selectedProducts = [] }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showModal) {
      fetchProducts();
      fetchCategories();
    }
  }, [showModal, searchTerm, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("isActive", "true"); // Sadece aktif ürünleri getir
      if (searchTerm) params.append("q", searchTerm);
      if (categoryFilter) params.append("category", categoryFilter);

      const { data } = await api.get(`/api/products?${params.toString()}`);
      setProducts(data.items || []);
    } catch (err) {
      console.error("Products fetch error:", err);
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

  const handleProductSelect = (product) => {
    // Eğer ürün zaten seçilmişse, seçimi kaldır
    if (selectedProducts.some((p) => p._id === product._id)) {
      onProductSelect(selectedProducts.filter((p) => p._id !== product._id));
    } else {
      // Ürünü seçili listeye ekle
      onProductSelect([...selectedProducts, product]);
    }
  };

  const isProductSelected = (productId) => {
    return selectedProducts.some((p) => p._id === productId);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Ürün Seç ({selectedProducts.length})
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Ürün Seç</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Kapat</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Filtresi
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Tüm Kategoriler</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Ürün bulunamadı
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isProductSelected(product._id)
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {product.name}
                            </h4>
                            {product.category && (
                              <p className="text-sm text-gray-500">
                                {product.category}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              {product.unitPrice.toLocaleString("tr-TR")} ₺ /{" "}
                              {product.unit}
                            </p>
                          </div>
                          <div className="ml-2">
                            {isProductSelected(product._id) && (
                              <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Products Summary */}
              {selectedProducts.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Seçilen Ürünler ({selectedProducts.length})
                  </h4>
                  <div className="space-y-1">
                    {selectedProducts.map((product) => (
                      <div
                        key={product._id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-700">{product.name}</span>
                        <span className="text-gray-500">
                          {product.unitPrice.toLocaleString("tr-TR")} ₺
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Kapat
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductSelector;
