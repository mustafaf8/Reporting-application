const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Yetkilendirme gerekli",
    });
  }

  try {
    // JWT_SECRET kontrolü
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret && process.env.NODE_ENV === "production") {
      console.error("JWT_SECRET ortam değişkeni tanımlanmamış!");
      return res.status(500).json({
        success: false,
        message: "Sunucu yapılandırma hatası",
      });
    }

    const decoded = jwt.verify(token, jwtSecret || "dev_secret");
    req.user = decoded; // { id, email, role }
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token süresi dolmuş",
      });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Geçersiz token",
      });
    }

    console.error("Auth middleware error:", err);
    return res.status(401).json({
      success: false,
      message: "Yetkilendirme hatası",
    });
  }
};
