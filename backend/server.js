const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const logger = require("./src/config/logger");
const websocketService = require("./src/services/websocketService");
const cacheService = require("./src/services/cacheService");
const {
  xssProtection,
  sqlInjectionProtection,
  securityHeaders,
  securityLogging,
  securityScan,
} = require("./src/middleware/security");
const { specs, swaggerUi } = require("./src/config/swagger");

dotenv.config();

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rmr_teklif";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

const pdfRoutes = require("./src/routes/pdfRoutes");
const authRoutes = require("./src/routes/authRoutes");
const productRoutes = require("./src/routes/productRoutes");
const proposalRoutes = require("./src/routes/proposalRoutes");
const userRoutes = require("./src/routes/userRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const templateRoutes = require("./src/routes/templateRoutes");
const billingRoutes = require("./src/routes/billingRoutes");
const blockEditorRoutes = require("./src/routes/blockEditorRoutes");
const assetRoutes = require("./src/routes/assetRoutes");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
const blockManagementRoutes = require("./src/routes/blockManagementRoutes");
const userTemplateRoutes = require("./src/routes/userTemplateRoutes");
const auditLogRoutes = require("./src/routes/auditLogRoutes");
const relationshipRoutes = require("./src/routes/relationshipRoutes");
const migrationRoutes = require("./src/routes/migrationRoutes");
const sharingRoutes = require("./src/routes/sharingRoutes");
const collaborationRoutes = require("./src/routes/collaborationRoutes");
const dynamicDataRoutes = require("./src/routes/dynamicDataRoutes");
const securityRoutes = require("./src/routes/securityRoutes");
const performanceRoutes = require("./src/routes/performanceRoutes");

const app = express();

// Middlewares
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
// Stripe webhook için raw body gerekir; route özelinde ele alındı.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("combined", { stream: logger.stream }));

// Güvenlik middleware'leri
app.use(securityHeaders);
app.use(securityLogging);
app.use(securityScan);
app.use(xssProtection);
app.use(sqlInjectionProtection);

// Static dosya servisi - uploads klasörü için
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Şablon önizlemeleri için templates klasörünü servis et
app.use(
  "/static/templates",
  express.static(path.join(__dirname, "src", "templates"))
);

// Response mesajları için middleware
app.use((req, res, next) => {
  // Başarılı işlemler için response mesajı ekle
  res.success = (data, message = "İşlem başarılı") => {
    res.json({
      success: true,
      message,
      data,
    });
  };

  // Hata durumları için response mesajı ekle
  res.error = (message = "Bir hata oluştu", statusCode = 400) => {
    res.status(statusCode).json({
      success: false,
      message,
    });
  };

  next();
});

// Routes
app.use("/api", pdfRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/block-editor", blockEditorRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/block-management", blockManagementRoutes);
app.use("/api/user-templates", userTemplateRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/relationships", relationshipRoutes);
app.use("/api/migration", migrationRoutes);
app.use("/api/sharing", sharingRoutes);
app.use("/api/collaboration", collaborationRoutes);
app.use("/api/dynamic-data", dynamicDataRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/performance", performanceRoutes);

// Swagger API Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Reporting App API Documentation",
  })
);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Global hata yönetimi middleware'i
app.use((err, req, res, next) => {
  // Hata loglama
  logger.error("Global error handler:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Mongoose validation hatası
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    logger.warn("Validation error:", { errors, url: req.url });
    return res.status(400).json({
      success: false,
      message: "Veri doğrulama hatası",
      errors,
    });
  }

  // Mongoose duplicate key hatası
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    logger.warn("Duplicate key error:", { field, value: err.keyValue[field] });
    return res.status(400).json({
      success: false,
      message: `${field} zaten kullanımda`,
    });
  }

  // JWT hatası
  if (err.name === "JsonWebTokenError") {
    logger.security("Invalid JWT token attempt", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    return res.status(401).json({
      success: false,
      message: "Geçersiz token",
    });
  }

  // JWT token expired hatası
  if (err.name === "TokenExpiredError") {
    logger.security("Expired JWT token attempt", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    return res.status(401).json({
      success: false,
      message: "Token süresi dolmuş",
    });
  }

  // Cast error (ObjectId geçersiz)
  if (err.name === "CastError") {
    logger.warn("Invalid ObjectId format:", { value: err.value, url: req.url });
    return res.status(400).json({
      success: false,
      message: "Geçersiz ID formatı",
    });
  }

  // Varsayılan hata
  res.status(500).json({
    success: false,
    message: "Sunucu hatası",
  });
});

// Ortam değişkenlerini kontrol et
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.error("JWT_SECRET ortam değişkeni production ortamında zorunludur!");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    logger.info("MongoDB connected successfully", {
      uri: MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
    });

    // Cache servisini başlat (Redis temporarily disabled)
    await cacheService.initialize();

    const server = app.listen(PORT, () => {
      logger.info(`Backend server listening on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || "development",
        corsOrigin: CORS_ORIGIN,
      });
    });

    // WebSocket servisini başlat
    websocketService.initialize(server);
  })
  .catch((err) => {
    logger.error("MongoDB connection error:", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });
