import React from "react";
import { Block, GlobalStyles } from "@/types/block-editor";
import { useEditorStore } from "@/lib/stores/editor-store";

interface BlockSettingsProps {
  className?: string;
}

export const BlockSettings: React.FC<BlockSettingsProps> = ({
  className = "",
}) => {
  const {
    blocks,
    selectedBlockId,
    updateBlock,
    globalStyles,
    updateGlobalStyles,
  } = useEditorStore();

  const selectedBlock = selectedBlockId
    ? blocks.find((block) => block.id === selectedBlockId)
    : null;

  if (!selectedBlock) {
    return (
      <div
        className={`block-settings bg-white rounded-lg shadow-sm border border-slate-200 ${className}`}
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            Blok Ayarları
          </h3>
          <div className="text-center py-8 text-slate-500">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-sm">Düzenlemek için bir blok seçin</p>
          </div>
        </div>
      </div>
    );
  }

  const handleStyleChange = (
    styleKey: keyof typeof selectedBlock.styles,
    value: any
  ) => {
    updateBlock(selectedBlock.id, {
      styles: {
        ...selectedBlock.styles,
        [styleKey]: value,
      },
    });
  };

  const handlePaddingChange = (
    side: keyof typeof selectedBlock.styles.padding,
    value: number
  ) => {
    updateBlock(selectedBlock.id, {
      styles: {
        ...selectedBlock.styles,
        padding: {
          ...selectedBlock.styles.padding,
          [side]: value,
        },
      },
    });
  };

  const handleMarginChange = (
    side: keyof typeof selectedBlock.styles.margin,
    value: number
  ) => {
    updateBlock(selectedBlock.id, {
      styles: {
        ...selectedBlock.styles,
        margin: {
          ...selectedBlock.styles.margin,
          [side]: value,
        },
      },
    });
  };

  return (
    <div
      className={`block-settings bg-white rounded-lg shadow-sm border border-slate-200 ${className}`}
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">
          Blok Ayarları
        </h3>

        {/* Block info */}
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl">
              {selectedBlock.type === "text" && "📝"}
              {selectedBlock.type === "heading" && "📋"}
              {selectedBlock.type === "image" && "🖼️"}
              {selectedBlock.type === "table" && "📊"}
              {selectedBlock.type === "spacer" && "⬜"}
              {selectedBlock.type === "divider" && "➖"}
              {selectedBlock.type === "customer-info" && "👤"}
              {selectedBlock.type === "company-info" && "🏢"}
              {selectedBlock.type === "pricing-table" && "💰"}
              {selectedBlock.type === "gallery" && "🖼️"}
              {selectedBlock.type === "hero-section" && "🎯"}
              {selectedBlock.type === "footer" && "📄"}
              {selectedBlock.type === "header" && "📋"}
            </span>
            <div>
              <h4 className="font-medium text-slate-800">
                {selectedBlock.metadata.title}
              </h4>
              <p className="text-xs text-slate-500">
                {selectedBlock.metadata.category}
              </p>
            </div>
          </div>
        </div>

        {/* Typography settings */}
        {(selectedBlock.type === "text" ||
          selectedBlock.type === "heading") && (
          <div className="space-y-4 mb-6">
            <h4 className="font-medium text-slate-700">Tipografi</h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Font Boyutu
                </label>
                <input
                  type="number"
                  value={selectedBlock.styles.fontSize || 16}
                  onChange={(e) =>
                    handleStyleChange("fontSize", parseInt(e.target.value))
                  }
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Font Ağırlığı
                </label>
                <select
                  value={selectedBlock.styles.fontWeight || "normal"}
                  onChange={(e) =>
                    handleStyleChange("fontWeight", e.target.value)
                  }
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="light">Light</option>
                  <option value="normal">Normal</option>
                  <option value="semibold">Semibold</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Hizalama
              </label>
              <div className="flex space-x-1">
                {["left", "center", "right", "justify"].map((align) => (
                  <button
                    key={align}
                    onClick={() => handleStyleChange("textAlign", align)}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedBlock.styles.textAlign === align
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {align === "left" && "⬅️"}
                    {align === "center" && "↔️"}
                    {align === "right" && "➡️"}
                    {align === "justify" && "⬌"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Color settings */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-slate-700">Renkler</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Metin Rengi
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={selectedBlock.styles.color || "#1f2937"}
                  onChange={(e) => handleStyleChange("color", e.target.value)}
                  className="w-8 h-8 rounded border border-slate-200"
                />
                <input
                  type="text"
                  value={selectedBlock.styles.color || "#1f2937"}
                  onChange={(e) => handleStyleChange("color", e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Arka Plan
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={selectedBlock.styles.backgroundColor || "#ffffff"}
                  onChange={(e) =>
                    handleStyleChange("backgroundColor", e.target.value)
                  }
                  className="w-8 h-8 rounded border border-slate-200"
                />
                <input
                  type="text"
                  value={selectedBlock.styles.backgroundColor || "#ffffff"}
                  onChange={(e) =>
                    handleStyleChange("backgroundColor", e.target.value)
                  }
                  className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Spacing settings */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-slate-700">Boşluklar</h4>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              İç Boşluk (Padding)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["top", "right", "bottom", "left"] as const).map((side) => (
                <div key={side}>
                  <label className="block text-xs text-slate-500 mb-1">
                    {side === "top" && "Üst"}
                    {side === "right" && "Sağ"}
                    {side === "bottom" && "Alt"}
                    {side === "left" && "Sol"}
                  </label>
                  <input
                    type="number"
                    value={selectedBlock.styles.padding?.[side] || 0}
                    onChange={(e) =>
                      handlePaddingChange(side, parseInt(e.target.value))
                    }
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Dış Boşluk (Margin)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["top", "right", "bottom", "left"] as const).map((side) => (
                <div key={side}>
                  <label className="block text-xs text-slate-500 mb-1">
                    {side === "top" && "Üst"}
                    {side === "right" && "Sağ"}
                    {side === "bottom" && "Alt"}
                    {side === "left" && "Sol"}
                  </label>
                  <input
                    type="number"
                    value={selectedBlock.styles.margin?.[side] || 0}
                    onChange={(e) =>
                      handleMarginChange(side, parseInt(e.target.value))
                    }
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Size settings */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-slate-700">Boyut</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Genişlik
              </label>
              <input
                type="text"
                value={selectedBlock.styles.width || "100%"}
                onChange={(e) => handleStyleChange("width", e.target.value)}
                className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="100%"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Yükseklik
              </label>
              <input
                type="text"
                value={selectedBlock.styles.height || "auto"}
                onChange={(e) => handleStyleChange("height", e.target.value)}
                className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="auto"
              />
            </div>
          </div>
        </div>

        {/* Border settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-700">Kenarlık</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Kenarlık Kalınlığı
              </label>
              <input
                type="number"
                value={selectedBlock.styles.borderWidth || 0}
                onChange={(e) =>
                  handleStyleChange("borderWidth", parseInt(e.target.value))
                }
                className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Kenarlık Rengi
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={selectedBlock.styles.borderColor || "#e5e7eb"}
                  onChange={(e) =>
                    handleStyleChange("borderColor", e.target.value)
                  }
                  className="w-8 h-8 rounded border border-slate-200"
                />
                <input
                  type="text"
                  value={selectedBlock.styles.borderColor || "#e5e7eb"}
                  onChange={(e) =>
                    handleStyleChange("borderColor", e.target.value)
                  }
                  className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Köşe Yuvarlaklığı
            </label>
            <input
              type="number"
              value={selectedBlock.styles.borderRadius || 0}
              onChange={(e) =>
                handleStyleChange("borderRadius", parseInt(e.target.value))
              }
              className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
