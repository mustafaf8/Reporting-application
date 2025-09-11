import React, { useState } from "react";
import { Block } from "@/types/block-editor";
import { BaseBlock } from "./BaseBlock";
import { useEditorStore } from "@/lib/stores/editor-store";
import ImageUpload from "@/components/ui/ImageUpload";

interface ImageBlockProps {
  block: Block;
  isSelected: boolean;
  isPreviewMode: boolean;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({
  block,
  isSelected,
  isPreviewMode,
}) => {
  const { updateBlock } = useEditorStore();
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = async (url: string | null) => {
    if (url) {
      setIsUploading(true);
      updateBlock(block.id, {
        content: { ...block.content, imageUrl: url },
        metadata: { ...block.metadata, updatedAt: new Date().toISOString() },
      });
      setIsUploading(false);
    }
  };

  const imageUrl = block.content.imageUrl;

  return (
    <BaseBlock
      block={block}
      isSelected={isSelected}
      isPreviewMode={isPreviewMode}
    >
      <div className="w-full h-full flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Block image"
            className="max-w-full max-h-full object-contain"
            style={{
              width: block.styles.width,
              height: block.styles.height,
              maxWidth: block.styles.maxWidth,
              maxHeight: block.styles.maxHeight,
              borderRadius: Number.isFinite(Number(block.styles.borderRadius))
                ? (block.styles.borderRadius as number)
                : 0,
            }}
          />
        ) : (
          <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
            {isSelected && !isPreviewMode ? (
              <ImageUpload
                currentImageUrl={imageUrl}
                onImageChange={handleImageChange}
                size="md"
                uploadType="block"
                placeholder="Resim yükle"
                blockId={block.id}
                showUploadButton={false}
              />
            ) : (
              <div className="text-center text-slate-500">
                <svg
                  className="w-8 h-8 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">Resim bloğu</p>
                <p className="text-xs">Resim yüklemek için seçin</p>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseBlock>
  );
};
