import React, { useState } from "react";
import { BlockLibraryItem, BlockType } from "@/types/block-editor";
import {
  blockLibrary,
  getBlocksByCategory,
  getAllCategories,
} from "@/lib/block-library";
import { useEditorStore } from "@/lib/stores/editor-store";
import { v4 as uuidv4 } from "uuid";

interface BlockLibraryProps {
  className?: string;
}

export const BlockLibrary: React.FC<BlockLibraryProps> = ({
  className = "",
}) => {
  const { addBlock } = useEditorStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["Tümü", ...getAllCategories()];

  const filteredBlocks = React.useMemo(() => {
    let blocks = Object.values(blockLibrary);

    // Filter by category
    if (selectedCategory !== "Tümü") {
      blocks = blocks.filter((block) => block.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      blocks = blocks.filter(
        (block) =>
          block.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          block.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return blocks;
  }, [selectedCategory, searchQuery]);

  const handleAddBlock = (blockType: BlockType) => {
    const libraryItem = blockLibrary[blockType];
    const newBlock = {
      id: uuidv4(),
      type: blockType,
      content: { ...libraryItem.defaultContent },
      styles: { ...libraryItem.defaultStyles },
      position: { x: 0, y: 0, zIndex: 0 },
      metadata: {
        title: libraryItem.title,
        description: libraryItem.description,
        category: libraryItem.category,
        isLocked: false,
        isVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    addBlock(newBlock);
  };

  return (
    <div
      className={`block-library bg-white rounded-lg shadow-sm border border-slate-200 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">
          Blok Kütüphanesi
        </h3>

        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Blok ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-9 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === category
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Blocks grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredBlocks.map((block) => (
            <button
              key={block.type}
              onClick={() => handleAddBlock(block.type)}
              className="p-3 text-left border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group"
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{block.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-800 group-hover:text-indigo-700">
                    {block.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {block.description}
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600">
                {block.preview}
              </div>
            </button>
          ))}
        </div>

        {filteredBlocks.length === 0 && (
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
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">
              Arama kriterlerinize uygun blok bulunamadı
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
