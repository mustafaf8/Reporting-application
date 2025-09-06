import React from "react";
import { GlobalStyles } from "@/types/block-editor";
import { useEditorStore } from "@/lib/stores/editor-store";

interface GlobalSettingsProps {
  className?: string;
}

export const GlobalSettings: React.FC<GlobalSettingsProps> = ({
  className = "",
}) => {
  const { globalStyles, updateGlobalStyles } = useEditorStore();

  const handleStyleChange = (key: keyof GlobalStyles, value: any) => {
    updateGlobalStyles({ [key]: value });
  };

  return (
    <div
      className={`global-settings bg-white rounded-lg shadow-sm border border-slate-200 ${className}`}
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Global Ayarlar
        </h3>

        {/* Color scheme */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-slate-700">Renk Paleti</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Ana Renk
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={globalStyles.primaryColor}
                  onChange={(e) =>
                    handleStyleChange("primaryColor", e.target.value)
                  }
                  className="w-8 h-8 rounded border border-slate-200"
                />
                <input
                  type="text"
                  value={globalStyles.primaryColor}
                  onChange={(e) =>
                    handleStyleChange("primaryColor", e.target.value)
                  }
                  className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                İkincil Renk
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={globalStyles.secondaryColor}
                  onChange={(e) =>
                    handleStyleChange("secondaryColor", e.target.value)
                  }
                  className="w-8 h-8 rounded border border-slate-200"
                />
                <input
                  type="text"
                  value={globalStyles.secondaryColor}
                  onChange={(e) =>
                    handleStyleChange("secondaryColor", e.target.value)
                  }
                  className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Arka Plan Rengi
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={globalStyles.backgroundColor}
                  onChange={(e) =>
                    handleStyleChange("backgroundColor", e.target.value)
                  }
                  className="w-8 h-8 rounded border border-slate-200"
                />
                <input
                  type="text"
                  value={globalStyles.backgroundColor}
                  onChange={(e) =>
                    handleStyleChange("backgroundColor", e.target.value)
                  }
                  className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Metin Rengi
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={globalStyles.textColor}
                  onChange={(e) =>
                    handleStyleChange("textColor", e.target.value)
                  }
                  className="w-8 h-8 rounded border border-slate-200"
                />
                <input
                  type="text"
                  value={globalStyles.textColor}
                  onChange={(e) =>
                    handleStyleChange("textColor", e.target.value)
                  }
                  className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-slate-700">Tipografi</h4>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Font Ailesi
            </label>
            <select
              value={globalStyles.fontFamily}
              onChange={(e) => handleStyleChange("fontFamily", e.target.value)}
              className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Inter, sans-serif">Inter</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Helvetica, sans-serif">Helvetica</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Times New Roman, serif">Times New Roman</option>
              <option value="Courier New, monospace">Courier New</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Font Boyutu
              </label>
              <input
                type="number"
                value={globalStyles.fontSize}
                onChange={(e) =>
                  handleStyleChange("fontSize", parseInt(e.target.value))
                }
                className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Satır Yüksekliği
              </label>
              <input
                type="number"
                step="0.1"
                value={globalStyles.lineHeight}
                onChange={(e) =>
                  handleStyleChange("lineHeight", parseFloat(e.target.value))
                }
                className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Spacing */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-slate-700">Boşluklar</h4>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Genel Boşluk
            </label>
            <input
              type="number"
              value={globalStyles.spacing}
              onChange={(e) =>
                handleStyleChange("spacing", parseInt(e.target.value))
              }
              className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Bloklar arası varsayılan boşluk miktarı
            </p>
          </div>
        </div>

        {/* Border radius */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-700">Köşe Yuvarlaklığı</h4>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Genel Köşe Yuvarlaklığı
            </label>
            <input
              type="number"
              value={globalStyles.borderRadius}
              onChange={(e) =>
                handleStyleChange("borderRadius", parseInt(e.target.value))
              }
              className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Tüm bloklar için varsayılan köşe yuvarlaklığı
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Önizleme</h4>
          <div
            className="p-3 rounded"
            style={{
              backgroundColor: globalStyles.backgroundColor,
              color: globalStyles.textColor,
              fontFamily: globalStyles.fontFamily,
              fontSize: globalStyles.fontSize,
              lineHeight: globalStyles.lineHeight,
              borderRadius: globalStyles.borderRadius,
            }}
          >
            <h3 style={{ color: globalStyles.primaryColor }}>Örnek Başlık</h3>
            <p className="mt-2">
              Bu bir örnek metin paragrafıdır. Global ayarların nasıl
              görüneceğini gösterir.
            </p>
            <div
              className="mt-2 px-2 py-1 rounded text-sm"
              style={{
                backgroundColor: globalStyles.secondaryColor,
                color: "white",
              }}
            >
              İkincil renk örneği
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
