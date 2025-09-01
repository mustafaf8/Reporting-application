const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const pdfRoutes = require("./src/routes/pdfRoutes");
const authRoutes = require("./src/routes/authRoutes");
const productRoutes = require("./src/routes/productRoutes");
const proposalRoutes = require("./src/routes/proposalRoutes");
const userRoutes = require("./src/routes/userRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

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

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Global hata yönetimi middleware'i
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  // Mongoose validation hatası
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Veri doğrulama hatası",
      errors,
    });
  }

  // Mongoose duplicate key hatası
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} zaten kullanımda`,
    });
  }

  // JWT hatası
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Geçersiz token",
    });
  }

  // Varsayılan hata
  res.status(500).json({
    success: false,
    message: "Sunucu hatası",
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rmr_teklif";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Backend server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
