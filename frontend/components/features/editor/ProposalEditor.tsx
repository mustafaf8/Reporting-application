"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api/index";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
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

interface PreviewPanelProps {
  structure: Structure | null;
  customizations: Customizations;
  onInlineEdit: (key: string, value: string) => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  structure,
  customizations,
  onInlineEdit,
}) => {
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
              onImageChange={(url: string | null) =>
                setCustomizations((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, logoUrl: url || undefined },
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
