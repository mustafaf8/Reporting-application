// const Redis = require("ioredis"); // Redis temporarily disabled
const logger = require("../config/logger");

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 saat
    this.redisDisabled = true; // Redis is temporarily disabled
  }

  // Redis bağlantısını başlat - DISABLED
  async initialize() {
    logger.info(
      "Redis is temporarily disabled - caching functionality is not available"
    );
    this.isConnected = false;
    this.redisDisabled = true;
    return;
  }

  // Bağlantı durumunu kontrol et
  isReady() {
    if (this.redisDisabled) {
      return false;
    }
    return this.isConnected && this.redis;
  }

  // Cache anahtarı oluşturma
  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.join(":")}`;
  }

  // Veri kaydetme
  async set(key, value, ttl = this.defaultTTL) {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache set", { key });
      return false;
    }

    if (!this.isReady()) {
      logger.warn("Redis not available, skipping cache set", { key });
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);

      logger.debug("Cache set successful", { key, ttl });
      return true;
    } catch (error) {
      logger.error("Cache set error", { key, error: error.message });
      return false;
    }
  }

  // Veri alma
  async get(key) {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache get", { key });
      return null;
    }

    if (!this.isReady()) {
      logger.warn("Redis not available, skipping cache get", { key });
      return null;
    }

    try {
      const value = await this.redis.get(key);

      if (value === null) {
        logger.debug("Cache miss", { key });
        return null;
      }

      const parsedValue = JSON.parse(value);
      logger.debug("Cache hit", { key });
      return parsedValue;
    } catch (error) {
      logger.error("Cache get error", { key, error: error.message });
      return null;
    }
  }

  // Veri silme
  async del(key) {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache delete", { key });
      return false;
    }

    if (!this.isReady()) {
      logger.warn("Redis not available, skipping cache delete", { key });
      return false;
    }

    try {
      const result = await this.redis.del(key);
      logger.debug("Cache delete successful", { key, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      logger.error("Cache delete error", { key, error: error.message });
      return false;
    }
  }

  // Çoklu veri silme
  async delPattern(pattern) {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache pattern delete", {
        pattern,
      });
      return false;
    }

    if (!this.isReady()) {
      logger.warn("Redis not available, skipping cache pattern delete", {
        pattern,
      });
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug("Cache pattern delete successful", {
          pattern,
          deletedCount: keys.length,
        });
        return true;
      }
      return false;
    } catch (error) {
      logger.error("Cache pattern delete error", {
        pattern,
        error: error.message,
      });
      return false;
    }
  }

  // TTL ayarlama
  async expire(key, ttl) {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache expire", { key, ttl });
      return false;
    }

    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.redis.expire(key, ttl);
      logger.debug("Cache expire set", { key, ttl, success: result === 1 });
      return result === 1;
    } catch (error) {
      logger.error("Cache expire error", { key, ttl, error: error.message });
      return false;
    }
  }

  // TTL sorgulama
  async ttl(key) {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache TTL", { key });
      return -1;
    }

    if (!this.isReady()) {
      return -1;
    }

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error("Cache TTL error", { key, error: error.message });
      return -1;
    }
  }

  // Hash işlemleri
  async hset(key, field, value) {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache hash set", { key, field });
      return false;
    }

    if (!this.isReady()) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.hset(key, field, serializedValue);
      logger.debug("Cache hash set successful", { key, field });
      return true;
    } catch (error) {
      logger.error("Cache hash set error", {
        key,
        field,
        error: error.message,
      });
      return false;
    }
  }

  async hget(key, field) {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache hash get", { key, field });
      return null;
    }

    if (!this.isReady()) {
      return null;
    }

    try {
      const value = await this.redis.hget(key, field);
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      logger.error("Cache hash get error", {
        key,
        field,
        error: error.message,
      });
      return null;
    }
  }

  async hdel(key, field) {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache hash delete", {
        key,
        field,
      });
      return false;
    }

    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.redis.hdel(key, field);
      logger.debug("Cache hash delete successful", {
        key,
        field,
        deleted: result > 0,
      });
      return result > 0;
    } catch (error) {
      logger.error("Cache hash delete error", {
        key,
        field,
        error: error.message,
      });
      return false;
    }
  }

  // List işlemleri
  async lpush(key, ...values) {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache list push", {
        key,
        count: values.length,
      });
      return false;
    }

    if (!this.isReady()) {
      return false;
    }

    try {
      const serializedValues = values.map((v) => JSON.stringify(v));
      const result = await this.redis.lpush(key, ...serializedValues);
      logger.debug("Cache list push successful", { key, count: values.length });
      return result;
    } catch (error) {
      logger.error("Cache list push error", { key, error: error.message });
      return false;
    }
  }

  async lrange(key, start, stop) {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache list range", {
        key,
        start,
        stop,
      });
      return [];
    }

    if (!this.isReady()) {
      return [];
    }

    try {
      const values = await this.redis.lrange(key, start, stop);
      return values.map((v) => JSON.parse(v));
    } catch (error) {
      logger.error("Cache list range error", {
        key,
        start,
        stop,
        error: error.message,
      });
      return [];
    }
  }

  // Set işlemleri
  async sadd(key, ...members) {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache set add", {
        key,
        count: members.length,
      });
      return false;
    }

    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.redis.sadd(key, ...members);
      logger.debug("Cache set add successful", { key, count: members.length });
      return result;
    } catch (error) {
      logger.error("Cache set add error", { key, error: error.message });
      return false;
    }
  }

  async smembers(key) {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache set members", { key });
      return [];
    }

    if (!this.isReady()) {
      return [];
    }

    try {
      return await this.redis.smembers(key);
    } catch (error) {
      logger.error("Cache set members error", { key, error: error.message });
      return [];
    }
  }

  // Blok editörü için özel cache metodları

  // Template cache
  async cacheTemplate(templateId, template) {
    const key = this.generateKey("template", templateId);
    return await this.set(key, template, 1800); // 30 dakika
  }

  async getCachedTemplate(templateId) {
    const key = this.generateKey("template", templateId);
    return await this.get(key);
  }

  async invalidateTemplate(templateId) {
    const key = this.generateKey("template", templateId);
    return await this.del(key);
  }

  // Template listesi cache
  async cacheTemplateList(userId, query, templates) {
    const key = this.generateKey(
      "template_list",
      userId,
      JSON.stringify(query)
    );
    return await this.set(key, templates, 600); // 10 dakika
  }

  async getCachedTemplateList(userId, query) {
    const key = this.generateKey(
      "template_list",
      userId,
      JSON.stringify(query)
    );
    return await this.get(key);
  }

  async invalidateTemplateList(userId) {
    const pattern = this.generateKey("template_list", userId, "*");
    return await this.delPattern(pattern);
  }

  // Preview cache
  async cachePreview(templateId, data, html) {
    const key = this.generateKey("preview", templateId, JSON.stringify(data));
    return await this.set(key, html, 300); // 5 dakika
  }

  async getCachedPreview(templateId, data) {
    const key = this.generateKey("preview", templateId, JSON.stringify(data));
    return await this.get(key);
  }

  async invalidatePreview(templateId) {
    const pattern = this.generateKey("preview", templateId, "*");
    return await this.delPattern(pattern);
  }

  // Asset cache
  async cacheAsset(assetId, asset) {
    const key = this.generateKey("asset", assetId);
    return await this.set(key, asset, 3600); // 1 saat
  }

  async getCachedAsset(assetId) {
    const key = this.generateKey("asset", assetId);
    return await this.get(key);
  }

  async invalidateAsset(assetId) {
    const key = this.generateKey("asset", assetId);
    return await this.del(key);
  }

  // User session cache
  async cacheUserSession(userId, sessionData) {
    const key = this.generateKey("user_session", userId);
    return await this.set(key, sessionData, 1800); // 30 dakika
  }

  async getCachedUserSession(userId) {
    const key = this.generateKey("user_session", userId);
    return await this.get(key);
  }

  async invalidateUserSession(userId) {
    const key = this.generateKey("user_session", userId);
    return await this.del(key);
  }

  // WebSocket room cache
  async cacheWebSocketRoom(templateId, users) {
    const key = this.generateKey("ws_room", templateId);
    return await this.set(key, users, 300); // 5 dakika
  }

  async getCachedWebSocketRoom(templateId) {
    const key = this.generateKey("ws_room", templateId);
    return await this.get(key);
  }

  async invalidateWebSocketRoom(templateId) {
    const key = this.generateKey("ws_room", templateId);
    return await this.del(key);
  }

  // Cache istatistikleri
  async getStats() {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, returning disabled stats");
      return {
        connected: false,
        disabled: true,
        message: "Redis is temporarily disabled",
      };
    }

    if (!this.isReady()) {
      return null;
    }

    try {
      const info = await this.redis.info("memory");
      const keyspace = await this.redis.info("keyspace");

      return {
        connected: this.isConnected,
        memory: info,
        keyspace: keyspace,
      };
    } catch (error) {
      logger.error("Cache stats error", { error: error.message });
      return null;
    }
  }

  // Cache temizleme
  async flushAll() {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, skipping cache flush");
      return false;
    }

    if (!this.isReady()) {
      return false;
    }

    try {
      await this.redis.flushall();
      logger.info("Cache flushed successfully");
      return true;
    } catch (error) {
      logger.error("Cache flush error", { error: error.message });
      return false;
    }
  }

  // Bağlantıyı kapat
  async close() {
    if (this.redisDisabled) {
      logger.debug("Redis disabled, no connection to close");
      return;
    }

    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      logger.info("Redis connection closed");
    }
  }
}

module.exports = new CacheService();
