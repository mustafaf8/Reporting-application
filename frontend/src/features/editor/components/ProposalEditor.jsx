import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const PreviewPanel = ({
  structure,
  customizations,
  onInlineEdit,
  templateId,
}) => {
  const cssVars = {
    "--primary": customizations?.design?.primaryColor || undefined,
    "--secondary": customizations?.design?.secondaryColor || undefined,
    "--accent": customizations?.design?.accentColor || undefined,
  };
  const [html, setHtml] = React.useState("");
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!templateId) return;
        const payload = { customizations };
        const res = await api.post(
          `/api/templates/${templateId}/preview`,
          payload,
          { headers: { Accept: "text/html" } }
        );
        if (mounted) setHtml(res.data);
      } catch (_) {}
    })();
    return () => {
      mounted = false;
    };
  }, [templateId, JSON.stringify(customizations)]);

  return (
    <div className="bg-white rounded-lg shadow min-h-[480px] overflow-hidden">
      <iframe title="preview" className="w-full h-[560px]" srcDoc={html} />
    </div>
  );
};

const RightPanel = ({ customizations, setCustomizations, selectedBlockId }) => {
  const primary = customizations?.design?.primaryColor || "#4f46e5";
  const secondary = customizations?.design?.secondaryColor || "#7c3aed";
  const accent = customizations?.design?.accentColor || "#16a34a";

  const updateColor = (key, value) => {
    setCustomizations((prev) => ({
      ...prev,
      design: { ...prev.design, [key]: value },
    }));
  };

  const presetPalettes = [
    { name: "Kurumsal", p: "#0a2342", s: "#6c757d", a: "#0d6efd" },
    { name: "Teknoloji", p: "#007bff", s: "#343a40", a: "#6610f2" },
    { name: "Yeşil", p: "#285430", s: "#556b2f", a: "#2e7d32" },
    { name: "Premium", p: "#800000", s: "#36454f", a: "#d4af37" },
    { name: "Minimal", p: "#111827", s: "#6b7280", a: "#ff6f61" },
  ];

  const applyPreset = (preset) => {
    setCustomizations((prev) => ({
      ...prev,
      design: {
        ...prev.design,
        primaryColor: preset.p,
        secondaryColor: preset.s,
        accentColor: preset.a,
      },
    }));
  };

  const resetDesign = () => {
    setCustomizations((prev) => ({ ...prev, design: {} }));
  };

  const clearTexts = () => {
    setCustomizations((prev) => ({ ...prev, texts: {} }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="font-medium text-slate-900 mb-3">Markalama</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {presetPalettes.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded border border-slate-200 p-2 hover:border-slate-300 text-xs text-slate-700"
              title={p.name}
            >
              <div className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-3 rounded"
                  style={{ background: p.p }}
                ></span>
                <span
                  className="inline-block w-3 h-3 rounded"
                  style={{ background: p.s }}
                ></span>
                <span
                  className="inline-block w-3 h-3 rounded"
                  style={{ background: p.a }}
                ></span>
                <span className="ml-2 truncate">{p.name}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-7 items-center gap-2">
            <label className="col-span-3 text-sm text-slate-700">
              Ana Renk
            </label>
            <input
              type="color"
              value={primary}
              onChange={(e) => updateColor("primaryColor", e.target.value)}
              className="col-span-1 h-9 w-9 p-0 border rounded"
            />
            <input
              type="text"
              value={primary}
              onChange={(e) => updateColor("primaryColor", e.target.value)}
              className="col-span-3 border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="grid grid-cols-7 items-center gap-2">
            <label className="col-span-3 text-sm text-slate-700">
              İkincil Renk
            </label>
            <input
              type="color"
              value={secondary}
              onChange={(e) => updateColor("secondaryColor", e.target.value)}
              className="col-span-1 h-9 w-9 p-0 border rounded"
            />
            <input
              type="text"
              value={secondary}
              onChange={(e) => updateColor("secondaryColor", e.target.value)}
              className="col-span-3 border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="grid grid-cols-7 items-center gap-2">
            <label className="col-span-3 text-sm text-slate-700">
              Vurgu Rengi
            </label>
            <input
              type="color"
              value={accent}
              onChange={(e) => updateColor("accentColor", e.target.value)}
              className="col-span-1 h-9 w-9 p-0 border rounded"
            />
            <input
              type="text"
              value={accent}
              onChange={(e) => updateColor("accentColor", e.target.value)}
              className="col-span-3 border rounded px-2 py-1 text-sm"
            />
          </div>

          <div className="pt-2 border-t">
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
            <input
              type="text"
              placeholder="Logo URL"
              value={customizations?.brand?.logoUrl || ""}
              onChange={(e) =>
                setCustomizations((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, logoUrl: e.target.value },
                }))
              }
              className="mt-2 w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={resetDesign}
            className="px-3 py-2 text-sm rounded border border-slate-300 hover:bg-slate-50"
          >
            Varsayılana Sıfırla
          </button>
          <button
            type="button"
            onClick={clearTexts}
            className="px-3 py-2 text-sm rounded border border-rose-300 text-rose-600 hover:bg-rose-50"
          >
            Metinleri Temizle
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="font-medium text-slate-900 mb-2">Blok Ayarları</div>
        <div className="text-xs text-slate-600 mb-3">
          Seçili blok:{" "}
          <span className="font-medium">{String(selectedBlockId ?? "-")}</span>
        </div>
        <div className="text-xs text-slate-500">
          Seçili bloğa özel ayarlar yakında eklenecek.
        </div>
      </div>
    </div>
  );
};

const STORAGE_KEY = "proposal_editor_customizations";

const ProposalEditor = () => {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");
  const navigate = useNavigate();

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

  const onInlineEdit = (key, value) => {
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
    navigate(`/proposals/create?templateId=${templateId}`);
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
          templateId={templateId}
        />
      </div>
      <div className="col-span-12 md:col-span-3">
        <RightPanel
          customizations={customizations}
          setCustomizations={setCustomizations}
          selectedBlockId={selectedBlockId}
        />
        <div className="mt-4">
          <button
            onClick={goToForm}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Devam Et ve Teklif Oluştur
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProposalEditor;
