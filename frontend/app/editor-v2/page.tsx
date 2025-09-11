"use client";

import React from "react";
import { BlockEditor } from "@/components/block-editor/BlockEditor";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useEditorStore } from "@/lib/stores/editor-store";

export default function EditorV2Page() {
  const params = useSearchParams();
  const templateId = params.get("templateId");
  const { loadTemplate } = useEditorStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) return;
      setIsLoading(true);
      try {
        await loadTemplate(templateId);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [templateId, loadTemplate]);

  return (
    <div className="h-screen">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center text-slate-500">
          Şablon yükleniyor...
        </div>
      ) : (
        <BlockEditor />
      )}
    </div>
  );
}
