import { api } from "./index";
import {
  Block,
  GlobalStyles,
  CanvasSize,
  SaveTemplateRequest,
  SaveTemplateResponse,
} from "@/types/block-editor";

export interface BlockEditorTemplate {
  id: string;
  name: string;
  description?: string;
  blocks: Block[];
  globalStyles: GlobalStyles;
  canvasSize: CanvasSize;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface PreviewRequest {
  templateId: string;
  blocks: Block[];
  globalStyles: GlobalStyles;
  canvasSize: CanvasSize;
  customerData?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    company: string;
  };
  companyData?: {
    name: string;
    tagline: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logoUrl: string;
  };
}

export interface PreviewResponse {
  html: string;
  css: string;
  success: boolean;
  error?: string;
}

class BlockEditorAPI {
  private baseUrl = "/api/block-editor";

  // Template operations
  async saveTemplate(data: SaveTemplateRequest): Promise<SaveTemplateResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/templates`, data);
      return response.data;
    } catch (error) {
      console.error("Save template error:", error);
      throw new Error("Şablon kaydedilemedi");
    }
  }

  async loadTemplate(templateId: string): Promise<BlockEditorTemplate> {
    try {
      const response = await api.get(`${this.baseUrl}/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error("Load template error:", error);
      throw new Error("Şablon yüklenemedi");
    }
  }

  async updateTemplate(
    templateId: string,
    data: Partial<SaveTemplateRequest>
  ): Promise<SaveTemplateResponse> {
    try {
      const response = await api.put(
        `${this.baseUrl}/templates/${templateId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Update template error:", error);
      throw new Error("Şablon güncellenemedi");
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/templates/${templateId}`);
    } catch (error) {
      console.error("Delete template error:", error);
      throw new Error("Şablon silinemedi");
    }
  }

  async listTemplates(): Promise<BlockEditorTemplate[]> {
    try {
      const response = await api.get(`${this.baseUrl}/templates`);
      return response.data;
    } catch (error) {
      console.error("List templates error:", error);
      throw new Error("Şablonlar yüklenemedi");
    }
  }

  // Preview operations
  async generatePreview(data: PreviewRequest): Promise<PreviewResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/preview`, data);
      return response.data;
    } catch (error) {
      console.error("Generate preview error:", error);
      throw new Error("Önizleme oluşturulamadı");
    }
  }

  // Asset operations
  async uploadAsset(
    file: File,
    type: "image" | "document" | "other" = "image"
  ): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await api.post(
        `${this.baseUrl}/assets/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data.url;
    } catch (error) {
      console.error("Upload asset error:", error);
      throw new Error("Dosya yüklenemedi");
    }
  }

  async deleteAsset(assetUrl: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/assets`, {
        data: { url: assetUrl },
      });
    } catch (error) {
      console.error("Delete asset error:", error);
      throw new Error("Dosya silinemedi");
    }
  }

  // Export operations
  async exportToPDF(
    templateId: string,
    options?: {
      format?: "A4" | "A3" | "Letter";
      orientation?: "portrait" | "landscape";
      quality?: "low" | "medium" | "high";
    }
  ): Promise<Blob> {
    try {
      const response = await api.post(
        `${this.baseUrl}/export/pdf/${templateId}`,
        options,
        { responseType: "blob" }
      );
      return response.data;
    } catch (error) {
      console.error("Export PDF error:", error);
      throw new Error("PDF oluşturulamadı");
    }
  }

  async exportToImage(
    templateId: string,
    options?: {
      format?: "png" | "jpeg" | "webp";
      quality?: number;
      width?: number;
      height?: number;
    }
  ): Promise<Blob> {
    try {
      const response = await api.post(
        `${this.baseUrl}/export/image/${templateId}`,
        options,
        { responseType: "blob" }
      );
      return response.data;
    } catch (error) {
      console.error("Export image error:", error);
      throw new Error("Resim oluşturulamadı");
    }
  }

  // Validation operations
  async validateTemplate(data: {
    blocks: Block[];
    globalStyles: GlobalStyles;
    canvasSize: CanvasSize;
  }): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/validate`, data);
      return response.data;
    } catch (error) {
      console.error("Validate template error:", error);
      throw new Error("Şablon doğrulanamadı");
    }
  }

  // Analytics operations
  async getTemplateAnalytics(templateId: string): Promise<{
    views: number;
    exports: number;
    lastUsed: string;
    performance: {
      loadTime: number;
      renderTime: number;
    };
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/analytics/${templateId}`);
      return response.data;
    } catch (error) {
      console.error("Get analytics error:", error);
      throw new Error("Analitik veriler alınamadı");
    }
  }

  // Collaboration operations (for future implementation)
  async shareTemplate(
    templateId: string,
    permissions: {
      canView: string[];
      canEdit: string[];
      canComment: string[];
    }
  ): Promise<{
    shareUrl: string;
    shareId: string;
  }> {
    try {
      const response = await api.post(
        `${this.baseUrl}/templates/${templateId}/share`,
        permissions
      );
      return response.data;
    } catch (error) {
      console.error("Share template error:", error);
      throw new Error("Şablon paylaşılamadı");
    }
  }

  async getSharedTemplate(shareId: string): Promise<BlockEditorTemplate> {
    try {
      const response = await api.get(`${this.baseUrl}/shared/${shareId}`);
      return response.data;
    } catch (error) {
      console.error("Get shared template error:", error);
      throw new Error("Paylaşılan şablon alınamadı");
    }
  }
}

export const blockEditorAPI = new BlockEditorAPI();
