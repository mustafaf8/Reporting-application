module.exports = function checkSubscription(requiredPlans = ["pro"]) {
  return function (req, res, next) {
    try {
      const plan = req.user?.subscription?.plan || "free";
      const status = req.user?.subscription?.status || "inactive";
      if (!requiredPlans.includes(plan) || status !== "active") {
        return res
          .status(402)
          .json({ message: "Bu özellik için aktif abonelik gereklidir" });
      }
      return next();
    } catch (err) {
      return res.status(500).json({ message: "Abonelik kontrolü başarısız" });
    }
  };
};
