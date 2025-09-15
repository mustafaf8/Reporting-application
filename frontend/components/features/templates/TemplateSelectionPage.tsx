"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@/lib/stores/editor-store";
import { api } from "@/lib/api";
import { Template } from "@/types";

interface TemplateCardProps {
  template: Template;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  const router = useRouter();
  const { loadTemplateFromData } = useEditorStore();

  const handleTemplateSelect = async () => {
    try {
      // Sunucudan tam şablonu yükle (gerekirse /api/templates/:id)
      const res = await fetch(`/api/templates/${template._id}`);
      const data = await res.json();

      // Editor state'ini doldur
      loadTemplateFromData({
        id: data._id || data.id,
        name: data.name,
        description: data.description,
        blocks: data.blocks || [],
        globalStyles: data.globalStyles || {
          ...data.globalStyles,
        },
        canvasSize: data.canvasSize || { width: 800, height: 1000, unit: "px" },
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        userId: data.owner || "",
      });

      // Editör sayfasına yönlendir
      router.push(`/editor-v2?templateId=${template._id}`);
    } catch (_) {
      // Hata durumda fallback olarak query ile yönlendirebiliriz
      router.push(`/editor-v2?templateId=${template._id}`);
    }
  };

  return (
    <div className="group rounded-lg border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow">
      <button onClick={handleTemplateSelect} className="block w-full text-left">
        <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
          {template.previewImageUrl ? (
            <img
              src={template.previewImageUrl}
              alt={template.name}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-gray-400 text-sm">
              Önizleme yok
            </div>
          )}
        </div>
      </button>
      <div className="p-3">
        <div className="font-semibold text-gray-900 truncate">
          {template.name}
        </div>
        {template.description && (
          <div className="text-xs text-gray-500 mt-0.5">
            {template.description}
          </div>
        )}
        <div className="mt-3">
          <button
            onClick={handleTemplateSelect}
            className="w-full px-3 py-2 text-center text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded font-medium"
          >
            Kullan
          </button>
        </div>
      </div>
    </div>
  );
};

const TemplateSelectionPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/api/templates");
        if (mounted) setTemplates(data.items || []);
      } catch (err: any) {
        if (mounted)
          setError(
            err.response?.data?.message ||
              "Şablonlar yüklenirken bir hata oluştu"
          );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Teklif Şablonu Seçin
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Aşağıdan bir şablon seçin. Seçim sonrası teklif bilgilerini
          dolduracağınız sayfaya yönlendirileceksiniz.
        </p>
      </div>

      {loading && <div className="text-gray-600">Yükleniyor...</div>}
      {error && (
        <div className="text-red-600 text-sm" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <TemplateCard key={t._id} template={t} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateSelectionPage;
