import React, { useRef, useEffect, memo, useCallback, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Block } from "@/types/block-editor";
import { useEditorStore } from "@/lib/stores/editor-store";
import { BlockRenderer } from "./BlockRenderer";
import { ContextMenu } from "./ContextMenu";

interface SortableBlockProps {
  block: Block;
  isSelected: boolean;
  isPreviewMode: boolean;
}

const SortableBlock: React.FC<SortableBlockProps> = memo(
  ({ block, isSelected, isPreviewMode }) => {
    const { selectBlock } = useEditorStore();
    const [contextMenu, setContextMenu] = useState<{
      isOpen: boolean;
      position: { x: number; y: number };
    }>({ isOpen: false, position: { x: 0, y: 0 } });

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: block.id,
      disabled: isPreviewMode,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isPreviewMode) {
          selectBlock(block.id);
        }
      },
      [block.id, isPreviewMode, selectBlock]
    );

    const handleContextMenu = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isPreviewMode) {
          setContextMenu({
            isOpen: true,
            position: { x: e.clientX, y: e.clientY },
          });
        }
      },
      [isPreviewMode]
    );

    const handleCloseContextMenu = useCallback(() => {
      setContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
    }, []);

    return (
      <>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          onMouseDown={handleClick}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          className={`sortable-block ${isDragging ? "dragging" : ""}`}
        >
          <BlockRenderer
            block={block}
            isSelected={isSelected}
            isPreviewMode={isPreviewMode}
          />
        </div>

        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          blockId={block.id}
          onClose={handleCloseContextMenu}
        />
      </>
    );
  }
);

interface EditorCanvasProps {
  className?: string;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = memo(
  ({ className = "" }) => {
    const {
      blocks,
      selectedBlockId,
      isPreviewMode,
      reorderBlocks,
      selectBlock,
      globalStyles,
      canvasSize,
    } = useEditorStore();

    const canvasRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Kapsayıcı boyutlarına göre otomatik ölçekleme (fit-to-screen)
    useEffect(() => {
      const updateScale = () => {
        const containerWidth = containerRef.current?.clientWidth || 0;
        const containerHeight = containerRef.current?.clientHeight || 0;
        const unit = (canvasSize?.unit ?? "px") as string;
        const baseWidth =
          unit === "px"
            ? canvasSize?.width ?? 800
            : Number(canvasSize?.width ?? 800);
        const baseHeight =
          unit === "px"
            ? canvasSize?.height ?? 1000
            : Number(canvasSize?.height ?? 1000);
        if (!containerWidth || !containerHeight || !baseWidth || !baseHeight) {
          setScale(1);
          return;
        }
        const fitW = containerWidth / baseWidth;
        const fitH = containerHeight / baseHeight;
        const next = Math.min(fitW, fitH);
        const clamped = Math.max(0.5, Math.min(next, 2));
        setScale(Number.isFinite(clamped) && clamped > 0 ? clamped : 1);
      };

      updateScale();

      const ResizeObs: typeof ResizeObserver | undefined = (window as any)
        .ResizeObserver;
      if (ResizeObs && containerRef.current) {
        const ro = new ResizeObs(() => updateScale());
        ro.observe(containerRef.current);
        return () => ro.disconnect();
      }

      const onResize = () => updateScale();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [canvasSize?.width, canvasSize?.height, canvasSize?.unit]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
      console.log("Drag started:", event.active.id);
    }, []);

    const handleDragOver = useCallback((event: DragOverEvent) => {
      console.log("Drag over:", event.active.id, event.over?.id);
    }, []);

    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId !== overId) {
          const activeIndex = blocks.findIndex(
            (block) => block.id === activeId
          );
          const overIndex = blocks.findIndex((block) => block.id === overId);

          if (activeIndex !== -1 && overIndex !== -1) {
            reorderBlocks(activeIndex, overIndex);
          }
        }
      },
      [blocks, reorderBlocks]
    );

    const handleCanvasClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === canvasRef.current) {
          selectBlock(null);
        }
      },
      [selectBlock]
    );

    const safeCanvasWidth = (canvasSize?.width ?? 800) as number;
    const safeCanvasHeight = (canvasSize?.height ?? 1000) as number;
    const safeCanvasUnit = (canvasSize?.unit ?? "px") as string;

    const canvasStyles: React.CSSProperties = {
      width: `${safeCanvasWidth}${safeCanvasUnit}`,
      minHeight: `${safeCanvasHeight}${safeCanvasUnit}`,
      backgroundColor: globalStyles?.backgroundColor ?? "#ffffff",
      fontFamily: globalStyles?.fontFamily ?? "Inter, sans-serif",
      fontSize: globalStyles?.fontSize ?? 16,
      lineHeight: globalStyles?.lineHeight ?? 1.5,
      color: globalStyles?.textColor ?? "#1f2937",
    };

    return (
      <div
        ref={containerRef}
        className={`w-full h-full flex items-start justify-center overflow-auto hide-scrollbar ${className}`}
      >
        <div
          ref={canvasRef}
          className={"editor-canvas relative bg-white shadow-lg"}
          style={{
            ...canvasStyles,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
          onClick={handleCanvasClick}
        >
          <DndContext
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((block) => block.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 p-4 py-16">
                {blocks.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <svg
                      className="w-16 h-16 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold mb-2">Boş Canvas</h3>
                    <p className="text-sm">
                      {isPreviewMode
                        ? "Önizleme modunda - blok eklemek için düzenleme moduna geçin"
                        : "Blok kütüphanesinden blok ekleyerek başlayın"}
                    </p>
                  </div>
                ) : (
                  blocks.map((block) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      isPreviewMode={isPreviewMode}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>

          {/* Canvas grid overlay (only in edit mode) */}
          {!isPreviewMode && (
            <div
              className="absolute inset-0 pointer-events-none opacity-5"
              style={{
                backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
                backgroundSize: "20px 20px",
              }}
            />
          )}
        </div>
      </div>
    );
  }
);
