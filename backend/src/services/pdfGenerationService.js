const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const Template = require("../models/Template");
const blockEditorService = require("./blockEditorService");
const logger = require("../config/logger");

class PDFGenerationService {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
  }

  /**
   * Servisi başlat
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu"
        ],
        timeout: 30000
      });
      this.isInitialized = true;
      logger.info("PDF generation service initialized");
    } catch (error) {
      logger.error("Error initializing PDF generation service", {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Servisi kapat
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      logger.info("PDF generation service closed");
    }
  }

  /**
   * Blok editörü şablonundan PDF oluştur
   */
  async generateFromBlockEditor(templateId, data = {}, options = {}) {
    try {
      await this.initialize();

      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      // Blok editörü şablonu mu kontrol et
      if (!template.blocks || template.blocks.length === 0) {
        throw new Error("Bu şablon blok editörü şablonu değil");
      }

      // Blokları HTML'e render et
      const html = await this.renderBlockEditorTemplate(template, data, options);

      // PDF oluştur
      const pdfBuffer = await this.generatePDFFromHTML(html, options);

      return {
        success: true,
        pdfBuffer,
        templateId: template._id,
        templateName: template.name,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error("Error generating PDF from block editor", {
        error: error.message,
        templateId,
        data
      });
      throw error;
    }
  }

  /**
   * Eski EJS şablonundan PDF oluştur (geriye uyumluluk)
   */
  async generateFromEJSTemplate(templateId, data = {}, options = {}) {
    try {
      await this.initialize();

      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      // EJS dosyası var mı kontrol et
      if (!template.ejsFile) {
        throw new Error("Bu şablon EJS şablonu değil");
      }

      // EJS şablonunu render et
      const html = await this.renderEJSTemplate(template, data, options);

      // PDF oluştur
      const pdfBuffer = await this.generatePDFFromHTML(html, options);

      return {
        success: true,
        pdfBuffer,
        templateId: template._id,
        templateName: template.name,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error("Error generating PDF from EJS template", {
        error: error.message,
        templateId,
        data
      });
      throw error;
    }
  }

  /**
   * Blok editörü şablonunu render et
   */
  async renderBlockEditorTemplate(template, data = {}, options = {}) {
    try {
      // Blokları HTML'e render et
      const blocksHTML = await blockEditorService.renderBlocksToHTML(
        template.blocks,
        template.globalStyles,
        data
      );

      // Tam HTML belgesi oluştur
      const fullHTML = this.wrapInDocument(blocksHTML, template.globalStyles, {
        title: template.name,
        ...options
      });

      return fullHTML;
    } catch (error) {
      logger.error("Error rendering block editor template", {
        error: error.message,
        templateId: template._id
      });
      throw error;
    }
  }

  /**
   * EJS şablonunu render et
   */
  async renderEJSTemplate(template, data = {}, options = {}) {
    try {
      const ejsPath = path.join(__dirname, "..", "templates", template.ejsFile);
      
      // EJS dosyası var mı kontrol et
      if (!fs.existsSync(ejsPath)) {
        throw new Error(`EJS dosyası bulunamadı: ${template.ejsFile}`);
      }

      // Veriyi hazırla
      const renderData = this.prepareEJSTemplateData(data, template);

      // EJS şablonunu render et
      const html = await ejs.renderFile(ejsPath, renderData, { async: true });

      return html;
    } catch (error) {
      logger.error("Error rendering EJS template", {
        error: error.message,
        templateId: template._id,
        ejsFile: template.ejsFile
      });
      throw error;
    }
  }

  /**
   * EJS şablonu için veri hazırla
   */
  prepareEJSTemplateData(data, template) {
    // Fiyat hesaplamaları
    const subtotal = data.items?.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0
    ) || 0;

    const discountAmount = subtotal * (Number(data.discountRate || 0) / 100);
    const withExtras = subtotal - discountAmount + (Number(data.extraCosts || 0));
    const vatAmount = withExtras * (Number(data.vatRate || 0) / 100);
    const grandTotal = Math.round((withExtras + vatAmount) * 100) / 100;

    // Tasarım ve marka bilgileri
    const design = data.customizations?.design || {};
    const brand = data.customizations?.brand || {};

    return {
      customerName: data.customerName || "",
      items: data.items || [],
      createdAt: data.createdAt || Date.now(),
      status: data.status || "draft",
      subtotal,
      vatRate: Number(data.vatRate || 0),
      vatAmount,
      discountRate: Number(data.discountRate || 0),
      discountAmount,
      extraCosts: Number(data.extraCosts || 0),
      grandTotal,
      company: {
        ...(data.company || {}),
        logoDataUrl: brand.logoUrl || data.company?.logoDataUrl || data.company?.logoUrl,
        logoUrl: brand.logoUrl || data.company?.logoUrl,
      },
      design: {
        primaryColor: design.primaryColor || template.design?.primaryColor,
        secondaryColor: design.secondaryColor || template.design?.secondaryColor,
        accentColor: design.accentColor || template.design?.accentColor,
      },
      customer: data.customer || {},
      issuer: data.issuer || {},
      aboutRmr: data.aboutRmr || "",
      customizations: data.customizations || {},
      formatCurrency: (value) => this.formatCurrencyTRY(value),
      template: template
    };
  }

  /**
   * HTML'den PDF oluştur
   */
  async generatePDFFromHTML(html, options = {}) {
    try {
      const page = await this.browser.newPage();
      
      // Sayfa ayarları
      await page.setViewport({
        width: options.width || 1200,
        height: options.height || 800,
        deviceScaleFactor: options.deviceScaleFactor || 1
      });

      // HTML içeriğini yükle
      await page.setContent(html, { 
        waitUntil: "networkidle0",
        timeout: 30000
      });

      // PDF seçenekleri
      const pdfOptions = {
        format: options.format || "A4",
        margin: options.margin || {
          top: "20mm",
          right: "15mm",
          bottom: "20mm",
          left: "15mm"
        },
        printBackground: options.printBackground !== false,
        displayHeaderFooter: options.displayHeaderFooter || false,
        ...options.pdfOptions
      };

      // Header ve footer varsa ekle
      if (options.header) {
        pdfOptions.headerTemplate = options.header;
      }
      if (options.footer) {
        pdfOptions.footerTemplate = options.footer;
      }

      // PDF oluştur
      const pdfBuffer = await page.pdf(pdfOptions);
      await page.close();

      return pdfBuffer;
    } catch (error) {
      logger.error("Error generating PDF from HTML", {
        error: error.message,
        options
      });
      throw error;
    }
  }

  /**
   * HTML'i tam belge olarak sarmala
   */
  wrapInDocument(html, globalStyles = {}, options = {}) {
    const title = options.title || "Teklif";
    const styles = this.generateGlobalStyles(globalStyles);
    const customCSS = options.customCSS || "";

    return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${styles}
        ${customCSS}
        
        /* PDF için özel stiller */
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .page-break {
                page-break-before: always;
            }
            
            .no-break {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="document-container">
        ${html}
    </div>
</body>
</html>`;
  }

  /**
   * Global stilleri CSS olarak oluştur
   */
  generateGlobalStyles(globalStyles) {
    const {
      primaryColor = "#4f46e5",
      secondaryColor = "#7c3aed",
      fontFamily = "Inter, sans-serif",
      fontSize = 16,
      lineHeight = 1.5,
      backgroundColor = "#ffffff",
      textColor = "#1f2937",
      borderRadius = 8,
      spacing = 16
    } = globalStyles;

    return `
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: ${fontFamily};
            font-size: ${fontSize}px;
            line-height: ${lineHeight};
            color: ${textColor};
            background-color: ${backgroundColor};
            margin: 0;
            padding: 0;
        }
        
        .document-container {
            max-width: 100%;
            margin: 0 auto;
            padding: ${spacing}px;
        }
        
        .block {
            margin-bottom: ${spacing}px;
        }
        
        .text-block {
            font-size: ${fontSize}px;
            line-height: ${lineHeight};
        }
        
        .heading-block {
            font-weight: bold;
            margin-bottom: ${spacing}px;
        }
        
        .image-block {
            max-width: 100%;
            height: auto;
            border-radius: ${borderRadius}px;
        }
        
        .table-block {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: ${spacing}px;
        }
        
        .table-block th,
        .table-block td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: left;
        }
        
        .table-block th {
            background-color: #f9fafb;
            font-weight: bold;
        }
        
        .customer-block,
        .company-block {
            padding: ${spacing}px;
            border-radius: ${borderRadius}px;
            margin-bottom: ${spacing}px;
        }
        
        .customer-block {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
        }
        
        .company-block {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
        }
        
        .pricing-block {
            padding: 20px;
            background-color: #ffffff;
            border-radius: 12px;
            border: 2px solid #e5e7eb;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            margin-bottom: ${spacing}px;
        }
        
        .signature-block {
            padding: 20px;
            text-align: right;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
        }
        
        .spacer-block {
            height: 20px;
        }
        
        .divider-block {
            height: 1px;
            background-color: #e5e7eb;
            margin: 16px 0;
        }
    `;
  }

  /**
   * Para birimi formatla
   */
  formatCurrencyTRY(value) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }

  /**
   * Şablon türünü otomatik tespit et
   */
  async detectTemplateType(templateId) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error("Şablon bulunamadı");
      }

      if (template.blocks && template.blocks.length > 0) {
        return "block_editor";
      } else if (template.ejsFile) {
        return "ejs";
      } else {
        throw new Error("Desteklenmeyen şablon türü");
      }
    } catch (error) {
      logger.error("Error detecting template type", {
        error: error.message,
        templateId
      });
      throw error;
    }
  }

  /**
   * Otomatik şablon türü tespiti ile PDF oluştur
   */
  async generatePDF(templateId, data = {}, options = {}) {
    try {
      const templateType = await this.detectTemplateType(templateId);

      if (templateType === "block_editor") {
        return await this.generateFromBlockEditor(templateId, data, options);
      } else if (templateType === "ejs") {
        return await this.generateFromEJSTemplate(templateId, data, options);
      } else {
        throw new Error("Desteklenmeyen şablon türü");
      }
    } catch (error) {
      logger.error("Error generating PDF", {
        error: error.message,
        templateId,
        data
      });
      throw error;
    }
  }

  /**
   * Toplu PDF oluşturma
   */
  async generateMultiplePDFs(requests) {
    try {
      const results = [];

      for (const request of requests) {
        try {
          const result = await this.generatePDF(
            request.templateId,
            request.data,
            request.options
          );
          results.push({
            success: true,
            ...result,
            requestId: request.id
          });
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            requestId: request.id,
            templateId: request.templateId
          });
        }
      }

      return {
        success: true,
        results,
        total: requests.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };
    } catch (error) {
      logger.error("Error generating multiple PDFs", {
        error: error.message,
        requestCount: requests.length
      });
      throw error;
    }
  }

  /**
   * PDF önizleme oluştur
   */
  async generatePreview(templateId, data = {}, options = {}) {
    try {
      const result = await this.generatePDF(templateId, data, {
        ...options,
        format: "A4",
        margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" }
      });

      return {
        success: true,
        previewBuffer: result.pdfBuffer,
        templateId: result.templateId,
        templateName: result.templateName,
        generatedAt: result.generatedAt
      };
    } catch (error) {
      logger.error("Error generating PDF preview", {
        error: error.message,
        templateId,
        data
      });
      throw error;
    }
  }
}

module.exports = new PDFGenerationService();
