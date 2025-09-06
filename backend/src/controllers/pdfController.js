const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const puppeteer = require("puppeteer");

const Template = require("../models/Template");
const pdfGenerationService = require("../services/pdfGenerationService");
const logger = require("../config/logger");

function formatCurrencyTRY(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function readImageAsDataUrl(filename) {
  try {
    const imgPath = path.join(__dirname, "..", "templates", filename);
    const buffer = fs.readFileSync(imgPath);
    const ext = path.extname(filename).slice(1) || "png";
    return `data:image/${ext};base64,${buffer.toString("base64")}`;
  } catch (_) {
    return null;
  }
}

// Redis and BullMQ temporarily disabled
// const { Queue } = require("bullmq");
// const IORedis = require("ioredis");

// const USE_REDIS = process.env.USE_REDIS === "true";
// let pdfQueue = null;
// function getQueue() {
//   if (!USE_REDIS) return null;
//   if (pdfQueue) return pdfQueue;
//   const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
//   const connection = new IORedis(REDIS_URL);
//   pdfQueue = new Queue("pdf-generation", { connection });
//   return pdfQueue;
// }

async function generateProposalPdf(req, res) {
  try {
    const payload = req.body || {};
    if (
      !payload.customerName ||
      !Array.isArray(payload.items) ||
      payload.items.length === 0
    ) {
      return res.error(
        "Geçersiz veri. Müşteri adı ve en az bir malzeme gereklidir.",
        400
      );
    }

    // Dinamik şablon seçimi
    let resolvedEjsFile = "proposal-template.ejs";
    if (payload.templateId) {
      try {
        const tpl = await Template.findById(payload.templateId);
        if (tpl && tpl.ejsFile) {
          resolvedEjsFile = tpl.ejsFile;
        }
      } catch (_) {}
    }

    // Doğrudan PDF üretimi (frontend blob bekliyor)
    const subtotal = payload.items.reduce(
      (sum, it) => sum + Number(it.quantity) * Number(it.unitPrice),
      0
    );
    const discountAmount = subtotal * (Number(payload.discountRate || 0) / 100);
    const withExtras =
      subtotal - discountAmount + Number(payload.extraCosts || 0);
    const vatAmount = withExtras * (Number(payload.vatRate || 0) / 100);
    const grandTotal = Math.round((withExtras + vatAmount) * 100) / 100;

    const design = payload.customizations?.design || {};
    const brand = payload.customizations?.brand || {};

    const html = await ejs.renderFile(
      path.join(__dirname, "..", "templates", resolvedEjsFile),
      {
        customerName: payload.customerName,
        items: payload.items,
        createdAt: Date.now(),
        status: payload.status,
        subtotal,
        vatRate: Number(payload.vatRate || 0),
        vatAmount,
        discountRate: Number(payload.discountRate || 0),
        extraCosts: Number(payload.extraCosts || 0),
        grandTotal,
        company: {
          ...(payload.company || {}),
          // Editor brand.logoUrl öncelikli, sonra mevcut company.logoDataUrl/Url
          logoDataUrl:
            brand.logoUrl ||
            payload.company?.logoDataUrl ||
            payload.company?.logoUrl,
          logoUrl: brand.logoUrl || payload.company?.logoUrl,
        },
        design: {
          primaryColor: design.primaryColor || undefined,
          secondaryColor: design.secondaryColor || undefined,
          accentColor: design.accentColor || undefined,
        },
        customer: payload.customer,
        issuer: payload.issuer,
        aboutRmr: payload.aboutRmr,
        customizations: payload.customizations || {},
        formatCurrency: (v) => formatCurrencyTRY(v),
      },
      { async: true }
    );

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
      printBackground: true,
    });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="teklif-${Date.now()}.pdf"`
    );
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("PDF kuyruğa ekleme hatası:", error);
    return res.error("Sunucu hatası. PDF işleme alınamadı.", 500);
  }
}

// Blok editörü şablonundan PDF oluştur
async function generateFromBlockEditor(req, res) {
  try {
    const { templateId, data = {}, options = {} } = req.body;

    if (!templateId) {
      return res.error("Şablon ID'si gerekli", 400);
    }

    const result = await pdfGenerationService.generateFromBlockEditor(
      templateId,
      data,
      options
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.templateName}-${Date.now()}.pdf"`
    );
    return res.status(200).send(result.pdfBuffer);
  } catch (error) {
    logger.error("Error generating PDF from block editor", {
      error: error.message,
      templateId: req.body.templateId,
      userId: req.user?.id,
    });
    return res.error("PDF oluşturulurken hata oluştu", 500);
  }
}

// EJS şablonundan PDF oluştur (geriye uyumluluk)
async function generateFromEJSTemplate(req, res) {
  try {
    const { templateId, data = {}, options = {} } = req.body;

    if (!templateId) {
      return res.error("Şablon ID'si gerekli", 400);
    }

    const result = await pdfGenerationService.generateFromEJSTemplate(
      templateId,
      data,
      options
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.templateName}-${Date.now()}.pdf"`
    );
    return res.status(200).send(result.pdfBuffer);
  } catch (error) {
    logger.error("Error generating PDF from EJS template", {
      error: error.message,
      templateId: req.body.templateId,
      userId: req.user?.id,
    });
    return res.error("PDF oluşturulurken hata oluştu", 500);
  }
}

// Otomatik şablon türü tespiti ile PDF oluştur
async function generatePDF(req, res) {
  try {
    const { templateId, data = {}, options = {} } = req.body;

    if (!templateId) {
      return res.error("Şablon ID'si gerekli", 400);
    }

    const result = await pdfGenerationService.generatePDF(
      templateId,
      data,
      options
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.templateName}-${Date.now()}.pdf"`
    );
    return res.status(200).send(result.pdfBuffer);
  } catch (error) {
    logger.error("Error generating PDF", {
      error: error.message,
      templateId: req.body.templateId,
      userId: req.user?.id,
    });
    return res.error("PDF oluşturulurken hata oluştu", 500);
  }
}

// PDF önizleme oluştur
async function generatePreview(req, res) {
  try {
    const { templateId, data = {}, options = {} } = req.body;

    if (!templateId) {
      return res.error("Şablon ID'si gerekli", 400);
    }

    const result = await pdfGenerationService.generatePreview(
      templateId,
      data,
      options
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="preview-${result.templateName}-${Date.now()}.pdf"`
    );
    return res.status(200).send(result.previewBuffer);
  } catch (error) {
    logger.error("Error generating PDF preview", {
      error: error.message,
      templateId: req.body.templateId,
      userId: req.user?.id,
    });
    return res.error("PDF önizleme oluşturulurken hata oluştu", 500);
  }
}

// Toplu PDF oluşturma
async function generateMultiplePDFs(req, res) {
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.error("PDF istekleri gerekli", 400);
    }

    const result = await pdfGenerationService.generateMultiplePDFs(requests);

    res.success(result, "Toplu PDF oluşturma tamamlandı");
  } catch (error) {
    logger.error("Error generating multiple PDFs", {
      error: error.message,
      userId: req.user?.id,
    });
    return res.error("Toplu PDF oluşturulurken hata oluştu", 500);
  }
}

// Şablon türünü tespit et
async function detectTemplateType(req, res) {
  try {
    const { templateId } = req.params;

    if (!templateId) {
      return res.error("Şablon ID'si gerekli", 400);
    }

    const templateType = await pdfGenerationService.detectTemplateType(
      templateId
    );

    res.success(
      {
        templateId,
        templateType,
      },
      "Şablon türü tespit edildi"
    );
  } catch (error) {
    logger.error("Error detecting template type", {
      error: error.message,
      templateId: req.params.templateId,
      userId: req.user?.id,
    });
    return res.error("Şablon türü tespit edilirken hata oluştu", 500);
  }
}

module.exports = {
  generateProposalPdf,
  generateFromBlockEditor,
  generateFromEJSTemplate,
  generatePDF,
  generatePreview,
  generateMultiplePDFs,
  detectTemplateType,
};
