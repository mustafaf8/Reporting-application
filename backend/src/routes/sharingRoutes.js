const express = require("express");
const router = express.Router();
const SharingService = require("../services/sharingService");
const auth = require("../middleware/auth");
const logger = require("../config/logger");

// Tüm route'lar için auth middleware
router.use(auth);

/**
 * @route POST /api/sharing/templates/:templateId/share
 * @desc Şablonu başka kullanıcılarla paylaşır
 * @access Private
 */
router.post("/templates/:templateId/share", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { sharingData } = req.body;
    const userId = req.user.id;

    if (!sharingData || !Array.isArray(sharingData)) {
      return res.status(400).json({
        success: false,
        message: "sharingData array gerekli"
      });
    }

    const result = await SharingService.shareTemplate(templateId, userId, sharingData);
    
    res.json({
      success: true,
      message: "Template shared successfully",
      result
    });
  } catch (error) {
    logger.error(`Error sharing template: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Template paylaşılırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/sharing/templates/:templateId/unshare
 * @desc Şablon paylaşımını kaldırır
 * @access Private
 */
router.delete("/templates/:templateId/unshare", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { userIds } = req.body;
    const userId = req.user.id;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: "userIds array gerekli"
      });
    }

    const result = await SharingService.unshareTemplate(templateId, userId, userIds);
    
    res.json({
      success: true,
      message: "Template unshared successfully",
      result
    });
  } catch (error) {
    logger.error(`Error unsharing template: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Template paylaşımı kaldırılırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/sharing/templates/accessible
 * @desc Kullanıcının erişebileceği şablonları getirir
 * @access Private
 */
router.get("/templates/accessible", async (req, res) => {
  try {
    const userId = req.user.id;
    const { permission, includeOwned, includeShared } = req.query;

    const options = {
      permission: permission || undefined,
      includeOwned: includeOwned !== 'false',
      includeShared: includeShared !== 'false'
    };

    const templates = await SharingService.getAccessibleTemplates(userId, options);
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    logger.error(`Error getting accessible templates: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erişilebilir şablonlar getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/sharing/templates/:templateId/status
 * @desc Şablonun paylaşım durumunu getirir
 * @access Private
 */
router.get("/templates/:templateId/status", async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;

    const status = await SharingService.getTemplateSharingStatus(templateId, userId);
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error(`Error getting template sharing status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Şablon paylaşım durumu getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route PUT /api/sharing/templates/:templateId/public
 * @desc Şablonu genel erişime açar/kapatır
 * @access Private
 */
router.put("/templates/:templateId/public", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { isPublic } = req.body;
    const userId = req.user.id;

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "isPublic boolean değer olmalı"
      });
    }

    const result = await SharingService.setTemplatePublic(templateId, userId, isPublic);
    
    res.json({
      success: true,
      message: `Template ${isPublic ? 'public' : 'private'} olarak ayarlandı`,
      result
    });
  } catch (error) {
    logger.error(`Error setting template public: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Şablon görünürlük ayarı yapılırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/sharing/templates/:templateId/fork
 * @desc Şablonu fork eder (kopyalar)
 * @access Private
 */
router.post("/templates/:templateId/fork", async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;
    const options = req.body;

    const result = await SharingService.forkTemplate(templateId, userId, options);
    
    res.json({
      success: true,
      message: "Template forked successfully",
      forkedTemplate: result.forkedTemplate
    });
  } catch (error) {
    logger.error(`Error forking template: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Template fork edilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/sharing/templates/:templateId/invite
 * @desc İşbirliği davetiyesi gönderir
 * @access Private
 */
router.post("/templates/:templateId/invite", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { invitations } = req.body;
    const userId = req.user.id;

    if (!invitations || !Array.isArray(invitations)) {
      return res.status(400).json({
        success: false,
        message: "invitations array gerekli"
      });
    }

    const result = await SharingService.sendCollaborationInvitations(templateId, userId, invitations);
    
    res.json({
      success: true,
      message: "Collaboration invitations sent successfully",
      result
    });
  } catch (error) {
    logger.error(`Error sending collaboration invitations: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "İşbirliği davetiyesi gönderilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route POST /api/sharing/templates/:templateId/respond-invitation
 * @desc İşbirliği davetiyesini kabul eder/reddeder
 * @access Private
 */
router.post("/templates/:templateId/respond-invitation", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { accept } = req.body;
    const userId = req.user.id;

    if (typeof accept !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "accept boolean değer olmalı"
      });
    }

    const result = await SharingService.respondToCollaborationInvitation(templateId, userId, accept);
    
    res.json({
      success: true,
      message: `Collaboration invitation ${accept ? 'accepted' : 'rejected'}`,
      result
    });
  } catch (error) {
    logger.error(`Error responding to collaboration invitation: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "İşbirliği davetiyesi yanıtlanırken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/sharing/templates/:templateId/access-logs
 * @desc Şablon erişim loglarını getirir
 * @access Private
 */
router.get("/templates/:templateId/access-logs", async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;

    const accessLogs = await SharingService.getTemplateAccessLogs(templateId, userId);
    
    res.json({
      success: true,
      accessLogs
    });
  } catch (error) {
    logger.error(`Error getting template access logs: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Şablon erişim logları getirilirken hata oluştu",
      error: error.message
    });
  }
});

/**
 * @route GET /api/sharing/templates/:templateId/collaborators
 * @desc Şablon işbirlikçilerini getirir
 * @access Private
 */
router.get("/templates/:templateId/collaborators", async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;

    const status = await SharingService.getTemplateSharingStatus(templateId, userId);
    
    if (!status.canView) {
      return res.status(403).json({
        success: false,
        message: "Bu şablona erişim izniniz yok"
      });
    }

    const collaborators = status.sharingPermissions.map(permission => ({
      user: permission.user,
      permission: permission.permission,
      addedAt: permission.addedAt,
      expiresAt: permission.expiresAt,
      status: permission.status || 'active',
      message: permission.message
    }));
    
    res.json({
      success: true,
      collaborators
    });
  } catch (error) {
    logger.error(`Error getting template collaborators: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Şablon işbirlikçileri getirilirken hata oluştu",
      error: error.message
    });
  }
});

module.exports = router;
