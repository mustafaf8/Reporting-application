const express = require("express");
const router = express.Router();
const DatabaseMigrationService = require("../services/databaseMigrationService");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const logger = require("../config/logger");

// Tüm route'lar için auth ve admin middleware
router.use(auth);
router.use(admin);

/**
 * @route POST /api/migration/migrate
 * @desc Veritabanını yeni ilişki yapısına göre günceller
 * @access Private (Admin only)
 */
router.post("/migrate", async (req, res) => {
  try {
    logger.info("Database migration requested by admin");
    
    const result = await DatabaseMigrationService.migrateToRelationshipStructure();
    
    res.json({
      success: true,
      message: "Database migration completed successfully",
      result
    });
  } catch (error) {
    logger.error(`Database migration failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Database migration failed",
      error: error.message
    });
  }
});

/**
 * @route POST /api/migration/rebuild-relationships
 * @desc Mevcut referanslara dayalı olarak ilişkileri yeniden oluşturur
 * @access Private (Admin only)
 */
router.post("/rebuild-relationships", async (req, res) => {
  try {
    logger.info("Relationship rebuild requested by admin");
    
    const result = await DatabaseMigrationService.rebuildRelationships();
    
    res.json({
      success: true,
      message: "Relationships rebuilt successfully",
      result
    });
  } catch (error) {
    logger.error(`Relationship rebuild failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Relationship rebuild failed",
      error: error.message
    });
  }
});

/**
 * @route GET /api/migration/status
 * @desc Veritabanı durumunu kontrol eder
 * @access Private (Admin only)
 */
router.get("/status", async (req, res) => {
  try {
    const status = await DatabaseMigrationService.checkDatabaseStatus();
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error(`Error checking database status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Database status check failed",
      error: error.message
    });
  }
});

/**
 * @route POST /api/migration/full-migration
 * @desc Tam migrasyon işlemi (migrate + rebuild)
 * @access Private (Admin only)
 */
router.post("/full-migration", async (req, res) => {
  try {
    logger.info("Full migration requested by admin");
    
    // Önce yapıyı güncelle
    await DatabaseMigrationService.migrateToRelationshipStructure();
    
    // Sonra ilişkileri yeniden oluştur
    await DatabaseMigrationService.rebuildRelationships();
    
    // Durumu kontrol et
    const status = await DatabaseMigrationService.checkDatabaseStatus();
    
    res.json({
      success: true,
      message: "Full migration completed successfully",
      status
    });
  } catch (error) {
    logger.error(`Full migration failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Full migration failed",
      error: error.message
    });
  }
});

module.exports = router;
