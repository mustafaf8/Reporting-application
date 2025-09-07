import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import { Block } from "@/types/block-editor";
import { BaseBlock } from "./BaseBlock";
import { useEditorStore } from "@/lib/stores/editor-store";

interface TextBlockProps {
  block: Block;
  isSelected: boolean;
  isPreviewMode: boolean;
}

export const TextBlock: React.FC<TextBlockProps> = memo(
  ({ block, isSelected, isPreviewMode }) => {
    const { updateBlock } = useEditorStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(block.content.text || "");
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setEditText(block.content.text || "");
    }, [block.content.text]);

    const handleDoubleClick = useCallback(() => {
      if (!isPreviewMode) {
        setIsEditing(true);
      }
    }, [isPreviewMode]);

    const handleBlur = useCallback(() => {
      setIsEditing(false);
      if (editText !== block.content.text) {
        updateBlock(block.id, {
          content: { ...block.content, text: editText },
          metadata: { ...block.metadata, updatedAt: new Date().toISOString() },
        });
      }
    }, [
      editText,
      block.content.text,
      block.id,
      block.content,
      block.metadata,
      updateBlock,
    ]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleBlur();
        }
        if (e.key === "Escape") {
          setEditText(block.content.text || "");
          setIsEditing(false);
        }
      },
      [handleBlur, block.content.text]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditText(e.target.value);
      },
      []
    );

    return (
      <BaseBlock
        block={block}
        isSelected={isSelected}
        isPreviewMode={isPreviewMode}
      >
        {isEditing && !isPreviewMode ? (
          <textarea
            ref={textRef}
            value={editText}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none border-none outline-none bg-transparent"
            style={{
              fontSize: block.styles.fontSize,
              fontWeight: block.styles.fontWeight,
              color: block.styles.color,
              textAlign: block.styles.textAlign,
              lineHeight: 1.5,
              fontFamily: "inherit",
            }}
            autoFocus
          />
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            className="w-full h-full"
            style={{
              fontSize: block.styles.fontSize,
              fontWeight: block.styles.fontWeight,
              color: block.styles.color,
              textAlign: block.styles.textAlign,
              lineHeight: 1.5,
              fontFamily: "inherit",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {block.content.text || "Metin bloğu - çift tıklayarak düzenleyin"}
          </div>
        )}
      </BaseBlock>
    );
  }
);
