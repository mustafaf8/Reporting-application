# Blok Editörü - Yeni Nesil Dinamik Editör Mimarisi

Bu proje, mevcut raporlama uygulamasının editörünü Canva'nın esnekliği ve Figma'nın performansını hedefleyen, tamamen modüler, API tabanlı ve sunucu tarafında işlenebilen bir blok editör sistemiyle yeniden inşa eder.

## 🎯 Özellikler

### ✅ Tamamlanan Özellikler

- **Atomik Blok Mimarisi**: Her şablon bileşeni yeniden kullanılabilir React bileşenleri olarak tasarlandı
- **Dinamik Blok Oluşturucu**: Backend JSON şemasına göre blokları dinamik olarak çizen ana bileşen
- **Sürükle ve Bırak**: dnd-kit ile blok yeniden sıralama ve ekleme
- **Durum Yönetimi**: Zustand ile hafif ve verimli state management
- **Anlık Önizleme Motoru**: iframe içinde izole edilmiş önizleme paneli
- **Blok Ayarları Paneli**: Seçilen bloğa göre dinamik ayar paneli
- **Satır İçi Metin Düzenleme**: Doğrudan önizleme alanında metin düzenleme
- **Global Stil Yönetimi**: Şablon geneli ayarları yöneten arayüz
- **API Soyutlama Katmanı**: Backend iletişimini yöneten merkezi servis
- **Performans Optimizasyonu**: React.memo ve useCallback ile optimizasyon
- **Blok Kütüphanesi Arayüzü**: Mevcut blokları gösteren görsel panel
- **Geri Al/İleri Al**: Durum yönetimi katmanına entegre undo/redo
- **Klavye Kısayolları**: Temel işlemler için kısayol desteği
- **Şablon Olarak Kaydetme**: Özelleştirmeleri kişisel şablon olarak kaydetme

### 🚧 Geliştirilmekte Olan Özellikler

- **Varlık Yönetimi**: ImageUpload bileşenini yeni blok sistemine uyarlama
- **Duyarlı Tasarım**: Farklı ekran boyutlarında sorunsuz çalışma
- **Bağlam Menüsü**: Bloklara sağ tık ile hızlı işlemler
- **Modüler Stil Sistemi**: Her bloğun kendi stilini barındırması
- **Yükleme ve Hata Durumları**: Her parçada loading/error yönetimi
- **Erişilebilirlik**: Klavye navigasyonu ve ekran okuyucu uyumluluğu

## 🏗️ Mimari

### Blok Tipleri

```typescript
type BlockType =
  | "text" // Metin bloğu
  | "heading" // Başlık bloğu
  | "image" // Resim bloğu
  | "table" // Tablo bloğu
  | "spacer" // Boşluk bloğu
  | "divider" // Ayırıcı bloğu
  | "customer-info" // Müşteri bilgi kartı
  | "company-info" // Şirket bilgi kartı
  | "pricing-table" // Fiyatlandırma tablosu
  | "gallery" // Resim galerisi
  | "hero-section" // Ana başlık bölümü
  | "footer" // Alt bilgi
  | "header"; // Üst bilgi
```

### Bileşen Yapısı

```
components/block-editor/
├── BlockEditor.tsx          # Ana editör bileşeni
├── EditorCanvas.tsx         # Canvas ve DnD yönetimi
├── BlockRenderer.tsx        # Blok renderer
├── BlockLibrary.tsx         # Blok kütüphanesi
├── BlockSettings.tsx        # Blok ayarları
├── GlobalSettings.tsx       # Global ayarlar
└── blocks/                  # Blok bileşenleri
    ├── BaseBlock.tsx        # Temel blok wrapper
    ├── TextBlock.tsx        # Metin bloğu
    ├── HeadingBlock.tsx     # Başlık bloğu
    ├── ImageBlock.tsx       # Resim bloğu
    └── TableBlock.tsx       # Tablo bloğu
```

### State Management

Zustand store ile merkezi durum yönetimi:

```typescript
interface EditorStore {
  blocks: Block[];
  selectedBlockId: string | null;
  isPreviewMode: boolean;
  isDirty: boolean;
  globalStyles: GlobalStyles;
  canvasSize: CanvasSize;

  // Actions
  addBlock: (block: Block, position?: number) => void;
  removeBlock: (blockId: string) => void;
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  // ... diğer aksiyonlar
}
```

## 🚀 Kullanım

### Temel Kullanım

```tsx
import { BlockEditor } from "@/components/block-editor/BlockEditor";

function MyEditor() {
  return (
    <div className="h-screen">
      <BlockEditor />
    </div>
  );
}
```

### API Kullanımı

```typescript
import { blockEditorAPI } from '@/lib/api/block-editor';

// Şablon kaydetme
const result = await blockEditorAPI.saveTemplate({
  name: 'Yeni Şablon',
  description: 'Açıklama',
  blocks: [...],
  globalStyles: {...},
  canvasSize: {...}
});

// Şablon yükleme
const template = await blockEditorAPI.loadTemplate('template-id');

// Önizleme oluşturma
const preview = await blockEditorAPI.generatePreview({
  templateId: 'template-id',
  blocks: [...],
  globalStyles: {...},
  canvasSize: {...}
});
```

## ⌨️ Klavye Kısayolları

- `Ctrl+Z` / `Cmd+Z`: Geri al
- `Ctrl+Shift+Z` / `Cmd+Shift+Z`: İleri al
- `Ctrl+S` / `Cmd+S`: Kaydet
- `Ctrl+P` / `Cmd+P`: Önizleme modunu aç/kapat

## 🎨 Blok Özelleştirme

### Stil Özellikleri

Her blok aşağıdaki stil özelliklerini destekler:

```typescript
interface BlockStyles {
  fontSize?: number;
  fontWeight?: "normal" | "bold" | "semibold" | "light";
  color?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  padding?: { top: number; right: number; bottom: number; left: number };
  margin?: { top: number; right: number; bottom: number; left: number };
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
}
```

### Global Stiller

```typescript
interface GlobalStyles {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  spacing: number;
}
```

## 🔧 Geliştirme

### Yeni Blok Tipi Ekleme

1. `types/block-editor.ts` dosyasına yeni blok tipini ekleyin
2. `lib/block-library/index.ts` dosyasına blok kütüphanesi öğesini ekleyin
3. `components/block-editor/blocks/` klasörüne yeni blok bileşenini oluşturun
4. `BlockRenderer.tsx` dosyasına yeni blok renderer'ını ekleyin

### Performans Optimizasyonu

- Tüm blok bileşenleri `React.memo` ile sarılmıştır
- Event handler'lar `useCallback` ile optimize edilmiştir
- Gereksiz re-render'lar önlenmiştir

## 📱 Responsive Tasarım

Editör farklı ekran boyutlarında çalışacak şekilde tasarlanmıştır:

- **Desktop**: Tam özellikli editör deneyimi
- **Tablet**: Dokunmatik optimizasyonlu arayüz
- **Mobile**: Basitleştirilmiş mobil deneyim

## ♿ Erişilebilirlik

- Klavye navigasyonu desteği
- Ekran okuyucu uyumluluğu
- ARIA etiketleri
- Yüksek kontrast desteği

## 🧪 Test

```bash
# Unit testler
npm run test

# E2E testler
npm run test:e2e

# Linting
npm run lint
```

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
