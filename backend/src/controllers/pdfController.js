const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const puppeteer = require("puppeteer");

const templatePath = path.join(
  __dirname,
  "..",
  "templates",
  "proposal-template.ejs"
);

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

const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const USE_REDIS = process.env.USE_REDIS === "true";
let pdfQueue = null;
function getQueue() {
  if (!USE_REDIS) return null;
  if (pdfQueue) return pdfQueue;
  const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  const connection = new IORedis(REDIS_URL);
  pdfQueue = new Queue("pdf-generation", { connection });
  return pdfQueue;
}

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

    const queue = getQueue();
    if (!queue) {
      return res
        .status(202)
        .json({ message: "PDF kuyruğu devre dışı (Redis kapalı)." });
    }

    const job = await queue.add(
      "generate",
      { payload, proposalId: payload.proposalId },
      { removeOnComplete: true, removeOnFail: true }
    );
    return res
      .status(202)
      .json({ message: "Teklifiniz hazırlanıyor...", jobId: job.id });
  } catch (error) {
    console.error("PDF kuyruğa ekleme hatası:", error);
    return res.error("Sunucu hatası. PDF işleme alınamadı.", 500);
  }
}

module.exports = { generateProposalPdf };
