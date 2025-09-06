const express = require("express");
const router = express.Router();
const CollaborationService = require("../services/collaborationService");
const auth = require("../middleware/auth");
const logger = require("../config/logger");

// Tüm route'lar için auth middleware
router.use(auth);

/**
 * @route POST /api/collaboration/templates/:templateId/join
 * @desc Kullanıcıyı şablon işbirliği odasına ekler
 * @access Private
 */
router.post("/templates/:templateId/join", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { socketId } = req.body;
    const userId = req.user.id;

    if (!socketId) {
      return res.status(400).json({
        success: false,
        message: "socketId gerekli"
      });
    }

    const result = await CollaborationService.joinTemplateRoom(templateId, userId, socketId);
    
    res.json({
      success: true,
      message: "Template room'a katıldınız",
      result
    });
  } catch (error) {
    logger.error(`Error joining template room: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Template room'a katılırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/collaboration/templates/:templateId/leave
 * @desc Kullanıcıyı şablon işbirliği odasından çıkarır
 * @access Private
 */
router.post("/templates/:templateId/leave", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { socketId } = req.body;
    const userId = req.user.id;

    if (!socketId) {
      return res.status(400).json({
        success: false,
        message: "socketId gerekli"
      });
    }

    const result = await CollaborationService.leaveTemplateRoom(templateId, userId, socketId);
    
    res.json({
      success: true,
      message: "Template room'dan ayrıldınız",
      result
    });
  } catch (error) {
    logger.error(`Error leaving template room: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Template room'dan ayrılırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/collaboration/templates/:templateId/active-users
 * @desc Şablon odasındaki aktif kullanıcıları getirir
 * @access Private
 */
router.get("/templates/:templateId/active-users", async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;

    // Erişim kontrolü
    const hasAccess = await CollaborationService.checkTemplateAccess(userId, templateId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Bu şablona erişim izniniz yok"
      });
    }

    const activeUsers = await CollaborationService.getActiveUsers(templateId);
    
    res.json({
      success: true,
      activeUsers
    });
  } catch (error) {
    logger.error(`Error getting active users: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Aktif kullanıcılar getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/collaboration/templates/:templateId/broadcast-changes
 * @desc Şablon değişikliklerini gerçek zamanlı olarak yayınlar
 * @access Private
 */
router.post("/templates/:templateId/broadcast-changes", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { changes } = req.body;
    const userId = req.user.id;

    if (!changes) {
      return res.status(400).json({
        success: false,
        message: "changes gerekli"
      });
    }

    // Düzenleme izni kontrolü
    const canEdit = await CollaborationService.checkEditPermission(userId, templateId);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Bu şablonu düzenleme izniniz yok"
      });
    }

    const result = await CollaborationService.broadcastTemplateChanges(templateId, userId, changes);
    
    res.json({
      success: true,
      message: "Değişiklikler yayınlandı",
      result
    });
  } catch (error) {
    logger.error(`Error broadcasting template changes: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Değişiklikler yayınlanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/collaboration/templates/:templateId/blocks/:blockId/broadcast-changes
 * @desc Blok değişikliklerini gerçek zamanlı olarak yayınlar
 * @access Private
 */
router.post("/templates/:templateId/blocks/:blockId/broadcast-changes", async (req, res) => {
  try {
    const { templateId, blockId } = req.params;
    const { changes } = req.body;
    const userId = req.user.id;

    if (!changes) {
      return res.status(400).json({
        success: false,
        message: "changes gerekli"
      });
    }

    // Düzenleme izni kontrolü
    const canEdit = await CollaborationService.checkEditPermission(userId, templateId);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Bu şablonu düzenleme izniniz yok"
      });
    }

    const result = await CollaborationService.broadcastBlockChanges(templateId, userId, blockId, changes);
    
    res.json({
      success: true,
      message: "Blok değişiklikleri yayınlandı",
      result
    });
  } catch (error) {
    logger.error(`Error broadcasting block changes: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Blok değişiklikleri yayınlanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/collaboration/templates/:templateId/cursor-position
 * @desc Kullanıcı imleç pozisyonunu yayınlar
 * @access Private
 */
router.post("/templates/:templateId/cursor-position", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { cursorData } = req.body;
    const userId = req.user.id;

    if (!cursorData) {
      return res.status(400).json({
        success: false,
        message: "cursorData gerekli"
      });
    }

    // Erişim kontrolü
    const hasAccess = await CollaborationService.checkTemplateAccess(userId, templateId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Bu şablona erişim izniniz yok"
      });
    }

    const result = await CollaborationService.broadcastCursorPosition(templateId, userId, cursorData);
    
    res.json({
      success: true,
      message: "İmleç pozisyonu yayınlandı",
      result
    });
  } catch (error) {
    logger.error(`Error broadcasting cursor position: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "İmleç pozisyonu yayınlanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/collaboration/templates/:templateId/selection
 * @desc Kullanıcı seçim durumunu yayınlar
 * @access Private
 */
router.post("/templates/:templateId/selection", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { selectionData } = req.body;
    const userId = req.user.id;

    if (!selectionData) {
      return res.status(400).json({
        success: false,
        message: "selectionData gerekli"
      });
    }

    // Erişim kontrolü
    const hasAccess = await CollaborationService.checkTemplateAccess(userId, templateId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Bu şablona erişim izniniz yok"
      });
    }

    const result = await CollaborationService.broadcastSelection(templateId, userId, selectionData);
    
    res.json({
      success: true,
      message: "Seçim durumu yayınlandı",
      result
    });
  } catch (error) {
    logger.error(`Error broadcasting selection: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Seçim durumu yayınlanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/collaboration/templates/:templateId/blocks/:blockId/lock
 * @desc Blok kilitleme durumunu yönetir
 * @access Private
 */
router.post("/templates/:templateId/blocks/:blockId/lock", async (req, res) => {
  try {
    const { templateId, blockId } = req.params;
    const { locked } = req.body;
    const userId = req.user.id;

    if (typeof locked !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "locked boolean değer olmalı"
      });
    }

    // Düzenleme izni kontrolü
    const canEdit = await CollaborationService.checkEditPermission(userId, templateId);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Bu şablonu düzenleme izniniz yok"
      });
    }

    const result = await CollaborationService.manageBlockLock(templateId, userId, blockId, locked);
    
    res.json({
      success: true,
      message: `Blok ${locked ? 'kilitlendi' : 'kilidi açıldı'}`,
      result
    });
  } catch (error) {
    logger.error(`Error managing block lock: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Blok kilitleme durumu yönetilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/collaboration/templates/:templateId/history-update
 * @desc Şablon değişiklik geçmişini yayınlar
 * @access Private
 */
router.post("/templates/:templateId/history-update", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { historyData } = req.body;
    const userId = req.user.id;

    if (!historyData) {
      return res.status(400).json({
        success: false,
        message: "historyData gerekli"
      });
    }

    // Erişim kontrolü
    const hasAccess = await CollaborationService.checkTemplateAccess(userId, templateId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Bu şablona erişim izniniz yok"
      });
    }

    const result = await CollaborationService.broadcastHistoryUpdate(templateId, userId, historyData);
    
    res.json({
      success: true,
      message: "Geçmiş güncellemesi yayınlandı",
      result
    });
  } catch (error) {
    logger.error(`Error broadcasting history update: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Geçmiş güncellemesi yayınlanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/collaboration/templates/:templateId/access-check
 * @desc Kullanıcının şablona erişim iznini kontrol eder
 * @access Private
 */
router.get("/templates/:templateId/access-check", async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;

    const hasAccess = await CollaborationService.checkTemplateAccess(userId, templateId);
    const canEdit = await CollaborationService.checkEditPermission(userId, templateId);
    
    res.json({
      success: true,
      access: {
        canView: hasAccess,
        canEdit: canEdit
      }
    });
  } catch (error) {
    logger.error(`Error checking access: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erişim kontrolü yapılırken hata oluştu",
      error: error.message
    });
  }
});

module.exports = router;
