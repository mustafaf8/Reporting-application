"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import { Template } from "@/types";

const TemplateGalleryPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/templates");
      setTemplates(data.items || data.templates || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Şablonlar yüklenemedi");
      toast.error("Şablonlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Şablonlar yükleniyor..." />
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Şablon Galerisi
        </h1>
        <p className="text-gray-600 mb-6">
          Mevcut teklif şablonlarını görüntüleyin ve düzenleyin.
        </p>

        {templates.length === 0 ? (
          <EmptyState
            title="Henüz şablon bulunmuyor"
            description="Sistemde kayıtlı şablon bulunmuyor."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template._id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                  {template.previewImageUrl ? (
                    <img
                      src={template.previewImageUrl}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <svg
                          className="w-12 h-12 mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-sm">Önizleme yok</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        template.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {template.isActive ? "Aktif" : "Pasif"}
                    </span>

                    <div className="flex space-x-2">
                      <Link
                        href={`/editor?templateId=${template._id}`}
                        className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        Düzenle
                      </Link>
                      <Link
                        href={`/proposals/create?templateId=${template._id}`}
                        className="px-3 py-1 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded transition-colors"
                      >
                        Kullan
                      </Link>
                    </div>
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

export default TemplateGalleryPage;
