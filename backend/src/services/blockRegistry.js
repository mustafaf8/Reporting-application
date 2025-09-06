const logger = require("../config/logger");

class BlockRegistry {
  constructor() {
    this.blocks = new Map();
    this.renderers = new Map();
    this.validators = new Map();
    this.defaultStyles = new Map();
  }

  /**
   * Yeni blok türü kaydet
   */
  registerBlock(blockType, config) {
    const {
      name,
      description,
      icon,
      category = "basic",
      renderer,
      validator,
      defaultStyle = {},
      schema = {},
      dependencies = [],
      isAdvanced = false,
      requiresAuth = false
    } = config;

    if (this.blocks.has(blockType)) {
      logger.warn(`Block type ${blockType} is already registered, overwriting...`);
    }

    this.blocks.set(blockType, {
      type: blockType,
      name,
      description,
      icon,
      category,
      schema,
      dependencies,
      isAdvanced,
      requiresAuth,
      registeredAt: new Date()
    });

    if (renderer) {
      this.renderers.set(blockType, renderer);
    }

    if (validator) {
      this.validators.set(blockType, validator);
    }

    if (Object.keys(defaultStyle).length > 0) {
      this.defaultStyles.set(blockType, defaultStyle);
    }

    logger.info(`Block type ${blockType} registered successfully`, {
      blockType,
      name,
      category,
      isAdvanced
    });
  }

  /**
   * Blok türünü kaldır
   */
  unregisterBlock(blockType) {
    const removed = this.blocks.delete(blockType);
    this.renderers.delete(blockType);
    this.validators.delete(blockType);
    this.defaultStyles.delete(blockType);

    if (removed) {
      logger.info(`Block type ${blockType} unregistered successfully`);
    }

    return removed;
  }

  /**
   * Blok türünü getir
   */
  getBlock(blockType) {
    return this.blocks.get(blockType);
  }

  /**
   * Tüm blok türlerini getir
   */
  getAllBlocks() {
    return Array.from(this.blocks.values());
  }

  /**
   * Kategoriye göre blok türlerini getir
   */
  getBlocksByCategory(category) {
    return Array.from(this.blocks.values()).filter(block => block.category === category);
  }

  /**
   * Gelişmiş blok türlerini getir
   */
  getAdvancedBlocks() {
    return Array.from(this.blocks.values()).filter(block => block.isAdvanced);
  }

  /**
   * Temel blok türlerini getir
   */
  getBasicBlocks() {
    return Array.from(this.blocks.values()).filter(block => !block.isAdvanced);
  }

  /**
   * Blok renderer'ını getir
   */
  getRenderer(blockType) {
    return this.renderers.get(blockType);
  }

  /**
   * Blok validator'ını getir
   */
  getValidator(blockType) {
    return this.validators.get(blockType);
  }

  /**
   * Blok varsayılan stilini getir
   */
  getDefaultStyle(blockType) {
    return this.defaultStyles.get(blockType) || {};
  }

  /**
   * Blok türünün kayıtlı olup olmadığını kontrol et
   */
  hasBlock(blockType) {
    return this.blocks.has(blockType);
  }

  /**
   * Blok türünün renderer'ı var mı kontrol et
   */
  hasRenderer(blockType) {
    return this.renderers.has(blockType);
  }

  /**
   * Blok türünün validator'ı var mı kontrol et
   */
  hasValidator(blockType) {
    return this.validators.has(blockType);
  }

  /**
   * Blok türünün bağımlılıklarını kontrol et
   */
  checkDependencies(blockType) {
    const block = this.getBlock(blockType);
    if (!block) {
      return { valid: false, missing: [blockType] };
    }

    const missing = block.dependencies.filter(dep => !this.hasBlock(dep));
    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Blok türünü render et
   */
  async renderBlock(blockType, blockData, context = {}) {
    const renderer = this.getRenderer(blockType);
    
    if (!renderer) {
      throw new Error(`No renderer found for block type: ${blockType}`);
    }

    try {
      return await renderer(blockData, context);
    } catch (error) {
      logger.error(`Error rendering block ${blockType}`, {
        error: error.message,
        blockType,
        blockData
      });
      throw error;
    }
  }

  /**
   * Blok türünü validate et
   */
  async validateBlock(blockType, blockData) {
    const validator = this.getValidator(blockType);
    
    if (!validator) {
      // Varsayılan validasyon
      return this.defaultValidate(blockData);
    }

    try {
      return await validator(blockType, blockData);
    } catch (error) {
      logger.error(`Error validating block ${blockType}`, {
        error: error.message,
        blockType,
        blockData
      });
      throw error;
    }
  }

  /**
   * Varsayılan validasyon
   */
  defaultValidate(blockData) {
    const errors = [];

    if (!blockData.id) {
      errors.push("Block ID is required");
    }

    if (!blockData.type) {
      errors.push("Block type is required");
    }

    if (!blockData.content) {
      errors.push("Block content is required");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Blok türü istatistiklerini getir
   */
  getStats() {
    const total = this.blocks.size;
    const withRenderers = Array.from(this.renderers.keys()).length;
    const withValidators = Array.from(this.validators.keys()).length;
    const withDefaultStyles = Array.from(this.defaultStyles.keys()).length;

    const categories = {};
    Array.from(this.blocks.values()).forEach(block => {
      categories[block.category] = (categories[block.category] || 0) + 1;
    });

    return {
      total,
      withRenderers,
      withValidators,
      withDefaultStyles,
      categories,
      advancedBlocks: this.getAdvancedBlocks().length,
      basicBlocks: this.getBasicBlocks().length
    };
  }

  /**
   * Registry'yi temizle
   */
  clear() {
    this.blocks.clear();
    this.renderers.clear();
    this.validators.clear();
    this.defaultStyles.clear();
    logger.info("Block registry cleared");
  }

  /**
   * Registry'yi başlat (varsayılan blokları kaydet)
   */
  initialize() {
    this.registerDefaultBlocks();
    logger.info("Block registry initialized", this.getStats());
  }

  /**
   * Varsayılan blok türlerini kaydet
   */
  registerDefaultBlocks() {
    // Text Block
    this.registerBlock("text", {
      name: "Metin",
      description: "Temel metin bloğu",
      icon: "text",
      category: "basic",
      renderer: this.createTextRenderer(),
      validator: this.createTextValidator(),
      defaultStyle: {
        fontSize: 16,
        fontFamily: "Inter, sans-serif",
        color: "#1f2937",
        lineHeight: 1.5
      },
      schema: {
        content: { type: "string", required: true },
        textAlign: { type: "string", enum: ["left", "center", "right", "justify"] }
      }
    });

    // Heading Block
    this.registerBlock("heading", {
      name: "Başlık",
      description: "Başlık bloğu",
      icon: "heading",
      category: "basic",
      renderer: this.createHeadingRenderer(),
      validator: this.createHeadingValidator(),
      defaultStyle: {
        fontSize: 24,
        fontFamily: "Inter, sans-serif",
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 16
      },
      schema: {
        content: { type: "string", required: true },
        level: { type: "number", min: 1, max: 6, default: 2 }
      }
    });

    // Image Block
    this.registerBlock("image", {
      name: "Görsel",
      description: "Görsel bloğu",
      icon: "image",
      category: "media",
      renderer: this.createImageRenderer(),
      validator: this.createImageValidator(),
      defaultStyle: {
        maxWidth: "100%",
        height: "auto",
        borderRadius: 8
      },
      schema: {
        src: { type: "string", required: true },
        alt: { type: "string", default: "" },
        width: { type: "number" },
        height: { type: "number" }
      }
    });

    // Table Block
    this.registerBlock("table", {
      name: "Tablo",
      description: "Tablo bloğu",
      icon: "table",
      category: "data",
      renderer: this.createTableRenderer(),
      validator: this.createTableValidator(),
      defaultStyle: {
        borderCollapse: "collapse",
        width: "100%",
        marginBottom: 16
      },
      schema: {
        headers: { type: "array", required: true },
        rows: { type: "array", required: true }
      }
    });

    // Spacer Block
    this.registerBlock("spacer", {
      name: "Boşluk",
      description: "Boşluk bloğu",
      icon: "spacer",
      category: "layout",
      renderer: this.createSpacerRenderer(),
      validator: this.createSpacerValidator(),
      defaultStyle: {
        height: 20,
        backgroundColor: "transparent"
      },
      schema: {
        height: { type: "number", min: 0, default: 20 }
      }
    });

    // Divider Block
    this.registerBlock("divider", {
      name: "Ayırıcı",
      description: "Ayırıcı çizgi bloğu",
      icon: "divider",
      category: "layout",
      renderer: this.createDividerRenderer(),
      validator: this.createDividerValidator(),
      defaultStyle: {
        height: 1,
        backgroundColor: "#e5e7eb",
        margin: "16px 0"
      },
      schema: {
        style: { type: "string", enum: ["solid", "dashed", "dotted"], default: "solid" }
      }
    });

    // Customer Block
    this.registerBlock("customer", {
      name: "Müşteri Bilgileri",
      description: "Müşteri bilgileri bloğu",
      icon: "customer",
      category: "business",
      renderer: this.createCustomerRenderer(),
      validator: this.createCustomerValidator(),
      defaultStyle: {
        padding: 16,
        backgroundColor: "#f9fafb",
        borderRadius: 8,
        border: "1px solid #e5e7eb"
      },
      schema: {
        name: { type: "string", required: true },
        email: { type: "string" },
        phone: { type: "string" },
        company: { type: "string" },
        address: { type: "string" }
      }
    });

    // Company Block
    this.registerBlock("company", {
      name: "Şirket Bilgileri",
      description: "Şirket bilgileri bloğu",
      icon: "company",
      category: "business",
      renderer: this.createCompanyRenderer(),
      validator: this.createCompanyValidator(),
      defaultStyle: {
        padding: 16,
        backgroundColor: "#f0f9ff",
        borderRadius: 8,
        border: "1px solid #0ea5e9"
      },
      schema: {
        name: { type: "string", required: true },
        logo: { type: "string" },
        address: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        website: { type: "string" }
      }
    });

    // Pricing Block
    this.registerBlock("pricing", {
      name: "Fiyatlandırma",
      description: "Fiyatlandırma tablosu bloğu",
      icon: "pricing",
      category: "business",
      renderer: this.createPricingRenderer(),
      validator: this.createPricingValidator(),
      defaultStyle: {
        padding: 20,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        border: "2px solid #e5e7eb",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      },
      schema: {
        title: { type: "string", required: true },
        items: { type: "array", required: true },
        total: { type: "number" },
        currency: { type: "string", default: "USD" }
      }
    });

    // Signature Block
    this.registerBlock("signature", {
      name: "İmza",
      description: "İmza bloğu",
      icon: "signature",
      category: "business",
      renderer: this.createSignatureRenderer(),
      validator: this.createSignatureValidator(),
      defaultStyle: {
        padding: 20,
        textAlign: "right",
        borderTop: "1px solid #e5e7eb",
        marginTop: 20
      },
      schema: {
        name: { type: "string", required: true },
        title: { type: "string" },
        signature: { type: "string" }
      }
    });
  }

  // Renderer factory methods
  createTextRenderer() {
    return (blockData, context) => {
      const { content, textAlign = "left" } = blockData.content || {};
      const styles = this.mergeStyles(this.getDefaultStyle("text"), blockData.styles || {});
      
      return `<p style="${this.generateStyleString(styles)} text-align: ${textAlign};">${content || ""}</p>`;
    };
  }

  createHeadingRenderer() {
    return (blockData, context) => {
      const { content, level = 2 } = blockData.content || {};
      const styles = this.mergeStyles(this.getDefaultStyle("heading"), blockData.styles || {});
      
      return `<h${level} style="${this.generateStyleString(styles)}">${content || ""}</h${level}>`;
    };
  }

  createImageRenderer() {
    return (blockData, context) => {
      const { src, alt = "", width, height } = blockData.content || {};
      const styles = this.mergeStyles(this.getDefaultStyle("image"), blockData.styles || {});
      
      let styleString = this.generateStyleString(styles);
      if (width) styleString += ` width: ${width}px;`;
      if (height) styleString += ` height: ${height}px;`;
      
      return `<img src="${src}" alt="${alt}" style="${styleString}" />`;
    };
  }

  createTableRenderer() {
    return (blockData, context) => {
      const { headers = [], rows = [] } = blockData.content || {};
      const styles = this.mergeStyles(this.getDefaultStyle("table"), blockData.styles || {});
      
      let tableHTML = `<table style="${this.generateStyleString(styles)}">`;
      
      if (headers.length > 0) {
        tableHTML += "<thead><tr>";
        headers.forEach(header => {
          tableHTML += `<th style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb;">${header}</th>`;
        });
        tableHTML += "</tr></thead>";
      }
      
      if (rows.length > 0) {
        tableHTML += "<tbody>";
        rows.forEach(row => {
          tableHTML += "<tr>";
          row.forEach(cell => {
            tableHTML += `<td style="padding: 8px; border: 1px solid #e5e7eb;">${cell}</td>`;
          });
          tableHTML += "</tr>";
        });
        tableHTML += "</tbody>";
      }
      
      tableHTML += "</table>";
      return tableHTML;
    };
  }

  createSpacerRenderer() {
    return (blockData, context) => {
      const { height = 20 } = blockData.content || {};
      const styles = this.mergeStyles(this.getDefaultStyle("spacer"), blockData.styles || {});
      
      return `<div style="${this.generateStyleString(styles)} height: ${height}px;"></div>`;
    };
  }

  createDividerRenderer() {
    return (blockData, context) => {
      const { style = "solid" } = blockData.content || {};
      const styles = this.mergeStyles(this.getDefaultStyle("divider"), blockData.styles || {});
      
      return `<hr style="${this.generateStyleString(styles)} border-style: ${style};" />`;
    };
  }

  createCustomerRenderer() {
    return (blockData, context) => {
      const { name, email, phone, company, address } = blockData.content || {};
      const styles = this.mergeStyles(this.getDefaultStyle("customer"), blockData.styles || {});
      
      let content = `<div style="${this.generateStyleString(styles)}">`;
      content += `<h3 style="margin: 0 0 8px 0; color: #1f2937;">${name || ""}</h3>`;
      if (company) content += `<p style="margin: 0 0 4px 0; color: #6b7280;">${company}</p>`;
      if (email) content += `<p style="margin: 0 0 4px 0; color: #6b7280;">${email}</p>`;
      if (phone) content += `<p style="margin: 0 0 4px 0; color: #6b7280;">${phone}</p>`;
      if (address) content += `<p style="margin: 0; color: #6b7280;">${address}</p>`;
      content += "</div>";
      
      return content;
    };
  }

  createCompanyRenderer() {
    return (blockData, context) => {
      const { name, logo, address, phone, email, website } = blockData.content || {};
      const styles = this.mergeStyles(this.getDefaultStyle("company"), blockData.styles || {});
      
      let content = `<div style="${this.generateStyleString(styles)}">`;
      if (logo) content += `<img src="${logo}" alt="${name}" style="max-width: 100px; margin-bottom: 8px;" />`;
      content += `<h3 style="margin: 0 0 8px 0; color: #1e40af;">${name || ""}</h3>`;
      if (address) content += `<p style="margin: 0 0 4px 0; color: #6b7280;">${address}</p>`;
      if (phone) content += `<p style="margin: 0 0 4px 0; color: #6b7280;">${phone}</p>`;
      if (email) content += `<p style="margin: 0 0 4px 0; color: #6b7280;">${email}</p>`;
      if (website) content += `<p style="margin: 0; color: #6b7280;">${website}</p>`;
      content += "</div>";
      
      return content;
    };
  }

  createPricingRenderer() {
    return (blockData, context) => {
      const { title, items = [], total, currency = "USD" } = blockData.content || {};
      const styles = this.mergeStyles(this.getDefaultStyle("pricing"), blockData.styles || {});
      
      let content = `<div style="${this.generateStyleString(styles)}">`;
      content += `<h3 style="margin: 0 0 16px 0; text-align: center; color: #1f2937;">${title || ""}</h3>`;
      
      if (items.length > 0) {
        content += "<table style='width: 100%; border-collapse: collapse;'>";
        items.forEach(item => {
          content += "<tr>";
          content += `<td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name || ""}</td>`;
          content += `<td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.price || 0} ${currency}</td>`;
          content += "</tr>";
        });
        
        if (total !== undefined) {
          content += "<tr style='font-weight: bold;'>";
          content += `<td style="padding: 8px; border-top: 2px solid #1f2937;">Toplam</td>`;
          content += `<td style="padding: 8px; border-top: 2px solid #1f2937; text-align: right;">${total} ${currency}</td>`;
          content += "</tr>";
        }
        content += "</table>";
      }
      
      content += "</div>";
      return content;
    };
  }

  createSignatureRenderer() {
    return (blockData, context) => {
      const { name, title, signature } = blockData.content || {};
      const styles = this.mergeStyles(this.getDefaultStyle("signature"), blockData.styles || {});
      
      let content = `<div style="${this.generateStyleString(styles)}">`;
      if (signature) content += `<div style="margin-bottom: 8px;">${signature}</div>`;
      content += `<div style="font-weight: bold;">${name || ""}</div>`;
      if (title) content += `<div style="color: #6b7280; font-size: 14px;">${title}</div>`;
      content += "</div>";
      
      return content;
    };
  }

  // Validator factory methods
  createTextValidator() {
    return (blockType, blockData) => {
      const errors = [];
      if (!blockData.content?.content) {
        errors.push("Text content is required");
      }
      return { valid: errors.length === 0, errors };
    };
  }

  createHeadingValidator() {
    return (blockType, blockData) => {
      const errors = [];
      if (!blockData.content?.content) {
        errors.push("Heading content is required");
      }
      if (blockData.content?.level && (blockData.content.level < 1 || blockData.content.level > 6)) {
        errors.push("Heading level must be between 1 and 6");
      }
      return { valid: errors.length === 0, errors };
    };
  }

  createImageValidator() {
    return (blockType, blockData) => {
      const errors = [];
      if (!blockData.content?.src) {
        errors.push("Image source is required");
      }
      return { valid: errors.length === 0, errors };
    };
  }

  createTableValidator() {
    return (blockType, blockData) => {
      const errors = [];
      if (!Array.isArray(blockData.content?.headers)) {
        errors.push("Table headers must be an array");
      }
      if (!Array.isArray(blockData.content?.rows)) {
        errors.push("Table rows must be an array");
      }
      return { valid: errors.length === 0, errors };
    };
  }

  createSpacerValidator() {
    return (blockType, blockData) => {
      const errors = [];
      if (blockData.content?.height && blockData.content.height < 0) {
        errors.push("Spacer height must be non-negative");
      }
      return { valid: errors.length === 0, errors };
    };
  }

  createDividerValidator() {
    return (blockType, blockData) => {
      const errors = [];
      if (blockData.content?.style && !["solid", "dashed", "dotted"].includes(blockData.content.style)) {
        errors.push("Divider style must be solid, dashed, or dotted");
      }
      return { valid: errors.length === 0, errors };
    };
  }

  createCustomerValidator() {
    return (blockType, blockData) => {
      const errors = [];
      if (!blockData.content?.name) {
        errors.push("Customer name is required");
      }
      return { valid: errors.length === 0, errors };
    };
  }

  createCompanyValidator() {
    return (blockType, blockData) => {
      const errors = [];
      if (!blockData.content?.name) {
        errors.push("Company name is required");
      }
      return { valid: errors.length === 0, errors };
    };
  }

  createPricingValidator() {
    return (blockType, blockData) => {
      const errors = [];
      if (!blockData.content?.title) {
        errors.push("Pricing title is required");
      }
      if (!Array.isArray(blockData.content?.items)) {
        errors.push("Pricing items must be an array");
      }
      return { valid: errors.length === 0, errors };
    };
  }

  createSignatureValidator() {
    return (blockType, blockData) => {
      const errors = [];
      if (!blockData.content?.name) {
        errors.push("Signature name is required");
      }
      return { valid: errors.length === 0, errors };
    };
  }

  // Utility methods
  mergeStyles(defaultStyles, customStyles) {
    return { ...defaultStyles, ...customStyles };
  }

  generateStyleString(styles) {
    return Object.entries(styles)
      .map(([key, value]) => `${key}: ${value}`)
      .join("; ");
  }
}

// Singleton instance
const blockRegistry = new BlockRegistry();

module.exports = blockRegistry;
