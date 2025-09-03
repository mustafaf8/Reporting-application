const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const checkSubscription = require("../middleware/checkSubscription");

const { generateProposalPdf } = require("../controllers/pdfController");

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

module.exports = router;
