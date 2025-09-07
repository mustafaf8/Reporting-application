import React from "react";
import { Block, BlockType } from "@/types/block-editor";
import { useEditorStore } from "@/lib/stores/editor-store";

// Block components
import { TextBlock } from "./blocks/TextBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { TableBlock } from "./blocks/TableBlock";

interface BlockRendererProps {
  block: Block;
  isSelected: boolean;
  isPreviewMode: boolean;
}

const blockComponents: Record<
  BlockType,
  React.ComponentType<BlockRendererProps>
> = {
  text: TextBlock,
  heading: HeadingBlock,
  image: ImageBlock,
  table: TableBlock,
  spacer: ({ block, isSelected, isPreviewMode }) => (
    <div
      className="w-full bg-transparent"
      style={{
        height: block.styles.height || "40px",
        backgroundColor: block.styles.backgroundColor || "transparent",
      }}
    />
  ),
  divider: ({ block, isSelected, isPreviewMode }) => (
    <div
      className="w-full"
      style={{
        height: block.styles.height || "2px",
        backgroundColor: block.styles.backgroundColor || "#e5e7eb",
        margin: `${block.styles.margin?.top || 16}px ${
          block.styles.margin?.right || 0
        }px ${block.styles.margin?.bottom || 16}px ${
          block.styles.margin?.left || 0
        }px`,
      }}
    />
  ),
  "customer-info": ({ block, isSelected, isPreviewMode }) => {
    const customerData = block.content.customerData;
    return (
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: block.styles.backgroundColor || "#f8fafc",
          borderColor: block.styles.borderColor || "#e2e8f0",
          borderWidth: block.styles.borderWidth || 1,
          borderRadius: block.styles.borderRadius || 8,
        }}
      >
        <h3 className="text-lg font-semibold mb-3">Müşteri Bilgileri</h3>
        {customerData ? (
          <div className="space-y-2">
            <div>
              <strong>Ad:</strong> {customerData.name}
            </div>
            <div>
              <strong>E-posta:</strong> {customerData.email}
            </div>
            <div>
              <strong>Telefon:</strong> {customerData.phone}
            </div>
            <div>
              <strong>Adres:</strong> {customerData.address}
            </div>
            <div>
              <strong>Şirket:</strong> {customerData.company}
            </div>
          </div>
        ) : (
          <div className="text-slate-500">Müşteri bilgileri bulunamadı</div>
        )}
      </div>
    );
  },
  "company-info": ({ block, isSelected, isPreviewMode }) => {
    const companyData = block.content.companyData;
    return (
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: block.styles.backgroundColor || "#f8fafc",
          borderColor: block.styles.borderColor || "#e2e8f0",
          borderWidth: block.styles.borderWidth || 1,
          borderRadius: block.styles.borderRadius || 8,
        }}
      >
        <h3 className="text-lg font-semibold mb-3">Şirket Bilgileri</h3>
        {companyData ? (
          <div className="space-y-2">
            <div>
              <strong>Şirket:</strong> {companyData.name}
            </div>
            <div>
              <strong>Slogan:</strong> {companyData.tagline}
            </div>
            <div>
              <strong>Açıklama:</strong> {companyData.description}
            </div>
            <div>
              <strong>Adres:</strong> {companyData.address}
            </div>
            <div>
              <strong>Telefon:</strong> {companyData.phone}
            </div>
            <div>
              <strong>E-posta:</strong> {companyData.email}
            </div>
            <div>
              <strong>Website:</strong> {companyData.website}
            </div>
          </div>
        ) : (
          <div className="text-slate-500">Şirket bilgileri bulunamadı</div>
        )}
      </div>
    );
  },
  "pricing-table": ({ block, isSelected, isPreviewMode }) => {
    const pricingData = block.content.pricingData;
    return (
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: block.styles.backgroundColor || "#ffffff",
          borderColor: block.styles.borderColor || "#e2e8f0",
          borderWidth: block.styles.borderWidth || 1,
          borderRadius: block.styles.borderRadius || 8,
        }}
      >
        <h3 className="text-lg font-semibold mb-4">Fiyatlandırma</h3>
        {pricingData ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Ürün/Hizmet</th>
                    <th className="text-right py-2">Miktar</th>
                    <th className="text-right py-2">Birim Fiyat</th>
                    <th className="text-right py-2">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingData.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-slate-600">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="text-right py-2">{item.quantity}</td>
                      <td className="text-right py-2">
                        {item.unitPrice} {pricingData.currency}
                      </td>
                      <td className="text-right py-2 font-medium">
                        {item.total} {pricingData.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td colSpan={3} className="text-right py-2">
                      Ara Toplam:
                    </td>
                    <td className="text-right py-2">
                      {pricingData.subtotal} {pricingData.currency}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="text-right py-2">
                      KDV:
                    </td>
                    <td className="text-right py-2">
                      {pricingData.tax} {pricingData.currency}
                    </td>
                  </tr>
                  <tr className="border-t-2 font-bold text-lg">
                    <td colSpan={3} className="text-right py-2">
                      Toplam:
                    </td>
                    <td className="text-right py-2">
                      {pricingData.total} {pricingData.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-slate-500">Fiyatlandırma verisi bulunamadı</div>
        )}
      </div>
    );
  },
  gallery: ({ block, isSelected, isPreviewMode }) => {
    const galleryImages = block.content.galleryImages || [];
    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-4">Galeri</h3>
        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((imageUrl, index) => (
              <div
                key={index}
                className="aspect-square overflow-hidden rounded-lg"
              >
                <img
                  src={imageUrl}
                  alt={`Galeri ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>Galeri resmi yok</p>
          </div>
        )}
      </div>
    );
  },
  "hero-section": ({ block, isSelected, isPreviewMode }) => {
    return (
      <div
        className="text-center py-12"
        style={{
          backgroundColor: block.styles.backgroundColor || "#f8fafc",
          textAlign: block.styles.textAlign || "center",
        }}
      >
        <h1
          className="text-4xl font-bold mb-4"
          style={{
            color: block.styles.color || "#1f2937",
            fontSize: block.styles.fontSize || 36,
          }}
        >
          {block.content.heading || "Ana Başlık"}
        </h1>
        <p
          className="text-xl text-slate-600"
          style={{
            fontSize: (block.styles.fontSize || 36) * 0.6,
          }}
        >
          {block.content.text || "Alt başlık veya açıklama metni"}
        </p>
      </div>
    );
  },
  footer: ({ block, isSelected, isPreviewMode }) => {
    return (
      <div
        className="text-center py-6"
        style={{
          backgroundColor: block.styles.backgroundColor || "#f1f5f9",
          color: block.styles.color || "#64748b",
          fontSize: block.styles.fontSize || 14,
        }}
      >
        {block.content.text || "© 2024 Şirket Adı. Tüm hakları saklıdır."}
      </div>
    );
  },
  header: ({ block, isSelected, isPreviewMode }) => {
    return (
      <div
        className="text-center py-6 border-b"
        style={{
          backgroundColor: block.styles.backgroundColor || "#ffffff",
          borderColor: block.styles.borderColor || "#e2e8f0",
          borderBottomWidth: block.styles.borderBottomWidth || 1,
        }}
      >
        <h1
          className="text-2xl font-bold mb-2"
          style={{
            color: block.styles.color || "#1f2937",
            fontSize: block.styles.fontSize || 24,
          }}
        >
          {block.content.heading || "Şirket Adı"}
        </h1>
        <p
          className="text-slate-600"
          style={{
            fontSize: (block.styles.fontSize || 24) * 0.7,
          }}
        >
          {block.content.text || "Slogan veya açıklama"}
        </p>
      </div>
    );
  },
};

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  isSelected,
  isPreviewMode,
}) => {
  const BlockComponent = blockComponents[block.type];

  if (!BlockComponent) {
    return (
      <div className="p-4 border-2 border-dashed border-red-300 rounded-lg text-center text-red-500">
        <p>Bilinmeyen blok tipi: {block.type}</p>
      </div>
    );
  }

  return (
    <BlockComponent
      block={block}
      isSelected={isSelected}
      isPreviewMode={isPreviewMode}
    />
  );
};
