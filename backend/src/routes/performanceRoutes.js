const express = require("express");
const router = express.Router();
const PerformanceService = require("../services/performanceService");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const logger = require("../config/logger");

// Tüm route'lar için auth middleware
router.use(auth);

/**
 * @route GET /api/performance/database
 * @desc Veritabanı performansını analiz eder
 * @access Private (Admin only)
 */
router.get("/database", admin, async (req, res) => {
  try {
    const analysis = await PerformanceService.analyzeDatabasePerformance();
    
    res.json({
      success: true,
      message: "Veritabanı performans analizi tamamlandı",
      analysis
    });
  } catch (error) {
    logger.error(`Error analyzing database performance: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Veritabanı performans analizi yapılırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/performance/memory
 * @desc Bellek kullanımını analiz eder
 * @access Private (Admin only)
 */
router.get("/memory", admin, async (req, res) => {
  try {
    const analysis = PerformanceService.analyzeMemoryUsage();
    
    res.json({
      success: true,
      message: "Bellek kullanım analizi tamamlandı",
      analysis
    });
  } catch (error) {
    logger.error(`Error analyzing memory usage: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Bellek kullanım analizi yapılırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/performance/slow-queries
 * @desc Yavaş sorguları tespit eder
 * @access Private (Admin only)
 */
router.get("/slow-queries", admin, async (req, res) => {
  try {
    const { threshold = 100 } = req.query;
    const slowQueries = await PerformanceService.findSlowQueries(parseInt(threshold));
    
    res.json({
      success: true,
      message: "Yavaş sorgular tespit edildi",
      slowQueries,
      count: slowQueries.length,
      threshold: parseInt(threshold)
    });
  } catch (error) {
    logger.error(`Error finding slow queries: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Yavaş sorgular tespit edilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/performance/test-endpoint
 * @desc API endpoint performansını test eder
 * @access Private (Admin only)
 */
router.post("/test-endpoint", admin, async (req, res) => {
  try {
    const { endpoint, options = {} } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: "endpoint gerekli"
      });
    }

    const result = await PerformanceService.testEndpointPerformance(endpoint, options);
    
    res.json({
      success: true,
      message: "Endpoint performans testi tamamlandı",
      result
    });
  } catch (error) {
    logger.error(`Error testing endpoint performance: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Endpoint performans testi yapılırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/performance/load-test
 * @desc Yük testi çalıştırır
 * @access Private (Admin only)
 */
router.post("/load-test", admin, async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        message: "config gerekli"
      });
    }

    const result = await PerformanceService.runLoadTest(config);
    
    res.json({
      success: true,
      message: "Yük testi tamamlandı",
      result
    });
  } catch (error) {
    logger.error(`Error running load test: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Yük testi çalıştırılırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/performance/report
 * @desc Performans raporu oluşturur
 * @access Private (Admin only)
 */
router.get("/report", admin, async (req, res) => {
  try {
    const report = await PerformanceService.generatePerformanceReport();
    
    res.json({
      success: true,
      message: "Performans raporu oluşturuldu",
      report
    });
  } catch (error) {
    logger.error(`Error generating performance report: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Performans raporu oluşturulurken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/performance/recommendations
 * @desc Performans optimizasyon önerileri oluşturur
 * @access Private (Admin only)
 */
router.get("/recommendations", admin, async (req, res) => {
  try {
    const recommendations = await PerformanceService.generateOptimizationRecommendations();
    
    res.json({
      success: true,
      message: "Optimizasyon önerileri oluşturuldu",
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    logger.error(`Error generating optimization recommendations: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Optimizasyon önerileri oluşturulurken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/performance/measure
 * @desc Belirli bir işlemin performansını ölçer
 * @access Private
 */
router.post("/measure", async (req, res) => {
  try {
    const { operation, fn } = req.body;

    if (!operation || !fn) {
      return res.status(400).json({
        success: false,
        message: "operation ve fn gerekli"
      });
    }

    // Güvenlik için sadece belirli fonksiyonlara izin ver
    const allowedOperations = [
      'template-render',
      'pdf-generate',
      'data-process',
      'cache-operation'
    ];

    if (!allowedOperations.includes(operation)) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz işlem türü"
      });
    }

    const result = await PerformanceService.measureResponseTime(fn, operation);
    
    res.json({
      success: true,
      message: "Performans ölçümü tamamlandı",
      operation,
      result
    });
  } catch (error) {
    logger.error(`Error measuring performance: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Performans ölçümü yapılırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/performance/health
 * @desc Sistem sağlık durumunu kontrol eder
 * @access Private
 */
router.get("/health", async (req, res) => {
  try {
    const memoryStats = PerformanceService.analyzeMemoryUsage();
    const dbStats = await PerformanceService.analyzeDatabasePerformance();
    
    // Sağlık durumu hesapla
    const memoryUsagePercent = (memoryStats.memory.heapUsed / memoryStats.memory.heapTotal) * 100;
    const isHealthy = memoryUsagePercent < 90 && dbStats.database.collections > 0;
    
    const health = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      checks: {
        memory: {
          status: memoryUsagePercent < 90 ? 'ok' : 'warning',
          usage: memoryUsagePercent,
          threshold: 90
        },
        database: {
          status: dbStats.database.collections > 0 ? 'ok' : 'error',
          collections: dbStats.database.collections,
          dataSize: dbStats.database.dataSize
        }
      },
      metrics: {
        memory: memoryStats.memory,
        database: {
          collections: dbStats.database.collections,
          dataSize: dbStats.database.dataSize,
          storageSize: dbStats.database.storageSize
        }
      }
    };
    
    res.json({
      success: true,
      message: "Sistem sağlık durumu kontrol edildi",
      health
    });
  } catch (error) {
    logger.error(`Error checking system health: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Sistem sağlık durumu kontrol edilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/performance/metrics
 * @desc Performans metriklerini getirir
 * @access Private
 */
router.get("/metrics", async (req, res) => {
  try {
    const memoryStats = PerformanceService.analyzeMemoryUsage();
    const dbStats = await PerformanceService.analyzeDatabasePerformance();
    
    const metrics = {
      timestamp: new Date(),
      memory: {
        used: memoryStats.memory.heapUsed,
        total: memoryStats.memory.heapTotal,
        usagePercent: (memoryStats.memory.heapUsed / memoryStats.memory.heapTotal) * 100,
        external: memoryStats.memory.external,
        arrayBuffers: memoryStats.memory.arrayBuffers
      },
      database: {
        collections: dbStats.database.collections,
        dataSize: dbStats.database.dataSize,
        storageSize: dbStats.database.storageSize,
        indexes: dbStats.database.indexes,
        indexSize: dbStats.database.indexSize
      },
      system: {
        uptime: memoryStats.system.uptime,
        cpuCount: memoryStats.system.cpuCount,
        totalMemory: memoryStats.system.totalMemory,
        freeMemory: memoryStats.system.freeMemory
      },
      process: {
        uptime: memoryStats.process.uptime,
        pid: memoryStats.process.pid,
        version: memoryStats.process.version
      }
    };
    
    res.json({
      success: true,
      message: "Performans metrikleri getirildi",
      metrics
    });
  } catch (error) {
    logger.error(`Error getting performance metrics: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Performans metrikleri getirilirken hata oluştu",
      error: error.message
    });
  }
});

module.exports = router;
