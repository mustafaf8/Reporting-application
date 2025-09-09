const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const authorizationService = require("../services/authorizationService");
const logger = require("../config/logger");

// Kullanıcının abonelik bilgilerini getirme
router.get("/info", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.error("Kullanıcı bulunamadı", 404);
    }

    const subscriptionInfo = user.getSubscriptionInfo();
    const permissions = await authorizationService.getUserPermissions(req.user.id);

    res.success({
      subscription: subscriptionInfo,
      permissions: permissions
    }, "Abonelik bilgileri başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting subscription info", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Abonelik bilgileri getirilirken hata oluştu", 500);
  }
});

// Abonelik planını güncelleme
router.put("/plan", auth, async (req, res) => {
  try {
    const { plan, status = "active", options = {} } = req.body;

    if (!["free", "basic", "pro", "enterprise"].includes(plan)) {
      return res.error("Geçersiz abonelik planı", 400);
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.error("Kullanıcı bulunamadı", 404);
    }

    // Abonelik planını güncelle
    user.updateSubscription(plan, status, options);
    await user.save();

    logger.info("User subscription updated", {
      userId: req.user.id,
      plan,
      status,
      options
    });

    res.success({
      subscription: user.getSubscriptionInfo()
    }, "Abonelik planı başarıyla güncellendi");
  } catch (error) {
    logger.error("Error updating subscription plan", {
      error: error.message,
      userId: req.user.id,
      plan: req.body.plan
    });
    res.error("Abonelik planı güncellenirken hata oluştu", 500);
  }
});

// Abonelik iptal etme
router.post("/cancel", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.error("Kullanıcı bulunamadı", 404);
    }

    user.cancelSubscription();
    await user.save();

    logger.info("User subscription cancelled", {
      userId: req.user.id,
      plan: user.subscription.plan
    });

    res.success({
      subscription: user.getSubscriptionInfo()
    }, "Abonelik başarıyla iptal edildi");
  } catch (error) {
    logger.error("Error cancelling subscription", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Abonelik iptal edilirken hata oluştu", 500);
  }
});

// Abonelik yenileme
router.post("/renew", auth, async (req, res) => {
  try {
    const { newPeriodEnd } = req.body;

    if (!newPeriodEnd) {
      return res.error("Yeni dönem bitiş tarihi gerekli", 400);
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.error("Kullanıcı bulunamadı", 404);
    }

    user.renewSubscription(new Date(newPeriodEnd));
    await user.save();

    logger.info("User subscription renewed", {
      userId: req.user.id,
      newPeriodEnd
    });

    res.success({
      subscription: user.getSubscriptionInfo()
    }, "Abonelik başarıyla yenilendi");
  } catch (error) {
    logger.error("Error renewing subscription", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Abonelik yenilenirken hata oluştu", 500);
  }
});

// Kullanım istatistiklerini getirme
router.get("/usage", auth, async (req, res) => {
  try {
    const permissions = await authorizationService.getUserPermissions(req.user.id);

    res.success({
      usage: permissions.usage,
      limits: permissions.limits,
      features: permissions.features,
      subscription: permissions.subscription
    }, "Kullanım istatistikleri başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting usage stats", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Kullanım istatistikleri getirilirken hata oluştu", 500);
  }
});

// Özellik kullanım limitini kontrol etme
router.get("/check-limit/:feature", auth, async (req, res) => {
  try {
    const { feature } = req.params;
    const check = await authorizationService.checkSubscriptionLimits(req.user.id, feature);

    res.success(check, "Limit kontrolü tamamlandı");
  } catch (error) {
    logger.error("Error checking feature limit", {
      error: error.message,
      userId: req.user.id,
      feature: req.params.feature
    });
    res.error("Limit kontrolü yapılırken hata oluştu", 500);
  }
});

// Mevcut abonelik planları
router.get("/plans", auth, async (req, res) => {
  try {
    const plans = {
      free: {
        name: "Ücretsiz",
        price: 0,
        currency: "USD",
        features: ["view", "create", "edit", "delete"],
        limits: {
          templates: 5,
          blocks: 50,
          assets: 10,
          collaborators: 0,
          versionHistory: 10,
          exports: 5
        }
      },
      basic: {
        name: "Temel",
        price: 9.99,
        currency: "USD",
        features: ["view", "create", "edit", "delete", "share", "collaborate"],
        limits: {
          templates: 25,
          blocks: 200,
          assets: 50,
          collaborators: 3,
          versionHistory: 50,
          exports: 25
        }
      },
      pro: {
        name: "Profesyonel",
        price: 29.99,
        currency: "USD",
        features: ["view", "create", "edit", "delete", "share", "collaborate", "advanced"],
        limits: {
          templates: 100,
          blocks: 1000,
          assets: 200,
          collaborators: 10,
          versionHistory: 100,
          exports: 100
        }
      },
      enterprise: {
        name: "Kurumsal",
        price: 99.99,
        currency: "USD",
        features: ["view", "create", "edit", "delete", "share", "collaborate", "advanced", "admin"],
        limits: {
          templates: -1, // Unlimited
          blocks: -1,
          assets: -1,
          collaborators: -1,
          versionHistory: -1,
          exports: -1
        }
      }
    };

    res.success(plans, "Abonelik planları başarıyla getirildi");
  } catch (error) {
    logger.error("Error getting subscription plans", {
      error: error.message,
      userId: req.user.id
    });
    res.error("Abonelik planları getirilirken hata oluştu", 500);
  }
});

// Deneme süresi başlatma
router.post("/start-trial", auth, async (req, res) => {
  try {
    const { plan = "pro", trialDays = 14 } = req.body;

    if (!["basic", "pro", "enterprise"].includes(plan)) {
      return res.error("Deneme süresi için geçersiz plan", 400);
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.error("Kullanıcı bulunamadı", 404);
    }

    // Zaten deneme süresinde mi kontrol et
    if (user.isInTrial()) {
      return res.error("Zaten deneme süresindesiniz", 400);
    }

    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + trialDays * 24 * 60 * 60 * 1000);

    user.updateSubscription(plan, "trialing", {
      trialStart,
      trialEnd
    });
    await user.save();

    logger.info("User trial started", {
      userId: req.user.id,
      plan,
      trialDays,
      trialEnd
    });

    res.success({
      subscription: user.getSubscriptionInfo()
    }, "Deneme süresi başarıyla başlatıldı");
  } catch (error) {
    logger.error("Error starting trial", {
      error: error.message,
      userId: req.user.id,
      plan: req.body.plan
    });
    res.error("Deneme süresi başlatılırken hata oluştu", 500);
  }
});

module.exports = router;
