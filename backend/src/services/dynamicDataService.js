const Template = require("../models/Template");
const Proposal = require("../models/Proposal");
const User = require("../models/User");
const Product = require("../models/Product");
const logger = require("../config/logger");

class DynamicDataService {
  /**
   * Şablon içindeki yer tutucuları gerçek verilerle doldurur
   * @param {string} templateId - Şablon ID'si
   * @param {Object} data - Doldurulacak veriler
   * @param {Object} options - Seçenekler
   */
  static async populateTemplate(templateId, data, options = {}) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      // Veri kaynaklarını birleştir
      const mergedData = await this.mergeDataSources(data, options);
      
      // Şablon içeriğini işle
      const populatedTemplate = await this.processTemplateContent(template, mergedData, options);
      
      logger.info(`Template ${templateId} populated with dynamic data`);
      return populatedTemplate;
    } catch (error) {
      logger.error(`Error populating template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Farklı veri kaynaklarını birleştirir
   * @param {Object} data - Ana veri
   * @param {Object} options - Seçenekler
   */
  static async mergeDataSources(data, options = {}) {
    try {
      const mergedData = { ...data };
      
      // Kullanıcı verilerini ekle
      if (data.userId) {
        const userData = await this.getUserData(data.userId);
        mergedData.user = userData;
      }
      
      // Şirket verilerini ekle
      if (data.companyId) {
        const companyData = await this.getCompanyData(data.companyId);
        mergedData.company = companyData;
      }
      
      // Müşteri verilerini ekle
      if (data.customerId) {
        const customerData = await this.getCustomerData(data.customerId);
        mergedData.customer = customerData;
      }
      
      // Ürün verilerini ekle
      if (data.productIds && Array.isArray(data.productIds)) {
        const productsData = await this.getProductsData(data.productIds);
        mergedData.products = productsData;
      }
      
      // Tarih ve saat verilerini ekle
      mergedData.date = this.getDateData();
      
      // Sistem verilerini ekle
      mergedData.system = this.getSystemData();
      
      return mergedData;
    } catch (error) {
      logger.error(`Error merging data sources: ${error.message}`);
      throw error;
    }
  }

  /**
   * Şablon içeriğini işler ve yer tutucuları doldurur
   * @param {Object} template - Şablon objesi
   * @param {Object} data - Doldurulacak veriler
   * @param {Object} options - Seçenekler
   */
  static async processTemplateContent(template, data, options = {}) {
    try {
      const processedTemplate = template.toObject();
      
      // Blokları işle
      if (processedTemplate.blocks) {
        processedTemplate.blocks = processedTemplate.blocks.map(block => 
          this.processBlock(block, data, options)
        );
      }
      
      // EJS dosyasını işle (eski sistem uyumluluğu)
      if (processedTemplate.ejsFile) {
        processedTemplate.processedEjs = await this.processEJSTemplate(
          processedTemplate.ejsFile, 
          data, 
          options
        );
      }
      
      // Global stilleri işle
      if (processedTemplate.globalStyles) {
        processedTemplate.globalStyles = this.processStyles(
          processedTemplate.globalStyles, 
          data, 
          options
        );
      }
      
      return processedTemplate;
    } catch (error) {
      logger.error(`Error processing template content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Blok içeriğini işler
   * @param {Object} block - Blok objesi
   * @param {Object} data - Doldurulacak veriler
   * @param {Object} options - Seçenekler
   */
  static processBlock(block, data, options = {}) {
    try {
      const processedBlock = { ...block };
      
      // İçeriği işle
      if (processedBlock.content) {
        processedBlock.content = this.processContent(processedBlock.content, data, options);
      }
      
      // Stilleri işle
      if (processedBlock.styles) {
        processedBlock.styles = this.processStyles(processedBlock.styles, data, options);
      }
      
      // Metadataları işle
      if (processedBlock.metadata) {
        processedBlock.metadata = this.processContent(processedBlock.metadata, data, options);
      }
      
      return processedBlock;
    } catch (error) {
      logger.error(`Error processing block: ${error.message}`);
      return block;
    }
  }

  /**
   * İçeriği işler ve yer tutucuları doldurur
   * @param {Object} content - İçerik objesi
   * @param {Object} data - Doldurulacak veriler
   * @param {Object} options - Seçenekler
   */
  static processContent(content, data, options = {}) {
    try {
      if (typeof content === 'string') {
        return this.replacePlaceholders(content, data, options);
      }
      
      if (typeof content === 'object' && content !== null) {
        const processedContent = {};
        
        for (const [key, value] of Object.entries(content)) {
          processedContent[key] = this.processContent(value, data, options);
        }
        
        return processedContent;
      }
      
      return content;
    } catch (error) {
      logger.error(`Error processing content: ${error.message}`);
      return content;
    }
  }

  /**
   * Stilleri işler ve yer tutucuları doldurur
   * @param {Object} styles - Stil objesi
   * @param {Object} data - Doldurulacak veriler
   * @param {Object} options - Seçenekler
   */
  static processStyles(styles, data, options = {}) {
    try {
      if (typeof styles === 'string') {
        return this.replacePlaceholders(styles, data, options);
      }
      
      if (typeof styles === 'object' && styles !== null) {
        const processedStyles = {};
        
        for (const [key, value] of Object.entries(styles)) {
          processedStyles[key] = this.processStyles(value, data, options);
        }
        
        return processedStyles;
      }
      
      return styles;
    } catch (error) {
      logger.error(`Error processing styles: ${error.message}`);
      return styles;
    }
  }

  /**
   * Yer tutucuları gerçek verilerle değiştirir
   * @param {string} text - İşlenecek metin
   * @param {Object} data - Doldurulacak veriler
   * @param {Object} options - Seçenekler
   */
  static replacePlaceholders(text, data, options = {}) {
    try {
      if (typeof text !== 'string') {
        return text;
      }
      
      // {{variable}} formatındaki yer tutucuları bul ve değiştir
      return text.replace(/\{\{([^}]+)\}\}/g, (match, placeholder) => {
        const value = this.getNestedValue(data, placeholder.trim());
        return value !== undefined ? value : match;
      });
    } catch (error) {
      logger.error(`Error replacing placeholders: ${error.message}`);
      return text;
    }
  }

  /**
   * İç içe geçmiş objelerden değer alır
   * @param {Object} obj - Obje
   * @param {string} path - Yol (örn: "user.name")
   */
  static getNestedValue(obj, path) {
    try {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, obj);
    } catch (error) {
      logger.error(`Error getting nested value: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Kullanıcı verilerini getirir
   * @param {string} userId - Kullanıcı ID'si
   */
  static async getUserData(userId) {
    try {
      const user = await User.findById(userId)
        .select('name email phone company position department address bio profileImageUrl');
      
      if (!user) {
        return {};
      }
      
      return {
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company,
        position: user.position,
        department: user.department,
        address: user.address,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl
      };
    } catch (error) {
      logger.error(`Error getting user data: ${error.message}`);
      return {};
    }
  }

  /**
   * Şirket verilerini getirir
   * @param {string} companyId - Şirket ID'si
   */
  static async getCompanyData(companyId) {
    try {
      // Burada şirket verilerini getiren kod olacak
      // Şimdilik örnek veri döndürelim
      return {
        name: "Örnek Şirket",
        address: "Örnek Adres",
        phone: "+90 212 123 45 67",
        email: "info@ornek.com",
        website: "www.ornek.com",
        logo: "https://example.com/logo.png"
      };
    } catch (error) {
      logger.error(`Error getting company data: ${error.message}`);
      return {};
    }
  }

  /**
   * Müşteri verilerini getirir
   * @param {string} customerId - Müşteri ID'si
   */
  static async getCustomerData(customerId) {
    try {
      // Burada müşteri verilerini getiren kod olacak
      // Şimdilik örnek veri döndürelim
      return {
        name: "Müşteri Adı",
        email: "musteri@example.com",
        phone: "+90 555 123 45 67",
        company: "Müşteri Şirketi",
        address: "Müşteri Adresi"
      };
    } catch (error) {
      logger.error(`Error getting customer data: ${error.message}`);
      return {};
    }
  }

  /**
   * Ürün verilerini getirir
   * @param {Array} productIds - Ürün ID'leri
   */
  static async getProductsData(productIds) {
    try {
      const products = await Product.find({ _id: { $in: productIds } })
        .select('name description unitPrice unit category');
      
      return products.map(product => ({
        name: product.name,
        description: product.description,
        unitPrice: product.unitPrice,
        unit: product.unit,
        category: product.category
      }));
    } catch (error) {
      logger.error(`Error getting products data: ${error.message}`);
      return [];
    }
  }

  /**
   * Tarih ve saat verilerini getirir
   */
  static getDateData() {
    const now = new Date();
    return {
      current: now.toISOString(),
      formatted: now.toLocaleDateString('tr-TR'),
      time: now.toLocaleTimeString('tr-TR'),
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      weekday: now.toLocaleDateString('tr-TR', { weekday: 'long' }),
      monthName: now.toLocaleDateString('tr-TR', { month: 'long' })
    };
  }

  /**
   * Sistem verilerini getirir
   */
  static getSystemData() {
    return {
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString()
    };
  }

  /**
   * EJS şablonunu işler
   * @param {string} ejsContent - EJS içeriği
   * @param {Object} data - Doldurulacak veriler
   * @param {Object} options - Seçenekler
   */
  static async processEJSTemplate(ejsContent, data, options = {}) {
    try {
      const ejs = require('ejs');
      
      // EJS seçeneklerini ayarla
      const ejsOptions = {
        ...options.ejsOptions,
        async: true
      };
      
      // EJS şablonunu işle
      const processedContent = await ejs.render(ejsContent, data, ejsOptions);
      
      return processedContent;
    } catch (error) {
      logger.error(`Error processing EJS template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Şablon önizlemesi oluşturur
   * @param {string} templateId - Şablon ID'si
   * @param {Object} data - Doldurulacak veriler
   * @param {Object} options - Seçenekler
   */
  static async generatePreview(templateId, data, options = {}) {
    try {
      const populatedTemplate = await this.populateTemplate(templateId, data, options);
      
      // HTML önizlemesi oluştur
      const preview = await this.generateHTMLPreview(populatedTemplate, options);
      
      return {
        template: populatedTemplate,
        preview: preview,
        metadata: {
          generatedAt: new Date(),
          templateId,
          dataKeys: Object.keys(data)
        }
      };
    } catch (error) {
      logger.error(`Error generating preview: ${error.message}`);
      throw error;
    }
  }

  /**
   * HTML önizlemesi oluşturur
   * @param {Object} template - Doldurulmuş şablon
   * @param {Object} options - Seçenekler
   */
  static async generateHTMLPreview(template, options = {}) {
    try {
      // Burada HTML önizlemesi oluşturan kod olacak
      // Şimdilik temel bir HTML yapısı döndürelim
      let html = '<!DOCTYPE html><html><head><title>Template Preview</title></head><body>';
      
      if (template.blocks) {
        template.blocks.forEach(block => {
          html += `<div class="block block-${block.type}">`;
          html += `<h3>${block.type}</h3>`;
          html += `<pre>${JSON.stringify(block.content, null, 2)}</pre>`;
          html += '</div>';
        });
      }
      
      html += '</body></html>';
      
      return html;
    } catch (error) {
      logger.error(`Error generating HTML preview: ${error.message}`);
      throw error;
    }
  }

  /**
   * Yer tutucu listesini getirir
   * @param {string} templateId - Şablon ID'si
   */
  static async getPlaceholders(templateId) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error("Template not found");
      }
      
      const placeholders = new Set();
      
      // Bloklardaki yer tutucuları bul
      if (template.blocks) {
        template.blocks.forEach(block => {
          this.findPlaceholdersInObject(block, placeholders);
        });
      }
      
      // EJS dosyasındaki yer tutucuları bul
      if (template.ejsFile) {
        this.findPlaceholdersInText(template.ejsFile, placeholders);
      }
      
      return Array.from(placeholders).sort();
    } catch (error) {
      logger.error(`Error getting placeholders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Objede yer tutucuları bulur
   * @param {Object} obj - Obje
   * @param {Set} placeholders - Yer tutucu seti
   */
  static findPlaceholdersInObject(obj, placeholders) {
    if (typeof obj === 'string') {
      this.findPlaceholdersInText(obj, placeholders);
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(value => {
        this.findPlaceholdersInObject(value, placeholders);
      });
    }
  }

  /**
   * Metinde yer tutucuları bulur
   * @param {string} text - Metin
   * @param {Set} placeholders - Yer tutucu seti
   */
  static findPlaceholdersInText(text, placeholders) {
    if (typeof text !== 'string') return;
    
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    if (matches) {
      matches.forEach(match => {
        const placeholder = match.replace(/\{\{|\}\}/g, '').trim();
        placeholders.add(placeholder);
      });
    }
  }
}

module.exports = DynamicDataService;
