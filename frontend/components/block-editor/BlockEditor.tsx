import React, { useState, useEffect } from "react";
import { useEditorStore } from "@/lib/stores/editor-store";
import { EditorCanvas } from "./EditorCanvas";
import { BlockLibrary } from "./BlockLibrary";
import { BlockSettings } from "./BlockSettings";
import { GlobalSettings } from "./GlobalSettings";

interface BlockEditorProps {
  className?: string;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ className = "" }) => {
  const {
    isPreviewMode,
    togglePreviewMode,
    undo,
    redo,
    _canUndo,
    _canRedo,
    isDirty,
    saveTemplate,
  } = useEditorStore();

  const [activeTab, setActiveTab] = useState<"library" | "settings" | "global">(
    "library"
  );
  const [isSaving, setIsSaving] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              if (_canRedo()) redo();
            } else {
              if (_canUndo()) undo();
            }
            break;
          case "s":
            e.preventDefault();
            handleSave();
            break;
          case "p":
            e.preventDefault();
            togglePreviewMode();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, _canUndo, _canRedo, togglePreviewMode]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveTemplate("Yeni Şablon", "Otomatik kaydedilen şablon");
      // Success feedback
    } catch (error) {
      console.error("Save failed:", error);
      // Error feedback
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`block-editor h-screen flex flex-col bg-slate-50 ${className}`}
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-slate-800">
              Blok Editörü
            </h1>
            {isDirty && (
              <div className="flex items-center space-x-1 text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-sm">Kaydedilmemiş değişiklikler</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Undo/Redo */}
            <div className="flex items-center space-x-1">
              <button
                onClick={undo}
                disabled={!_canUndo()}
                className="p-2 text-slate-600 hover:text-slate-800 disabled:text-slate-300 disabled:cursor-not-allowed"
                title="Geri Al (Ctrl+Z)"
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
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={!_canRedo()}
                className="p-2 text-slate-600 hover:text-slate-800 disabled:text-slate-300 disabled:cursor-not-allowed"
                title="İleri Al (Ctrl+Shift+Z)"
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
                    d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                  />
                </svg>
              </button>
            </div>

            {/* Preview toggle */}
            <button
              onClick={togglePreviewMode}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                isPreviewMode
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              title="Önizleme Modu (Ctrl+P)"
            >
              {isPreviewMode ? "Düzenleme" : "Önizleme"}
            </button>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Kaydet (Ctrl+S)"
            >
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Block library */}
        <div className="w-80 lg:w-80 md:w-64 sm:w-56 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab("library")}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  activeTab === "library"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Bloklar
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  activeTab === "settings"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Ayarlar
              </button>
              <button
                onClick={() => setActiveTab("global")}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  activeTab === "global"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Global
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "library" && <BlockLibrary />}
            {activeTab === "settings" && <BlockSettings />}
            {activeTab === "global" && <GlobalSettings />}
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-auto">
          <EditorCanvas />
        </div>

        {/* Right sidebar - Block properties (when a block is selected) */}
        <div className="w-80 lg:w-80 md:w-64 sm:w-56 border-l border-slate-200 bg-white hidden lg:block">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">
              Blok Özellikleri
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <BlockSettings />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-slate-100 border-t border-slate-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-4">
            <span>Mod: {isPreviewMode ? "Önizleme" : "Düzenleme"}</span>
            <span>Bloklar: {useEditorStore.getState().blocks.length}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Klavye Kısayolları:</span>
            <span>Ctrl+Z (Geri Al)</span>
            <span>Ctrl+S (Kaydet)</span>
            <span>Ctrl+P (Önizleme)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
