const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const checkSubscription = require("../middleware/checkSubscription");

const { 
  generateProposalPdf,
  generateFromBlockEditor,
  generateFromEJSTemplate,
  generatePDF,
  generatePreview,
  generateMultiplePDFs,
  detectTemplateType
} = require("../controllers/pdfController");

// Standart PDF (tüm kullanıcılar)
router.post("/generate-pdf", auth, generateProposalPdf);

// Yüksek çözünürlüklü PDF (yalnızca PRO)
router.post(
  "/generate-pdf-hq",
  auth,
  checkSubscription(["pro"]),
  async (req, res) => {
    const payload = req.body || {};
    payload.highQuality = true;
    req.body = payload;
    return generateProposalPdf(req, res);
  }
);

// Blok editörü şablonundan PDF oluştur
router.post("/generate-from-block-editor", auth, generateFromBlockEditor);

// EJS şablonundan PDF oluştur (geriye uyumluluk)
router.post("/generate-from-ejs", auth, generateFromEJSTemplate);

// Otomatik şablon türü tespiti ile PDF oluştur
router.post("/generate", auth, generatePDF);

// PDF önizleme oluştur
router.post("/preview", auth, generatePreview);

// Toplu PDF oluşturma
router.post("/generate-multiple", auth, checkSubscription(["pro"]), generateMultiplePDFs);

// Şablon türünü tespit et
router.get("/template-type/:templateId", auth, detectTemplateType);

module.exports = router;
