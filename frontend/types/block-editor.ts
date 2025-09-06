// Blok Editörü için temel tipler
export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
  styles: BlockStyles;
  position: BlockPosition;
  metadata: BlockMetadata;
}

export type BlockType =
  | "text"
  | "heading"
  | "image"
  | "table"
  | "spacer"
  | "divider"
  | "customer-info"
  | "company-info"
  | "pricing-table"
  | "gallery"
  | "hero-section"
  | "footer"
  | "header";

export interface BlockContent {
  text?: string;
  heading?: string;
  imageUrl?: string;
  tableData?: TableData;
  galleryImages?: string[];
  customerData?: CustomerData;
  companyData?: CompanyData;
  pricingData?: PricingData;
}

export interface BlockStyles {
  fontSize?: number;
  fontWeight?: "normal" | "bold" | "semibold" | "light";
  color?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
}

export interface BlockPosition {
  x: number;
  y: number;
  zIndex: number;
}

export interface BlockMetadata {
  title: string;
  description?: string;
  category: string;
  isLocked?: boolean;
  isVisible?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Yardımcı tipler
export interface TableData {
  headers: string[];
  rows: (string | number)[][];
  hasHeader: boolean;
  isStriped: boolean;
}

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
}

export interface CompanyData {
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
}

export interface PricingData {
  items: PricingItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

export interface PricingItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Editör durumu
export interface EditorState {
  blocks: Block[];
  selectedBlockId: string | null;
  isPreviewMode: boolean;
  isDirty: boolean;
  history: EditorHistory;
  globalStyles: GlobalStyles;
  canvasSize: CanvasSize;
}

export interface EditorHistory {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
  maxHistorySize: number;
}

export interface GlobalStyles {
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

export interface CanvasSize {
  width: number;
  height: number;
  unit: "px" | "mm" | "in";
}

// Blok kütüphanesi
export interface BlockLibraryItem {
  type: BlockType;
  title: string;
  description: string;
  icon: string;
  category: string;
  preview: string;
  defaultContent: Partial<BlockContent>;
  defaultStyles: Partial<BlockStyles>;
}

// API tipleri
export interface SaveTemplateRequest {
  name: string;
  description?: string;
  blocks: Block[];
  globalStyles: GlobalStyles;
  canvasSize: CanvasSize;
}

export interface SaveTemplateResponse {
  id: string;
  success: boolean;
  message: string;
}

// Editör aksiyonları
export type EditorAction =
  | { type: "ADD_BLOCK"; payload: { block: Block; position?: number } }
  | { type: "REMOVE_BLOCK"; payload: { blockId: string } }
  | {
      type: "UPDATE_BLOCK";
      payload: { blockId: string; updates: Partial<Block> };
    }
  | { type: "REORDER_BLOCKS"; payload: { fromIndex: number; toIndex: number } }
  | { type: "SELECT_BLOCK"; payload: { blockId: string | null } }
  | { type: "TOGGLE_PREVIEW_MODE" }
  | { type: "UPDATE_GLOBAL_STYLES"; payload: { styles: Partial<GlobalStyles> } }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SAVE_TEMPLATE"; payload: { name: string; description?: string } }
  | { type: "LOAD_TEMPLATE"; payload: { templateId: string } }
  | { type: "RESET_EDITOR" };
