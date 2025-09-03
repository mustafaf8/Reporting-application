import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../../services/api";
import ProfileImageUpload from "../../../components/ui/ProfileImageUpload";

const LeftPanel = ({ structure, onReorder, selectedBlockId, onSelect }) => {
  return (
    <div className="w-full space-y-2">
      {(structure?.blocks || []).map((block, idx) => (
        <button
          key={block.id || idx}
          onClick={() => onSelect(block.id || idx)}
          className={`w-full text-left px-3 py-2 rounded border ${
            (block.id || idx) === selectedBlockId
              ? "bg-indigo-50 border-indigo-200"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="text-sm font-medium text-slate-800">
            {block.title || block.type || `Blok ${idx + 1}`}
          </div>
          {block.subtitle && (
            <div className="text-xs text-slate-500">{block.subtitle}</div>
          )}
        </button>
      ))}
    </div>
  );
};

const PreviewPanel = ({ structure, customizations, onInlineEdit }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 min-h-[480px]">
      <div className="prose max-w-none">
        {(structure?.blocks || []).map((block, idx) => {
          const key = block.bindKey || `block_${idx}`;
          const value = customizations?.texts?.[key] ?? block.defaultText;
          return (
            <div key={key} className="mb-6">
              <div
                contentEditable
                suppressContentEditableWarning
                className="outline-none border border-transparent hover:border-slate-200 rounded px-2"
                onBlur={(e) =>
                  onInlineEdit(key, e.currentTarget.textContent || "")
                }
              >
                {value || "Metni düzenlemek için tıklayın"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RightPanel = ({ customizations, setCustomizations, selectedBlockId }) => {
  const primary = customizations?.design?.primaryColor || "#4f46e5";
  const secondary = customizations?.design?.secondaryColor || "#7c3aed";

  const updateColor = (key, value) => {
    setCustomizations((prev) => ({
      ...prev,
      design: { ...prev.design, [key]: value },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="font-medium text-slate-900 mb-3">Markalama</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-700">Ana Renk</label>
            <input
              type="color"
              value={primary}
              onChange={(e) => updateColor("primaryColor", e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-700">İkincil Renk</label>
            <input
              type="color"
              value={secondary}
              onChange={(e) => updateColor("secondaryColor", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Logo</label>
            <ProfileImageUpload
              currentImageUrl={customizations?.brand?.logoUrl}
              onImageChange={(url) =>
                setCustomizations((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, logoUrl: url },
                }))
              }
              size="md"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="font-medium text-slate-900 mb-3">Blok Ayarları</div>
        <div className="text-sm text-slate-600">
          Seçili blok: {String(selectedBlockId ?? "-")}
        </div>
        {/* İleride seçili bloğa özel form öğeleri eklenecek */}
      </div>
    </div>
  );
};

const ProposalEditor = () => {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customizations, setCustomizations] = useState({
    texts: {},
    design: {},
    brand: {},
  });
  const [selectedBlockId, setSelectedBlockId] = useState(null);

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
      } finally {
        setLoading(false);
      }
    })();
  }, [templateId]);

  const onInlineEdit = (key, value) => {
    setCustomizations((prev) => ({
      ...prev,
      texts: { ...prev.texts, [key]: value },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-3">
        <LeftPanel
          structure={template?.structure}
          onReorder={() => {}}
          selectedBlockId={selectedBlockId}
          onSelect={setSelectedBlockId}
        />
      </div>
      <div className="col-span-12 md:col-span-6">
        <PreviewPanel
          structure={template?.structure}
          customizations={customizations}
          onInlineEdit={onInlineEdit}
        />
      </div>
      <div className="col-span-12 md:col-span-3">
        <RightPanel
          customizations={customizations}
          setCustomizations={setCustomizations}
          selectedBlockId={selectedBlockId}
        />
      </div>
    </div>
  );
};

export default ProposalEditor;
