"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api/index";
import ImageUpload from "@/components/ui/ImageUpload";
import { Template } from "@/types/index";

interface Block {
  id: string | number;
  title?: string;
  type?: string;
  subtitle?: string;
  bindKey?: string;
  defaultText?: string;
}

interface Structure {
  blocks: Block[];
  defaults?: Record<string, string>;
}

interface Customizations {
  texts: Record<string, string>;
  design: {
    primaryColor?: string;
    secondaryColor?: string;
  };
  brand: {
    logoUrl?: string;
  };
  images: {
    hero?: string;
    gallery?: string[];
  };
  company: {
    name?: string;
    tagline?: string;
    description?: string;
    address?: string;
    expertise?: string;
    serviceArea?: string;
    taxNumber?: string;
    website?: string;
    email?: string;
    stats?: {
      projects?: string;
      experience?: string;
      satisfaction?: string;
    };
  };
}

interface LeftPanelProps {
  structure: Structure | null;
  onReorder: () => void;
  selectedBlockId: string | number | null;
  onSelect: (id: string | number) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  structure,
  onReorder,
  selectedBlockId,
  onSelect,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
          <h3 className="font-semibold text-slate-800">Bloklar</h3>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {(structure?.blocks || []).map((block, idx) => (
          <button
            key={block.id || idx}
            onClick={() => onSelect(block.id || idx)}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
              (block.id || idx) === selectedBlockId
                ? "bg-indigo-50 border-indigo-200 shadow-sm"
                : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  (block.id || idx) === selectedBlockId
                    ? "bg-indigo-500"
                    : "bg-slate-300"
                }`}
              ></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">
                  {block.title || block.type || `Blok ${idx + 1}`}
                </div>
                {block.subtitle && (
                  <div className="text-xs text-slate-500 mt-1">
                    {block.subtitle}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
        {(!structure?.blocks || structure.blocks.length === 0) && (
          <div className="text-center py-8">
            <div className="text-slate-400 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
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
            </div>
            <p className="text-sm text-slate-500">Henüz blok bulunmuyor</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface PreviewPanelProps {
  templateId: string | null;
  customizations: Customizations;
  onInlineEdit: (key: string, value: string) => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  templateId,
  customizations,
  onInlineEdit,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Preview URL'ini güncelle
  useEffect(() => {
    if (!templateId) return;

    const updatePreview = async () => {
      setIsLoading(true);
      setError("");
      setDebugInfo("");

      try {
        // API base URL'ini al
        const baseURL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
        const apiUrl = `${baseURL}/api/templates/${templateId}/preview`;

        console.log("API URL:", apiUrl);
        console.log("Template ID:", templateId);
        console.log("Customizations:", customizations);

        setDebugInfo(`API URL: ${apiUrl}\nTemplate ID: ${templateId}`);

        // Önce backend'in çalışıp çalışmadığını test et
        try {
          const healthCheck = await fetch(`${baseURL}/health`);
          console.log("Health check status:", healthCheck.status);
          setDebugInfo(
            (prev) => prev + `\nHealth Check: ${healthCheck.status}`
          );
        } catch (healthError) {
          console.error("Health check failed:", healthError);
          const errorMessage =
            healthError instanceof Error
              ? healthError.message
              : String(healthError);
          setError(`Backend sunucusuna bağlanılamadı: ${errorMessage}`);
          setDebugInfo(
            (prev) => prev + `\nHealth Check Failed: ${errorMessage}`
          );
          return;
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName: "Önizleme Müşterisi",
            items: [
              { name: "Örnek Ürün 1", quantity: 2, unitPrice: 150 },
              { name: "Örnek Ürün 2", quantity: 1, unitPrice: 300 },
            ],
            customizations: customizations,
            company: {
              logoUrl: customizations?.brand?.logoUrl,
            },
            issuer: {
              name: "Şirket Adı",
              phone: "+90 555 123 45 67",
            },
          }),
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        setDebugInfo((prev) => prev + `\nResponse Status: ${response.status}`);

        if (response.ok) {
          const html = await response.text();
          console.log("HTML received, length:", html.length);
          setDebugInfo((prev) => prev + `\nHTML Length: ${html.length}`);
          const blob = new Blob([html], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        } else {
          const errorText = await response.text();
          console.error("API Error:", response.status, errorText);
          setError(`API Hatası: ${response.status} - ${errorText}`);
          setDebugInfo(
            (prev) => prev + `\nAPI Error: ${response.status} - ${errorText}`
          );

          // Hata durumunda fallback HTML göster
          const fallbackHtml = `
            <html>
              <body style="padding: 20px; font-family: Arial, sans-serif;">
                <h2>Önizleme Yüklenemedi</h2>
                <p>Hata: ${response.status} - ${errorText}</p>
                <p>API URL: ${apiUrl}</p>
                <p>Lütfen backend sunucusunun çalıştığından emin olun.</p>
              </body>
            </html>
          `;
          const blob = new Blob([fallbackHtml], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("Preview güncellenirken hata:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setError(`Bağlantı Hatası: ${errorMessage}`);
        setDebugInfo((prev) => prev + `\nNetwork Error: ${errorMessage}`);

        // Network hatası durumunda fallback HTML göster
        const fallbackHtml = `
          <html>
            <body style="padding: 20px; font-family: Arial, sans-serif;">
              <h2>Bağlantı Hatası</h2>
              <p>Backend sunucusuna bağlanılamadı.</p>
              <p>Hata: ${errorMessage}</p>
              <p>Lütfen backend sunucusunun çalıştığından emin olun.</p>
            </body>
          </html>
        `;
        const blob = new Blob([fallbackHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } finally {
        setIsLoading(false);
      }
    };

    updatePreview();
  }, [templateId, customizations]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            Şablon Önizlemesi
          </h3>
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span>Güncelleniyor...</span>
              </div>
            )}
            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Hata</span>
              </div>
            )}
          </div>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        {debugInfo && (
          <details className="mt-2">
            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
              Debug Bilgileri
            </summary>
            <pre className="mt-1 text-xs text-slate-600 bg-slate-100 p-2 rounded overflow-auto">
              {debugInfo}
            </pre>
          </details>
        )}
      </div>

      <div className="relative" style={{ height: "600px" }}>
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="Template Preview"
            onLoad={() => setIsLoading(false)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-slate-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-500">Şablon yükleniyor...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface RightPanelProps {
  customizations: Customizations;
  setCustomizations: React.Dispatch<React.SetStateAction<Customizations>>;
  selectedBlockId: string | number | null;
}

const RightPanel: React.FC<RightPanelProps> = ({
  customizations,
  setCustomizations,
  selectedBlockId,
}) => {
  const primary = customizations?.design?.primaryColor || "#4f46e5";
  const secondary = customizations?.design?.secondaryColor || "#7c3aed";

  const updateColor = (key: string, value: string) => {
    setCustomizations((prev) => ({
      ...prev,
      design: { ...prev.design, [key]: value },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Markalama Bölümü */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <h3 className="font-semibold text-slate-800">Markalama</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Renk Seçimi */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ana Renk
              </label>
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg border-2 border-slate-200 shadow-sm cursor-pointer"
                  style={{ backgroundColor: primary }}
                  onClick={() =>
                    document.getElementById("primary-color")?.click()
                  }
                />
                <input
                  id="primary-color"
                  type="color"
                  value={primary}
                  onChange={(e) => updateColor("primaryColor", e.target.value)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={primary}
                    onChange={(e) =>
                      updateColor("primaryColor", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="#4f46e5"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                İkincil Renk
              </label>
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg border-2 border-slate-200 shadow-sm cursor-pointer"
                  style={{ backgroundColor: secondary }}
                  onClick={() =>
                    document.getElementById("secondary-color")?.click()
                  }
                />
                <input
                  id="secondary-color"
                  type="color"
                  value={secondary}
                  onChange={(e) =>
                    updateColor("secondaryColor", e.target.value)
                  }
                  className="sr-only"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={secondary}
                    onChange={(e) =>
                      updateColor("secondaryColor", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="#7c3aed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo Yükleme */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Logo
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
              <ImageUpload
                currentImageUrl={customizations?.brand?.logoUrl}
                onImageChange={(url: string | null) =>
                  setCustomizations((prev) => ({
                    ...prev,
                    brand: { ...prev.brand, logoUrl: url || undefined },
                  }))
                }
                size="lg"
                uploadType="logo"
                placeholder="Logo yüklemek için tıklayın"
              />
            </div>
            {customizations?.brand?.logoUrl && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">
                    Logo başarıyla yüklendi
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resim Yönetimi */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h3 className="font-semibold text-slate-800">Resim Yönetimi</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Hero Resmi */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Ana Resim (Hero)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-green-300 transition-colors">
              <ImageUpload
                currentImageUrl={customizations?.images?.hero}
                onImageChange={(url: string | null) =>
                  setCustomizations((prev) => ({
                    ...prev,
                    images: { ...prev.images, hero: url || undefined },
                  }))
                }
                size="lg"
                uploadType="hero"
                placeholder="Ana resim yüklemek için tıklayın"
              />
            </div>
            {customizations?.images?.hero && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">
                    Ana resim yüklendi
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Galeri Resimleri */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Galeri Resimleri
            </label>
            <div className="space-y-3">
              {(customizations?.images?.gallery || []).map(
                (imageUrl, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <img
                      src={imageUrl}
                      alt={`Galeri ${index + 1}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">
                        Resim {index + 1}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {imageUrl}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const newGallery = [
                          ...(customizations?.images?.gallery || []),
                        ];
                        newGallery.splice(index, 1);
                        setCustomizations((prev) => ({
                          ...prev,
                          images: { ...prev.images, gallery: newGallery },
                        }));
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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
                )
              )}

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                <ImageUpload
                  currentImageUrl={undefined}
                  onImageChange={(url: string | null) => {
                    if (url) {
                      setCustomizations((prev) => ({
                        ...prev,
                        images: {
                          ...prev.images,
                          gallery: [...(prev.images?.gallery || []), url],
                        },
                      }));
                    }
                  }}
                  size="md"
                  uploadType="gallery"
                  placeholder="Galeri resmi yüklemek için tıklayın"
                />
              </div>

              {customizations?.images?.gallery &&
                customizations.images.gallery.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-700">
                        {customizations.images.gallery.length} resim yüklendi
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Şirket Bilgileri */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <h3 className="font-semibold text-slate-800">Şirket Bilgileri</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Şirket Adı
              </label>
              <input
                type="text"
                value={customizations?.company?.name || ""}
                onChange={(e) =>
                  setCustomizations((prev) => ({
                    ...prev,
                    company: { ...prev.company, name: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Şirket Adı"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Slogan
              </label>
              <input
                type="text"
                value={customizations?.company?.tagline || ""}
                onChange={(e) =>
                  setCustomizations((prev) => ({
                    ...prev,
                    company: { ...prev.company, tagline: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Slogan"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={customizations?.company?.description || ""}
              onChange={(e) =>
                setCustomizations((prev) => ({
                  ...prev,
                  company: { ...prev.company, description: e.target.value },
                }))
              }
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Şirket açıklaması"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Adres
              </label>
              <input
                type="text"
                value={customizations?.company?.address || ""}
                onChange={(e) =>
                  setCustomizations((prev) => ({
                    ...prev,
                    company: { ...prev.company, address: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Adres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Uzmanlık
              </label>
              <input
                type="text"
                value={customizations?.company?.expertise || ""}
                onChange={(e) =>
                  setCustomizations((prev) => ({
                    ...prev,
                    company: { ...prev.company, expertise: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Uzmanlık alanı"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Projeler
              </label>
              <input
                type="text"
                value={customizations?.company?.stats?.projects || ""}
                onChange={(e) =>
                  setCustomizations((prev) => ({
                    ...prev,
                    company: {
                      ...prev.company,
                      stats: {
                        ...prev.company.stats,
                        projects: e.target.value,
                      },
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="100+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Deneyim
              </label>
              <input
                type="text"
                value={customizations?.company?.stats?.experience || ""}
                onChange={(e) =>
                  setCustomizations((prev) => ({
                    ...prev,
                    company: {
                      ...prev.company,
                      stats: {
                        ...prev.company.stats,
                        experience: e.target.value,
                      },
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="5+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Memnuniyet
              </label>
              <input
                type="text"
                value={customizations?.company?.stats?.satisfaction || ""}
                onChange={(e) =>
                  setCustomizations((prev) => ({
                    ...prev,
                    company: {
                      ...prev.company,
                      stats: {
                        ...prev.company.stats,
                        satisfaction: e.target.value,
                      },
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="%95"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Blok Ayarları */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            <h3 className="font-semibold text-slate-800">Blok Ayarları</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="text-sm text-slate-600">
            <span className="font-medium">Seçili blok:</span>{" "}
            {String(selectedBlockId ?? "Yok")}
          </div>
          {selectedBlockId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-blue-700">
                  Blok düzenleme özellikleri yakında gelecek
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const STORAGE_KEY = "proposal_editor_customizations";

const ProposalEditor: React.FC = () => {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const router = useRouter();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [customizations, setCustomizations] = useState<Customizations>({
    texts: {},
    design: {},
    brand: {},
    images: {},
    company: {},
  });
  const [selectedBlockId, setSelectedBlockId] = useState<
    string | number | null
  >(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!templateId) return;
        const { data } = await api.get(`/api/templates/${templateId}`);
        setTemplate(data);
        // Varsayılanları customizations içine kopyala (metinler/design)
        setCustomizations((prev) => ({
          ...prev,
          design: { ...data.design, ...prev.design },
          texts: { ...(data.structure?.defaults || {}), ...prev.texts },
        }));
        // localStorage'daki son düzenlemeleri yükle
        const cached = localStorage.getItem(`${STORAGE_KEY}:${templateId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setCustomizations((prev) => ({ ...prev, ...parsed }));
          } catch (_) {}
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [templateId]);

  const onInlineEdit = (key: string, value: string) => {
    setCustomizations((prev) => ({
      ...prev,
      texts: { ...prev.texts, [key]: value },
    }));
  };

  // localStorage'ye otomatik kaydet
  useEffect(() => {
    if (!templateId) return;
    const toSave = JSON.stringify(customizations);
    localStorage.setItem(`${STORAGE_KEY}:${templateId}`, toSave);
  }, [templateId, customizations]);

  const goToForm = () => {
    router.push(`/proposals/create?templateId=${templateId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Şablon Yükleniyor
          </h2>
          <p className="text-slate-600">Lütfen bekleyin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Teklif Editörü
              </h1>
              <p className="text-slate-600 mt-2">
                Şablonunuzu özelleştirin ve canlı önizleme yapın
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <LeftPanel
              structure={template?.structure}
              onReorder={() => {}}
              selectedBlockId={selectedBlockId}
              onSelect={setSelectedBlockId}
            />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <PreviewPanel
              templateId={templateId}
              customizations={customizations}
              onInlineEdit={onInlineEdit}
            />
          </div>
          <div className="col-span-12 lg:col-span-3">
            <RightPanel
              customizations={customizations}
              setCustomizations={setCustomizations}
              selectedBlockId={selectedBlockId}
            />
            <div className="mt-6">
              <button
                onClick={goToForm}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Devam Et ve Teklif Oluştur</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalEditor;
