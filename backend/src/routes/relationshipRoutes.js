const express = require("express");
const router = express.Router();
const RelationshipService = require("../services/relationshipService");
const auth = require("../middleware/auth");
const logger = require("../config/logger");

// Tüm route'lar için auth middleware
router.use(auth);

/**
 * @route POST /api/relationships
 * @desc İki varlık arasında ilişki oluşturur
 * @access Private
 */
router.post("/", async (req, res) => {
  try {
    const { fromType, fromId, toType, toId, relationshipType, options = {} } = req.body;

    if (!fromType || !fromId || !toType || !toId || !relationshipType) {
      return res.status(400).json({
        success: false,
        message: "fromType, fromId, toType, toId ve relationshipType gerekli"
      });
    }

    const result = await RelationshipService.createRelationship(
      fromType,
      fromId,
      toType,
      toId,
      relationshipType,
      options
    );

    res.status(201).json(result);
  } catch (error) {
    logger.error(`Error creating relationship: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "İlişki oluşturulurken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/relationships
 * @desc İki varlık arasındaki ilişkiyi kaldırır
 * @access Private
 */
router.delete("/", async (req, res) => {
  try {
    const { fromType, fromId, toType, toId, relationshipType, options = {} } = req.body;

    if (!fromType || !fromId || !toType || !toId || !relationshipType) {
      return res.status(400).json({
        success: false,
        message: "fromType, fromId, toType, toId ve relationshipType gerekli"
      });
    }

    const result = await RelationshipService.removeRelationship(
      fromType,
      fromId,
      toType,
      toId,
      relationshipType,
      options
    );

    res.json(result);
  } catch (error) {
    logger.error(`Error removing relationship: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "İlişki kaldırılırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/relationships/check
 * @desc İki varlık arasında ilişki olup olmadığını kontrol eder
 * @access Private
 */
router.get("/check", async (req, res) => {
  try {
    const { fromType, fromId, toType, toId, relationshipType } = req.query;

    if (!fromType || !fromId || !toType || !toId || !relationshipType) {
      return res.status(400).json({
        success: false,
        message: "fromType, fromId, toType, toId ve relationshipType gerekli"
      });
    }

    const hasRelationship = await RelationshipService.hasRelationship(
      fromType,
      fromId,
      toType,
      toId,
      relationshipType
    );

    res.json({
      success: true,
      hasRelationship
    });
  } catch (error) {
    logger.error(`Error checking relationship: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "İlişki kontrol edilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/relationships/:entityType/:entityId/:relationshipType
 * @desc Belirli bir varlığın belirli türdeki ilişkilerini getirir
 * @access Private
 */
router.get("/:entityType/:entityId/:relationshipType", async (req, res) => {
  try {
    const { entityType, entityId, relationshipType } = req.params;
    const { populate, limit, skip } = req.query;

    const options = {};
    if (populate) options.populate = populate;
    if (limit) options.limit = parseInt(limit);
    if (skip) options.skip = parseInt(skip);

    const relationships = await RelationshipService.getRelationships(
      entityType,
      entityId,
      relationshipType,
      options
    );

    res.json({
      success: true,
      relationships
    });
  } catch (error) {
    logger.error(`Error getting relationships: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "İlişkiler getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/relationships/:entityType/:entityId
 * @desc Bir varlığın tüm ilişkilerini getirir
 * @access Private
 */
router.get("/:entityType/:entityId", async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { populate } = req.query;

    const options = {};
    if (populate) options.populate = populate;

    const relationships = await RelationshipService.getAllRelationships(
      entityType,
      entityId,
      options
    );

    res.json({
      success: true,
      relationships
    });
  } catch (error) {
    logger.error(`Error getting all relationships: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Tüm ilişkiler getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/relationships/:entityType/:entityId/stats
 * @desc Bir varlığın ilişki istatistiklerini getirir
 * @access Private
 */
router.get("/:entityType/:entityId/stats", async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const stats = await RelationshipService.getRelationshipStats(
      entityType,
      entityId
    );

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error(`Error getting relationship stats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "İlişki istatistikleri getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/relationships/bulk
 * @desc Toplu ilişki işlemleri yapar
 * @access Private
 */
router.post("/bulk", async (req, res) => {
  try {
    const { operations } = req.body;

    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "operations array gerekli"
      });
    }

    const results = await RelationshipService.bulkRelationshipOperations(operations);

    res.json({
      success: true,
      results
    });
  } catch (error) {
    logger.error(`Error in bulk relationship operations: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Toplu ilişki işlemleri sırasında hata oluştu",
      error: error.message
    });
  }
});

module.exports = router;
