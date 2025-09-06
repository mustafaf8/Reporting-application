import { BlockLibraryItem, BlockType } from "@/types/block-editor";

export const blockLibrary: Record<BlockType, BlockLibraryItem> = {
  text: {
    type: "text",
    title: "Metin",
    description: "Düzenlenebilir metin bloğu",
    icon: "📝",
    category: "İçerik",
    preview: "Lorem ipsum dolor sit amet...",
    defaultContent: {
      text: "Metin bloğu - buraya tıklayarak düzenleyin",
    },
    defaultStyles: {
      fontSize: 16,
      color: "#1f2937",
      textAlign: "left",
      padding: { top: 8, right: 12, bottom: 8, left: 12 },
    },
  },
  heading: {
    type: "heading",
    title: "Başlık",
    description: "Başlık metni bloğu",
    icon: "📋",
    category: "İçerik",
    preview: "Başlık Metni",
    defaultContent: {
      heading: "Başlık Metni",
    },
    defaultStyles: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#1f2937",
      textAlign: "left",
      padding: { top: 16, right: 12, bottom: 16, left: 12 },
    },
  },
  image: {
    type: "image",
    title: "Resim",
    description: "Resim bloğu",
    icon: "🖼️",
    category: "Medya",
    preview: "Resim",
    defaultContent: {
      imageUrl: "",
    },
    defaultStyles: {
      width: "100%",
      maxWidth: "100%",
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
    },
  },
  table: {
    type: "table",
    title: "Tablo",
    description: "Veri tablosu bloğu",
    icon: "📊",
    category: "Veri",
    preview: "Tablo",
    defaultContent: {
      tableData: {
        headers: ["Öğe", "Miktar", "Fiyat"],
        rows: [
          ["Örnek Ürün 1", "2", "150 TL"],
          ["Örnek Ürün 2", "1", "300 TL"],
        ],
        hasHeader: true,
        isStriped: true,
      },
    },
    defaultStyles: {
      width: "100%",
      padding: { top: 12, right: 12, bottom: 12, left: 12 },
    },
  },
  spacer: {
    type: "spacer",
    title: "Boşluk",
    description: "Boşluk ekleme bloğu",
    icon: "⬜",
    category: "Düzen",
    preview: "Boşluk",
    defaultContent: {},
    defaultStyles: {
      height: "40px",
      backgroundColor: "transparent",
    },
  },
  divider: {
    type: "divider",
    title: "Ayırıcı",
    description: "Çizgi ayırıcı bloğu",
    icon: "➖",
    category: "Düzen",
    preview: "Ayırıcı",
    defaultContent: {},
    defaultStyles: {
      height: "2px",
      backgroundColor: "#e5e7eb",
      margin: { top: 16, right: 0, bottom: 16, left: 0 },
    },
  },
  "customer-info": {
    type: "customer-info",
    title: "Müşteri Bilgileri",
    description: "Müşteri bilgi kartı",
    icon: "👤",
    category: "Bilgi",
    preview: "Müşteri Bilgileri",
    defaultContent: {
      customerData: {
        name: "Müşteri Adı",
        email: "musteri@email.com",
        phone: "+90 555 123 45 67",
        address: "Müşteri Adresi",
        company: "Müşteri Şirketi",
      },
    },
    defaultStyles: {
      backgroundColor: "#f8fafc",
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#e2e8f0",
    },
  },
  "company-info": {
    type: "company-info",
    title: "Şirket Bilgileri",
    description: "Şirket bilgi kartı",
    icon: "🏢",
    category: "Bilgi",
    preview: "Şirket Bilgileri",
    defaultContent: {
      companyData: {
        name: "Şirket Adı",
        tagline: "Şirket Sloganı",
        description: "Şirket açıklaması",
        address: "Şirket Adresi",
        phone: "+90 555 123 45 67",
        email: "info@sirket.com",
        website: "www.sirket.com",
        logoUrl: "",
      },
    },
    defaultStyles: {
      backgroundColor: "#f8fafc",
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#e2e8f0",
    },
  },
  "pricing-table": {
    type: "pricing-table",
    title: "Fiyatlandırma Tablosu",
    description: "Fiyatlandırma tablosu",
    icon: "💰",
    category: "Veri",
    preview: "Fiyatlandırma",
    defaultContent: {
      pricingData: {
        items: [
          {
            name: "Ürün 1",
            description: "Açıklama",
            quantity: 1,
            unitPrice: 100,
            total: 100,
          },
          {
            name: "Ürün 2",
            description: "Açıklama",
            quantity: 2,
            unitPrice: 50,
            total: 100,
          },
        ],
        subtotal: 200,
        tax: 36,
        total: 236,
        currency: "TL",
      },
    },
    defaultStyles: {
      width: "100%",
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      backgroundColor: "#ffffff",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#e2e8f0",
    },
  },
  gallery: {
    type: "gallery",
    title: "Galeri",
    description: "Resim galerisi",
    icon: "🖼️",
    category: "Medya",
    preview: "Galeri",
    defaultContent: {
      galleryImages: [],
    },
    defaultStyles: {
      width: "100%",
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
    },
  },
  "hero-section": {
    type: "hero-section",
    title: "Hero Bölümü",
    description: "Ana başlık bölümü",
    icon: "🎯",
    category: "Düzen",
    preview: "Hero Bölümü",
    defaultContent: {
      heading: "Ana Başlık",
      text: "Alt başlık veya açıklama metni",
    },
    defaultStyles: {
      textAlign: "center",
      padding: { top: 40, right: 20, bottom: 40, left: 20 },
      backgroundColor: "#f8fafc",
    },
  },
  footer: {
    type: "footer",
    title: "Alt Bilgi",
    description: "Sayfa alt bilgisi",
    icon: "📄",
    category: "Düzen",
    preview: "Alt Bilgi",
    defaultContent: {
      text: "© 2024 Şirket Adı. Tüm hakları saklıdır.",
    },
    defaultStyles: {
      textAlign: "center",
      padding: { top: 20, right: 20, bottom: 20, left: 20 },
      backgroundColor: "#f1f5f9",
      fontSize: 14,
      color: "#64748b",
    },
  },
  header: {
    type: "header",
    title: "Üst Bilgi",
    description: "Sayfa üst bilgisi",
    icon: "📋",
    category: "Düzen",
    preview: "Üst Bilgi",
    defaultContent: {
      heading: "Şirket Adı",
      text: "Slogan veya açıklama",
    },
    defaultStyles: {
      textAlign: "center",
      padding: { top: 20, right: 20, bottom: 20, left: 20 },
      backgroundColor: "#ffffff",
      borderWidth: 0,
      borderBottomWidth: 1,
      borderColor: "#e2e8f0",
    },
  },
};

export const getBlockLibraryItem = (type: BlockType): BlockLibraryItem => {
  return blockLibrary[type];
};

export const getBlocksByCategory = (category: string): BlockLibraryItem[] => {
  return Object.values(blockLibrary).filter(
    (block) => block.category === category
  );
};

export const getAllCategories = (): string[] => {
  const categories = new Set(
    Object.values(blockLibrary).map((block) => block.category)
  );
  return Array.from(categories);
};
