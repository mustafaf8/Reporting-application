const express = require("express");
const router = express.Router();
const DynamicDataService = require("../services/dynamicDataService");
const auth = require("../middleware/auth");
const logger = require("../config/logger");

// Tüm route'lar için auth middleware
router.use(auth);

/**
 * @route POST /api/dynamic-data/templates/:templateId/populate
 * @desc Şablon içindeki yer tutucuları gerçek verilerle doldurur
 * @access Private
 */
router.post("/templates/:templateId/populate", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { data, options = {} } = req.body;
    const userId = req.user.id;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "data gerekli"
      });
    }

    // Kullanıcı ID'sini veriye ekle
    data.userId = userId;

    const populatedTemplate = await DynamicDataService.populateTemplate(templateId, data, options);
    
    res.json({
      success: true,
      message: "Template başarıyla dolduruldu",
      template: populatedTemplate
    });
  } catch (error) {
    logger.error(`Error populating template: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Template doldurulurken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/dynamic-data/templates/:templateId/preview
 * @desc Şablon önizlemesi oluşturur
 * @access Private
 */
router.post("/templates/:templateId/preview", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { data, options = {} } = req.body;
    const userId = req.user.id;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "data gerekli"
      });
    }

    // Kullanıcı ID'sini veriye ekle
    data.userId = userId;

    const preview = await DynamicDataService.generatePreview(templateId, data, options);
    
    res.json({
      success: true,
      message: "Preview başarıyla oluşturuldu",
      preview
    });
  } catch (error) {
    logger.error(`Error generating preview: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Preview oluşturulurken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/dynamic-data/templates/:templateId/placeholders
 * @desc Şablon içindeki yer tutucuları getirir
 * @access Private
 */
router.get("/templates/:templateId/placeholders", async (req, res) => {
  try {
    const { templateId } = req.params;

    const placeholders = await DynamicDataService.getPlaceholders(templateId);
    
    res.json({
      success: true,
      placeholders
    });
  } catch (error) {
    logger.error(`Error getting placeholders: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Yer tutucular getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/dynamic-data/process-content
 * @desc İçeriği işler ve yer tutucuları doldurur
 * @access Private
 */
router.post("/process-content", async (req, res) => {
  try {
    const { content, data, options = {} } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "content gerekli"
      });
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "data gerekli"
      });
    }

    // Kullanıcı ID'sini veriye ekle
    data.userId = userId;

    const processedContent = DynamicDataService.processContent(content, data, options);
    
    res.json({
      success: true,
      message: "İçerik başarıyla işlendi",
      processedContent
    });
  } catch (error) {
    logger.error(`Error processing content: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "İçerik işlenirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/dynamic-data/process-styles
 * @desc Stilleri işler ve yer tutucuları doldurur
 * @access Private
 */
router.post("/process-styles", async (req, res) => {
  try {
    const { styles, data, options = {} } = req.body;
    const userId = req.user.id;

    if (!styles) {
      return res.status(400).json({
        success: false,
        message: "styles gerekli"
      });
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "data gerekli"
      });
    }

    // Kullanıcı ID'sini veriye ekle
    data.userId = userId;

    const processedStyles = DynamicDataService.processStyles(styles, data, options);
    
    res.json({
      success: true,
      message: "Stiller başarıyla işlendi",
      processedStyles
    });
  } catch (error) {
    logger.error(`Error processing styles: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Stiller işlenirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/dynamic-data/process-ejs
 * @desc EJS şablonunu işler
 * @access Private
 */
router.post("/process-ejs", async (req, res) => {
  try {
    const { ejsContent, data, options = {} } = req.body;
    const userId = req.user.id;

    if (!ejsContent) {
      return res.status(400).json({
        success: false,
        message: "ejsContent gerekli"
      });
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "data gerekli"
      });
    }

    // Kullanıcı ID'sini veriye ekle
    data.userId = userId;

    const processedEJS = await DynamicDataService.processEJSTemplate(ejsContent, data, options);
    
    res.json({
      success: true,
      message: "EJS şablonu başarıyla işlendi",
      processedEJS
    });
  } catch (error) {
    logger.error(`Error processing EJS: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "EJS şablonu işlenirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/dynamic-data/user-data/:userId
 * @desc Kullanıcı verilerini getirir
 * @access Private
 */
router.get("/user-data/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Kullanıcı kendi verilerini veya admin olmalı
    if (userId !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Bu kullanıcının verilerine erişim izniniz yok"
      });
    }

    const userData = await DynamicDataService.getUserData(userId);
    
    res.json({
      success: true,
      userData
    });
  } catch (error) {
    logger.error(`Error getting user data: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Kullanıcı verileri getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/dynamic-data/company-data/:companyId
 * @desc Şirket verilerini getirir
 * @access Private
 */
router.get("/company-data/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;

    const companyData = await DynamicDataService.getCompanyData(companyId);
    
    res.json({
      success: true,
      companyData
    });
  } catch (error) {
    logger.error(`Error getting company data: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Şirket verileri getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/dynamic-data/customer-data/:customerId
 * @desc Müşteri verilerini getirir
 * @access Private
 */
router.get("/customer-data/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const customerData = await DynamicDataService.getCustomerData(customerId);
    
    res.json({
      success: true,
      customerData
    });
  } catch (error) {
    logger.error(`Error getting customer data: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Müşteri verileri getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/dynamic-data/products-data
 * @desc Ürün verilerini getirir
 * @access Private
 */
router.post("/products-data", async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: "productIds array gerekli"
      });
    }

    const productsData = await DynamicDataService.getProductsData(productIds);
    
    res.json({
      success: true,
      productsData
    });
  } catch (error) {
    logger.error(`Error getting products data: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Ürün verileri getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/dynamic-data/date-data
 * @desc Tarih ve saat verilerini getirir
 * @access Private
 */
router.get("/date-data", async (req, res) => {
  try {
    const dateData = DynamicDataService.getDateData();
    
    res.json({
      success: true,
      dateData
    });
  } catch (error) {
    logger.error(`Error getting date data: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Tarih verileri getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/dynamic-data/system-data
 * @desc Sistem verilerini getirir
 * @access Private
 */
router.get("/system-data", async (req, res) => {
  try {
    const systemData = DynamicDataService.getSystemData();
    
    res.json({
      success: true,
      systemData
    });
  } catch (error) {
    logger.error(`Error getting system data: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Sistem verileri getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/dynamic-data/merge-data-sources
 * @desc Farklı veri kaynaklarını birleştirir
 * @access Private
 */
router.post("/merge-data-sources", async (req, res) => {
  try {
    const { data, options = {} } = req.body;
    const userId = req.user.id;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "data gerekli"
      });
    }

    // Kullanıcı ID'sini veriye ekle
    data.userId = userId;

    const mergedData = await DynamicDataService.mergeDataSources(data, options);
    
    res.json({
      success: true,
      message: "Veri kaynakları başarıyla birleştirildi",
      mergedData
    });
  } catch (error) {
    logger.error(`Error merging data sources: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Veri kaynakları birleştirilirken hata oluştu",
      error: error.message
    });
  }
});

module.exports = router;
