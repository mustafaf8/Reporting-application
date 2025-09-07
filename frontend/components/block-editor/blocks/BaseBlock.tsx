import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import { Block, BlockType } from "@/types/block-editor";
import { useEditorStore } from "@/lib/stores/editor-store";

interface BaseBlockProps {
  block: Block;
  isSelected: boolean;
  isPreviewMode: boolean;
  children: React.ReactNode;
  className?: string;
}

export const BaseBlock: React.FC<BaseBlockProps> = memo(
  ({ block, isSelected, isPreviewMode, children, className = "" }) => {
    const { selectBlock, updateBlock } = useEditorStore();
    const [isHovered, setIsHovered] = useState(false);
    const blockRef = useRef<HTMLDivElement>(null);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isPreviewMode) {
          selectBlock(block.id);
        }
      },
      [block.id, isPreviewMode, selectBlock]
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isPreviewMode) {
          // Inline editing için double click
          console.log("Double click for inline editing:", block.id);
        }
      },
      [block.id, isPreviewMode]
    );

    const handleMouseEnter = useCallback(() => {
      if (!isPreviewMode) {
        setIsHovered(true);
      }
    }, [isPreviewMode]);

    const handleMouseLeave = useCallback(() => {
      setIsHovered(false);
    }, []);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (isPreviewMode) return;

        switch (e.key) {
          case "Enter":
          case " ":
            e.preventDefault();
            selectBlock(block.id);
            break;
          case "Delete":
          case "Backspace":
            e.preventDefault();
            // Delete functionality
            break;
          case "Escape":
            e.preventDefault();
            selectBlock(null);
            break;
        }
      },
      [block.id, isPreviewMode, selectBlock]
    );

    const blockStyles: React.CSSProperties = {
      ...block.styles,
      position: "relative",
      cursor: isPreviewMode ? "default" : "pointer",
      outline: isSelected && !isPreviewMode ? "2px solid #4f46e5" : "none",
      outlineOffset: isSelected && !isPreviewMode ? "2px" : "0",
      opacity: block.metadata.isVisible === false ? 0.5 : 1,
    };

    return (
      <div
        ref={blockRef}
        className={`base-block ${className}`}
        style={blockStyles}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        data-block-id={block.id}
        data-block-type={block.type}
        role="button"
        tabIndex={isPreviewMode ? -1 : 0}
        aria-label={`${block.type} bloğu`}
        aria-selected={isSelected}
      >
        {/* Selection indicator */}
        {isSelected && !isPreviewMode && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white shadow-sm" />
        )}

        {/* Hover indicator */}
        {isHovered && !isSelected && !isPreviewMode && (
          <div className="absolute inset-0 border-2 border-indigo-300 border-dashed rounded pointer-events-none" />
        )}

        {/* Block content */}
        <div className="block-content">{children}</div>

        {/* Block toolbar (only in edit mode) */}
        {isSelected && !isPreviewMode && (
          <div className="absolute -top-8 left-0 flex items-center space-x-1 bg-white rounded shadow-lg border border-slate-200 p-1">
            <button
              className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-800"
              title="Kopyala"
              onClick={(e) => {
                e.stopPropagation();
                // Copy functionality
              }}
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
            <button
              className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-800"
              title="Sil"
              onClick={(e) => {
                e.stopPropagation();
                // Delete functionality
              }}
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  }
);
