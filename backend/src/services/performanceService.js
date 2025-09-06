const logger = require("../config/logger");
const mongoose = require("mongoose");

class PerformanceService {
  /**
   * API yanıt süresini ölçer
   * @param {Function} fn - Ölçülecek fonksiyon
   * @param {string} operation - İşlem adı
   */
  static async measureResponseTime(fn, operation) {
    const startTime = process.hrtime.bigint();
    
    try {
      const result = await fn();
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // milisaniye
      
      logger.info(`Performance: ${operation} completed in ${duration.toFixed(2)}ms`);
      
      return {
        result,
        duration,
        success: true
      };
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      logger.error(`Performance: ${operation} failed after ${duration.toFixed(2)}ms - ${error.message}`);
      
      return {
        error,
        duration,
        success: false
      };
    }
  }

  /**
   * Veritabanı performansını analiz eder
   */
  static async analyzeDatabasePerformance() {
    try {
      const stats = await mongoose.connection.db.stats();
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      const analysis = {
        database: {
          name: stats.db,
          collections: stats.collections,
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
          indexes: stats.indexes,
          indexSize: stats.indexSize
        },
        collections: []
      };

      // Her koleksiyon için detaylı analiz
      for (const collection of collections) {
        const collectionStats = await mongoose.connection.db.collection(collection.name).stats();
        const indexes = await mongoose.connection.db.collection(collection.name).indexes();
        
        analysis.collections.push({
          name: collection.name,
          count: collectionStats.count,
          size: collectionStats.size,
          avgObjSize: collectionStats.avgObjSize,
          storageSize: collectionStats.storageSize,
          totalIndexSize: collectionStats.totalIndexSize,
          indexes: indexes.length,
          indexDetails: indexes.map(idx => ({
            name: idx.name,
            key: idx.key,
            size: idx.size || 0
          }))
        });
      }

      return analysis;
    } catch (error) {
      logger.error(`Error analyzing database performance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Yavaş sorguları tespit eder
   * @param {number} threshold - Eşik değeri (milisaniye)
   */
  static async findSlowQueries(threshold = 100) {
    try {
      // MongoDB'de yavaş sorguları bulmak için profiler kullanılabilir
      const profiler = await mongoose.connection.db.collection('system.profile').find({
        ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Son 24 saat
        millis: { $gte: threshold }
      }).sort({ millis: -1 }).limit(100).toArray();

      return profiler.map(query => ({
        timestamp: query.ts,
        duration: query.millis,
        command: query.command,
        namespace: query.ns,
        planSummary: query.planSummary,
        execStats: query.execStats
      }));
    } catch (error) {
      logger.error(`Error finding slow queries: ${error.message}`);
      return [];
    }
  }

  /**
   * Bellek kullanımını analiz eder
   */
  static analyzeMemoryUsage() {
    try {
      const usage = process.memoryUsage();
      const cpus = require('os').cpus();
      
      return {
        memory: {
          rss: usage.rss,
          heapTotal: usage.heapTotal,
          heapUsed: usage.heapUsed,
          external: usage.external,
          arrayBuffers: usage.arrayBuffers
        },
        system: {
          totalMemory: require('os').totalmem(),
          freeMemory: require('os').freemem(),
          cpuCount: cpus.length,
          cpuModel: cpus[0].model,
          uptime: require('os').uptime()
        },
        process: {
          pid: process.pid,
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: process.uptime()
        }
      };
    } catch (error) {
      logger.error(`Error analyzing memory usage: ${error.message}`);
      throw error;
    }
  }

  /**
   * API endpoint performansını test eder
   * @param {string} endpoint - Test edilecek endpoint
   * @param {Object} options - Test seçenekleri
   */
  static async testEndpointPerformance(endpoint, options = {}) {
    try {
      const {
        method = 'GET',
        headers = {},
        body = null,
        iterations = 10,
        concurrency = 1
      } = options;

      const results = [];
      const startTime = Date.now();

      // Eşzamanlı istekler için Promise.all kullan
      const promises = [];
      for (let i = 0; i < concurrency; i++) {
        promises.push(this.runSingleTest(endpoint, method, headers, body, iterations));
      }

      const testResults = await Promise.all(promises);
      const endTime = Date.now();

      // Sonuçları birleştir
      const allResults = testResults.flat();
      
      // İstatistikleri hesapla
      const durations = allResults.map(r => r.duration);
      const successCount = allResults.filter(r => r.success).length;
      const errorCount = allResults.length - successCount;

      const stats = {
        totalRequests: allResults.length,
        successCount,
        errorCount,
        successRate: (successCount / allResults.length) * 100,
        totalDuration: endTime - startTime,
        averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        medianDuration: this.calculateMedian(durations),
        p95Duration: this.calculatePercentile(durations, 95),
        p99Duration: this.calculatePercentile(durations, 99),
        requestsPerSecond: allResults.length / ((endTime - startTime) / 1000)
      };

      return {
        endpoint,
        method,
        stats,
        results: allResults
      };
    } catch (error) {
      logger.error(`Error testing endpoint performance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tek bir test çalıştırır
   */
  static async runSingleTest(endpoint, method, headers, body, iterations) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = process.hrtime.bigint();
      
      try {
        // Burada gerçek HTTP isteği yapılacak
        // Şimdilik mock bir sonuç döndürelim
        const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
        
        results.push({
          iteration: i + 1,
          duration,
          success: true,
          statusCode: 200
        });
      } catch (error) {
        const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
        
        results.push({
          iteration: i + 1,
          duration,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Yük testi çalıştırır
   * @param {Object} config - Test konfigürasyonu
   */
  static async runLoadTest(config) {
    try {
      const {
        endpoints = [],
        duration = 60000, // 1 dakika
        rampUpTime = 10000, // 10 saniye
        maxConcurrency = 10,
        thinkTime = 1000 // 1 saniye
      } = config;

      const startTime = Date.now();
      const results = [];
      let activeUsers = 0;

      // Ramp-up süresince kullanıcı sayısını artır
      const rampUpInterval = setInterval(() => {
        if (activeUsers < maxConcurrency) {
          activeUsers++;
          this.startUserSession(endpoints, thinkTime, results);
        }
      }, rampUpTime / maxConcurrency);

      // Test süresince çalış
      const testInterval = setInterval(() => {
        if (Date.now() - startTime >= duration) {
          clearInterval(rampUpInterval);
          clearInterval(testInterval);
        }
      }, 1000);

      // Test tamamlanana kadar bekle
      await new Promise(resolve => {
        setTimeout(resolve, duration);
      });

      clearInterval(rampUpInterval);
      clearInterval(testInterval);

      // Sonuçları analiz et
      const analysis = this.analyzeLoadTestResults(results);

      return {
        config,
        duration: Date.now() - startTime,
        totalRequests: results.length,
        analysis
      };
    } catch (error) {
      logger.error(`Error running load test: ${error.message}`);
      throw error;
    }
  }

  /**
   * Kullanıcı oturumu başlatır
   */
  static async startUserSession(endpoints, thinkTime, results) {
    try {
      while (true) {
        // Rastgele bir endpoint seç
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        
        // İsteği gönder
        const startTime = process.hrtime.bigint();
        
        try {
          // Mock istek
          const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
          
          results.push({
            endpoint: endpoint.path,
            method: endpoint.method,
            duration,
            success: true,
            timestamp: new Date()
          });
        } catch (error) {
          const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
          
          results.push({
            endpoint: endpoint.path,
            method: endpoint.method,
            duration,
            success: false,
            error: error.message,
            timestamp: new Date()
          });
        }

        // Think time
        await new Promise(resolve => setTimeout(resolve, thinkTime));
      }
    } catch (error) {
      logger.error(`Error in user session: ${error.message}`);
    }
  }

  /**
   * Yük testi sonuçlarını analiz eder
   */
  static analyzeLoadTestResults(results) {
    try {
      const durations = results.map(r => r.duration);
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.length - successCount;

      // Endpoint bazında analiz
      const endpointStats = {};
      results.forEach(result => {
        const key = `${result.method} ${result.endpoint}`;
        if (!endpointStats[key]) {
          endpointStats[key] = {
            requests: 0,
            successes: 0,
            errors: 0,
            durations: []
          };
        }
        
        endpointStats[key].requests++;
        if (result.success) {
          endpointStats[key].successes++;
        } else {
          endpointStats[key].errors++;
        }
        endpointStats[key].durations.push(result.duration);
      });

      // Her endpoint için istatistikleri hesapla
      Object.keys(endpointStats).forEach(key => {
        const stats = endpointStats[key];
        stats.successRate = (stats.successes / stats.requests) * 100;
        stats.averageDuration = stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length;
        stats.minDuration = Math.min(...stats.durations);
        stats.maxDuration = Math.max(...stats.durations);
        stats.medianDuration = this.calculateMedian(stats.durations);
        stats.p95Duration = this.calculatePercentile(stats.durations, 95);
        stats.p99Duration = this.calculatePercentile(stats.durations, 99);
      });

      return {
        overall: {
          totalRequests: results.length,
          successCount,
          errorCount,
          successRate: (successCount / results.length) * 100,
          averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations),
          medianDuration: this.calculateMedian(durations),
          p95Duration: this.calculatePercentile(durations, 95),
          p99Duration: this.calculatePercentile(durations, 99)
        },
        endpoints: endpointStats
      };
    } catch (error) {
      logger.error(`Error analyzing load test results: ${error.message}`);
      throw error;
    }
  }

  /**
   * Medyan hesaplar
   */
  static calculateMedian(numbers) {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  /**
   * Yüzdelik dilim hesaplar
   */
  static calculatePercentile(numbers, percentile) {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Performans raporu oluşturur
   */
  static async generatePerformanceReport() {
    try {
      const report = {
        timestamp: new Date(),
        database: await this.analyzeDatabasePerformance(),
        memory: this.analyzeMemoryUsage(),
        slowQueries: await this.findSlowQueries()
      };

      logger.info('Performance report generated', report);
      return report;
    } catch (error) {
      logger.error(`Error generating performance report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Performans optimizasyon önerileri oluşturur
   */
  static async generateOptimizationRecommendations() {
    try {
      const recommendations = [];
      
      // Veritabanı analizi
      const dbStats = await this.analyzeDatabasePerformance();
      
      // Büyük koleksiyonlar için indeks önerileri
      dbStats.collections.forEach(collection => {
        if (collection.count > 10000 && collection.indexes < 3) {
          recommendations.push({
            type: 'database',
            priority: 'high',
            message: `Collection ${collection.name} has ${collection.count} documents but only ${collection.indexes} indexes. Consider adding more indexes.`,
            collection: collection.name,
            documentCount: collection.count,
            currentIndexes: collection.indexes
          });
        }
      });

      // Yavaş sorgular için öneriler
      const slowQueries = await this.findSlowQueries(100);
      if (slowQueries.length > 0) {
        recommendations.push({
          type: 'query',
          priority: 'high',
          message: `Found ${slowQueries.length} slow queries. Consider optimizing these queries.`,
          slowQueries: slowQueries.slice(0, 5) // İlk 5 yavaş sorgu
        });
      }

      // Bellek kullanımı için öneriler
      const memoryStats = this.analyzeMemoryUsage();
      const memoryUsagePercent = (memoryStats.memory.heapUsed / memoryStats.memory.heapTotal) * 100;
      
      if (memoryUsagePercent > 80) {
        recommendations.push({
          type: 'memory',
          priority: 'medium',
          message: `High memory usage: ${memoryUsagePercent.toFixed(2)}%. Consider optimizing memory usage.`,
          currentUsage: memoryStats.memory.heapUsed,
          totalAvailable: memoryStats.memory.heapTotal,
          usagePercent: memoryUsagePercent
        });
      }

      return recommendations;
    } catch (error) {
      logger.error(`Error generating optimization recommendations: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PerformanceService;
