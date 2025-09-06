import React, { useState, useRef, useEffect } from "react";
import { Block } from "@/types/block-editor";
import { BaseBlock } from "./BaseBlock";
import { useEditorStore } from "@/lib/stores/editor-store";

interface HeadingBlockProps {
  block: Block;
  isSelected: boolean;
  isPreviewMode: boolean;
}

export const HeadingBlock: React.FC<HeadingBlockProps> = ({
  block,
  isSelected,
  isPreviewMode,
}) => {
  const { updateBlock } = useEditorStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(block.content.heading || "");
  const textRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditText(block.content.heading || "");
  }, [block.content.heading]);

  const handleDoubleClick = () => {
    if (!isPreviewMode) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editText !== block.content.heading) {
      updateBlock(block.id, {
        content: { ...block.content, heading: editText },
        metadata: { ...block.metadata, updatedAt: new Date().toISOString() },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setEditText(block.content.heading || "");
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(e.target.value);
  };

  const getHeadingTag = () => {
    const fontSize = block.styles.fontSize || 24;
    if (fontSize >= 32) return "h1";
    if (fontSize >= 28) return "h2";
    if (fontSize >= 24) return "h3";
    if (fontSize >= 20) return "h4";
    if (fontSize >= 18) return "h5";
    return "h6";
  };

  const HeadingTag = getHeadingTag() as keyof JSX.IntrinsicElements;

  return (
    <BaseBlock
      block={block}
      isSelected={isSelected}
      isPreviewMode={isPreviewMode}
    >
      {isEditing && !isPreviewMode ? (
        <input
          ref={textRef}
          type="text"
          value={editText}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full border-none outline-none bg-transparent"
          style={{
            fontSize: block.styles.fontSize,
            fontWeight: block.styles.fontWeight,
            color: block.styles.color,
            textAlign: block.styles.textAlign,
            lineHeight: 1.2,
            fontFamily: "inherit",
          }}
          autoFocus
        />
      ) : (
        <HeadingTag
          onDoubleClick={handleDoubleClick}
          className="w-full h-full"
          style={{
            fontSize: block.styles.fontSize,
            fontWeight: block.styles.fontWeight,
            color: block.styles.color,
            textAlign: block.styles.textAlign,
            lineHeight: 1.2,
            fontFamily: "inherit",
            margin: 0,
            padding: 0,
          }}
        >
          {block.content.heading || "Başlık metni - çift tıklayarak düzenleyin"}
        </HeadingTag>
      )}
    </BaseBlock>
  );
};
